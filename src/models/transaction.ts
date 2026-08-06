/**
 * Transaction model definitions
 */

import { ApiResponse, Status } from './common';

/**
 * Transaction represents a transaction in the Midaz Ledger.
 * A transaction is a financial event that affects one or more accounts
 * through a series of operations (debits and credits).
 *
 * Transactions are the core financial records in the Midaz system, representing
 * the movement of assets between accounts. Each transaction consists of one or more
 * operations (debits and credits) that must balance (sum to zero) for each asset type.
 */
export interface Transaction extends ApiResponse {
  /** Unique identifier for the transaction - system-generated UUID */
  id: string;

  /** Template identifier for the transaction template used (optional) */
  template?: string;

  /** Numeric value of the transaction as a decimal string (e.g., "100.50") */
  amount: string;

  /** Asset code identifying the currency or asset type (e.g., "USD", "EUR", "BTC") */
  assetCode: string;

  /** Transaction route identifier that defines the overall flow of the transaction */
  route?: string;

  /** Current processing status of the transaction */
  status: Status;

  /** Chart of accounts group name for accounting categorization */
  chartOfAccountsGroupName?: string;

  /** List of source account aliases used in this transaction */
  source?: string[];

  /** List of destination account aliases used in this transaction */
  destination?: string[];

  /** Whether the transaction is in a pending state requiring explicit commitment */
  pending?: boolean;

  /** UUID of the transaction route the ledger recorded, echoed from the request's `routeId` */
  routeId?: string;

  /**
   * Whether fee computation was actually skipped. This is the only place the outcome of
   * a requested `skip.fees` appears: the ledger never echoes `skip` back.
   */
  feesSkipped?: boolean;

  /**
   * Whether tracer evaluation was actually skipped. This is the only place the outcome of
   * a requested `skip.tracer` appears: the ledger never echoes `skip` back.
   */
  tracerSkipped?: boolean;

  /**
   * Identifier of the transaction this one reverses, set only on transactions the
   * ledger creates in response to a revert
   */
  parentTransactionId?: string;

  /** Ledger identifier this transaction belongs to */
  ledgerId: string;

  /** Organization identifier this transaction belongs to */
  organizationId: string;

  /** Individual debit and credit operations (sum must balance to zero) */
  operations?: Operation[];

  /** Additional custom data for the transaction */
  metadata?: Record<string, any>;

  /** Timestamp when the transaction was created */
  createdAt: string;

  /** Timestamp when the transaction was last updated */
  updatedAt: string;

  /** Timestamp when the transaction was deleted (if soft-deleted) */
  deletedAt?: string;

  /** Optional identifier for linking to external systems */
  externalId?: string;

  /** Human-readable description of the transaction */
  description?: string;
}

/**
 * Operation within a transaction
 */
export interface Operation {
  /** Unique system-generated identifier */
  id: string;
  /** Account ID this operation affects */
  accountId: string;
  /** Optional account alias */
  accountAlias?: string;
  /**
   * Operation type.
   *
   * `BLOCK` and `UNBLOCK` are the labels the block and unblock endpoints persist in
   * place of `DEBIT`/`CREDIT`; the balances move exactly as they do on a transfer.
   *
   * `OVERDRAFT`, `ON_HOLD` and `RELEASE` are system-generated: the ledger writes them
   * on companion rows the caller never asked for. `OVERDRAFT` marks the leg booked
   * against the overdraft companion balance and takes precedence over the block/unblock
   * label (midaz components/ledger/internal/adapters/http/in/transaction_create.go:952);
   * `ON_HOLD` and `RELEASE` are written by the pending and cancel flows only
   * (transaction_create.go:700 and :781). The full set is midaz
   * pkg/constant/operation.go.
   */
  type: 'DEBIT' | 'CREDIT' | 'BLOCK' | 'UNBLOCK' | 'OVERDRAFT' | 'ON_HOLD' | 'RELEASE';
  /** Amount for this operation */
  amount: Amount;
  /**
   * Whether this operation moved a balance. Annotations are the only transactions that
   * write operations flagged `false`.
   */
  balanceAffected?: boolean;
  /** Optional description of the operation */
  description?: string;
  /** Chart of accounts code */
  chartOfAccounts?: string;
  /** Asset code for this operation */
  assetCode?: string;
  /** Custom metadata fields for the operation */
  metadata?: Record<string, any>;
}

