/**
 * @file HTTP implementation of asset rate API client
 * @description Implements the asset rate API client interface using HTTP
 */

import { AssetRate, UpdateAssetRateInput } from '../../models/asset-rate';
import { validateUpdateAssetRateInput } from '../../models/validators/asset-rate-validator';
import { 
  ErrorCategory, 
  ErrorCode, 
  MidazError, 
  newNetworkError, 
  newNotFoundError
} from '../../util/error';
import { HttpClient } from '../../util/network/http-client';
import { Observability, Span } from '../../util/observability/observability';
import { ValidationError } from '../../util/validation';
import { AssetRateApiClient } from '../interfaces/asset-rate-api-client';
import { UrlBuilder } from '../url-builder';

/**
 * HTTP implementation of the AssetRateApiClient interface
 *
 * This class handles HTTP communication with asset rate endpoints, including
 * URL construction, request formation, response handling, and error management.
 */
export class HttpAssetRateApiClient implements AssetRateApiClient {
  private readonly observability: Observability;

  /**
   * Creates a new HttpAssetRateApiClient
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
        serviceName: 'midaz-asset-rate-api-client',
        enableTracing: process.env.MIDAZ_ENABLE_TRACING
          ? process.env.MIDAZ_ENABLE_TRACING.toLowerCase() === 'true'
          : false,
        enableMetrics: process.env.MIDAZ_ENABLE_METRICS
          ? process.env.MIDAZ_ENABLE_METRICS.toLowerCase() === 'true'
          : false,
      });
  }

  /**
   * Retrieves the exchange rate between two assets
   *
   * @param organizationId - Organization ID
   * @param ledgerId - Ledger ID
   * @param sourceAssetCode - Source asset code
   * @param destinationAssetCode - Destination asset code
   * @returns Promise resolving to the asset rate
   */
  public async getAssetRate(
    organizationId: string,
    ledgerId: string,
    sourceAssetCode: string,
    destinationAssetCode: string
  ): Promise<AssetRate> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('getAssetRate');
    span.setAttribute('organizationId', organizationId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('sourceAssetCode', sourceAssetCode);
    span.setAttribute('destinationAssetCode', destinationAssetCode);

    try {
      // Validate required parameters
      this.validateRequiredParams(span, {
        organizationId,
        ledgerId,
        sourceAssetCode,
        destinationAssetCode,
      });

      // If source and destination are the same, return a rate of 1.0
      if (sourceAssetCode === destinationAssetCode) {
        const sameAssetRate: AssetRate = {
          id: `rate_${sourceAssetCode}_${destinationAssetCode}`,
          fromAsset: sourceAssetCode,
          toAsset: destinationAssetCode,
          rate: 1.0,
          effectiveAt: new Date().toISOString(),
          expirationAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Record metrics for same-asset rate
        this.recordMetrics('assetRate.get.sameAsset', 1, {
          organizationId,
          ledgerId,
          sourceAssetCode,
          destinationAssetCode,
        });

        span.setStatus('ok');
        return sameAssetRate;
      }

      try {
        // Build the URL and make the request
        const url = this.buildAssetRateUrl(organizationId, ledgerId, sourceAssetCode);
        const response = await this.httpClient.get<AssetRate[]>(url);

        // Find the rate for the destination asset
        const rate = response.find((r) => r.toAsset === destinationAssetCode);

        if (!rate) {
          const error = newNotFoundError(
            'assetRate',
            `${sourceAssetCode}-${destinationAssetCode}`,
            { operation: 'getAssetRate' }
          );
          span.recordException(error);
          span.setStatus('error', error.message);
          throw error;
        }

        // Record metrics for successful rate retrieval
        this.recordMetrics('assetRate.get.success', 1, {
          organizationId,
          ledgerId,
          sourceAssetCode,
          destinationAssetCode,
        });

        // Record the actual rate value for monitoring
        this.recordMetrics('assetRate.value', rate.rate, {
          organizationId,
          ledgerId,
          sourceAssetCode,
          destinationAssetCode,
        });

        span.setStatus('ok');
        return rate;
      } catch (error) {
        if (error instanceof MidazError) {
          span.recordException(error);
          span.setStatus('error', error.message);
          throw error;
        }

        const networkError = newNetworkError(
          `Failed to get asset rate for ${sourceAssetCode}-${destinationAssetCode}`,
          {
            operation: 'getAssetRate',
            cause: error instanceof Error ? error : new Error(String(error)),
          }
        );
        span.recordException(networkError);
        span.setStatus('error', networkError.message);
        throw networkError;
      }
    } catch (error) {
      if (!(error instanceof MidazError)) {
        const wrappedError = new MidazError({
          category: ErrorCategory.INTERNAL,
          code: ErrorCode.INTERNAL_ERROR,
          message: `Unexpected error: ${(error as Error).message}`,
          operation: 'getAssetRate',
        });
        span.recordException(wrappedError);
        span.setStatus('error', wrappedError.message);
        throw wrappedError;
      }

      span.recordException(error);
      span.setStatus('error', error.message);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Creates a new asset rate or updates an existing one
   *
   * @param organizationId - Organization ID
   * @param ledgerId - Ledger ID
   * @param input - Asset rate input with all required fields
   * @returns Promise resolving to the created or updated asset rate
   */
  public async createOrUpdateAssetRate(
    organizationId: string,
    ledgerId: string,
    input: UpdateAssetRateInput
  ): Promise<AssetRate> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('createOrUpdateAssetRate');
    span.setAttribute('organizationId', organizationId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('fromAsset', input.fromAsset);
    span.setAttribute('toAsset', input.toAsset);
    span.setAttribute('rate', input.rate);

    if (input.effectiveAt) {
      span.setAttribute('effectiveAt', input.effectiveAt);
    }
    if (input.expirationAt) {
      span.setAttribute('expirationAt', input.expirationAt);
    }

    try {
      // Validate required parameters
      this.validateRequiredParams(span, { organizationId, ledgerId });

      // Validate input
      try {
        validateUpdateAssetRateInput(input);
      } catch (error) {
        if (error instanceof ValidationError) {
          span.recordException(error);
          span.setStatus('error', error.message);
          throw error;
        }
        throw error;
      }

      try {
        // Build the URL and make the request
        const url = this.buildAssetRateUrl(organizationId, ledgerId, input.fromAsset);
        const response = await this.httpClient.put<AssetRate>(url, {
          toAsset: input.toAsset,
          rate: input.rate,
          effectiveAt: input.effectiveAt,
          expirationAt: input.expirationAt,
        });

        // Record metrics for successful rate creation/update
        this.recordMetrics('assetRate.createOrUpdate.success', 1, {
          organizationId,
          ledgerId,
          fromAsset: input.fromAsset,
          toAsset: input.toAsset,
        });

        // Record the actual rate value for monitoring
        this.recordMetrics('assetRate.value', input.rate, {
          organizationId,
          ledgerId,
          fromAsset: input.fromAsset,
          toAsset: input.toAsset,
        });

        span.setStatus('ok');
        return response;
      } catch (error) {
        if (error instanceof MidazError) {
          span.recordException(error);
          span.setStatus('error', error.message);
          throw error;
        }

        const networkError = newNetworkError(`Failed to create or update asset rate`, {
          operation: 'createOrUpdateAssetRate',
          cause: error instanceof Error ? error : new Error(String(error)),
        });
        span.recordException(networkError);
        span.setStatus('error', networkError.message);
        throw networkError;
      }
    } catch (error) {
      if (!(error instanceof MidazError) && !(error instanceof ValidationError)) {
        const wrappedError = new MidazError({
          category: ErrorCategory.INTERNAL,
          code: ErrorCode.INTERNAL_ERROR,
          message: `Unexpected error: ${(error as Error).message}`,
          operation: 'createOrUpdateAssetRate',
        });
        span.recordException(wrappedError);
        span.setStatus('error', wrappedError.message);
        throw wrappedError;
      }

      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Builds the URL for asset rate API calls
   *
   * @param organizationId - Organization ID
   * @param ledgerId - Ledger ID
   * @param sourceAssetCode - Source asset code
   * @returns Full URL for the asset rate API endpoint
   * @private
   */
  private buildAssetRateUrl(
    organizationId: string,
    ledgerId: string,
    sourceAssetCode: string
  ): string {
    // Use the transaction URL for asset rates
    const baseUrl = this.urlBuilder.getBaseUrl('transaction');
    return `${baseUrl}/organizations/${organizationId}/ledgers/${ledgerId}/assets/${sourceAssetCode}/rates`;
  }

  /**
   * Validates required parameters and throws an error if any are missing
   *
   * @param span - The current tracing span
   * @param params - The parameters to validate
   * @private
   */
  private validateRequiredParams(span: Span, params: Record<string, any>): void {
    for (const [key, value] of Object.entries(params)) {
      if (!value) {
        const error = new ValidationError(`${key} is required`);
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
  private recordMetrics(name: string, value: number, tags: Record<string, any>): void {
    this.observability.recordMetric(name, value, tags);
  }
}
