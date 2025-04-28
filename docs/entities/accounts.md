# Working with Accounts

This guide explains how to work with accounts using the Midaz SDK.

## What is an Account?

In the Midaz financial platform, an account is a holder of assets. Accounts are associated with a ledger and can hold one or more assets. They're used to track balances and participate in transactions.

## Account Model

The Account model has the following structure:

```typescript
interface Account {
  id: string;
  name: string;
  ledgerId: string;
  organizationId: string;
  status: Status;
  assetIds: string[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}
```

## Creating Accounts

### Using the Builder Pattern

The recommended way to create accounts is using the builder pattern through the `createAccountBuilder` function:

```typescript
import { createAccountBuilder } from 'midaz-sdk';

// Create an account input using the builder
const accountInput = createAccountBuilder('Savings Account', ledgerId)
  .withAssetIds(['asset1', 'asset2'])
  .withMetadata({ accountType: 'savings', interestRate: 2.5 })
  .build();

// Create the account
const account = await client.entities.accounts.createAccount(
  organizationId,
  accountInput
);
```

Note that:
- The `createAccountBuilder` function requires the `name` and `ledgerId` parameters as these are required fields
- The `status` field is set in the model but not included in the output of the builder
- Additional properties can be set using the chainable `with*` methods

### Creating Multiple Accounts

To create multiple accounts efficiently:

```typescript
// Create multiple accounts
const accountInputs = [
  createAccountBuilder('Checking Account', ledgerId)
    .withAssetIds(['usd'])
    .build(),
  createAccountBuilder('Savings Account', ledgerId)
    .withAssetIds(['usd', 'eur'])
    .build(),
  createAccountBuilder('Investment Account', ledgerId)
    .withAssetIds(['usd', 'eur', 'btc'])
    .build()
];

// Create accounts in parallel
const accounts = await Promise.all(
  accountInputs.map(input => 
    client.entities.accounts.createAccount(organizationId, input)
  )
);
```

## Retrieving Accounts

### Get a Specific Account

```typescript
// Get a specific account by ID
const account = await client.entities.accounts.getAccount(
  organizationId,
  accountId
);

console.log(`Account: ${account.name} (${account.id})`);
console.log(`Associated assets: ${account.assetIds.join(', ')}`);
```

### List Accounts

```typescript
// List accounts with pagination
const accountList = await client.entities.accounts.listAccounts(
  organizationId,
  ledgerId,
  { limit: 50, offset: 0 }
);

console.log(`Total accounts: ${accountList.total}`);
for (const account of accountList.data) {
  console.log(`- ${account.name} (${account.id})`);
  console.log(`  Assets: ${account.assetIds.join(', ')}`);
}
```

To handle pagination for large lists, use:

```typescript
import { processPaginatedResults } from 'midaz-sdk/util/data';

// Get all accounts across pages
const allAccounts = await processPaginatedResults(
  (options) => client.entities.accounts.listAccounts(organizationId, ledgerId, options)
);
```

## Updating Accounts

```typescript
// Update an account
const updatedAccount = await client.entities.accounts.updateAccount(
  organizationId,
  accountId,
  {
    name: 'Premium Savings Account',
    assetIds: [...account.assetIds, 'newAssetId'],
    metadata: {
      ...account.metadata,
      accountType: 'premium-savings',
      interestRate: 3.0
    }
  }
);
```

## Getting Account Balances

```typescript
// Get balances for an account
const balances = await client.entities.accounts.getAccountBalances(
  organizationId,
  accountId
);

for (const balance of balances) {
  console.log(`Asset: ${balance.assetId}, Balance: ${balance.amount}`);
}
```

## Error Handling

Use enhanced recovery for critical operations:

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util';

// Create an account with enhanced recovery
const result = await withEnhancedRecovery(
  () => client.entities.accounts.createAccount(
    organizationId,
    accountInput
  )
);

if (result.success) {
  const account = result.data;
  console.log(`Account created: ${account.name} (${account.id})`);
} else {
  console.error(`Failed to create account: ${result.error.message}`);
}
```

## Best Practices

1. **Use the Builder Pattern**
   Always use the `createAccountBuilder` function to create account inputs, as it ensures all required fields are provided and validation can occur.

2. **Include Meaningful Metadata**
   The metadata field is useful for storing application-specific information about accounts, such as account types, interest rates, or customer information.

3. **Carefully Manage Asset Associations**
   When adding or removing assets from an account, make sure to retrieve the current list first to avoid accidentally removing existing assets.

4. **Handle Pagination for Large Lists**
   When listing accounts, always account for pagination, especially if you expect a large number of accounts.

5. **Use Error Recovery**
   For critical operations, use the enhanced recovery mechanism to handle transient errors automatically.

## Example: Complete Account Management

```typescript
// Account management example
async function manageAccounts(client, organizationId, ledgerId, assetIds) {
  try {
    // Create a new account
    const accountInput = createAccountBuilder('Investment Account', ledgerId)
      .withAssetIds(assetIds)
      .withMetadata({ 
        accountType: 'investment',
        riskProfile: 'moderate',
        autoRebalance: true
      })
      .build();

    const account = await client.entities.accounts.createAccount(
      organizationId,
      accountInput
    );
    console.log(`Created account: ${account.name} (${account.id})`);

    // Get the account details
    const retrievedAccount = await client.entities.accounts.getAccount(
      organizationId,
      account.id
    );
    console.log(`Retrieved account: ${retrievedAccount.name}`);
    
    // Get account balances
    const balances = await client.entities.accounts.getAccountBalances(
      organizationId,
      account.id
    );
    console.log('Account balances:');
    for (const balance of balances) {
      console.log(`- Asset: ${balance.assetId}, Balance: ${balance.amount}`);
    }

    // Update the account
    const updatedAccount = await client.entities.accounts.updateAccount(
      organizationId,
      account.id,
      {
        name: 'Premium Investment Account',
        metadata: {
          ...account.metadata,
          riskProfile: 'aggressive',
          lastReviewDate: new Date().toISOString()
        }
      }
    );
    console.log(`Updated account: ${updatedAccount.name}`);

    // List all accounts
    const accounts = await client.entities.accounts.listAccounts(
      organizationId,
      ledgerId,
      { limit: 10 }
    );
    console.log(`Listed ${accounts.data.length} accounts`);

    return {
      created: account,
      updated: updatedAccount,
      balances: balances,
      list: accounts.data
    };
  } catch (error) {
    console.error(`Account management error: ${error.message}`);
    throw error;
  }
}
```
