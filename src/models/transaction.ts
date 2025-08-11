/**
 * Transaction model definitions
 */

import { ApiResponse, Status } from './common';

/**
 * Transaction represents a transaction in the Midaz Ledger.
 * A transaction is a financial event that affects one or more accounts
 * through a series of operations (debits and credits).
 * 
 * Transactions are the core financial records in the Midaz system, representing
 * the movement of assets between accounts. Each transaction consists of one or more
 * operations (debits and credits) that must balance (sum to zero) for each asset type.
 */
export interface Transaction extends ApiResponse {
  /** Unique identifier for the transaction - system-generated UUID */
  id: string;
  
  /** Template identifier for the transaction template used (optional) */
  template?: string;
  
  /** Numeric value of the transaction as a decimal string (e.g., "100.50") */
  amount: string;
  
  /** Asset code identifying the currency or asset type (e.g., "USD", "EUR", "BTC") */
  assetCode: string;
  
  /** Transaction route identifier that defines the overall flow of the transaction */
  route?: string;
  
  /** Current processing status of the transaction */
  status: Status;
  
  /** Chart of accounts group name for accounting categorization */
  chartOfAccountsGroupName?: string;
  
  /** List of source account aliases used in this transaction */
  source?: string[];
  
  /** List of destination account aliases used in this transaction */
  destination?: string[];
  
  /** Whether the transaction is in a pending state requiring explicit commitment */
  pending?: boolean;
  
  /** Ledger identifier this transaction belongs to */
  ledgerId: string;
  
  /** Organization identifier this transaction belongs to */
  organizationId: string;
  
  /** Individual debit and credit operations (sum must balance to zero) */
  operations?: Operation[];
  
  /** Additional custom data for the transaction */
  metadata?: Record<string, any>;
  
  /** Timestamp when the transaction was created */
  createdAt: string;
  
  /** Timestamp when the transaction was last updated */
  updatedAt: string;
  
  /** Timestamp when the transaction was deleted (if soft-deleted) */
  deletedAt?: string;
  
  /** Optional identifier for linking to external systems */
  externalId?: string;
  
  /** Human-readable description of the transaction */
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
  /** Chart of accounts code */
  chartOfAccounts?: string;
  /** Asset code for this operation */
  assetCode?: string;
  /** Custom metadata fields for the operation */
  metadata?: Record<string, any>;
}

/**
 * Amount represents the amount details for an operation.
 * This structure contains the value and asset code for an amount.
 */
export interface Amount {
  /** Asset identifies the currency or asset type for this amount */
  asset: string;
  /** Value is the numeric value of the amount as a decimal string */
  value: string;
}

/**
 * CreateTransactionInput is the input for creating a transaction.
 * This structure contains all the fields needed to create a new transaction.
 */
export interface CreateTransactionInput {
  /** Template is an optional identifier for the transaction template to use */
  template?: string;
  
  /** Amount is the numeric value of the transaction as a decimal string (used for validation) */
  amount?: string;
  
  /** AssetCode identifies the currency or asset type for this transaction */
  assetCode?: string;
  
  /** Operations contains the individual debit and credit operations (alternative to Send) */
  operations?: OperationInput[];
  
  /** ChartOfAccountsGroupName is REQUIRED by the API specification */
  chartOfAccountsGroupName: string;
  
  /** Description is a human-readable description of the transaction (REQUIRED by API) */
  description: string;
  
  /** Code is an optional identifier/reference code for the transaction */
  code?: string;
  
  /** Pending indicates whether the transaction should be created in a pending state */
  pending?: boolean;
  
  /** Route is the transaction route identifier (optional) */
  route?: string;
  
  /** Metadata contains additional custom data for the transaction */
  metadata?: Record<string, any>;
  
  /** ExternalID is an optional identifier for linking to external systems */
  externalId?: string;
  
  /** IdempotencyKey is a client-generated key to ensure transaction uniqueness */
  idempotencyKey?: string;
  
  /** Send contains the source and distribution information for the transaction (REQUIRED by API) */
  send?: SendInput;
}

/**
 * SendInput represents the send information for a transaction.
 * This structure contains the source and distribution details for a transaction.
 */
export interface SendInput {
  /** Asset identifies the currency or asset type for this transaction */
  asset: string;
  
  /** Value is the numeric value of the transaction as a decimal string */
  value: string;
  
  /** Source contains the source accounts for the transaction */
  source?: SourceInput;
  
  /** Distribute contains the destination accounts for the transaction */
  distribute?: DistributeInput;
}

/**
 * SourceInput represents the source information for a transaction.
 * This structure contains the source accounts for a transaction.
 */
export interface SourceInput {
  /** From contains the list of source accounts and amounts */
  from: FromToInput[];
}

/**
 * DistributeInput represents the distribution information for a transaction.
 * This structure contains the destination accounts for a transaction.
 */
export interface DistributeInput {
  /** To contains the list of destination accounts and amounts */
  to: FromToInput[];
}

/**
 * FromToInput represents a single source or destination account in a transaction.
 * This structure contains the account and amount details.
 */
export interface FromToInput {
  /** Account identifies the account affected by this operation */
  account: string;
  
