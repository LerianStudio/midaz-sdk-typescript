/**
 * Operation model definitions
 * 
 * This file contains all operation-related models and interfaces for the Midaz SDK.
 * Operations represent individual accounting entries (debits and credits) within transactions.
 */

import { ApiResponse, Status } from './common';

/**
 * Amount structure for operation amounts.
 * Contains the value with decimal precision support.
 */
export interface OperationAmount {
  /** The amount value as a decimal string or number */
  value: string | number;
}

/**
 * Operation Balance structure representing account balance information.
 * Contains available and on-hold amounts with decimal precision.
 */
export interface OperationBalance {
  /** Amount available for transactions */
  available: string | number;
  /** Amount on hold and unavailable for transactions */
  onHold: string | number;
}

/**
 * Complete Operation model representing a financial operation.
 * This represents a single accounting entry that affects account balances.
 */
export interface Operation extends ApiResponse {
  /** Unique identifier for the operation */
  id: string;
  /** Parent transaction identifier */
  transactionId: string;
  /** Human-readable description of the operation */
  description: string;
  /** Type of operation (DEBIT or CREDIT) */
  type: string;
  /** Asset code for the operation */
  assetCode: string;
  /** Chart of accounts code for accounting purposes */
  chartOfAccounts: string;
  /** Operation amount information */
  amount: OperationAmount;
  /** Balance before the operation */
  balance: OperationBalance;
  /** Balance after the operation */
  balanceAfter: OperationBalance;
  /** Operation status information */
  status: Status;
  /** Account identifier associated with this operation */
  accountId: string;
  /** Human-readable alias for the account */
  accountAlias: string;
  /** Balance identifier affected by this operation */
  balanceId: string;
  /** Organization identifier */
  organizationId: string;
  /** Ledger identifier */
  ledgerId: string;
  /** Route identifier */
  route?: string;
  /** Timestamp when the operation was created */
  createdAt: string;
  /** Timestamp when the operation was last updated */
  updatedAt: string;
  /** Timestamp when the operation was deleted (if soft-deleted) */
  deletedAt?: string;
  /** Additional custom attributes */
  metadata?: Record<string, any>;
}

/**
 * Update Operation Input for modifying existing operations.
 * Contains fields that can be modified after an operation is created.
 */
export interface UpdateOperationInput {
  /** Human-readable description of the operation */
  description?: string;
  /** Additional custom attributes */
  metadata?: Record<string, any>;
}

/**
 * Paginated Operations response structure.
 */
export interface Operations extends ApiResponse {
  /** Array of operation records returned in this page */
  items: Operation[];
  /** Pagination information */
  pagination: {
    limit: number;
    nextCursor?: string;
    prevCursor?: string;
  };
}

/**
 * Operation Log for audit purposes.
 * Represents an immutable log entry of operation state at a specific point in time.
 */
export interface OperationLog {
  /** Unique identifier for the operation */
  id: string;
  /** Parent transaction identifier */
  transactionId: string;
  /** Type of operation */
  type: string;
  /** Asset code for the operation */
  assetCode: string;
  /** Chart of accounts code for accounting purposes */
  chartOfAccounts: string;
  /** Operation amount information */
  amount: OperationAmount;
  /** Balance before the operation */
  balance: OperationBalance;
  /** Balance after the operation */
  balanceAfter: OperationBalance;
  /** Operation status information */
  status: Status;
  /** Account identifier associated with this operation */
  accountId: string;
  /** Human-readable alias for the account */
  accountAlias: string;
  /** Balance identifier affected by this operation */
  balanceId: string;
  /** Timestamp when the operation log was created */
  createdAt: string;
  /** Additional custom attributes for audit tracking */
  metadata?: Record<string, any>;
}

/**
 * Source represents the source of an operation.
 * Identifies where funds or assets are coming from in a transaction.
 */
