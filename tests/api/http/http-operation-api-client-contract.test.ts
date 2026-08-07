/**
 * Contract tests for HttpOperationApiClient: the transaction-scoped update route
 * ignores the account, and validation spans are always terminated.
 */

import { Operation } from '../../../src/models/transaction';
import { HttpClient } from '../../../src/util/network/http-client';
import { Observability, Span } from '../../../src/util/observability/observability';
import { HttpOperationApiClient } from '../../../src/api/http/http-operation-api-client';
import { UrlBuilder } from '../../../src/api/url-builder';

describe('HttpOperationApiClient contract', () => {
  const orgId = 'org-123';
  const ledgerId = 'ledger-456';
  const accountId = 'acc-789';
  const operationId = 'op-123';
  const transactionId = 'tx-456';

  const accountOperationUrl = `https://api.example.com/v1/organizations/${orgId}/ledgers/${ledgerId}/accounts/${accountId}/operations/${operationId}`;
  const transactionOperationUrl = `https://api.example.com/v1/organizations/${orgId}/ledgers/${ledgerId}/transactions/${transactionId}/operations/${operationId}`;

  const mockOperation: Operation = {
    id: operationId,
    accountId,
    accountAlias: 'Main Account',
    type: 'DEBIT',
    amount: { asset: 'USD', value: '100' },
    description: 'Test operation',
    metadata: {},
  };

  let mockHttpClient: jest.Mocked<HttpClient>;
  let mockUrlBuilder: jest.Mocked<UrlBuilder>;
  let mockObservability: jest.Mocked<Observability>;
  let mockSpan: jest.Mocked<Span>;
  let client: HttpOperationApiClient;

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
      buildAccountOperationUrl: jest.fn().mockReturnValue(accountOperationUrl),
      buildTransactionOperationUrl: jest.fn().mockReturnValue(transactionOperationUrl),
    } as unknown as jest.Mocked<UrlBuilder>;

    client = new HttpOperationApiClient(mockHttpClient, mockUrlBuilder, mockObservability);
  });

  it('takes the transaction the route carries, and no account', async () => {
    mockHttpClient.patch.mockResolvedValueOnce(mockOperation);

    const result = await client.updateOperation(orgId, ledgerId, transactionId, operationId, {
      metadata: { category: 'updated' },
    });

    expect(result).toEqual(mockOperation);
    expect(mockUrlBuilder.buildTransactionOperationUrl).toHaveBeenCalledWith(
      orgId,
      ledgerId,
      transactionId,
      operationId
    );
    expect(mockHttpClient.patch).toHaveBeenCalledWith(
      transactionOperationUrl,
      { metadata: { category: 'updated' } },
      expect.anything()
    );
    expect(mockUrlBuilder.buildAccountOperationUrl).not.toHaveBeenCalled();
    expect(mockHttpClient.patch).not.toHaveBeenCalledWith(
      accountOperationUrl,
      expect.anything(),
      expect.anything()
    );
  });

  it('ends the validation span when a required parameter is missing', async () => {
    await expect(client.getOperation('', ledgerId, accountId, operationId)).rejects.toThrow(
      /orgId is required/
    );

    expect(mockObservability.startSpan).toHaveBeenCalledTimes(1);
    expect(mockSpan.end).toHaveBeenCalledTimes(1);
  });

  it('records the validation failure on the span it ends', async () => {
    await expect(client.getOperation('', ledgerId, accountId, operationId)).rejects.toThrow(
      /orgId is required/
    );

    expect(mockSpan.recordException).toHaveBeenCalledWith(expect.any(Error));
    expect(mockSpan.setStatus).toHaveBeenCalledWith('error', expect.stringMatching(/orgId/));
  });

  it('records no operation for a listing whose items the ledger left out', async () => {
    mockHttpClient.get.mockResolvedValueOnce({ limit: 10 });

    const result = await client.listOperations(orgId, ledgerId, accountId);

    expect(result).toEqual({ limit: 10, items: [] });
    expect(mockObservability.recordMetric).toHaveBeenCalledWith(
      'operations.list.count',
      0,
      expect.anything()
    );
  });

  it('ends the validation span when updateOperation is missing its transaction', async () => {
    await expect(
      client.updateOperation(orgId, ledgerId, undefined as unknown as string, operationId, {})
    ).rejects.toThrow(/transactionId is required/);

    expect(mockSpan.end).toHaveBeenCalledTimes(1);
  });

  describe('listOperations items normalization', () => {
    it.each([
      ['a missing items key', {}],
      ['a null items value', { items: null }],
      ['a non-array items value', { items: 'not-an-array' }],
    ])('hands the caller an array when the ledger sends %s', async (_label, payload) => {
      mockHttpClient.get.mockResolvedValueOnce(payload as never);

      const result = await client.listOperations(orgId, ledgerId, accountId);

      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items).toEqual([]);
    });

    it('preserves the envelope and the operations when items is usable', async () => {
      mockHttpClient.get.mockResolvedValueOnce({
        items: [mockOperation],
        meta: { total: 1 },
      } as never);

      const result = await client.listOperations(orgId, ledgerId, accountId);

      expect(result.items).toEqual([mockOperation]);
      expect((result as unknown as { meta: unknown }).meta).toEqual({ total: 1 });
    });
  });
});
