/**
 * @file Configuration service for the Midaz SDK
 * @description Centralizes configuration and environment variable access throughout the SDK
 */

/**
 * Configuration options for observability
 */
export interface ObservabilityConfig {
  /**
   * Enable distributed tracing
   * @default false
   */
  enableTracing: boolean;

  /**
   * Enable metrics collection
   * @default false
   */
  enableMetrics: boolean;

  /**
   * Enable structured logging
   * @default false
   */
  enableLogging: boolean;

  /**
   * Service name for observability
   * @default "midaz-typescript-sdk"
   */
  serviceName: string;

  /**
   * OpenTelemetry collector endpoint
   * URL of the OpenTelemetry collector to send telemetry data to
   */
  collectorEndpoint?: string;
}

/**
 * Configuration options for API URLs
 */
export interface ApiUrlConfig {
  /**
   * Base URL for the onboarding service
   * @default "http://localhost:3000"
   */
  onboardingUrl: string;

  /**
   * Base URL for the transaction service
   * @default "http://localhost:3001"
   */
  transactionUrl: string;
  
  /**
   * API version to use for requests
   * @default "v1"
   */
  apiVersion: string;
}

/**
 * Configuration options for retry policy
 */
export interface RetryPolicyConfig {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries: number;

  /**
   * Initial delay between retries in milliseconds
   * @default 100
   */
  initialDelay: number;

  /**
   * Maximum delay between retries in milliseconds
   * @default 1000
   */
  maxDelay: number;

  /**
   * HTTP status codes that should trigger a retry
   * @default [408, 429, 500, 502, 503, 504]
   */
  retryableStatusCodes: number[];
}

/**
 * Configuration options for HTTP client
 */
export interface HttpConfig {
  /**
   * Default timeout for requests in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout: number;

  /**
   * API key for authentication
   */
  apiKey?: string;

  /**
   * Whether to enable debug logging
   * @default false
   */
  debug: boolean;

  /**
   * Whether to enable connection keep-alive
   * @default true
   */
  keepAlive: boolean;

  /**
   * Maximum number of sockets to allow per host
   * @default 10
   */
  maxSockets: number;

  /**
   * Time in milliseconds to keep idle connections open
   * @default 60000 (60 seconds)
   */
  keepAliveMsecs: number;

  /**
   * Whether to enable HTTP/2 where available
   * @default true
   */
  enableHttp2: boolean;

  /**
   * DNS cache TTL in milliseconds
   * @default 300000 (5 minutes)
   */
  dnsCacheTtl: number;
}

/**
 * Configuration service for the Midaz SDK
 * 
 * This service centralizes all configuration and environment variable access
 * throughout the SDK, making it easier to manage configuration and test code
 * that relies on environment variables.
 * 
 * @example
 * ```typescript
 * // Get the global configuration instance
 * const config = ConfigService.getInstance();
 * 
 * // Get observability configuration
 * const observabilityConfig = config.getObservabilityConfig();
 * 
 * // Get API URL configuration
 * const apiUrlConfig = config.getApiUrlConfig();
 * 
 * // Override configuration settings
 * ConfigService.configure({
 *   observability: {
 *     enableTracing: true,
 *     serviceName: 'my-custom-service'
 *   },
 *   apiUrls: {
 *     onboardingUrl: 'https://custom-api.example.com/v1'
 *   }
 * });
 * ```
 */
export class ConfigService {
  private static instance?: ConfigService;

  /**
   * Override values for configuration
   * Takes precedence over environment variables
   */
  private overrides: {
    observability?: Partial<ObservabilityConfig>;
    apiUrls?: Partial<ApiUrlConfig>;
    retryPolicy?: Partial<RetryPolicyConfig>;
    httpClient?: Partial<HttpConfig>;
  } = {};

  /**
   * Creates a new configuration service instance
   * @private - Use the static getInstance() method instead
   */
  private constructor() { /* Use getInstance instead */ }

  /**
   * Gets the global configuration service instance
   * @returns The global configuration service instance
   */
  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * Configures the global configuration service with override values
   * @param options - Override configuration options
   */
  public static configure(options: {
    observability?: Partial<ObservabilityConfig>;
    apiUrls?: Partial<ApiUrlConfig>;
    retryPolicy?: Partial<RetryPolicyConfig>;
    httpClient?: Partial<HttpConfig>;
  }): void {
    const instance = ConfigService.getInstance();
    instance.overrides = {
      ...instance.overrides,
      ...options,
    };
  }

  /**
   * Resets all configuration overrides
   * After calling this method, all configuration will be based on environment variables
   */
  public static reset(): void {
    const instance = ConfigService.getInstance();
    instance.overrides = {};
  }

