/**
 * Asset service interface - Defines the interface for managing assets
 */

import { Asset, CreateAssetInput, UpdateAssetInput } from '../models/asset';
import { ListOptions, ListResponse } from '../models/common';

/**
 * Service for managing assets
 *
 * Provides methods for creating, retrieving, updating, and deleting
 * assets within an organization and ledger.
 *
 * @example
 * ```typescript
 * // Create a new asset
 * const newAsset = await midazClient.entities.assets.createAsset(
 *   "org_12345",
 *   "ldg_67890",
 *   {
 *     name: "US Dollar",
 *     code: "USD",
 *     type: "currency"
 *   }
 * );
 * ```
 */
export interface AssetsService {
  /**
   * Lists assets with optional filters
   *
   * @returns Promise resolving to a paginated list of assets
   */
  listAssets(orgId: string, ledgerId: string, opts?: ListOptions): Promise<ListResponse<Asset>>;

  /**
   * Gets an asset by ID
   *
   * @returns Promise resolving to the asset
   */
  /**
   * Counts the assets of a ledger
   *
   * The ledger answers this over HEAD with the total in `X-Total-Count` and ignores
   * every query parameter, so the count cannot be filtered.
   *
   */
  countAssets(orgId: string, ledgerId: string): Promise<number>;

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
   * @returns Promise that resolves when the asset is deleted
   */
  deleteAsset(orgId: string, ledgerId: string, id: string): Promise<void>;
}
