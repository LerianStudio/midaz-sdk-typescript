/**
 * @file Transaction pair utilities for the Midaz SDK
 * @description Helper functions for creating complementary credit/debit transaction pairs
 */

import { MidazClient } from '../client';
import { ExecuteTransactionResult as _ExecuteTransactionResult, executeTransaction } from '../util/error/error-handler';
import { createTransferTransaction } from './transaction-builders';

/**
 * Options for creating a transaction pair
 */
export interface TransactionPairOptions {
  /**
   * Maximum number of retries for transaction execution
   * @default 2
   */
  maxRetries?: number;

  /**
   * Delay between transaction pair operations in milliseconds
   * @default 50
   */
  pairDelay?: number;

  /**
   * Additional metadata to include in both transactions
   */
  metadata?: Record<string, any>;

  /**
   * Callback function for successful transactions
   * @param type - The transaction type (credit or debit)
   * @param status - The transaction execution status
   */
  onSuccess?: (type: 'credit' | 'debit', status: string) => void;

  /**
   * Callback function for failed transactions
   * @param type - The transaction type (credit or debit)
   * @param error - The error that occurred
   */
  onError?: (type: 'credit' | 'debit', error: unknown) => void;
}

/**
 * Result of creating a transaction pair
 */
export interface TransactionPairResult {
  /**
   * Number of successful transactions
   */
  successCount: number;
  
  /**
   * Credit transaction result (success, duplicate, failed, retried)
   */
  creditStatus?: string;
  
  /**
   * Debit transaction result (success, duplicate, failed, retried)
   */
  debitStatus?: string;
  
  /**
   * Credit transaction error if any
   */
  creditError?: unknown;
  
  /**
   * Debit transaction error if any
   */
  debitError?: unknown;
}

/**
 * Creates a complementary pair of credit and debit transactions between two accounts
 * 
 * This function creates a credit transaction from source to destination,
 * followed by a debit transaction back from destination to source.
 * 
 * @param client - Midaz client instance
 * @param organizationId - Organization ID
 * @param ledgerId - Ledger ID
 * @param sourceAccountId - Source account ID
 * @param destinationAccountId - Destination account ID
 * @param creditAmount - Amount for the credit transaction
 * @param debitAmount - Amount for the debit transaction
 * @param assetCode - Asset code (e.g., "USD", "EUR", "BTC")
 * @param options - Transaction pair options
 * @returns Promise resolving to the transaction pair result
 * 
 * @example
 * ```typescript
 * // Create a credit/debit transaction pair between accounts
 * const result = await createTransactionPair(
 *   client,
 *   'org_123',
 *   'ledger_456',
 *   'acc_source',
 *   'acc_destination',
 *   100, // Credit $100 from source to destination
 *   50,  // Debit $50 back from destination to source
 *   'USD',
 *   {
 *     metadata: { batchId: 'batch_789', createdBy: 'workflow-script' },
 *     onSuccess: (type, status) => console.log(`${type} transaction: ${status}`)
 *   }
 * );
 * 
 * console.log(`Created ${result.successCount} transactions`);
 * ```
 */
