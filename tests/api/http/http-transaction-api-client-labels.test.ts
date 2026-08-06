/**
 * @file Label-only transaction variants: block, unblock and annotation
 *
 * Verified against midaz main @33cb93f on a live ledger: all three take the full
 * transaction body — identical to `/transactions/json` — and differ only in how the
 * ledger labels the result. Block and unblock relabel the persisted operations to
 * `BLOCK`/`UNBLOCK` and force `pending` to false; annotation forces status `NOTED`,
 * writes `amount.value: "0"` operations with `balanceAffected: false`, and flips both
 * operations to `CREDIT` when `pending` is sent.
 */
import { HttpTransactionApiClient } from '../../../src/api/http/http-transaction-api-client';
import { UrlBuilder } from '../../../src/api/url-builder';
import { StatusCode } from '../../../src/models/common';
import {
  BlockFundsInput,
  CreateAnnotationInput,
  Transaction,
  UnblockFundsInput,
} from '../../../src/models/transaction';
import { HttpClient } from '../../../src/util/network/http-client';
import { Observability, Span } from '../../../src/util/observability/observability';

describe('HttpTransactionApiClient label-only variants', () => {
  const orgId = 'org-123';
  const ledgerId = 'ledger-456';

  const mockTransaction: Transaction = {
    id: 'tx-789',
    amount: '100',
    assetCode: 'BRL',
    status: { code: StatusCode.ACTIVE, timestamp: new Date().toISOString() },
    ledgerId,
    organizationId: orgId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const fullInput: BlockFundsInput = {
    chartOfAccountsGroupName: 'BLOCKS',
    description: 'Block 100',
    send: {
      asset: 'BRL',
      value: '100',
      source: { from: [{ account: 'acc-a', amount: { asset: 'BRL', value: '100' } }] },
      distribute: { to: [{ account: 'acc-b', amount: { asset: 'BRL', value: '100' } }] },
    },
  };

  const expectedBody = {
    chartOfAccountsGroupName: 'BLOCKS',
    description: 'Block 100',
    send: {
      asset: 'BRL',
      value: '100',
      source: { from: [{ accountAlias: 'acc-a', amount: { asset: 'BRL', value: '100' } }] },
      distribute: { to: [{ accountAlias: 'acc-b', amount: { asset: 'BRL', value: '100' } }] },
    },
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
      post: jest.fn().mockResolvedValue(mockTransaction),
      patch: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<HttpClient>;

    mockUrlBuilder = {
      buildTransactionUrl: jest
        .fn()
        .mockImplementation(
          (org: string, ledger: string, _txId?: string, variant?: boolean | string) =>
            `/v1/organizations/${org}/ledgers/${ledger}/transactions/${variant === true ? 'json' : variant}`
        ),
      getApiVersion: jest.fn().mockReturnValue('v1'),
    } as unknown as jest.Mocked<UrlBuilder>;

    client = new HttpTransactionApiClient(mockHttpClient, mockUrlBuilder, mockObservability);
  });

  /** Returns [url, body, options] of the single POST the client issued. */
  function postArgs(): [string, any, any] {
    expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
    const call = mockHttpClient.post.mock.calls[0];
    return [call[0], call[1], call[2]];
  }

  describe('blockFunds', () => {
    it('posts the full transaction body to the block sub-path', async () => {
      const result = await client.blockFunds(orgId, ledgerId, fullInput);

      expect(result).toEqual(mockTransaction);
      expect(mockUrlBuilder.buildTransactionUrl).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        undefined,
        'block'
      );

      const [url, body] = postArgs();
      expect(url).toBe(`/v1/organizations/${orgId}/ledgers/${ledgerId}/transactions/block`);
      expect(body).toEqual(expectedBody);
    });

    it('rejects pending before reaching the transport', async () => {
      const forbidden = { ...fullInput, pending: true } as unknown as BlockFundsInput;

      await expect(client.blockFunds(orgId, ledgerId, forbidden)).rejects.toThrow('pending');
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('rejects a body missing the distribute the ledger requires', async () => {
      const incomplete = {
        ...fullInput,
        send: { asset: 'BRL', value: '100', source: fullInput.send!.source },
      } as BlockFundsInput;

      await expect(client.blockFunds(orgId, ledgerId, incomplete)).rejects.toThrow(
        'send.distribute'
      );
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('forwards the idempotency key and its TTL as request options', async () => {
      await client.blockFunds(orgId, ledgerId, {
        ...fullInput,
        idempotencyKey: 'blk-1',
        idempotencyTtlSeconds: 600,
      });

      const [, body, options] = postArgs();
      expect(options).toEqual(
        expect.objectContaining({ idempotencyKey: 'blk-1', idempotencyTtlSeconds: 600 })
      );
      expect(body).not.toHaveProperty('idempotencyKey');
      expect(body).not.toHaveProperty('idempotencyTtlSeconds');
    });
  });

  describe('unblockFunds', () => {
    it('posts the full transaction body to the unblock sub-path', async () => {
      const input = fullInput as UnblockFundsInput;
      const result = await client.unblockFunds(orgId, ledgerId, input);

      expect(result).toEqual(mockTransaction);
      expect(mockUrlBuilder.buildTransactionUrl).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        undefined,
        'unblock'
      );

      const [url, body] = postArgs();
      expect(url).toBe(`/v1/organizations/${orgId}/ledgers/${ledgerId}/transactions/unblock`);
      expect(body).toEqual(expectedBody);
    });

    it('rejects pending before reaching the transport', async () => {
      const forbidden = { ...fullInput, pending: false } as unknown as UnblockFundsInput;

      await expect(client.unblockFunds(orgId, ledgerId, forbidden)).rejects.toThrow('pending');
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });
  });

  describe('createAnnotation', () => {
    it('posts the full transaction body to the annotation sub-path', async () => {
      const input = fullInput as CreateAnnotationInput;
      const result = await client.createAnnotation(orgId, ledgerId, input);

      expect(result).toEqual(mockTransaction);
      expect(mockUrlBuilder.buildTransactionUrl).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        undefined,
        'annotation'
      );

      const [url, body] = postArgs();
      expect(url).toBe(`/v1/organizations/${orgId}/ledgers/${ledgerId}/transactions/annotation`);
      expect(body).toEqual(expectedBody);
    });

    it('rejects pending before reaching the transport', async () => {
      const forbidden = { ...fullInput, pending: true } as unknown as CreateAnnotationInput;

      await expect(client.createAnnotation(orgId, ledgerId, forbidden)).rejects.toThrow('pending');
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('rejects a missing ledger id before any request', async () => {
      await expect(client.createAnnotation(orgId, '', fullInput)).rejects.toThrow(
        'ledgerId is required'
      );
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });
  });
});
