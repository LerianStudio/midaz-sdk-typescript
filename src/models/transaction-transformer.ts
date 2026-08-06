/**
 */

import { createModelTransformer, ModelTransformer } from '../util/data/model-transformer';
import { ValidationError } from '../util/validation';

import {
  CreateInflowInput,
  CreateOutflowInput,
  CreateTransactionInput,
  FromToInput,
  Transaction,
} from './transaction';
import { validateDecimalValue } from './validators/transaction-validator';

/**
 * Coerces a monetary value to the decimal string the ledger requires.
 *
 * @returns The value serialized as a decimal string
 * @throws ValidationError naming `path` when the value cannot be represented
 */
function coerceDecimalValue(value: unknown, path: string): string {
  const result = validateDecimalValue(value, path);

  if (!result.valid) {
    throw new ValidationError(
      result.message || `${path} is not a valid decimal value`,
      result.fieldErrors
    );
  }

  return String(value);
}

/**
 * Transforms one leg into the API shape, which names the account `accountAlias`.
 *
 * @returns The leg in API format
 */
function toApiLeg(leg: FromToInput, path: string): any {
  const operation: any = {
    accountAlias: leg.account,
    amount: {
      ...leg.amount,
      value: coerceDecimalValue(leg?.amount?.value, `${path}.amount.value`),
    },
  };

  if (leg.route) {
    operation.route = leg.route;
  }

  if (leg.description) {
    operation.description = leg.description;
  }

  if (leg.metadata) {
    operation.metadata = leg.metadata;
  }

  return operation;
}

/**
 * Copies the envelope fields both flow endpoints share, skipping the ones the ledger
 * takes as headers.
 *
 * @returns The envelope in API format
 */
function toApiFlowEnvelope(input: CreateInflowInput | CreateOutflowInput): any {
  const result: any = {};

  if (input.chartOfAccountsGroupName) {
    result.chartOfAccountsGroupName = input.chartOfAccountsGroupName;
  }

  if (input.description) {
    result.description = input.description;
  }

  if (input.code) {
    result.code = input.code;
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
 * Transforms an inflow input to the API format.
 *
 * The emitted body carries `distribute` only. `source` and `pending` are absent from
 * the ledger's inflow input struct, so emitting either would be `400/0053`.
 *
 * @returns The inflow request body
 */
export function toApiInflow(input: CreateInflowInput): any {
  const result = toApiFlowEnvelope(input);

  result.send = {
    asset: input.send.asset,
    value: coerceDecimalValue(input.send.value, 'send.value'),
    distribute: {
      to: (input.send.distribute?.to ?? []).map((to, index) =>
        toApiLeg(to, `send.distribute.to[${index}]`)
      ),
    },
  };

  return result;
}

/**
 * Transforms an outflow input to the API format.
 *
 * The emitted body carries `source` only; `distribute` is absent from the ledger's
 * outflow input struct. Unlike inflow, `pending` is supported.
 *
 * @returns The outflow request body
 */
export function toApiOutflow(input: CreateOutflowInput): any {
  const result = toApiFlowEnvelope(input);

  if (input.pending) {
    result.pending = input.pending;
  }

  result.send = {
    asset: input.send.asset,
    value: coerceDecimalValue(input.send.value, 'send.value'),
    source: {
      from: (input.send.source?.from ?? []).map((from, index) =>
        toApiLeg(from, `send.source.from[${index}]`)
      ),
    },
  };

  return result;
}

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
      value: coerceDecimalValue(input.send.value, 'send.value'),
    };

    // Transform source operations - API expects 'accountAlias' not 'account'
    if (input.send.source) {
      result.send.source = {
        from: input.send.source.from.map((fromInput: any, index: number) => {
          const operation: any = {
            accountAlias: fromInput.account, // Transform 'account' to 'accountAlias'
            amount: {
              ...fromInput.amount,
              value: coerceDecimalValue(
                fromInput.amount?.value,
                `send.source.from[${index}].amount.value`
              ),
            },
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
        }),
      };
    }

    // Transform distribute operations - API expects 'accountAlias' not 'account'
    if (input.send.distribute) {
      result.send.distribute = {
        to: input.send.distribute.to.map((toInput: any, index: number) => {
          const operation: any = {
            accountAlias: toInput.account, // Transform 'account' to 'accountAlias'
            amount: {
              ...toInput.amount,
              value: coerceDecimalValue(
                toInput.amount?.value,
                `send.distribute.to[${index}].amount.value`
              ),
            },
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
        }),
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

  if (input.routeId) {
    result.routeId = input.routeId;
  }

  if (input.transactionDate) {
    result.transactionDate = input.transactionDate;
  }

  // Emitted on presence, not truthiness: `{fees: false}` is a meaningful instruction and
  // the ledger distinguishes it from an absent skip.
  if (input.skip) {
    result.skip = input.skip;
  }

  if (input.metadata) {
    result.metadata = input.metadata;
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
