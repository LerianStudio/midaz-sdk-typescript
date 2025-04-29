# Working with Operations

This guide explains how to work with operations using the Midaz SDK.

## Operation Model

Operations are the individual entries that make up transactions and represent the actual debits and credits to accounts. The Operation model has the following structure:

```typescript
interface Operation {
  id: string;
  accountId: string;
  accountAlias?: string;
  type: 'DEBIT' | 'CREDIT';
  amount: {
    value: string | number;
    assetCode: string;
    scale: number;
  };
  description?: string;
  metadata?: Record<string, any>;
}
```

## Retrieving Operations

### List Operations for an Account

```typescript
// List operations for a specific account
const operations = await client.entities.operations.listOperations(
  organizationId,
  ledgerId,
  accountId,
  { 
    limit: 50,
    offset: 0
  }
);

console.log(`Total operations: ${operations.total}`);
for (const operation of operations.data) {
  const monetaryValue = Number(operation.amount.value) / operation.amount.scale;
  console.log(`Operation ${operation.id}: ${operation.type} ${monetaryValue} ${operation.amount.assetCode}`);
  console.log(`Account: ${operation.accountId}`);
}
```

### Get a Specific Operation

```typescript
// Get a specific operation by ID
const operation = await client.entities.operations.getOperation(
  organizationId,
  ledgerId,
  accountId,
  operationId,
  transactionId // optional
);

// Calculate the actual monetary value
const monetaryValue = Number(operation.amount.value) / operation.amount.scale;

console.log(`Operation Details:`);
console.log(`ID: ${operation.id}`);
console.log(`Type: ${operation.type}`);
console.log(`Amount: ${monetaryValue} ${operation.amount.assetCode}`);
console.log(`Account: ${operation.accountId}`);
if (operation.description) {
  console.log(`Description: ${operation.description}`);
}
```

## Updating Operations

```typescript
// Update an existing operation
const updatedOperation = await client.entities.operations.updateOperation(
  organizationId,
  ledgerId,
  accountId,
  operationId,
  {
    description: "Updated operation description",
    metadata: {
      category: "payroll",
      department: "engineering"
    }
  }
);

console.log(`Operation updated: ${updatedOperation.id}`);
```

Note that:
- Only metadata and description can typically be updated
- The core financial details (amount, type, etc.) cannot be modified directly
- To change financial details, you would need to create a new transaction

## Pagination and Iteration

The SDK provides several methods to work with large sets of operations:

### Using a Paginator

```typescript
// Create a paginator for operations
const paginator = client.entities.operations.getOperationPaginator(
  organizationId,
  ledgerId,
  accountId,
  { limit: 20 }
);

// Process operations in batches
while (await paginator.hasNext()) {
  const operationBatch = await paginator.next();
  console.log(`Processing batch of ${operationBatch.length} operations`);
  
  for (const operation of operationBatch) {
    // Process each operation
    console.log(`Processing operation ${operation.id}`);
  }
}
```

### Using Async Generator

```typescript
// Use async generator to iterate through operations
const operationsGenerator = client.entities.operations.iterateOperations(
  organizationId,
  ledgerId,
  accountId,
  { limit: 20 }
);

// Process operations in batches using for-await-of
for await (const operationBatch of operationsGenerator) {
  console.log(`Processing batch of ${operationBatch.length} operations`);
  
  for (const operation of operationBatch) {
    // Process each operation
    console.log(`Processing operation ${operation.id}`);
  }
}
```

### Getting All Operations

```typescript
// Get all operations for an account (convenience method)
const allOperations = await client.entities.operations.getAllOperations(
  organizationId,
  ledgerId,
  accountId,
  { 
    // Filtering options
    fromDate: '2023-01-01T00:00:00Z',
    toDate: '2023-01-31T23:59:59Z'
  }
);

console.log(`Retrieved ${allOperations.length} operations`);
```

## Error Handling

Use enhanced recovery for critical operations:

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util';

// Get operations with enhanced recovery
const result = await withEnhancedRecovery(
  () => client.entities.operations.listOperations(
    organizationId,
    ledgerId,
    accountId,
    { limit: 50 }
  )
);