  /** Amount specifies the amount details for this operation */
  amount: AmountInput;
  
  /** Route is the operation route identifier for this operation (optional) */
  route?: string;
  
  /** Description provides additional context for this operation (optional) */
  description?: string;
  
  /** ChartOfAccounts specifies the chart of accounts for this operation (optional) */
  chartOfAccounts?: string;
  
  /** AccountAlias provides an alternative account identifier (optional) */
  accountAlias?: string;
  
  /** Metadata contains additional custom data for this operation */
  metadata?: Record<string, any>;
}

/**
 * CreateOperationInput is the input for creating an operation.
 * This structure contains all the fields needed to create a new operation
 * as part of a transaction.
 */
export interface OperationInput {
  /** Type indicates whether this is a debit or credit operation */
  type: string;
  
  /** AccountID is the identifier of the account to be affected */
  accountId: string;
  
  /** Amount is the numeric value of the operation as a decimal string */
  amount: string;
  
  /** AssetCode identifies the currency or asset type for this operation */
  assetCode?: string;
  
  /** AccountAlias is an optional human-readable name for the account */
  accountAlias?: string;
  
  /** Route is the operation route identifier to use for this operation */
  route?: string;
}

/**
 * AmountInput represents the amount details for an operation input.
 * This structure contains the value and asset code for an amount input.
 */
export interface AmountInput {
  /** Asset identifies the currency or asset type for this amount */
  asset: string;
  /** Value is the numeric value of the amount as a decimal string */
  value: string;
}

// ========================================
// DSL Transaction Support
// ========================================

/**
 * DSLAmount represents an amount with a value and asset code for DSL transactions.
 * This is aligned with the lib-commons Amount structure.
 */
export interface DSLAmount {
  /** Value is the numeric value of the amount as a decimal string */
  value: string;
  
  /** Asset is the asset code for the amount */
  asset?: string;
}

/**
 * DSLFromTo represents a source or destination in a DSL transaction.
 * This is aligned with the lib-commons FromTo structure.
 */
export interface DSLFromTo {
  /** Account is the identifier of the account */
  account: string;
  
  /** Amount specifies the amount details if applicable */
  amount?: DSLAmount;
  
  /** Share is the sharing configuration */
  share?: Share;
  
  /** Remaining is an optional remaining account */
  remaining?: string;
  
  /** Rate is the exchange rate configuration */
  rate?: Rate;
  
  /** Description is a human-readable description */
  description?: string;
  
  /** ChartOfAccounts is the chart of accounts code */
  chartOfAccounts?: string;
  
  /** Metadata contains additional custom data */
  metadata?: Record<string, any>;
}

/**
 * DSLSource represents the source of a DSL transaction.
 * This is aligned with the lib-commons Source structure.
 */
export interface DSLSource {
  /** Remaining is an optional remaining account */
  remaining?: string;
  
  /** From is a collection of source accounts and amounts */
  from: DSLFromTo[];
}

/**
 * DSLDistribute represents the distribution of a DSL transaction.
 * This is aligned with the lib-commons Distribute structure.
 */
export interface DSLDistribute {
  /** Remaining is an optional remaining account */
  remaining?: string;
  
  /** To is a collection of destination accounts and amounts */
  to: DSLFromTo[];
}

/**
 * DSLSend represents the send operation in a DSL transaction.
 * This is aligned with the lib-commons Send structure.
 */
export interface DSLSend {
  /** Asset identifies the currency or asset type for this transaction */
  asset: string;
  
  /** Value is the numeric value of the transaction as a decimal string */
  value: string;
  
  /** Source specifies where the funds come from */
  source?: DSLSource;
  
  /** Distribute specifies where the funds go to */
  distribute?: DSLDistribute;
}

/**
 * Share represents sharing configuration for DSL transactions
 */
export interface Share {
  /** Percentage of the amount to be shared */
  percent?: number;
  
  /** Remaining account for any leftover amount */
  remaining?: string;
}

/**
 * Rate represents exchange rate configuration for DSL transactions
 */
export interface Rate {
  /** From asset code */
  from: string;
  
  /** To asset code */
  to: string;
  
  /** Exchange rate value */
  rate: number;
}

/**
 * TransactionDSLInput represents the input for creating a transaction using DSL.
 */
export interface TransactionDSLInput {
  /** Chart of accounts group name (REQUIRED by API) */
  chartOfAccountsGroupName: string;
  
  /** Description of the transaction (REQUIRED by API) */
  description: string;
  
  /** DSL send configuration */
  send: DSLSend;
  
  /** Additional custom metadata */
  metadata?: Record<string, any>;
  
  /** Optional external identifier */
  externalId?: string;
  
  /** Route configuration */
  route?: string;
  
  /** Whether transaction should be pending */
  pending?: boolean;
}

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
 * Creates a new transaction input with default values
 */
export function createTransactionInput(chartOfAccountsGroupName: string, description: string): CreateTransactionInput {
  return {
    chartOfAccountsGroupName,
    description,
  };
}

/**
 * Adds a debit operation to a transaction input
 */
export function addDebitOperation(
  transactionInput: CreateTransactionInput,
  _operation: OperationInput
): CreateTransactionInput {
  // Add implementation here
  return transactionInput;
}
