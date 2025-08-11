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

  // Add send information if present (REQUIRED for API)
  if (input.send) {
    result.send = {
      asset: input.send.asset,
      value: input.send.value
    };

    // Transform source operations - API expects 'accountAlias' not 'account'
    if (input.send.source) {
      result.send.source = {
        from: input.send.source.from.map((fromInput: any) => {
          const operation: any = {
            accountAlias: fromInput.account,  // Transform 'account' to 'accountAlias'
            amount: fromInput.amount
          };
          
          // Add route if provided (operation route reference)
          if (fromInput.route) {
            operation.route = fromInput.route;
          }
          
          // Add other optional fields
          if (fromInput.description) {
            operation.description = fromInput.description;
          }
          
          if (fromInput.metadata) {
            operation.metadata = fromInput.metadata;
          }
          
          return operation;
        })
      };
    }

    // Transform distribute operations - API expects 'accountAlias' not 'account' 
    if (input.send.distribute) {
      result.send.distribute = {
        to: input.send.distribute.to.map((toInput: any) => {
          const operation: any = {
            accountAlias: toInput.account,  // Transform 'account' to 'accountAlias'
            amount: toInput.amount
          };
          
          // Add route if provided (operation route reference)
          if (toInput.route) {
            operation.route = toInput.route;
          }
          
          // Add other optional fields
          if (toInput.description) {
            operation.description = toInput.description;
          }
          
          if (toInput.metadata) {
            operation.metadata = toInput.metadata;
          }
          
          return operation;
        })
      };
    }
  }

  // Note: amount, assetCode, and operations fields are NOT sent to backend API
  // These cause HTTP 400 "Unexpected Fields" errors according to Midaz API contract

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

  if (input.code) {
    result.code = input.code;
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
