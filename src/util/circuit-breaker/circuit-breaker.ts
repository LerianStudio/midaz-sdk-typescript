/**
 * Circuit Breaker implementation for fault tolerance
 */

import { MetricsCollector } from '../monitoring/metrics';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  /**
   * Number of failures before opening the circuit
   * @default 5
   */
  failureThreshold?: number;

  /**
   * Success threshold to close the circuit from half-open state
   * @default 2
   */
  successThreshold?: number;

  /**
   * Timeout in milliseconds before attempting to close the circuit
   * @default 60000 (1 minute)
   */
  timeout?: number;

  /**
   * Time window in milliseconds for counting failures
   * @default 60000 (1 minute)
   */
  rollingWindow?: number;

  /**
   * Function to determine if an error should count as a failure
   */
  isFailure?: (error: Error) => boolean;

  /**
   * Callback when circuit opens
   */
  onOpen?: (key: string) => void;

  /**
   * Callback when circuit closes
   */
  onClose?: (key: string) => void;

  /**
   * Callback when circuit enters half-open state
   */
  onHalfOpen?: (key: string) => void;
}

interface CircuitStats {
  failures: number[];
  successes: number;
  lastFailureTime: number;
  state: CircuitState;
  stateChangedAt: number;
}

/**
 * Circuit breaker implementation with per-endpoint configuration
 */
export class CircuitBreaker {
  private circuits: Map<string, CircuitStats> = new Map();
  private options: Required<CircuitBreakerOptions>;
  private cleanupInterval?: ReturnType<typeof setInterval>;
  private metrics: MetricsCollector;

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      successThreshold: options.successThreshold || 2,
      timeout: options.timeout || 60000,
      rollingWindow: options.rollingWindow || 60000,
      isFailure: options.isFailure || (() => true),
      onOpen: options.onOpen || (() => {}),
      onClose: options.onClose || (() => {}),
      onHalfOpen: options.onHalfOpen || (() => {}),
    };

    // Initialize metrics
    this.metrics = MetricsCollector.getInstance();

    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Executes a function with circuit breaker protection
   */
  async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const circuit = this.getOrCreateCircuit(key);

    // Check circuit state
    if (circuit.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset(circuit)) {
        this.transitionToHalfOpen(key, circuit);
      } else {
        throw new Error(`Circuit breaker is OPEN for ${key}`);
      }
    }

    try {
      const result = await fn();
      this.recordSuccess(key, circuit);
      return result;
    } catch (error) {
      this.recordFailure(key, circuit, error as Error);
      throw error;
    }
  }

  /**
   * Gets the current state of a circuit
   */
  getState(key: string): CircuitState {
    const circuit = this.circuits.get(key);
    return circuit?.state || CircuitState.CLOSED;
  }

  /**
   * Gets statistics for a circuit
   */
  getStats(key: string): {
    state: CircuitState;
    failures: number;
    successes: number;
    lastFailureTime?: number;
  } {
    const circuit = this.circuits.get(key);
    if (!circuit) {
      return {
        state: CircuitState.CLOSED,
        failures: 0,
        successes: 0,
      };
    }

    const recentFailures = this.getRecentFailures(circuit);
    return {
      state: circuit.state,
      failures: recentFailures.length,
      successes: circuit.successes,
      lastFailureTime: circuit.lastFailureTime || undefined,
    };
  }

  /**
   * Manually opens a circuit
   */
  open(key: string): void {
    const circuit = this.getOrCreateCircuit(key);
    this.transitionToOpen(key, circuit);
  }

  /**
   * Manually closes a circuit
   */
  close(key: string): void {
    const circuit = this.getOrCreateCircuit(key);
    this.transitionToClosed(key, circuit);
  }

  /**
   * Resets a circuit
   */
  reset(key: string): void {
    this.circuits.delete(key);
  }

  /**
   * Resets all circuits
   */
  resetAll(): void {
    this.circuits.clear();
  }

  /**
   * Gets or creates a circuit
   */
  private getOrCreateCircuit(key: string): CircuitStats {
    let circuit = this.circuits.get(key);
    if (!circuit) {
      circuit = {
        failures: [],
        successes: 0,
        lastFailureTime: 0,
        state: CircuitState.CLOSED,
        stateChangedAt: Date.now(),
      };
      this.circuits.set(key, circuit);
    }
    return circuit;
  }

  /**
   * Records a successful execution
   */
  private recordSuccess(key: string, circuit: CircuitStats): void {
    this.metrics.recordCircuitBreakerEvent(key, 'success');

    if (circuit.state === CircuitState.HALF_OPEN) {
      circuit.successes++;
      if (circuit.successes >= this.options.successThreshold) {
        this.transitionToClosed(key, circuit);
      }
    }
  }

  /**
   * Records a failed execution
   */
  private recordFailure(key: string, circuit: CircuitStats, error: Error): void {
    if (!this.options.isFailure(error)) {
      return;
    }

    this.metrics.recordCircuitBreakerEvent(key, 'failure');

    const now = Date.now();
    circuit.failures.push(now);
    circuit.lastFailureTime = now;

    if (circuit.state === CircuitState.HALF_OPEN) {
      this.transitionToOpen(key, circuit);
    } else if (circuit.state === CircuitState.CLOSED) {
      const recentFailures = this.getRecentFailures(circuit);
      if (recentFailures.length >= this.options.failureThreshold) {
        this.transitionToOpen(key, circuit);
      }
    }
  }

  /**
   * Gets recent failures within the rolling window
   */
  private getRecentFailures(circuit: CircuitStats): number[] {
    const cutoff = Date.now() - this.options.rollingWindow;
    return circuit.failures.filter((time) => time > cutoff);
  }

  /**
   * Checks if circuit should attempt reset
   */
  private shouldAttemptReset(circuit: CircuitStats): boolean {
    return Date.now() - circuit.stateChangedAt >= this.options.timeout;
  }

  /**
   * Transitions circuit to OPEN state
   */
  private transitionToOpen(key: string, circuit: CircuitStats): void {
    circuit.state = CircuitState.OPEN;
    circuit.stateChangedAt = Date.now();
    circuit.successes = 0;
    this.metrics.recordCircuitBreakerEvent(key, 'open');
    this.options.onOpen(key);
  }

  /**
   * Transitions circuit to CLOSED state
   */
  private transitionToClosed(key: string, circuit: CircuitStats): void {
    circuit.state = CircuitState.CLOSED;
    circuit.stateChangedAt = Date.now();
    circuit.failures = [];
    circuit.successes = 0;
    this.metrics.recordCircuitBreakerEvent(key, 'close');
    this.options.onClose(key);
  }

  /**
   * Transitions circuit to HALF_OPEN state
   */
  private transitionToHalfOpen(key: string, circuit: CircuitStats): void {
    circuit.state = CircuitState.HALF_OPEN;
    circuit.stateChangedAt = Date.now();
    circuit.successes = 0;
    this.metrics.recordCircuitBreakerEvent(key, 'half_open');
    this.options.onHalfOpen(key);
  }

  /**
   * Starts periodic cleanup
   */
  private startCleanup(): void {
    // Clean up old circuits every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 300000);
  }

  /**
   * Cleans up old circuits
   */
  private cleanup(): void {
    const cutoff = Date.now() - this.options.rollingWindow * 2;
    const keysToDelete: string[] = [];

    for (const [key, circuit] of this.circuits.entries()) {
      // Remove closed circuits with no recent activity
      if (
        circuit.state === CircuitState.CLOSED &&
        circuit.lastFailureTime < cutoff &&
        circuit.failures.length === 0
      ) {
        keysToDelete.push(key);
      } else {
        // Clean up old failures
        circuit.failures = this.getRecentFailures(circuit);
      }
    }

    for (const key of keysToDelete) {
      this.circuits.delete(key);
    }
  }

  /**
   * Destroys the circuit breaker
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval as any);
      this.cleanupInterval = undefined;
    }
    this.circuits.clear();
  }
}

/**
 * Circuit breaker manager for per-endpoint configuration
 */