/**
 * Amount represents the amount details for an operation.
 * This structure contains the value and asset code for an amount.
 */
export interface Amount {
  /** Asset identifies the currency or asset type for this amount */
  asset: string;
  /** Value is the numeric value of the amount as a decimal string */
  value: string;
}

/**
 * Per-request options accepted by every transaction state transition.
 *
 * `idempotencyKey` is deliberately absent: the ledger accepts `X-Idempotency` on
 * commit and cancel but ignores it, so offering one would imply a guarantee that
 * does not exist.
 */
export interface TransactionStateTransitionOptions {
  /** Overrides the client's request timeout, in milliseconds */
  timeout?: number;

  /** Aborts the request when the signal fires */
  signal?: AbortSignal;
}

/**
 * Per-request options for reverting a transaction.
 *
 * `idempotencyKey` is absent for the same reason it is absent on commit and cancel: the
 * revert route binds no `X-Idempotency` field and hardcodes an empty key server-side, so
 * a caller key is discarded. The endpoint deduplicates on a hash of the mirrored body for
 * 300 seconds instead, and that hash carries no parent id — which is why the SDK checks
 * `parentTransactionId` on the reversal it hands back.
 */
export type RevertTransactionOptions = TransactionStateTransitionOptions;

/**
 * Per-call control opt-outs.
 *
 * Each flag is honoured only when the matching per-ledger override is enabled
 * (`overrides.allowFeeSkip`, `overrides.allowTracerSkip`); otherwise the whole request
 * is rejected with `422/0490`. The SDK cannot read those settings, so it forwards the
 * flags without pre-validating them.
 */
export interface TransactionSkipInput {
  /** Skips fee computation. Requires the ledger's `overrides.allowFeeSkip`. */
  fees?: boolean;

  /** Skips tracer evaluation. Requires the ledger's `overrides.allowTracerSkip`. */
  tracer?: boolean;
}

/**
 * CreateTransactionInput is the input for creating a transaction.
 * This structure contains all the fields needed to create a new transaction.
 */
export interface CreateTransactionInput {
  /** Template is an optional identifier for the transaction template to use */
  template?: string;

  /** Amount is the numeric value of the transaction as a decimal string (used for validation) */
  amount?: string;

  /** AssetCode identifies the currency or asset type for this transaction */
  assetCode?: string;

  /** Operations contains the individual debit and credit operations (alternative to Send) */
  operations?: OperationInput[];

  /** ChartOfAccountsGroupName is REQUIRED by the API specification */
  chartOfAccountsGroupName: string;

  /** Description is a human-readable description of the transaction (REQUIRED by API) */
  description: string;

  /**
   * Code is an optional identifier/reference code for the transaction, at most 100
   * characters. The ledger persists it but never returns it, so the created
   * `Transaction` carries no `code` — that absence is not a lost write.
   */
  code?: string;

  /** Pending indicates whether the transaction should be created in a pending state */
  pending?: boolean;

  /**
   * Route is the deprecated free-form transaction route identifier, kept by the ledger
   * for backwards compatibility and used by nothing. Use `routeId`.
   */
  route?: string;

  /**
   * RouteID is the UUID of the transaction route. The ledger accepts a UUID that
   * matches no existing route while `accounting.validateRoutes` is off, so a typo
   * surfaces only once that setting is turned on.
   */
  routeId?: string;

  /**
   * TransactionDate backdates the transaction. The ledger writes it straight into the
   * response's `createdAt`, so the created transaction reports this value rather than
   * the time it was written. Accepted forms: `YYYY-MM-DD`, `YYYY-MM-DDTHH:mm:ss`,
   * the same with `Z`, with a numeric offset, and with fractional seconds. A future
   * date is `400/0121`, and combining it with `pending` is `400/0122`.
   */
  transactionDate?: string;