if (result.success) {
  const operations = result.data;
  console.log(`Retrieved ${operations.data.length} operations`);
} else {
  console.error(`Failed to retrieve operations: ${result.error.message}`);
}
```

## Example: Operations Analysis

```typescript
// Operations analysis example
async function analyzeAccountOperations(client, organizationId, ledgerId, accountId, timeframe) {
  try {
    // Set up date range
    const today = new Date();
    let fromDate;
    
    if (timeframe === 'month') {
      fromDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    } else if (timeframe === 'quarter') {
      fromDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
    } else { // year
      fromDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    }
    
    // Get all operations in the date range
    const operations = await client.entities.operations.getAllOperations(
      organizationId,
      ledgerId,
      accountId,
      {
        fromDate: fromDate.toISOString(),
        toDate: today.toISOString()
      }
    );
    
    console.log(`Analyzing ${operations.length} operations from ${fromDate.toISOString()} to ${today.toISOString()}`);
    
    // Summarize by operation type
    const summary = {
      DEBIT: { count: 0, total: 0 },
      CREDIT: { count: 0, total: 0 }
    };
    
    // Group by month
    const monthlyActivity = {};
    
    for (const operation of operations) {
      const type = operation.type;
      const monetaryValue = Number(operation.amount.value) / operation.amount.scale;
      
      // Update summary
      summary[type].count += 1;
      summary[type].total += monetaryValue;
      
      // Update monthly activity
      const opDate = new Date(operation.createdAt);
      const monthKey = `${opDate.getFullYear()}-${opDate.getMonth() + 1}`;
      
      if (!monthlyActivity[monthKey]) {
        monthlyActivity[monthKey] = {
          DEBIT: { count: 0, total: 0 },
          CREDIT: { count: 0, total: 0 }
        };
      }
      
      monthlyActivity[monthKey][type].count += 1;
      monthlyActivity[monthKey][type].total += monetaryValue;
    }
    
    // Calculate net change
    const netChange = summary.CREDIT.total - summary.DEBIT.total;
    
    console.log(`Operation Summary for ${timeframe}:`);
    console.log(`Credits: ${summary.CREDIT.count} operations totaling ${summary.CREDIT.total}`);
    console.log(`Debits: ${summary.DEBIT.count} operations totaling ${summary.DEBIT.total}`);
    console.log(`Net Change: ${netChange}`);
    console.log('\nMonthly Breakdown:');
    
    for (const [month, data] of Object.entries(monthlyActivity)) {
      const monthlyNet = data.CREDIT.total - data.DEBIT.total;
      console.log(`${month}: Net Change: ${monthlyNet} (${data.CREDIT.count} credits, ${data.DEBIT.count} debits)`);
    }
    
    return {
      summary,
      monthlyActivity,
      netChange,
      operationCount: operations.length
    };
  } catch (error) {
    console.error(`Operation analysis error: ${error.message}`);
    throw error;
  }
}
```

## Common Use Cases

### Export Account Activity

```typescript
// Export account activity to CSV
async function exportAccountActivity(client, organizationId, ledgerId, accountId, timeframe) {
  // Get operations for the given timeframe
  const operations = await client.entities.operations.getAllOperations(
    organizationId,
    ledgerId,
    accountId,
    {
      // Set appropriate date filters based on timeframe
    }
  );
  
  // Convert to CSV
  let csv = 'Date,Type,Amount,Asset,Description\n';
  
  for (const op of operations) {
    const date = new Date(op.createdAt).toISOString().split('T')[0];
    const amount = Number(op.amount.value) / op.amount.scale;
    const description = op.description || 'N/A';
    
    csv += `${date},${op.type},${amount},${op.amount.assetCode},${description}\n`;
  }
  
  return csv;
}
```

### Reconcile Account Activity

```typescript
// Reconcile account operations with external records
async function reconcileOperations(client, organizationId, ledgerId, accountId, externalRecords) {
  // Get all operations for the account
  const operations = await client.entities.operations.getAllOperations(
    organizationId,
    ledgerId,
    accountId
  );
  
  // Map operations by external ID for quick lookup
  const opsByExternalId = {};
  for (const op of operations) {
    if (op.metadata && op.metadata.externalId) {
      opsByExternalId[op.metadata.externalId] = op;
    }
  }
  
  // Find matches and discrepancies
  const matched = [];
  const missing = [];
  const discrepancies = [];
  
  for (const record of externalRecords) {
    const operation = opsByExternalId[record.id];
    
    if (!operation) {
      missing.push(record);
    } else {
      const opAmount = Number(operation.amount.value) / operation.amount.scale;
      if (opAmount !== record.amount) {
        discrepancies.push({
          record,
          operation,
          difference: opAmount - record.amount
        });
      } else {
        matched.push({
          record,
          operation
        });
      }
    }
  }
  
  return {
    matched,
    missing,
    discrepancies
  };
}
```
