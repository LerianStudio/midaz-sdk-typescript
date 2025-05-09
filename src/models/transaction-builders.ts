/**
 */

import { AmountInput, CreateTransactionInput } from './transaction';

/**
 * Creates an amount input with proper structure
 *
 * @returns Properly structured amount input
 */
export function createAmountInput(
  value: number | string,
  assetCode: string,
  scale = 0
): AmountInput {
  return {
    value,
    assetCode,
    scale,
  };
}

/**
 * Creates a deposit transaction from an external source to a destination account
 *
 * Deposit transactions represent funds coming into the system from an external source.
 * This creates a properly structured transaction with the correct debit and credit operations.
 *
 * @returns A properly structured deposit transaction input
 *
 * @example
 * ```typescript
 * // Create a simple USD deposit
 * const depositTx = createDepositTransaction(
 *   "@external/USD",
 *   "acc_12345",
 *   1000,
 *   "USD",
 *   100,
 *   "Initial account funding"
 * );
 *
 * // Execute the transaction
 * await client.entities.transactions.createTransaction(
 *   organizationId,
 *   ledgerId,
 *   depositTx
 * );
 * ```
 */
export function createDepositTransaction(
  sourceAccount: string,
  destinationAccount: string,
  amount: number,
  assetCode: string,
  scale = 0,
  description?: string,
  metadata?: Record<string, any>
): CreateTransactionInput {
  // Set default external account ID format if not already external
  const sourceAccountId = sourceAccount.startsWith('@') ? sourceAccount : `@external/${assetCode}`;

  // Create the transaction with debit and credit operations
  return {
    description: description || `Deposit into ${destinationAccount}`,
    operations: [
      {
        accountId: sourceAccountId,
        type: 'DEBIT',
        amount: {
          value: amount,
          assetCode,
          scale,
        },
      },
      {
        accountId: destinationAccount,
        type: 'CREDIT',
        amount: {
          value: amount,
          assetCode,
          scale,
        },
      },
    ],
    metadata: {
      transactionType: 'deposit',
      ...metadata,
    },
  };
}

/**
 * Creates a withdrawal transaction from an account to an external destination
 *
 * Withdrawal transactions represent funds leaving the system to an external destination.
 * This creates a properly structured transaction with the correct debit and credit operations.
 *
 * @returns A properly structured withdrawal transaction input
 *
 * @example
 * ```typescript
 * // Create a USD withdrawal
 * const withdrawalTx = createWithdrawalTransaction(
 *   "acc_12345",
 *   "@external/USD",
 *   500,
 *   "USD",
 *   100,
 *   "Customer withdrawal"
 * );
 *
 * // Execute the transaction
 * await client.entities.transactions.createTransaction(
 *   organizationId,
 *   ledgerId,
 *   withdrawalTx
 * );
 * ```
 */
export function createWithdrawalTransaction(
  sourceAccount: string,
  destinationAccount: string,
  amount: number,
  assetCode: string,
  scale = 0,
  description?: string,
  metadata?: Record<string, any>
): CreateTransactionInput {
  // Set default external account ID format if not already external
  const destinationAccountId = destinationAccount.startsWith('@')
    ? destinationAccount
    : `@external/${assetCode}`;

  // Create the transaction with debit and credit operations
  return {
    description: description || `Withdrawal from ${sourceAccount}`,
    operations: [
      {
        accountId: sourceAccount,
        type: 'DEBIT',
        amount: {
          value: amount,
          assetCode,
          scale,
        },
      },
      {
        accountId: destinationAccountId,
        type: 'CREDIT',
        amount: {
          value: amount,
          assetCode,
          scale,
        },
      },
    ],
    metadata: {
      transactionType: 'withdrawal',
      ...metadata,
    },
  };
}

/**
 * Creates a transfer transaction between two accounts
 *
 * Transfer transactions move funds between accounts within the system.
 * This creates a properly structured transaction with the correct debit and credit operations.
 *
 * @returns A properly structured transfer transaction input
 *
 * @example
 * ```typescript
 * // Create a transfer between accounts
 * const transferTx = createTransferTransaction(
 *   "acc_savings",
 *   "acc_checking",
 *   200,
 *   "USD",
 *   100,
 *   "Monthly transfer"
 * );
 *
 * // Execute the transaction
 * await client.entities.transactions.createTransaction(
 *   organizationId,
 *   ledgerId,
 *   transferTx
 * );
 * ```
 */
export function createTransferTransaction(
  sourceAccount: string,
  destinationAccount: string,
  amount: number,
  assetCode: string,
  scale = 0,
  description?: string,
  metadata?: Record<string, any>
): CreateTransactionInput {
  // Create the transaction with debit and credit operations
  return {
    description: description || `Transfer from ${sourceAccount} to ${destinationAccount}`,
    operations: [
      {
        accountId: sourceAccount,
        type: 'DEBIT',
        amount: {
          value: amount,
          assetCode,
          scale,
        },
      },
      {
        accountId: destinationAccount,
        type: 'CREDIT',
        amount: {
          value: amount,
          assetCode,
          scale,
        },
      },
    ],
    metadata: {
      transactionType: 'transfer',
      ...metadata,
    },
  };
}

/**
 * Creates a multi-currency transaction that converts between assets
 *
 * This is useful for currency exchange or asset swaps where the source
 * and destination are different assets with different exchange rates.
 *
 * @returns A properly structured multi-currency transaction input
 *
 * @example
 * ```typescript
 * // Create a USD to EUR exchange
 * const exchangeTx = createMultiCurrencyTransaction(
 *   "acc_usd",      // USD account
 *   100,            // $100
 *   "USD",
 *   100,            // 2 decimal places
 *   "acc_eur",      // EUR account
 *   92,             // €92
 *   "EUR",
 *   100,            // 2 decimal places
 *   "USD to EUR exchange at 0.92 rate"
 * );
 *
 * // Execute the transaction
 * await client.entities.transactions.createTransaction(
 *   organizationId,
 *   ledgerId,
 *   exchangeTx
 * );
 * ```
 */
export function createMultiCurrencyTransaction(
  sourceAccount: string,
  sourceAmount: number,
  sourceAssetCode: string,
  sourceScale: number,
  destinationAccount: string,
  destinationAmount: number,
  destinationAssetCode: string,
  destinationScale: number,
  description?: string,
  metadata?: Record<string, any>
): CreateTransactionInput {
  return {
    description: description || `Exchange ${sourceAssetCode} to ${destinationAssetCode}`,
    operations: [
      {
        accountId: sourceAccount,
        type: 'DEBIT',
        amount: {
          value: sourceAmount,
          assetCode: sourceAssetCode,
          scale: sourceScale,
        },
      },
      {
        accountId: destinationAccount,
        type: 'CREDIT',
        amount: {
          value: destinationAmount,
          assetCode: destinationAssetCode,
          scale: destinationScale,
        },
      },
    ],
    metadata: {
      transactionType: 'exchange',
      exchangeRate: {
        from: sourceAssetCode,
        to: destinationAssetCode,
        rate: destinationAmount / destinationScale / (sourceAmount / sourceScale),
      },
      ...metadata,
    },
  };
}