  /** Skip carries the per-call control opt-outs, each gated by a per-ledger override */
  skip?: TransactionSkipInput;

  /** Metadata contains additional custom data for the transaction */
  metadata?: Record<string, any>;

  /** ExternalID is an optional identifier for linking to external systems */
  externalId?: string;

  /** IdempotencyKey is a client-generated key to ensure transaction uniqueness */
  idempotencyKey?: string;

  /** Send contains the source and distribution information for the transaction (REQUIRED by API) */
  send?: SendInput;
}

/**
 * SendInput represents the send information for a transaction.
 * This structure contains the source and distribution details for a transaction.
 */
export interface SendInput {
  /** Asset identifies the currency or asset type for this transaction */
  asset: string;

  /**
   * Value is the numeric value of the transaction. A decimal string is the
   * recommended form; a number is accepted and serialized, but only when it can
   * be represented exactly (finite, within the safe integer range, no exponent
   * notation).
   */
  value: string | number;

  /** Source contains the source accounts for the transaction */
  source?: SourceInput;

  /** Distribute contains the destination accounts for the transaction */
  distribute?: DistributeInput;
}

/**
 * Send information accepted by `POST /transactions/inflow`.
 *
 * The ledger synthesizes the debit leg from `@external/{asset}`, so `source` is
 * declared as `never`: supplying one is rejected with `400/0053` on the wire.
 */
export interface InflowSendInput {
  /** Asset identifies the currency or asset type for this transaction */
  asset: string;

  /** Value is the numeric value of the transaction, as a decimal string or an exactly representable number */
  value: string | number;

  /** Distribute contains the destination accounts that receive the funds */
  distribute: DistributeInput;

  /** The inflow endpoint's input struct declares no source field */
  source?: never;
}

/**
 * Send information accepted by `POST /transactions/outflow`.
 *
 * The ledger synthesizes the credit leg to `@external/{asset}`, so `distribute` is
 * declared as `never`: supplying one is rejected with `400/0053` on the wire.
 */
export interface OutflowSendInput {
  /** Asset identifies the currency or asset type for this transaction */
  asset: string;

  /** Value is the numeric value of the transaction, as a decimal string or an exactly representable number */
  value: string | number;

  /** Source contains the accounts the funds leave from */
  source: SourceInput;

  /** The outflow endpoint's input struct declares no distribute field */
  distribute?: never;
}

/**
 * Fields shared by the two single-sided flow inputs
 */
interface FlowInputBase {
  /** ChartOfAccountsGroupName groups the transaction for accounting purposes */
  chartOfAccountsGroupName?: string;

  /** Description is a human-readable description of the transaction */
  description?: string;

  /** Code is an optional identifier/reference code for the transaction */
  code?: string;

  /** Route is the transaction route identifier (optional) */
  route?: string;

  /** Metadata contains additional custom data for the transaction */
  metadata?: Record<string, any>;

  /**
   * Sent as `X-Idempotency`. Midaz replays rather than rejecting: the same key with a
   * different body silently returns the first transaction, and `X-Idempotency-Replayed`
   * on the response is the only way to tell a fresh write from a replay.
   */
  idempotencyKey?: string;

  /**
   * Sent as `X-TTL`, in seconds. Omitted by default, which leaves the server's own
   * 300-second slot.
   *
   * Without an `idempotencyKey` this widens the window in which the ledger deduplicates
   * on a hash of the request body: a later, genuinely different write whose body happens
   * to hash the same is answered with the FIRST transaction under `201 CREATED` and
   * never happens. Only lengthen it alongside a distinct `idempotencyKey`.
   */
  idempotencyTtlSeconds?: number;
}

/**
 * Input for `POST /transactions/inflow`, which funds accounts from outside the ledger.
 */
export interface CreateInflowInput extends FlowInputBase {
  /** Send carries the asset, the value and the destinations */
  send: InflowSendInput;

  /** The inflow endpoint's input struct declares no pending field */
  pending?: never;
}

