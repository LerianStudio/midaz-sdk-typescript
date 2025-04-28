# Builder Pattern in Midaz SDK

The Midaz SDK extensively uses the builder pattern to create complex objects with a fluent, chainable interface. This pattern enhances developer experience and ensures valid object creation without exposing internal implementation details.

## Understanding the Builder Pattern

The builder pattern is a creational design pattern that lets you construct complex objects step by step. It separates the construction of a complex object from its representation, allowing the same construction process to create different representations.

In the Midaz SDK, builders provide:

1. **Fluent Interface**: Chainable methods for a natural coding style
2. **Validation**: Runtime validation when building objects
3. **Encapsulation**: Internal details are hidden from users
4. **Type Safety**: TypeScript ensures correct method calls

## Builder Usage in Midaz SDK

The SDK provides builder functions for creating complex objects:

- `createAssetBuilder`
- `createAccountBuilder`
- `createOrganizationBuilder`
- `createClientConfig`
- And other entity builders

## Example Usage

### Creating Assets

```typescript
import { createAssetBuilder } from 'midaz-sdk';

// Create an asset using the builder
const assetInput = createAssetBuilder('USD Currency', 'USD')
  .withType('currency')
  .withMetadata({ precision: 2, symbol: '$' })
  .build();

// Use the asset input to create an asset
const asset = await client.entities.assets.createAsset(
  organizationId,
  ledgerId,
  assetInput
);
```

### Creating Accounts

```typescript
import { createAccountBuilder } from 'midaz-sdk';

// Create an account using the builder
const accountInput = createAccountBuilder('Savings Account', ledgerId)
  .withAssetIds(['asset1', 'asset2'])
  .withMetadata({ accountType: 'savings' })
  .build();

// Use the account input to create an account
const account = await client.entities.accounts.createAccount(
  organizationId,
  accountInput
);
```

### Creating Organizations

```typescript
import { createOrganizationBuilder } from 'midaz-sdk';

// Create an organization using the builder
const organizationInput = createOrganizationBuilder('Acme Corp')
  .withMetadata({ industry: 'Technology' })
  .build();

// Use the organization input to create an organization
const organization = await client.entities.organizations.createOrganization(
  organizationInput
);
```

## Builder Implementation

Under the hood, builders implement the `Builder<T, B>` interface, where:
- `T` is the model being built (e.g., `CreateAssetInput`)
- `B` is the builder type itself (e.g., `AssetBuilder`)

A typical builder interface looks like:

```typescript
export interface AssetBuilder extends Builder<CreateAssetInput, AssetBuilder> {
  withName(name: string): AssetBuilder;
  withCode(code: string): AssetBuilder;
  withType(type: string): AssetBuilder;
}
```

And the builder function creates a new instance:

```typescript
export function createAssetBuilder(name: string, code: string): AssetBuilder {
  const model: CreateAssetInput = { name, code };
  return new AssetBuilderImpl(model);
}
```

## Important Notes

1. **Required vs. Optional Fields**: 
   - Required fields are typically provided as parameters to the builder function
   - Optional fields are set via `with*` methods

2. **Status Field Handling**:
   - The status field is set in the model but not included in the output of the builder
   - It's managed internally by the SDK

3. **Validation**:
   - Validation happens at runtime rather than during build
   - This ensures the created objects meet all required constraints

4. **Builder vs. Direct Construction**:
   - Always use the provided builders instead of directly constructing objects
   - Builders ensure proper initialization and validation

5. **Deprecated Functions**:
   - Functions like `newCreateAssetInput`, `newCreateAssetInputWithType`, and `toLibTransaction` have been removed
   - Always use the current builder functions
