# Working with Assets

This guide explains how to work with assets using the Midaz SDK.

## What is an Asset?

In the Midaz financial platform, an asset represents a financial instrument or unit of value. Assets can be currencies, securities, commodities, or any other unit of value that can be owned, traded, or transferred.

## Asset Model

The Asset model has the following structure:

```typescript
interface Asset {
  id: string;
  name: string;
  type: string;
  code: string;
  status: Status;
  ledgerId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}
```

## Creating Assets

### Using the Builder Pattern

The recommended way to create assets is using the builder pattern through the `createAssetBuilder` function:

```typescript
import { createAssetBuilder } from 'midaz-sdk';

// Create an asset input using the builder
const assetInput = createAssetBuilder('US Dollar', 'USD')
  .withType('currency')
  .withMetadata({ precision: 2, symbol: '$' })
  .build();

// Create the asset
const asset = await client.entities.assets.createAsset(
  organizationId,
  ledgerId,
  assetInput
);
```

Note that:
- The `createAssetBuilder` function requires the `name` and `code` parameters as these are required fields
- The `status` field is set in the model but not included in the output of the builder
- Additional properties can be set using the chainable `with*` methods

### Creating Multiple Assets

To create multiple assets efficiently:

```typescript
// Create multiple assets
const assetInputs = [
  createAssetBuilder('US Dollar', 'USD').withType('currency').build(),
  createAssetBuilder('Euro', 'EUR').withType('currency').build(),
  createAssetBuilder('British Pound', 'GBP').withType('currency').build()
];

// Create assets in parallel
const assets = await Promise.all(
  assetInputs.map(input => 
    client.entities.assets.createAsset(organizationId, ledgerId, input)
  )
);
```

## Retrieving Assets

### Get a Specific Asset

```typescript
// Get a specific asset by ID
const asset = await client.entities.assets.getAsset(
  organizationId,
  ledgerId,
  assetId
);

console.log(`Asset: ${asset.name} (${asset.code})`);
```

### List Assets

```typescript
// List assets with pagination
const assetList = await client.entities.assets.listAssets(
  organizationId,
  ledgerId,
  { limit: 50, offset: 0 }
);

console.log(`Total assets: ${assetList.total}`);
for (const asset of assetList.data) {
  console.log(`- ${asset.name} (${asset.code}): ${asset.type}`);
}
```

To handle pagination for large lists, use:

```typescript
import { processPaginatedResults } from 'midaz-sdk/util/data';

// Get all assets across pages
const allAssets = await processPaginatedResults(
  (options) => client.entities.assets.listAssets(organizationId, ledgerId, options)
);
```

## Updating Assets

```typescript
// Update an asset
const updatedAsset = await client.entities.assets.updateAsset(
  organizationId,
  ledgerId,
  assetId,
  {
    name: 'Updated US Dollar',
    metadata: {
      precision: 2,
      symbol: '$',
      updated: true
    }
  }
);
```

## Error Handling

Use enhanced recovery for critical operations:

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util';

// Create an asset with enhanced recovery
const result = await withEnhancedRecovery(
  () => client.entities.assets.createAsset(
    organizationId,
    ledgerId,
    assetInput
  )
);

if (result.success) {
  const asset = result.data;
  console.log(`Asset created: ${asset.name} (${asset.id})`);
} else {
  console.error(`Failed to create asset: ${result.error.message}`);
}
```

## Best Practices

1. **Use the Builder Pattern**
   Always use the `createAssetBuilder` function to create asset inputs, as it ensures all required fields are provided and validation can occur.

2. **Include Meaningful Metadata**
   The metadata field is useful for storing application-specific information about assets, such as precision, display symbols, or color codes for UI.

3. **Use Consistent Asset Codes**
   Asset codes should follow a consistent format, typically 3-4 characters for currencies (e.g., USD, EUR) or a clear identifier for other asset types.

4. **Handle Pagination for Large Lists**
   When listing assets, always account for pagination, especially if you expect a large number of assets.

5. **Use Error Recovery**
   For critical operations, use the enhanced recovery mechanism to handle transient errors automatically.

## Example: Complete Asset Management

```typescript
// Asset management example
async function manageAssets(client, organizationId, ledgerId) {
  try {
    // Create a new asset
    const assetInput = createAssetBuilder('Bitcoin', 'BTC')
      .withType('cryptocurrency')
      .withMetadata({ precision: 8, symbol: '₿' })
      .build();

    const asset = await client.entities.assets.createAsset(
      organizationId,
      ledgerId,
      assetInput
    );
    console.log(`Created asset: ${asset.name} (${asset.id})`);

    // Get the asset details
    const retrievedAsset = await client.entities.assets.getAsset(
      organizationId,
      ledgerId,
      asset.id
    );
    console.log(`Retrieved asset: ${retrievedAsset.name}`);

    // Update the asset
    const updatedAsset = await client.entities.assets.updateAsset(
      organizationId,
      ledgerId,
      asset.id,
      {
        name: 'Bitcoin Digital Gold',
        metadata: {
          ...asset.metadata,
          description: 'Digital cryptocurrency'
        }
      }
    );
    console.log(`Updated asset: ${updatedAsset.name}`);

    // List all assets
    const assets = await client.entities.assets.listAssets(
      organizationId,
      ledgerId,
      { limit: 10 }
    );
    console.log(`Listed ${assets.data.length} assets`);

    return {
      created: asset,
      updated: updatedAsset,
      list: assets.data
    };
  } catch (error) {
    console.error(`Asset management error: ${error.message}`);
    throw error;
  }
}
```
