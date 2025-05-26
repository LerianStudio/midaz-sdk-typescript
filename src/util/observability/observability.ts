/** Configuration options for observability */
export interface ObservabilityOptions {
  /** Enable distributed tracing with spans and propagated context @default false */
  enableTracing?: boolean;

  /** Enable metrics collection and reporting @default false */
  enableMetrics?: boolean;

  /** Enable structured logging with trace context @default false */
  enableLogging?: boolean;

  /** Service name to identify in traces, metrics, and logs @default "midaz-typescript-sdk" */
  serviceName?: string;

  /** OpenTelemetry collector endpoint URL */
  collectorEndpoint?: string;

  /** Enable/disable console output for telemetry data @default true */
  consoleExporter?: boolean;
}

// Import ConfigService
import { ConfigService } from '../config';

/**
 * Default observability options
 * @internal
 */
function getDefaultObservabilityOptions(): ObservabilityOptions {
  const configService = ConfigService.getInstance();
  const observabilityConfig = configService.getObservabilityConfig();

  return {
    enableTracing: observabilityConfig.enableTracing,
    enableMetrics: observabilityConfig.enableMetrics,
    enableLogging: observabilityConfig.enableLogging,
    serviceName: observabilityConfig.serviceName,
    collectorEndpoint: observabilityConfig.collectorEndpoint,
    consoleExporter: true, // By default, enable console export of telemetry
  };
}

/** A span representing a unit of work in a distributed trace */
export interface Span {
  /** Sets a span attribute for filtering and grouping */
  setAttribute(key: string, value: string | number | boolean): void;

  /** Records an exception event to track errors */
  recordException(error: unknown): void;

  /** Sets the span status (ok or error) */
  setStatus(status: 'ok' | 'error', message?: string): void;

  /** Ends the span and records the duration */
  end(): void;
}

/**
 * No-op span that does nothing
 * Used when tracing is disabled to avoid null checks
 * @internal
 */
class NoopSpan implements Span {
  setAttribute(): void {
    /* empty setAttribute */
  }
  recordException(_error: unknown): void {
    /* empty recordException */
  }
  setStatus(): void {
    /* empty setStatus */
  }
  end(): void {
    /* empty end */
  }
}

// Import the OpenTelemetry provider

import { OpenTelemetryProvider } from './observability-otel';

/** Type for metric and log attribute values (primitives only) */
export type AttributeValue = string | number | boolean;

/**
 * Provides observability capabilities using OpenTelemetry
 *
 * @example
 * ```typescript
 * // Create an observability provider with custom options
 * const observability = new Observability({
 *   enableTracing: true,
 *   serviceName: 'my-service'
 * });
 *
 * // Start a span for an operation
 * const span = observability.startSpan('fetch-account');
 * span.setAttribute('accountId', 'acc-123');
 *
 * try {
 *   const result = await fetchAccount('acc-123');
 *   span.setStatus('ok');
 *   return result;
 * } catch (error) {
 *   span.recordException(error);
 *   span.setStatus('error', error.message);
 *   throw error;
 * } finally {
 *   span.end();
 * }
 * ```
 */
export class Observability {
  /** Configured observability options */
  public readonly options!: ObservabilityOptions;

  /** OpenTelemetry provider instance (if enabled) @protected */
  protected readonly otelProvider?: OpenTelemetryProvider;

  /** Creates a new observability provider with the specified options */
  constructor(options?: Partial<ObservabilityOptions>) {
    // If a global instance already exists, reuse it to avoid duplicating providers
    if (Observability.instance) {
      // Ignore any new options and just return existing instance
      return Observability.instance;
    }

    // Get default options from ConfigService and override with provided options
    const defaultOptions = getDefaultObservabilityOptions();

    this.options = {
      ...defaultOptions,
      ...options,
    };

    // Initialize OpenTelemetry if enabled
    if (this.isEnabled()) {
      this.otelProvider = this.createOtelProvider(this.options);
    }

    // Register this as the global instance
    Observability.instance = this;
  }

  /** Determines if any observability features are enabled @protected */
  protected isEnabled(): boolean {
    return (
      !!this.options.enableTracing || !!this.options.enableMetrics || !!this.options.enableLogging
    );
  }

  /** Creates an OpenTelemetry provider @protected */
  protected createOtelProvider(options: ObservabilityOptions): OpenTelemetryProvider {
    return new OpenTelemetryProvider(options);
  }

  /**
   * Starts a new span for an operation
   *
   */
  startSpan(name: string, initialAttributes: Record<string, AttributeValue> = {}): Span {
    if (!this.options.enableTracing || !this.otelProvider) {
      return this.createNoopSpan();
    }

    return this.otelProvider.startSpan(name, initialAttributes);
  }

  /** Records a metric with the specified name, value, and attributes */
  recordMetric(name: string, value: number, attributes: Record<string, AttributeValue> = {}): void {
    if (this.options.enableMetrics && this.otelProvider) {
      this.otelProvider.recordMetric(name, value, attributes);
    }
  }

  /** Logs a message with the specified level, message, and attributes */
  log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    attributes: Record<string, AttributeValue> = {}
  ): void {
    if (this.options.enableLogging) {
      if (this.otelProvider) {
        this.otelProvider.log(level, message, attributes);
      } else {
        // Fallback to console logging if OpenTelemetry is not available
        const logFn = console[level] || console.log;
        logFn(`[${level.toUpperCase()}] ${message}`, attributes);
      }
    }
  }

  /** Shuts down the observability provider and flushes telemetry data */
  async shutdown(): Promise<void> {
    if (this.otelProvider) {
      await this.otelProvider.shutdown();
    }
  }

  /** Creates a no-op span that does nothing @protected */
  protected createNoopSpan(): Span {
    return new NoopSpan();
  }

  // Static instance for global use
  private static instance?: Observability;

  /** Configures the global observability instance */
  static configure(options?: Partial<ObservabilityOptions>): Observability {
    Observability.instance = new Observability(options);
    return Observability.instance;
  }

  /** Gets the global observability instance */
  static getInstance(): Observability {
    if (!Observability.instance) {
      Observability.instance = new Observability();
    }
    return Observability.instance;
  }

  /** Starts a new span using the global instance */
  static startSpan(name: string, attributes: Record<string, AttributeValue> = {}): Span {
    return Observability.getInstance().startSpan(name, attributes);
  }

  /** Records a metric using the global instance */
  static recordMetric(
    name: string,
    value: number,
    attributes: Record<string, AttributeValue> = {}
  ): void {
    Observability.getInstance().recordMetric(name, value, attributes);
  }

  /** Logs a message using the global instance */
  static log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    attributes: Record<string, AttributeValue> = {}
  ): void {
    Observability.getInstance().log(level, message, attributes);
  }

  /** Destroys the global instance and cleans up resources */
  static destroy(): void {
    if (Observability.instance) {
      // Flush any pending telemetry data
      // Provider cleanup would go here if we had one
      // For now, just cleanup the instance
      Observability.instance = undefined;
    }
  }
}