export class CircuitBreakerManager {
  private defaultOptions: CircuitBreakerOptions;
  private endpointOptions: Map<string, CircuitBreakerOptions> = new Map();
  private circuitBreaker: CircuitBreaker;

  constructor(defaultOptions: CircuitBreakerOptions = {}) {
    this.defaultOptions = defaultOptions;
    this.circuitBreaker = new CircuitBreaker(defaultOptions);
  }

  /**
   * Configures circuit breaker for a specific endpoint
   */
  configureEndpoint(endpoint: string, options: CircuitBreakerOptions): void {
    this.endpointOptions.set(endpoint, { ...this.defaultOptions, ...options });
  }

  /**
   * Executes a function with circuit breaker protection
   */
  async execute<T>(endpoint: string, fn: () => Promise<T>): Promise<T> {
    // For now, use the single circuit breaker instance
    // In a more complex implementation, we could create separate instances per endpoint
    return this.circuitBreaker.execute(endpoint, fn);
  }

  /**
   * Gets circuit state for an endpoint
   */
  getState(endpoint: string): CircuitState {
    return this.circuitBreaker.getState(endpoint);
  }

  /**
   * Gets statistics for an endpoint
   */
  getStats(endpoint: string) {
    return this.circuitBreaker.getStats(endpoint);
  }

  /**
   * Resets circuit for an endpoint
   */
  reset(endpoint: string): void {
    this.circuitBreaker.reset(endpoint);
  }

  /**
   * Resets all circuits
   */
  resetAll(): void {
    this.circuitBreaker.resetAll();
  }

  /**
   * Destroys the circuit breaker manager
   */
  destroy(): void {
    this.circuitBreaker.destroy();
  }
}
