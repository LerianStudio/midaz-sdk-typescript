import { ApiResponse, Status } from './common';

export interface Transaction extends ApiResponse {
  id: string;
  amount: number;
  scale: number;
  assetCode: string;
  status: Status;
  ledgerId: string;
  organizationId: string;
  operations: Operation[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  externalId?: string;
  description?: string;
}

export interface Operation {
  id: string;
  accountId: string;
  accountAlias?: string;
  type: 'DEBIT' | 'CREDIT';
  amount: Amount;
  description?: string;
  metadata?: Record<string, any>;
}

export interface Amount {
  value: string | number;
  assetCode: string;
  scale: number;
}

export interface CreateTransactionInput {
  amount?: number;
  scale?: number;
  assetCode?: string;
  description?: string;
  chartOfAccountsGroupName?: string;
  operations: OperationInput[];
  metadata?: Record<string, any>;
  externalId?: string;
}

export interface OperationInput {
  accountId: string;
  accountAlias?: string;
  type: 'DEBIT' | 'CREDIT';
  amount: AmountInput;
  description?: string;
  metadata?: Record<string, any>;
}

export interface AmountInput {
  value: string | number;
  assetCode: string;
  scale: number;
}

// Transformation logic moved to transaction-transformer.ts

export interface UpdateTransactionInput {
  metadata?: Record<string, any>;
  description?: string;
  externalId?: string;
}

/**
 * Transforms a client-side transaction model to library-specific format
 * @deprecated Use transaction-transformer.ts functionality instead
 */
export function toLibTransaction(input: CreateTransactionInput): any {
  // Set default scale if not provided
  const scale = input.scale || 2;
  
  // Group operations by type (DEBIT and CREDIT)
  const debits = (input.operations || []).filter(op => op.type === 'DEBIT').map(debit => ({
    account: debit.accountId,
    amount: {
      asset: debit.amount.assetCode,
      value: debit.amount.value,
      scale: debit.amount.scale || scale
    },
    description: debit.description || "Debit Operation",
    metadata: debit.metadata
  }));
  
  const credits = (input.operations || []).filter(op => op.type === 'CREDIT').map(credit => ({
    account: credit.accountId,
    amount: {
      asset: credit.amount.assetCode,
      value: credit.amount.value,
      scale: credit.amount.scale || scale
    },
    description: credit.description || "Credit Operation",
    metadata: credit.metadata
  }));
  
  // Calculate transaction amount from DEBIT operations if not provided
  let transactionAmount = input.amount;
  if (!transactionAmount && debits.length > 0) {
    // Sum up debit amounts
    transactionAmount = debits.reduce((sum, debit) => {
      const value = typeof debit.amount.value === 'string' 
        ? parseInt(debit.amount.value, 10) 
        : debit.amount.value;
      return sum + value;
    }, 0);
  }
  
  // Use asset code from first DEBIT operation if not provided
  const assetCode = input.assetCode || (debits[0]?.amount?.asset || (credits[0]?.amount?.asset));
  
  // Extract additional properties to include in the result
  const { operations: _operations, amount: _amount, scale: _inputScale, assetCode: _inputAssetCode, ...rest } = input;
  
  // Construct the result - exactly match expected format
  return {
    send: {
      asset: assetCode,
      value: transactionAmount,
      scale,
      source: {
        from: debits
      },
      distribute: {
        to: credits
      }
    },
    ...rest
  };
}
