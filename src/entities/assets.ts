/**
 * @file Asset service interface for the Midaz SDK
 * @description Defines the interface for managing assets within the Midaz ledger system
 */

import { Asset, CreateAssetInput, UpdateAssetInput } from '../models/asset';
import { AssetRate, UpdateAssetRateInput } from '../models/asset-rate';
import { ListOptions, ListResponse } from '../models/common';

/**
 * Service for managing assets in the Midaz system
 *
 * The AssetsService provides methods for creating, retrieving, updating, and deleting
 * assets within a specific organization and ledger. Assets represent the types of value
 * that can be held in accounts, such as currencies, cryptocurrencies, commodities, or
 * other financial instruments.
 *
 * Each asset:
 * - Belongs to a specific organization and ledger
 * - Has a unique code for identification (e.g., "USD", "BTC")
 * - Has a specific type (e.g., "currency", "crypto", "commodities")
 * - Can be used in multiple accounts
 * - Can have conversion rates to other assets
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
 *
 * // List assets in a ledger
 * const assets = await midazClient.entities.assets.listAssets(
 *   "org_12345",
 *   "ldg_67890",
 *   { limit: 10, offset: 0 }
 * );
 * ```
 */
export interface AssetsService {
  /**
   * Lists assets with optional filters
   *
   * Retrieves a paginated list of assets within the specified organization and ledger.
   * The results can be filtered, sorted, and paginated using the options parameter.
   *
   * @param orgId - Organization ID that owns the assets
   * @param ledgerId - Ledger ID that contains the assets
   * @param opts - List options for pagination, sorting, and filtering
   * @returns Promise resolving to a paginated list of assets
   *
   * @example
   * ```typescript
   * // List the first 10 assets in a ledger
   * const assets = await assetsService.listAssets(
   *   "org_12345",
   *   "ldg_67890",
   *   { limit: 10, offset: 0 }
   * );
   *
   * // List assets with filtering
   * const filteredAssets = await assetsService.listAssets(
   *   "org_12345",
   *   "ldg_67890",
   *   {
   *     limit: 20,
   *     filter: {
   *       type: "currency",
   *       status: "ACTIVE"
   *     }
   *   }
   * );
   *
   * // List assets with sorting
   * const sortedAssets = await assetsService.listAssets(
   *   "org_12345",
   *   "ldg_67890",
   *   {
   *     limit: 10,
   *     sort: {
   *       field: "name",
   *       order: "ASC"
   *     }
   *   }
   * );
   * ```
   */
  listAssets(orgId: string, ledgerId: string, opts?: ListOptions): Promise<ListResponse<Asset>>;

  /**
   * Gets an asset by ID
   *
   * Retrieves a single asset by its unique identifier within the specified
   * organization and ledger.
   *
   * @param orgId - Organization ID that owns the asset
   * @param ledgerId - Ledger ID that contains the asset
   * @param id - Asset ID to retrieve
   * @returns Promise resolving to the asset
   *
   * @example
   * ```typescript
   * // Get asset details
   * const asset = await assetsService.getAsset(
   *   "org_12345",
   *   "ldg_67890",
   *   "ast_abcdef"
   * );
   *
   * console.log(`Asset name: ${asset.name}`);
   * console.log(`Asset code: ${asset.code}`);
   * console.log(`Asset type: ${asset.type}`);
   * console.log(`Status: ${asset.status.code}`);
   * ```
   */
  getAsset(orgId: string, ledgerId: string, id: string): Promise<Asset>;

  /**
   * Creates a new asset
   *
   * Creates a new asset within the specified organization and ledger using
   * the provided asset details. The asset will be initialized with the
   * specified properties and assigned a unique identifier.
   *
   * @param orgId - Organization ID that will own the asset
   * @param ledgerId - Ledger ID that will contain the asset
   * @param input - Asset creation input with required properties
   * @returns Promise resolving to the created asset
   *
   * @example
   * ```typescript
   * // Create a basic currency asset
   * const newAsset = await assetsService.createAsset(
   *   "org_12345",
   *   "ldg_67890",
   *   {
   *     name: "US Dollar",
   *     code: "USD",
   *     type: "currency"
   *   }
   * );
   *
   * // Create a cryptocurrency asset with additional properties
   * const cryptoAsset = await assetsService.createAsset(
   *   "org_12345",
   *   "ldg_67890",
   *   {
   *     name: "Bitcoin",
   *     code: "BTC",
   *     type: "crypto",
   *     scale: 8,
   *     metadata: {
   *       network: "mainnet",
   *       description: "Decentralized cryptocurrency"
   *     }
   *   }
   * );
   * ```
   */
  createAsset(orgId: string, ledgerId: string, input: CreateAssetInput): Promise<Asset>;

  /**
   * Updates an existing asset
   *
   * Updates the properties of an existing asset within the specified
   * organization and ledger. Only the properties included in the input
   * will be modified; others will remain unchanged.
   *
   * @param orgId - Organization ID that owns the asset
   * @param ledgerId - Ledger ID that contains the asset
   * @param id - Asset ID to update
   * @param input - Asset update input with properties to change
   * @returns Promise resolving to the updated asset
   *
   * @example
   * ```typescript
   * // Update an asset's name
   * const updatedAsset = await assetsService.updateAsset(
   *   "org_12345",
   *   "ldg_67890",
   *   "ast_abcdef",
   *   {
   *     name: "United States Dollar"
   *   }
   * );
   *
   * // Update multiple properties
   * const updatedAsset = await assetsService.updateAsset(
   *   "org_12345",
   *   "ldg_67890",
   *   "ast_abcdef",
   *   {
   *     name: "United States Dollar",
   *     status: "INACTIVE",
   *     metadata: {
   *       description: "Official currency of the United States",
   *       symbol: "$"
   *     }
   *   }
   * );
   * ```
   */
  updateAsset(orgId: string, ledgerId: string, id: string, input: UpdateAssetInput): Promise<Asset>;

  /**
   * Deletes an asset
   *
   * Deletes an asset from the specified organization and ledger.
   * This operation may be restricted if the asset is used by any accounts
   * or has associated balances. In many cases, assets are soft-deleted
   * (marked as deleted but retained in the system) to maintain audit history.
   *
   * @param orgId - Organization ID that owns the asset
   * @param ledgerId - Ledger ID that contains the asset
   * @param id - Asset ID to delete
   * @returns Promise that resolves when the asset is deleted
   *
   * @example
   * ```typescript
   * // Delete an asset
   * await assetsService.deleteAsset(
   *   "org_12345",
   *   "ldg_67890",
   *   "ast_abcdef"
   * );
   *
   * // Attempt to retrieve the deleted asset (will throw an error)
   * try {
   *   const asset = await assetsService.getAsset(
   *     "org_12345",
   *     "ldg_67890",
   *     "ast_abcdef"
   *   );
   * } catch (error) {
   *   console.error("Asset not found or has been deleted");
   * }
   * ```
   */
  deleteAsset(orgId: string, ledgerId: string, id: string): Promise<void>;
}
