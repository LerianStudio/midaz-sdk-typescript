# Observability Utility

The Observability utility in the Midaz SDK provides comprehensive tracing, metrics, and logging capabilities to monitor and debug your financial applications.

## Overview

Observability is a critical aspect of financial applications, enabling developers to understand system behavior, diagnose issues, and monitor performance. The Midaz SDK's observability utilities provide:

1. **Distributed Tracing**: Track operations across service boundaries
2. **Metrics Collection**: Record key performance indicators
3. **Structured Logging**: Generate context-rich log entries
4. **OpenTelemetry Integration**: Compatibility with standard observability tools

## Basic Usage

### Initialization

The observability utilities can be configured during client initialization:

```typescript
import { MidazClient, createClientConfig } from 'midaz-sdk';

const config = createClientConfig()
  .withApiKey('your-api-key')
  .withObservability({
    enabled: true,
    serviceName: 'my-financial-app',
    environment: 'production',
    enableTracing: true,
    enableMetrics: true,
    enableLogging: true
  })
  .build();

const client = new MidazClient(config);
```

### Accessing Observability

You can access the observability instance directly from the client:

```typescript
const observability = client.getObservability();
```

Alternatively, you can create a standalone instance:

```typescript
import { Observability } from 'midaz-sdk/util/observability';

const observability = new Observability({
  serviceName: 'my-financial-app',
  environment: 'production',
  enableTracing: true,
  enableMetrics: true,
  enableLogging: true
});
```

## Tracing

Tracing allows you to track operations and their sub-operations across your application.

### Creating Spans

```typescript
// Start a new span
const span = observability.startSpan('createAsset');

// Add attributes to the span
span.setAttribute('organizationId', orgId);
span.setAttribute('ledgerId', ledgerId);
span.setAttribute('assetName', asset.name);

try {
  // Perform your operation
  const result = await client.entities.assets.createAsset(
    orgId, ledgerId, asset
  );
  
  // Set status to success
  span.setStatus('ok');
  return result;
} catch (error) {
  // Record the exception
  span.recordException(error);
  
  // Set status to error
  span.setStatus('error', error.message);
  throw error;
} finally {
  // Always end the span
  span.end();
}
```

### Creating Child Spans

```typescript
// Parent operation span
const operationSpan = observability.startSpan('batchOperation');

try {
  // First child span
  const validationSpan = observability.startSpan('validateInputs', { parent: operationSpan });
  try {
    // Validation logic
    validateInputs(data);
    validationSpan.setStatus('ok');
  } catch (error) {
    validationSpan.recordException(error);
    validationSpan.setStatus('error', error.message);
    throw error;
  } finally {
    validationSpan.end();
  }
  
  // Second child span
  const processSpan = observability.startSpan('processData', { parent: operationSpan });
  try {
    // Processing logic
    processData(data);
    processSpan.setStatus('ok');
  } catch (error) {
    processSpan.recordException(error);
    processSpan.setStatus('error', error.message);
    throw error;
  } finally {
    processSpan.end();
  }
  
  operationSpan.setStatus('ok');
} catch (error) {
  operationSpan.recordException(error);
  operationSpan.setStatus('error', error.message);
  throw error;
} finally {
  operationSpan.end();
}
```

## Metrics

Metrics allow you to record and monitor key performance indicators and business metrics.

### Recording Counters

```typescript
// Record a count of transactions created
observability.recordMetric('transactions.created', 1, {
  organizationId: orgId,
  ledgerId: ledgerId,
  transactionType: 'transfer'
});

// Record the transaction amount
observability.recordMetric('transaction.amount', 1000, {
  organizationId: orgId,
  ledgerId: ledgerId,
  assetId: assetId,
  transactionType: 'transfer'
});
```

### Recording Timers

```typescript
// Start timing an operation
const startTime = Date.now();

// Perform the operation
await performOperation();

// Record the duration
const duration = Date.now() - startTime;
observability.recordMetric('operation.duration', duration, {
  operationType: 'asset.create'
});
```

### Custom Metric Recording

```typescript
// Record a gauge metric
observability.recordGauge('account.balance', 5000, {
  organizationId: orgId,
  accountId: accountId,
  assetId: assetId
});

// Increment a counter
observability.incrementCounter('api.calls', {
  endpoint: 'create-transaction',
  status: 'success'
});
```

## Logging

The SDK provides structured logging capabilities to generate context-rich log entries.

### Basic Logging

```typescript
// Log at different levels
observability.logger.debug('Debugging information', { context: 'initialization' });
observability.logger.info('Operation completed successfully', { operationId: '123' });
observability.logger.warn('Retrying failed operation', { attempt: 2, error: 'timeout' });
observability.logger.error('Operation failed', { error: err, operationId: '123' });
```

### Contextual Logging

```typescript
// Create a logger with context
const txLogger = observability.logger.withContext({
  organizationId: orgId,
  transactionId: txId
});

// Log with the pre-filled context
txLogger.info('Transaction started');
txLogger.info('Transaction validated');
txLogger.info('Transaction completed', { status: 'success' });
```

## OpenTelemetry Integration

The SDK's observability utilities integrate with OpenTelemetry for standardized observability.

### Exporting to OpenTelemetry

