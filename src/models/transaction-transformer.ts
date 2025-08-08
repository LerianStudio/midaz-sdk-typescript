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

  // Add send information if present
  if (input.send) {
    result.send = input.send;
  }

  // Add operations if present (alternative to send)
  if (input.operations && input.operations.length > 0) {
    // Convert operations to send format if no send is provided
    if (!input.send) {
      const debitOperations = input.operations.filter((op) => op.type === 'DEBIT');
      const creditOperations = input.operations.filter((op) => op.type === 'CREDIT');
      
      if (debitOperations.length > 0 && creditOperations.length > 0) {
        result.send = {
          asset: input.assetCode || debitOperations[0]?.assetCode || 'USD',
          value: input.amount || debitOperations[0]?.amount || '0',
          source: {
            from: debitOperations.map((op) => ({
              account: op.accountId,
              amount: {
                asset: op.assetCode || 'USD',
                value: op.amount,
              },
              accountAlias: op.accountAlias,
              route: op.route,
            })),
          },
          distribute: {
            to: creditOperations.map((op) => ({
              account: op.accountId,
              amount: {
                asset: op.assetCode || 'USD', 
                value: op.amount,
              },
              accountAlias: op.accountAlias,
              route: op.route,
            })),
          },
        };
      }
    }
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
  createModelTransformer(toApiTransaction, toClientTransaction);
