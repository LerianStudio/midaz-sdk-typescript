/**
 */

import { ListResponse } from '../../models/common';
import { AssetRate, UpdateAssetRateInput } from '../../models/asset-rate';
import { validateUpdateAssetRateInput } from '../../models/validators/asset-rate-validator';
import { newNotFoundError } from '../../util/error';
import { HttpClient } from '../../util/network/http-client';
import { Observability } from '../../util/observability/observability';
import { validate } from '../../util/validation';
import { AssetRateApiClient } from '../interfaces/asset-rate-api-client';
import { UrlBuilder } from '../url-builder';

import { HttpBaseApiClient } from './http-base-api-client';

const ASSET_RATE_PAGE_LIMIT = 100;

/**
 * HTTP implementation of the AssetRateApiClient interface
 *
 * This class handles HTTP communication with asset rate endpoints, including
 * URL construction, request formation, response handling, and error management.
 */
export class HttpAssetRateApiClient
  extends HttpBaseApiClient<AssetRate, UpdateAssetRateInput, UpdateAssetRateInput>
  implements AssetRateApiClient
{
  /**
   * Creates a new HttpAssetRateApiClient
   *
   */
  constructor(httpClient: HttpClient, urlBuilder: UrlBuilder, observability?: Observability) {
    super(httpClient, urlBuilder, 'midaz-asset-rate-api-client', observability);
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
    const attributes = {
      organizationId,
      ledgerId,
      sourceAssetCode,
      destinationAssetCode,
    };

    this.validateParamsInSpan(attributes, attributes);

    if (sourceAssetCode === destinationAssetCode) {
      this.recordMetrics('assetRate.get.sameAsset', 1, attributes);
      return this.buildSameAssetRate(organizationId, ledgerId, sourceAssetCode);
    }

    const url = this.urlBuilder.buildAssetRateFromUrl(organizationId, ledgerId, sourceAssetCode);

    let cursor: string | undefined;
    let rate: AssetRate | undefined;

    do {
      const params: Record<string, unknown> = { limit: ASSET_RATE_PAGE_LIMIT };
      if (cursor) {
        params.cursor = cursor;
      }

      const response = await this.getRequest<ListResponse<AssetRate>>(
        'getAssetRate',
        url,
        { params },
        attributes
      );

      rate = response.items?.find((item) => item.to === destinationAssetCode);

      const nextCursor = this.readNextCursor(response);
      cursor = nextCursor && nextCursor !== cursor ? nextCursor : undefined;
    } while (!rate && cursor);

    if (!rate) {
      throw newNotFoundError('assetRate', `${sourceAssetCode}-${destinationAssetCode}`, {
        operation: 'getAssetRate',
      });
    }

    this.recordMetrics('assetRate.value', rate.rate, attributes);

    return rate;
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
    const attributes = { organizationId, ledgerId, externalId };

    this.validateParamsInSpan(attributes, attributes);

    const url = this.urlBuilder.buildAssetRateByExternalIdUrl(organizationId, ledgerId, externalId);

    return this.getRequest<AssetRate>('getAssetRateByExternalId', url, undefined, attributes);
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
    const attributes = {
      organizationId,
      ledgerId,
      from: input?.from,
      to: input?.to,
    };

    this.validateParamsInSpan({ organizationId, ledgerId }, attributes);

    validate(input, validateUpdateAssetRateInput);

    const url = this.urlBuilder.buildAssetRateUrl(organizationId, ledgerId);

    const result = await this.putRequest<AssetRate>(
      'createOrUpdateAssetRate',
      url,
      this.toRequestBody(input),
      undefined,
      attributes
    );

    this.recordMetrics('assetRate.value', input.rate, attributes);

    return result;
  }

  /**
   * Reads the cursor of the next page from the ledger's list envelope
   *
   */
  private readNextCursor(response: ListResponse<AssetRate>): string | undefined {
    const nextCursor = response.next_cursor ?? response.meta?.nextCursor;

    return typeof nextCursor === 'string' && nextCursor.length > 0 ? nextCursor : undefined;
  }

  /**
   * Strips undefined optional fields so the ledger never receives explicit nulls
   *
   */
  private toRequestBody(input: UpdateAssetRateInput): Record<string, unknown> {
    const body: Record<string, unknown> = {
      from: input.from,
      to: input.to,
      rate: input.rate,
      // midaz main dereferences ttl unconditionally, so omitting it answers HTTP 500
      ttl: input.ttl ?? 0,
    };

    if (input.scale !== undefined) {
      body.scale = input.scale;
    }
    if (input.source !== undefined) {
      body.source = input.source;
    }
    if (input.externalId !== undefined) {
      body.externalId = input.externalId;
    }
    if (input.metadata !== undefined) {
      body.metadata = input.metadata;
    }

    return body;
  }

  /**
   * Builds the synthetic identity rate returned when source and destination match
   *
   */
  private buildSameAssetRate(
    organizationId: string,
    ledgerId: string,
    assetCode: string
  ): AssetRate {
    const now = new Date().toISOString();
    const identifier = `rate_${assetCode}_${assetCode}`;

    return {
      id: identifier,
      organizationId,
      ledgerId,
      externalId: identifier,
      from: assetCode,
      to: assetCode,
      rate: 1,
      scale: 0,
      source: null,
      ttl: 0,
      createdAt: now,
      updatedAt: now,
      metadata: {},
    };
  }
}
