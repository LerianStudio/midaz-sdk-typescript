# Configuration Management

The Midaz SDK provides a flexible configuration system that allows you to customize various aspects of the SDK's behavior. This document explains how to configure the SDK for different environments and use cases.

## Client Configuration

The `ClientConfigBuilder` is the primary way to configure the Midaz SDK. It provides a fluent interface for setting various configuration options:

```typescript
import { MidazClient, createClientConfig } from 'midaz-sdk';

const config = createClientConfig()
  .withApiKey('your-api-key')
  .withEnvironment('sandbox')
  .withTimeout(30000)
  .withRetryOptions({
    maxRetries: 3,
    retryDelay: 500,
    exponentialBackoff: true
  })
  .withObservability({
    enabled: true,
    serviceName: 'my-financial-app'
  })
  .build();

const client = new MidazClient(config);
```

## Configuration Options

### Basic Options

```typescript
// Set the API key for authentication
config.withApiKey('your-api-key')

// Set the environment to use (development, sandbox, production)
config.withEnvironment('sandbox')

// Set a custom base URL (overrides environment setting)
config.withBaseUrl('https://custom-api.midaz.io')

// Set a global timeout for all requests (in milliseconds)
config.withTimeout(30000)

// Set a custom user agent
config.withUserAgent('MyApp/1.0')
```

### Retry Configuration

```typescript
// Configure retry behavior
config.withRetryOptions({
  // Maximum number of retry attempts
  maxRetries: 3,
  
  // Base delay between retries (in milliseconds)
  retryDelay: 500,
  
  // Whether to use exponential backoff
  exponentialBackoff: true,
  
  // HTTP status codes that should trigger retries
  retryableStatusCodes: [429, 500, 502, 503, 504],
  
  // Error codes that should trigger retries
  retryableErrorCodes: ['NETWORK_ERROR', 'TIMEOUT', 'SERVER_ERROR']
})
```

### Observability Configuration

```typescript
// Configure observability (tracing, metrics, logging)
config.withObservability({
  // Enable or disable observability
  enabled: true,
  
  // Service name for tracing and metrics
  serviceName: 'my-financial-app',
  
  // Environment name
  environment: 'production',
  
  // Enable or disable tracing
  enableTracing: true,
  
  // Enable or disable metrics
  enableMetrics: true,
  
  // Enable or disable logging
  enableLogging: true,
  
  // Logging level (debug, info, warn, error)
  logLevel: 'info',
  
  // Custom tracer provider (for OpenTelemetry integration)
  tracerProvider: customTracerProvider,
  
  // Custom metric provider
  metricProvider: customMetricProvider,
  
  // Custom logger
  logger: customLogger
})
```

### Advanced HTTP Configuration

```typescript
// Configure HTTP client options
config.withHttpOptions({
  // Additional headers to include with every request
  headers: {
    'Custom-Header': 'custom-value'
  },
  
  // Request timeout in milliseconds
  timeout: 10000,
  
  // Maximum concurrent requests
  maxConcurrentRequests: 10,
  
  // Whether to include credentials in cross-origin requests
  withCredentials: true,
  
  // Custom axios instance
  axiosInstance: customAxiosInstance
})
```

## Environment-Specific Configuration

The SDK provides convenient factory functions for common environments:

```typescript
import { 
  createDevelopmentConfig,
  createSandboxConfig,
  createProductionConfig
} from 'midaz-sdk';

// Development environment
const devConfig = createDevelopmentConfig('dev-api-key');
const devClient = new MidazClient(devConfig);

// Sandbox environment
const sandboxConfig = createSandboxConfig('sandbox-api-key');
const sandboxClient = new MidazClient(sandboxConfig);

// Production environment
const prodConfig = createProductionConfig('prod-api-key');
const prodClient = new MidazClient(prodConfig);
```

## Configuration from Environment Variables

You can load configuration from environment variables:

```typescript
import { loadConfigFromEnvironment } from 'midaz-sdk/util/config';

// Load configuration from environment variables
const config = loadConfigFromEnvironment();
const client = new MidazClient(config);
```

This expects the following environment variables:
- `MIDAZ_API_KEY`: API key for authentication
- `MIDAZ_ENVIRONMENT`: Environment (development, sandbox, production)
- `MIDAZ_TIMEOUT`: Request timeout in milliseconds
- `MIDAZ_RETRY_MAX`: Maximum retry attempts
- `MIDAZ_OBSERVABILITY_ENABLED`: Enable observability (true/false)
- `MIDAZ_SERVICE_NAME`: Service name for observability

## Configuration from File

You can also load configuration from a JSON file:

```typescript
import { loadConfigFromFile } from 'midaz-sdk/util/config';

// Load configuration from a file
const config = loadConfigFromFile('./midaz-config.json');
const client = new MidazClient(config);
```

