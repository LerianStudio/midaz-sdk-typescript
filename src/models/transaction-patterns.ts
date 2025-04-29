/**
 * @file Transaction pattern utilities for the Midaz SDK
 * @description Helper functions for common financial transaction patterns and workflows
 */

import { MidazClient } from '../client';
import { executeTransaction } from '../util/error/error-handler';
import { createDepositTransaction, createTransferTransaction, createWithdrawalTransaction } from './transaction-builders';
import { createTransactionBatch } from './transaction-batch';
import { CreateTransactionInput } from './transaction';

/**
 * Options for transaction pattern functions
 */
export interface TransactionPatternOptions {
  /**
   * Whether to execute the transaction immediately
   * @default true
   */
  execute?: boolean;

  /**
   * Maximum number of retries for transaction execution
   * @default 2
   */
  maxRetries?: number;

  /**
   * Additional metadata to include in the transaction
   */
  metadata?: Record<string, any>;

  /**
   * Callback function for successful transaction
   */
  onSuccess?: (result: any) => void;

  /**
   * Callback function for failed transaction
   */
  onError?: (error: any) => void;

  /**
   * Client instance to use for transaction execution
   * Must be provided if execute is true
   */
  client?: MidazClient;

  /**
   * Organization ID for transaction execution
   * Must be provided if execute is true
   */
  organizationId?: string;

  /**
   * Ledger ID for transaction execution
   * Must be provided if execute is true
   */
  ledgerId?: string;
  
  /**
   * Scale for amount values
   * @default 0
   */
  scale?: number;

  /**
   * Transaction description
   * If not provided, a default description will be generated
   */
  description?: string;
}

/**
 * Result of a transaction pattern operation
 */
export interface TransactionPatternResult {
  /**
   * Transaction input created by the pattern
   */
  transaction: CreateTransactionInput;

  /**
   * Status of the transaction execution (success, failed, duplicate)
   * Only present if execute was true
   */
  status?: string;

  /**
   * Result of the transaction execution
   * Only present if execute was true and successful
   */
  result?: any;

  /**
   * Error that occurred during transaction execution
   * Only present if execute was true and failed
   */
  error?: any;
}

/**
 * Creates an initial deposit to fund an account
 * 
 * This pattern represents the common operation of funding an account
 * from an external source, usually as the first transaction for a new account.
 * 
 * @param destinationAccountId - Destination account ID
 * @param amount - Amount to deposit
 * @param assetCode - Asset code
 * @param options - Transaction pattern options
 * @returns Promise resolving to the transaction pattern result
 * 
 * @example
 * ```typescript
 * // Create and execute an initial deposit transaction
 * const result = await createInitialDeposit(
 *   'acc_new_user',
 *   1000,
 *   'USD',
 *   {
 *     client,
 *     organizationId: 'org_123',
 *     ledgerId: 'ledger_456',
 *     metadata: { 
 *       source: 'new-account-funding',
 *       userId: 'user_789'
 *     }
 *   }
 * );
 * 
 * console.log(`Initial deposit created: ${result.status}`);
 * ```
 */
export async function createInitialDeposit(
  destinationAccountId: string,
  amount: number,
  assetCode: string,
  options: TransactionPatternOptions = {}
): Promise<TransactionPatternResult> {
  // Merge options with defaults
  // Create a type with required fields but optional client
  type MergedOptions = Omit<Required<TransactionPatternOptions>, 'client'> & {
    client: MidazClient | undefined;
  };

  const mergedOptions: MergedOptions = {
    execute: options.execute ?? true,
    maxRetries: options.maxRetries ?? 2,
    metadata: { 
      transactionPattern: 'initial-deposit',
      ...options.metadata
    },
    onSuccess: options.onSuccess ?? (() => { /* empty success handler */ }),
    onError: options.onError ?? (() => { /* empty error handler */ }),
    client: options.client,
    organizationId: options.organizationId ?? '',
    ledgerId: options.ledgerId ?? '',
    scale: options.scale ?? 0,
    description: options.description ?? `Initial account funding for ${destinationAccountId}`
  };
  
  // Create the deposit transaction
  const transaction = createDepositTransaction(
    `@external/${assetCode}`,
    destinationAccountId,
    amount,
    assetCode,
    mergedOptions.scale,
    mergedOptions.description,
    mergedOptions.metadata
  );
  
  // Initialize result
  const result: TransactionPatternResult = {
    transaction
  };
  
  // Execute if requested
  if (mergedOptions.execute) {
    if (!mergedOptions.client || !mergedOptions.organizationId || !mergedOptions.ledgerId) {
      throw new Error('Client, organization ID, and ledger ID must be provided when execute is true');
    }
    
    const { status, result: txResult, error } = await executeTransaction(
      // We've checked these exist in the if statement above
      () => mergedOptions.client!.entities.transactions.createTransaction(
        mergedOptions.organizationId!,
        mergedOptions.ledgerId!,
        transaction
      ),
      { maxRetries: mergedOptions.maxRetries }
    );
    
    result.status = status;
    
    if (status === 'success' || status === 'duplicate') {
      result.result = txResult;
      mergedOptions.onSuccess(txResult);
    } else if (error) {
      result.error = error;
      mergedOptions.onError(error);
    }
  }
  
  return result;
}

