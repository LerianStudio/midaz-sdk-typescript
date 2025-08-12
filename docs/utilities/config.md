# Configuration

The Midaz SDK provides a centralized configuration management system through the `ConfigService`. This service provides a consistent way to manage configuration settings and environment variables across the SDK.

## Configuration Service

The `ConfigService` is a singleton that manages all SDK configuration:

```typescript
import { ConfigService } from 'midaz-sdk/util/config';

// Get the global configuration instance
const config = ConfigService.getInstance();
```

### Getting Configuration

You can retrieve specific configuration groups:

```typescript
// Get API URL configuration
const apiUrlConfig = config.getApiUrlConfig();
console.log('Onboarding URL:', apiUrlConfig.onboardingUrl);
console.log('Transaction URL:', apiUrlConfig.transactionUrl);

// Get retry policy configuration
const retryConfig = config.getRetryPolicyConfig();
console.log('Max retries:', retryConfig.maxRetries);
console.log('Initial delay:', retryConfig.initialDelay);

// Get HTTP client configuration
const httpConfig = config.getHttpClientConfig();
console.log('Request timeout:', httpConfig.timeout);
console.log('Debug mode:', httpConfig.debug);

// Get observability configuration
const obsConfig = config.getObservabilityConfig();
console.log('Tracing enabled:', obsConfig.enableTracing);
console.log('Service name:', obsConfig.serviceName);
```

### Overriding Configuration

You can override default configuration settings programmatically:

```typescript
import { ConfigService } from 'midaz-sdk/util/config';

// Override configuration settings
ConfigService.configure({
  // Override API URLs
  apiUrls: {
    onboardingUrl: 'https://custom-api.example.com/v1/onboarding',
    transactionUrl: 'https://custom-api.example.com/v1/transaction',
  },

  // Override retry policy settings
  retryPolicy: {
    maxRetries: 5,
    initialDelay: 200,
    maxDelay: 5000,
  },

  // Override HTTP client settings
  httpClient: {
    timeout: 30000,
    debug: true,
    keepAlive: true,
    maxSockets: 20,
  },

  // Override observability settings
  observability: {
    enableTracing: true,
    enableMetrics: true,
    serviceName: 'my-custom-service',
    collectorEndpoint: 'https://otel-collector.example.com',
  },
});
```

### Resetting Configuration

You can reset all configuration overrides to default values:

```typescript
import { ConfigService } from 'midaz-sdk/util/config';

// Reset all configuration overrides
ConfigService.reset();
```

## Configuration Options

### API URLs Configuration

The `ApiUrlConfig` interface defines the available API URL settings:

```typescript
interface ApiUrlConfig {
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
   * Base URL for the API (legacy)
   * @default "http://localhost:3000"
   */
  apiUrl: string;
}
```

### Retry Policy Configuration

The `RetryPolicyConfig` interface defines the available retry policy settings:

```typescript
interface RetryPolicyConfig {
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
```

### HTTP Client Configuration

The `HttpConfig` interface defines the available HTTP client settings:

```typescript
interface HttpConfig {
  /**
   * Request timeout in milliseconds
   * @default 10000
   */
  timeout: number;

  /**
   * API key for authentication
   */
  apiKey?: string;

  /**
   * Enable debug mode for HTTP client
   * @default false
   */
  debug: boolean;

  /**
   * Enable connection keep-alive
   * @default true
   */
  keepAlive: boolean;

  /**
   * Maximum number of sockets to allow per host
   * @default 10
   */
  maxSockets: number;

  /**
   * Time in milliseconds to keep sockets alive
   * @default 1000
   */
  keepAliveMsecs: number;

  /**
   * Enable HTTP/2 support
   * @default false
   */
  enableHttp2: boolean;

  /**
   * DNS cache TTL in milliseconds
   * @default 60000 (1 minute)
   */
  dnsCacheTtl: number;
}
```

### Observability Configuration

The `ObservabilityConfig` interface defines the available observability settings:

```typescript
interface ObservabilityConfig {
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
   */
  collectorEndpoint?: string;
}
```

## Environment Variables

The configuration service automatically reads from environment variables. Here are the key environment variables you can set:

