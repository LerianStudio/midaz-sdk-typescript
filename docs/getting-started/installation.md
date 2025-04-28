# Installing the Midaz SDK

This guide provides instructions for installing and setting up the Midaz SDK in your TypeScript or JavaScript project.

## Prerequisites

Before installing the Midaz SDK, ensure you have the following:

- Node.js (version 14.0.0 or later)
- npm (version 6.0.0 or later) or yarn (version 1.0.0 or later)
- A Midaz API key (contact your account manager or sign up at [midaz.io](https://midaz.io))

## Installation

### Using npm

```bash
npm install midaz-sdk
```

### Using yarn

```bash
yarn add midaz-sdk
```

## Importing the SDK

Once installed, you can import the SDK into your application:

```typescript
// Import the core client
import { MidazClient, createClientConfig } from 'midaz-sdk';

// Import builder functions
import { 
  createAssetBuilder,
  createAccountBuilder,
  createOrganizationBuilder,
  createTransactionBuilder
} from 'midaz-sdk';

// Import utilities
import { withEnhancedRecovery } from 'midaz-sdk/util';
```

## Basic Setup

To start using the SDK, create a client instance with your API key:

```typescript
// Create a client configuration
const config = createClientConfig()
  .withApiKey('your-api-key')
  .withEnvironment('sandbox')  // Options: 'development', 'sandbox', 'production'
  .build();

// Initialize the client
const client = new MidazClient(config);
```

## Environment-Specific Setup

The SDK provides factory functions for common environments:

```typescript
// For development
import { createDevelopmentConfig } from 'midaz-sdk';
const devClient = new MidazClient(createDevelopmentConfig('dev-api-key'));

// For sandbox testing
import { createSandboxConfig } from 'midaz-sdk';
const sandboxClient = new MidazClient(createSandboxConfig('sandbox-api-key'));

// For production
import { createProductionConfig } from 'midaz-sdk';
const prodClient = new MidazClient(createProductionConfig('prod-api-key'));
```

## TypeScript Configuration

The Midaz SDK is written in TypeScript and includes type definitions. Make sure your `tsconfig.json` includes the following options for the best development experience:

```json
{
  "compilerOptions": {
    "target": "es2019", 
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true
  }
}
```

## SDK Structure

The Midaz SDK follows a layered architecture:

```
midaz-sdk/
├── client           # MidazClient and configuration
├── entities         # Service interfaces (assets, accounts, etc.)
├── models           # Data models and builders
├── util             # Utility functions
│   ├── error        # Error handling utilities
│   ├── observability # Tracing, metrics, and logging
│   ├── network      # HTTP client utilities
│   └── validation   # Validation utilities
```

## Quick Verification

To verify your installation and API key, run a simple test:

```typescript
import { MidazClient, createClientConfig } from 'midaz-sdk';

async function testConnection() {
  try {
    // Initialize client
    const client = new MidazClient(
      createClientConfig()
        .withApiKey('your-api-key')
        .withEnvironment('sandbox')
        .build()
    );
    
    // List organizations (a simple call to verify connectivity)
    const organizations = await client.entities.organizations.listOrganizations({ limit: 1 });
    
    console.log('Connection successful!');
    console.log(`Found ${organizations.total} organizations`);
    
    return true;
  } catch (error) {
    console.error('Connection failed:', error.message);
    return false;
  }
}

testConnection();
```

## Adding Observability

For production applications, it's recommended to configure observability:

```typescript
const config = createClientConfig()
  .withApiKey('your-api-key')
  .withEnvironment('production')
  .withObservability({
    enabled: true,
    serviceName: 'my-financial-app',
    environment: 'production',
    logLevel: 'info'
  })
  .build();

const client = new MidazClient(config);
```

## Next Steps

After installation, check out these resources to get started:

1. [Quick Start Guide](./quick-start.md): Basic examples for common operations
2. [Client Configuration](../utilities/configuration.md): Detailed configuration options
3. [Builder Pattern](../core-concepts/builder-pattern.md): How to use builders for creating objects
4. [Error Handling](../core-concepts/error-handling.md): Strategies for handling errors

## Troubleshooting

### Common Installation Issues

#### Missing Peer Dependencies

If you encounter warnings about missing peer dependencies, install them:

```bash
npm install @opentelemetry/api @opentelemetry/sdk-trace-base
```

#### Network Errors During Installation

If you're behind a corporate firewall or using a private npm registry:

```bash
# Configure npm to use your private registry
npm config set registry https://your-private-registry.com

# Or configure npm to use a proxy
npm config set proxy http://your-proxy:8080
```

#### TypeScript Errors

If you encounter TypeScript errors:

1. Ensure you're using a compatible TypeScript version (4.0.0 or later)
2. Check that your `tsconfig.json` is properly configured
3. Try running `npm install @types/node`

### Runtime Issues

#### API Key Errors

If you receive authentication errors:

1. Verify your API key is correct
2. Ensure you're using the right environment (development, sandbox, production)
3. Check if your API key has the necessary permissions

#### Request Timeout Errors

If requests are timing out:

```typescript
// Increase the timeout for all requests
const config = createClientConfig()
  .withApiKey('your-api-key')
  .withTimeout(60000)  // 60 seconds
  .build();
```

## Support

If you need help with the Midaz SDK:

- Check the [API Reference](https://docs.midaz.io/reference)
- Contact support at support@midaz.io
- Open an issue on the [GitHub repository](https://github.com/midaz/midaz-sdk-typescript)
