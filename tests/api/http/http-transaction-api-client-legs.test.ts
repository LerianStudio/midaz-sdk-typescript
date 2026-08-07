/**
 * @file Leg-level money-safety guards of HttpTransactionApiClient
 *
 * Verified against midaz main @33cb93f: a leg carrying `remaining` is counted by the
 * server's balance check but never becomes an operation, so the funds vanish with a
 * `201 CREATED`; and a leg `amount.asset` that differs from `send.asset` is ignored,
 * the operation being booked in `send.asset` regardless. Both must therefore die
 * before any request leaves the SDK.
 */
import { HttpTransactionApiClient } from '../../../src/api/http/http-transaction-api-client';
import { UrlBuilder } from '../../../src/api/url-builder';
import { StatusCode } from '../../../src/models/common';
import { CreateTransactionInput, Transaction } from '../../../src/models/transaction';
import { HttpClient } from '../../../src/util/network/http-client';
import { Observability, Span } from '../../../src/util/observability/observability';

describe('HttpTransactionApiClient leg guards', () => {
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

  const buildInput = (from: any[], to: any[]): CreateTransactionInput =>
    ({
      chartOfAccountsGroupName: 'group',
      description: 'transfer',
      send: {
        asset: 'BRL',
        value: '100',
        source: { from },
        distribute: { to },
      },
    }) as CreateTransactionInput;

  let mockHttpClient: jest.Mocked<HttpClient>;
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

    const mockUrlBuilder = {
      buildTransactionUrl: jest
        .fn()
        .mockReturnValue(`/v1/organizations/${orgId}/ledgers/${ledgerId}/transactions/json`),
      getApiVersion: jest.fn().mockReturnValue('v1'),
    } as unknown as jest.Mocked<UrlBuilder>;

    client = new HttpTransactionApiClient(mockHttpClient, mockUrlBuilder, mockObservability);
  });

  it('refuses a remaining leg without issuing a request', async () => {
    const input = buildInput(
      [{ account: 'acc-a', amount: { asset: 'BRL', value: '100' } }],
      [
        { account: 'acc-b', amount: { asset: 'BRL', value: '30' } },
        { account: 'acc-c', remaining: 'remaining' },
      ]
    );

    await expect(client.createTransaction(orgId, ledgerId, input)).rejects.toThrow(
      'send.distribute.to[1].remaining'
    );
    expect(mockHttpClient.post).not.toHaveBeenCalled();
  });

  it('refuses a mismatched amount asset without issuing a request', async () => {
    const input = buildInput(
      [{ account: 'acc-a', amount: { asset: 'USD', value: '100' } }],
      [{ account: 'acc-b', amount: { asset: 'BRL', value: '100' } }]
    );

    await expect(client.createTransaction(orgId, ledgerId, input)).rejects.toThrow(
      'send.source.from[0].amount.asset'
    );
    expect(mockHttpClient.post).not.toHaveBeenCalled();
  });

  describe('every endpoint that takes legs', () => {
    const both = (from: any[], to: any[]) => buildInput(from, to);
    const inflow = (to: any[]) =>
      ({ description: 'in', send: { asset: 'BRL', value: '100', distribute: { to } } }) as any;
    const outflow = (from: any[]) =>
      ({ description: 'out', send: { asset: 'BRL', value: '100', source: { from } } }) as any;

    const legal = { account: 'acc-a', amount: { asset: 'BRL', value: '100' } };
    const remaining = { account: 'acc-c', remaining: 'remaining' };
    const foreign = { account: 'acc-d', amount: { asset: 'USD', value: '100' } };

    const cases: Array<[string, any, any]> = [
      ['createTransaction', both([legal], [legal, remaining]), both([foreign], [legal])],
      ['createInflow', inflow([legal, remaining]), inflow([foreign])],
      ['createOutflow', outflow([legal, remaining]), outflow([foreign])],
      ['blockFunds', both([legal], [legal, remaining]), both([foreign], [legal])],
      ['unblockFunds', both([legal], [legal, remaining]), both([foreign], [legal])],
      ['createAnnotation', both([legal], [legal, remaining]), both([foreign], [legal])],
    ];

    it.each(cases)(
      'refuses a remaining leg on %s without issuing a request',
      async (method, withRemaining) => {
        await expect((client as any)[method](orgId, ledgerId, withRemaining)).rejects.toThrow(
          /remaining/
        );
        expect(mockHttpClient.post).not.toHaveBeenCalled();
      }
    );

    it.each(cases)(
      'refuses a mismatched leg asset on %s without issuing a request',
      async (method, _withRemaining, withForeignAsset) => {
        await expect((client as any)[method](orgId, ledgerId, withForeignAsset)).rejects.toThrow(
          /amount\.asset/
        );
        expect(mockHttpClient.post).not.toHaveBeenCalled();
      }
    );
  });

  it('posts a share split and the mirrored asset when the legs are legal', async () => {
    const input = buildInput(
      [{ account: 'acc-a', amount: { value: '100' } }],
      [
        { account: 'acc-b', share: { percentage: 60 } },
        { account: 'acc-c', share: { percentage: 40 } },
      ]
    );

    await client.createTransaction(orgId, ledgerId, input);

    expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
    const body = mockHttpClient.post.mock.calls[0][1] as any;
    expect(body.send.source.from[0].amount).toEqual({ asset: 'BRL', value: '100' });
    expect(body.send.distribute.to.map((leg: any) => leg.share)).toEqual([
      { percentage: 60 },
      { percentage: 40 },
    ]);
  });
});