/**
 * Input for `POST /transactions/outflow`, which moves funds out of the ledger.
 */
export interface CreateOutflowInput extends FlowInputBase {
  /** Send carries the asset, the value and the sources */
  send: OutflowSendInput;

  /** Pending holds the funds until an explicit commit; outflow supports it, inflow does not */
  pending?: boolean;
}

/**
 * Full transaction body shared by the three endpoints that only relabel the result:
 * `/transactions/block`, `/transactions/unblock` and `/transactions/annotation`.
 *
 * The body is byte-for-byte the one `/transactions/json` takes, with one exception:
 * `pending` is declared as `never` because no endpoint here honours it. Block and
 * unblock force it to false server-side, so sending it is merely a lie; on annotation
 * it is actively destructive, flipping both operations to `CREDIT`.
 */
export interface NonPendingTransactionInput extends Omit<CreateTransactionInput, 'pending'> {
  /** None of these three endpoints honours a pending flag */
  pending?: never;

  /**
   * Sent as `X-TTL`, in seconds. Omitted by default, which leaves the server's own
   * 300-second slot.
   *
   * Without an `idempotencyKey` this widens the window in which the ledger deduplicates
   * on a hash of the request body: a later, genuinely different write whose body happens
   * to hash the same is answered with the FIRST transaction under `201 CREATED` and
   * never happens. Only lengthen it alongside a distinct `idempotencyKey`.
   */
  idempotencyTtlSeconds?: number;
}

/**
 * Input for `POST /transactions/block`, which moves funds exactly as a transfer does
 * and relabels the persisted operations to `BLOCK`.
 */
export type BlockFundsInput = NonPendingTransactionInput;

/**
 * Input for `POST /transactions/unblock`, the mirror of block: balances move normally
 * and the persisted operations are labelled `UNBLOCK`.
 */
export type UnblockFundsInput = NonPendingTransactionInput;

/**
 * Input for `POST /transactions/annotation`, which records a transaction without
 * moving any money.
 *
 * The ledger answers with status `NOTED` and writes operations carrying
 * `amount.value: "0"` and `balanceAffected: false`, leaving every balance untouched.
 * `NOTED` is terminal: the resulting transaction can be neither committed nor
 * reverted, both of which return `409/0099`, so do not build a two-phase flow on it.
 */
export type CreateAnnotationInput = NonPendingTransactionInput;

/**
 * SourceInput represents the source information for a transaction.
 * This structure contains the source accounts for a transaction.
 */
export interface SourceInput {
  /** From contains the list of source accounts and amounts */
  from: FromToInput[];
}

/**
 * DistributeInput represents the distribution information for a transaction.
 * This structure contains the destination accounts for a transaction.
 */
export interface DistributeInput {
  /** To contains the list of destination accounts and amounts */
  to: FromToInput[];
}

/**
 * ShareInput expresses a leg's value as a percentage of the transaction total instead
 * of an absolute amount.
 *
 * Both percentages are integers: the ledger reads them as `int64`, so a fractional
 * value is refused client-side rather than truncated on the wire.
 */
export interface ShareInput {
  /** Percentage of `send.value` this leg takes, as an integer between 1 and 100 */
  percentage: number;

  /**
   * Percentage of `percentage` actually applied, as an integer.
   *
   * The ledger treats `0` and an omitted value identically, both meaning 100.
   */
  percentageOfPercentage?: number;
}

/**
 * RateInput carries an exchange rate alongside a leg.
 *
 * The ledger accepts this object and never reads it: `FromTo.Rate` has no read site in
 * the ledger, so no conversion is applied and the operation is booked at face value in
 * `send.asset`. Verified live against midaz main @33cb93f — a leg of 100 with
 * `rate {from: BRL, to: USD, value: 5.2}` under `send.asset: "BRL"` produced a BRL 100
 * credit and answered `201 CREATED`. Do not use it to express a cross-asset leg: the
 * SDK also refuses an `amount.asset` that differs from `send.asset`, because the ledger
 * ignores that too. The field is carried to the wire for forward compatibility only.
 */
