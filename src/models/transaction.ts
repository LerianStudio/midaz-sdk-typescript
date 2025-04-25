/**
 * Transaction model definitions
 */

import { ApiResponse, Status } from './common';

/**
 * Transaction model representing a financial transaction
 */
export interface Transaction extends ApiResponse {
  /** Unique system-generated identifier */
  id: string;
  /** Transaction amount */
  amount: number;
  /** Decimal scale for the amount */
  scale: number;
  /** Asset code for the transaction */
  assetCode: string;
  /** Current status of the transaction */
  status: Status;
  /** Ledger ID containing this transaction */
  ledgerId: string;
  /** Organization ID that owns this transaction */
  organizationId: string;
  /** List of operations that make up this transaction */
  operations: Operation[];
  /** Custom metadata fields for the transaction */
  metadata?: Record<string, any>;
  /** Timestamp when the transaction was created */
  createdAt: string;
  /** Timestamp when the transaction was last updated */
  updatedAt: string;
  /** Timestamp when the transaction was deleted */
  deletedAt?: string;
  /** Optional external identifier */
  externalId?: string;
  /** Optional description of the transaction */
  description?: string;
}

/**
 * Operation within a transaction
 */
export interface Operation {
  /** Unique system-generated identifier */
  id: string;
  /** Account ID this operation affects */
  accountId: string;
  /** Optional account alias */
  accountAlias?: string;
  /** Operation type (debit or credit) */
  type: 'DEBIT' | 'CREDIT';
  /** Amount for this operation */
  amount: Amount;
  /** Optional description of the operation */
  description?: string;
  /** Custom metadata fields for the operation */
  metadata?: Record<string, any>;
}

/**
 * Amount with asset code and scale
 */
export interface Amount {
  /** Numeric value as string or number */
  value: string | number;
  /** Asset code for the amount */
  assetCode: string;
  /** Decimal scale for the amount */
  scale: number;
}

/**
 * Input for creating a new transaction
 */
export interface CreateTransactionInput {
  /** Transaction amount */
  amount?: number;
  /** Decimal scale for the amount */
  scale?: number;
  /** Asset code for the transaction */
  assetCode?: string;
  /** Description of the transaction */
  description?: string;
  /** Chart of accounts group name */
  chartOfAccountsGroupName?: string;
  /** List of operations for this transaction */
  operations: OperationInput[];
  /** Custom metadata fields for the transaction */
  metadata?: Record<string, any>;
  /** Optional external identifier */
  externalId?: string;
}

/**
 * Input for an operation within a transaction
 */
export interface OperationInput {
  /** Account ID this operation affects */
  accountId: string;
  /** Optional account alias */
  accountAlias?: string;
  /** Operation type (debit or credit) */
  type: 'DEBIT' | 'CREDIT';
  /** Amount for this operation */
  amount: AmountInput;
  /** Optional description of the operation */
  description?: string;
  /** Custom metadata fields for the operation */
  metadata?: Record<string, any>;
}

/**
 * Input for an amount with asset code and scale
 */
export interface AmountInput {
  /** Numeric value as string or number */
  value: string | number;
  /** Asset code for the amount */
  assetCode: string;
  /** Decimal scale for the amount */
  scale: number;
}

// Transformation logic moved to transaction-transformer.ts

/**
 * Input for updating an existing transaction
 */
export interface UpdateTransactionInput {
  /** Updated custom metadata fields for the transaction */
  metadata?: Record<string, any>;
  /** Updated description of the transaction */
  description?: string;
  /** Updated external identifier */
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
