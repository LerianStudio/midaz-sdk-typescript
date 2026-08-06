/**
 * Contract tests for HttpAssetRateApiClient against midaz main behaviour:
 * cursor pagination, the request-body allowlist and the ledger's mandatory ttl.
 */

import { AssetRate, UpdateAssetRateInput } from '../../../src/models/asset-rate';
import { HttpClient } from '../../../src/util/network/http-client';
import { Observability, Span } from '../../../src/util/observability/observability';
import { HttpAssetRateApiClient } from '../../../src/api/http/http-asset-rate-api-client';
import { UrlBuilder } from '../../../src/api/url-builder';

describe('HttpAssetRateApiClient contract', () => {
  const orgId = 'org-123';
  const ledgerId = 'ledger-456';
  const collectionUrl = `https://api.example.com/v1/organizations/${orgId}/ledgers/${ledgerId}/asset-rates`;
  const fromUrl = `${collectionUrl}/from/BRL`;

  const rate = (to: string): AssetRate => ({
    id: `019fd4f3-d4f5-715c-9f62-dae7d93b6e${to.length}c`,
    organizationId: orgId,
    ledgerId,
    externalId: '019fd4f3-d4f5-70a6-93c2-2eb39c9fe00f',
    from: 'BRL',
    to,
    rate: 520,
    scale: 2,
    source: 'smoke-sdk',
    ttl: 3600,
    createdAt: '2026-08-06T02:42:57.397043Z',
    updatedAt: '2026-08-06T03:17:14.299662Z',
    metadata: {},
  });

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
      buildAssetRateByExternalIdUrl: jest.fn().mockReturnValue(`${collectionUrl}/EXT`),
    } as unknown as jest.Mocked<UrlBuilder>;

    client = new HttpAssetRateApiClient(mockHttpClient, mockUrlBuilder, mockObservability);
  });

  describe('getAssetRate pagination', () => {
    it('follows next_cursor until the destination rate is found', async () => {
      mockHttpClient.get
        .mockResolvedValueOnce({
          items: ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'SEK', 'NOK'].map(rate),
          limit: 100,
          next_cursor: 'cursor-page-2',
        })
        .mockResolvedValueOnce({ items: [rate('MXN'), rate('ZAR')], limit: 100 });

      const result = await client.getAssetRate(orgId, ledgerId, 'BRL', 'ZAR');

      expect(result.to).toBe('ZAR');
      expect(mockHttpClient.get).toHaveBeenCalledTimes(2);
      expect(mockHttpClient.get.mock.calls[1][1]).toEqual(
        expect.objectContaining({
          params: expect.objectContaining({ cursor: 'cursor-page-2' }),
        })
      );
    });

    it('asks for the largest page the ledger allows instead of its default of ten', async () => {
      mockHttpClient.get.mockResolvedValueOnce({ items: [rate('USD')], limit: 100 });

      await client.getAssetRate(orgId, ledgerId, 'BRL', 'USD');

      expect(mockHttpClient.get.mock.calls[0][1]).toEqual(
        expect.objectContaining({ params: expect.objectContaining({ limit: 100 }) })
      );
    });

    it('stops paginating and reports not found when the last page is exhausted', async () => {
      mockHttpClient.get
        .mockResolvedValueOnce({ items: [rate('USD')], limit: 100, next_cursor: 'cursor-page-2' })
        .mockResolvedValueOnce({ items: [rate('EUR')], limit: 100 });

      await expect(client.getAssetRate(orgId, ledgerId, 'BRL', 'ZAR')).rejects.toThrow(/BRL-ZAR/);
      expect(mockHttpClient.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('createOrUpdateAssetRate request body', () => {
    it('sends ttl 0 when the caller omits it', async () => {
      mockHttpClient.put.mockResolvedValueOnce(rate('USD'));

      await client.createOrUpdateAssetRate(orgId, ledgerId, {
        from: 'BRL',
        to: 'USD',
        rate: 520,
        scale: 2,
      });

      expect(mockHttpClient.put.mock.calls[0][1]).toEqual({
        from: 'BRL',
        to: 'USD',
        rate: 520,
        scale: 2,
        ttl: 0,
      });
    });

    it('drops fields the ledger does not accept', async () => {
      mockHttpClient.put.mockResolvedValueOnce(rate('USD'));

      await client.createOrUpdateAssetRate(orgId, ledgerId, {
        from: 'BRL',
        to: 'USD',
        rate: 520,
        effectiveAt: '2026-01-01T00:00:00Z',
      } as unknown as UpdateAssetRateInput);

      expect(mockHttpClient.put.mock.calls[0][1]).not.toHaveProperty('effectiveAt');
    });

    it('rejects a zero or negative rate before reaching the wire', async () => {
      await expect(
        client.createOrUpdateAssetRate(orgId, ledgerId, { from: 'BRL', to: 'USD', rate: 0 })
      ).rejects.toThrow(/rate/);
      await expect(
        client.createOrUpdateAssetRate(orgId, ledgerId, { from: 'BRL', to: 'USD', rate: -520 })
      ).rejects.toThrow(/rate/);

      expect(mockHttpClient.put).not.toHaveBeenCalled();
    });
  });

  describe('parameter validation spans', () => {
    it('ends the validation span when a required parameter is missing', async () => {
      await expect(client.getAssetRate('', ledgerId, 'BRL', 'USD')).rejects.toThrow(
        /organizationId is required/
      );

      expect(mockObservability.startSpan).toHaveBeenCalledTimes(1);
      expect(mockSpan.end).toHaveBeenCalledTimes(1);
    });
  });
});
