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
   * @param organizationId Organization ID
   * @param ledgerId Ledger ID
   * @param sourceAssetCode Source asset code (e.g., "USD")
   * @param destinationAssetCode Destination asset code (e.g., "EUR")
   * @returns Promise resolving to the asset rate
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
   * @param organizationId Organization ID
   * @param ledgerId Ledger ID
   * @param input Asset rate details
   * @returns Promise resolving to the created or updated asset rate
   */
  createOrUpdateAssetRate(
    organizationId: string,
    ledgerId: string,
    input: UpdateAssetRateInput
  ): Promise<AssetRate>;
}
