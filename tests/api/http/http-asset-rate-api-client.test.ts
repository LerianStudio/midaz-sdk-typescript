/**
 * Tests for HttpAssetRateApiClient
 */

import { AssetRate, UpdateAssetRateInput } from '../../../src/models/asset-rate';
import { validateUpdateAssetRateInput } from '../../../src/models/validators/asset-rate-validator';
import { HttpClient } from '../../../src/util/network/http-client';
import { Observability, Span } from '../../../src/util/observability/observability';
import { HttpAssetRateApiClient } from '../../../src/api/http/http-asset-rate-api-client';
import { UrlBuilder } from '../../../src/api/url-builder';
import { ErrorCategory, ErrorCode, MidazError } from '../../../src/util/error';
import { ValidationError } from '../../../src/util/validation';

jest.mock('../../../src/models/validators/asset-rate-validator');

describe('HttpAssetRateApiClient', () => {
  const orgId = 'org-123';
  const ledgerId = 'ledger-456';
  const sourceAssetCode = 'BRL';
  const destinationAssetCode = 'USD';
  const externalId = '019fd4f3-d4f5-70a6-93c2-2eb39c9fe00f';
  const collectionUrl = `https://api.example.com/v1/organizations/${orgId}/ledgers/${ledgerId}/asset-rates`;
  const fromUrl = `${collectionUrl}/from/${sourceAssetCode}`;
  const externalIdUrl = `${collectionUrl}/${externalId}`;

  const mockAssetRate: AssetRate = {
    id: '019fd4f3-d4f5-715c-9f62-dae7d93b6e7c',
    organizationId: orgId,
    ledgerId,
    externalId,
    from: sourceAssetCode,
    to: destinationAssetCode,
    rate: 520,
    scale: 2,
    source: 'smoke-sdk',
    ttl: 3600,
    createdAt: '2026-08-06T02:42:57.397043Z',
    updatedAt: '2026-08-06T03:17:14.299662Z',
    metadata: {},
  };

  let mockHttpClient: jest.Mocked<HttpClient>;
  let mockUrlBuilder: jest.Mocked<UrlBuilder>;
  let mockObservability: jest.Mocked<Observability>;
  let mockSpan: jest.Mocked<Span>;

  let client: HttpAssetRateApiClient;

  beforeEach(() => {
    mockSpan = {
      setAttribute: jest.fn(),
      setStatus: jest.fn(),
      recordException: jest.fn(),
      end: jest.fn(),
    } as unknown as jest.Mocked<Span>;

    mockObservability = {
      startSpan: jest.fn().mockReturnValue(mockSpan),
      recordMetric: jest.fn(),
    } as unknown as jest.Mocked<Observability>;

    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<HttpClient>;

    mockUrlBuilder = {
      getApiVersion: jest.fn().mockReturnValue('v1'),
      getBaseUrl: jest.fn().mockReturnValue('https://api.example.com'),
      buildAssetRateUrl: jest.fn().mockReturnValue(collectionUrl),
      buildAssetRateFromUrl: jest.fn().mockReturnValue(fromUrl),
      buildAssetRateByExternalIdUrl: jest.fn().mockReturnValue(externalIdUrl),
    } as unknown as jest.Mocked<UrlBuilder>;

    jest.clearAllMocks();

    client = new HttpAssetRateApiClient(mockHttpClient, mockUrlBuilder, mockObservability);

    (validateUpdateAssetRateInput as jest.Mock).mockReturnValue({ valid: true, message: '' });
  });

  describe('getAssetRate', () => {
    it('reads the versioned from-asset path and matches on the response to field', async () => {
      mockHttpClient.get.mockResolvedValueOnce({ items: [mockAssetRate], limit: 10 });

      const result = await client.getAssetRate(
        orgId,
        ledgerId,
        sourceAssetCode,
        destinationAssetCode
      );

      expect(result).toEqual(mockAssetRate);
      expect(mockUrlBuilder.buildAssetRateFromUrl).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        sourceAssetCode
      );
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        fromUrl,
        expect.objectContaining({ params: { limit: 100 } })
      );
      expect(mockUrlBuilder.getBaseUrl).not.toHaveBeenCalled();
    });

    it('returns a synthetic integer rate of 1 with scale 0 for the same asset', async () => {
      const result = await client.getAssetRate(orgId, ledgerId, sourceAssetCode, sourceAssetCode);

      expect(result.rate).toBe(1);
      expect(result.scale).toBe(0);
      expect(result.from).toBe(sourceAssetCode);
      expect(result.to).toBe(sourceAssetCode);
      expect(mockHttpClient.get).not.toHaveBeenCalled();
      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'assetRate.get.sameAsset',
        1,
        expect.objectContaining({ organizationId: orgId, ledgerId })
      );
    });

    it('throws not found when no item carries the destination asset', async () => {
      mockHttpClient.get.mockResolvedValueOnce({
        items: [{ ...mockAssetRate, to: 'JPY' }],
        limit: 10,
      });

      await expect(
        client.getAssetRate(orgId, ledgerId, sourceAssetCode, destinationAssetCode)
      ).rejects.toThrow(`assetRate '${sourceAssetCode}-${destinationAssetCode}' not found`);
    });

    it('throws not found when the ledger returns an empty page', async () => {
      mockHttpClient.get.mockResolvedValueOnce({ items: [], limit: 10 });

      await expect(
        client.getAssetRate(orgId, ledgerId, sourceAssetCode, destinationAssetCode)
      ).rejects.toThrow(`assetRate '${sourceAssetCode}-${destinationAssetCode}' not found`);
    });

    it.each([
      ['organizationId', ['', ledgerId, sourceAssetCode, destinationAssetCode]],
      ['ledgerId', [orgId, '', sourceAssetCode, destinationAssetCode]],
      ['sourceAssetCode', [orgId, ledgerId, '', destinationAssetCode]],
      ['destinationAssetCode', [orgId, ledgerId, sourceAssetCode, '']],
    ])('rejects a missing %s', async (field, args) => {
      const [org, ledger, from, to] = args as string[];

      await expect(client.getAssetRate(org, ledger, from, to)).rejects.toThrow(
        `${field} is required`
      );
    });

    it('propagates a MidazError from the transport untouched', async () => {
      const midazError = new MidazError({
        category: ErrorCategory.NOT_FOUND,
        code: ErrorCode.NOT_FOUND,
        message: 'Asset not found',
        statusCode: 404,
      });
      mockHttpClient.get.mockRejectedValueOnce(midazError);

      await expect(
        client.getAssetRate(orgId, ledgerId, sourceAssetCode, destinationAssetCode)
      ).rejects.toBe(midazError);
    });
  });

  describe('getAssetRateByExternalId', () => {
    it('reads the versioned external-id path', async () => {
      mockHttpClient.get.mockResolvedValueOnce(mockAssetRate);

      const result = await client.getAssetRateByExternalId(orgId, ledgerId, externalId);

      expect(result).toEqual(mockAssetRate);
      expect(mockUrlBuilder.buildAssetRateByExternalIdUrl).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        externalId
      );
      expect(mockHttpClient.get).toHaveBeenCalledWith(externalIdUrl, expect.anything());
    });

    it('rejects a missing externalId', async () => {
      await expect(client.getAssetRateByExternalId(orgId, ledgerId, '')).rejects.toThrow(
        'externalId is required'
      );
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('createOrUpdateAssetRate', () => {
    const updateInput: UpdateAssetRateInput = {
      from: sourceAssetCode,
      to: destinationAssetCode,
      rate: 520,
      scale: 2,
      ttl: 3600,
      source: 'smoke-sdk',
    };

    it('PUTs the ledger contract body to the versioned collection path', async () => {
      mockHttpClient.put.mockResolvedValueOnce(mockAssetRate);

      const result = await client.createOrUpdateAssetRate(orgId, ledgerId, updateInput);

      expect(result).toEqual(mockAssetRate);
      expect(mockUrlBuilder.buildAssetRateUrl).toHaveBeenCalledWith(orgId, ledgerId);
      expect(mockHttpClient.put).toHaveBeenCalledWith(
        collectionUrl,
        {
          from: sourceAssetCode,
          to: destinationAssetCode,
          rate: 520,
          scale: 2,
          ttl: 3600,
          source: 'smoke-sdk',
        },
        expect.anything()
      );
      expect(mockUrlBuilder.getBaseUrl).not.toHaveBeenCalled();
    });

    it('omits optional fields that were not supplied, keeping the mandatory ttl', async () => {
      mockHttpClient.put.mockResolvedValueOnce(mockAssetRate);

      await client.createOrUpdateAssetRate(orgId, ledgerId, {
        from: sourceAssetCode,
        to: destinationAssetCode,
        rate: 520,
      });

      const body = mockHttpClient.put.mock.calls[0][1] as Record<string, unknown>;
      expect(Object.keys(body).sort()).toEqual(['from', 'rate', 'to', 'ttl']);
      expect(body.ttl).toBe(0);
    });

    it('forwards externalId and metadata when supplied', async () => {
      mockHttpClient.put.mockResolvedValueOnce(mockAssetRate);

      await client.createOrUpdateAssetRate(orgId, ledgerId, {
        ...updateInput,
        externalId,
        metadata: { provider: 'Central Bank' },
      });

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        collectionUrl,
        expect.objectContaining({ externalId, metadata: { provider: 'Central Bank' } }),
        expect.anything()
      );
    });

    it('does not call the transport when validation fails', async () => {
      (validateUpdateAssetRateInput as jest.Mock).mockReturnValueOnce({
        valid: false,
        message: 'rate must be an integer',
      });

      await expect(client.createOrUpdateAssetRate(orgId, ledgerId, updateInput)).rejects.toThrow(
        ValidationError
      );
      expect(mockHttpClient.put).not.toHaveBeenCalled();
    });

    it.each([
      ['organizationId', ['', ledgerId]],
      ['ledgerId', [orgId, '']],
    ])('rejects a missing %s', async (field, args) => {
      const [org, ledger] = args as string[];

      await expect(client.createOrUpdateAssetRate(org, ledger, updateInput)).rejects.toThrow(
        `${field} is required`
      );
      expect(mockHttpClient.put).not.toHaveBeenCalled();
    });

    it('records the rate value metric', async () => {
      mockHttpClient.put.mockResolvedValueOnce(mockAssetRate);

      await client.createOrUpdateAssetRate(orgId, ledgerId, updateInput);

      expect(mockObservability.recordMetric).toHaveBeenCalledWith(
        'assetRate.value',
        520,
        expect.objectContaining({ organizationId: orgId, ledgerId, from: 'BRL', to: 'USD' })
      );
    });
  });
});
