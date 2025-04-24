/**
 * @file Assets service implementation for the Midaz SDK
 * @description Implements the AssetsService interface for managing assets within the Midaz system
 */

import { AssetApiClient } from '../../api/interfaces/asset-api-client';
import { Asset, CreateAssetInput, UpdateAssetInput } from '../../models/asset';
import { ListOptions, ListResponse } from '../../models/common';
import { Observability } from '../../util/observability/observability';
import { AssetsService } from '../assets';

/**
 * Implementation of the AssetsService interface
 *
 * This class provides the concrete implementation of the AssetsService interface,
 * delegating HTTP communication to the provided API client while focusing on business logic.
 * It handles validation, error handling, observability, and pagination.
 *
 * Assets represent the currencies, securities, or other financial instruments that
 * can be held in accounts within the Midaz system. Each asset has a unique code,
 * a name, and optional metadata.
 *
 * @implements {AssetsService}
 *
 * @example
 * ```typescript
 * // Creating an instance (typically done through dependency injection)
 * const apiClient = new HttpAssetApiClient(httpClient, urlBuilder);
 * const assetsService = new AssetsServiceImpl(apiClient);
 *
 * // Using the service to list assets
 * const assets = await assetsService.listAssets(
 *   "org_123",
 *   "ldg_456"
 * );
 * ```
 */
export class AssetsServiceImpl implements AssetsService {
  /**
   * Observability instance for tracing and metrics
   * @private
   */
  private readonly observability: Observability;

  /**
   * Creates a new AssetsServiceImpl
   *
   * @param apiClient - API client for asset-related operations
   * @param observability - Optional observability provider (if not provided, a new one will be created)
   */
  constructor(private readonly apiClient: AssetApiClient, observability?: Observability) {
    // Initialize observability with service name
    this.observability =
      observability ||
      new Observability({
        serviceName: 'midaz-assets-service',
        enableTracing: process.env.MIDAZ_ENABLE_TRACING
          ? process.env.MIDAZ_ENABLE_TRACING.toLowerCase() === 'true'
          : false,
        enableMetrics: process.env.MIDAZ_ENABLE_METRICS
          ? process.env.MIDAZ_ENABLE_METRICS.toLowerCase() === 'true'
          : false,
      });
  }

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
   */
  public async listAssets(
    orgId: string,
    ledgerId: string,
    opts?: ListOptions
  ): Promise<ListResponse<Asset>> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('listAssets');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);

    if (opts) {
      span.setAttribute('limit', opts.limit || 0);
      span.setAttribute('offset', opts.offset || 0);
      if (opts.filter) {
        span.setAttribute('hasFilters', true);
      }
    }

    try {
      // Delegate to API client (validation happens there)
      const result = await this.apiClient.listAssets(orgId, ledgerId, opts);

      // Record metrics
      this.observability.recordMetric('assets.list.count', result.items.length, {
        orgId,
        ledgerId,
      });

      span.setStatus('ok');
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }

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
   */
  public async getAsset(orgId: string, ledgerId: string, id: string): Promise<Asset> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('getAsset');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('assetId', id);

    try {
      // Delegate to API client (validation happens there)
      const result = await this.apiClient.getAsset(orgId, ledgerId, id);

      // Record metrics
      this.observability.recordMetric('asset.get', 1, {
        orgId,
        ledgerId,
        assetId: id,
        assetCode: result.code || 'unknown',
      });

      span.setStatus('ok');
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }

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
   */
  public async createAsset(
    orgId: string,
    ledgerId: string,
    input: CreateAssetInput
  ): Promise<Asset> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('createAsset');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('assetCode', input.code || 'unknown');
    span.setAttribute('assetName', input.name || 'unknown');
    if (input.type) {
      span.setAttribute('assetType', input.type);
    }

    try {
      // Delegate to API client (validation happens there)
      const result = await this.apiClient.createAsset(orgId, ledgerId, input);

      // Record metrics
      this.observability.recordMetric('asset.create', 1, {
        orgId,
        ledgerId,
        assetId: result.id,
        assetCode: result.code || 'unknown',
      });

      span.setStatus('ok');
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }

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
   */
  public async updateAsset(
    orgId: string,
    ledgerId: string,
    id: string,
    input: UpdateAssetInput
  ): Promise<Asset> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('updateAsset');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('assetId', id);

    // Set attributes for the update if available
    if (input.name) {
      span.setAttribute('updatedName', input.name);
    }
    if (input.metadata) {
      span.setAttribute('updatedMetadata', true);
    }

    try {
      // Delegate to API client (validation happens there)
      const result = await this.apiClient.updateAsset(orgId, ledgerId, id, input);

      // Record metrics
      this.observability.recordMetric('asset.update', 1, {
        orgId,
        ledgerId,
        assetId: id,
        assetCode: result.code || 'unknown',
      });

      span.setStatus('ok');
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Deletes an asset
   *
   * Deletes an asset from the specified organization and ledger.
   * This operation may be restricted if the asset is in use by accounts
   * or has associated transactions. In many cases, assets are soft-deleted
   * (marked as deleted but retained in the system) to maintain audit history.
   *
   * @param orgId - Organization ID that owns the asset
   * @param ledgerId - Ledger ID that contains the asset
   * @param id - Asset ID to delete
   * @returns Promise that resolves when the asset is deleted
   */
  public async deleteAsset(orgId: string, ledgerId: string, id: string): Promise<void> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('deleteAsset');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('assetId', id);

    try {
      // Delegate to API client (validation happens there)
      await this.apiClient.deleteAsset(orgId, ledgerId, id);

      // Record metrics
      this.observability.recordMetric('asset.delete', 1, {
        orgId,
        ledgerId,
        assetId: id,
      });

      span.setStatus('ok');
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }
}
