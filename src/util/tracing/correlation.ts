/**
 * Error correlation and distributed tracing utilities
 */

import { createIdempotencyKey } from '../crypto';

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  flags: number;
  baggage?: Record<string, string>;
}

export interface CorrelationContext {
  correlationId: string;
  traceContext?: TraceContext;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Manages error correlation and distributed tracing
 */
export class CorrelationManager {
  private static instance: CorrelationManager | null = null;
  private currentContext: CorrelationContext | null = null;
  private contextStorage: Map<string, CorrelationContext> = new Map();

  private constructor() {}

  /**
   * Gets singleton instance
   */
  static getInstance(): CorrelationManager {
    if (!CorrelationManager.instance) {
      CorrelationManager.instance = new CorrelationManager();
    }
    return CorrelationManager.instance;
  }

  /**
   * Destroys singleton instance
   */
  static destroy(): void {
    if (CorrelationManager.instance) {
      CorrelationManager.instance.clear();
      CorrelationManager.instance = null;
    }
  }

  /**
   * Creates a new correlation context
   */
  async createContext(
    options: {
      userId?: string;
      sessionId?: string;
      requestId?: string;
      traceContext?: TraceContext;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<CorrelationContext> {
    const correlationId = await this.generateCorrelationId();

    const context: CorrelationContext = {
      correlationId,
      timestamp: Date.now(),
      ...options,
    };

    this.currentContext = context;
    this.contextStorage.set(correlationId, context);

    // Clean up old contexts
    this.cleanupOldContexts();

    return context;
  }

  /**
   * Gets the current correlation context
   */
  getCurrentContext(): CorrelationContext | null {
    return this.currentContext;
  }

  /**
   * Sets the current correlation context
   */
  setCurrentContext(context: CorrelationContext | null): void {
    this.currentContext = context;
  }

  /**
   * Gets a context by correlation ID
   */
  getContext(correlationId: string): CorrelationContext | undefined {
    return this.contextStorage.get(correlationId);
  }

  /**
   * Creates a child trace span
   */
  async createChildSpan(name: string, parentContext?: TraceContext): Promise<TraceContext> {
    const parent = parentContext || this.currentContext?.traceContext;

    return {
      traceId: parent?.traceId || (await this.generateTraceId()),
      spanId: await this.generateSpanId(),
      parentSpanId: parent?.spanId,
      flags: parent?.flags || 0,
      baggage: parent?.baggage,
    };
  }

  /**
   * Adds metadata to the current context
   */
  addMetadata(key: string, value: any): void {
    if (this.currentContext) {
      if (!this.currentContext.metadata) {
        this.currentContext.metadata = {};
      }
      this.currentContext.metadata[key] = value;
    }
  }

  /**
   * Formats context for logging
   */
  formatForLogging(context?: CorrelationContext): Record<string, any> {
    const ctx = context || this.currentContext;
    if (!ctx) return {};

    return {
      correlationId: ctx.correlationId,
      traceId: ctx.traceContext?.traceId,
      spanId: ctx.traceContext?.spanId,
      parentSpanId: ctx.traceContext?.parentSpanId,
      userId: ctx.userId,
      sessionId: ctx.sessionId,
      requestId: ctx.requestId,
      ...ctx.metadata,
    };
  }

  /**
   * Formats context for HTTP headers
   */
  formatForHeaders(context?: CorrelationContext): Record<string, string> {
    const ctx = context || this.currentContext;
    const headers: Record<string, string> = {};

    if (ctx) {
      headers['X-Correlation-ID'] = ctx.correlationId;

      if (ctx.requestId) {
        headers['X-Request-ID'] = ctx.requestId;
      }

      if (ctx.traceContext) {
        // W3C Trace Context format
        const { traceId, spanId, flags } = ctx.traceContext;
        headers['traceparent'] = `00-${traceId}-${spanId}-${flags.toString(16).padStart(2, '0')}`;

        if (ctx.traceContext.baggage) {
          headers['tracestate'] = Object.entries(ctx.traceContext.baggage)
            .map(([k, v]) => `${k}=${v}`)
            .join(',');
        }
      }
    }

    return headers;
  }

  /**
   * Parses context from HTTP headers
   */
  parseFromHeaders(headers: Record<string, string>): Partial<CorrelationContext> {
    const context: Partial<CorrelationContext> = {};

    // Parse correlation ID
    const correlationId = headers['x-correlation-id'] || headers['X-Correlation-ID'];
    if (correlationId) {
      context.correlationId = correlationId;
    }

    // Parse request ID
    const requestId = headers['x-request-id'] || headers['X-Request-ID'];
    if (requestId) {
      context.requestId = requestId;
    }

    // Parse W3C Trace Context
    const traceparent = headers['traceparent'];
    if (traceparent) {
      const parts = traceparent.split('-');
      if (parts.length === 4) {
        context.traceContext = {
          traceId: parts[1],
          spanId: parts[2],
          flags: parseInt(parts[3], 16),
        };

        // Parse trace state (baggage)
        const tracestate = headers['tracestate'];
        if (tracestate) {
          context.traceContext.baggage = {};
          tracestate.split(',').forEach((pair) => {
            const [key, value] = pair.split('=');
            if (key && value && context.traceContext) {
              context.traceContext.baggage![key] = value;
            }
          });
        }
      }
    }

    return context;
  }

  /**
   * Enhances an error with correlation context
   */
  enhanceError(error: Error, context?: CorrelationContext): Error {
    const ctx = context || this.currentContext;
    if (!ctx) return error;

    // Add correlation info to error
    (error as any).correlationId = ctx.correlationId;
    (error as any).traceId = ctx.traceContext?.traceId;
    (error as any).spanId = ctx.traceContext?.spanId;
    (error as any).userId = ctx.userId;
    (error as any).sessionId = ctx.sessionId;
    (error as any).requestId = ctx.requestId;
    (error as any).correlationTimestamp = ctx.timestamp;

    return error;
  }

  /**
   * Clears all contexts
   */
  clear(): void {
    this.currentContext = null;
    this.contextStorage.clear();
  }

  /**
   * Generates a correlation ID
   */
  private async generateCorrelationId(): Promise<string> {
    const timestamp = Date.now().toString(36);
    const random = await createIdempotencyKey('correlation', timestamp);
    return `corr_${timestamp}_${random.substring(0, 8)}`;
  }

  /**
   * Generates a trace ID (128-bit hex)
   */
  private async generateTraceId(): Promise<string> {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generates a span ID (64-bit hex)
   */
  private async generateSpanId(): Promise<string> {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Cleans up old contexts (older than 1 hour)
   */
  private cleanupOldContexts(): void {
    const oneHourAgo = Date.now() - 3600000;
    const toDelete: string[] = [];

    for (const [id, context] of this.contextStorage.entries()) {
      if (context.timestamp < oneHourAgo) {
        toDelete.push(id);
      }
    }

    for (const id of toDelete) {
      this.contextStorage.delete(id);
    }
  }
}

/**
 * Decorator for adding correlation to methods
 */
export function Correlated(options?: { propagate?: boolean }) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const correlationManager = CorrelationManager.getInstance();

      // Create or propagate context
      let context = correlationManager.getCurrentContext();
      if (!context || !options?.propagate) {
        context = await correlationManager.createContext({
          metadata: {
            method: `${target.constructor.name}.${propertyKey}`,
          },
        });
      }

      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        // Enhance error with correlation
        throw correlationManager.enhanceError(error as Error, context);
      }
    };

    return descriptor;
  };
}
