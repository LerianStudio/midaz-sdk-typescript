/**
 * Asset rate service interface - Defines the interface for managing asset exchange rates
 */

import { AssetRate, UpdateAssetRateInput } from '../models/asset-rate';

/**
 * Service for managing asset exchange rates
 *
 * Provides methods for retrieving and managing exchange rates
 * between different assets within an organization and ledger.
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
 * // Create or update an exchange rate: 1 USD = 0.92 EUR
 * const newRate = await midazClient.entities.assetRates.createOrUpdateAssetRate(
 *   "org_12345",
 *   "ldg_67890",
 *   {
 *     from: "USD",
 *     to: "EUR",
 *     rate: 92,
 *     scale: 2,
 *     ttl: 3600
 *   }
 * );
 * ```
 */
export interface AssetRatesService {
  /**
   * Retrieves the exchange rate between two assets
   *
   * @returns Promise resolving to the asset rate
   */
  getAssetRate(
    organizationId: string,
    ledgerId: string,
    sourceAssetCode: string,
    destinationAssetCode: string
  ): Promise<AssetRate>;

  /**
   * Retrieves a single asset rate by its external identifier
   *
   * @returns Promise resolving to the asset rate
   */
  getAssetRateByExternalId(
    organizationId: string,
    ledgerId: string,
    externalId: string
  ): Promise<AssetRate>;

  /**
   * Creates a new asset rate or updates an existing one
   *
   * @returns Promise resolving to the created or updated asset rate
   */
  createOrUpdateAssetRate(
    organizationId: string,
    ledgerId: string,
    input: UpdateAssetRateInput
  ): Promise<AssetRate>;
}
