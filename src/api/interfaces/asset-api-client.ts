/**
 * @file Asset API client interface
 * @description Defines the interface for asset API operations
 */

import { Asset, CreateAssetInput, UpdateAssetInput } from '../../models/asset';
import { ListOptions, ListResponse } from '../../models/common';

import { ApiClient } from './api-client';

/**
 * Interface for asset API operations
 *
 * This interface defines the methods for interacting with asset endpoints.
 * It abstracts away the HTTP details and focuses on the business operations.
 */
export interface AssetApiClient extends ApiClient<Asset, CreateAssetInput, UpdateAssetInput> {
  /**
   * Lists assets for a specific organization and ledger
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param options - Optional list options for filtering and pagination
   * @returns Promise resolving to a paginated list of assets
   */
  listAssets(orgId: string, ledgerId: string, options?: ListOptions): Promise<ListResponse<Asset>>;

  /**
   * Gets an asset by ID
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param id - Asset ID
   * @returns Promise resolving to the asset
   */
  getAsset(orgId: string, ledgerId: string, id: string): Promise<Asset>;

  /**
   * Creates a new asset
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param input - Asset creation input
   * @returns Promise resolving to the created asset
   */
  createAsset(orgId: string, ledgerId: string, input: CreateAssetInput): Promise<Asset>;

  /**
   * Updates an existing asset
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param id - Asset ID
   * @param input - Asset update input
   * @returns Promise resolving to the updated asset
   */
  updateAsset(orgId: string, ledgerId: string, id: string, input: UpdateAssetInput): Promise<Asset>;

  /**
   * Deletes an asset
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param id - Asset ID
   * @returns Promise resolving when the asset is deleted
   */
  deleteAsset(orgId: string, ledgerId: string, id: string): Promise<void>;
}
