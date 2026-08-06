/**
 */

import { ListOptions, ListResponse } from '../../models/common';
import {
  CreateInflowInput,
  CreateOutflowInput,
  CreateTransactionInput,
  RevertTransactionOptions,
  Transaction,
  TransactionStateTransitionOptions,
} from '../../models/transaction';
import {
  toApiInflow,
  toApiOutflow,
  transactionTransformer,
} from '../../models/transaction-transformer';
import {
  validateCreateInflowInput,
  validateCreateOutflowInput,
  validateCreateTransactionInput,
} from '../../models/validators/transaction-validator';
import { transformRequest } from '../../util/data/model-transformer';
import {
  ErrorCategory,
  ErrorCode,
  MIDAZ_CODE_TRANSACTION_LOCKED,
  MidazError,
  readMidazProblem,
} from '../../util/error/error-types';
import { HttpClient, RequestOptions } from '../../util/network/http-client';
import { Observability } from '../../util/observability/observability';
import { validate } from '../../util/validation';
import { TransactionApiClient } from '../interfaces/transaction-api-client';
import { TransactionCreateVariant, TransactionStateTransition, UrlBuilder } from '../url-builder';

import { HttpBaseApiClient } from './http-base-api-client';

const TRANSACTION_LOCKED_STATUS = 409;

const TERMINAL_LOCK_NOTE =
  'The ledger never releases this lock, so the condition is terminal despite what the ' +
  'message above says: the SDK will not retry it.';

/**
 * Translates the ledger's terminal `0486` into an error carrying its midaz code, and
 * leaves every other failure exactly as raised. The server's own `detail` is kept
 * verbatim so callers see what midaz said, with the SDK's correction appended.
 */
function asTransactionLockedError(
  error: unknown,
  operation: string,
  transactionId: string
): unknown {
  const problem = readMidazProblem(error);

  if (
    problem.status !== TRANSACTION_LOCKED_STATUS ||
    problem.code !== MIDAZ_CODE_TRANSACTION_LOCKED
  ) {
    return error;
  }

  const detail = problem.detail ?? 'Transaction Locked';

  return new MidazError({
    category: ErrorCategory.CONFLICT,
    code: ErrorCode.TRANSACTION_LOCKED,
    midazCode: MIDAZ_CODE_TRANSACTION_LOCKED,
    message: `${detail} ${TERMINAL_LOCK_NOTE}`,
    statusCode: TRANSACTION_LOCKED_STATUS,
    operation,
    resource: 'transaction',
    resourceId: transactionId,
    cause: error,
  });
}

/**
 * HTTP implementation of the TransactionApiClient interface
 *
 * This class handles HTTP communication with transaction endpoints, including
 * URL construction, request formation, response handling, and error management.
 */
