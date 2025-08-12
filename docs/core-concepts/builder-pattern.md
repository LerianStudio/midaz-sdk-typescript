# Builder Pattern in Midaz SDK

The Midaz SDK extensively uses the builder pattern to create complex objects with a fluent, chainable interface. This pattern enhances developer experience and ensures valid object creation without exposing internal implementation details.

## Understanding the Builder Pattern

The builder pattern is a creational design pattern that lets you construct complex objects step by step. In the Midaz SDK, builders provide:

1. **Fluent Interface**: Chainable methods for a natural coding style
2. **Encapsulation**: Internal details are hidden from users
3. **Type Safety**: TypeScript ensures correct method calls

## Implementation in Midaz SDK

The SDK implements the builder pattern through a common base interface:

```typescript
export interface Builder<T, B extends Builder<T, B>> {
  build(): T;
}
```

Specific builder implementations extend this interface:

```typescript
export interface AssetBuilder extends Builder<CreateAssetInput, AssetBuilder> {
  withName(name: string): AssetBuilder;
  withCode(code: string): AssetBuilder;
  withType(type: string): AssetBuilder;
}
```

These are implemented in classes like `ModelBuilder`:

```typescript
export class ModelBuilder<T extends BuildableModel, B extends Builder<T, B>>
  implements Builder<T, B>
{
  protected model: T;

  constructor(model: T) {
    this.model = model;
  }

  build(): T {
    return this.model;
  }

  withMetadata(metadata: Record<string, MetadataValue>): B {
    this.model.metadata = metadata;
    return this as unknown as B;
  }

  // Other builder methods...
}
```

## Builder Functions

The SDK provides factory functions that return builder instances:

```typescript
// Create an asset builder
export function createAssetBuilder(name: string, code: string): AssetBuilder {
  const model: CreateAssetInput = { name, code };
  return new AssetBuilderImpl(model);
}

// Create an account builder
export function createAccountBuilder(name: string, ledgerId: string): AccountBuilder {
  const model: CreateAccountInput = { name, ledgerId };
  return new AccountBuilderImpl(model);
}

// Create an organization builder
export function createOrganizationBuilder(name: string): OrganizationBuilder {
  const model: CreateOrganizationInput = { name };
  return new OrganizationBuilderImpl(model);
}
```

## Key Characteristics

1. **Required Parameters**: Builder functions require specific parameters for object creation
   - `createAssetBuilder` requires `name` and `code`
   - `createAccountBuilder` requires `name` and `ledgerId`
   - `createOrganizationBuilder` requires `name`

2. **Status Field Handling**: The status field is set in the model but not included in the output of the builder

3. **Runtime Validation**: Validation happens at runtime rather than during build

4. **Deprecated Methods**: Functions like `newCreateAssetInput`, `newCreateAssetInputWithType`, and `toLibTransaction` have been removed in favor of the builder pattern

## Usage Examples

### Creating an Asset

```typescript
import { createAssetBuilder } from 'midaz-sdk';

const assetInput = createAssetBuilder('USD Currency', 'USD')
  .withType('currency')
  .withMetadata({ precision: 2, symbol: '$' })
  .build();

const asset = await client.entities.assets.createAsset(organizationId, ledgerId, assetInput);
```

### Creating an Account

```typescript
import { createAccountBuilder } from 'midaz-sdk';

const accountInput = createAccountBuilder('Savings Account', ledgerId)
  .withAssetIds(['asset1', 'asset2'])
  .withMetadata({ accountType: 'savings' })
  .build();

const account = await client.entities.accounts.createAccount(organizationId, accountInput);
```

### Creating an Organization

```typescript
import { createOrganizationBuilder } from 'midaz-sdk';

const organizationInput = createOrganizationBuilder('Acme Corp')
  .withMetadata({ industry: 'Technology' })
  .build();

const organization = await client.entities.organizations.createOrganization(organizationInput);
```

## Best Practices

1. **Always use builder functions**: Instead of creating objects directly, use the appropriate builder function
2. **Provide all required parameters**: Each builder function requires specific parameters
3. **Use method chaining**: Take advantage of the fluent interface with method chaining
4. **Set optional properties with methods**: Use the `with*` methods to set optional properties
5. **Validate after build**: Remember that validation happens at runtime after building the object