/**
 * Creates a transfer between user accounts
 * 
 * This pattern represents the common operation of transferring funds
 * between two accounts owned by users within the system.
 * 
 * @param sourceAccountId - Source account ID
 * @param destinationAccountId - Destination account ID
 * @param amount - Amount to transfer
 * @param assetCode - Asset code
 * @param options - Transaction pattern options
 * @returns Promise resolving to the transaction pattern result
 * 
 * @example
 * ```typescript
 * // Create and execute a user-to-user transfer
 * const result = await createUserTransfer(
 *   'acc_user1',
 *   'acc_user2',
 *   50,
 *   'USD',
 *   {
 *     client,
 *     organizationId: 'org_123',
 *     ledgerId: 'ledger_456',
 *     metadata: { 
 *       transferType: 'peer-to-peer',
 *       memo: 'Dinner payment'
 *     }
 *   }
 * );
 * 
 * console.log(`Transfer created: ${result.status}`);
 * ```
 */
export async function createUserTransfer(
  sourceAccountId: string,
  destinationAccountId: string,
  amount: number,
  assetCode: string,
  options: TransactionPatternOptions = {}
): Promise<TransactionPatternResult> {
  // Create a type with required fields but optional client
  type MergedOptions = Omit<Required<TransactionPatternOptions>, 'client'> & {
    client: MidazClient | undefined;
  };
  
  // Merge options with defaults
  const mergedOptions: MergedOptions = {
    execute: options.execute ?? true,
    maxRetries: options.maxRetries ?? 2,
    metadata: { 
      transactionPattern: 'user-transfer',
      ...options.metadata
    },
    onSuccess: options.onSuccess ?? (() => { /* empty success handler */ }),
    onError: options.onError ?? (() => { /* empty error handler */ }),
    client: options.client,
    organizationId: options.organizationId ?? '',
    ledgerId: options.ledgerId ?? '',
    scale: options.scale ?? 0,
    description: options.description ?? `Transfer from ${sourceAccountId} to ${destinationAccountId}`
  };
  
  // Create the transfer transaction
  const transaction = createTransferTransaction(
    sourceAccountId,
    destinationAccountId,
    amount,
    assetCode,
    mergedOptions.scale,
    mergedOptions.description,
    mergedOptions.metadata
  );
  
  // Initialize result
  const result: TransactionPatternResult = {
    transaction
  };
  
  // Execute if requested
  if (mergedOptions.execute) {
    if (!mergedOptions.client || !mergedOptions.organizationId || !mergedOptions.ledgerId) {
      throw new Error('Client, organization ID, and ledger ID must be provided when execute is true');
    }
    
    const { status, result: txResult, error } = await executeTransaction(
      // We've checked these exist in the if statement above
      () => mergedOptions.client!.entities.transactions.createTransaction(
        mergedOptions.organizationId!,
        mergedOptions.ledgerId!,
        transaction
      ),
      { maxRetries: mergedOptions.maxRetries }
    );
    
    result.status = status;
    
    if (status === 'success' || status === 'duplicate') {
      result.result = txResult;
      mergedOptions.onSuccess(txResult);
    } else if (error) {
      result.error = error;
      mergedOptions.onError(error);
    }
  }
  
  return result;
}

