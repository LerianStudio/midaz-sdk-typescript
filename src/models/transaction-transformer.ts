/**
 */

import { createModelTransformer, ModelTransformer } from '../util/data/model-transformer';

import { CreateTransactionInput, Transaction } from './transaction';

/**
 * Transforms a client-side transaction to the API format
 */
export function toApiTransaction(input: CreateTransactionInput): any {
  const result: any = {
    chartOfAccountsGroupName: input.chartOfAccountsGroupName,
    description: input.description,
  };

  // Add required fields for transactions
  if (input.amount) {
    result.amount = input.amount;
  }

  if (input.assetCode) {
    result.assetCode = input.assetCode;
  }

  // Add send information if present
  if (input.send) {
    result.send = input.send;
  }

  // Add operations if present (for backward compatibility - when no send is provided)
  if (input.operations && input.operations.length > 0 && !input.send) {
    result.operations = input.operations;
  }

  // Add optional fields
  if (input.pending) {
    result.pending = input.pending;
  }

  if (input.route) {
    result.route = input.route;
  }

  if (input.metadata) {
    result.metadata = input.metadata;
  }

  if (input.idempotencyKey) {
    result.idempotencyKey = input.idempotencyKey;
  }

  return result;
}

/**
 * Transforms an API transaction to the client format (currently pass-through)
 *
 */
export function toClientTransaction(apiTransaction: any): Transaction {
  // Currently a pass-through since the API response is already in the right format
  // but we could add additional transformations here if needed
  return apiTransaction as Transaction;
}

/** Transaction model transformer for client/API format conversion */
export const transactionTransformer: ModelTransformer<CreateTransactionInput, any> =
  createModelTransformer(toApiTransaction, toClientTransaction as any);
