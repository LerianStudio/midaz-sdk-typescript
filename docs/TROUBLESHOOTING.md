# Troubleshooting Guide

This guide helps you diagnose and fix common issues with the Midaz SDK.

## Table of Contents

- [Common Issues](#common-issues)
- [Error Messages](#error-messages)
- [Debugging Techniques](#debugging-techniques)
- [Getting Help](#getting-help)

## Common Issues

### Installation Issues

#### TypeScript Compilation Errors

**Problem**: TypeScript errors when building

```
error TS2307: Cannot find module 'midaz-sdk'
```

**Solution**:

```bash
# Ensure TypeScript is installed
npm install --save-dev typescript

# Check tsconfig.json includes the SDK
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

#### Missing Dependencies

**Problem**: Module not found errors

```
Error: Cannot find module '@types/node'
```

**Solution**:

```bash
# Install missing types
npm install --save-dev @types/node

# Or run setup
npm run setup
```

### Authentication Issues

#### Invalid OAuth Credentials

**Problem**: 401 Unauthorized errors

```typescript
MidazError: Invalid OAuth credentials provided
```

**Solution**:

```typescript
// Check OAuth credentials are set correctly using PluginAccessManager
const client = new MidazClient(
  createClientConfigWithAccessManager({
    address: process.env.MIDAZ_AUTH_ADDRESS, // Ensure this is set
    clientId: process.env.MIDAZ_CLIENT_ID, // Ensure this is set  
    clientSecret: process.env.MIDAZ_CLIENT_SECRET, // Ensure this is set
  })
);

// Verify environment variables
console.log('Auth Address exists:', !!process.env.MIDAZ_AUTH_ADDRESS);
console.log('Client ID exists:', !!process.env.MIDAZ_CLIENT_ID);
console.log('Client Secret exists:', !!process.env.MIDAZ_CLIENT_SECRET);
```

#### OAuth Credential Exposure

**Problem**: OAuth credentials visible in logs

```
[WARN] Using client secret: secret-1234567890abcdef
```

**Solution**: The SDK should sanitize this automatically. Update to latest version:

```bash
npm update midaz-sdk
```

### Connection Issues

#### HTTPS Enforcement

**Problem**: Connection refused with HTTP URLs

```
Error: HTTPS required but HTTP URL provided
```

**Solution**:

```typescript
// For development only
const client = new MidazClient({
  baseUrls: {
    onboarding: 'http://localhost:8080',
  },
  security: {
    enforceHttps: false,
    allowInsecureHttp: true, // Required for HTTP
  },
});
```

#### Timeout Errors

**Problem**: Request timeout

```
Error: Request timeout after 30000ms
```

**Solution**:

```typescript
// Increase timeout
const client = new MidazClient({
  timeout: 60000, // 60 seconds
  security: {
    timeoutBudget: {
      enabled: true,
      minRequestTimeout: 5000,
    },
  },
});
```

#### Circuit Breaker Open

**Problem**: Circuit breaker preventing requests

```
Error: Circuit breaker is OPEN for /v1/organizations
```

**Solution**:

```typescript
// Wait for circuit to reset or adjust thresholds
const client = new MidazClient({
  security: {
    circuitBreaker: {
      failureThreshold: 10, // Increase threshold
      timeout: 30000, // Reduce reset time
    },
  },
});
```

### Data Issues

#### Validation Errors

**Problem**: Invalid request data

```
MidazError: Validation failed: amount must be positive
```

**Solution**:

```typescript
// Validate before sending
if (amount <= 0) {
  throw new Error('Amount must be positive');
}

// Use TypeScript types
const transaction: CreateTransactionInput = {
  amount: Math.abs(amount), // Ensure positive
  // ...
};
```

#### Missing Required Fields

**Problem**: Missing required fields

```
MidazError: Missing required field: assetCode
```

**Solution**:

```typescript
// Check TypeScript types for required fields
const account: CreateAccountInput = {
  name: 'My Account',
  assetCode: 'USD', // Required field
  type: 'deposit',
};
```

### Performance Issues

#### Slow Requests

**Problem**: Requests taking too long

**Solution**:

```typescript
// Enable connection pooling
const client = new MidazClient({
  security: {
    connectionPool: {
      maxConnectionsPerHost: 10,
    },
  },
});

// Use caching
const client = new MidazClient({
  cache: {
    ttl: 300000, // 5 minutes
    maxSize: 100,
  },
});
```

#### Memory Leaks

**Problem**: Memory usage growing over time

**Solution**:

```typescript
// Clean up resources
await client.destroy();

// Limit cache size
const client = new MidazClient({
  cache: {
    maxSize: 50, // Limit entries
  },
});
```

## Error Messages

### HTTP Status Codes

| Code | Meaning             | Solution                                    |
| ---- | ------------------- | ------------------------------------------- |
| 400  | Bad Request         | Check request data and validation           |
| 401  | Unauthorized        | Verify OAuth credentials are correct        |
| 403  | Forbidden           | Check permissions for the OAuth client      |
| 404  | Not Found           | Verify resource ID and endpoint             |
| 429  | Too Many Requests   | Implement rate limiting/backoff             |
| 500  | Server Error        | Retry with exponential backoff              |
| 503  | Service Unavailable | Wait and retry                    |

### SDK Error Types

```typescript
import { MidazError, ValidationError, NetworkError } from 'midaz-sdk';

try {
  await client.entities.organizations.createOrganization(data);
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors
    console.error('Invalid data:', error.details);
  } else if (error instanceof NetworkError) {
    // Handle network errors
    console.error('Network issue:', error.message);
  } else if (error instanceof MidazError) {
    // Handle other SDK errors
    console.error('SDK error:', error.code);
  }
}
```

## Debugging Techniques

### Enable Debug Logging

```typescript
const client = new MidazClient({
  logging: {
    level: 'debug',
    includeTimings: true,
    includeHeaders: true,
  },
});

// Or set environment variable
process.env.MIDAZ_LOG_LEVEL = 'debug';
```

### Request Inspection

```typescript
// Add request interceptor
client.interceptors.request.use((config) => {
  console.log('Request:', {
    method: config.method,
    url: config.url,
    headers: config.headers,
    data: config.data,
  });
  return config;
});

// Add response interceptor
client.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('Error:', error);
    throw error;
  }
);
```

### Network Debugging

```bash
# Enable Node.js debugging
NODE_DEBUG=http,https node your-app.js

# Use proxy for inspection
HTTPS_PROXY=http://localhost:8888 node your-app.js
```

### Memory Profiling

```typescript
// Log memory usage
setInterval(() => {
  const usage = process.memoryUsage();
  console.log('Memory:', {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
  });
}, 10000);
```

## Getting Help

### Before Asking for Help

1. **Check the Documentation**: Review relevant guides
2. **Search Issues**: Look for similar problems on GitHub
3. **Minimal Reproduction**: Create a minimal example
4. **Gather Information**: Collect error messages and logs

### Information to Provide

When reporting issues, include:

````markdown
**Environment:**

- SDK Version: 2.0.0
- Node.js Version: 18.18.0
- TypeScript Version: 5.0.0
- Operating System: macOS 13.0

**Code:**

```typescript
// Minimal reproduction code
const client = new MidazClient({
  /* config */
});
// ... problem code
```
````

**Error:**

```
// Full error message and stack trace
```

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

```

### Support Channels

1. **GitHub Issues**: For bugs and feature requests
   - https://github.com/LerianStudio/midaz-sdk-typescript/issues

2. **Documentation**: For usage questions
   - https://docs.midaz.com/sdk/typescript

3. **Community**: For discussions
   - Discord: https://discord.gg/midaz
   - Slack: https://midaz.slack.com

4. **Email Support**: For sensitive issues
   - support@lerianstudio.com

### Emergency Support

For production issues:
1. Check system status: https://status.midaz.com
2. Review recent changes in your code
3. Rollback if necessary
4. Contact emergency support with:
   - Account ID
   - Request IDs
   - Time range of issue
   - Impact description
```
