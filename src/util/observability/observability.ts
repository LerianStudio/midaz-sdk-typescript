/* eslint-disable @typescript-eslint/no-empty-function */
/**
 * @file Observability utilities for the Midaz SDK
 * @description Provides tracing, metrics, and logging capabilities for monitoring and debugging
 */

/**
 * Configuration options for observability
 */
export interface ObservabilityOptions {
  /**
   * Enable distributed tracing
   * When enabled, operations will be traced with spans and propagated context
   * @default false
   */
  enableTracing?: boolean;

  /**
   * Enable metrics collection
   * When enabled, metrics will be collected and reported
   * @default false
   */
  enableMetrics?: boolean;

  /**
   * Enable structured logging
   * When enabled, logs will be structured and include trace context
   * @default false
   */
  enableLogging?: boolean;

  /**
   * Service name for observability
   * Used to identify the service in traces, metrics, and logs
   * @default "midaz-typescript-sdk"
   */
  serviceName?: string;

  /**
   * OpenTelemetry collector endpoint
   * URL of the OpenTelemetry collector to send telemetry data to
   */
  collectorEndpoint?: string;
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
  };
}

/**
 * Represents a span in a trace
 *
 * A span represents a unit of work or operation in a distributed trace.
 * It can have attributes, events, and status to provide context about the operation.
 */
export interface Span {
  /**
   * Sets a span attribute
   *
   * Attributes provide additional context about the operation.
   * They are key-value pairs that can be used for filtering and grouping spans.
   *
   * @param key - Attribute key
   * @param value - Attribute value (string, number, or boolean)
   */
  setAttribute(key: string, value: string | number | boolean): void;

  /**
   * Records an exception
   *
   * This adds an exception event to the span, which can be used to track errors.
   *
   * @param error - Error to record
   */
  recordException(error: unknown): void;

  /**
   * Sets the span status
   *
   * The status indicates whether the operation was successful or not.
   *
   * @param status - Status code ("ok" or "error")
   * @param message - Optional status message
   */
  setStatus(status: 'ok' | 'error', message?: string): void;

  /**
   * Ends the span
   *
   * This marks the end of the operation and records the duration.
   * After ending a span, no more attributes or events can be added.
   */
  end(): void;
}

/**
 * No-op span that does nothing
 * Used when tracing is disabled to avoid null checks
 * @internal
 */
class NoopSpan implements Span {
  setAttribute(): void {}
  recordException(_error: unknown): void {}
  setStatus(): void {}
  end(): void {}
}

// Import the OpenTelemetry provider

import { OpenTelemetryProvider } from './observability-otel';

/**
 * Type for metric and log attribute values
 * Restricts attributes to primitives for better type safety
 */
export type AttributeValue = string | number | boolean;

/**
 * Provides observability capabilities for the SDK
 *
 * This class manages tracing, metrics, and logging for the SDK.
 * It uses OpenTelemetry as the underlying implementation when enabled.
 *
 * @example
 * ```typescript
 * // Create an observability provider with custom options
 * const observability = new Observability({
 *   enableTracing: true,
 *   enableMetrics: true,
 *   enableLogging: true,
 *   serviceName: 'my-service',
 *   collectorEndpoint: 'http://localhost:4318'
 * });
 *
 * // Start a span for an operation
 * const span = observability.startSpan('fetch-account');
 * span.setAttribute('accountId', 'acc-123');
 *
 * try {
 *   // Perform the operation
 *   const result = await fetchAccount('acc-123');
 *   span.setStatus('ok');
 *   return result;
 * } catch (error) {
 *   // Record the error
 *   span.recordException(error);
 *   span.setStatus('error', error.message);
 *   throw error;
 * } finally {
 *   // Always end the span
 *   span.end();
 * }
 * ```
 */
export class Observability {
  /**
   * Configured observability options
   */
  public readonly options: ObservabilityOptions;

  /**
   * OpenTelemetry provider instance (if enabled)
   * @protected - changed from private to protected for better testability
   */
  protected readonly otelProvider?: OpenTelemetryProvider;