/**
 * Creates a withdrawal to an external account
 * 
 * This pattern represents the common operation of withdrawing funds
 * from an internal account to an external destination.
 * 
 * @param sourceAccountId - Source account ID
 * @param amount - Amount to withdraw
 * @param assetCode - Asset code
 * @param options - Transaction pattern options
 * @returns Promise resolving to the transaction pattern result
 * 
 * @example
 * ```typescript
 * // Create and execute a withdrawal transaction
 * const result = await createUserWithdrawal(
 *   'acc_user1',
 *   200,
 *   'USD',
 *   {
 *     client,
 *     organizationId: 'org_123',
 *     ledgerId: 'ledger_456',
 *     metadata: { 
 *       withdrawalMethod: 'bank-transfer',
 *       bankReferenceId: 'bank_tx_abc123'
 *     }
 *   }
 * );
 * 
 * console.log(`Withdrawal created: ${result.status}`);
 * ```
 */
export async function createUserWithdrawal(
  sourceAccountId: string,
  amount: number,
  assetCode: string,
  options: TransactionPatternOptions = {}
): Promise<TransactionPatternResult> {
  // Create a type with required fields but optional client
  type MergedOptions = Omit<Required<TransactionPatternOptions>, 'client'> & {
    client: MidazClient | undefined;
  };
  
  // Merge options with defaults
  const mergedOptions: MergedOptions = {
    execute: options.execute ?? true,
    maxRetries: options.maxRetries ?? 2,
    metadata: { 
      transactionPattern: 'user-withdrawal',
      ...options.metadata
    },
    onSuccess: options.onSuccess ?? (() => { /* empty success handler */ }),
    onError: options.onError ?? (() => { /* empty error handler */ }),
    client: options.client,
    organizationId: options.organizationId ?? '',
    ledgerId: options.ledgerId ?? '',
    scale: options.scale ?? 0,
    description: options.description ?? `Withdrawal from ${sourceAccountId}`
  };
  
  // Create the withdrawal transaction
  const transaction = createWithdrawalTransaction(
    sourceAccountId,
    `@external/${assetCode}`,
    amount,
    assetCode,
    mergedOptions.scale,
    mergedOptions.description,
    mergedOptions.metadata
  );
  
  // Initialize result
  const result: TransactionPatternResult = {
    transaction
  };
  
  // Execute if requested
  if (mergedOptions.execute) {
    if (!mergedOptions.client || !mergedOptions.organizationId || !mergedOptions.ledgerId) {
      throw new Error('Client, organization ID, and ledger ID must be provided when execute is true');
    }
    
    const { status, result: txResult, error } = await executeTransaction(
      // We've checked these exist in the if statement above
      () => mergedOptions.client!.entities.transactions.createTransaction(
        mergedOptions.organizationId!,
        mergedOptions.ledgerId!,
        transaction
      ),
      { maxRetries: mergedOptions.maxRetries }
    );
    
    result.status = status;
    
    if (status === 'success' || status === 'duplicate') {
      result.result = txResult;
      mergedOptions.onSuccess(txResult);
    } else if (error) {
      result.error = error;
      mergedOptions.onError(error);
    }
  }
  
  return result;
}

/**
 * Creates a roundup savings transaction
 * 
 * This pattern represents the common operation of transferring the "spare change"
 * from a transaction to a savings account by rounding up to the nearest whole amount.
 * 
 * @param spendingAccountId - Spending account ID
 * @param savingsAccountId - Savings account ID
 * @param transactionAmount - Original transaction amount
 * @param roundupTo - Amount to round up to (default: 1)
 * @param assetCode - Asset code
 * @param options - Transaction pattern options
 * @returns Promise resolving to the transaction pattern result
 * 
 * @example
 * ```typescript
 * // Create a roundup savings transaction after a $4.35 purchase
 * const result = await createRoundupSavings(
 *   'acc_checking',
 *   'acc_savings',
 *   4.35,
 *   1, // Round up to the nearest $1
 *   'USD',
 *   {
 *     client,
 *     organizationId: 'org_123',
 *     ledgerId: 'ledger_456',
 *     metadata: { originalPurchaseId: 'tx_abc123' }
 *   }
 * );
 * 
 * console.log(`Roundup savings created: ${result.status}`);
 * console.log(`Roundup amount: ${result.transaction.operations[0].amount.value}`);
 * ```
 */
