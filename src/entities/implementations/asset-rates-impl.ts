/**
 * @file Asset rates service implementation for the Midaz SDK
 * @description Implements the AssetRatesService interface for managing asset exchange rates within the Midaz system
 */

import { AssetRateApiClient } from '../../api/interfaces/asset-rate-api-client';
import { AssetRate, UpdateAssetRateInput } from '../../models/asset-rate';
import { Observability } from '../../util/observability/observability';
import { ValidationError } from '../../util/validation';
import { AssetRatesService } from '../asset-rates';

/**
 * Implementation of the AssetRatesService interface.
 *
 * This class provides the concrete implementation of the AssetRatesService interface,
 * handling asset rate-related business logic and delegating API communication to the
 * AssetRateApiClient. It validates inputs and transforms responses as needed.
 *
 * Asset rates represent the exchange rates between different assets within the Midaz system.
 * Each rate defines the conversion factor from one asset to another, which is essential for
 * multi-currency ledgers and cross-asset transactions.
 *
 * @implements {AssetRatesService}
 *
 * @example
 * ```typescript
 * // Creating an instance (typically done by the MidazClient)
 * const assetRateApiClient = apiFactory.createAssetRateApiClient();
 * const assetRatesService = new AssetRatesServiceImpl(assetRateApiClient);
 *
 * // Using the service to get an exchange rate
 * const rate = await assetRatesService.getAssetRate(
 *   "org_123",
 *   "ldg_456",
 *   "USD",
 *   "EUR"
 * );
 * ```
 */
export class AssetRatesServiceImpl implements AssetRatesService {
  /**
   * Observability instance for tracing and metrics
   * @private
   */
  private readonly observability: Observability;

  /**
   * Creates a new AssetRatesServiceImpl.
   *
   * @param assetRateApiClient - Asset rate API client for making API requests
   * @param observability - Optional observability provider (if not provided, a new one will be created)
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
        enableTracing: process.env.MIDAZ_ENABLE_TRACING
          ? process.env.MIDAZ_ENABLE_TRACING.toLowerCase() === 'true'
          : false,
        enableMetrics: process.env.MIDAZ_ENABLE_METRICS
          ? process.env.MIDAZ_ENABLE_METRICS.toLowerCase() === 'true'
          : false,
      });
  }

  /**
   * Retrieves the exchange rate between two assets.
   *
   * Gets the current exchange rate from a source asset to a destination asset.
   * If the source and destination assets are the same, a rate of 1.0 is returned.
   *
   * @param organizationId - The ID of the organization that owns the ledger
   * @param ledgerId - The ID of the ledger that contains the assets
   * @param sourceAssetCode - The code of the source asset (e.g., "USD")
   * @param destinationAssetCode - The code of the destination asset (e.g., "EUR")
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
   * Creates a new asset rate or updates an existing one.
   *
   * Creates a new exchange rate between the specified assets or updates an
   * existing rate if one already exists for the same asset pair. This method
   * allows for setting time-based rates with effective and expiration dates.
   *
   * @param organizationId - The ID of the organization that owns the ledger
   * @param ledgerId - The ID of the ledger that contains the assets
   * @param input - The asset rate details including source asset, destination asset, and rate
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