```typescript
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

// Create a tracer provider
const tracerProvider = new NodeTracerProvider();

// Set up an exporter to send spans to your observability platform
const otlpExporter = new OTLPTraceExporter({
  url: 'https://your-otlp-endpoint/v1/traces'
});

// Register the exporter with a batch processor
tracerProvider.addSpanProcessor(new BatchSpanProcessor(otlpExporter));

// Initialize the provider
tracerProvider.register();

// Configure the SDK to use OpenTelemetry
const config = createClientConfig()
  .withApiKey('your-api-key')
  .withObservability({
    enabled: true,
    serviceName: 'my-financial-app',
    tracerProvider: tracerProvider
  })
  .build();

const client = new MidazClient(config);
```

## Best Practices

### Effective Span Management

1. **Name spans clearly**: Use descriptive names (e.g., `createAsset`, `validateTransaction`)
2. **Add relevant attributes**: Include IDs and parameters that help with debugging
3. **Always end spans**: Use `try/finally` to ensure spans are always ended
4. **Use child spans**: Break down complex operations into child spans

### Meaningful Metrics

1. **Standardize metric names**: Use consistent naming conventions (e.g., `entity.operation`)
2. **Include relevant dimensions**: Add tags that allow filtering and segmentation
3. **Record business metrics**: Track important business events, not just technical metrics
4. **Use appropriate metric types**: Use counters for events, gauges for values that can go up or down

### Structured Logging

1. **Include context in logs**: Always add relevant IDs and parameters
2. **Use appropriate log levels**: Reserve `error` for actual errors, use `debug` for detailed info
3. **Limit sensitive information**: Don't log sensitive data like API keys or personal information
4. **Be consistent with formats**: Standardize log formats across your application

## Complete Example

Here's a comprehensive example showing how to use observability throughout an operation:

```typescript
import { Observability } from 'midaz-sdk/util/observability';
import { createTransactionBuilder } from 'midaz-sdk';

async function createRobustTransaction(
  client, orgId, ledgerId, sourceAccountId, destinationAccountId, assetId, amount
) {
  // Get observability from client or create a new instance
  const observability = client.getObservability();
  
  // Create a root span for the operation
  const rootSpan = observability.startSpan('createRobustTransaction');
  rootSpan.setAttribute('organizationId', orgId);
  rootSpan.setAttribute('ledgerId', ledgerId);
  rootSpan.setAttribute('amount', amount);
  rootSpan.setAttribute('assetId', assetId);
  
  try {
    // Create child span for input validation
    const validationSpan = observability.startSpan('validateTransactionInputs', { parent: rootSpan });
    try {
      // Validation logic
      if (!orgId || !ledgerId || !sourceAccountId || !destinationAccountId || !assetId || amount <= 0) {
        throw new Error('Invalid transaction inputs');
      }
      
      // Log validation success
      observability.logger.debug('Transaction inputs validated', {
        orgId, ledgerId, sourceAccountId, destinationAccountId, assetId, amount
      });
      
      validationSpan.setStatus('ok');
    } catch (error) {
      validationSpan.recordException(error);
      validationSpan.setStatus('error', error.message);
      observability.logger.error('Transaction validation failed', { error: error.message });
      throw error;
    } finally {
      validationSpan.end();
    }
    
    // Create child span for building transaction
    const buildSpan = observability.startSpan('buildTransaction', { parent: rootSpan });
    let transaction;
    try {
      // Build the transaction
      transaction = createTransactionBuilder()
        .withEntries([
          {
            accountId: sourceAccountId,
            assetId: assetId,
            amount: -amount,
            type: 'debit'
          },
          {
            accountId: destinationAccountId,
            assetId: assetId,
            amount: amount,
            type: 'credit'
          }
        ])
        .withMetadata({ reference: `TRANSFER-${Date.now()}` })
        .build();
      
      buildSpan.setStatus('ok');
      observability.logger.debug('Transaction built successfully');
    } catch (error) {
      buildSpan.recordException(error);
      buildSpan.setStatus('error', error.message);
      observability.logger.error('Transaction build failed', { error: error.message });
      throw error;
    } finally {
      buildSpan.end();
    }
    
    // Create child span for executing transaction
    const executeSpan = observability.startSpan('executeTransaction', { parent: rootSpan });
    try {
      // Start timer for performance measurement
      const startTime = Date.now();
      
      // Execute the transaction
      const result = await client.entities.transactions.createTransaction(
        orgId, ledgerId, transaction
      );
      
      // Record metrics
      const duration = Date.now() - startTime;
      observability.recordMetric('transaction.duration', duration, {
        organizationId: orgId,
        ledgerId: ledgerId
      });
      
      observability.incrementCounter('transaction.count', {
        organizationId: orgId,
        ledgerId: ledgerId,
        status: 'success'
      });
      
      observability.recordMetric('transaction.amount', amount, {
        organizationId: orgId,
        ledgerId: ledgerId,
        assetId: assetId
      });
      
      // Log success
      observability.logger.info('Transaction created successfully', {
        transactionId: result.id,
        orgId,
        ledgerId
      });
      
      executeSpan.setStatus('ok');
      rootSpan.setStatus('ok');
      
      return result;
    } catch (error) {
      executeSpan.recordException(error);
      executeSpan.setStatus('error', error.message);
      
      // Record failure metric
      observability.incrementCounter('transaction.count', {
        organizationId: orgId,
        ledgerId: ledgerId,
        status: 'failure',
        errorType: error.code || 'unknown'
      });
      
      observability.logger.error('Transaction creation failed', {
        error: error.message,
        orgId,
        ledgerId
      });
      
      throw error;
    } finally {
      executeSpan.end();
    }
  } catch (error) {
    rootSpan.recordException(error);
    rootSpan.setStatus('error', error.message);
    throw error;
  } finally {
    rootSpan.end();
  }
}
```
