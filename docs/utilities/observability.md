# Observability

The Midaz SDK provides comprehensive observability features to help you monitor, debug, and analyze your application's interactions with the SDK. This document explains how to use and configure these observability features.

## Overview

The observability system in the Midaz SDK includes:

- **Distributed Tracing**: Track operations across service boundaries
- **Metrics Collection**: Record key performance indicators
- **Structured Logging**: Provide context-rich logging
- **OpenTelemetry Integration**: Compatibility with standard observability tools

## Basic Usage

The observability features are automatically enabled when you initialize the SDK:

```typescript
import { MidazClient, ClientConfigBuilder } from 'midaz-sdk';

const client = new MidazClient(
  new ClientConfigBuilder()
    .withApiKey('your-api-key')
    .withEnvironment('sandbox')
    .withObservabilityConfig({
      serviceName: 'my-application',
      enabled: true,
      tracingEnabled: true,
      metricsEnabled: true,
      loggingEnabled: true
    })
    .build()
);
```

## Configuration

You can configure the observability system to meet your specific requirements:

```typescript
const client = new MidazClient(
  new ClientConfigBuilder()
    .withApiKey('your-api-key')
    .withEnvironment('sandbox')
    .withObservabilityConfig({
      serviceName: 'my-application',
      enabled: true,
      tracingEnabled: true,
      metricsEnabled: true,
      loggingEnabled: true,
      tracingExporter: 'jaeger',
      tracingEndpoint: 'http://jaeger:14268/api/traces',
      metricsExporter: 'prometheus',
      metricsEndpoint: 'http://prometheus:9090/metrics',
      loggingLevel: 'info',
      samplingRate: 0.1, // Sample 10% of traces
      attributes: {
        environment: 'production',
        version: '1.0.0'
      }
    })
    .build()
);
```

## Tracing

Tracing allows you to monitor the flow of requests through your application and the SDK:

```typescript
// Get the observability instance
const observability = client.getObservability();

// Create a manual span for a custom operation
const span = observability.startSpan('custom-operation');
span.setAttribute('customAttribute', 'value');

try {
  // Perform your operation...
  span.setStatus({ code: 'ok' });
} catch (error) {
  span.setStatus({ code: 'error', message: error.message });
  span.recordException(error);
  throw error;
} finally {
  span.end();
}
```

## Metrics

You can record custom metrics to monitor performance and behavior:

```typescript
// Record a counter metric
observability.recordMetric('requests.total', 1, {
  operation: 'createAsset',
  status: 'success'
});

// Record a measure metric
observability.recordMetric('operation.duration', 235, {
  operation: 'createAsset'
});
```

## Logging

The observability system provides structured logging capabilities:

```typescript
// Get the logger
const logger = observability.getLogger();

// Log at different levels
logger.debug('Detailed debug information', { context: 'asset-creation' });
logger.info('Operation completed successfully', { assetId: 'asset123' });
logger.warn('Potential issue detected', { warning: 'Slow response time' });
logger.error('Operation failed', { error: 'Network timeout', retryCount: 3 });
```

## Automatic SDK Instrumentation

The SDK automatically instruments key operations:

1. **Client Initialization**: Traces the initialization process
2. **API Requests**: Creates spans for all API requests
3. **Entity Operations**: Traces entity service method calls
4. **Error Handling**: Records exceptions and error details
5. **Transaction Processing**: Detailed spans for transaction processing

## OpenTelemetry Integration

The SDK's observability system is built on OpenTelemetry standards, allowing integration with popular observability tools:

```typescript
// Configure integration with external systems
const client = new MidazClient(
  new ClientConfigBuilder()
    .withApiKey('your-api-key')
    .withEnvironment('sandbox')
    .withObservabilityConfig({
      // Connect to Jaeger for tracing
      tracingExporter: 'jaeger',
      tracingEndpoint: 'http://jaeger:14268/api/traces',
      
      // Connect to Prometheus for metrics
      metricsExporter: 'prometheus',
      metricsEndpoint: 'http://prometheus:9090/metrics',
      
      // Connect to ELK stack for logging
      loggingExporter: 'elasticsearch',
      loggingEndpoint: 'http://elasticsearch:9200'
    })
    .build()
);
```

## Context Propagation

For distributed systems, context propagation ensures trace continuity across services:

```typescript
// Extract context to pass to another service
const currentContext = observability.getCurrentContext();
const serializedContext = observability.serializeContext(currentContext);

// In another service or process:
const extractedContext = observability.deserializeContext(serializedContext);
observability.withContext(extractedContext, () => {
  // This operation will be connected to the original trace
  const span = observability.startSpan('continuation-operation');
  // ...
  span.end();
});
```

## Best Practices

1. **Use Semantic Conventions**

   Follow OpenTelemetry semantic conventions for span and attribute naming:

   ```typescript
   // Good
   span.setAttribute('db.system', 'postgresql');
   span.setAttribute('db.operation', 'select');

   // Instead of
   span.setAttribute('database-type', 'postgres');
   span.setAttribute('query-type', 'select');
   ```

2. **Include Relevant Context**

   Add context to spans and logs to aid troubleshooting:

   ```typescript
   span.setAttribute('organization.id', organizationId);
   span.setAttribute('ledger.id', ledgerId);
   span.setAttribute('transaction.amount', amount);
   ```

3. **Set Appropriate Sampling Rates**

   Configure sampling based on your environment and needs:

   ```typescript
   // Development: capture everything
   samplingRate: 1.0

   // Production: sample a percentage
   samplingRate: 0.1 // 10% of traces
   ```

4. **Use Baggage for Context Propagation**

   Use baggage to pass relevant metadata across service boundaries:

   ```typescript
   observability.setBaggage('correlation.id', correlationId);
   ```

5. **Monitor SDK Performance**

   Pay attention to SDK-generated metrics for performance tuning:

   ```
   midaz.sdk.request.duration
   midaz.sdk.request.errors
   midaz.sdk.retry.count
   ```
