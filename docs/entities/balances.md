# Working with Balances

This guide explains how to work with account balances using the Midaz SDK.

## Balance Model

The Balance model represents an account's financial state for a specific asset and has the following structure:

```typescript
interface Balance {
  id: string;
  organizationId: string;
  ledgerId: string;
  accountId: string;
  alias: string;
  key: string;
  assetCode: string;
  available: string;
  onHold: string;
  overdraftUsed: string;
  direction?: BalanceDirection;
  settings?: BalanceSettings;
  version: number;
  accountType: string;
  allowSending: boolean;
  allowReceiving: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  metadata?: Record<string, any>;
}
```

Key components of a Balance:

- **Available**: The amount that can be freely used in transactions
- **OnHold**: The amount that is reserved but not yet settled (e.g., pending transactions)
- **Total**: The sum of Available and OnHold amounts
- **Key**: Names the balance within its account; an account starts with one keyed `default`
- **Permissions**: `allowSending` and `allowReceiving` control transaction capabilities

The monetary fields are **already-scaled decimal strings**, exactly as the ledger sends
them — `"110.50"` means one hundred and ten point five, not eleven thousand and fifty. There
is no `scale` field to divide by. Adding two of them with `+` concatenates the strings, so
coerce before any arithmetic, and reach for a decimal library rather than `Number` when a
value can exceed 2^53 or carry more precision than a double holds.

`deletedAt` is always present and is `null` while the balance is live, so test it against
`null` rather than `undefined`.

## Retrieving Balances

### List Balances in a Ledger

```typescript
// List all balances in a ledger
const balances = await client.entities.balances.listBalances(organizationId, ledgerId, {
  limit: 50,
});

console.log(`Balances on this page: ${balances.items.length}`);
for (const balance of balances.items) {
  // The amounts are decimal strings; coerce before doing arithmetic on them
  const availableAmount = Number(balance.available);
  const onHoldAmount = Number(balance.onHold);
  const totalAmount = availableAmount + onHoldAmount;

  console.log(`Account: ${balance.accountId}`);
  console.log(`Asset: ${balance.assetCode}`);
  console.log(`Available: ${availableAmount}`);
  console.log(`On Hold: ${onHoldAmount}`);
  console.log(`Total: ${totalAmount}`);
  console.log(`---`);
}
```

### List Balances for a Specific Account

```typescript
// List balances for a specific account
const accountBalances = await client.entities.balances.listAccountBalances(
  organizationId,
  ledgerId,
  accountId,
  { limit: 20 }
);

console.log(`This page carries ${accountBalances.items.length} balance(s)`);
for (const balance of accountBalances.items) {
  console.log(`${balance.assetCode} (${balance.key}): ${balance.available} available`);
}
```

This listing paginates by cursor, and one request returns one page however large `limit`
is. To walk every balance of an account, follow `nextCursor` until it is absent:

```typescript
async function everyAccountBalance(client, organizationId, ledgerId, accountId) {
  const all = [];
  let cursor = undefined;

  do {
    const page = await client.entities.balances.listAccountBalances(
      organizationId,
      ledgerId,
      accountId,
      { limit: 100, cursor }
    );

    all.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);

  return all;
}
```

### Get a Specific Balance

```typescript
// Get a specific balance by ID
const balance = await client.entities.balances.getBalance(organizationId, ledgerId, balanceId);

// The amounts arrive as decimal strings; coerce before adding them up
const availableAmount = Number(balance.available);
const onHoldAmount = Number(balance.onHold);
const totalAmount = availableAmount + onHoldAmount;

console.log(`Balance for account ${balance.accountId}, asset ${balance.assetCode}:`);
console.log(`Available: ${availableAmount}`);
console.log(`On Hold: ${onHoldAmount}`);
console.log(`Total: ${totalAmount}`);
console.log(`Sending allowed: ${balance.allowSending}`);
console.log(`Receiving allowed: ${balance.allowReceiving}`);
```

## Updating Balances

The SDK provides helper functions for creating balance update inputs:

```typescript
import { newUpdateBalanceInput, withAllowSending, withAllowReceiving } from 'midaz-sdk';

// Method 1: Use helper functions
const updateInput = withAllowSending(withAllowReceiving(newUpdateBalanceInput(), true), false);

// Method 2: Create input object directly
const directUpdateInput = {
  allowSending: false,
  allowReceiving: true,
};

// Update the balance
const updatedBalance = await client.entities.balances.updateBalance(
  organizationId,
  ledgerId,
  balanceId,
  updateInput
);

console.log(`Balance updated: ${updatedBalance.id}`);
console.log(`Sending allowed: ${updatedBalance.allowSending}`);
console.log(`Receiving allowed: ${updatedBalance.allowReceiving}`);
```

