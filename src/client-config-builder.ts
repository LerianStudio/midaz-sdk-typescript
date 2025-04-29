/**
 */

import { MidazConfig } from './client';
import { HttpClient } from './util/network/http-client';

/**
 * Environment-specific base URLs
 */
const ENVIRONMENT_URLS: Record<string, Record<string, string>> = {
  development: {
    onboarding: 'https://api.dev.midaz.io',
    transaction: 'https://api.dev.midaz.io',
  },
  sandbox: {
    onboarding: 'https://api.sandbox.midaz.io',
    transaction: 'https://api.sandbox.midaz.io',
  },
  production: {
    onboarding: 'https://api.midaz.io',
    transaction: 'https://api.midaz.io',
  },
};

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Partial<MidazConfig> = {
  environment: 'production',
  apiVersion: 'v1',
  timeout: 30000,
  retries: {
    maxRetries: 3,
    initialDelay: 100,
    maxDelay: 1000,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  },
  observability: {
    enableTracing: false,
    enableMetrics: false,
    enableLogging: false,
    serviceName: 'midaz-typescript-sdk',
  },
  debug: false,
};

/**
 * Builder for creating a Midaz client configuration
 *
 * This builder simplifies the process of creating a configuration object for the MidazClient
 * by providing a fluent API with method chaining.
 */
export interface ClientConfigBuilder {
  /**
   * Set the API key for authentication
   */
  withApiKey(apiKey: string): ClientConfigBuilder;

  /**
   * Set the auth token for authentication (alternative to API key)
   */
  withAuthToken(authToken: string): ClientConfigBuilder;

  /**
   * Set the environment (development, sandbox, production)
   * This will automatically set default base URLs for the environment
   */
  withEnvironment(environment: 'development' | 'sandbox' | 'production'): ClientConfigBuilder;

  /**
   * Set the API version to use for requests
   */
  withApiVersion(apiVersion: string): ClientConfigBuilder;

  /**
   * Set custom base URLs for services
   */
  withBaseUrls(baseUrls: Record<string, string>): ClientConfigBuilder;

  /**
   * Set timeout for HTTP requests
   */
  withTimeout(timeoutMs: number): ClientConfigBuilder;

  /**
   * Configure retry behavior
   */
  withRetryPolicy(options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    retryableStatusCodes?: number[];
    retryCondition?: (error: Error) => boolean;
  }): ClientConfigBuilder;

  /**
   * Configure observability (tracing, metrics, logging)
   */
  withObservability(options: {
    enableTracing?: boolean;
    enableMetrics?: boolean;
    enableLogging?: boolean;
    serviceName?: string;
    collectorEndpoint?: string;
  }): ClientConfigBuilder;

  /**
   * Enable debug mode for verbose logging
   */
  withDebugMode(enable: boolean): ClientConfigBuilder;

  /**
   * Set a custom HTTP client
   */
  withHttpClient(httpClient: HttpClient): ClientConfigBuilder;

  /**
   * Build the final configuration object
   * @returns The complete MidazConfig object
   */
  build(): MidazConfig;
}

/**
 * Implementation of the client configuration builder
 */
class ClientConfigBuilderImpl implements ClientConfigBuilder {
  private config: Partial<MidazConfig>;

  /**
   * Create a new client configuration builder
   */
  constructor(initialConfig: Partial<MidazConfig> = {}) {
    this.config = { ...initialConfig };
  }

  withApiKey(apiKey: string): ClientConfigBuilder {
    this.config.apiKey = apiKey;
    return this;
  }

  withAuthToken(authToken: string): ClientConfigBuilder {
    this.config.authToken = authToken;
    return this;
  }

  withEnvironment(environment: 'development' | 'sandbox' | 'production'): ClientConfigBuilder {
    this.config.environment = environment;
    // Set default base URLs for the environment
    this.config.baseUrls = { ...ENVIRONMENT_URLS[environment] };
    return this;
  }

  withApiVersion(apiVersion: string): ClientConfigBuilder {
    this.config.apiVersion = apiVersion;
    return this;
  }

