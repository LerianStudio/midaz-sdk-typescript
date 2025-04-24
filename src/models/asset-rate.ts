/**
 * @file Asset rate model definitions for the Midaz SDK
 * @description Defines the asset rate data structures and helper functions for managing exchange rates between assets in the Midaz ledger system
 */

/**
 * Represents an asset exchange rate in the Midaz Ledger.
 *
 * Asset rates define the conversion ratio between two different assets
 * and are used for currency conversion and other asset exchange operations.
 *
 * Exchange rates in Midaz are directional, meaning they specify the conversion
 * from one specific asset (FromAsset) to another (ToAsset). The Rate value
 * indicates how many units of ToAsset equal one unit of FromAsset.
 *
 * @example
 * ```typescript
 * // Example of a complete AssetRate object (USD to EUR)
 * const usdToEurRate: AssetRate = {
 *   id: "rate_01H9ZQCK3VP6WS2EZ5JQKD5E1S",
 *   fromAsset: "USD",
 *   toAsset: "EUR",
 *   rate: 0.92,  // 1 USD = 0.92 EUR
 *   createdAt: "2023-09-15T14:30:00Z",
 *   updatedAt: "2023-09-15T14:30:00Z",
 *   effectiveAt: "2023-09-15T00:00:00Z",
 *   expirationAt: "2023-09-16T00:00:00Z"
 * };
 *
 * // Example of a complete AssetRate object (BTC to USD)
 * const btcToUsdRate: AssetRate = {
 *   id: "rate_02H9ZQCK3VP6WS2EZ5JQKD5E1T",
 *   fromAsset: "BTC",
 *   toAsset: "USD",
 *   rate: 43000,  // 1 BTC = 43,000 USD
 *   createdAt: "2023-09-15T14:30:00Z",
 *   updatedAt: "2023-09-15T14:30:00Z",
 *   effectiveAt: "2023-09-15T00:00:00Z",
 *   expirationAt: "2023-09-16T00:00:00Z"
 * };
 * ```
 */
export interface AssetRate {
  /**
   * Unique identifier for the asset rate
   * System-generated UUID that uniquely identifies this exchange rate
   * across the entire Midaz platform.
   */
  id: string;

  /**
   * The source asset code for the conversion
   * This is the "from" asset in the exchange rate (e.g., "USD" in a USD→EUR rate)
   * Must reference a valid asset code defined in the system
   */
  fromAsset: string;

  /**
   * The target asset code for the conversion
   * This is the "to" asset in the exchange rate (e.g., "EUR" in a USD→EUR rate)
   * Must reference a valid asset code defined in the system
   */
  toAsset: string;

  /**
   * The exchange rate value
   * Represents how many units of toAsset equal one unit of fromAsset
   * For example, if USD→EUR rate is 0.92, then 1 USD = 0.92 EUR
   * Must be a positive number greater than zero
   */
  rate: number;

  /**
   * Timestamp when the asset rate was created
   * This is automatically set by the system and cannot be modified
   * ISO 8601 formatted date-time string
   */
  createdAt: string;

  /**
   * Timestamp when the asset rate was last updated
   * This is automatically updated by the system whenever the rate is modified
   * ISO 8601 formatted date-time string
   */
  updatedAt: string;

  /**
   * Timestamp when the rate becomes effective
   * Defines the start of the time period during which this rate is valid
   * ISO 8601 formatted date-time string
   */
  effectiveAt: string;

  /**
   * Timestamp when the rate expires
   * Defines the end of the time period during which this rate is valid
   * ISO 8601 formatted date-time string
   */
  expirationAt: string;
}

/**
 * Input for creating or updating an asset rate
 *
 * This structure contains all the fields required when creating or updating
 * an exchange rate between two assets. All fields are mandatory.
 *
 * @example
 * ```typescript
 * // Create input for a new USD to EUR exchange rate
 * const rateInput: UpdateAssetRateInput = {
 *   fromAsset: "USD",
 *   toAsset: "EUR",
 *   rate: 0.92,
 *   effectiveAt: "2023-09-15T00:00:00Z",
 *   expirationAt: "2023-09-16T00:00:00Z"
 * };
 *
 * // The rate can also be created using the helper function
 * const helperRateInput = createUpdateAssetRateInput(
 *   "USD",
 *   "EUR",
 *   0.92,
 *   new Date("2023-09-15T00:00:00Z"),
 *   new Date("2023-09-16T00:00:00Z")
 * );
 * ```
 */
export interface UpdateAssetRateInput {
  /**
   * The source asset code
   * This is the "from" asset in the exchange rate (e.g., "USD" in a USD→EUR rate)
   * Must reference a valid asset code defined in the system
   */
  fromAsset: string;

  /**
   * The target asset code
   * This is the "to" asset in the exchange rate (e.g., "EUR" in a USD→EUR rate)
   * Must reference a valid asset code defined in the system
   */
  toAsset: string;

  /**
   * The exchange rate value
   * Represents how many units of toAsset equal one unit of fromAsset
   * Must be greater than 0
   */
  rate: number;

  /**
   * Timestamp when the rate becomes effective
   * Defines the start of the time period during which this rate is valid
   * Must be an ISO 8601 formatted date-time string
   */
  effectiveAt: string;

  /**
   * Timestamp when the rate expires
   * Defines the end of the time period during which this rate is valid
   * Must be an ISO 8601 formatted date-time string and must be after effectiveAt
   */
  expirationAt: string;
}

/**
 * Creates a new UpdateAssetRateInput object
 *
 * This helper function simplifies the creation of asset rate inputs by
 * handling the conversion of Date objects to ISO strings automatically.
 *
 * @param fromAsset - The source asset code (e.g., "USD")
 * @param toAsset - The target asset code (e.g., "EUR")
 * @param rate - The exchange rate value (e.g., 0.92 for USD→EUR)
 * @param effectiveAt - Timestamp when the rate becomes effective (Date object or ISO string)
 * @param expirationAt - Timestamp when the rate expires (Date object or ISO string)
 * @returns A complete UpdateAssetRateInput object ready to be used in API calls
 *
 * @example
 * ```typescript
 * // Create a rate valid for the next 24 hours
 * const now = new Date();
 * const tomorrow = new Date(now);
 * tomorrow.setDate(tomorrow.getDate() + 1);
 *
 * const rateInput = createUpdateAssetRateInput(
 *   "USD",
 *   "EUR",
 *   0.92,
 *   now,
 *   tomorrow
 * );
 *
 * // Create a rate with specific timestamps as strings
 * const historicalRate = createUpdateAssetRateInput(
 *   "BTC",
 *   "USD",
 *   43000,
 *   "2023-01-01T00:00:00Z",
 *   "2023-01-02T00:00:00Z"
 * );
 * ```
 */
export function createUpdateAssetRateInput(
  fromAsset: string,
  toAsset: string,
  rate: number,
  effectiveAt: Date | string,
  expirationAt: Date | string
): UpdateAssetRateInput {
  return {
    fromAsset,
    toAsset,
    rate,
    effectiveAt: typeof effectiveAt === 'string' ? effectiveAt : effectiveAt.toISOString(),
    expirationAt: typeof expirationAt === 'string' ? expirationAt : expirationAt.toISOString(),
  };
}
