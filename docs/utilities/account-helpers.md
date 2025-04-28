# Account Helpers

The Midaz SDK provides a set of utility functions for working with accounts, including classification, filtering, and identification. These helpers can simplify common account management operations.

## Available Helper Functions

### Checking Account Types

#### `isExternalAccount`

Determines if an account ID belongs to an external account.

```typescript
import { isExternalAccount } from 'midaz-sdk/util/account';

// Check if an account is external
const externalId = '@external/USD';
const isExternal = isExternalAccount(externalId);
console.log(isExternal); // true

const regularId = 'acc_12345';
const isRegular = isExternalAccount(regularId);
console.log(isRegular); // false
```

#### `isSystemAccount`

Checks if an account is a system account (including external accounts).

```typescript
import { isSystemAccount } from 'midaz-sdk/util/account';

// Check if an account is a system account
const systemAccount = {
  id: '@external/USD',
  name: 'External USD Account'
};
const isSystem = isSystemAccount(systemAccount);
console.log(isSystem); // true

const userAccount = {
  id: 'acc_12345',
  name: 'User Savings Account'
};
const isUser = isSystemAccount(userAccount);
console.log(isUser); // false
```

### Account Categorization

#### `categorizeAccounts`

Separates a list of accounts into regular and system accounts.

```typescript
import { categorizeAccounts } from 'midaz-sdk/util/account';

// Categorize a list of accounts
const allAccounts = await client.entities.accounts.listAccounts(
  organizationId,
  ledgerId,
  { limit: 100 }
);

const { regularAccounts, systemAccounts } = categorizeAccounts(allAccounts.data);

console.log(`Regular accounts: ${regularAccounts.length}`);
console.log(`System accounts: ${systemAccounts.length}`);

// Work with regular accounts
for (const account of regularAccounts) {
  // Process regular user accounts...
}
```

### Account Grouping

#### `groupAccountsByAsset`

Groups accounts by their associated asset codes, with optional filtering.

```typescript
import { groupAccountsByAsset } from 'midaz-sdk/util/account';

// Group accounts by asset
const allAccounts = await client.entities.accounts.listAccounts(
  organizationId,
  ledgerId,
  { limit: 100 }
);

// Group all accounts by asset
const accountsByAsset = groupAccountsByAsset(allAccounts.data);

// Count accounts per asset
Object.entries(accountsByAsset).forEach(([assetCode, accounts]) => {
  console.log(`${assetCode}: ${accounts.length} accounts`);
});

// Access all accounts of a specific asset
const usdAccounts = accountsByAsset['USD'] || [];
console.log(`USD accounts: ${usdAccounts.length}`);

// Filter to only accounts from a specific ledger
const ledgerAccounts = groupAccountsByAsset(allAccounts.data, {
  ledgerId: 'ldg_12345'
});
```

## Example Use Cases

### Filtering Out System Accounts for UI Display

```typescript
import { categorizeAccounts } from 'midaz-sdk/util/account';

async function getDisplayableAccounts(client, organizationId, ledgerId) {
  const allAccounts = await client.entities.accounts.listAccounts(
    organizationId,
    ledgerId,
    { limit: 200 }
  );
  
  // Filter out system accounts for user display
  const { regularAccounts } = categorizeAccounts(allAccounts.data);
  
  return regularAccounts.map(account => ({
    id: account.id,
    name: account.name,
    assetIds: account.assetIds,
    status: account.status
  }));
}
```

### Account Dashboard Grouped by Asset Type

```typescript
import { groupAccountsByAsset } from 'midaz-sdk/util/account';

async function generateAccountDashboard(client, organizationId, ledgerId) {
  const allAccounts = await client.entities.accounts.listAccounts(
    organizationId,
    ledgerId,
    { limit: 200 }
  );
  
  // Group accounts by asset
  const accountsByAsset = groupAccountsByAsset(allAccounts.data);
  
  // Generate dashboard data
  const dashboardData = [];
  
  for (const [assetCode, accounts] of Object.entries(accountsByAsset)) {
    // Get asset details
    let assetInfo;
    try {
      assetInfo = await client.entities.assets.getAssetByCode(
        organizationId,
        ledgerId,
        assetCode
      );
    } catch (error) {
      assetInfo = { name: assetCode, code: assetCode };
    }
    
    // Calculate total accounts and active accounts
    const totalAccounts = accounts.length;
    const activeAccounts = accounts.filter(acc => acc.status.code === 'ACTIVE').length;
    
    dashboardData.push({
      assetCode,
      assetName: assetInfo.name,
      totalAccounts,
      activeAccounts,
      accountList: accounts
    });
  }
  
  return dashboardData;
}
```

### External Account Detection for Transfers

```typescript
import { isExternalAccount } from 'midaz-sdk/util/account';

function validateTransfer(sourceAccountId, destinationAccountId) {
  const isExternalSource = isExternalAccount(sourceAccountId);
  const isExternalDestination = isExternalAccount(destinationAccountId);
  
  if (isExternalSource && isExternalDestination) {
    throw new Error('Cannot transfer between two external accounts');
  }
  
  if (isExternalSource) {
    return { type: 'DEPOSIT', externalAccount: sourceAccountId, internalAccount: destinationAccountId };
  }
  
  if (isExternalDestination) {
    return { type: 'WITHDRAWAL', internalAccount: sourceAccountId, externalAccount: destinationAccountId };
  }
  
  return { type: 'INTERNAL_TRANSFER', sourceAccount: sourceAccountId, destinationAccount: destinationAccountId };
}
```