export async function createRoundupSavings(
  spendingAccountId: string,
  savingsAccountId: string,
  transactionAmount: number,
  roundupTo = 1,
  assetCode: string,
  options: TransactionPatternOptions = {}
): Promise<TransactionPatternResult> {
  // Calculate roundup amount
  const scale = options.scale ?? 2; // Default scale of 2 for currency
  const scaleFactor = 10 ** scale;
  
  // Convert amounts to integer representations based on scale
  const scaledAmount = Math.round(transactionAmount * scaleFactor);
  const scaledRoundup = roundupTo * scaleFactor;
  
  // Calculate the roundup amount
  const remainder = scaledAmount % scaledRoundup;
  const roundupAmount = remainder === 0 ? roundupTo : (scaledRoundup - remainder) / scaleFactor;
  
  // Create a type with required fields but optional client
  type MergedOptions = Omit<Required<TransactionPatternOptions>, 'client'> & {
    client: MidazClient | undefined;
  };
  
  // Merge options with defaults
  const mergedOptions: MergedOptions = {
    execute: options.execute ?? true,
    maxRetries: options.maxRetries ?? 2,
    metadata: { 
      transactionPattern: 'roundup-savings',
      originalAmount: transactionAmount,
      roundupTo,
      ...options.metadata
    },
    onSuccess: options.onSuccess ?? (() => { /* empty success handler */ }),
    onError: options.onError ?? (() => { /* empty error handler */ }),
    client: options.client,
    organizationId: options.organizationId ?? '',
    ledgerId: options.ledgerId ?? '',
    scale,
    description: options.description ?? `Roundup savings from ${spendingAccountId} to ${savingsAccountId}`
  };
  
  // Create the transfer transaction
  const transaction = createTransferTransaction(
    spendingAccountId,
    savingsAccountId,
    roundupAmount,
    assetCode,
    scale,
    mergedOptions.description,
    mergedOptions.metadata
  );
  
  // Initialize result
  const result: TransactionPatternResult = {
    transaction
  };
  
  // Execute if requested
  if (mergedOptions.execute) {
    if (!mergedOptions.client || !mergedOptions.organizationId || !mergedOptions.ledgerId) {
      throw new Error('Client, organization ID, and ledger ID must be provided when execute is true');
    }
    
    const { status, result: txResult, error } = await executeTransaction(
      // We've checked these exist in the if statement above
      () => mergedOptions.client!.entities.transactions.createTransaction(
        mergedOptions.organizationId!,
        mergedOptions.ledgerId!,
        transaction
      ),
      { maxRetries: mergedOptions.maxRetries }
    );
    
    result.status = status;
    
    if (status === 'success' || status === 'duplicate') {
      result.result = txResult;
      mergedOptions.onSuccess(txResult);
    } else if (error) {
      result.error = error;
      mergedOptions.onError(error);
    }
  }
  
  return result;
}

/**
 * Creates an automatic recurring payment
 * 
 * This pattern creates a transaction that represents an automatic
 * recurring payment such as a subscription or bill payment.
 * 
 * @param sourceAccountId - Source account ID (user account)
 * @param destinationAccountId - Destination account ID (merchant account)
 * @param amount - Payment amount
 * @param assetCode - Asset code
 * @param recurringReference - Reference ID for the recurring payment series
 * @param options - Transaction pattern options
 * @returns Promise resolving to the transaction pattern result
 * 
 * @example
 * ```typescript
 * // Create a recurring subscription payment
 * const result = await createRecurringPayment(
 *   'acc_user',
 *   'acc_netflix',
 *   14.99,
 *   'USD',
 *   'subscription_netflix_monthly',
 *   {
 *     client,
 *     organizationId: 'org_123',
 *     ledgerId: 'ledger_456',
 *     metadata: { 
 *       frequency: 'monthly',
 *       subscriptionName: 'Netflix Standard',
 *       nextBillingDate: '2023-05-15'
 *     }
 *   }
 * );
 * 
 * console.log(`Recurring payment created: ${result.status}`);
 * ```
 */
