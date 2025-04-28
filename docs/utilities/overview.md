# Utilities Overview

The Midaz SDK provides a robust set of utilities that handle cross-cutting concerns across the entire SDK. These utilities are designed to be reusable, consistent, and help implement best practices throughout your application.

## Available Utility Packages

The SDK's utility layer is organized into several focused modules:

### Network Utilities

The network utilities provide a consistent way to interact with HTTP APIs, including retry logic, timeouts, and error handling.

**Key Components:**
- `HttpClient`: A wrapper around Axios for making HTTP requests
- Retry policies for handling transient failures
- Request/response interceptors for consistent handling

```typescript
import { HttpClient } from 'midaz-sdk/util/network';

const httpClient = new HttpClient({
  baseUrl: 'https://api.example.com',
  timeout: 10000,
  retries: 3
});

const response = await httpClient.get('/resources/123');
```

### Observability Utilities

Observability utilities provide tracing, metrics, and logging capabilities to monitor and debug your application.

**Key Components:**
- `Observability`: Central class for managing all observability aspects
- `Tracer`: Distributed tracing functionality
- `Metrics`: Metrics collection and reporting
- `Logger`: Structured logging

```typescript
import { Observability } from 'midaz-sdk/util/observability';

const observability = new Observability({
  serviceName: 'my-service',
  enableTracing: true,
  enableMetrics: true
});

// Create a span for tracking an operation
const span = observability.startSpan('createAsset');
try {
  // Perform operation
  span.setStatus('ok');
} catch (error) {
  span.recordException(error);
  span.setStatus('error');
  throw error;
} finally {
  span.end();
}
```

### Error Handling Utilities

Error handling utilities provide enhanced error recovery and circuit breaking capabilities.

**Key Components:**
- `withEnhancedRecovery`: Function for implementing retry and recovery strategies
- `CircuitBreaker`: Prevents cascading failures in distributed systems

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util/error';

const result = await withEnhancedRecovery(
  () => client.entities.transactions.createTransaction(orgId, ledgerId, transaction),
  {
    retries: 3,
    exponentialBackoff: true
  }
);
```

### Data Processing Utilities

Utilities for data transformation, validation, and processing.

**Key Components:**
- Pagination helpers for handling list responses
- Data transformation utilities
- Serialization/deserialization helpers

```typescript
import { processPaginatedResults } from 'midaz-sdk/util/data';

// Process all pages of results automatically
const allAssets = await processPaginatedResults(
  (options) => client.entities.assets.listAssets(orgId, ledgerId, options)
);
```

### Validation Utilities

Utilities for validating input data and ensuring data integrity.

**Key Components:**
- Schema validators
- Type guards and assertions
- Common validation functions

```typescript
import { validateModel, isValidAssetCode } from 'midaz-sdk/util/validation';

// Validate a model against its schema
const validationResult = validateModel(assetInput);
if (!validationResult.valid) {
  console.error('Validation errors:', validationResult.errors);
}

// Check if an asset code is valid
if (!isValidAssetCode(code)) {
  throw new Error(`Invalid asset code: ${code}`);
}
```

### Configuration Utilities

Utilities for managing configuration across the SDK.

**Key Components:**
- Environment-specific configuration
- Configuration validation
- Secure credential management

```typescript
import { loadConfig, mergeConfigs } from 'midaz-sdk/util/config';

// Load configuration from environment
const envConfig = loadConfig();

// Merge with custom overrides
const config = mergeConfigs(envConfig, {
  apiKey: 'custom-key',
  timeout: 15000
});
```

## Best Practices

1. **Use Enhanced Recovery for Critical Operations**
   Always wrap critical operations with `withEnhancedRecovery` to handle transient failures gracefully.

2. **Leverage Observability**
   Instrument your code with tracing and metrics to gain visibility into your application's behavior.

3. **Validate Inputs**
   Use validation utilities to ensure data integrity before sending requests to the API.

4. **Configure for Your Environment**
   Tailor configuration settings to match your specific deployment environment.

5. **Handle Pagination Correctly**
   Use the provided pagination utilities to efficiently process large result sets.

## Example: Comprehensive Utility Usage

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util/error';
import { Observability } from 'midaz-sdk/util/observability';
import { validateModel } from 'midaz-sdk/util/validation';

// Initialize observability
const observability = new Observability({ serviceName: 'my-financial-app' });

// Create a transaction with full observability and error handling
async function createRobustTransaction(client, orgId, ledgerId, transactionInput) {
  // Validate the input
  const validationResult = validateModel(transactionInput);
  if (!validationResult.valid) {
    throw new Error(`Invalid transaction: ${validationResult.errors.join(', ')}`);
  }

  // Create a span for this operation
  const span = observability.startSpan('createTransaction');
  span.setAttribute('orgId', orgId);
  span.setAttribute('ledgerId', ledgerId);

  try {
    // Execute with enhanced recovery
    const result = await withEnhancedRecovery(
      () => client.entities.transactions.createTransaction(orgId, ledgerId, transactionInput),
      {
        retries: 3,
        exponentialBackoff: true,
        verification: async (tx) => {
          // Verify the transaction was created correctly
          return tx && tx.id && tx.status === 'completed';
        }
      }
    );

    // Record metrics
    observability.recordMetric('transaction.create.success', 1, {
      orgId,
      ledgerId
    });

    span.setStatus('ok');
    return result.data;
  } catch (error) {
    // Record error
    observability.recordMetric('transaction.create.error', 1, {
      orgId,
      ledgerId,
      errorCode: error.code || 'unknown'
    });

    span.recordException(error);
    span.setStatus('error', error.message);
    throw error;
  } finally {
    span.end();
  }
}
```
