# Working with Accounts

This guide explains how to work with accounts using the Midaz SDK.

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
- Validation happens at runtime rather than during build
- Additional properties can be set using the chainable `with*` methods

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
