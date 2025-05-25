import { ClientConfigBuilder } from './client-config-builder';
import { Entity } from './entities/entity';
import { HttpClient } from './util/network/http-client';
import { RetryPolicy } from './util/network/retry-policy';
import { Observability } from './util/observability/observability';
import { ConfigService } from './util/config';
import { logger } from './util/observability/logger-instance';
import { AccessManager, AccessManagerConfig } from './util/auth/access-manager';

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
   * API version to use for requests (default: 'v1')
   */
  apiVersion?: string;

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

  /**
   * Access Manager configuration for plugin-based authentication
   */
  accessManager?: AccessManagerConfig;
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
   * Access Manager for authentication
   */
  private readonly accessManager?: AccessManager;

  /**
   * Creates a new Midaz client with the provided configuration
   *
   */
  constructor(configOrBuilder: MidazConfig | ClientConfigBuilder) {
    // Convert builder to config if necessary
    this.config = 'build' in configOrBuilder ? configOrBuilder.build() : configOrBuilder;

    // Initialize observability
    this.observability = new Observability(this.config.observability);

    // Get ConfigService instance
    const configService = ConfigService.getInstance();

    // Get API version from config or ConfigService
    if (!this.config.apiVersion) {
      this.config.apiVersion = configService.getApiUrlConfig().apiVersion;
    }

    // Initialize Access Manager if configured
    if (this.config.accessManager) {
      this.accessManager = new AccessManager(this.config.accessManager);
    }

    // Initialize HTTP client
    this.httpClient =
      this.config.httpClient ||
      new HttpClient({
        baseURL: this.config.baseUrls?.onboarding || 'http://localhost:3000',
        timeout: this.config.timeout,
        maxRetries: this.config.retries?.maxRetries,
        retryDelay: this.config.retries?.initialDelay
      });

    // Set auth token if provided
    if (this.config.authToken || this.config.apiKey) {
      this.httpClient.setDefaultHeader('Authorization', `Bearer ${this.config.authToken || this.config.apiKey}`);
    }

    // If Access Manager is enabled, set up authentication interceptor
    if (this.accessManager?.isEnabled()) {
      // We can't directly modify the private request method, so we'll intercept the public methods
      this.setupAuthInterceptors();
    }

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

  /**
   * Checks if the client is using plugin-based authentication
   */
  public isUsingAccessManager(): boolean {
    return this.accessManager?.isEnabled() || false;
  }

  /**
   * Sets up authentication interceptors for all HTTP methods
   *
   * This method wraps the public HTTP client methods to add authentication tokens
   * from the Access Manager to each request.
   *
   * @private
   */
  private setupAuthInterceptors(): void {
    type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
    const methods: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete'];

    methods.forEach((method) => {
      const originalMethod = (this.httpClient[method] as any).bind(this.httpClient);
      (this.httpClient[method] as any) = async (...args: any[]) => {
        const options = args[method === 'get' || method === 'delete' ? 1 : 2] || {};
        options.headers = options.headers || {};
        const token = await this.getAuthToken();
        options.headers['Authorization'] = token;
        if (method === 'get' || method === 'delete') {
          return originalMethod(args[0], options);
        } else {
          return originalMethod(args[0], args[1], options);
        }
      };
    });
  }

  /**
   * Gets an authentication token from the Access Manager
   *
   * @returns Promise resolving to the authentication token
   * @private
   */
  private async getAuthToken(): Promise<string> {
    if (!this.accessManager?.isEnabled()) {
      throw new Error('Access Manager is not enabled');
    }

    try {
      return await this.accessManager.getToken();
    } catch (error) {
      logger.error('Failed to get authentication token:', error as Error);
      throw new Error(
        `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
