/**
 */

import type { components } from '../generated/ledger-v1';

/**
 * Represents an asset exchange rate in the Midaz Ledger.
 *
 * Rates are directional: they convert `from` one asset `to` another. The value
 * is carried as the integer `rate` paired with `scale`, the number of decimal
 * places, so `{ rate: 520, scale: 2 }` means 1 BRL = 5.20 USD.
 *
 * @example
 * ```typescript
 * const brlToUsd: AssetRate = {
 *   id: "019fd4f3-d4f5-715c-9f62-dae7d93b6e7c",
 *   organizationId: "019fd4cf-c605-74ff-b89a-c60ef18fce7c",
 *   ledgerId: "019fd4cf-c624-7402-bd8b-e9a9c8c60427",
 *   externalId: "019fd4f3-d4f5-70a6-93c2-2eb39c9fe00f",
 *   from: "BRL",
 *   to: "USD",
 *   rate: 520,
 *   scale: 2,
 *   source: "Central Bank",
 *   ttl: 3600,
 *   createdAt: "2026-08-06T02:42:57Z",
 *   updatedAt: "2026-08-06T03:17:14Z",
 *   metadata: {}
 * };
 * ```
 */
export interface AssetRate {
  /** Unique identifier of the rate */
  id: string;

  /** Organization that owns the rate */
  organizationId: string;

  /** Ledger the rate belongs to */
  ledgerId: string;

  /** Identifier used to correlate the rate with an external system */
  externalId: string;

  /** Source asset code */
  from: string;

  /** Target asset code */
  to: string;

  /** Unscaled exchange rate */
  rate: number;

  /** Number of decimal places applied to `rate` */
  scale: number | null;

  /** Free-form origin of the rate information */
  source: string | null;

  /** Time-to-live in seconds */
  ttl: number;

  /** Creation timestamp */
  createdAt: string;

  /** Last update timestamp */
  updatedAt: string;

  /** Additional custom attributes */
  metadata: { [key: string]: unknown };
}

// Structural check against the generated spec type: it is declared here rather than aliased so
// the published declarations do not reference `src/generated`, which ships no runtime module.
type GeneratedAssetRate = components['schemas']['AssetRate'];

const assetRateMatchesSpec: (value: AssetRate) => GeneratedAssetRate = (value) => value;

const specMatchesAssetRate: (value: GeneratedAssetRate) => AssetRate = (value) => value;

void assetRateMatchesSpec;
void specMatchesAssetRate;

/**
 * Input for creating or updating an asset rate
 *
 * @example
 * ```typescript
 * const rateInput: UpdateAssetRateInput = {
 *   from: "BRL",
 *   to: "USD",
 *   rate: 520,
 *   scale: 2,
 *   ttl: 3600,
 *   source: "Central Bank"
 * };
 * ```
 */
export interface UpdateAssetRateInput {
  /**
   * The source asset code, 2 to 10 characters (e.g. "BRL" in a BRL→USD rate)
   */
  from: string;

  /**
   * The target asset code, 2 to 10 characters (e.g. "USD" in a BRL→USD rate)
   */
  to: string;

  /**
   * The unscaled exchange rate, always an integer
   * Paired with `scale` to express decimals: 520 with scale 2 is 5.20
   */
  rate: number;

  /**
   * Number of decimal places applied to `rate`, a non-negative integer
   * Defaults to 0 server-side, meaning `rate` is taken as a whole number
   */
  scale?: number;

  /**
   * Free-form origin of the rate information, at most 200 characters
   */
  source?: string;

  /**
   * Time-to-live in seconds, a non-negative integer
   */
  ttl?: number;

  /**
   * Caller-supplied UUID used to correlate the rate with an external system
   * The ledger generates one when it is omitted
   */
  externalId?: string;

  /**
   * Additional custom attributes
   */
  metadata?: Record<string, unknown>;
}

/**
 * Optional fields accepted alongside the required asset rate triple
 */
export type AssetRateOptions = Omit<UpdateAssetRateInput, 'from' | 'to' | 'rate'>;

/**
 * Creates a new UpdateAssetRateInput object
 *
 * @returns A complete UpdateAssetRateInput object ready to be used in API calls
 *
 * @example
 * ```typescript
 * // 1 BRL = 5.20 USD, valid for an hour
 * const rateInput = createUpdateAssetRateInput("BRL", "USD", 520, {
 *   scale: 2,
 *   ttl: 3600,
 *   source: "Central Bank",
 * });
 *
 * // A whole-number rate needs no options
 * const wholeRate = createUpdateAssetRateInput("BTC", "USD", 43000);
 * ```
 */
export function createUpdateAssetRateInput(
  from: string,
  to: string,
  rate: number,
  options: AssetRateOptions = {}
): UpdateAssetRateInput {
  const input: UpdateAssetRateInput = { from, to, rate };

  if (options.scale !== undefined) {
    input.scale = options.scale;
  }
  if (options.source !== undefined) {
    input.source = options.source;
  }
  if (options.ttl !== undefined) {
    input.ttl = options.ttl;
  }
  if (options.externalId !== undefined) {
    input.externalId = options.externalId;
  }
  if (options.metadata !== undefined) {
    input.metadata = options.metadata;
  }

  return input;
}