export interface RateInput {
  /** Asset the rate converts from */
  from: string;

  /** Asset the rate converts to */
  to: string;

  /** Rate value; a decimal string is the recommended form, as for every other value */
  value: string | number;

  /** UUID identifying the rate in the system that produced it */
  externalId: string;
}

/**
 * FromToInput represents a single source or destination account in a transaction.
 *
 * A leg carries either an `amount` or a `share`, never both and never neither.
 */
export interface FromToInput {
  /** Account identifies the account affected by this operation */
  account: string;

  /**
   * Amount specifies the amount details for this operation.
   *
   * Omitted on a `share` leg, where the ledger derives the value from the total.
   */
  amount?: AmountInput;

  /**
   * BalanceKey selects which of the account's balances this operation moves.
   *
   * Defaults to `"default"`. The key must name a balance that already exists: the
   * ledger does not create one on demand and answers `422/0019` for an unknown key.
   */
  balanceKey?: string;

  /** Share expresses this leg as a percentage of the transaction total */
  share?: ShareInput;

  /** Rate is accepted and ignored by the ledger; no conversion is applied. See RateInput. */
  rate?: RateInput;

  /**
   * Remaining is not emitted by this SDK.
   *
   * @deprecated The ledger counts a `remaining` leg in its balance check but never
   * turns it into an operation, so the money it names disappears while the request
   * answers `201 CREATED`. The SDK refuses the field rather than losing funds; use
   * `amount` or `share` to name the value explicitly. This is a deliberate divergence
   * from the server contract and will be reverted once midaz creates the operation.
   */
  remaining?: string;

  /**
   * Route is the operation route identifier for this operation (optional).
   *
   * The ledger persists it but validates nothing against it; `routeId` is the field
   * route validation and accounting rules read.
   */
  route?: string;

  /** RouteID is the UUID of the operation route governing this operation (optional) */
  routeId?: string;

  /** Description provides additional context for this operation (optional) */
  description?: string;

  /** ChartOfAccounts specifies the chart of accounts for this operation (optional) */
  chartOfAccounts?: string;

  /** AccountAlias provides an alternative account identifier (optional) */
  accountAlias?: string;

  /** Metadata contains additional custom data for this operation */
  metadata?: Record<string, any>;
}

/**
 * CreateOperationInput is the input for creating an operation.
 * This structure contains all the fields needed to create a new operation
 * as part of a transaction.
 */
export interface OperationInput {
  /** Type indicates whether this is a debit or credit operation */
  type: string;

  /** AccountID is the identifier of the account to be affected */
  accountId: string;

  /** Amount is the numeric value of the operation as a decimal string */
  amount: string;

  /** AssetCode identifies the currency or asset type for this operation */
  assetCode?: string;

  /** AccountAlias is an optional human-readable name for the account */
  accountAlias?: string;

  /** Route is the operation route identifier to use for this operation */
  route?: string;
}

/**
 * AmountInput represents the amount details for an operation input.
 * This structure contains the value and asset code for an amount input.
 */
export interface AmountInput {
  /**
   * Asset identifies the currency or asset type for this amount.
   *
   * The ledger ignores it — every operation is booked in `send.asset` — so the SDK
   * refuses a value that differs from `send.asset` and mirrors `send.asset` here when
   * it is omitted.
   */
  asset?: string;
  /**
   * Value is the numeric value of the amount. A decimal string is the
   * recommended form; a number is accepted and serialized, but only when it can
   * be represented exactly (finite, within the safe integer range, no exponent
   * notation).
   */
  value: string | number;
}

// ========================================
// DSL Transaction Support
// ========================================

/**
 * DSLAmount represents an amount with a value and asset code for DSL transactions.
 * This is aligned with the lib-commons Amount structure.
 */
export interface DSLAmount {
  /** Value is the numeric value of the amount as a decimal string */
  value: string;

  /** Asset is the asset code for the amount */
  asset?: string;
}

/**
 * DSLFromTo represents a source or destination in a DSL transaction.
 * This is aligned with the lib-commons FromTo structure.
 */
