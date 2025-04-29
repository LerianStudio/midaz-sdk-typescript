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
  assetCode: string;
  available: number;
  onHold: number;
  scale: number;
  version: number;
  accountType: string;
  allowSending: boolean;
  allowReceiving: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  metadata?: Record<string, any>;
}
```

Key components of a Balance:
- **Available**: The amount that can be freely used in transactions
- **OnHold**: The amount that is reserved but not yet settled (e.g., pending transactions)
- **Total**: The sum of Available and OnHold amounts
- **Scale**: The precision factor for currency values (e.g., 100 for dollars and cents)
- **Permissions**: `allowSending` and `allowReceiving` control transaction capabilities

## Retrieving Balances

### List Balances in a Ledger

```typescript
// List all balances in a ledger
const balances = await client.entities.balances.listBalances(
  organizationId,
  ledgerId,
  { 
    limit: 50,
    offset: 0
  }
);

console.log(`Total balances: ${balances.total}`);
for (const balance of balances.data) {
  // Calculate actual monetary values by dividing by scale
  const availableAmount = balance.available / balance.scale;
  const onHoldAmount = balance.onHold / balance.scale;
  const totalAmount = (balance.available + balance.onHold) / balance.scale;
  
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

console.log(`Account ${accountId} has ${accountBalances.data.length} balance(s)`);
for (const balance of accountBalances.data) {
  const availableAmount = balance.available / balance.scale;
  console.log(`${balance.assetCode}: ${availableAmount} available`);
}
```

### Get a Specific Balance

```typescript
// Get a specific balance by ID
const balance = await client.entities.balances.getBalance(
  organizationId,
  ledgerId,
  balanceId
);

// Calculate actual monetary values
const availableAmount = balance.available / balance.scale;
const onHoldAmount = balance.onHold / balance.scale;
const totalAmount = (balance.available + balance.onHold) / balance.scale;

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
const updateInput = withAllowSending(
  withAllowReceiving(newUpdateBalanceInput(), true),
  false
);

// Method 2: Create input object directly
const directUpdateInput = {
  allowSending: false,
  allowReceiving: true
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
await client.entities.balances.deleteBalance(
  organizationId,
  ledgerId,
  balanceId
);

console.log(`Balance ${balanceId} has been deleted`);
```

## Error Handling

Use enhanced recovery for critical operations:

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util';

// Update a balance with enhanced recovery
const result = await withEnhancedRecovery(
  () => client.entities.balances.updateBalance(
    organizationId,
    ledgerId,
    balanceId,
    updateInput
  )
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
    
    console.log(`Account ${accountId} has ${accountBalances.data.length} balance(s)`);
    
    if (accountBalances.data.length > 0) {
      // Get the first balance
      const firstBalance = accountBalances.data[0];
      const balanceId = firstBalance.id;
      
      // Calculate actual monetary values
      const availableAmount = firstBalance.available / firstBalance.scale;
      console.log(`Initial balance for ${firstBalance.assetCode}: ${availableAmount}`);
      console.log(`Sending allowed: ${firstBalance.allowSending}`);
      console.log(`Receiving allowed: ${firstBalance.allowReceiving}`);
      
      // Temporarily disable sending from this balance
      const updateInput = {
        allowSending: false
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
        allowSending: true
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
        reset: resetBalance
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
  // Get all balances for the account
  const accountBalances = await client.entities.balances.listAccountBalances(
    organizationId,
    ledgerId,
    accountId,
    { limit: 100 }
  );
  
  // Disable sending for all balances
  const results = [];
  for (const balance of accountBalances.data) {
    const updatedBalance = await client.entities.balances.updateBalance(
      organizationId,
      ledgerId,
      balance.id,
      {
        allowSending: false
      }
    );
    results.push(updatedBalance);
  }
  
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
  const balances = await client.entities.balances.listBalances(
    organizationId,
    ledgerId,
    { limit: 1000 }
  );
  
  // Group by asset code
  const assetTotals = {};
  
  for (const balance of balances.data) {
    const assetCode = balance.assetCode;
    const amount = (balance.available + balance.onHold) / balance.scale;
    
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
