# API Response Patterns

This document describes the standardized API response patterns used in the Midaz SDK.

## Table of Contents

1. [API Response Structure](#api-response-structure)
2. [Base API Client](#base-api-client)
3. [Model Transformers](#model-transformers)
4. [Request/Response Flow](#requestresponse-flow)
5. [Error Handling](#error-handling)
6. [Observability](#observability)

## API Response Structure

All API responses in the Midaz SDK follow a consistent pattern:

- Single resources (e.g., Account, Transaction) implement the `ApiResponse` interface
- List resources use the `ListResponse<T>` interface, which includes:
  - `items`: Array of resources
  - `meta`: Metadata for pagination

Example:

```typescript
// Single resource
const account: Account = {
  id: "acc_123",
  name: "Operating Account",
  // ...other fields
};

// List response
const accounts: ListResponse<Account> = {
  items: [
    { id: "acc_123", name: "Operating Account", /* ... */ },
    { id: "acc_456", name: "Savings Account", /* ... */ },
  ],
  meta: {
    total: 150,
    count: 2,
    nextCursor: "eyJpZCI6ImFjY18xMjMifQ==",
    prevCursor: null
  }
};
```

## Base API Client

The `HttpBaseApiClient` provides a standardized implementation for all HTTP API clients:

- Shared request methods (`getRequest`, `postRequest`, etc.)
- Consistent error handling
- Standardized parameter validation
- Common observability instrumentation

Example:

```typescript
export class HttpAccountApiClient extends HttpBaseApiClient<Account, CreateAccountInput, UpdateAccountInput> {
  // Specific implementation for account operations
}
```

## Model Transformers

The model transformer pattern provides a standardized way to transform between client and API models:

- `ModelTransformer<TClient, TApi>` interface defines the contract
- `createModelTransformer` factory creates transformer instances
- `transformRequest` and `transformResponse` utility functions handle transformation

Example:

```typescript
// Create a transformer
const transformer = createModelTransformer<ClientModel, ApiModel>(
  // Client to API
  (clientModel) => ({ /* transform to API model */ }),
  // API to Client
  (apiModel) => ({ /* transform to client model */ })
);

// Transform a request
const apiRequest = transformRequest(transformer, clientRequest);

// Transform a response
const clientResponse = transformResponse(transformer, apiResponse);
```

## Request/Response Flow

The standard flow for API requests is:

1. **Validation**: Validate required parameters and input objects
2. **Request Transformation**: Transform client models to API models (if needed)
3. **HTTP Request**: Make the HTTP request with standardized error handling
4. **Response Transformation**: Transform API responses to client models (if needed)
5. **Metrics Recording**: Record metrics about the operation

Example:

```typescript
// 1. Validate parameters
this.validateRequiredParams(span, { orgId, ledgerId });

// 2. Validate input
validate(input, validateCreateAccountInput);

// 3. Transform request (if needed)
const apiModel = transformRequest(transformer, input);

// 4. Make HTTP request
const result = await this.postRequest('createResource', url, apiModel);

// 5. Record metrics
this.recordMetrics('resource.create', 1, { orgId, ledgerId });

// 6. Return result (implicitly transformed if needed)
return result;
```

## Error Handling

Error handling is standardized across all API clients:

- All errors are recorded in the current tracing span
- Error details are set as span attributes
- API errors are mapped to appropriate error types

Example:

```typescript
try {
  // Make request
} catch (error) {
  span.recordException(error as Error);
  span.setStatus('error', (error as Error).message);
  throw error;
} finally {
  span.end();
}
```

## Observability

Observability is standardized across all API clients:

- All operations create a span with consistent naming
- Standard attributes are set on spans (orgId, ledgerId, etc.)
- Metrics are recorded for all operations
- Error information is captured in spans

Example:

```typescript
// Create span
const span = this.startSpan('operationName', { orgId, ledgerId });

// Set attributes
span.setAttribute('accountId', id);

// Record metrics
this.recordMetrics('operation.name', 1, { orgId, ledgerId });

// End span
span.setStatus('ok');
span.end();
```