export async function createRecurringPayment(
  sourceAccountId: string,
  destinationAccountId: string,
  amount: number,
  assetCode: string,
  recurringReference: string,
  options: TransactionPatternOptions = {}
): Promise<TransactionPatternResult> {
  // Create a type with required fields but optional client
  type MergedOptions = Omit<Required<TransactionPatternOptions>, 'client'> & {
    client: MidazClient | undefined;
  };
  
  // Merge options with defaults
  const mergedOptions: MergedOptions = {
    execute: options.execute ?? true,
    maxRetries: options.maxRetries ?? 2,
    metadata: { 
      transactionPattern: 'recurring-payment',
      recurringReference,
      frequency: options.metadata?.frequency || 'monthly',
      paymentNumber: options.metadata?.paymentNumber || 1,
      ...options.metadata
    },
    onSuccess: options.onSuccess ?? (() => { /* empty success handler */ }),
    onError: options.onError ?? (() => { /* empty error handler */ }),
    client: options.client,
    organizationId: options.organizationId ?? '',
    ledgerId: options.ledgerId ?? '',
    scale: options.scale ?? 2,
    description: options.description ?? `Recurring payment from ${sourceAccountId} to ${destinationAccountId}`
  };
  
  // Create the transfer transaction
  const transaction = createTransferTransaction(
    sourceAccountId,
    destinationAccountId,
    amount,
    assetCode,
    mergedOptions.scale,
    mergedOptions.description,
    mergedOptions.metadata
  );
  
  // Initialize result
  const result: TransactionPatternResult = {
    transaction
  };
  
  // Execute if requested
  if (mergedOptions.execute) {
    if (!mergedOptions.client || !mergedOptions.organizationId || !mergedOptions.ledgerId) {
      throw new Error('Client, organization ID, and ledger ID must be provided when execute is true');
    }
    
    const { status, result: txResult, error } = await executeTransaction(
      // We've checked these exist in the if statement above
      () => mergedOptions.client!.entities.transactions.createTransaction(
        mergedOptions.organizationId!,
        mergedOptions.ledgerId!,
        transaction
      ),
      { maxRetries: mergedOptions.maxRetries }
    );
    
    result.status = status;
    
    if (status === 'success' || status === 'duplicate') {
      result.result = txResult;
      mergedOptions.onSuccess(txResult);
    } else if (error) {
      result.error = error;
      mergedOptions.onError(error);
    }
  }
  
  return result;
}

/**
 * Creates a split payment transaction
 * 
 * This pattern represents a payment that is split between multiple
 * recipients, such as a bill split or marketplace payment distribution.
 * 
 * @param sourceAccountId - Source account ID
 * @param destinations - Array of destination accounts and amounts
 * @param assetCode - Asset code
 * @param options - Transaction pattern options
 * @returns Promise resolving to the transaction batch result
 * 
 * @example
 * ```typescript
 * // Create a split payment for a dinner bill
 * const destinations = [
 *   { accountId: 'acc_user1', amount: 25.50, description: 'User 1 portion' },
 *   { accountId: 'acc_user2', amount: 32.75, description: 'User 2 portion' },
 *   { accountId: 'acc_user3', amount: 18.25, description: 'User 3 portion' }
 * ];
 * 
 * const result = await createSplitPayment(
 *   'acc_payer',
 *   destinations,
 *   'USD',
 *   {
 *     client,
 *     organizationId: 'org_123',
 *     ledgerId: 'ledger_456',
 *     metadata: { 
 *       splitReason: 'dinner-bill',
 *       restaurant: 'Pizza Palace'
 *     }
 *   }
 * );
 * 
 * console.log(`Split payment created: ${result.successCount} successful portions`);
 * ```
 */
/**
 * Creates a credit/debit transaction pair without executing them
 * 
 * This function creates a complementary pair of transactions: 
 * - A credit transaction from source to destination account
 * - A debit transaction for a (possibly different) amount from destination back to source
 * 
 * @param sourceAccountId - Source account ID
 * @param destinationAccountId - Destination account ID
 * @param amount - Amount for the transaction
 * @param assetCode - Asset code (e.g., "USD", "EUR")
 * @param description - Optional description for both transactions
 * @param metadata - Optional metadata to include in both transactions
 * @returns Object containing the credit and debit transaction inputs
 * 
 * @example
 * ```typescript
 * // Create a credit/debit transaction pair
 * const { creditTx, debitTx } = createCreditDebitPair(
 *   'acc_source',
 *   'acc_destination',
 *   100, // $100 transaction
 *   'USD',
 *   'Payment between accounts',
 *   { batchId: 'batch_123', createdBy: 'workflow-script' }
 * );
 * 
 * // Now these can be executed separately or together with executeTransactionPair
 * ```
 */