export interface DSLFromTo {
  /** Account is the identifier of the account */
  account: string;

  /** Amount specifies the amount details if applicable */
  amount?: DSLAmount;

  /** Share is the sharing configuration */
  share?: Share;

  /** Remaining is an optional remaining account */
  remaining?: string;

  /** Rate is the exchange rate configuration */
  rate?: Rate;

  /** Description is a human-readable description */
  description?: string;

  /** ChartOfAccounts is the chart of accounts code */
  chartOfAccounts?: string;

  /** Metadata contains additional custom data */
  metadata?: Record<string, any>;
}

/**
 * DSLSource represents the source of a DSL transaction.
 * This is aligned with the lib-commons Source structure.
 */
export interface DSLSource {
  /** Remaining is an optional remaining account */
  remaining?: string;

  /** From is a collection of source accounts and amounts */
  from: DSLFromTo[];
}

/**
 * DSLDistribute represents the distribution of a DSL transaction.
 * This is aligned with the lib-commons Distribute structure.
 */
export interface DSLDistribute {
  /** Remaining is an optional remaining account */
  remaining?: string;

  /** To is a collection of destination accounts and amounts */
  to: DSLFromTo[];
}

/**
 * DSLSend represents the send operation in a DSL transaction.
 * This is aligned with the lib-commons Send structure.
 */
export interface DSLSend {
  /** Asset identifies the currency or asset type for this transaction */
  asset: string;

  /** Value is the numeric value of the transaction as a decimal string */
  value: string;

  /** Source specifies where the funds come from */
  source?: DSLSource;

  /** Distribute specifies where the funds go to */
  distribute?: DSLDistribute;
}

/**
 * Share represents sharing configuration for DSL transactions
 */
export interface Share {
  /** Percentage of the amount to be shared */
  percent?: number;

  /** Remaining account for any leftover amount */
  remaining?: string;
}

/**
 * Rate represents exchange rate configuration for DSL transactions
 */
export interface Rate {
  /** From asset code */
  from: string;

  /** To asset code */
  to: string;

  /** Exchange rate value */
  rate: number;
}

/**
 * TransactionDSLInput represents the input for creating a transaction using DSL.
 */
export interface TransactionDSLInput {
  /** Chart of accounts group name (REQUIRED by API) */
  chartOfAccountsGroupName: string;

  /** Description of the transaction (REQUIRED by API) */
  description: string;

  /** DSL send configuration */
  send: DSLSend;

  /** Additional custom metadata */
  metadata?: Record<string, any>;

  /** Optional external identifier */
  externalId?: string;

  /** Route configuration */
  route?: string;

  /** Whether transaction should be pending */
  pending?: boolean;
}

/**
 * Input for updating an existing transaction
 *
 * These are the only two fields `PATCH .../transactions/{id}` accepts; every other key
 * is refused with `400/0053`, including `externalId`, `code` and `pending`.
 */
export interface UpdateTransactionInput {
  /**
   * Replacement description, at most 256 characters
   *
   * An empty string is ignored by the ledger, so a description cannot be cleared.
   */
  description?: string;

  /**
   * Metadata keys to merge into the transaction's existing metadata
   *
   * The ledger merges rather than replaces: keys absent from this object survive. A key
   * mapped to `null` is removed.
   */
  metadata?: Record<string, any>;
}

/**
 * Creates a new transaction input with default values
 */
export function createTransactionInput(
  chartOfAccountsGroupName: string,
  description: string
): CreateTransactionInput {
  return {
    chartOfAccountsGroupName,
    description,
  };
}

/**
 * Adds a debit operation to a transaction input
 */
export function addDebitOperation(
  transactionInput: CreateTransactionInput,
  operation: OperationInput
): CreateTransactionInput {
  // Add the debit operation to the existing operations array
  if (!transactionInput.operations) {
    transactionInput.operations = [];
  }
  transactionInput.operations.push({
    ...operation,
    type: 'DEBIT',
  });
  return transactionInput;
}