export async function createTransactionPair(
  client: MidazClient,
  organizationId: string,
  ledgerId: string,
  sourceAccountId: string,
  destinationAccountId: string,
  creditAmount: number,
  debitAmount: number,
  assetCode: string,
  options: TransactionPairOptions = {}
): Promise<TransactionPairResult> {
  // Initialize result
  const result: TransactionPairResult = {
    successCount: 0
  };

  // Merge options with defaults
  const mergedOptions: Required<TransactionPairOptions> = {
    maxRetries: options.maxRetries ?? 2,
    pairDelay: options.pairDelay ?? 50,
    metadata: options.metadata ?? {},
    onSuccess: options.onSuccess ?? (() => { /* empty success handler */ }),
    onError: options.onError ?? (() => { /* empty error handler */ }),
  };
  
  // Add default metadata for transaction pair
  const metadata = {
    transactionPair: true,
    ...mergedOptions.metadata
  };

  try {
    // 1. Create and execute credit transaction
    const creditTx = createTransferTransaction(
      sourceAccountId,
      destinationAccountId,
      creditAmount,
      assetCode,
      0,
      `Credit to ${destinationAccountId} from ${sourceAccountId}`,
      { ...metadata, transactionType: 'credit' }
    );
    
    const { status: creditStatus, error: creditError } = await executeTransaction(
      () => client.entities.transactions.createTransaction(organizationId, ledgerId, creditTx),
      { maxRetries: mergedOptions.maxRetries }
    );
    
    result.creditStatus = creditStatus;
    
    if (creditStatus === 'success' || creditStatus === 'duplicate') {
      result.successCount++;
      mergedOptions.onSuccess('credit', creditStatus);
    } else if (creditError) {
      result.creditError = creditError;
      mergedOptions.onError('credit', creditError);
    }
    
    // Add a delay between transactions
    if (mergedOptions.pairDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, mergedOptions.pairDelay));
    }
    
    // 2. Create and execute debit transaction
    const debitTx = createTransferTransaction(
      destinationAccountId,
      sourceAccountId,
      debitAmount,
      assetCode,
      0,
      `Debit from ${destinationAccountId} to ${sourceAccountId}`,
      { ...metadata, transactionType: 'debit' }
    );
    
    const { status: debitStatus, error: debitError } = await executeTransaction(
      () => client.entities.transactions.createTransaction(organizationId, ledgerId, debitTx),
      { maxRetries: mergedOptions.maxRetries }
    );
    
    result.debitStatus = debitStatus;
    
    if (debitStatus === 'success' || debitStatus === 'duplicate') {
      result.successCount++;
      mergedOptions.onSuccess('debit', debitStatus);
    } else if (debitError) {
      result.debitError = debitError;
      mergedOptions.onError('debit', debitError);
    }
  } catch (error) {
    // Handle unexpected errors not caught by executeTransaction
    if (!result.creditStatus) {
      result.creditError = error;
      mergedOptions.onError('credit', error);
    } else {
      result.debitError = error;
      mergedOptions.onError('debit', error);
    }
  }
  
  return result;
}

/**
 * Creates transaction pairs for an array of accounts with the same asset
 * 
 * This function creates credit and debit transactions between accounts in the array.
 * Each account will have transactions with other accounts having the same asset.
 * 
 * @param client - Midaz client instance
 * @param organizationId - Organization ID 
 * @param ledgerId - Ledger ID
 * @param accounts - Array of accounts with the same asset
 * @param assetCode - Asset code
 * @param creditAmount - Amount for credit transactions (default: 25)
 * @param debitAmount - Amount for debit transactions (default: 10)
 * @param options - Transaction pair options
 * @returns Promise resolving to the number of successful transactions
 * 
 * @example
 * ```typescript
 * // Create transaction pairs for a group of accounts
 * const accounts = [
 *   { id: 'acc_1', name: 'Account 1' },
 *   { id: 'acc_2', name: 'Account 2' },
 *   { id: 'acc_3', name: 'Account 3' }
 * ];
 * 
 * const successCount = await createTransactionPairsForAccounts(
 *   client,
 *   'org_123',
 *   'ledger_456',
 *   accounts,
 *   'USD'
 * );
 * 
 * console.log(`Created ${successCount} transactions`);
 * ```
 */
