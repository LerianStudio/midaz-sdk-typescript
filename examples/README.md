# Midaz SDK Examples

This directory contains example applications demonstrating the usage of the Midaz SDK.

## Prerequisites

Before running the examples, make sure you have built the SDK:

```bash
npm run build
```

## Running Examples

The examples can be run using the provided npm scripts:

```bash
# First build the SDK
npm run build

# Then run any of the examples
npm run example:workflow
npm run example:client-config
npm run example:api-versioning
```

You can also run the examples directly using npx:

```bash
# Run the workflow example
npx ts-node examples/workflow.ts

# Run the client config example
npx ts-node examples/client-config-example.ts

# Run the API versioning example
npx ts-node examples/api-versioning-example.ts
```

### Available Examples

1. **Workflow Example** - Complete financial workflow demonstration including organizations, ledgers, assets, accounts, and transactions
2. **Client Config** - Shows different approaches to configuring the Midaz client
3. **API Versioning** - Demonstrates how to work with different API versions

## Example Files

- `workflow.ts` - Complete financial workflow demonstration
- `client-config-example.ts` - Shows different configuration approaches
- `api-versioning-example.ts` - Demonstrates how to work with different API versions

## Notes

The examples are designed to work with a locally running Midaz API server. They are configured by default to connect to:

- http://localhost:3000 (Onboarding API)
- http://localhost:3001 (Transaction API)

If you need to connect to a different server, modify the configuration in the example files or use environment variables.