  withBaseUrls(baseUrls: Record<string, string>): ClientConfigBuilder {
    this.config.baseUrls = { ...baseUrls };
    return this;
  }

  withTimeout(timeoutMs: number): ClientConfigBuilder {
    this.config.timeout = timeoutMs;
    return this;
  }

  withRetryPolicy(options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    retryableStatusCodes?: number[];
    retryCondition?: (error: Error) => boolean;
  }): ClientConfigBuilder {
    this.config.retries = {
      ...DEFAULT_CONFIG.retries,
      ...options,
    };
    return this;
  }

  withObservability(options: {
    enableTracing?: boolean;
    enableMetrics?: boolean;
    enableLogging?: boolean;
    serviceName?: string;
    collectorEndpoint?: string;
  }): ClientConfigBuilder {
    this.config.observability = {
      ...DEFAULT_CONFIG.observability,
      ...options,
    };
    return this;
  }

  withDebugMode(enable: boolean): ClientConfigBuilder {
    this.config.debug = enable;
    return this;
  }

  withHttpClient(httpClient: HttpClient): ClientConfigBuilder {
    this.config.httpClient = httpClient;
    return this;
  }

  build(): MidazConfig {
    // Apply default configuration for any unset properties
    const config: MidazConfig = {
      ...DEFAULT_CONFIG,
      ...this.config,
      // Make sure nested objects get properly merged with defaults
      retries: this.config.retries
        ? {
            ...DEFAULT_CONFIG.retries,
            ...this.config.retries,
          }
        : DEFAULT_CONFIG.retries,
      observability: this.config.observability
        ? {
            ...DEFAULT_CONFIG.observability,
            ...this.config.observability,
          }
        : DEFAULT_CONFIG.observability,
    };

    // Validate required configuration
    if (!config.authToken && !config.apiKey) {
      throw new Error('Either apiKey or authToken must be provided');
    }

    // Set up base URLs based on environment if not already set
    if (!config.baseUrls && config.environment) {
      config.baseUrls = { ...ENVIRONMENT_URLS[config.environment] };
    }

    return config;
  }
}

/**
 * Creates a client configuration builder with an API key
 * @returns A new client configuration builder
 */
export function createClientConfigBuilder(apiKey: string): ClientConfigBuilder {
  return new ClientConfigBuilderImpl().withApiKey(apiKey);
}

/**
 * Creates a client configuration builder with an auth token
 * @returns A new client configuration builder
 */
export function createClientConfigWithToken(authToken: string): ClientConfigBuilder {
  return new ClientConfigBuilderImpl().withAuthToken(authToken);
}

/**
 * Creates a development environment configuration builder
 * @returns A new client configuration builder with development environment defaults
 */
export function createDevelopmentConfig(apiKey: string, apiVersion = 'v1'): ClientConfigBuilder {
  return createClientConfigBuilder(apiKey)
    .withEnvironment('development')
    .withApiVersion(apiVersion)
    .withDebugMode(true);
}

/**
 * Creates a sandbox environment configuration builder
 * @returns A new client configuration builder with sandbox environment defaults
 */
export function createSandboxConfig(apiKey: string, apiVersion = 'v1'): ClientConfigBuilder {
  return createClientConfigBuilder(apiKey).withEnvironment('sandbox').withApiVersion(apiVersion);
}

/**
 * Creates a production environment configuration builder
 * @returns A new client configuration builder with production environment defaults
 */
export function createProductionConfig(apiKey: string, apiVersion = 'v1'): ClientConfigBuilder {
  return createClientConfigBuilder(apiKey).withEnvironment('production').withApiVersion(apiVersion);
}

/**
 * Creates a local development configuration builder
 * @returns A new client configuration builder with local development defaults
 */
export function createLocalConfig(
  apiKey: string,
  port = 3000,
  apiVersion = 'v1'
): ClientConfigBuilder {
  return createClientConfigBuilder(apiKey)
    .withBaseUrls({
      onboarding: `http://localhost:${port}`,
      transaction: `http://localhost:${port + 1}`,
    })
    .withApiVersion(apiVersion)
    .withDebugMode(true);
}
