/**
 * @file HTTP implementation of asset API client
 * @description Implements the asset API client interface using HTTP
 */

import { Asset, CreateAssetInput, UpdateAssetInput } from '../../models/asset';
import { ListOptions, ListResponse } from '../../models/common';
import {
  validateCreateAssetInput,
  validateUpdateAssetInput,
} from '../../models/validators/asset-validator';
import { HttpClient } from '../../util/network/http-client';
import { Observability, Span } from '../../util/observability/observability';
import { validate } from '../../util/validation';
import { AssetApiClient } from '../interfaces/asset-api-client';
import { UrlBuilder } from '../url-builder';

/**
 * HTTP implementation of the AssetApiClient interface
 *
 * This class handles HTTP communication with asset endpoints, including
 * URL construction, request formation, response handling, and error management.
 */
export class HttpAssetApiClient implements AssetApiClient {
  private readonly observability: Observability;

  /**
   * Creates a new HttpAssetApiClient
   *
   * @param httpClient - HTTP client for making API requests
   * @param urlBuilder - URL builder for constructing endpoint URLs
   * @param observability - Optional observability provider (if not provided, a new one will be created)
   */
  constructor(
    private readonly httpClient: HttpClient,
    private readonly urlBuilder: UrlBuilder,
    observability?: Observability
  ) {
    // Use provided observability or create a new one
    this.observability =
      observability ||
      new Observability({
        serviceName: 'midaz-asset-api-client',
        enableTracing: process.env.MIDAZ_ENABLE_TRACING
          ? process.env.MIDAZ_ENABLE_TRACING.toLowerCase() === 'true'
          : false,
        enableMetrics: process.env.MIDAZ_ENABLE_METRICS
          ? process.env.MIDAZ_ENABLE_METRICS.toLowerCase() === 'true'
          : false,
      });
  }

  /**
   * Lists assets for a specific organization and ledger
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param options - Optional list options for filtering and pagination
   * @returns Promise resolving to a paginated list of assets
   */
  public async listAssets(
    orgId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<ListResponse<Asset>> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('listAssets');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);

    if (options) {
      span.setAttribute('limit', options.limit || 0);
      span.setAttribute('offset', options.offset || 0);
      if (options.filter) {
        span.setAttribute('hasFilters', true);
      }
    }

    try {
      // Validate required parameters
      this.validateRequiredParams(span, { orgId, ledgerId });

      // Build the URL and make the request
      const url = this.urlBuilder.buildAssetUrl(orgId, ledgerId);
      const result = await this.httpClient.get<ListResponse<Asset>>(url, {
        params: options,
      });

      // Record metrics
      this.recordMetrics('assets.list.count', result.items.length, {
        orgId,
        ledgerId,
      });

      span.setStatus('ok');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      span.recordException(error);
      span.setStatus('error', errorMessage);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Gets an asset by ID
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param id - Asset ID
   * @returns Promise resolving to the asset
   */
  public async getAsset(orgId: string, ledgerId: string, id: string): Promise<Asset> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('getAsset');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('assetId', id);

    try {
      // Validate required parameters
      this.validateRequiredParams(span, { orgId, ledgerId, id });

      // Build the URL and make the request
      const url = this.urlBuilder.buildAssetUrl(orgId, ledgerId, id);
      const result = await this.httpClient.get<Asset>(url);

      // Record metrics
      this.recordMetrics('assets.get', 1, {
        orgId,
        ledgerId,
        assetId: id,
        assetCode: result.code || 'unknown',
      });

      span.setStatus('ok');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      span.recordException(error);
      span.setStatus('error', errorMessage);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Creates a new asset
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param input - Asset creation input
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
      // Validate required parameters
      this.validateRequiredParams(span, { orgId, ledgerId });

      // Validate input
      validate(input, validateCreateAssetInput);

      // Build the URL and make the request
      const url = this.urlBuilder.buildAssetUrl(orgId, ledgerId);
      const result = await this.httpClient.post<Asset>(url, input);

      // Record metrics
      this.recordMetrics('assets.create', 1, {
        orgId,
        ledgerId,
        assetId: result.id,
        assetCode: result.code || 'unknown',
      });

      span.setAttribute('assetId', result.id);
      span.setStatus('ok');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      span.recordException(error);
      span.setStatus('error', errorMessage);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Updates an existing asset
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param id - Asset ID
   * @param input - Asset update input
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

    // Set attributes for the update
    if (input.name) {
      span.setAttribute('updatedName', input.name);
    }
    if (input.metadata) {
      span.setAttribute('updatedMetadata', true);
    }
    if (input.status) {
      span.setAttribute('updatedStatus', input.status);
    }

    try {
      // Validate required parameters
      this.validateRequiredParams(span, { orgId, ledgerId, id });

      // Validate input
      validate(input, validateUpdateAssetInput);

      // Build the URL and make the request
      const url = this.urlBuilder.buildAssetUrl(orgId, ledgerId, id);
      const result = await this.httpClient.patch<Asset>(url, input);

      // Record metrics
      this.recordMetrics('assets.update', 1, {
        orgId,
        ledgerId,
        assetId: id,
        assetCode: result.code || 'unknown',
      });

      span.setStatus('ok');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      span.recordException(error);
      span.setStatus('error', errorMessage);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Deletes an asset
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param id - Asset ID
   * @returns Promise resolving when the asset is deleted
   */
  public async deleteAsset(orgId: string, ledgerId: string, id: string): Promise<void> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('deleteAsset');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('assetId', id);

    try {
      // Validate required parameters
      this.validateRequiredParams(span, { orgId, ledgerId, id });

      // Build the URL and make the request
      const url = this.urlBuilder.buildAssetUrl(orgId, ledgerId, id);
      await this.httpClient.delete(url);

      // Record metrics
      this.recordMetrics('assets.delete', 1, {
        orgId,
        ledgerId,
        assetId: id,
      });

      span.setStatus('ok');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      span.recordException(error);
      span.setStatus('error', errorMessage);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Validates required parameters and throws an error if any are missing
   *
   * @param span - The current tracing span
   * @param params - The parameters to validate
   * @private
   */
  private validateRequiredParams(
    span: Span,
    params: Record<string, string | number | boolean | null | undefined>
  ): void {
    for (const [key, value] of Object.entries(params)) {
      if (!value && value !== 0 && value !== false) {
        // Allow 0 and false as valid values
        const error = new Error(`${key} is required`);
        span.recordException(error);
        throw error;
      }
    }
  }

  /**
   * Records metrics for an operation
   *
   * @param name - Metric name
   * @param value - Metric value
   * @param tags - Metric tags
   * @private
   */
  /**
   * Records metrics for an operation
   *
   * @param name - Metric name
   * @param value - Metric value
   * @param tags - Metric tags with proper typing (string, number, or boolean values)
   * @private
   */
  private recordMetrics(
    name: string,
    value: number,
    tags?: Record<string, string | number | boolean>
  ): void {
    this.observability.recordMetric(name, value, tags || {});
  }
}
