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

The SDK automatically sanitizes sensitive data in logs and errors:

```typescript
// Sensitive fields are automatically redacted
const client = new MidazClient({
  apiKey: 'sk-1234567890', // Will be logged as 'sk-****'
  security: {
    sanitizer: {
      customPatterns: [/custom-secret/gi],
      customFields: ['mySecretField'],
    },
  },
});
```

### 2. HTTPS Enforcement

By default, the SDK enforces HTTPS connections:

```typescript
const client = new MidazClient({
  baseUrls: {
    onboarding: 'https://api.midaz.com', // HTTPS required
  },
  security: {
    enforceHttps: true, // Default: true
    allowInsecureHttp: false, // Must explicitly allow HTTP
  },
});
```

### 3. Request Signing

All requests are automatically signed with your API key:

```typescript
// API key is securely transmitted in headers
// Never exposed in URLs or logs
const client = new MidazClient({
  apiKey: process.env.MIDAZ_API_KEY,
});
```

### 4. Circuit Breaker Protection

Protects against cascading failures:

```typescript
const client = new MidazClient({
  security: {
    circuitBreaker: {
      failureThreshold: 5,
      timeout: 60000,
      rollingWindow: 60000,
    },
  },
});
```

### 5. Timeout Protection

Prevents hanging requests:

```typescript
const client = new MidazClient({
  timeout: 30000, // 30 seconds
  security: {
    timeoutBudget: {
      enabled: true,
      minRequestTimeout: 1000,
    },
  },
});
```

## Configuration

### Environment Variables

Store sensitive configuration in environment variables:

```bash
# .env file (never commit to version control)
MIDAZ_API_KEY=sk-your-api-key
MIDAZ_BASE_URL=https://api.midaz.com
```

```typescript
const client = new MidazClient({
  apiKey: process.env.MIDAZ_API_KEY,
  baseUrls: {
    onboarding: process.env.MIDAZ_BASE_URL,
  },
});
```

### Secure Headers

The SDK automatically includes security headers:

- `X-Request-ID`: For request tracing
- `X-Idempotency-Key`: For safe retries
- `User-Agent`: SDK version information

## Best Practices

### 1. API Key Management

- **Never** hard-code API keys in your source code
- Use environment variables or secure key management systems
- Rotate API keys regularly
- Use different keys for different environments

### 2. Input Validation

Always validate user input before passing to the SDK:

```typescript
// Good: Validate before using
function createAccount(userInput: any) {
  if (!isValidAccountName(userInput.name)) {
    throw new Error('Invalid account name');
  }
  
  return client.entities.accounts.createAccount(
    orgId,
    ledgerId,
    {
      name: sanitize(userInput.name),
      // ... other fields
    }
  );
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

Implement client-side rate limiting to prevent abuse:

```typescript
const client = new MidazClient({
  rateLimiting: {
    maxRequestsPerSecond: 10,
    maxBurst: 20,
  },
});
```

## Threat Model

### Protected Against

1. **Man-in-the-Middle Attacks**: HTTPS enforcement
2. **API Key Exposure**: Automatic sanitization in logs
3. **Replay Attacks**: Idempotency keys
4. **DoS Attacks**: Circuit breaker and timeouts
5. **Information Disclosure**: Error sanitization

### Not Protected Against

1. **Compromised API Keys**: Implement key rotation
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

- [ ] API keys stored securely (not in code)
- [ ] HTTPS enforced for all connections
- [ ] Input validation implemented
- [ ] Error handling doesn't expose sensitive data
- [ ] Logging configured to sanitize sensitive data
- [ ] Rate limiting configured appropriately
- [ ] Circuit breaker thresholds set
- [ ] Timeout values configured
- [ ] Security headers verified
- [ ] Latest SDK version installed