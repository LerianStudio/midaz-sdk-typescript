/**
 * Asset rates service implementation
 */

import { AssetRateApiClient } from '../../api/interfaces/asset-rate-api-client';
import { AssetRate, UpdateAssetRateInput } from '../../models/asset-rate';
import { Observability } from '../../util/observability/observability';
import { AssetRatesService } from '../asset-rates';
import { getEnv } from '../../util/runtime/environment';

/**
 * Implementation of the AssetRatesService interface
 *
 * Handles asset rate-related business logic and delegates API communication
 * to the AssetRateApiClient.
 *
 */
export class AssetRatesServiceImpl implements AssetRatesService {
  /**
   * Observability instance for tracing and metrics
   * @private
   */
  private readonly observability: Observability;

  /**
   * Creates a new AssetRatesServiceImpl
   *
   */
  constructor(
    private readonly assetRateApiClient: AssetRateApiClient,
    observability?: Observability
  ) {
    // Use provided observability or create a new one
    this.observability =
      observability ||
      new Observability({
        serviceName: 'midaz-asset-rates-service',
        enableTracing: getEnv('MIDAZ_ENABLE_TRACING')
          ? getEnv('MIDAZ_ENABLE_TRACING')?.toLowerCase() === 'true'
          : false,
        enableMetrics: getEnv('MIDAZ_ENABLE_METRICS')
          ? getEnv('MIDAZ_ENABLE_METRICS')?.toLowerCase() === 'true'
          : false,
      });
  }

  /**
   * Retrieves the exchange rate between two assets
   *
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
      // Delegate to the API client (validation happens there)
      const result = await this.assetRateApiClient.getAssetRate(
        organizationId,
        ledgerId,
        sourceAssetCode,
        destinationAssetCode
      );

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
   * Retrieves a single asset rate by its external identifier
   *
   * @returns Promise resolving to the asset rate
   */
  public async getAssetRateByExternalId(
    organizationId: string,
    ledgerId: string,
    externalId: string
  ): Promise<AssetRate> {
    const span = this.observability.startSpan('getAssetRateByExternalId');
    span.setAttribute('organizationId', organizationId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('externalId', externalId);

    try {
      const result = await this.assetRateApiClient.getAssetRateByExternalId(
        organizationId,
        ledgerId,
        externalId
      );

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
   * Creates a new asset rate or updates an existing one
   *
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
    span.setAttribute('from', input.from);
    span.setAttribute('to', input.to);
    span.setAttribute('rate', input.rate);

    if (input.scale !== undefined) {
      span.setAttribute('scale', input.scale);
    }
    if (input.ttl !== undefined) {
      span.setAttribute('ttl', input.ttl);
    }

    try {
      // Delegate to the API client (validation happens there)
      const result = await this.assetRateApiClient.createOrUpdateAssetRate(
        organizationId,
        ledgerId,
        input
      );

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
}