export async function createTransactionPairsForAccounts(
  client: MidazClient,
  organizationId: string,
  ledgerId: string,
  accounts: Array<{ id: string; name?: string; }>,
  assetCode: string,
  creditAmount = 25,
  debitAmount = 10,
  options: TransactionPairOptions = {}
): Promise<number> {
  let successCount = 0;
  
  // Merge options with defaults
  const mergedOptions: Required<TransactionPairOptions> = {
    maxRetries: options.maxRetries ?? 2,
    pairDelay: options.pairDelay ?? 50,
    metadata: { 
      batchId: `batch_${Date.now()}`,
      createdBy: 'sdk-transaction-pairs',
      ...options.metadata 
    },
    onSuccess: options.onSuccess ?? (() => { /* empty success handler */ }),
    onError: options.onError ?? (() => { /* empty error handler */ }),
  };
  
  // Create pairs of transactions for each account: one credit and one debit
  for (const account of accounts) {
    // Find another account for transfers
    const otherAccounts = accounts.filter(a => a.id !== account.id);
    
    if (otherAccounts.length === 0) {
      continue;
    }
    
    // Choose a random other account for transfers
    const otherAccount = otherAccounts[Math.floor(Math.random() * otherAccounts.length)];
    
    // Create transaction pair
    const result = await createTransactionPair(
      client,
      organizationId,
      ledgerId,
      otherAccount.id,
      account.id,
      creditAmount,
      debitAmount,
      assetCode,
      {
        ...mergedOptions,
        metadata: {
          ...mergedOptions.metadata,
          sourceAccountName: otherAccount.name,
          destinationAccountName: account.name
        }
      }
    );
    
    successCount += result.successCount;
    
    // Add a delay between account pairs
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return successCount;
}

/**
 * Creates a full transaction pair cycle involving multiple accounts with the same asset
 * 
 * This function creates a circular flow of transactions between accounts,
 * where each account receives funds from one account and sends to another.
 * 
 * @param client - Midaz client instance
 * @param organizationId - Organization ID
 * @param ledgerId - Ledger ID
 * @param accounts - Array of accounts with the same asset
 * @param assetCode - Asset code
 * @param amount - Transaction amount
 * @param options - Transaction pair options
 * @returns Promise resolving to the number of successful transactions
 * 
 * @example
 * ```typescript
 * // Create a circular flow of transactions between accounts
 * const accounts = [
 *   { id: 'acc_1', name: 'Account 1' },
 *   { id: 'acc_2', name: 'Account 2' },
 *   { id: 'acc_3', name: 'Account 3' },
 *   { id: 'acc_4', name: 'Account 4' }
 * ];
 * 
 * const successCount = await createTransactionCycle(
 *   client,
 *   'org_123',
 *   'ledger_456',
 *   accounts,
 *   'USD',
 *   50
 * );
 * 
 * console.log(`Created ${successCount} transactions in cycle`);
 * ```
 */
export async function createTransactionCycle(
  client: MidazClient,
  organizationId: string,
  ledgerId: string,
  accounts: Array<{ id: string; name?: string; }>,
  assetCode: string,
  amount = 50,
  options: TransactionPairOptions = {}
): Promise<number> {
  let successCount = 0;
  
  // Need at least 2 accounts for a cycle
  if (accounts.length < 2) {
    return 0;
  }
  
  // Merge options with defaults
  const mergedOptions: Required<TransactionPairOptions> = {
    maxRetries: options.maxRetries ?? 2,
    pairDelay: options.pairDelay ?? 50,
    metadata: { 
      cycleId: `cycle_${Date.now()}`,
      createdBy: 'sdk-transaction-cycle',
      ...options.metadata 
    },
    onSuccess: options.onSuccess ?? (() => { /* empty success handler */ }),
    onError: options.onError ?? (() => { /* empty error handler */ }),
  };
  
  // Create a cycle where each account sends to the next account
  for (let i = 0; i < accounts.length; i++) {
    const sourceAccount = accounts[i];
    const destinationAccount = accounts[(i + 1) % accounts.length]; // Wrap around to first account
    
    // Create transfer transaction
    const transferTx = createTransferTransaction(
      sourceAccount.id,
      destinationAccount.id,
      amount,
      assetCode,
      0,
      `Cycle transfer from ${sourceAccount.name || sourceAccount.id} to ${destinationAccount.name || destinationAccount.id}`,
      { 
        ...mergedOptions.metadata,
        transactionType: 'cycle',
        cyclePosition: i + 1,
        cycleTotal: accounts.length
      }
    );
    
    // Execute transaction
    const { status } = await executeTransaction(
      () => client.entities.transactions.createTransaction(organizationId, ledgerId, transferTx),
      { maxRetries: mergedOptions.maxRetries }
    );
    
    if (status === 'success' || status === 'duplicate') {
      successCount++;
      mergedOptions.onSuccess('credit', status);
    }
    
    // Add a delay between transactions
    if (mergedOptions.pairDelay > 0 && i < accounts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, mergedOptions.pairDelay));
    }
  }
  
  return successCount;
}

