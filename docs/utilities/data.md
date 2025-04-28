# Data Utilities

The Midaz SDK provides utilities for handling financial data formatting and pagination. These utilities help with formatting monetary values appropriately and efficiently retrieving paginated data from the API.

## Formatting

The formatting utilities help display financial values in a human-readable format, with proper decimal places based on asset scale.

### Formatting Balances

```typescript
import { formatBalance } from 'midaz-sdk/util/data/formatting';

// Format a USD amount (scale 100)
const formattedUsd = formatBalance(1050, 100);
console.log(formattedUsd); // "10.50"

// Format a BTC amount (scale 100000000)
const formattedBtc = formatBalance(123456789, 100000000);
console.log(formattedBtc); // "1.23456789"

// Format with currency symbol and locale
const formattedEur = formatBalance(2050, 100, {
  locale: 'de-DE',
  currency: 'EUR'
});
console.log(formattedEur); // "20,50 €"
```

### Safe Balance Formatting

For cases where inputs might be nullable or invalid:

```typescript
import { formatBalanceSafely } from 'midaz-sdk/util/data/formatting';

// Safe formatting with different input types
const formatted1 = formatBalanceSafely(1050, 100);
console.log(formatted1); // "10.50"

const formatted2 = formatBalanceSafely("1050", "100");
console.log(formatted2); // "10.50"

// Handles invalid inputs
const formatted3 = formatBalanceSafely(undefined, 100);
console.log(formatted3); // "0.00"
```

### Formatting with Asset Code

```typescript
import { formatAmountWithAsset } from 'midaz-sdk/util/data/formatting';

// Format a USD amount with asset code
const formattedAmount = formatAmountWithAsset(1050, 100, "USD");
console.log(formattedAmount); // "10.50 USD"

// Format with symbol position
const formattedWithSymbol = formatAmountWithAsset(1050, 100, "USD", {
  symbolPosition: "before"
});
console.log(formattedWithSymbol); // "USD 10.50"
```

### Formatting Account Balances

```typescript
import { formatAccountBalance } from 'midaz-sdk/util/data/formatting';

// Format an account balance for display
const formattedBalance = formatAccountBalance({
  accountId: "acc_123",
  available: 10050,
  onHold: 500,
  assetCode: "USD",
  scale: 100
}, { 
  accountType: "Savings" 
});

console.log(formattedBalance.displayString);
// "USD (Savings acc_123): Available 100.50, On Hold 5.00"

// Access individual formatted values
console.log(formattedBalance.available); // "100.50"
console.log(formattedBalance.onHold); // "5.00"
```

### Calculating Decimal Places from Scale

```typescript
import { getDecimalPlacesFromScale } from 'midaz-sdk/util/data/formatting';

const usdDecimals = getDecimalPlacesFromScale(100);
console.log(usdDecimals); // 2

const btcDecimals = getDecimalPlacesFromScale(100000000);
console.log(btcDecimals); // 8
```

## Pagination

The Midaz SDK uses cursor-based pagination to handle large datasets efficiently. The pagination utilities make it easy to iterate through paginated results.

### Using the Paginator

The `Paginator` class implements the AsyncIterator interface, allowing it to be used in for-await-of loops:

```typescript
import { Paginator } from 'midaz-sdk/util/data/pagination';

// Create a paginator for accounts
const paginator = new Paginator<Account>({
  fetchPage: (options) => client.entities.accounts.listAccounts(orgId, ledgerId, options),
  pageSize: 25,
  maxItems: 100
});

// Method 1: Manual iteration
let result = await paginator.next();
while (!result.done) {
  const accounts = result.value;
  console.log(`Processing ${accounts.length} accounts`);
  // Process accounts...
  result = await paginator.next();
}

// Method 2: Reset and reuse
paginator.reset();
result = await paginator.next();
// Continue iteration...
```

### Using the Pagination Generator

For a more streamlined approach with async generators:

```typescript
import { paginateItems } from 'midaz-sdk/util/data/pagination';

// Create a pagination generator
const accountPages = paginateItems<Account>({
  fetchPage: (options) => client.entities.accounts.listAccounts(orgId, ledgerId, options),
  pageSize: 25
});

// Iterate through pages using for-await-of
for await (const accounts of accountPages) {
  console.log(`Processing ${accounts.length} accounts`);
  // Process accounts...
}
```

### Fetching All Items at Once

When you need all items in a single array:

