import { ClientConfigBuilder } from './client-config-builder';
import { Entity } from './entities/entity';
import { HttpClient } from './util/network/http-client';
import { RetryPolicy } from './util/network/retry-policy';
import { Observability } from './util/observability/observability';

/**
 * Configuration options for the Midaz client
 */
export interface MidazConfig {
  /**
   * Authentication token for API requests
   */
  authToken?: string;

  /**
   * API key for API requests
   */
  apiKey?: string;

  /**
   * Environment to connect to (development, sandbox, production)
   */
  environment?: 'development' | 'sandbox' | 'production';

  /**
   * Custom base URLs for different services
   */
  baseUrls?: Record<string, string>;

  /**
   * Request timeout in milliseconds (default: 30000)
   */
  timeout?: number;

  /**
   * Retry configuration
   */
  retries?: {
    /**
     * Maximum number of retry attempts (default: 3)
     */
    maxRetries?: number;

    /**
     * Initial delay between retries in milliseconds (default: 100)
     */
    initialDelay?: number;

    /**
     * Maximum delay between retries in milliseconds (default: 1000)
     */
    maxDelay?: number;

    /**
     * HTTP status codes that should trigger a retry (default: [408, 429, 500, 502, 503, 504])
     */
    retryableStatusCodes?: number[];

    /**
     * Custom function to determine if an error should trigger a retry
     */
    retryCondition?: (error: Error) => boolean;
  };

  /**
   * Observability configuration
   */
  observability?: {
    /**
     * Enable distributed tracing
     */
    enableTracing?: boolean;

    /**
     * Enable metrics collection
     */
    enableMetrics?: boolean;

    /**
     * Enable structured logging
     */
    enableLogging?: boolean;

    /**
     * Service name for observability (default: 'midaz-typescript-sdk')
     */
    serviceName?: string;

    /**
     * OpenTelemetry collector endpoint
     */
    collectorEndpoint?: string;
  };

  /**
   * Enable debug mode for verbose logging
   */
  debug?: boolean;

  /**
   * Custom HTTP client
   */
  httpClient?: HttpClient;
}

/**
 * Main client for the Midaz API.
 * This is the entry point for all SDK operations.
 */
export class MidazClient {
  /**
   * SDK version
   */
  public static readonly VERSION = '0.1.0';

  /**
   * Entities API providing access to all services
   */
  public readonly entities: Entity;

  /**
   * Client configuration
   */
  private readonly config: MidazConfig;

  /**
   * HTTP client for API requests
   */
  private readonly httpClient: HttpClient;

  /**
   * Observability provider
   */
  private readonly observability: Observability;

  /**
   * Creates a new Midaz client with the provided configuration
   *
   * @param configOrBuilder Client configuration or a configuration builder
   */
  constructor(configOrBuilder: MidazConfig | ClientConfigBuilder) {
    // Convert builder to config if necessary
    this.config = 'build' in configOrBuilder ? configOrBuilder.build() : configOrBuilder;

    // Initialize observability
    this.observability = new Observability(this.config.observability);

    // Initialize HTTP client
    this.httpClient =
      this.config.httpClient ||
      new HttpClient({
        baseUrls: this.config.baseUrls,
        timeout: this.config.timeout,
        apiKey: this.config.authToken || this.config.apiKey,
        retryPolicy: this.config.retries
          ? new RetryPolicy({
              maxRetries: this.config.retries.maxRetries,
              initialDelay: this.config.retries.initialDelay,
              maxDelay: this.config.retries.maxDelay,
              retryableStatusCodes: this.config.retries.retryableStatusCodes,
              retryCondition: this.config.retries.retryCondition,
            })
          : undefined,
        debug: this.config.debug,
        observability: this.observability,
      });

    // Initialize entities API with config and observability
    this.entities = new Entity(this.httpClient, this.config, this.observability);
  }

  /**
   * Returns the current SDK version
   */
  public getVersion(): string {
    return MidazClient.VERSION;
  }

  /**
   * Returns the client configuration
   */
  public getConfig(): MidazConfig {
    return { ...this.config };
  }

  /**
   * Returns the observability provider
   */
  public getObservabilityProvider(): Observability {
    return this.observability;
  }

  /**
   * Gracefully shuts down the client, releasing any resources
   */
  public async shutdown(): Promise<void> {
    await this.observability.shutdown();
  }
}
