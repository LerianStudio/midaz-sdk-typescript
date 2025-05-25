/**
 * Observability Utility Example
 *
 * This example demonstrates how to use the observability utilities from the Midaz SDK
 * to implement tracing, logging, and metrics for monitoring and debugging.
 */

import { AttributeValue, Observability } from '../src/util/observability';
import { Logger, LogLevel } from '../src/util/observability/logger';

// Example 1: Basic Tracing
async function basicTracingExample() {
  console.log('\n=== Basic Tracing Example ===');

  // Initialize observability with tracing enabled
  const observability = new Observability({
    enableTracing: true,
    serviceName: 'example-service',
    consoleExporter: true,
  });

  // Start a root span for the entire operation
  const rootSpan = observability.startSpan('process-order');
  rootSpan.setAttribute('example', 'basic-tracing');

  try {
    console.log('Processing order...');

    // Simulate some work with a child span
    const validateSpan = observability.startSpan('validate-order');
    validateSpan.setAttribute('operation', 'validation');

    // Simulate validation
    await simulateWork(500);
    console.log('Order validated');

    // End the validation span
    validateSpan.setStatus('ok');
    validateSpan.end();

    // Create another child span for payment processing
    const paymentSpan = observability.startSpan('process-payment');
    paymentSpan.setAttribute('operation', 'payment');
    paymentSpan.setAttribute('amount', 99.99);

    // Simulate payment processing
    await simulateWork(800);
    console.log('Payment processed');

    // End the payment span
    paymentSpan.setStatus('ok');
    paymentSpan.end();

    // Set the root span status and end it
    rootSpan.setStatus('ok');
    console.log('Order processing completed successfully');
  } catch (error: any) {
    // Record the exception and set error status
    rootSpan.recordException(error);
    rootSpan.setStatus('error', error.message);
    console.error('Error processing order:', error);
  } finally {
    // Always end the root span
    rootSpan.end();
  }
}

// Example 2: Error Handling with Tracing
async function errorHandlingExample() {
  console.log('\n=== Error Handling with Tracing Example ===');

  // Initialize observability
  const observability = new Observability({
    enableTracing: true,
    serviceName: 'example-service',
    consoleExporter: true,
  });

  // Start a root span for the operation
  const rootSpan = observability.startSpan('fetch-user-data');
  rootSpan.setAttribute('example', 'error-handling');

  try {
    console.log('Fetching user data...');

    // Simulate a database operation
    const dbSpan = observability.startSpan('query-database');
    dbSpan.setAttribute('operation', 'database-query');
    dbSpan.setAttribute('table', 'users');

    try {
      // Simulate a database error
      await simulateWork(300);
      throw new Error('Database connection timeout');
    } catch (dbError: any) {
      // Record the database error
      dbSpan.recordException(dbError);
      dbSpan.setStatus('error', dbError.message);
      console.error('Database error:', dbError.message);

      // End the database span
      dbSpan.end();

      // Start a fallback operation
      const fallbackSpan = observability.startSpan('fetch-cached-data');
      fallbackSpan.setAttribute('operation', 'cache-lookup');

      try {
        // Simulate fallback to cache
        await simulateWork(200);
        console.log('Successfully retrieved data from cache');
        fallbackSpan.setStatus('ok');
      } catch (cacheError: any) {
        // Record the cache error
        fallbackSpan.recordException(cacheError);
        fallbackSpan.setStatus('error', cacheError.message);
        console.error('Cache error:', cacheError.message);

        // Re-throw to be caught by the outer try-catch
        throw cacheError;
      } finally {
        // End the fallback span
        fallbackSpan.end();
      }
    }

    // Set the root span status
    rootSpan.setStatus('ok');
    console.log('Operation completed with fallback');
  } catch (error: any) {
    // Record the exception and set error status for the root span
    rootSpan.recordException(error);
    rootSpan.setStatus('error', error.message);
    console.error('Error fetching user data:', error.message);
  } finally {
    // Always end the root span
    rootSpan.end();
  }
}

// Example 3: Structured Logging
function structuredLoggingExample() {
  console.log('\n=== Structured Logging Example ===');

  // Initialize a logger with custom settings
  const logger = new Logger({
    level: LogLevel.DEBUG,
    includeTimestamps: true,
  });

  // Log messages at different levels
  logger.debug('This is a debug message', { component: 'example', operation: 'logging' });
  logger.info('Processing user request', { userId: 'user-123', requestId: 'req-456' });
  logger.warn('API rate limit approaching', { currentRate: 95, limit: 100 });
  logger.error('Failed to connect to database', {
    dbHost: 'db.example.com',
    error: 'Connection refused',
    retryCount: 3,
  });

  // Log with trace context
  const observability = new Observability({
    enableTracing: true,
    enableLogging: true,
    serviceName: 'example-service',
  });

  const span = observability.startSpan('user-authentication');
  span.setAttribute('userId', 'user-123');

  // The logger will automatically include the trace context from the active span
  logger.info('User authentication attempt', { userId: 'user-123', method: 'password' });
  logger.info('User authenticated successfully', { userId: 'user-123', roles: ['user', 'admin'] });

  span.end();
}