export function createCreditDebitPair(
  sourceAccountId: string,
  destinationAccountId: string,
  amount: number,
  assetCode: string,
  description?: string,
  metadata: Record<string, any> = {}
): { creditTx: CreateTransactionInput; debitTx: CreateTransactionInput } {
  // Create default descriptions if not provided
  const creditDescription = description || `Credit to ${destinationAccountId} from ${sourceAccountId}`;
  const debitDescription = description || `Debit from ${destinationAccountId} to ${sourceAccountId}`;
  
  // Add default metadata
  const commonMetadata = {
    transactionPair: true,
    ...metadata
  };
  
  // Create the credit transaction
  const creditTx = createTransferTransaction(
    sourceAccountId,
    destinationAccountId,
    amount,
    assetCode,
    0,
    creditDescription,
    { ...commonMetadata, transactionType: 'credit' }
  );
  
  // Create the debit transaction (usually with a smaller amount)
  // Using the same amount by default, but in practice often a smaller amount is used for the debit
  const debitTx = createTransferTransaction(
    destinationAccountId,
    sourceAccountId,
    amount,
    assetCode,
    0,
    debitDescription,
    { ...commonMetadata, transactionType: 'debit' }
  );
  
  return { creditTx, debitTx };
}

/**
 * Creates a multi-account transfer transaction
 * 
 * This pattern creates a chain of transfers between multiple accounts,
 * useful for more complex transaction flows or settlement processes.
 * 
 * @param accounts - Ordered array of account IDs to transfer through
 * @param amount - Amount to transfer
 * @param assetCode - Asset code
 * @param options - Transaction pattern options
 * @returns Promise resolving to the transaction batch result
 * 
 * @example
 * ```typescript
 * // Create a chain of transfers through multiple accounts
 * const accounts = ['acc_user', 'acc_clearing', 'acc_settlement', 'acc_merchant'];
 * 
 * const result = await createMultiAccountTransfer(
 *   accounts,
 *   50,
 *   'USD',
 *   {
 *     client,
 *     organizationId: 'org_123',
 *     ledgerId: 'ledger_456',
 *     metadata: { 
 *       flowType: 'payment-settlement',
 *       orderId: 'order_789'
 *     }
 *   }
 * );
 * ```
 */
export async function createMultiAccountTransfer(
  accounts: string[],
  amount: number,
  assetCode: string,
  options: TransactionPatternOptions = {}
): Promise<any> {
  if (accounts.length < 2) {
    throw new Error('At least two accounts must be provided for a multi-account transfer');
  }
  
  if (options.execute && (!options.client || !options.organizationId || !options.ledgerId)) {
    throw new Error('Client, organization ID, and ledger ID must be provided when execute is true');
  }
  
  // Create a type with required fields but optional client
  type MergedOptions = Omit<Required<TransactionPatternOptions>, 'client'> & {
    client: MidazClient | undefined;
  };
  
  // Merge options with defaults
  const mergedOptions: MergedOptions = {
    execute: options.execute ?? true,
    maxRetries: options.maxRetries ?? 2,
    metadata: { 
      transactionPattern: 'multi-account-transfer',
      transferId: `transfer_${Date.now()}`,
      accountCount: accounts.length,
      ...options.metadata
    },
    onSuccess: options.onSuccess ?? (() => { /* empty success handler */ }),
    onError: options.onError ?? (() => { /* empty error handler */ }),
    client: options.client,
    organizationId: options.organizationId ?? '',
    ledgerId: options.ledgerId ?? '',
    scale: options.scale ?? 2,
    description: options.description ?? `Multi-account transfer`
  };
  
  // Create transfer transactions between each adjacent account pair
  const transactions = [];
  
  for (let i = 0; i < accounts.length - 1; i++) {
    const sourceAccount = accounts[i];
    const destinationAccount = accounts[i + 1];
    const description = `${mergedOptions.description} (step ${i + 1}/${accounts.length - 1})`;
    
    transactions.push(
      createTransferTransaction(
        sourceAccount,
        destinationAccount,
        amount,
        assetCode,
        mergedOptions.scale,
        description,
        {
          ...mergedOptions.metadata,
          stepIndex: i + 1,
          stepTotal: accounts.length - 1,
          sourceAccount,
          destinationAccount
        }
      )
    );
  }
  
  // Process as a batch if execute is true
  if (mergedOptions.execute) {
    if (!mergedOptions.client) {
      throw new Error('Client must be provided when execute is true');
    }
    
    const client = mergedOptions.client; // Store in a variable to make TypeScript happy
    
    return createTransactionBatch(
      client,
      mergedOptions.organizationId,
      mergedOptions.ledgerId,
      transactions,
      {
        concurrency: 1, // Process sequentially to ensure proper flow
        maxRetries: mergedOptions.maxRetries,
        batchMetadata: {
          ...mergedOptions.metadata,
          sourceAccount: accounts[0],
          destinationAccount: accounts[accounts.length - 1]
        },
        onTransactionSuccess: (tx, index, result) => {
          mergedOptions.onSuccess({ transaction: tx, index, result });
        },
        onTransactionError: (tx, index, error) => {
          mergedOptions.onError({ transaction: tx, index, error });
        }
      }
    );
  }
  
  // If not executing, just return the transactions
  return {
    transactions,
    transferId: mergedOptions.metadata.transferId
  };
}