export interface OperationSource {
  /** Unique identifier for the source account */
  id: string;
  /** Optional human-readable name for the source account */
  alias?: string;
  /** Indicates if this source is also a destination */
  destination: boolean;
}

/**
 * Destination represents the destination of an operation.
 * Identifies where funds or assets are going to in a transaction.
 */
export interface OperationDestination {
  /** Unique identifier for the destination account */
  id: string;
  /** Optional human-readable name for the destination account */
  alias?: string;
  /** Indicates if this destination is also a source */
  source: boolean;
}

/**
 * Create Operation Input for creating new operations.
 * Contains all fields needed to create a new operation as part of a transaction.
 */
export interface CreateOperationInput {
  /** Type indicates whether this is a debit or credit operation */
  type: string;
  /** Identifier of the account to be affected */
  accountId: string;
  /** Numeric value of the operation as a decimal string */
  amount: string;
  /** Currency or asset type for this operation */
  assetCode?: string;
  /** Optional human-readable name for the account */
  accountAlias?: string;
  /** Operation route identifier for this operation */
  route?: string;
  /** Chart of accounts code */
  chartOfAccounts?: string;
  /** Optional description */
  description?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Enhanced Operation Input with additional validation and helper fields
 */
export interface EnhancedOperationInput extends CreateOperationInput {
  /** Scale for decimal precision */
  scale?: number;
  /** Whether to validate the operation before creation */
  validate?: boolean;
}

// ========================================
// Operation Validation Functions
// ========================================

/**
 * Validates a Create Operation Input
 */
export function validateCreateOperationInput(input: CreateOperationInput): string | null {
  // Validate required fields
  if (!input.type) {
    return 'Type is required';
  }

  // Validate type is a valid operation type
  if (input.type !== 'DEBIT' && input.type !== 'CREDIT') {
    return `Type must be either DEBIT or CREDIT, got ${input.type}`;
  }

  if (!input.accountId) {
    return 'AccountId is required';
  }

  // Validate amount
  if (!input.amount) {
    return 'Amount is required';
  }

  // Validate amount is a valid number
  const amount = parseFloat(input.amount);
  if (isNaN(amount) || amount <= 0) {
    return 'Amount must be a positive number';
  }

  // Validate asset code if provided
  if (!input.assetCode) {
    return 'AssetCode is required';
  }

  return null;
}

/**
 * Validates an Update Operation Input
 */
export function validateUpdateOperationInput(input: UpdateOperationInput): string | null {
  // Validate description length if provided
  if (input.description && input.description.length > 256) {
    return 'Description must not exceed 256 characters';
  }

  return null;
}

// ========================================
// Operation Utility Functions
// ========================================

/**
 * Creates a new operation amount object
 */
export function createOperationAmount(value: string | number): OperationAmount {
  return { value };
}

/**
 * Creates a new operation balance object
 */
export function createOperationBalance(available: string | number, onHold: string | number = 0): OperationBalance {
  return { available, onHold };
}

/**
 * Checks if an operation amount is empty
 */
export function isOperationAmountEmpty(amount?: OperationAmount): boolean {
  return !amount || amount.value === undefined || amount.value === null;
}

/**
 * Checks if an operation balance is empty
 */
export function isOperationBalanceEmpty(balance?: OperationBalance): boolean {
  return !balance || (balance.available === undefined && balance.onHold === undefined);
}

/**
 * Converts operation amount to number
 */
export function operationAmountToNumber(amount: OperationAmount): number {
  if (typeof amount.value === 'number') {
    return amount.value;
  }
  const parsed = parseFloat(amount.value);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Converts operation balance to numbers
 */
export function operationBalanceToNumbers(balance: OperationBalance): { available: number; onHold: number } {
  const available = typeof balance.available === 'number' ? balance.available : parseFloat(balance.available.toString());
  const onHold = typeof balance.onHold === 'number' ? balance.onHold : parseFloat(balance.onHold.toString());
  
  return {
    available: isNaN(available) ? 0 : available,
    onHold: isNaN(onHold) ? 0 : onHold
  };
}

/**
 * Creates a new Create Operation Input with default values
 */
export function newCreateOperationInput(type: 'DEBIT' | 'CREDIT', accountId: string, amount: string, assetCode: string): CreateOperationInput {
  return {
    type,
    accountId,
    amount,
    assetCode
  };
}

/**
 * Creates a new Update Operation Input
 */
export function newUpdateOperationInput(): UpdateOperationInput {
  return {};
}

/**
 * Builder class for Create Operation Input
 */
export class CreateOperationInputBuilder {
  private input: CreateOperationInput;

  constructor(type: 'DEBIT' | 'CREDIT', accountId: string, amount: string, assetCode: string) {
    this.input = newCreateOperationInput(type, accountId, amount, assetCode);
  }

  withAccountAlias(alias: string): CreateOperationInputBuilder {
    this.input.accountAlias = alias;
    return this;
  }

  withRoute(route: string): CreateOperationInputBuilder {
    this.input.route = route;
    return this;
  }

  withChartOfAccounts(chartOfAccounts: string): CreateOperationInputBuilder {
    this.input.chartOfAccounts = chartOfAccounts;
    return this;
  }

  withDescription(description: string): CreateOperationInputBuilder {
    this.input.description = description;
    return this;
  }

  withMetadata(metadata: Record<string, any>): CreateOperationInputBuilder {
    this.input.metadata = metadata;
    return this;
  }

  build(): CreateOperationInput {
    return { ...this.input };
  }
}

/**
 * Builder class for Update Operation Input
 */
export class UpdateOperationInputBuilder {
  private input: UpdateOperationInput;

  constructor() {
    this.input = newUpdateOperationInput();
  }

  withDescription(description: string): UpdateOperationInputBuilder {
    this.input.description = description;
    return this;
  }

  withMetadata(metadata: Record<string, any>): UpdateOperationInputBuilder {
    this.input.metadata = metadata;
    return this;
  }

  build(): UpdateOperationInput {
    return { ...this.input };
  }
}

// ========================================
// Operation Helper Functions
// ========================================

/**
 * Creates a debit operation input
 */
export function createDebitOperation(accountId: string, amount: string, assetCode: string): CreateOperationInput {
  return newCreateOperationInput('DEBIT', accountId, amount, assetCode);
}

/**
 * Creates a credit operation input
 */
export function createCreditOperation(accountId: string, amount: string, assetCode: string): CreateOperationInput {
  return newCreateOperationInput('CREDIT', accountId, amount, assetCode);
}

/**
 * Checks if an operation is a debit
 */
export function isDebitOperation(operation: Operation): boolean {
  return operation.type === 'DEBIT';
}

/**
 * Checks if an operation is a credit
 */
export function isCreditOperation(operation: Operation): boolean {
  return operation.type === 'CREDIT';
}

/**
 * Gets the total balance from operation balance
 */
export function getTotalBalance(balance: OperationBalance): number {
  const numbers = operationBalanceToNumbers(balance);
  return numbers.available + numbers.onHold;
}

/**
 * Calculates balance change from before and after balances
 */
export function calculateBalanceChange(before: OperationBalance, after: OperationBalance): {
  availableChange: number;
  onHoldChange: number;
  totalChange: number;
} {
  const beforeNumbers = operationBalanceToNumbers(before);
  const afterNumbers = operationBalanceToNumbers(after);

  return {
    availableChange: afterNumbers.available - beforeNumbers.available,
    onHoldChange: afterNumbers.onHold - beforeNumbers.onHold,
    totalChange: getTotalBalance(after) - getTotalBalance(before)
  };
}

// ========================================
// Legacy Compatibility
// ========================================

/**
 * Legacy Amount interface for backward compatibility
 * @deprecated Use OperationAmount instead
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
 * Legacy OperationInput interface for backward compatibility
 * @deprecated Use CreateOperationInput instead
 */
export interface OperationInput {
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