```typescript
import { fetchAllItems } from 'midaz-sdk/util/data/pagination';

// Fetch all accounts (up to maxItems)
const allAccounts = await fetchAllItems<Account>({
  fetchPage: (options) => client.entities.accounts.listAccounts(orgId, ledgerId, options),
  maxItems: 1000  // Limit to 1000 accounts
});

console.log(`Fetched ${allAccounts.length} accounts in total`);
```

### Simplified All Pages Fetch

For the most common case of fetching all items:

```typescript
import { fetchAllPages } from 'midaz-sdk/util/data/pagination';

// Fetch all accounts across all pages
const allAccounts = await fetchAllPages(
  (options) => client.entities.accounts.listAccounts(orgId, ledgerId, options)
);

// Fetch all transactions with initial filtering
const allTransactions = await fetchAllPages(
  (options) => client.entities.transactions.listTransactions(orgId, ledgerId, options),
  { filter: { status: 'completed' } }
);
```

## Paginator Options

When creating a paginator, you can configure it with these options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fetchPage` | Function | (required) | Function to fetch a page of results |
| `initialOptions` | ListOptions | {} | Initial options for the first page request |
| `pageSize` | number | 100 | Number of items per page |
| `maxItems` | number | Infinity | Maximum total items to fetch |
| `maxPages` | number | Infinity | Maximum number of pages to fetch |
| `onPage` | Function | undefined | Callback for each page of results |

## Example: Processing Large Datasets Efficiently

When working with large datasets, it's important to process data efficiently to avoid memory issues:

```typescript
import { paginateItems } from 'midaz-sdk/util/data/pagination';
import { formatAccountBalance } from 'midaz-sdk/util/data/formatting';

async function analyzeAccountBalances(client, orgId, ledgerId) {
  // Set up counters
  let totalAccounts = 0;
  let totalBalance = 0;
  
  // Create paginator for processing accounts in batches
  const accountPages = paginateItems<Account>({
    fetchPage: (options) => client.entities.accounts.listAccounts(orgId, ledgerId, options),
    pageSize: 50,
    onPage: (accounts, meta) => {
      console.log(`Received page ${meta.currentPage} with ${accounts.length} accounts`);
    }
  });
  
  // Process each page as it arrives
  for await (const accounts of accountPages) {
    totalAccounts += accounts.length;
    
    // Process each account
    for (const account of accounts) {
      // Get account balances
      const balances = await client.entities.balances.listBalances(
        orgId, 
        ledgerId,
        { filter: { accountId: account.id } }
      );
      
      // Format and analyze balances
      for (const balance of balances.items) {
        const formatted = formatAccountBalance(balance);
        console.log(`Account ${account.id}: ${formatted.displayString}`);
        
        // Add to total (assuming USD for simplicity)
        if (balance.assetCode === 'USD') {
          totalBalance += balance.available;
        }
      }
    }
  }
  
  // Format the final total
  const formattedTotal = formatBalance(totalBalance, 100);
  console.log(`Analyzed ${totalAccounts} accounts with total balance: $${formattedTotal}`);
  
  return { totalAccounts, totalBalance };
}
```

## Combining Pagination with Concurrency

You can combine pagination with concurrency utilities for efficient processing:

```typescript
import { fetchAllPages } from 'midaz-sdk/util/data/pagination';
import { workerPool } from 'midaz-sdk/util/concurrency';
import { formatAmountWithAsset } from 'midaz-sdk/util/data/formatting';

async function processTransactions(client, orgId, ledgerId) {
  // Fetch all transactions
  const transactions = await fetchAllPages(
    (options) => client.entities.transactions.listTransactions(orgId, ledgerId, options),
    { filter: { status: 'completed' } }
  );
  
  console.log(`Processing ${transactions.length} transactions with concurrent workers`);
  
  // Process transactions concurrently
  const results = await workerPool({
    items: transactions,
    workerFn: async (transaction) => {
      // Get operations for the transaction
      const operations = await client.entities.operations.listOperations(
        orgId,
        ledgerId,
        transaction.accountId,
        { filter: { transactionId: transaction.id } }
      );
      
      // Format the amount for display
      const formattedAmount = formatAmountWithAsset(
        transaction.amount,
        transaction.scale,
        transaction.assetCode
      );
      
      return {
        id: transaction.id,
        formattedAmount,
        operationCount: operations.items.length
      };
    },
    options: {
      concurrency: 5
    }
  });
  
  return results;
}
```