  /**
   * Creates a new observability provider with the specified options
   *
   * @param options - Observability configuration options
   */
  constructor(options?: Partial<ObservabilityOptions>) {
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
  }

  /**
   * Determines if any observability features are enabled
   *
   * @returns True if any observability features are enabled
   * @protected - changed from private to protected for better testability
   */
  protected isEnabled(): boolean {
    return (
      !!this.options.enableTracing || !!this.options.enableMetrics || !!this.options.enableLogging
    );
  }

  /**
   * Creates an OpenTelemetry provider
   *
   * @param options - Observability configuration options
   * @returns An OpenTelemetry provider instance
   * @protected - changed from private to protected for better testability
   */
  protected createOtelProvider(options: ObservabilityOptions): OpenTelemetryProvider {
    return new OpenTelemetryProvider(options);
  }

  /**
   * Starts a new span for an operation
   *
   * @param name - Name of the span
   * @param initialAttributes - Initial attributes for the span
   * @returns A span object that can be used to record attributes, events, and status
   */
  startSpan(name: string, initialAttributes: Record<string, AttributeValue> = {}): Span {
    if (!this.options.enableTracing || !this.otelProvider) {
      return this.createNoopSpan();
    }

    return this.otelProvider.startSpan(name, initialAttributes);
  }

  /**
   * Records a metric with the specified name, value, and attributes
   *
   * @param name - Metric name
   * @param value - Metric value
   * @param attributes - Additional attributes for the metric (limited to primitives)
   */
  recordMetric(name: string, value: number, attributes: Record<string, AttributeValue> = {}): void {
    if (this.options.enableMetrics && this.otelProvider) {
      this.otelProvider.recordMetric(name, value, attributes);
    }
  }

  /**
   * Logs a message with the specified level, message, and attributes
   *
   * @param level - Log level
   * @param message - Log message
   * @param attributes - Additional attributes for the log (limited to primitives)
   */
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

  /**
   * Shuts down the observability provider
   *
   * This should be called when the application is shutting down
   * to ensure all telemetry data is flushed.
   *
   * @returns Promise that resolves when shutdown is complete
   */
  async shutdown(): Promise<void> {
    if (this.otelProvider) {
      await this.otelProvider.shutdown();
    }
  }

  /**
   * Creates a no-op span
   *
   * @returns A span that does nothing
   * @protected - changed from private to protected for better testability
   */
  protected createNoopSpan(): Span {
    return new NoopSpan();
  }

  // Static instance for global use
  private static instance?: Observability;

  /**
   * Configures the global observability instance
   *
   * @param options - Observability configuration options
   * @returns The global observability instance
   */
  static configure(options?: Partial<ObservabilityOptions>): Observability {
    Observability.instance = new Observability(options);
    return Observability.instance;
  }

  /**
   * Gets the global observability instance
   *
   * @returns The global observability instance
   */
  static getInstance(): Observability {
    if (!Observability.instance) {
      Observability.instance = new Observability();
    }
    return Observability.instance;
  }

  /**
   * Starts a new span using the global instance
   *
   * @param name - Name of the span
   * @param attributes - Initial attributes for the span
   * @returns A span object
   */
  static startSpan(name: string, attributes: Record<string, AttributeValue> = {}): Span {
    return Observability.getInstance().startSpan(name, attributes);
  }

  /**
   * Records a metric using the global instance
   *
   * @param name - Name of the metric
   * @param value - Value of the metric
   * @param attributes - Attributes for the metric
   */
  static recordMetric(
    name: string,
    value: number,
    attributes: Record<string, AttributeValue> = {}
  ): void {
    Observability.getInstance().recordMetric(name, value, attributes);
  }

  /**
   * Logs a message using the global instance
   *
   * @param level - Log level
   * @param message - Log message
   * @param attributes - Additional attributes for the log
   */
  static log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    attributes: Record<string, AttributeValue> = {}
  ): void {
    Observability.getInstance().log(level, message, attributes);
  }
}
