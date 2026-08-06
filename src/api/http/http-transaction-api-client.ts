/**
 */

import { ListOptions, ListResponse } from '../../models/common';
import {
  BlockFundsInput,
  CreateAnnotationInput,
  CreateInflowInput,
  CreateOutflowInput,
  CreateTransactionInput,
  NonPendingTransactionInput,
  RevertTransactionOptions,
  Transaction,
  TransactionStateTransitionOptions,
  UnblockFundsInput,
  UpdateTransactionInput,
} from '../../models/transaction';
import {
  toApiInflow,
  toApiOutflow,
  toApiTransaction,
  transactionTransformer,
} from '../../models/transaction-transformer';
import {
  validateBlockFundsInput,
  validateCreateAnnotationInput,
  validateCreateInflowInput,
  validateCreateOutflowInput,
  validateCreateTransactionInput,
  validateUnblockFundsInput,
  validateUpdateTransactionInput,
} from '../../models/validators/transaction-validator';
import { transformRequest } from '../../util/data/model-transformer';
import {
  ErrorCategory,
  ErrorCode,
  MIDAZ_CODE_SKIP_NOT_PERMITTED,
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

const SKIP_NOT_PERMITTED_STATUS = 422;

/**
 * Ledger override each skip flag needs, keyed by the word the server's own detail uses.
 * The server says "enable the matching ledger override" without naming it.
 */
const SKIP_OVERRIDES: Record<string, string> = {
  fees: 'overrides.allowFeeSkip',
  tracer: 'overrides.allowTracerSkip',
};

const TERMINAL_LOCK_NOTE =
  'The ledger holds this lock for up to 300 seconds and does not release it when the ' +
  'transition succeeds, so retrying shortly cannot work: the SDK treats it as terminal ' +
  'for this call and does not retry. It is not permanent, though. Read the transaction ' +
  'before acting: once the lock ages out the same call answers 0099 if the transition ' +
  'already happened, and succeeds if it never did.';

/**
 * Operation label each create variant must come back carrying.
 *
 * The ledger keys its idempotency slot on a hash of the request body alone: the endpoint
 * path is not part of the key and the label it applies is passed to the writer as a
 * separate argument. Block, unblock, annotation and `/json` all send the same body, so
 * calling two of them with one input inside the 300-second slot replays the FIRST
 * transaction under `201 CREATED` while nothing new is written. Verified live against
 * midaz main @33cb93f: block then unblock with one input returned the block twice and
 * the funds stayed blocked.
 */
const VARIANT_OPERATION_LABEL: Record<'block' | 'unblock', string> = {
  block: 'BLOCK',
  unblock: 'UNBLOCK',
};

const LABEL_ONLY_OPERATION_TYPES = new Set(Object.values(VARIANT_OPERATION_LABEL));

const REPLAY_CAUSE =
  'The ledger deduplicates on a hash of the request body for 300 seconds, and neither ' +
  'the endpoint nor the label it applies is part of that hash, so this call was answered ' +
  'with an earlier transaction and wrote nothing.';

const CREATE_REPLAY_REMEDY = `${REPLAY_CAUSE} Pass a distinct idempotencyKey per call to give each one its own slot.`;

/**
 * Raises the replay the ledger reports as a success.
 *
 * @returns never
 */
function throwReplayedTransaction(
  operation: string,
  transaction: Transaction,
  what: string
): never {
  throw new MidazError({
    category: ErrorCategory.CONFLICT,
    code: ErrorCode.IDEMPOTENCY_ERROR,
    message: `${operation} was answered with transaction ${transaction.id}, which ${what}. ${CREATE_REPLAY_REMEDY}`,
    operation,
    resource: 'transaction',
    resourceId: transaction.id,
  });
}

/**
 * Refuses a create whose response does not carry the labelling the endpoint was asked for.
 *
 * The check reads operations because they are the only place the label survives: the
 * status is `CREATED` for block, unblock and `/json` alike. A response without operations
 * is left alone rather than guessed at.
 *
 * @returns The transaction the ledger answered with, when it matches the request
 */
function assertLabelled(
  variant: 'json' | 'block' | 'unblock' | 'annotation',
  operation: string,
  transaction: Transaction
): Transaction {
  const operations = transaction?.operations;

  if (!Array.isArray(operations) || operations.length === 0) {
    return transaction;
  }

  if (variant === 'annotation') {
    if (operations.some((op) => op.balanceAffected !== false)) {
      return throwReplayedTransaction(
        operation,
        transaction,
        'moved money — an annotation writes operations flagged balanceAffected:false'
      );
    }

    return transaction;
  }

  if (variant === 'json') {
    if (operations.some((op) => LABEL_ONLY_OPERATION_TYPES.has(op.type))) {
      return throwReplayedTransaction(
        operation,
        transaction,
        'carries BLOCK or UNBLOCK operations, which this endpoint never produces'
      );
    }

    return transaction;
  }

  const expected = VARIANT_OPERATION_LABEL[variant];

  if (operations.some((op) => op.type !== expected)) {
    return throwReplayedTransaction(
      operation,
      transaction,
      `carries operations typed ${[...new Set(operations.map((op) => op.type))].join('/')} instead of ${expected}`
    );
  }

  return transaction;
}

/**
 * Refuses a reversal that belongs to another transaction.
 *
 * `/revert` reads no idempotency header and hashes the mirrored body, which carries no
 * parent id, so two look-alike transactions reverted inside one 300-second slot both get
 * the FIRST reversal back — the second transaction stays approved and its funds are never
 * returned. Verified live against midaz main @33cb93f.
 *
 * @returns The reversal, when it names the transaction the caller asked to revert
 */
function assertReversalOf(transactionId: string, transaction: Transaction): Transaction {
  const parent = transaction?.parentTransactionId;

  if (parent !== undefined && parent !== transactionId) {
    throw new MidazError({
      category: ErrorCategory.CONFLICT,
      code: ErrorCode.IDEMPOTENCY_ERROR,
      message:
        `revertTransaction(${transactionId}) was answered with transaction ${transaction.id}, ` +
        `which reverses ${parent} instead. ${transactionId} was NOT reverted. ${REPLAY_CAUSE} ` +
        'The revert endpoint reads no idempotency key, so the only remedy is to retry ' +
        'once the slot expires.',
      operation: 'revertTransaction',
      resource: 'transaction',
      resourceId: transactionId,
    });
  }

  return transaction;
}

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
 * Translates the ledger's `422/0490` into an error naming the ledger override the caller
 * has to enable, and leaves every other failure exactly as raised.
 *
 * The SDK cannot pre-validate a `skip` flag because the per-ledger overrides that gate it
 * are not visible from the request side, so this is the earliest point the refusal can be
 * made actionable.
 */
function asSkipNotPermittedError(error: unknown, operation: string): unknown {
  const problem = readMidazProblem(error);

  if (
    problem.status !== SKIP_NOT_PERMITTED_STATUS ||
    problem.code !== MIDAZ_CODE_SKIP_NOT_PERMITTED
  ) {
    return error;
  }

  const detail = problem.detail ?? 'Skip Not Permitted';
  const named = Object.keys(SKIP_OVERRIDES).find((flag) => detail.includes(`${flag} skip`));
  const override = named ? SKIP_OVERRIDES[named] : Object.values(SKIP_OVERRIDES).join(' or ');

  return new MidazError({
    category: ErrorCategory.VALIDATION,
    code: ErrorCode.VALIDATION_ERROR,
    midazCode: MIDAZ_CODE_SKIP_NOT_PERMITTED,
    message: `${detail} Enable ${override} on the ledger settings, or drop the skip.`,
    statusCode: SKIP_NOT_PERMITTED_STATUS,
    operation,
    resource: 'transaction',
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
    ).catch((error) => {
      throw asSkipNotPermittedError(error, 'createTransaction');
    });

    // Record transaction amount metrics if available
    if (input.amount) {
      const amount = typeof input.amount === 'string' ? parseFloat(input.amount) : input.amount;
      this.recordMetrics('transactions.amount', amount, {
        orgId,
        ledgerId,
        assetCode: input.assetCode || 'unknown',
      });
    }

    return assertLabelled('json', 'createTransaction', result);
  }

  /**
   * Patches the description and metadata of an existing transaction
   *
   * The ledger answers 200, not the 201 every create on this resource returns, and it
   * merges `metadata` into what is already stored instead of replacing it: keys absent
   * from the patch survive, and a key mapped to `null` is removed. An empty-string
   * `description` is ignored, so a description cannot be cleared. The input is sent as
   * given — no read-then-write is performed to emulate replace semantics, which would
   * race against a concurrent patch.
   *
   * @returns Promise resolving to the patched transaction
   */
  public async updateTransaction(
    orgId: string,
    ledgerId: string,
    transactionId: string,
    input: UpdateTransactionInput
  ): Promise<Transaction> {
    const attributes = { orgId, ledgerId, transactionId };

    this.validateRequiredParams(this.startSpan('validateParams', attributes), {
      orgId,
      ledgerId,
      transactionId,
    });

    validate(input, validateUpdateTransactionInput);

    const url = this.urlBuilder.buildTransactionUrl(orgId, ledgerId, transactionId);

    return this.patchRequest<Transaction>('updateTransaction', url, input, undefined, attributes);
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
   * Blocks funds, moving them as a transfer does while labelling the operations `BLOCK`
   *
   * @returns Promise resolving to the created transaction
   */
  public async blockFunds(
    orgId: string,
    ledgerId: string,
    input: BlockFundsInput
  ): Promise<Transaction> {
    return this.postNonPendingTransaction(
      'block',
      'blockFunds',
      orgId,
      ledgerId,
      input,
      validateBlockFundsInput
    );
  }

  /**
   * Unblocks funds, the mirror of `blockFunds`, labelling the operations `UNBLOCK`
   *
   * @returns Promise resolving to the created transaction
   */
  public async unblockFunds(
    orgId: string,
    ledgerId: string,
    input: UnblockFundsInput
  ): Promise<Transaction> {
    return this.postNonPendingTransaction(
      'unblock',
      'unblockFunds',
      orgId,
      ledgerId,
      input,
      validateUnblockFundsInput
    );
  }

  /**
   * Creates an annotation, a transaction that records intent without moving money
   *
   * The ledger answers with status `NOTED` and zero-valued operations flagged
   * `balanceAffected: false`. `NOTED` is terminal — committing or reverting the result
   * returns `409/0099`.
   *
   * @returns Promise resolving to the created transaction
   */
  public async createAnnotation(
    orgId: string,
    ledgerId: string,
    input: CreateAnnotationInput
  ): Promise<Transaction> {
    return this.postNonPendingTransaction(
      'annotation',
      'createAnnotation',
      orgId,
      ledgerId,
      input,
      validateCreateAnnotationInput
    );
  }

  /**
   * Issues the POST behind block, unblock and annotation, whose body is the one
   * `/transactions/json` takes
   *
   * @returns Promise resolving to the created transaction
   */
  private async postNonPendingTransaction(
    variant: Extract<TransactionCreateVariant, 'block' | 'unblock' | 'annotation'>,
    operation: string,
    orgId: string,
    ledgerId: string,
    input: NonPendingTransactionInput,
    validator: (input: NonPendingTransactionInput) => ReturnType<typeof validateBlockFundsInput>
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
      operation,
      url,
      toApiTransaction(input),
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyTtlSeconds: input.idempotencyTtlSeconds,
      },
      attributes
    )
      .catch((error) => {
        throw asSkipNotPermittedError(error, operation);
      })
      .then((transaction) => assertLabelled(variant, operation, transaction));
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
   * the original legs swapped, not with the reverted one. That parent is checked against
   * the transaction the caller named, because the endpoint deduplicates on the mirrored
   * body — which carries no parent id — and will hand back another transaction's reversal
   * with `201 CREATED`.
   *
   * @returns Promise resolving to the reversing transaction
   */
  public async revertTransaction(
    orgId: string,
    ledgerId: string,
    transactionId: string,
    options?: RevertTransactionOptions
  ): Promise<Transaction> {
    const reversal = await this.postStateTransition(
      'revert',
      orgId,
      ledgerId,
      transactionId,
      options
    );

    return assertReversalOf(transactionId, reversal);
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
    options?: TransactionStateTransitionOptions
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
      timeout: options?.timeout,
      signal: options?.signal,
      // Commit and cancel are the only writes here with no server-side dedupe, and the
      // ledger keeps their lock for 300 seconds after a successful transition. A
      // transport retry of a commit whose response was lost therefore reports a settled
      // commit as a 0486 failure, so the transport is told not to re-send. Revert is
      // deduplicated server-side and stays retryable.
      ...(transition === 'revert' ? {} : { maxRetries: 0 }),
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
