# Midaz SDK Architecture Overview

The Midaz SDK follows a well-structured layered architecture that promotes separation of concerns, maintainability, and extensibility. This document provides an overview of each architectural layer and its responsibilities.

## Layered Architecture

The SDK is organized into the following key layers:

### 1. Client Layer

The client layer serves as the main entry point to the SDK and handles configuration and bootstrapping of all services.

**Key Components:**
- `MidazClient`: The primary class users interact with
- `ClientConfigBuilder`: Builder for creating client configurations
- Configuration factories for different environments

**Example:**
```typescript
import { MidazClient, createClientConfig } from 'midaz-sdk';

const config = createClientConfig()
  .withApiKey('your-api-key')
  .withEnvironment('sandbox')
  .build();

const client = new MidazClient(config);
```

### 2. Entity Layer

The entity layer contains service interfaces and implementations that encapsulate business logic for different resource types.

**Key Services:**
- `AssetsService`: Manages financial assets
- `AccountsService`: Manages accounts
- `TransactionsService`: Handles financial transactions
- `OrganizationsService`: Manages organizational entities

**Example:**
```typescript
// Accessing entity services
const assetsService = client.entities.assets;
const accountsService = client.entities.accounts;

// Using entity services
const asset = await assetsService.getAsset(organizationId, ledgerId, assetId);
const accounts = await accountsService.listAccounts(organizationId, ledgerId);
```

### 3. API Layer

The API layer handles direct communication with the Midaz backend services, managing HTTP requests, URL construction, and response processing.

**Key Components:**
- `ApiFactory`: Creates API clients with consistent configuration
- API client interfaces defining service boundaries
- HTTP implementations of API clients
- `UrlBuilder`: Constructs appropriate URLs for different API endpoints

This layer is typically not accessed directly by users of the SDK.

### 4. Model Layer

The model layer defines the data structures used throughout the SDK and implements builders for creating these structures with validation.

**Key Models:**
- `Asset`: Represents financial assets
- `Account`: Represents accounts
- `Transaction`: Represents financial transactions
- `Organization`: Represents organizations

**Example with Builder Pattern:**
```typescript
import { createAssetBuilder } from 'midaz-sdk';

const asset = createAssetBuilder('USD Currency', 'USD')
  .withType('currency')
  .withMetadata({ precision: 2, symbol: '$' })
  .build();
```

### 5. Utility Layer

The utility layer provides common functionality used across the SDK.

**Key Utilities:**
- `HttpClient`: Handles HTTP communication with retry policies
- `Observability`: Provides tracing, metrics, and logging
- Error handling utilities with recovery mechanisms
- Validation utilities 
- Configuration management

**Example:**
```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util';

const result = await withEnhancedRecovery(
  () => client.entities.transactions.createTransaction(orgId, ledgerId, transaction)
);
```

## Data Flow

The typical data flow in the SDK follows this pattern:

1. **Client Initialization**: Application initializes the `MidazClient` with configuration
2. **Service Access**: Client provides access to entity services
3. **Model Creation**: Models are created using builders
4. **Service Operation**: Entity service methods are called with models
5. **API Client Invocation**: Entity service delegates to API client implementation
6. **HTTP Communication**: API client uses HTTP client to communicate with backend
7. **Response Processing**: Results are transformed into model instances
8. **Error Handling**: Errors are caught, processed, and optionally recovered from

Throughout this flow, observability instruments key operations with tracing, metrics, and logging.
