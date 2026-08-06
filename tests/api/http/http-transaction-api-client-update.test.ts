/**
 * @file PATCH .../transactions/{id} on HttpTransactionApiClient
 *
 * Verified live against midaz main @33cb93f: the endpoint takes only
 * `{description?, metadata?}`, answers 200 (not 201), merges metadata into whatever is
 * already stored, and ignores an empty-string description. Any other key is 400/0053
 * and a description over 256 characters is 400/0047.
 */
import { HttpTransactionApiClient } from '../../../src/api/http/http-transaction-api-client';
import { UrlBuilder } from '../../../src/api/url-builder';
import { StatusCode } from '../../../src/models/common';
import { Transaction } from '../../../src/models/transaction';
import { HttpClient } from '../../../src/util/network/http-client';
import { Observability, Span } from '../../../src/util/observability/observability';

describe('HttpTransactionApiClient.updateTransaction', () => {
  const orgId = 'org-123';
  const ledgerId = 'ledger-456';
  const transactionId = 'tx-789';
  const url = `/v1/organizations/${orgId}/ledgers/${ledgerId}/transactions/${transactionId}`;

  const patched: Transaction = {
    id: transactionId,
    amount: '100',
    assetCode: 'BRL',
    status: { code: StatusCode.ACTIVE, timestamp: new Date().toISOString() },
    ledgerId,
    organizationId: orgId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    description: 'patched desc',
    metadata: { n: 7, patched: 'yes', only: 'this' },
  };

  let mockHttpClient: jest.Mocked<HttpClient>;
  let mockUrlBuilder: jest.Mocked<UrlBuilder>;
  let client: HttpTransactionApiClient;

  beforeEach(() => {
    const mockSpan = {
      setAttribute: jest.fn(),
      setStatus: jest.fn(),
      recordException: jest.fn(),
      end: jest.fn(),
    } as unknown as jest.Mocked<Span>;

    const mockObservability = {
      startSpan: jest.fn().mockReturnValue(mockSpan),
      recordMetric: jest.fn(),
    } as unknown as jest.Mocked<Observability>;

    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn().mockResolvedValue(patched),
      delete: jest.fn(),
    } as unknown as jest.Mocked<HttpClient>;

    mockUrlBuilder = {
      buildTransactionUrl: jest
        .fn()
        .mockImplementation((org: string, ledger: string, txId?: string) =>
          txId
            ? `/v1/organizations/${org}/ledgers/${ledger}/transactions/${txId}`
            : `/v1/organizations/${org}/ledgers/${ledger}/transactions`
        ),
      getApiVersion: jest.fn().mockReturnValue('v1'),
    } as unknown as jest.Mocked<UrlBuilder>;

    client = new HttpTransactionApiClient(mockHttpClient, mockUrlBuilder, mockObservability);
  });

  /** Returns [url, body] of the single PATCH the client issued. */
  function patchArgs(): [string, any] {
    expect(mockHttpClient.patch).toHaveBeenCalledTimes(1);
    const call = mockHttpClient.patch.mock.calls[0];
    return [call[0], call[1]];
  }

  it('patches the transaction resource path and returns what the ledger answered', async () => {
    const result = await client.updateTransaction(orgId, ledgerId, transactionId, {
      description: 'patched desc',
      metadata: { only: 'this' },
    });

    expect(result).toEqual(patched);
    expect(mockUrlBuilder.buildTransactionUrl).toHaveBeenCalledWith(orgId, ledgerId, transactionId);

    const [patchUrl, body] = patchArgs();
    expect(patchUrl).toBe(url);
    expect(body).toEqual({ description: 'patched desc', metadata: { only: 'this' } });
  });

  it('sends only the keys the caller supplied, so the ledger merge keeps the rest', async () => {
    // The merge is the ledger's: it keeps whatever is already stored and overwrites the
    // keys in the body. Merging client-side would mean reading first and resending keys
    // the caller never touched, which the SDK must never do.
    await client.updateTransaction(orgId, ledgerId, transactionId, {
      metadata: { only: 'this' },
    });

    expect(mockHttpClient.get).not.toHaveBeenCalled();
    const [, body] = patchArgs();
    expect(body).toEqual({ metadata: { only: 'this' } });
    expect(Object.keys(body.metadata)).toEqual(['only']);
    expect(body).not.toHaveProperty('description');
  });

  it('forwards a null metadata value, which is how the ledger deletes a key', async () => {
    await client.updateTransaction(orgId, ledgerId, transactionId, {
      metadata: { drop: null } as unknown as Record<string, unknown>,
    });

    const [, body] = patchArgs();
    expect(body.metadata).toEqual({ drop: null });
    expect('drop' in body.metadata).toBe(true);
  });

  it('sends the body as given without reading the transaction first', async () => {
    await client.updateTransaction(orgId, ledgerId, transactionId, {});

    expect(mockHttpClient.get).not.toHaveBeenCalled();
    const [, body] = patchArgs();
    expect(body).toEqual({});
  });

  it('rejects a key the endpoint refuses with 400/0053 before any request', async () => {
    await expect(
      client.updateTransaction(orgId, ledgerId, transactionId, {
        description: 'd',
        externalId: 'ext-1',
      } as any)
    ).rejects.toThrow(/externalId/);

    expect(mockHttpClient.patch).not.toHaveBeenCalled();
  });

  it('rejects a 257-character description before any request', async () => {
    await expect(
      client.updateTransaction(orgId, ledgerId, transactionId, { description: 'x'.repeat(257) })
    ).rejects.toThrow(/256/);

    expect(mockHttpClient.patch).not.toHaveBeenCalled();
  });

  it('rejects a missing transaction id before any request', async () => {
    await expect(client.updateTransaction(orgId, ledgerId, '', {})).rejects.toThrow(
      'transactionId is required'
    );

    expect(mockHttpClient.patch).not.toHaveBeenCalled();
  });
});
