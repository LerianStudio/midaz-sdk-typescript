# Working with Ledgers

This guide explains how to work with ledgers using the Midaz SDK.

## What is a Ledger?

In the Midaz financial platform, a ledger represents a financial record-keeping system that contains accounts, assets, and transactions. Ledgers are owned by organizations and provide a way to logically separate different financial activities.

## Ledger Model

The Ledger model has the following structure:

```typescript
interface Ledger {
  id: string;
  name: string;
  organizationId: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}
```

## Creating Ledgers

### Using the Builder Pattern

The recommended way to create ledgers is using the builder pattern through the `createLedgerBuilder` function:

```typescript
import { createLedgerBuilder } from 'midaz-sdk';

// Create a ledger input using the builder
const ledgerInput = createLedgerBuilder('Main Ledger')
  .withMetadata({ 
    description: 'Primary ledger for tracking all financial activities',
    baseCurrency: 'USD'
  })
  .build();

// Create the ledger
const ledger = await client.entities.organizations.createLedger(
  organizationId,
  ledgerInput
);
```

Note that:
- The `createLedgerBuilder` function requires the `name` parameter as this is a required field
- The `status` field is set in the model but not included in the output of the builder
- Additional properties can be set using the chainable `with*` methods

### Creating Multiple Ledgers

To create multiple ledgers efficiently:

```typescript
// Create multiple ledgers
const ledgerInputs = [
  createLedgerBuilder('USD Ledger')
    .withMetadata({ baseCurrency: 'USD' })
    .build(),
  createLedgerBuilder('EUR Ledger')
    .withMetadata({ baseCurrency: 'EUR' })
    .build(),
  createLedgerBuilder('GBP Ledger')
    .withMetadata({ baseCurrency: 'GBP' })
    .build()
];

// Create ledgers in parallel
const ledgers = await Promise.all(
  ledgerInputs.map(input => 
    client.entities.organizations.createLedger(organizationId, input)
  )
);
```

## Retrieving Ledgers

### Get a Specific Ledger

```typescript
// Get a specific ledger by ID
const ledger = await client.entities.ledgers.getLedger(
  organizationId,
  ledgerId
);

console.log(`Ledger: ${ledger.name} (${ledger.id})`);
```

### List Ledgers

```typescript
// List ledgers with pagination
const ledgerList = await client.entities.organizations.listLedgers(
  organizationId,
  { limit: 50, offset: 0 }
);

console.log(`Total ledgers: ${ledgerList.total}`);
for (const ledger of ledgerList.data) {
  console.log(`- ${ledger.name} (${ledger.id})`);
}
```

To handle pagination for large lists, use:

```typescript
import { processPaginatedResults } from 'midaz-sdk/util/data';

// Get all ledgers across pages
const allLedgers = await processPaginatedResults(
  (options) => client.entities.organizations.listLedgers(organizationId, options)
);
```

## Updating Ledgers

```typescript
// Update a ledger
const updatedLedger = await client.entities.ledgers.updateLedger(
  organizationId,
  ledgerId,
  {
    name: 'Updated Main Ledger',
    metadata: {
      ...ledger.metadata,
      description: 'Updated primary ledger description',
      lastReviewDate: new Date().toISOString()
    }
  }
);
```

## Working with Ledger Assets

Ledgers contain assets that can be used in accounts and transactions:

```typescript
// List assets in a ledger
const assets = await client.entities.assets.listAssets(
  organizationId,
  ledgerId,
  { limit: 50, offset: 0 }
);

console.log(`Assets in ledger ${ledgerId}:`);
for (const asset of assets.data) {
  console.log(`- ${asset.name} (${asset.code})`);
}
```

## Working with Ledger Transactions

Transactions are also associated with ledgers:

```typescript
// List transactions in a ledger
const transactions = await client.entities.transactions.listTransactions(
  organizationId,
  ledgerId,
  { limit: 50, offset: 0 }
);

console.log(`Transactions in ledger ${ledgerId}:`);
for (const transaction of transactions.data) {
  console.log(`- Transaction ${transaction.id} (${transaction.status})`);
}
```

## Error Handling

Use enhanced recovery for critical operations:

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util';

// Create a ledger with enhanced recovery
const result = await withEnhancedRecovery(
  () => client.entities.organizations.createLedger(
    organizationId,
    ledgerInput
  )
);

if (result.success) {
  const ledger = result.data;
  console.log(`Ledger created: ${ledger.name} (${ledger.id})`);
} else {
  console.error(`Failed to create ledger: ${result.error.message}`);
}
```

## Best Practices

1. **Use the Builder Pattern**
   Always use the `createLedgerBuilder` function to create ledger inputs, as it ensures all required fields are provided and validation can occur.

2. **Include Meaningful Metadata**
   The metadata field is useful for storing application-specific information about ledgers, such as the base currency, description, or other contextual information.

3. **Organize Assets by Ledger**
   Group related assets within the same ledger to maintain logical separation of financial activities.

4. **Handle Pagination for Large Lists**
   When listing ledgers or items within ledgers, always account for pagination, especially if you expect a large number of items.

5. **Use Error Recovery**
   For critical operations, use the enhanced recovery mechanism to handle transient errors automatically.

## Example: Complete Ledger Management

```typescript
// Ledger management example
async function manageLedgers(client, organizationId) {
  try {
    // Create a new ledger
    const ledgerInput = createLedgerBuilder('Global Operations')
      .withMetadata({ 
        description: 'Global operations ledger',
        baseCurrency: 'USD',
        regionCode: 'GLOBAL'
      })
      .build();

    const ledger = await client.entities.organizations.createLedger(
      organizationId,
      ledgerInput
    );
    console.log(`Created ledger: ${ledger.name} (${ledger.id})`);

    // Get the ledger details
    const retrievedLedger = await client.entities.ledgers.getLedger(
      organizationId,
      ledger.id
    );
    console.log(`Retrieved ledger: ${retrievedLedger.name}`);

    // Create an asset in the ledger
    const assetInput = createAssetBuilder('US Dollar', 'USD')
      .withType('currency')
      .withMetadata({ precision: 2, symbol: '$' })
      .build();

    const asset = await client.entities.assets.createAsset(
      organizationId,
      ledger.id,
      assetInput
    );
    console.log(`Created asset in ledger: ${asset.name} (${asset.id})`);

    // Update the ledger
    const updatedLedger = await client.entities.ledgers.updateLedger(
      organizationId,
      ledger.id,
      {
        name: 'Global Financial Operations',
        metadata: {
          ...ledger.metadata,
          lastUpdated: new Date().toISOString(),
          version: '2.0'
        }
      }
    );
    console.log(`Updated ledger: ${updatedLedger.name}`);

    // List all ledgers
    const ledgers = await client.entities.organizations.listLedgers(
      organizationId,
      { limit: 10 }
    );
    console.log(`Listed ${ledgers.data.length} ledgers`);

    return {
      created: ledger,
      updated: updatedLedger,
      asset: asset,
      ledgers: ledgers.data
    };
  } catch (error) {
    console.error(`Ledger management error: ${error.message}`);
    throw error;
  }
}
```
