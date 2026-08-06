/**
 * @file Idempotency key plumbing for HttpTransactionApiClient
 *
 * `CreateTransactionInput.idempotencyKey` must reach the transport as a request
 * option (so it becomes the `X-Idempotency` header) and must never leak into the
 * request body — the ledger rejects unknown body fields with a 400.
 */
import { CreateTransactionInput, Transaction } from '../../../src/models/transaction';
import { StatusCode } from '../../../src/models/common';
import { HttpClient } from '../../../src/util/network/http-client';
import { Observability, Span } from '../../../src/util/observability/observability';
import { validate } from '../../../src/util/validation';
import { HttpTransactionApiClient } from '../../../src/api/http/http-transaction-api-client';
import { UrlBuilder } from '../../../src/api/url-builder';

jest.mock('../../../src/models/validators/transaction-validator');
jest.mock('../../../src/util/validation', () => ({
  validate: jest.fn(),
}));

describe('HttpTransactionApiClient idempotency key', () => {
  const orgId = 'org-123';
  const ledgerId = 'ledger-456';

  const mockTransaction: Transaction = {
    id: 'tx-789',
    amount: 100,
    scale: 2,
    assetCode: 'USD',
    status: { code: StatusCode.ACTIVE, timestamp: new Date().toISOString() },
    ledgerId,
    organizationId: orgId,
    operations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const baseInput: CreateTransactionInput = {
    amount: 100,
    scale: 2,
    assetCode: 'USD',
    description: 'Test transaction',
    operations: [
      {
        accountId: 'acc-123',
        type: 'DEBIT' as const,
        amount: { value: 100, assetCode: 'USD', scale: 2 },
      },
    ],
  };

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
      buildTransactionUrl: jest.fn().mockReturnValue('/transactions?flag=true'),
      getApiVersion: jest.fn().mockReturnValue('v1'),
    } as unknown as jest.Mocked<UrlBuilder>;

    (validate as jest.Mock).mockImplementation(() => ({ valid: true }));

    client = new HttpTransactionApiClient(mockHttpClient, mockUrlBuilder, mockObservability);
  });

  /** Returns [body, options] of the single POST the client issued. */
  function postArgs(): [any, any] {
    const call = mockHttpClient.post.mock.calls[0];
    return [call[1], call[2]];
  }

  it('forwards a caller-supplied idempotency key as a request option', async () => {
    await client.createTransaction(orgId, ledgerId, {
      ...baseInput,
      idempotencyKey: 'pgto-nf123',
    });

    const [, options] = postArgs();
    expect(options).toEqual(expect.objectContaining({ idempotencyKey: 'pgto-nf123' }));
  });

  it('keeps the idempotency key out of the request body', async () => {
    await client.createTransaction(orgId, ledgerId, {
      ...baseInput,
      idempotencyKey: 'pgto-nf123',
    });

    const [body] = postArgs();
    expect(body).not.toHaveProperty('idempotencyKey');
  });

  it('sends no idempotency key when the caller supplies none', async () => {
    await client.createTransaction(orgId, ledgerId, baseInput);

    const [body, options] = postArgs();
    expect(body).not.toHaveProperty('idempotencyKey');
    expect(options.idempotencyKey).toBeUndefined();
  });
});