export class HttpTransactionApiClient
  extends HttpBaseApiClient<Transaction, CreateTransactionInput, never>
  implements TransactionApiClient
{
  /**
   * Creates a new HttpTransactionApiClient
   *
   */
  constructor(httpClient: HttpClient, urlBuilder: UrlBuilder, observability?: Observability) {
    super(httpClient, urlBuilder, 'midaz-transaction-api-client', observability);
  }

  /**
   * Lists transactions for a specific organization and ledger
   *
   * @returns Promise resolving to a paginated list of transactions
   */
  public async listTransactions(
    orgId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<ListResponse<Transaction>> {
    // Validate required parameters before making the request
    this.validateRequiredParams(this.startSpan('validateParams', { orgId, ledgerId }), {
      orgId,
      ledgerId,
    });

    // Build the URL for the request
    const url = this.urlBuilder.buildTransactionUrl(orgId, ledgerId);

    // Make the request
    return this.getRequest<ListResponse<Transaction>>(
      'listTransactions',
      url,
      { params: options },
      { orgId, ledgerId }
    );
  }

  /**
   * Gets a transaction by ID
   *
   * @returns Promise resolving to the transaction
   */
  public async getTransaction(orgId: string, ledgerId: string, id: string): Promise<Transaction> {
    // Validate required parameters before making the request
    this.validateRequiredParams(
      this.startSpan('validateParams', { orgId, ledgerId, transactionId: id }),
      { orgId, ledgerId, id }
    );

    // Build the URL for the request
    const url = this.urlBuilder.buildTransactionUrl(orgId, ledgerId, id);

    // Make the request
    return this.getRequest<Transaction>('getTransaction', url, undefined, {
      orgId,
      ledgerId,
      transactionId: id,
    });
  }

  /**
   * Creates a new transaction
   *
   * @returns Promise resolving to the created transaction
   */
  public async createTransaction(
    orgId: string,
    ledgerId: string,
    input: CreateTransactionInput
  ): Promise<Transaction> {
    // Prepare span attributes
    const attributes = {
      orgId,
      ledgerId,
      description: input.description,
      externalId: input.externalId,
      operationCount: input.operations?.length || 0,
    };

    // Validate required parameters before making the request
    this.validateRequiredParams(this.startSpan('validateParams', attributes), { orgId, ledgerId });

    // Validate input
    validate(input, validateCreateTransactionInput);

    // Transform input to the format expected by the backend
    const libTransaction = transformRequest(transactionTransformer, input);

    // Build the URL for the request with the transaction flag
    const url = this.urlBuilder.buildTransactionUrl(orgId, ledgerId, undefined, true);

    // Make the request
    const result = await this.postRequest<Transaction>(
      'createTransaction',
      url,
      libTransaction,
      { idempotencyKey: input.idempotencyKey },
      attributes
    );

    // Record transaction amount metrics if available
    if (input.amount) {
      const amount = typeof input.amount === 'string' ? parseFloat(input.amount) : input.amount;
      this.recordMetrics('transactions.amount', amount, {
        orgId,
        ledgerId,
        assetCode: input.assetCode || 'unknown',
      });
    }

    return result;
  }

  /**
   * Creates an inflow, funding accounts from `@external/{asset}`
   *
   * @returns Promise resolving to the created transaction
   */
  public async createInflow(
    orgId: string,
    ledgerId: string,
    input: CreateInflowInput
  ): Promise<Transaction> {
    return this.postFlow('inflow', orgId, ledgerId, input, validateCreateInflowInput, toApiInflow);
  }

  /**
   * Creates an outflow, moving funds out to `@external/{asset}`
   *
   * @returns Promise resolving to the created transaction
   */
  public async createOutflow(
    orgId: string,
    ledgerId: string,
    input: CreateOutflowInput
  ): Promise<Transaction> {
    return this.postFlow(
      'outflow',
      orgId,
      ledgerId,
      input,
      validateCreateOutflowInput,
      toApiOutflow
    );
  }

  /**
   * Issues the POST behind a single-sided flow, validating before anything reaches
   * the transport
   *
   * @returns Promise resolving to the created transaction
   */
  private async postFlow<T extends CreateInflowInput | CreateOutflowInput>(
    variant: Extract<TransactionCreateVariant, 'inflow' | 'outflow'>,
    orgId: string,
    ledgerId: string,
    input: T,
    validator: (input: T) => ReturnType<typeof validateCreateInflowInput>,
    transformer: (input: T) => any
  ): Promise<Transaction> {
    const attributes = {
      orgId,
      ledgerId,
      description: input?.description,
      asset: input?.send?.asset,
      variant,
    };

    this.validateRequiredParams(this.startSpan('validateParams', attributes), { orgId, ledgerId });

    validate(input, validator);

    const url = this.urlBuilder.buildTransactionUrl(orgId, ledgerId, undefined, variant);

    return this.postRequest<Transaction>(
      `create${variant === 'inflow' ? 'Inflow' : 'Outflow'}`,
      url,
      transformer(input),
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyTtlSeconds: input.idempotencyTtlSeconds,
      },
      attributes
    );
  }

  /**
   * Commits a pending transaction, settling the funds it holds
   *
   * @returns Promise resolving to the committed transaction
   */
  public async commitTransaction(
    orgId: string,
    ledgerId: string,
    transactionId: string,
    options?: TransactionStateTransitionOptions
  ): Promise<Transaction> {
    return this.postStateTransition('commit', orgId, ledgerId, transactionId, options);
  }

  /**
   * Cancels a pending transaction, releasing the funds it holds
   *
   * @returns Promise resolving to the canceled transaction
   */
  public async cancelTransaction(
    orgId: string,
    ledgerId: string,
    transactionId: string,
    options?: TransactionStateTransitionOptions
  ): Promise<Transaction> {
    return this.postStateTransition('cancel', orgId, ledgerId, transactionId, options);
  }

  /**
   * Reverts an approved transaction
   *
   * The ledger answers with a brand-new transaction carrying `parentTransactionId` and
   * the original legs swapped, not with the reverted one.
   *
   * @returns Promise resolving to the reversing transaction
   */
  public async revertTransaction(
    orgId: string,
    ledgerId: string,
    transactionId: string,
    options?: RevertTransactionOptions
  ): Promise<Transaction> {
    return this.postStateTransition('revert', orgId, ledgerId, transactionId, options, {
      idempotencyKey: options?.idempotencyKey,
    });
  }

  /**
   * Issues the body-less POST behind a state transition
   *
   * @returns Promise resolving to the transaction the ledger answered with
   */
  private async postStateTransition(
    transition: TransactionStateTransition,
    orgId: string,
    ledgerId: string,
    transactionId: string,
    options?: TransactionStateTransitionOptions,
    extraRequestOptions?: RequestOptions
  ): Promise<Transaction> {
    const attributes = { orgId, ledgerId, transactionId, transition };

    this.validateRequiredParams(this.startSpan('validateParams', attributes), {
      orgId,
      ledgerId,
      transactionId,
    });

    const url = this.urlBuilder.buildTransactionUrl(
      orgId,
      ledgerId,
      transactionId,
      false,
      transition
    );

    const requestOptions: RequestOptions = {
      ...extraRequestOptions,
      timeout: options?.timeout,
      signal: options?.signal,
    };

    try {
      // The ledger accepts a body here and ignores it, so none is sent.
      return await this.postRequest<Transaction>(
        `${transition}Transaction`,
        url,
        undefined,
        requestOptions,
        attributes
      );
    } catch (error) {
      throw asTransactionLockedError(error, `${transition}Transaction`, transactionId);
    }
  }
}
