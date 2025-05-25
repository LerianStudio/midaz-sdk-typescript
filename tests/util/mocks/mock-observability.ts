/**
 * @file Mock implementation of Observability for testing
 * @description Provides a mock implementation of the Observability class for unit tests
 */

import {
  Observability,
  ObservabilityOptions,
  Span,
} from '../../../src/util/observability/observability';
import { OpenTelemetryProvider } from '../../../src/util/observability/observability-otel';

/**
 * Mock implementation of Span for testing
 */
export class MockSpan implements Span {
  public attributes: Record<string, any> = {};
  public exceptions: unknown[] = [];
  public status: { code: 'OK' | 'ERROR'; message?: string } = { code: 'OK' };
  public ended = false;

  setAttribute(key: string, value: string | number | boolean): void {
    this.attributes[key] = value;
  }

  recordException(error: unknown): void {
    this.exceptions.push(error);
  }

  setStatus(status: 'ok' | 'error', message?: string): void {
    this.status = {
      code: status === 'ok' ? 'OK' : 'ERROR',
      message,
    };
  }

  end(): void {
    this.ended = true;
  }
}

/**
 * Mock implementation of OpenTelemetryProvider for testing
 */
export class MockOpenTelemetryProvider {
  public readonly options: ObservabilityOptions;
  public spans: MockSpan[] = [];
  public metrics: Array<{ name: string; value: number; attributes: Record<string, any> }> = [];
  public logs: Array<{ level: string; message: string; attributes: Record<string, any> }> = [];

  constructor(options: ObservabilityOptions) {
    this.options = options;
  }

  startSpan(name: string, attributes: Record<string, any> = {}): MockSpan {
    const span = new MockSpan();
    Object.entries(attributes).forEach(([key, value]) => {
      span.setAttribute(key, value as any);
    });
    this.spans.push(span);
    return span;
  }

  recordMetric(name: string, value: number, attributes: Record<string, any> = {}): void {
    this.metrics.push({ name, value, attributes });
  }

  log(level: string, message: string, attributes: Record<string, any> = {}): void {
    this.logs.push({ level, message, attributes });
  }

  async shutdown(): Promise<void> {
    // Do nothing in mock
  }
}

/**
 * Mock implementation of Observability for testing
 */
export class MockObservability extends Observability {
  public mockSpans: MockSpan[] = [];
  public mockMetrics: Array<{ name: string; value: number; attributes: Record<string, any> }> = [];
  public mockLogs: Array<{ level: string; message: string; attributes: Record<string, any> }> = [];
  public mockProvider: MockOpenTelemetryProvider;

  constructor(options: Partial<ObservabilityOptions> = {}) {
    super({
      enableTracing: true,
      enableMetrics: true,
      enableLogging: true,
      serviceName: 'test-service',
      ...options,
    });

    // Create and store the mock provider
    this.mockProvider = new MockOpenTelemetryProvider(this.options);
  }

  /**
   * Override the createOtelProvider method to return our mock provider
   */
  protected override createOtelProvider(options: ObservabilityOptions): any {
    return this.mockProvider;
  }

  /**
   * Creates a mock span for testing
   */
  protected override createNoopSpan(): Span {
    const span = new MockSpan();
    this.mockSpans.push(span);
    return span;
  }

  /**
   * Reset all mock data
   */
  reset(): void {
    this.mockSpans = [];
    this.mockMetrics = [];
    this.mockLogs = [];
    this.mockProvider.spans = [];
    this.mockProvider.metrics = [];
    this.mockProvider.logs = [];
  }
}
