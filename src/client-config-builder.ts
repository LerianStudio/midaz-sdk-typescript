/**
 */

import { MidazConfig } from './client';
import { AccessManagerConfig } from './util/auth/access-manager';
import { HttpClient } from './util/network/http-client';

/**
 * Utility function to read environment variables with fallbacks
 */
function getEnvVar(name: string, defaultValue?: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name] || defaultValue;
  }
  return defaultValue;
}

/**
 * Parse comma-separated string to number array
 */
function parseNumberArray(value: string | undefined): number[] {
  if (!value) return [];
  return value.split(',').map(num => parseInt(num.trim(), 10)).filter(num => !isNaN(num));
}

/**
 * Parse boolean from string
 */
function parseBool(value: string | undefined, defaultValue: boolean = false): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Parse number from string
 */
function parseNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Environment-specific base URLs
 */
const ENVIRONMENT_URLS: Record<string, Record<string, string>> = {
  development: {
    onboarding: getEnvVar('MIDAZ_ONBOARDING_URL', 'http://localhost:3000') || 'http://localhost:3000',
    transaction: getEnvVar('MIDAZ_TRANSACTION_URL', 'http://localhost:3001') || 'http://localhost:3001',
  },
  sandbox: {
    onboarding: getEnvVar('MIDAZ_ONBOARDING_URL', 'https://yourdomain.sandbox.midaz.io') || 'https://yourdomain.sandbox.midaz.io',
    transaction: getEnvVar('MIDAZ_TRANSACTION_URL', 'https://yourdomain.sandbox.midaz.io') || 'https://yourdomain.sandbox.midaz.io',
  },
  production: {
    onboarding: getEnvVar('MIDAZ_ONBOARDING_URL', 'https://yourdomain.api.midaz.io') || 'https://yourdomain.api.midaz.io',
    transaction: getEnvVar('MIDAZ_TRANSACTION_URL', 'https://yourdomain.api.midaz.io') || 'https://yourdomain.api.midaz.io',
  },
};

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Partial<MidazConfig> = {
  environment: 'production',
  apiVersion: getEnvVar('MIDAZ_API_VERSION', 'v1') || 'v1',
  timeout: parseNumber(getEnvVar('MIDAZ_HTTP_TIMEOUT'), 30000),
  retries: {
    maxRetries: parseNumber(getEnvVar('MIDAZ_RETRY_MAX_RETRIES'), 3),
    initialDelay: parseNumber(getEnvVar('MIDAZ_RETRY_INITIAL_DELAY'), 100),
    maxDelay: parseNumber(getEnvVar('MIDAZ_RETRY_MAX_DELAY'), 1000),
    retryableStatusCodes: parseNumberArray(getEnvVar('MIDAZ_RETRY_STATUS_CODES')) || [408, 429, 500, 502, 503, 504],
  },
  observability: {
    enableTracing: parseBool(getEnvVar('MIDAZ_ENABLE_TRACING'), false),
    enableMetrics: parseBool(getEnvVar('MIDAZ_ENABLE_METRICS'), false),
    enableLogging: parseBool(getEnvVar('MIDAZ_ENABLE_LOGGING'), false),
    serviceName: getEnvVar('MIDAZ_SERVICE_NAME', 'midaz-typescript-sdk') || 'midaz-typescript-sdk',
    collectorEndpoint: getEnvVar('MIDAZ_COLLECTOR_ENDPOINT'),
  },
  debug: parseBool(getEnvVar('MIDAZ_DEBUG'), false),
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
   * Configure Access Manager for plugin-based authentication
   */
  withAccessManager(config: AccessManagerConfig): ClientConfigBuilder;

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

  withAccessManager(config: AccessManagerConfig): ClientConfigBuilder {
    // Validate required properties to prevent misconfiguration
    if (config.enabled === undefined) {
      throw new Error('AccessManagerConfig: "enabled" property is required');
    }
    if (!config.address) {
      throw new Error('AccessManagerConfig: "address" property is required');
    }
    if (!config.clientId) {
      throw new Error('AccessManagerConfig: "clientId" property is required');
    }
    if (!config.clientSecret) {
      throw new Error('AccessManagerConfig: "clientSecret" property is required');
    }

    // Assign the validated config
    this.config.accessManager = config;
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
    const hasAuthToken = !!(config.authToken || config.apiKey);
    const hasAccessManager = !!(config.accessManager && config.accessManager.enabled);
    
    if (!hasAuthToken && !hasAccessManager) {
      throw new Error('Either apiKey/authToken or accessManager (with enabled: true) must be provided');
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
 * Creates a client configuration builder with Access Manager authentication
 * @returns A new client configuration builder with Access Manager configured
 */
export function createClientConfigWithAccessManager(config?: {
  address?: string;
  clientId?: string;
  clientSecret?: string;
  tokenEndpoint?: string;
  refreshThresholdSeconds?: number;
}): ClientConfigBuilder {
  const accessManagerConfig = {
    enabled: parseBool(getEnvVar('PLUGIN_AUTH_ENABLED'), true),
    address: config?.address || getEnvVar('PLUGIN_AUTH_ADDRESS') || 'http://localhost:4000',
    clientId: config?.clientId || getEnvVar('MIDAZ_CLIENT_ID') || '',
    clientSecret: config?.clientSecret || getEnvVar('MIDAZ_CLIENT_SECRET') || '',
    tokenEndpoint: config?.tokenEndpoint || getEnvVar('PLUGIN_AUTH_TOKEN_ENDPOINT'),
    refreshThresholdSeconds: config?.refreshThresholdSeconds || parseNumber(getEnvVar('PLUGIN_AUTH_REFRESH_THRESHOLD_SECONDS'), 300),
  };
  
  return new ClientConfigBuilderImpl().withAccessManager(accessManagerConfig);
}

/**
 * Creates a development environment configuration builder with API key authentication
 * @returns A new client configuration builder with development environment defaults
 */
export function createDevelopmentConfig(apiKey: string, apiVersion = 'v1'): ClientConfigBuilder {
  return createClientConfigBuilder(apiKey)
    .withEnvironment('development')
    .withApiVersion(apiVersion)
    .withDebugMode(true);
}

/**
 * Creates a development environment configuration builder with Access Manager authentication
 * @returns A new client configuration builder with development environment defaults and Access Manager
 */
export function createDevelopmentConfigWithAccessManager(
  config?: {
    address?: string;
    clientId?: string;
    clientSecret?: string;
    tokenEndpoint?: string;
    refreshThresholdSeconds?: number;
  },
  apiVersion?: string
): ClientConfigBuilder {
  const defaultApiVersion = getEnvVar('MIDAZ_API_VERSION', apiVersion || 'v1') || 'v1';
  return createClientConfigWithAccessManager(config)
    .withEnvironment('development')
    .withApiVersion(defaultApiVersion)
    .withDebugMode(parseBool(getEnvVar('MIDAZ_DEBUG'), true));
}

/**
 * Creates a sandbox environment configuration builder with API key authentication
 * @returns A new client configuration builder with sandbox environment defaults
 */
export function createSandboxConfig(apiKey: string, apiVersion = 'v1'): ClientConfigBuilder {
  return createClientConfigBuilder(apiKey).withEnvironment('sandbox').withApiVersion(apiVersion);
}

/**
 * Creates a sandbox environment configuration builder with Access Manager authentication
 * @returns A new client configuration builder with sandbox environment defaults and Access Manager
 */
export function createSandboxConfigWithAccessManager(
  config?: {
    address?: string;
    clientId?: string;
    clientSecret?: string;
    tokenEndpoint?: string;
    refreshThresholdSeconds?: number;
  },
  apiVersion?: string
): ClientConfigBuilder {
  const defaultApiVersion = getEnvVar('MIDAZ_API_VERSION', apiVersion || 'v1') || 'v1';
  return createClientConfigWithAccessManager(config)
    .withEnvironment('sandbox')
    .withApiVersion(defaultApiVersion);
}

/**
 * Creates a production environment configuration builder with API key authentication
 * @returns A new client configuration builder with production environment defaults
 */
export function createProductionConfig(apiKey: string, apiVersion = 'v1'): ClientConfigBuilder {
  return createClientConfigBuilder(apiKey).withEnvironment('production').withApiVersion(apiVersion);
}

/**
 * Creates a production environment configuration builder with Access Manager authentication
 * @returns A new client configuration builder with production environment defaults and Access Manager
 */
export function createProductionConfigWithAccessManager(
  config?: {
    address?: string;
    clientId?: string;
    clientSecret?: string;
    tokenEndpoint?: string;
    refreshThresholdSeconds?: number;
  },
  apiVersion?: string
): ClientConfigBuilder {
  const defaultApiVersion = getEnvVar('MIDAZ_API_VERSION', apiVersion || 'v1') || 'v1';
  return createClientConfigWithAccessManager(config)
    .withEnvironment('production')
    .withApiVersion(defaultApiVersion);
}

/**
 * Creates a local development configuration builder with API key authentication
 * @returns A new client configuration builder with local development defaults
 */
export function createLocalConfig(
  apiKey: string,
  port?: number,
  apiVersion?: string
): ClientConfigBuilder {
  const defaultPort = parseNumber(getEnvVar('MIDAZ_LOCAL_PORT'), port || 3000);
  const defaultApiVersion = getEnvVar('MIDAZ_API_VERSION', apiVersion || 'v1') || 'v1';
  
  return createClientConfigBuilder(apiKey)
    .withBaseUrls({
      onboarding: getEnvVar('MIDAZ_ONBOARDING_URL') || `http://localhost:${defaultPort}`,
      transaction: getEnvVar('MIDAZ_TRANSACTION_URL') || `http://localhost:${defaultPort + 1}`,
    })
    .withApiVersion(defaultApiVersion)
    .withDebugMode(parseBool(getEnvVar('MIDAZ_DEBUG'), true));
}

/**
 * Creates a local development configuration builder with Access Manager authentication
 * @returns A new client configuration builder with local development defaults and Access Manager
 */
export function createLocalConfigWithAccessManager(
  config?: {
    address?: string;
    clientId?: string;
    clientSecret?: string;
    tokenEndpoint?: string;
    refreshThresholdSeconds?: number;
  },
  port?: number,
  apiVersion?: string
): ClientConfigBuilder {
  const defaultPort = parseNumber(getEnvVar('MIDAZ_LOCAL_PORT'), port || 3000);
  const defaultApiVersion = getEnvVar('MIDAZ_API_VERSION', apiVersion || 'v1') || 'v1';
  
  const accessManagerConfig = {
    address: config?.address || getEnvVar('PLUGIN_AUTH_ADDRESS') || 'http://localhost:4000',
    clientId: config?.clientId || getEnvVar('MIDAZ_CLIENT_ID') || '',
    clientSecret: config?.clientSecret || getEnvVar('MIDAZ_CLIENT_SECRET') || '',
    tokenEndpoint: config?.tokenEndpoint || getEnvVar('PLUGIN_AUTH_TOKEN_ENDPOINT'),
    refreshThresholdSeconds: config?.refreshThresholdSeconds || parseNumber(getEnvVar('PLUGIN_AUTH_REFRESH_THRESHOLD_SECONDS'), 300),
  };
  
  return createClientConfigWithAccessManager(accessManagerConfig)
    .withBaseUrls({
      onboarding: getEnvVar('MIDAZ_ONBOARDING_URL') || `http://localhost:${defaultPort}`,
      transaction: getEnvVar('MIDAZ_TRANSACTION_URL') || `http://localhost:${defaultPort + 1}`,
    })
    .withApiVersion(defaultApiVersion)
    .withDebugMode(parseBool(getEnvVar('MIDAZ_DEBUG'), true));
}