  /**
   * Gets the observability configuration
   * @returns The observability configuration
   */
  public getObservabilityConfig(): ObservabilityConfig {
    const defaults: ObservabilityConfig = {
      enableTracing: this.getBooleanEnv('MIDAZ_ENABLE_TRACING', false),
      enableMetrics: this.getBooleanEnv('MIDAZ_ENABLE_METRICS', false),
      enableLogging: this.getBooleanEnv('MIDAZ_ENABLE_LOGGING', false),
      serviceName: this.getEnv('MIDAZ_SERVICE_NAME', 'midaz-typescript-sdk'),
      collectorEndpoint: this.getEnv('MIDAZ_COLLECTOR_ENDPOINT'),
    };

    return {
      ...defaults,
      ...this.overrides.observability,
    };
  }

  /**
   * Gets the API URL configuration
   * @returns The API URL configuration
   */
  public getApiUrlConfig(): ApiUrlConfig {
    const defaults: ApiUrlConfig = {
      onboardingUrl: this.getEnv('MIDAZ_ONBOARDING_URL', 'http://localhost:3000'),
      transactionUrl: this.getEnv('MIDAZ_TRANSACTION_URL', 'http://localhost:3001'),
      apiVersion: this.getEnv('MIDAZ_API_VERSION', 'v1'),
    };

    return {
      ...defaults,
      ...this.overrides.apiUrls,
    };
  }

  /**
   * Gets the retry policy configuration
   * @returns The retry policy configuration
   */
  public getRetryPolicyConfig(): RetryPolicyConfig {
    const defaults: RetryPolicyConfig = {
      maxRetries: this.getNumberEnv('MIDAZ_RETRY_MAX_RETRIES', 3),
      initialDelay: this.getNumberEnv('MIDAZ_RETRY_INITIAL_DELAY', 100),
      maxDelay: this.getNumberEnv('MIDAZ_RETRY_MAX_DELAY', 1000),
      retryableStatusCodes: this.getArrayEnv('MIDAZ_RETRY_STATUS_CODES', [408, 429, 500, 502, 503, 504]),
    };

    return {
      ...defaults,
      ...this.overrides.retryPolicy,
    };
  }

  /**
   * Gets the HTTP client configuration
   * @returns The HTTP client configuration
   */
  public getHttpClientConfig(): HttpConfig {
    const defaults: HttpConfig = {
      timeout: this.getNumberEnv('MIDAZ_HTTP_TIMEOUT', 30000),
      apiKey: this.getEnv('MIDAZ_API_KEY'),
      debug: this.getBooleanEnv('MIDAZ_DEBUG', false),
      keepAlive: this.getBooleanEnv('MIDAZ_HTTP_KEEP_ALIVE', true),
      maxSockets: this.getNumberEnv('MIDAZ_HTTP_MAX_SOCKETS', 10),
      keepAliveMsecs: this.getNumberEnv('MIDAZ_HTTP_KEEP_ALIVE_MSECS', 60000),
      enableHttp2: this.getBooleanEnv('MIDAZ_HTTP_ENABLE_HTTP2', true),
      dnsCacheTtl: this.getNumberEnv('MIDAZ_HTTP_DNS_CACHE_TTL', 300000),
    };

    return {
      ...defaults,
      ...this.overrides.httpClient,
    };
  }

  /**
   * Gets an environment variable as a string
   * @param name - Environment variable name
   * @param defaultValue - Default value if environment variable is not set
   * @returns The environment variable value or default value
   * @private
   */
  private getEnv(name: string, defaultValue = ''): string {
    return process.env[name] || defaultValue;
  }

  /**
   * Gets an environment variable as a boolean
   * @param name - Environment variable name
   * @param defaultValue - Default value if environment variable is not set
   * @returns The environment variable value as a boolean or default value
   * @private
   */
  private getBooleanEnv(name: string, defaultValue: boolean): boolean {
    const value = process.env[name];
    return value ? value.toLowerCase() === 'true' : defaultValue;
  }

  /**
   * Gets an environment variable as a number
   * @param name - Environment variable name
   * @param defaultValue - Default value if environment variable is not set
   * @returns The environment variable value as a number or default value
   * @private
   */
  private getNumberEnv(name: string, defaultValue: number): number {
    const value = process.env[name];
    return value ? parseInt(value, 10) : defaultValue;
  }

  /**
   * Gets an environment variable as an array of numbers
   * @param name - Environment variable name
   * @param defaultValue - Default value if environment variable is not set
   * @returns The environment variable value as an array of numbers or default value
   * @private
   */
  private getArrayEnv(name: string, defaultValue: number[]): number[] {
    const value = process.env[name];
    return value ? value.split(',').map((item) => parseInt(item.trim(), 10)) : defaultValue;
  }
}