Example configuration file:
```json
{
  "apiKey": "your-api-key",
  "environment": "sandbox",
  "timeout": 30000,
  "retry": {
    "maxRetries": 3,
    "retryDelay": 500,
    "exponentialBackoff": true
  },
  "observability": {
    "enabled": true,
    "serviceName": "my-financial-app",
    "logLevel": "info"
  }
}
```

## Merging Configurations

You can merge multiple configurations, with later configurations taking precedence:

```typescript
import { mergeConfigs } from 'midaz-sdk/util/config';

// Load base configuration from environment
const envConfig = loadConfigFromEnvironment();

// Load custom overrides from file
const fileConfig = loadConfigFromFile('./midaz-config.json');

// Merge configurations (fileConfig takes precedence over envConfig)
const mergedConfig = mergeConfigs(envConfig, fileConfig);

// Apply additional runtime overrides
const finalConfig = mergeConfigs(mergedConfig, {
  timeout: 60000,
  observability: {
    logLevel: 'debug'
  }
});

const client = new MidazClient(finalConfig);
```

## Per-Request Configuration

You can override global configuration for individual requests:

```typescript
// Global configuration with 30 second timeout
const client = new MidazClient(
  createClientConfig()
    .withApiKey('your-api-key')
    .withTimeout(30000)
    .build()
);

// Make a request with a longer timeout
const result = await client.entities.assets.getAsset(
  orgId,
  ledgerId,
  assetId,
  { timeout: 60000 }  // Override the global timeout for this request
);
```

## Custom HTTP Client

You can provide a custom HTTP client implementation:

```typescript
import { MidazClient, createClientConfig } from 'midaz-sdk';
import { HttpClient } from 'midaz-sdk/util/network';

// Create a custom HTTP client
const httpClient = new HttpClient({
  baseUrl: 'https://api.midaz.io',
  headers: {
    'Custom-Header': 'custom-value'
  },
  timeout: 15000,
  retries: 5
});

// Use the custom HTTP client
const config = createClientConfig()
  .withApiKey('your-api-key')
  .withHttpClient(httpClient)
  .build();

const client = new MidazClient(config);
```

## Multiple Client Instances

You can create multiple client instances with different configurations:

```typescript
// Create a client for sandbox testing
const sandboxClient = new MidazClient(
  createSandboxConfig('sandbox-api-key')
);

// Create a client for production
const productionClient = new MidazClient(
  createProductionConfig('production-api-key')
);

// Use different clients based on context
async function getAsset(assetId, environment) {
  const client = environment === 'production' 
    ? productionClient 
    : sandboxClient;
    
  return client.entities.assets.getAsset(orgId, ledgerId, assetId);
}
```

## Configuration Best Practices

1. **Use Environment-Specific Configurations**: Create separate configurations for development, testing, and production environments.

2. **Centralize Configuration Management**: Define your configuration in a central location and provide it to all components that need it.

3. **Secure API Keys**: Never hardcode API keys in your source code. Use environment variables or secure configuration stores.

4. **Configure Appropriate Timeouts**: Set request timeouts based on expected response times to prevent long-running requests.

5. **Enable Retry for Production**: Always enable retry with exponential backoff for production environments to handle transient failures.

6. **Enable Observability**: Configure observability for production environments to monitor and debug your application.

7. **Override Only What's Necessary**: When customizing configuration, only override the specific options you need to change.

## Complete Configuration Example

```typescript
import { MidazClient, createClientConfig } from 'midaz-sdk';
import { ConsoleLogger } from 'midaz-sdk/util/observability';

// Create a comprehensive configuration
const config = createClientConfig()
  // Basic configuration
  .withApiKey(process.env.MIDAZ_API_KEY)
  .withEnvironment(process.env.NODE_ENV === 'production' ? 'production' : 'sandbox')
  .withTimeout(30000)
  
  // HTTP configuration
  .withHttpOptions({
    headers: {
      'Application-Name': 'MyFinancialApp',
      'Application-Version': '1.0.0'
    },
    maxConcurrentRequests: 10
  })
  
  // Retry configuration
  .withRetryOptions({
    maxRetries: process.env.NODE_ENV === 'production' ? 5 : 2,
    retryDelay: 500,
    exponentialBackoff: true,
    retryableStatusCodes: [429, 500, 502, 503, 504]
  })
  
  // Observability configuration
  .withObservability({
    enabled: true,
    serviceName: 'my-financial-app',
    environment: process.env.NODE_ENV,
    enableTracing: true,
    enableMetrics: true,
    enableLogging: true,
    logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    logger: new ConsoleLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    })
  })
  
  .build();

// Create the client
const client = new MidazClient(config);

export { client };
```