export async function createSplitPayment(
  sourceAccountId: string,
  destinations: Array<{
    accountId: string;
    amount: number;
    description?: string;
  }>,
  assetCode: string,
  options: TransactionPatternOptions = {}
): Promise<any> {
  if (!options.client || !options.organizationId || !options.ledgerId) {
    throw new Error('Client, organization ID, and ledger ID must be provided for split payments');
  }
  
  // Create a type with required fields but optional client
  type MergedOptions = Omit<Required<TransactionPatternOptions>, 'client'> & {
    client: MidazClient | undefined;
  };
  
  // Merge options with defaults
  const mergedOptions: MergedOptions = {
    execute: options.execute ?? true,
    maxRetries: options.maxRetries ?? 2,
    metadata: { 
      transactionPattern: 'split-payment',
      splitId: `split_${Date.now()}`,
      totalPortions: destinations.length,
      ...options.metadata
    },
    onSuccess: options.onSuccess ?? (() => { /* empty success handler */ }),
    onError: options.onError ?? (() => { /* empty error handler */ }),
    client: options.client,
    organizationId: options.organizationId,
    ledgerId: options.ledgerId,
    scale: options.scale ?? 2,
    description: options.description ?? `Split payment from ${sourceAccountId}`
  };
  
  // Create transfer transactions for each destination
  const transactions = destinations.map((dest, index) => {
    const description = dest.description || `Payment portion ${index + 1} to ${dest.accountId}`;
    
    return createTransferTransaction(
      sourceAccountId,
      dest.accountId,
      dest.amount,
      assetCode,
      mergedOptions.scale,
      description,
      {
        ...mergedOptions.metadata,
        portionIndex: index + 1,
        portionDescription: dest.description
      }
    );
  });
  
  // Process as a batch if execute is true
  if (mergedOptions.execute) {
    if (!mergedOptions.client) {
      throw new Error('Client must be provided when execute is true');
    }
    
    const client = mergedOptions.client; // Store in a variable to make TypeScript happy
    
    return createTransactionBatch(
      client,
      mergedOptions.organizationId,
      mergedOptions.ledgerId,
      transactions,
      {
        concurrency: 3,
        maxRetries: mergedOptions.maxRetries,
        batchMetadata: {
          ...mergedOptions.metadata,
          sourceAccount: sourceAccountId
        },
        onTransactionSuccess: (tx, index, result) => {
          mergedOptions.onSuccess({ transaction: tx, index, result });
        },
        onTransactionError: (tx, index, error) => {
          mergedOptions.onError({ transaction: tx, index, error });
        }
      }
    );
  }
  
  // If not executing, just return the transactions
  return {
    transactions,
    batchId: mergedOptions.metadata.splitId
  };
}