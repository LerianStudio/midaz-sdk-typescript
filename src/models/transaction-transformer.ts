/**
 * @file Transaction model transformer
 * @description Transforms transaction models between client and API formats
 */

import { createModelTransformer, ModelTransformer } from '../util/data/model-transformer';

import { CreateTransactionInput, Transaction } from './transaction';

/**
 * Transforms a client-side transaction to the API format
 * This handles the special structure expected by the backend
 *
 * @param input - Client transaction input
 * @returns API transaction format
 */
export function toApiTransaction(input: CreateTransactionInput): any {
  // Group operations by type (DEBIT and CREDIT)
  const debitOperations = input.operations.filter((op) => op.type === 'DEBIT');
  const creditOperations = input.operations.filter((op) => op.type === 'CREDIT');

  // Create the new payload structure
  const result: any = {
    send: {
      asset: input.assetCode || debitOperations[0]?.amount.assetCode,
      value: input.amount || debitOperations.reduce((sum, op) => sum + Number(op.amount.value), 0),
      scale: input.scale || debitOperations[0]?.amount.scale || 2,
      source: {
        from: debitOperations.map((op) => ({
          account: op.accountId,
          amount: {
            asset: op.amount.assetCode,
            value: op.amount.value,
            scale: op.amount.scale,
          },
          description: op.description || 'Debit Operation',
          metadata: op.metadata,
        })),
      },
      distribute: {
        to: creditOperations.map((op) => ({
          account: op.accountId,
          amount: {
            asset: op.amount.assetCode,
            value: op.amount.value,
            scale: op.amount.scale,
          },
          description: op.description || 'Credit Operation',
          metadata: op.metadata,
        })),
      },
    },
  };

  // Add optional transaction-level fields
  if (input.description) {
    result.description = input.description;
  }

  if (input.chartOfAccountsGroupName) {
    result.chartOfAccountsGroupName = input.chartOfAccountsGroupName;
  }

  if (input.metadata) {
    result.metadata = input.metadata;
  }

  if (input.externalId) {
    result.externalId = input.externalId;
  }

  return result;
}

/**
 * Transforms an API transaction to the client format
 * This is a pass-through function since the API response is already
 * in the format expected by the client
 *
 * @param apiTransaction - API transaction
 * @returns Client transaction
 */
export function toClientTransaction(apiTransaction: any): Transaction {
  // Currently a pass-through since the API response is already in the right format
  // but we could add additional transformations here if needed
  return apiTransaction as Transaction;
}

/**
 * Transaction model transformer for converting between client and API formats
 */
export const transactionTransformer: ModelTransformer<CreateTransactionInput, any> =
  createModelTransformer(toApiTransaction, toClientTransaction);
