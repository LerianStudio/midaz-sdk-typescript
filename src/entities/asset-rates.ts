/**
 * @file Asset rate service interface for the Midaz SDK
 * @description Defines the interface for managing asset exchange rates within the Midaz ledger system
 */

import { AssetRate, UpdateAssetRateInput } from '../models/asset-rate';

/**
 * Service for managing asset exchange rates in the Midaz system
 *
 * The AssetRatesService provides methods for retrieving and managing exchange rates
 * between different assets within a specific organization and ledger. Asset rates
 * define the conversion values between assets and are essential for multi-currency
 * operations and reporting.
 *
 * Each asset rate:
 * - Belongs to a specific organization and ledger
 * - Defines a conversion rate between two assets
 * - Has effective and expiration dates for time-based rate management
 * - Can be used for currency conversion in transactions and reporting
 *
 * @example
 * ```typescript
 * // Get the exchange rate between USD and EUR
 * const rate = await midazClient.entities.assetRates.getAssetRate(
 *   "org_12345",
 *   "ldg_67890",
 *   "USD",
 *   "EUR"
 * );
 *
 * // Create or update an exchange rate
 * const newRate = await midazClient.entities.assetRates.createOrUpdateAssetRate(
 *   "org_12345",
 *   "ldg_67890",
 *   {
 *     fromAsset: "USD",
 *     toAsset: "EUR",
 *     rate: 0.92,
 *     effectiveAt: "2025-01-01T00:00:00Z",
 *     expirationAt: "2025-12-31T23:59:59Z"
 *   }
 * );
 * ```
 */
export interface AssetRatesService {
  /**
   * Retrieves the exchange rate between two assets
   *
   * Gets the current effective exchange rate between the specified source and
   * destination assets within the organization and ledger. If multiple rates
   * exist with different effective dates, the most current applicable rate
   * will be returned.
   *
   * @param organizationId - The ID of the organization that owns the ledger
   * @param ledgerId - The ID of the ledger that contains the assets
   * @param sourceAssetCode - The code of the source asset (e.g., "USD")
   * @param destinationAssetCode - The code of the destination asset (e.g., "EUR")
   * @returns Promise resolving to the asset rate
   *
   * @example
   * ```typescript
   * // Get the exchange rate from USD to EUR
   * const usdToEurRate = await assetRatesService.getAssetRate(
   *   "org_12345",
   *   "ldg_67890",
   *   "USD",
   *   "EUR"
   * );
   *
   * console.log(`1 USD = ${usdToEurRate.rate} EUR`);
   * console.log(`Effective from: ${usdToEurRate.effectiveAt}`);
   * console.log(`Expires at: ${usdToEurRate.expirationAt}`);
   *
   * // Convert an amount using the rate
   * const usdAmount = 100;
   * const eurAmount = usdAmount * usdToEurRate.rate;
   * console.log(`${usdAmount} USD = ${eurAmount} EUR`);
   * ```
   */
  getAssetRate(
    organizationId: string,
    ledgerId: string,
    sourceAssetCode: string,
    destinationAssetCode: string
  ): Promise<AssetRate>;

  /**
   * Creates a new asset rate or updates an existing one
   *
   * Creates a new exchange rate between the specified assets or updates an
   * existing rate if one already exists for the same asset pair. This method
   * allows for setting time-based rates with effective and expiration dates.
   *
   * @param organizationId - The ID of the organization that owns the ledger
   * @param ledgerId - The ID of the ledger that contains the assets
   * @param input - The asset rate details including source asset, destination asset, and rate
   * @returns Promise resolving to the created or updated asset rate
   *
   * @example
   * ```typescript
   * // Create a basic exchange rate between USD and EUR
   * const newRate = await assetRatesService.createOrUpdateAssetRate(
   *   "org_12345",
   *   "ldg_67890",
   *   {
   *     fromAsset: "USD",
   *     toAsset: "EUR",
   *     rate: 0.92,
   *     effectiveAt: "2025-01-01T00:00:00Z",
   *     expirationAt: "2025-12-31T23:59:59Z"
   *   }
   * );
   *
   * // Create a time-limited promotional exchange rate
   * const promotionalRate = await assetRatesService.createOrUpdateAssetRate(
   *   "org_12345",
   *   "ldg_67890",
   *   {
   *     fromAsset: "USD",
   *     toAsset: "EUR",
   *     rate: 0.95, // Special promotional rate
   *     effectiveAt: "2025-06-01T00:00:00Z",
   *     expirationAt: "2025-06-30T23:59:59Z",
   *     metadata: {
   *       promotion: "Summer Sale",
   *       description: "Special exchange rate for summer promotion"
   *     }
   *   }
   * );
   * ```
   */
  createOrUpdateAssetRate(
    organizationId: string,
    ledgerId: string,
    input: UpdateAssetRateInput
  ): Promise<AssetRate>;
}
