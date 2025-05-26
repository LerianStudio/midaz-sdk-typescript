/**
 * Assets service implementation
 */

import { AssetApiClient } from '../../api/interfaces/asset-api-client';
import { Asset, CreateAssetInput, UpdateAssetInput } from '../../models/asset';
import { ListOptions, ListResponse } from '../../models/common';
import { Observability } from '../../util/observability/observability';
import { AssetsService } from '../assets';

/**
 * Implementation of the AssetsService interface
 */
export class AssetsServiceImpl implements AssetsService {
  /** Observability instance */
  private readonly observability: Observability;

  /**
   * Creates a new AssetsServiceImpl
   */
  constructor(
    private readonly apiClient: AssetApiClient,
    observability?: Observability
  ) {
    // Initialize observability with service name
    this.observability = observability || Observability.getInstance();
  }

  /** @inheritdoc */
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

  /** @inheritdoc */
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

  /** @inheritdoc */
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

  /** @inheritdoc */
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

  /** @inheritdoc */
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
