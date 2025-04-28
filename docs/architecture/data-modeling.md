# Data Modeling Architecture

The Midaz SDK employs a consistent approach to data modeling to ensure type safety, validation, and a consistent developer experience. This document explains the data modeling architecture, patterns, and best practices.

## Data Model Design Principles

The Midaz SDK's data models follow these key principles:

1. **Type Safety**: All models are fully typed for TypeScript benefits
2. **Immutability**: Models are designed to be immutable when possible
3. **Validation**: Built-in validation ensures data integrity
4. **Extensibility**: Models can be extended with custom properties
5. **Consistency**: Similar entities follow consistent patterns
6. **Serialization**: Models can be easily serialized for API transmission

## Model Hierarchy

Data models in the SDK follow a hierarchical structure:

```
┌─────────────────┐
│   Base Models   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Domain Models  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Input/Output  │
│     Models      │
└─────────────────┘
```

### Base Models

Base models define common patterns and structures used throughout the SDK:

```typescript
/**
 * Base model with common properties for all models
 */
interface BaseModel {
  /** Unique identifier */
  id: string;
  
  /** Creation timestamp in ISO 8601 format */
  createdAt: string;
  
  /** Last update timestamp in ISO 8601 format */
  updatedAt: string;
}

/**
 * Metadata container for custom properties
 */
interface WithMetadata {
  /** Custom metadata key-value pairs */
  metadata?: Record<string, any>;
}
```

### Domain Models

Domain models represent core business entities:

```typescript
/**
 * Account entity representing a financial account
 */
interface Account extends BaseModel, WithMetadata {
  /** Linked organization ID */
  organizationId: string;
  
  /** Linked ledger ID */
  ledgerId: string;
  
  /** Account name */
  name: string;
  
  /** Account type */
  type: AccountType;
  
  /** Associated asset code */
  assetCode: string;
  
  /** Account status */
  status: AccountStatus;
  
  /** Optional account alias for easier reference */
  alias?: string;
  
  /** Tags for categorization */
  tags?: string[];
  
  // Other account-specific properties...
}

/**
 * Transaction entity representing a financial transaction
 */
interface Transaction extends BaseModel, WithMetadata {
  /** Linked organization ID */
  organizationId: string;
  
  /** Linked ledger ID */
  ledgerId: string;
  
  /** Transaction code for reference */
  code?: string;
  
  /** Transaction status */
  status: TransactionStatus;
  
  /** Transaction type */
  type: TransactionType;
  
  /** Operations in this transaction */
  operations: Operation[];
  
  // Other transaction-specific properties...
}
```

### Input/Output Models

Input and output models represent data specific to API operations:

```typescript
/**
 * Input model for creating an account
 */
interface CreateAccountInput {
  /** Account name */
  name: string;
  
  /** Account type */
  type: AccountType;
  
  /** Associated asset code */
  assetCode: string;
  
  /** Optional account alias */
  alias?: string;
  
  /** Optional metadata */
  metadata?: Record<string, any>;
  
  /** Optional tags */
  tags?: string[];
}

/**
 * Input model for updating an account
 */
interface UpdateAccountInput {
  /** New account name (optional) */
  name?: string;
  
  /** New account alias (optional) */
  alias?: string;
  
  /** New metadata (optional, replaces existing) */
  metadata?: Record<string, any>;
  
  /** New tags (optional, replaces existing) */
  tags?: string[];
}

/**
 * Response model for listing accounts
 */
interface ListAccountsResponse {
  /** List of accounts */
  items: Account[];
  
  /** Pagination metadata */
  pagination: {
    /** Total number of items matching the query */
    total: number;
    
    /** Next page cursor */
    nextCursor?: string;
    
    /** Previous page cursor */
    prevCursor?: string;
  };
}
```

## Builder Pattern for Complex Objects

The SDK uses the builder pattern for creating complex objects:

```typescript
/**
 * Builder for creating an account
 */
interface AccountBuilder {
  /** Set the account name */
  withName(name: string): AccountBuilder;
  
  /** Set the account type */
  withType(type: AccountType): AccountBuilder;
  
  /** Set the asset code */
  withAssetCode(assetCode: string): AccountBuilder;
  
  /** Set an optional alias */
  withAlias(alias: string): AccountBuilder;
  
  /** Add metadata */
  withMetadata(metadata: Record<string, any>): AccountBuilder;
  
  /** Add tags */
  withTags(tags: string[]): AccountBuilder;
  
  /** Build the final account input */
  build(): CreateAccountInput;
}

// Factory function to create an account builder
function createAccountBuilder(
  name: string,
  assetCode: string
): AccountBuilder {
  // Implementation...
}
```

Usage example:

```typescript
const accountInput = createAccountBuilder('Savings Account', 'USD')
  .withType('savings')
  .withAlias('personal-savings')
  .withMetadata({ purpose: 'vacation fund' })
  .withTags(['personal', 'savings'])
  .build();

const account = await client.entities.accounts.createAccount(
  orgId,
  ledgerId,
  accountInput
);
```

## Enum and Constant Types

The SDK uses enums and constants for predefined values:

```typescript
/**
 * Account type constants
 */
export const AccountType = {
  CHECKING: 'checking',
  SAVINGS: 'savings',
  CREDIT: 'credit',
  INVESTMENT: 'investment',
  LOAN: 'loan',
  SYSTEM: 'system',
  EXTERNAL: 'external',
  OTHER: 'other'
} as const;

/**
 * Account type string literal union type
 */
export type AccountType = typeof AccountType[keyof typeof AccountType];

/**
 * Account status constants
 */
export const AccountStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  CLOSED: 'closed',
  FROZEN: 'frozen',
  PENDING: 'pending'
} as const;

/**
 * Account status string literal union type
 */
export type AccountStatus = typeof AccountStatus[keyof typeof AccountStatus];
```

This approach provides both runtime constants and compile-time type safety.

## Validation Integration

Models are integrated with the validation system:

```typescript
import { 
  validate, 
  validateRequired, 
  validateNotEmpty,
  validateAssetCode,
  validateAccountType
} from 'midaz-sdk/util/validation';

// Validate a model against rules
function validateAccountInput(input: CreateAccountInput): ValidationResult {
  const results = [
    validateRequired(input, 'account'),
    validateNotEmpty(input.name, 'name'),
    validateAssetCode(input.assetCode),
    validateAccountType(input.type)
  ];
  
  return combineValidationResults(results);
}

// Usage in service layer
function createAccount(orgId: string, ledgerId: string, input: CreateAccountInput): Promise<Account> {
  // Validate input before sending to API
  validate(input, validateAccountInput);
  
  // Proceed with API call...
}
```

## Serialization and Deserialization

The SDK handles model serialization and deserialization transparently:

```typescript
// Serialization for sending to API
function serializeAccount(account: CreateAccountInput): any {
  return {
    name: account.name,
    type: account.type,
    asset_code: account.assetCode, // Convert camelCase to snake_case
    alias: account.alias,
    metadata: account.metadata,
    tags: account.tags
  };
}

// Deserialization from API response
function deserializeAccount(data: any): Account {
  return {
    id: data.id,
    organizationId: data.organization_id, // Convert snake_case to camelCase
    ledgerId: data.ledger_id,
    name: data.name,
    type: data.type,
    assetCode: data.asset_code,
    status: data.status,
    alias: data.alias,
    metadata: data.metadata,
    tags: data.tags,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}
```

## Generic List Response Type

The SDK uses a generic list response type for consistency:

```typescript
/**
 * Generic list response with pagination
 */
interface ListResponse<T> {
  /** Array of items */
  items: T[];
  
  /** Pagination metadata */
  pagination: {
    /** Total item count */
    total: number;
    
    /** Page size */
    limit: number;
    
    /** Current page offset */
    offset: number;
    
    /** Next page cursor */
    nextCursor?: string;
    
    /** Previous page cursor */
    prevCursor?: string;
  };
}

/**
 * Generic list options for filtering, sorting, and pagination
 */
interface ListOptions {
  /** Maximum items to return */
  limit?: number;
  
  /** Offset for pagination */
  offset?: number;
  
  /** Cursor for cursor-based pagination */
  cursor?: string;
  
  /** Sort field and direction */
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  
  /** Filter criteria */
  filter?: Record<string, any>;
}
```

## Model Extensions

The SDK supports model extensions for customization:

```typescript
// Extend a model with additional properties
interface EnhancedAccount extends Account {
  /** Custom calculated balance */
  calculatedBalance?: number;
  
  /** Risk score */
  riskScore?: number;
}

// Function to enhance an account
function enhanceAccount(account: Account): EnhancedAccount {
  return {
    ...account,
    calculatedBalance: calculateBalance(account),
    riskScore: calculateRiskScore(account)
  };
}
```

## Type Guards

Type guards help safely work with different model types:

```typescript
/**
 * Type guard for checking if an object is an Account
 */
function isAccount(obj: any): obj is Account {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.assetCode === 'string'
  );
}

/**
 * Type guard for checking if an account is a specific type
 */
function isExternalAccount(account: Account): boolean {
  return account.type === AccountType.EXTERNAL;
}

// Usage
if (isAccount(obj)) {
  // TypeScript knows obj is an Account
  console.log(obj.name, obj.assetCode);
  
  if (isExternalAccount(obj)) {
    // Handle external account case
  }
}
```

## Metadata Handling

The SDK provides special handling for metadata fields:

```typescript
/**
 * Helper to safely get typed metadata value
 */
function getMetadataValue<T>(
  metadata: Record<string, any> | undefined,
  key: string,
  defaultValue?: T
): T | undefined {
  if (!metadata) return defaultValue;
  const value = metadata[key];
  return value !== undefined ? value : defaultValue;
}

/**
 * Helper to set metadata value
 */
function setMetadataValue<T>(
  metadata: Record<string, any> | undefined,
  key: string,
  value: T
): Record<string, any> {
  return {
    ...(metadata || {}),
    [key]: value
  };
}

// Usage
const purpose = getMetadataValue<string>(account.metadata, 'purpose');
const updatedMetadata = setMetadataValue(account.metadata, 'lastReviewed', new Date().toISOString());
```

## Best Practices

### For SDK Consumers

1. **Use Builders**: Use builder pattern for complex object creation
   ```typescript
   const txInput = createTransactionBuilder('Payment')
     .withAssetCode('USD')
     .withAmount(100)
     .build();
   ```

2. **Validate Early**: Validate input objects before sending to API
   ```typescript
   try {
     validate(input, validateAccountInput);
     // Proceed with API call
   } catch (error) {
     // Handle validation error
   }
   ```

3. **Type Everything**: Use TypeScript types for all variables
   ```typescript
   const accounts: Account[] = await client.entities.accounts.listAccounts(
     orgId,
     ledgerId
   );
   ```

4. **Use Type Guards**: Check object types when necessary
   ```typescript
   if (isExternalAccount(account)) {
     // Handle external account case
   }
   ```

5. **Treat Models as Immutable**: Don't modify received models
   ```typescript
   // Bad: Modifying a received model
   account.name = 'New Name';
   
   // Good: Creating a new model for updates
   const updatedAccount = await client.entities.accounts.updateAccount(
     orgId,
     ledgerId,
     account.id,
     { name: 'New Name' }
   );
   ```

### For SDK Developers

1. **Consistent Naming**: Follow consistent naming conventions
   ```typescript
   // Entities are singular: Account, Transaction
   // Collections are plural: accounts, transactions
   // Actions are verbs: create, update, delete
   ```

2. **Validation Integration**: Integrate validation in data models
   ```typescript
   export const validateAccount = (account: Account): ValidationResult => {
     // Implementation
   };
   ```

3. **Extensibility**: Design models for extension
   ```typescript
   // Base model that can be extended
   export interface BaseEntity {
     id: string;
     createdAt: string;
     updatedAt: string;
   }
   ```

4. **Documentation**: Document all models and properties
   ```typescript
   /**
    * Account entity representing a financial account
    *
    * Accounts hold balances in a specific asset and can be
    * used in transactions as source or destination.
    */
   export interface Account {
     /** Unique identifier of the account */
     id: string;
     
     // Other properties with documentation...
   }
   ```

5. **Versioning Strategy**: Plan for model versioning
   ```typescript
   // Version 1 model
   export interface AccountV1 {
     // Properties
   }
   
   // Version 2 model with additional fields
   export interface AccountV2 extends AccountV1 {
     // Additional properties
   }
   
   // Current version alias
   export type Account = AccountV2;
   ```
