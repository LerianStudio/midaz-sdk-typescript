/**
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
   * @returns Promise resolving to a paginated list of assets
   */
  listAssets(orgId: string, ledgerId: string, options?: ListOptions): Promise<ListResponse<Asset>>;

  /**
   * Gets an asset by ID
   *
   * @returns Promise resolving to the asset
   */
  getAsset(orgId: string, ledgerId: string, id: string): Promise<Asset>;

  /**
   * Creates a new asset
   *
   * @returns Promise resolving to the created asset
   */
  createAsset(orgId: string, ledgerId: string, input: CreateAssetInput): Promise<Asset>;

  /**
   * Updates an existing asset
   *
   * @returns Promise resolving to the updated asset
   */
  updateAsset(orgId: string, ledgerId: string, id: string, input: UpdateAssetInput): Promise<Asset>;

  /**
   * Deletes an asset
   *
   * @returns Promise resolving when the asset is deleted
   */
  deleteAsset(orgId: string, ledgerId: string, id: string): Promise<void>;
}