/**
 * Options for executing a transaction pair
 */
export interface ExecuteTransactionPairOptions {
  /**
   * Maximum number of retries for failed transactions
   * @default 2
   */
  maxRetries?: number;
  
  /**
   * Delay between credit and debit transactions in milliseconds
   * @default 50
   */
  delayBetweenTransactions?: number;
  
  /**
   * Whether to continue with the debit transaction if the credit transaction fails
   * @default false
   */
  continueOnCreditFailure?: boolean;
}

/**
 * Result of executing a transaction pair
 */
export interface ExecuteTransactionPairResult {
  /**
   * Credit transaction status (success, duplicate, failed, etc.)
   */
  creditStatus: string;
  
  /**
   * Debit transaction status (success, duplicate, failed, etc.)
   */
  debitStatus: string;
  
  /**
   * Credit transaction error if any
   */
  creditError?: unknown;
  
  /**
   * Debit transaction error if any
   */
  debitError?: unknown;
  
  /**
   * Number of successful transactions (0, 1, or 2)
   */
  successCount: number;
}

/**
 * Executes a pair of credit and debit transactions with enhanced error handling
 * 
 * @param creditTxFn - Function that creates and executes the credit transaction
 * @param debitTxFn - Function that creates and executes the debit transaction
 * @param options - Options for executing the transaction pair
 * @returns Promise resolving to the transaction pair execution result
 * 
 * @example
 * ```typescript
 * // Execute a pair of credit and debit transactions
 * const result = await executeTransactionPair(
 *   () => client.entities.transactions.createTransaction(orgId, ledgerId, creditTx),
 *   () => client.entities.transactions.createTransaction(orgId, ledgerId, debitTx),
 *   { maxRetries: 3, delayBetweenTransactions: 100 }
 * );
 * 
 * console.log(`Credit status: ${result.creditStatus}`);
 * console.log(`Debit status: ${result.debitStatus}`);
 * console.log(`Successful transactions: ${result.successCount}`);
 * ```
 */
export async function executeTransactionPair<T, U>(
  creditTxFn: () => Promise<T>,
  debitTxFn: () => Promise<U>,
  options: ExecuteTransactionPairOptions = {}
): Promise<ExecuteTransactionPairResult> {
  // Merge options with defaults
  const mergedOptions = {
    maxRetries: options.maxRetries ?? 2,
    delayBetweenTransactions: options.delayBetweenTransactions ?? 50,
    continueOnCreditFailure: options.continueOnCreditFailure ?? false
  };
  
  // Initialize result
  const result: ExecuteTransactionPairResult = {
    creditStatus: 'pending',
    debitStatus: 'pending',
    successCount: 0
  };
  
  // Execute credit transaction
  const creditResult = await executeTransaction(
    creditTxFn,
    { maxRetries: mergedOptions.maxRetries }
  );
  
  result.creditStatus = creditResult.status;
  if (creditResult.error) {
    result.creditError = creditResult.error;
  }
  
  if (creditResult.status === 'success' || creditResult.status === 'duplicate') {
    result.successCount++;
  }
  
  // If credit transaction failed and we're not continuing on failure, return early
  if (creditResult.status === 'failed' && !mergedOptions.continueOnCreditFailure) {
    result.debitStatus = 'skipped';
    return result;
  }
  
  // Add delay between transactions
  if (mergedOptions.delayBetweenTransactions > 0) {
    await new Promise(resolve => setTimeout(resolve, mergedOptions.delayBetweenTransactions));
  }
  
  // Execute debit transaction
  const debitResult = await executeTransaction(
    debitTxFn,
    { maxRetries: mergedOptions.maxRetries }
  );
  
  result.debitStatus = debitResult.status;
  if (debitResult.error) {
    result.debitError = debitResult.error;
  }
  
  if (debitResult.status === 'success' || debitResult.status === 'duplicate') {
    result.successCount++;
  }
  
  return result;
}