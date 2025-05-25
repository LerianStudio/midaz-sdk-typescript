/**
 * Metrics collection for monitoring SDK performance and usage
 */

export interface MetricEntry {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
}

export interface MetricsOptions {
  enabled?: boolean;
  flushInterval?: number;
  maxBatchSize?: number;
  includeDefaultMetrics?: boolean;
  prefix?: string;
  tags?: Record<string, string>;
  onFlush?: (metrics: MetricEntry[]) => Promise<void>;
}

export interface Timer {
  end(): number;
}

/**
 * Metrics collector for SDK monitoring
 */
export class MetricsCollector {
  private static instance: MetricsCollector | null = null;
  private metrics: MetricEntry[] = [];
  private options: Required<MetricsOptions>;
  private flushTimer?: ReturnType<typeof setInterval>;
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  constructor(options: MetricsOptions = {}) {
    this.options = {
      enabled: options.enabled ?? true,
      flushInterval: options.flushInterval ?? 60000, // 1 minute
      maxBatchSize: options.maxBatchSize ?? 1000,
      includeDefaultMetrics: options.includeDefaultMetrics ?? true,
      prefix: options.prefix ?? 'midaz_sdk',
      tags: options.tags ?? {},
      onFlush: options.onFlush ?? this.defaultFlushHandler,
    };

    if (this.options.enabled) {
      this.startFlushing();
      if (this.options.includeDefaultMetrics) {
        this.collectDefaultMetrics();
      }
    }
  }

  /**
   * Gets singleton instance
   */
  static getInstance(options?: MetricsOptions): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector(options);
    }
    return MetricsCollector.instance;
  }

  /**
   * Destroys singleton instance
   */
  static destroy(): void {
    if (MetricsCollector.instance) {
      MetricsCollector.instance.destroy();
      MetricsCollector.instance = null;
    }
  }

  /**
   * Increments a counter
   */
  increment(name: string, value: number = 1, tags?: Record<string, string>): void {
    if (!this.options.enabled) return;

    const key = this.getKey(name, tags);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);

    this.addMetric({
      name: this.prefixName(name),
      value: current + value,
      timestamp: Date.now(),
      tags: { ...this.options.tags, ...tags },
      type: 'counter',
    });
  }

  /**
   * Sets a gauge value
   */
  gauge(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.options.enabled) return;

    const key = this.getKey(name, tags);
    this.gauges.set(key, value);

    this.addMetric({
      name: this.prefixName(name),
      value,
      timestamp: Date.now(),
      tags: { ...this.options.tags, ...tags },
      type: 'gauge',
    });
  }

  /**
   * Records a value in a histogram
   */
  histogram(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.options.enabled) return;

    const key = this.getKey(name, tags);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);

    this.addMetric({
      name: this.prefixName(name),
      value,
      timestamp: Date.now(),
      tags: { ...this.options.tags, ...tags },
      type: 'histogram',
    });
  }

  /**
   * Starts a timer
   */
  timer(name: string, tags?: Record<string, string>): Timer {
    const start = Date.now();
    return {
      end: () => {
        const duration = Date.now() - start;
        this.histogram(name, duration, tags);
        return duration;
      },
    };
  }

  /**
   * Records an HTTP request
   */
  recordHttpRequest(method: string, path: string, statusCode: number, duration: number): void {
    this.increment('http_requests_total', 1, {
      method,
      path,
      status: String(statusCode),
    });

    this.histogram('http_request_duration_ms', duration, {
      method,
      path,
      status: String(statusCode),
    });

    if (statusCode >= 400) {
      this.increment('http_errors_total', 1, {
        method,
        path,
        status: String(statusCode),
      });
    }
  }

  /**
   * Records a circuit breaker event
   */
  recordCircuitBreakerEvent(
    key: string,
    event: 'open' | 'close' | 'half_open' | 'success' | 'failure'
  ): void {
    this.increment('circuit_breaker_events_total', 1, {
      circuit: key,
      event,
    });
  }

  /**
   * Records cache performance
   */
  recordCacheEvent(event: 'hit' | 'miss' | 'set' | 'delete', key?: string): void {
    this.increment('cache_events_total', 1, {
      event,
      ...(key && { key }),
    });
  }

  /**
   * Gets current metrics summary
   */
  getSummary(): {
    counters: Record<string, number>;
    gauges: Record<string, number>;
    histograms: Record<
      string,
      { count: number; sum: number; avg: number; min: number; max: number }
    >;
  } {
    const histogramSummary: Record<string, any> = {};

    for (const [key, values] of this.histograms.entries()) {
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        histogramSummary[key] = {
          count: values.length,
          sum,
          avg: sum / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
        };
      }
    }

    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: histogramSummary,
    };
  }

  /**
   * Flushes metrics
   */
  async flush(): Promise<void> {
    if (!this.options.enabled || this.metrics.length === 0) return;

    const metricsToFlush = [...this.metrics];
    this.metrics = [];

    try {
      await this.options.onFlush(metricsToFlush);
    } catch (error) {
      console.error('Failed to flush metrics:', error);
      // Re-add metrics if flush failed
      this.metrics.unshift(...metricsToFlush);
    }
  }

  /**
   * Destroys the collector
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer as any);
      this.flushTimer = undefined;
    }
    this.flush().catch(() => {}); // Best effort flush
    this.metrics = [];
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  private addMetric(metric: MetricEntry): void {
    this.metrics.push(metric);

    if (this.metrics.length >= this.options.maxBatchSize) {
      this.flush().catch(() => {});
    }
  }

  private prefixName(name: string): string {
    return this.options.prefix ? `${this.options.prefix}_${name}` : name;
  }

  private getKey(name: string, tags?: Record<string, string>): string {
    const allTags = { ...this.options.tags, ...tags };
    const tagString = Object.entries(allTags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    return `${name}#${tagString}`;
  }

  private startFlushing(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(() => {});
    }, this.options.flushInterval);
  }

  private collectDefaultMetrics(): void {
    // Collect memory metrics every 30 seconds
    setInterval(() => {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const usage = process.memoryUsage();
        this.gauge('process_memory_heap_used_bytes', usage.heapUsed);
        this.gauge('process_memory_heap_total_bytes', usage.heapTotal);
        this.gauge('process_memory_rss_bytes', usage.rss);
      }
    }, 30000);
  }

  private async defaultFlushHandler(metrics: MetricEntry[]): Promise<void> {
    // Default: log metrics in development
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      console.log('Metrics:', JSON.stringify(metrics, null, 2));
    }
  }
}

/**
 * Decorator for timing methods
 */
export function Timed(metricName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const name = metricName || `${target.constructor.name}_${propertyKey}_duration`;

    descriptor.value = async function (...args: any[]) {
      const metrics = MetricsCollector.getInstance();
      const timer = metrics.timer(name);

      try {
        const result = await originalMethod.apply(this, args);
        timer.end();
        return result;
      } catch (error) {
        timer.end();
        metrics.increment(`${name}_errors`);
        throw error;
      }
    };

    return descriptor;
  };
}
