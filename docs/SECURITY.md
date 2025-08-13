# Security Guide

This document outlines the security features and best practices for using the Midaz SDK.

## Table of Contents

- [Security Features](#security-features)
- [Configuration](#configuration)
- [Best Practices](#best-practices)
- [Threat Model](#threat-model)
- [Reporting Security Issues](#reporting-security-issues)

## Security Features

### 1. Automatic Sanitization

The SDK automatically sanitizes sensitive data in logs and errors using built-in sanitization utilities:

```typescript
// Sensitive fields are automatically redacted in logs and error messages
const client = new MidazClient(
  createClientConfigWithAccessManager({
    address: 'https://auth.example.com',
    clientId: 'client-1234567890', // Will be logged as 'client-****'
    clientSecret: 'secret-abcdef123456', // Will be logged as 'secret-****'
  })
);

// The SDK automatically sanitizes OAuth credentials, API keys, and other sensitive data
// No additional configuration required - sanitization is built-in
```

### 2. HTTPS Enforcement

Configure HTTPS enforcement and certificate validation:

```typescript
const client = new MidazClient(
  createClientConfigWithAccessManager({
    address: 'https://auth.midaz.com', // HTTPS recommended
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  })
    .withBaseUrls({
      onboarding: 'https://api.midaz.com', // HTTPS recommended
    })
    .withSecurity({
      enforceHttps: true, // Enforce HTTPS connections
      allowInsecureHttp: false, // Block HTTP connections
      certificateValidation: {
        enabled: true, // Validate SSL certificates
        rejectUnauthorized: true, // Reject invalid certificates
        minVersion: 'TLSv1.2', // Minimum TLS version
      },
    })
);
```

### 3. Request Authentication

All requests are automatically authenticated using OAuth tokens from PluginAccessManager:

```typescript
// OAuth tokens are securely managed by PluginAccessManager
// Credentials never exposed in URLs or logs
const client = new MidazClient(
  createClientConfigWithAccessManager({
    address: process.env.MIDAZ_AUTH_ADDRESS,
    clientId: process.env.MIDAZ_CLIENT_ID,
    clientSecret: process.env.MIDAZ_CLIENT_SECRET,
  })
);
```

### 4. Circuit Breaker Protection

Protects against cascading failures and provides connection pooling:

```typescript
const client = new MidazClient(
  createClientConfigWithAccessManager({
    address: 'https://auth.example.com',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  })
    .withSecurity({
      circuitBreaker: {
        failureThreshold: 5, // Open circuit after 5 failures
        successThreshold: 2, // Close circuit after 2 successes
        timeout: 60000, // Wait 60s before retry
        rollingWindow: 60000, // Count failures over 60s window
      },
      connectionPool: {
        maxConnectionsPerHost: 6, // Max connections per host
        maxTotalConnections: 20, // Max total connections
        maxQueueSize: 100, // Max queue size per host
        requestTimeout: 30000, // Request timeout in ms
        enableCoalescing: true, // Enable request coalescing
        coalescingWindow: 100, // Coalescing window in ms
      },
      // Per-endpoint circuit breakers
      endpointCircuitBreakers: {
        '/api/v1/accounts': {
          failureThreshold: 3,
          timeout: 30000,
        },
      },
    })
);
```

### 5. Timeout Protection

Prevents hanging requests with timeout budgets:

```typescript
const client = new MidazClient(
  createClientConfigWithAccessManager({
    address: 'https://auth.example.com',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  })
    .withTimeout(30000) // Global timeout: 30 seconds
    .withSecurity({
      timeoutBudget: {
        enabled: true, // Enable timeout budget tracking
        minRequestTimeout: 1000, // Minimum timeout per request: 1 second
        bufferTime: 100, // Buffer between retries: 100ms
      },
    })
);
```

### 6. Complete Security Configuration

Here's a comprehensive example showing all available security features:

```typescript
import { MidazClient, createClientConfigWithAccessManager, RateLimiter } from 'midaz-sdk';

// Create a fully configured secure client
const client = new MidazClient(
  createClientConfigWithAccessManager({
    address: process.env.MIDAZ_AUTH_ADDRESS,
    clientId: process.env.MIDAZ_CLIENT_ID,
    clientSecret: process.env.MIDAZ_CLIENT_SECRET,
  })
    .withBaseUrls({
      onboarding: process.env.MIDAZ_ONBOARDING_URL,
      transaction: process.env.MIDAZ_TRANSACTION_URL,
    })
    .withTimeout(30000)
    .withSecurity({
      // HTTPS enforcement
      enforceHttps: true,
      allowInsecureHttp: false,
      
      // Certificate validation
      certificateValidation: {
        enabled: true,
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2',
        // ca: ['-----BEGIN CERTIFICATE-----...'], // Custom CA if needed
      },
      
      // Connection pool management
      connectionPool: {
        maxConnectionsPerHost: 6,
        maxTotalConnections: 20,
        maxQueueSize: 100,
        requestTimeout: 30000,
        enableCoalescing: true,
        coalescingWindow: 100,
      },
      
      // Global circuit breaker
      circuitBreaker: {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 60000,
        rollingWindow: 60000,
      },
      
      // Per-endpoint circuit breakers
      endpointCircuitBreakers: {
        '/api/v1/accounts': {
          failureThreshold: 3,
          timeout: 30000,
        },
        '/api/v1/transactions': {
          failureThreshold: 2,
          timeout: 45000,
        },
      },
      
      // Timeout budget
      timeoutBudget: {
        enabled: true,
        minRequestTimeout: 1000,
        bufferTime: 100,
      },
    })
    .withRetryPolicy({
      maxRetries: 3,
      initialDelay: 100,
      maxDelay: 1000,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    })
    .withObservability({
      enableTracing: true,
      enableMetrics: true,
      enableLogging: true,
      serviceName: 'my-midaz-app',
    })
);

// Optional: Set up rate limiting
const rateLimiter = new RateLimiter({
  maxRequests: 100,
  timeWindowMs: 60000, // 100 requests per minute
  queueExceeded: true,
  maxQueueSize: 1000,
});
```

## Configuration

### Environment Variables

Store sensitive configuration in environment variables:

```bash
# .env file (never commit to version control)
MIDAZ_AUTH_ADDRESS=https://auth.midaz.com
MIDAZ_CLIENT_ID=your-client-id
MIDAZ_CLIENT_SECRET=your-client-secret
MIDAZ_BASE_URL=https://api.midaz.com
```

```typescript
const client = new MidazClient(
  createClientConfigWithAccessManager({
    address: process.env.MIDAZ_AUTH_ADDRESS,
    clientId: process.env.MIDAZ_CLIENT_ID,
    clientSecret: process.env.MIDAZ_CLIENT_SECRET,
  })
    .withBaseUrls({
      onboarding: process.env.MIDAZ_BASE_URL,
    })
);
```

### Secure Headers

The SDK automatically includes security headers:

- `X-Request-ID`: For request tracing
- `X-Idempotency-Key`: For safe retries
- `User-Agent`: SDK version information

## Best Practices

### 1. OAuth Credential Management

- **Never** hard-code OAuth client secrets in your source code
- Use environment variables or secure key management systems
- Rotate OAuth client credentials regularly
- Use different credentials for different environments
- Leverage PluginAccessManager for automatic token lifecycle management

### 2. Input Validation

Always validate user input before passing to the SDK:

```typescript
// Good: Validate before using
function createAccount(userInput: any) {
  if (!isValidAccountName(userInput.name)) {
    throw new Error('Invalid account name');
  }

  return client.entities.accounts.createAccount(orgId, ledgerId, {
    name: sanitize(userInput.name),
    // ... other fields
  });
}
```

### 3. Error Handling

Handle errors securely without exposing sensitive details:

```typescript
try {
  await client.entities.organizations.createOrganization(data);
} catch (error) {
  // Log full error internally
  logger.error('Failed to create organization', error);

  // Return sanitized error to user
  return {
    error: 'Failed to create organization',
    code: 'ORG_CREATE_FAILED',
  };
}
```

### 4. Network Security

- Always use HTTPS in production
- Configure proper SSL/TLS certificates
- Consider using VPN for additional security
- Implement IP allowlisting where appropriate

### 5. Rate Limiting

Implement client-side rate limiting to prevent abuse using the SDK's rate limiter utility:

```typescript
import { RateLimiter } from 'midaz-sdk';

// Create a rate limiter allowing 10 requests per second
const rateLimiter = new RateLimiter({
  maxRequests: 10,
  timeWindowMs: 1000, // 1 second
  queueExceeded: true,
  maxQueueSize: 100,
});

const client = new MidazClient(
  createClientConfigWithAccessManager({
    address: 'https://auth.example.com',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  })
);

// Apply rate limiting to your requests
async function createAccountWithRateLimit(orgId: string, ledgerId: string, data: any) {
  return await rateLimiter.execute(async () => {
    return client.entities.accounts.createAccount(orgId, ledgerId, data);
  });
}
```

## Threat Model

### Protected Against

1. **Man-in-the-Middle Attacks**: HTTPS enforcement
2. **OAuth Credential Exposure**: Automatic sanitization in logs and secure token management
3. **Replay Attacks**: Idempotency keys and token-based authentication
4. **DoS Attacks**: Circuit breaker and timeouts
5. **Information Disclosure**: Error sanitization

### Not Protected Against

1. **Compromised OAuth Credentials**: Implement credential rotation
2. **Client-Side Attacks**: Validate all inputs
3. **Server-Side Vulnerabilities**: Keep SDK updated

## Reporting Security Issues

If you discover a security vulnerability, please email security@lerianstudio.com with:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

**DO NOT** open public issues for security vulnerabilities.

## Security Checklist

Before deploying to production:

- [ ] OAuth credentials stored securely (not in code)
- [ ] PluginAccessManager configured properly
- [ ] HTTPS enforced (`enforceHttps: true`, `allowInsecureHttp: false`)
- [ ] Certificate validation enabled (`certificateValidation.enabled: true`)
- [ ] Input validation implemented
- [ ] Error handling doesn't expose sensitive data
- [ ] Connection pool limits configured appropriately
- [ ] Circuit breaker thresholds set for your load patterns
- [ ] Timeout values configured (`timeoutBudget` enabled)
- [ ] Rate limiting implemented where needed (using `RateLimiter`)
- [ ] Per-endpoint circuit breakers configured for critical paths
- [ ] Observability enabled for security monitoring
- [ ] Latest SDK version installed
