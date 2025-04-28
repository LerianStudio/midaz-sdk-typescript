# Working with Ledgers

This guide explains how to work with ledgers using the Midaz SDK.

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
- Validation happens at runtime rather than during build
- Additional properties can be set using the chainable `with*` methods

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
// List ledgers for an organization
const ledgerList = await client.entities.organizations.listLedgers(
  organizationId,
  { limit: 50, offset: 0 }
);

console.log(`Total ledgers: ${ledgerList.total}`);
for (const ledger of ledgerList.data) {
  console.log(`- ${ledger.name} (${ledger.id})`);
}
```

## Updating Ledgers

```typescript
// Update a ledger
const updatedLedger = await client.entities.ledgers.updateLedger(
  organizationId,
  ledgerId,
  {
    name: 'Main Finance Ledger',
    metadata: {
      ...ledger.metadata,
      description: 'Updated primary finance ledger',
      lastAuditedAt: new Date().toISOString()
    }
  }
);
```

## Working with Ledger Assets

### List Assets in a Ledger

```typescript
// List assets in a ledger
const assetList = await client.entities.assets.listAssets(
  organizationId,
  ledgerId,
  { limit: 100 }
);

console.log(`Total assets in ledger: ${assetList.total}`);
for (const asset of assetList.data) {
  console.log(`- ${asset.name} (${asset.code})`);
}
```

### Add Assets to a Ledger

```typescript
// Create a new asset in the ledger
const assetInput = createAssetBuilder('Euro', 'EUR')
  .withType('currency')
  .withMetadata({ 
    precision: 2,
    symbol: '€'
  })
  .build();

const asset = await client.entities.assets.createAsset(
  organizationId,
  ledgerId,
  assetInput
);
```

## Working with Ledger Accounts

```typescript
// Create an account in the ledger
const accountInput = createAccountBuilder('Corporate Treasury', ledgerId)
  .withAssetIds(['asset1', 'asset2'])
  .withMetadata({ 
    accountType: 'treasury',
    department: 'Finance'
  })
  .build();

const account = await client.entities.accounts.createAccount(
  organizationId,
  accountInput
);

// List accounts in a ledger
const accountList = await client.entities.accounts.listAccounts(
  organizationId,
  ledgerId,
  { limit: 100 }
);

console.log(`Total accounts in ledger: ${accountList.total}`);
for (const acct of accountList.data) {
  console.log(`- ${acct.name} (${acct.id})`);
}
```

## Working with Ledger Transactions

```typescript
// List transactions in a ledger
const transactionList = await client.entities.transactions.listTransactions(
  organizationId,
  ledgerId,
  { 
    limit: 50, 
    offset: 0,
    fromDate: '2023-01-01T00:00:00Z',
    toDate: '2023-12-31T23:59:59Z'
  }
);

console.log(`Total transactions in ledger: ${transactionList.total}`);
for (const tx of transactionList.data) {
  console.log(`- ${tx.id} (${tx.type}): ${tx.status}`);
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

## Example: Complete Ledger Management

```typescript
// Ledger management example
async function manageLedgers(client, organizationId) {
  try {
    // Create a new ledger
    const ledgerInput = createLedgerBuilder('Finance Department')
      .withMetadata({ 
        description: 'Main finance department ledger',
        baseCurrency: 'USD',
        fiscalYear: '2023'
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

    // Create assets in the ledger
    const assetInput = createAssetBuilder('US Dollar', 'USD')
      .withType('currency')
      .withMetadata({ 
        precision: 2,
        symbol: '$'
      })
      .build();

    const asset = await client.entities.assets.createAsset(
      organizationId,
      ledger.id,
      assetInput
    );
    console.log(`Created asset: ${asset.name} (${asset.id})`);

    // Create an account in the ledger
    const accountInput = createAccountBuilder('Operating Account', ledger.id)
      .withAssetIds([asset.id])
      .withMetadata({ 
        accountType: 'operating',
        department: 'Finance'
      })
      .build();

    const account = await client.entities.accounts.createAccount(
      organizationId,
      accountInput
    );
    console.log(`Created account: ${account.name} (${account.id})`);

    // Update the ledger
    const updatedLedger = await client.entities.ledgers.updateLedger(
      organizationId,
      ledger.id,
      {
        name: 'Finance Department - 2023',
        metadata: {
          ...ledger.metadata,
          lastUpdatedBy: 'Finance Manager',
          lastUpdatedAt: new Date().toISOString()
        }
      }
    );
    console.log(`Updated ledger: ${updatedLedger.name}`);

    // List all ledgers for the organization
    const ledgers = await client.entities.organizations.listLedgers(
      organizationId,
      { limit: 10 }
    );
    console.log(`Listed ${ledgers.data.length} ledgers`);

    return {
      created: ledger,
      updated: updatedLedger,
      asset: asset,
      account: account,
      ledgers: ledgers.data
    };
  } catch (error) {
    console.error(`Ledger management error: ${error.message}`);
    throw error;
  }
}
```