Note that:

- Only the permission settings can be updated directly
- Actual balance amounts are modified through transactions
- Updates need to include only the fields you want to change

## Deleting Balances

```typescript
// Delete a balance
await client.entities.balances.deleteBalance(organizationId, ledgerId, balanceId);

console.log(`Balance ${balanceId} has been deleted`);
```

## Error Handling

Use enhanced recovery for critical operations:

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util';

// Update a balance with enhanced recovery
const result = await withEnhancedRecovery(() =>
  client.entities.balances.updateBalance(organizationId, ledgerId, balanceId, updateInput)
);

if (result.success) {
  const balance = result.data;
  console.log(`Balance updated: ${balance.id}`);
} else {
  console.error(`Failed to update balance: ${result.error.message}`);
}
```

## Example: Balance Management

```typescript
// Balance management example
async function manageBalances(client, organizationId, ledgerId, accountId) {
  try {
    // List balances for the account
    const accountBalances = await client.entities.balances.listAccountBalances(
      organizationId,
      ledgerId,
      accountId,
      { limit: 10 }
    );

    console.log(`Account ${accountId} has ${accountBalances.items.length} balance(s)`);

    if (accountBalances.items.length > 0) {
      // Get the first balance
      const firstBalance = accountBalances.items[0];
      const balanceId = firstBalance.id;

      console.log(`Initial balance for ${firstBalance.assetCode}: ${firstBalance.available}`);
      console.log(`Sending allowed: ${firstBalance.allowSending}`);
      console.log(`Receiving allowed: ${firstBalance.allowReceiving}`);

      // Temporarily disable sending from this balance
      const updateInput = {
        allowSending: false,
      };

      const updatedBalance = await client.entities.balances.updateBalance(
        organizationId,
        ledgerId,
        balanceId,
        updateInput
      );

      console.log(`Updated balance:`);
      console.log(`Sending allowed: ${updatedBalance.allowSending}`);
      console.log(`Receiving allowed: ${updatedBalance.allowReceiving}`);

      // Re-enable sending
      const resetInput = {
        allowSending: true,
      };

      const resetBalance = await client.entities.balances.updateBalance(
        organizationId,
        ledgerId,
        balanceId,
        resetInput
      );

      console.log(`Reset balance:`);
      console.log(`Sending allowed: ${resetBalance.allowSending}`);

      return {
        initial: firstBalance,
        updated: updatedBalance,
        reset: resetBalance,
      };
    } else {
      console.log(`No balances found for account ${accountId}`);
      return null;
    }
  } catch (error) {
    console.error(`Balance management error: ${error.message}`);
    throw error;
  }
}
```

## Common Use Cases

### Account Freezing

Temporarily prevent withdrawals while still allowing deposits:

```typescript
// Freeze withdrawals from an account
async function freezeWithdrawals(client, organizationId, ledgerId, accountId) {
  // One request returns one page, so follow the cursor to reach every balance
  const results = [];
  let cursor = undefined;

  do {
    const page = await client.entities.balances.listAccountBalances(
      organizationId,
      ledgerId,
      accountId,
      { limit: 100, cursor }
    );

    for (const balance of page.items) {
      const updatedBalance = await client.entities.balances.updateBalance(
        organizationId,
        ledgerId,
        balance.id,
        {
          allowSending: false,
        }
      );
      results.push(updatedBalance);
    }

    cursor = page.nextCursor;
  } while (cursor);

  console.log(`Frozen withdrawals for ${results.length} balance(s) in account ${accountId}`);
  return results;
}
```

### Balance Monitoring

Monitor all balances in a ledger for accounting purposes:

```typescript
// Calculate total value across all accounts
async function calculateTotalLedgerValue(client, organizationId, ledgerId) {
  // List all balances in the ledger
  const balances = await client.entities.balances.listBalances(organizationId, ledgerId, {
    limit: 1000,
  });

  // Group by asset code
  const assetTotals = {};

  for (const balance of balances.items) {
    const assetCode = balance.assetCode;
    const amount = Number(balance.available) + Number(balance.onHold);

    if (!assetTotals[assetCode]) {
      assetTotals[assetCode] = 0;
    }

    assetTotals[assetCode] += amount;
  }

  // Display totals for each asset
  for (const [assetCode, total] of Object.entries(assetTotals)) {
    console.log(`Total ${assetCode}: ${total}`);
  }

  return assetTotals;
}
```