// Example 4: Metrics and Performance Monitoring
async function metricsExample() {
  console.log('\n=== Metrics and Performance Monitoring Example ===');

  // Initialize observability with metrics enabled
  const observability = new Observability({
    enableTracing: true,
    enableMetrics: true,
    serviceName: 'example-service',
    consoleExporter: true,
  });

  // Create counters and histograms manually for the example
  let requestCounter = 0;
  const requestDurations: number[] = [];

  // Function to simulate counter increment
  function incrementCounter(attributes: Record<string, AttributeValue>) {
    requestCounter++;
    console.log(`Incremented counter with attributes:`, attributes);
  }

  // Function to simulate recording a histogram value
  function recordDuration(value: number, attributes: Record<string, AttributeValue>) {
    requestDurations.push(value);
    console.log(`Recorded duration ${value}ms with attributes:`, attributes);
  }

  // Simulate processing multiple API requests
  console.log('Processing API requests...');

  for (let i = 1; i <= 5; i++) {
    // Start timing the request
    const startTime = Date.now();

    // Start a span for this request
    const span = observability.startSpan(`request-${i}`);
    span.setAttribute('requestId', `req-${i}`);

    // Increment the request counter with attributes
    incrementCounter({
      method: i % 2 === 0 ? 'GET' : 'POST',
      endpoint: `/api/resource/${i}`,
    });

    // Simulate request processing
    console.log(`Processing request ${i}...`);
    await simulateWork(100 + Math.random() * 400);

    // Calculate the duration
    const duration = Date.now() - startTime;

    // Record the request duration
    recordDuration(duration, {
      method: i % 2 === 0 ? 'GET' : 'POST',
      endpoint: `/api/resource/${i}`,
      status: i % 4 === 0 ? '500' : '200',
    });

    console.log(`Request ${i} completed in ${duration}ms`);

    // End the span
    span.setAttribute('duration_ms', duration);
    span.setStatus('ok');
    span.end();
  }

  console.log('All requests processed');
  console.log(`Total requests: ${requestCounter}`);
  console.log(
    `Average duration: ${requestDurations.reduce((a, b) => a + b, 0) / requestDurations.length}ms`
  );
}

// Example 5: Distributed Tracing
async function distributedTracingExample() {
  console.log('\n=== Distributed Tracing Example ===');

  // Initialize observability
  const observability = new Observability({
    enableTracing: true,
    serviceName: 'frontend-service',
    consoleExporter: true,
  });

  // Start a root span for the frontend request
  const frontendSpan = observability.startSpan('frontend-request');
  frontendSpan.setAttribute('service', 'frontend');
  frontendSpan.setAttribute('requestId', 'req-789');

  console.log('Processing frontend request...');
  await simulateWork(200);

  try {
    // Create a context carrier for propagating trace context
    const contextCarrier: Record<string, string> = {};

    // Simulate injecting context (in a real scenario, this would use the actual inject method)
    console.log('Propagating trace context to backend service');

    // Simulate a call to a backend service
    await callBackendService(contextCarrier);

    frontendSpan.setStatus('ok');
    console.log('Frontend request completed successfully');
  } catch (error: any) {
    frontendSpan.recordException(error);
    frontendSpan.setStatus('error', error.message);
    console.error('Frontend request failed:', error.message);
  } finally {
    frontendSpan.end();
  }

  // Helper function to simulate a backend service call
  async function callBackendService(_contextCarrier: Record<string, string>) {
    // In a real scenario, this would be a separate service
    // Initialize observability for the backend service
    const backendObservability = new Observability({
      enableTracing: true,
      serviceName: 'backend-service',
      consoleExporter: true,
    });

    // Simulate extracting context (in a real scenario, this would use the actual extract method)
    console.log('Extracting trace context in backend service');

    // Start a span for the backend operation, linked to the frontend span
    const backendSpan = backendObservability.startSpan('backend-operation');

    backendSpan.setAttribute('service', 'backend');

    console.log('Processing in backend service...');

    try {
      // Simulate backend processing
      await simulateWork(500);

      // Simulate a database call
      const dbSpan = backendObservability.startSpan('database-query');

      dbSpan.setAttribute('database', 'users-db');
      dbSpan.setAttribute('query', 'SELECT * FROM users');

      await simulateWork(300);

      dbSpan.setStatus('ok');
      dbSpan.end();

      backendSpan.setStatus('ok');
      console.log('Backend processing completed');
    } catch (error: any) {
      backendSpan.recordException(error);
      backendSpan.setStatus('error', error.message);
      throw error;
    } finally {
      backendSpan.end();
    }
  }
}

// Helper function to simulate asynchronous work
function simulateWork(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run the examples
async function runExamples() {
  try {
    await basicTracingExample();
    await errorHandlingExample();
    structuredLoggingExample();
    await metricsExample();
    await distributedTracingExample();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Execute if this file is run directly
if (require.main === module) {
  runExamples();
}
