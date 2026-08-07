/**
 */

import { ListOptions, ListResponse } from '../../models/common';
import {
  BlockFundsInput,
  CreateAnnotationInput,
  CreateInflowInput,
  CreateOutflowInput,
  CreateTransactionInput,
  RevertTransactionOptions,
  Transaction,
  TransactionStateTransitionOptions,
  UnblockFundsInput,
  UpdateTransactionInput,
} from '../../models/transaction';

import { ApiClient } from './api-client';

/**
 * Interface for transaction API operations
 *
 * This interface defines the methods for interacting with transaction endpoints.
 * It abstracts away the HTTP details and focuses on the business operations.
 */
export interface TransactionApiClient
  extends ApiClient<Transaction, CreateTransactionInput, never> {
  /**
   * Lists transactions for a specific organization and ledger
   *
   * @returns Promise resolving to a paginated list of transactions
   */
  listTransactions(
    orgId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<ListResponse<Transaction>>;

  /**
   * Gets a transaction by ID
   *
   * @returns Promise resolving to the transaction
   */
  getTransaction(orgId: string, ledgerId: string, id: string): Promise<Transaction>;

  /**
   * Creates a new transaction
   *
   * @returns Promise resolving to the created transaction
   */
  createTransaction(
    orgId: string,
    ledgerId: string,
    input: CreateTransactionInput
  ): Promise<Transaction>;

  /**
   * Patches the description and metadata of an existing transaction
   *
   * @returns Promise resolving to the patched transaction
   */
  updateTransaction(
    orgId: string,
    ledgerId: string,
    transactionId: string,
    input: UpdateTransactionInput
  ): Promise<Transaction>;

  /**
   * Creates an inflow, funding accounts from `@external/{asset}`
   *
   * @returns Promise resolving to the created transaction
   */
  createInflow(orgId: string, ledgerId: string, input: CreateInflowInput): Promise<Transaction>;

  /**
   * Creates an outflow, moving funds out to `@external/{asset}`
   *
   * @returns Promise resolving to the created transaction
   */
  createOutflow(orgId: string, ledgerId: string, input: CreateOutflowInput): Promise<Transaction>;

  /**
   * Blocks funds, labelling the resulting operations `BLOCK`
   *
   * @returns Promise resolving to the created transaction
   */
  blockFunds(orgId: string, ledgerId: string, input: BlockFundsInput): Promise<Transaction>;

  /**
   * Unblocks funds, labelling the resulting operations `UNBLOCK`
   *
   * @returns Promise resolving to the created transaction
   */
  unblockFunds(orgId: string, ledgerId: string, input: UnblockFundsInput): Promise<Transaction>;

  /**
   * Creates a `NOTED` annotation that moves no balance
   *
   * @returns Promise resolving to the created transaction
   */
  createAnnotation(
    orgId: string,
    ledgerId: string,
    input: CreateAnnotationInput
  ): Promise<Transaction>;

  /**
   * Commits a pending transaction
   *
   * @returns Promise resolving to the committed transaction
   */
  commitTransaction(
    orgId: string,
    ledgerId: string,
    transactionId: string,
    options?: TransactionStateTransitionOptions
  ): Promise<Transaction>;

  /**
   * Cancels a pending transaction
   *
   * @returns Promise resolving to the canceled transaction
   */
  cancelTransaction(
    orgId: string,
    ledgerId: string,
    transactionId: string,
    options?: TransactionStateTransitionOptions
  ): Promise<Transaction>;

  /**
   * Reverts an approved transaction
   *
   * @returns Promise resolving to the reversing transaction
   */
  revertTransaction(
    orgId: string,
    ledgerId: string,
    transactionId: string,
    options?: RevertTransactionOptions
  ): Promise<Transaction>;
}