| Environment Variable        | Description                      | Default                   |
| --------------------------- | -------------------------------- | ------------------------- |
| `MIDAZ_ONBOARDING_URL`      | Base URL for onboarding service  | `http://localhost:3000`   |
| `MIDAZ_TRANSACTION_URL`     | Base URL for transaction service | `http://localhost:3001`   |
| `MIDAZ_API_URL`             | Base URL for API (legacy)        | `http://localhost:3000`   |
| `MIDAZ_HTTP_TIMEOUT`        | HTTP request timeout in ms       | `10000`                   |
| `MIDAZ_HTTP_DEBUG`          | Enable HTTP debug logging        | `false`                   |
| `MIDAZ_HTTP_KEEP_ALIVE`     | Enable HTTP keep-alive           | `true`                    |
| `MIDAZ_HTTP_MAX_SOCKETS`    | Max sockets per host             | `10`                      |
| `MIDAZ_HTTP_KEEP_ALIVE_MS`  | Keep-alive time in ms            | `1000`                    |
| `MIDAZ_HTTP_ENABLE_HTTP2`   | Enable HTTP/2 support            | `false`                   |
| `MIDAZ_DNS_CACHE_TTL`       | DNS cache TTL in ms              | `60000`                   |
| `MIDAZ_RETRY_MAX_RETRIES`   | Maximum retry attempts           | `3`                       |
| `MIDAZ_RETRY_INITIAL_DELAY` | Initial retry delay in ms        | `100`                     |
| `MIDAZ_RETRY_MAX_DELAY`     | Maximum retry delay in ms        | `1000`                    |
| `MIDAZ_RETRY_STATUS_CODES`  | Retryable HTTP status codes      | `408,429,500,502,503,504` |
| `MIDAZ_ENABLE_TRACING`      | Enable distributed tracing       | `false`                   |
| `MIDAZ_ENABLE_METRICS`      | Enable metrics collection        | `false`                   |
| `MIDAZ_ENABLE_LOGGING`      | Enable structured logging        | `false`                   |
| `MIDAZ_SERVICE_NAME`        | Service name for observability   | `midaz-typescript-sdk`    |
| `MIDAZ_COLLECTOR_ENDPOINT`  | OpenTelemetry collector endpoint |                           |

## Examples

### Creating a Client with Environment Variables

```typescript
// Set environment variables
process.env.MIDAZ_ONBOARDING_URL = 'https://api.example.com/v1/onboarding';
process.env.MIDAZ_TRANSACTION_URL = 'https://api.example.com/v1/transaction';
process.env.MIDAZ_HTTP_TIMEOUT = '30000';
process.env.MIDAZ_RETRY_MAX_RETRIES = '5';

// Create a client that will use the environment variables
import { createClient } from 'midaz-sdk';
const client = createClient();
```

### Combining Configuration Approaches

```typescript
import { ConfigService } from 'midaz-sdk/util/config';
import { createClient } from 'midaz-sdk';

// Set some settings via environment variables
process.env.MIDAZ_ENABLE_TRACING = 'true';
process.env.MIDAZ_SERVICE_NAME = 'my-service';

// Override other settings programmatically
ConfigService.configure({
  apiUrls: {
    onboardingUrl: 'https://api.example.com/v1/onboarding',
    transactionUrl: 'https://api.example.com/v1/transaction',
  },
  httpClient: {
    timeout: 30000,
    debug: true,
  },
});

// Create a client that will use both environment variables and programmatic configuration
const client = createClient();
```

### Custom Environment Configuration

```typescript
import { ConfigService } from 'midaz-sdk/util/config';

// Set up different configurations for different environments
function setupEnvironment(env: 'development' | 'staging' | 'production') {
  if (env === 'development') {
    ConfigService.configure({
      apiUrls: {
        onboardingUrl: 'http://localhost:3000',
        transactionUrl: 'http://localhost:3001',
      },
      httpClient: {
        debug: true,
        timeout: 60000, // longer timeout for development
      },
      observability: {
        enableTracing: true,
        enableLogging: true,
      },
    });
  } else if (env === 'staging') {
    ConfigService.configure({
      apiUrls: {
        onboardingUrl: 'https://api-staging.example.com/v1/onboarding',
        transactionUrl: 'https://api-staging.example.com/v1/transaction',
      },
      retryPolicy: {
        maxRetries: 5,
      },
    });
  } else if (env === 'production') {
    ConfigService.configure({
      apiUrls: {
        onboardingUrl: 'https://api.example.com/v1/onboarding',
        transactionUrl: 'https://api.example.com/v1/transaction',
      },
      retryPolicy: {
        maxRetries: 3,
        initialDelay: 200,
      },
      observability: {
        enableTracing: true,
        enableMetrics: true,
        collectorEndpoint: 'https://otel-collector.example.com',
      },
    });
  }
}

// Usage
setupEnvironment('staging');
import { createClient } from 'midaz-sdk';
const client = createClient();
```
