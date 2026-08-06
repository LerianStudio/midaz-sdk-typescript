/**
 * @file Single-sided flows of HttpTransactionApiClient: inflow and outflow
 *
 * Verified against midaz main @33cb93f: `/transactions/inflow` synthesizes the debit
 * from `@external/{asset}` and forbids `source`; `/transactions/outflow` synthesizes
 * the credit to `@external/{asset}` and forbids `distribute`. Both take the
 * create-family headers `X-Idempotency` and `X-TTL`.
 */
import { HttpTransactionApiClient } from '../../../src/api/http/http-transaction-api-client';
import { UrlBuilder } from '../../../src/api/url-builder';
import { StatusCode } from '../../../src/models/common';
import {
  CreateInflowInput,
  CreateOutflowInput,
  Transaction,
} from '../../../src/models/transaction';
import { HttpClient } from '../../../src/util/network/http-client';
import { Observability, Span } from '../../../src/util/observability/observability';

describe('HttpTransactionApiClient single-sided flows', () => {
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

  const inflow: CreateInflowInput = {
    chartOfAccountsGroupName: 'FUNDING',
    description: 'Deposit',
    send: {
      asset: 'BRL',
      value: '100',
      distribute: { to: [{ account: 'acc-a', amount: { asset: 'BRL', value: '100' } }] },
    },
  };

  const outflow: CreateOutflowInput = {
    chartOfAccountsGroupName: 'WITHDRAWAL',
    description: 'Withdrawal',
    send: {
      asset: 'BRL',
      value: '40',
      source: { from: [{ account: 'acc-a', amount: { asset: 'BRL', value: '40' } }] },
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

  describe('createInflow', () => {
    it('posts the inflow body to the inflow sub-path', async () => {
      const result = await client.createInflow(orgId, ledgerId, inflow);

      expect(result).toEqual(mockTransaction);
      expect(mockUrlBuilder.buildTransactionUrl).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        undefined,
        'inflow'
      );

      const [url, body] = postArgs();
      expect(url).toBe(`/v1/organizations/${orgId}/ledgers/${ledgerId}/transactions/inflow`);
      expect(body).toEqual({
        chartOfAccountsGroupName: 'FUNDING',
        description: 'Deposit',
        send: {
          asset: 'BRL',
          value: '100',
          distribute: { to: [{ accountAlias: 'acc-a', amount: { asset: 'BRL', value: '100' } }] },
        },
      });
    });

    it('rejects a source before reaching the transport', async () => {
      const forbidden = {
        ...inflow,
        send: { ...inflow.send, source: { from: [] } },
      } as unknown as CreateInflowInput;

      await expect(client.createInflow(orgId, ledgerId, forbidden)).rejects.toThrow('send.source');
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('rejects pending before reaching the transport', async () => {
      const forbidden = { ...inflow, pending: true } as unknown as CreateInflowInput;

      await expect(client.createInflow(orgId, ledgerId, forbidden)).rejects.toThrow('pending');
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('forwards the idempotency key and its TTL as request options', async () => {
      await client.createInflow(orgId, ledgerId, {
        ...inflow,
        idempotencyKey: 'dep-1',
        idempotencyTtlSeconds: 600,
      });

      const [, body, options] = postArgs();
      expect(options).toEqual(
        expect.objectContaining({ idempotencyKey: 'dep-1', idempotencyTtlSeconds: 600 })
      );
      expect(body).not.toHaveProperty('idempotencyKey');
      expect(body).not.toHaveProperty('idempotencyTtlSeconds');
    });

    it('sends no idempotency options when the caller supplies none', async () => {
      await client.createInflow(orgId, ledgerId, inflow);

      const [, , options] = postArgs();
      expect(options.idempotencyKey).toBeUndefined();
      expect(options.idempotencyTtlSeconds).toBeUndefined();
    });

    it('rejects a missing ledger id before any request', async () => {
      await expect(client.createInflow(orgId, '', inflow)).rejects.toThrow('ledgerId is required');
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });
  });

  describe('createOutflow', () => {
    it('posts the outflow body to the outflow sub-path', async () => {
      const result = await client.createOutflow(orgId, ledgerId, outflow);

      expect(result).toEqual(mockTransaction);
      expect(mockUrlBuilder.buildTransactionUrl).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        undefined,
        'outflow'
      );

      const [url, body] = postArgs();
      expect(url).toBe(`/v1/organizations/${orgId}/ledgers/${ledgerId}/transactions/outflow`);
      expect(body).toEqual({
        chartOfAccountsGroupName: 'WITHDRAWAL',
        description: 'Withdrawal',
        send: {
          asset: 'BRL',
          value: '40',
          source: { from: [{ accountAlias: 'acc-a', amount: { asset: 'BRL', value: '40' } }] },
        },
      });
    });

    it('carries pending through to the body', async () => {
      await client.createOutflow(orgId, ledgerId, { ...outflow, pending: true });

      const [, body] = postArgs();
      expect(body.pending).toBe(true);
    });

    it('rejects a distribute before reaching the transport', async () => {
      const forbidden = {
        ...outflow,
        send: { ...outflow.send, distribute: { to: [] } },
      } as unknown as CreateOutflowInput;

      await expect(client.createOutflow(orgId, ledgerId, forbidden)).rejects.toThrow(
        'send.distribute'
      );
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });
  });
});
