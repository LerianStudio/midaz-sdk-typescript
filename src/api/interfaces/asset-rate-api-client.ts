/**
 * @file Asset rate API client interface
 * @description Defines the interface for asset rate API operations
 */

import { AssetRate, UpdateAssetRateInput } from '../../models/asset-rate';

import { ApiClient } from './api-client';

/**
 * Interface for asset rate API operations
 *
 * This interface defines the methods for interacting with asset rate endpoints.
 * It abstracts away the HTTP details and focuses on the business operations.
 */
export interface AssetRateApiClient
  extends ApiClient<AssetRate, UpdateAssetRateInput, UpdateAssetRateInput> {
  /**
   * Retrieves the exchange rate between two assets
   *
   * @param organizationId - Organization ID
   * @param ledgerId - Ledger ID
   * @param sourceAssetCode - Source asset code
   * @param destinationAssetCode - Destination asset code
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
   * @param organizationId - Organization ID
   * @param ledgerId - Ledger ID
   * @param input - Asset rate input with all required fields
   * @returns Promise resolving to the created or updated asset rate
   */
  createOrUpdateAssetRate(
    organizationId: string,
    ledgerId: string,
    input: UpdateAssetRateInput
  ): Promise<AssetRate>;
}
