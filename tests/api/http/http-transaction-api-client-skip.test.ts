/**
 * @file The ledger's `422/0490` when a per-call skip is not permitted
 *
 * Verified live against midaz main @33cb93f: `skip:{fees:true}` on a ledger whose
 * `overrides.allowFeeSkip` is false answers `422/0490`, and the same request against a
 * ledger with the override on answers `201` with `feesSkipped:true`. The SDK cannot
 * know the ledger's settings, so it does not pre-validate the flag; it names the
 * override the caller has to enable when the rejection comes back.
 */
import { HttpTransactionApiClient } from '../../../src/api/http/http-transaction-api-client';
import { UrlBuilder } from '../../../src/api/url-builder';
import { StatusCode } from '../../../src/models/common';
import { CreateTransactionInput, Transaction } from '../../../src/models/transaction';
import { ErrorCategory, ErrorCode, MidazError } from '../../../src/util/error/error-types';
import { HttpClient } from '../../../src/util/network/http-client';
import { Observability, Span } from '../../../src/util/observability/observability';

describe('HttpTransactionApiClient skip rejections', () => {
  const orgId = 'org-123';
  const ledgerId = 'ledger-456';

  const input: CreateTransactionInput = {
    chartOfAccountsGroupName: 'GROUP',
    description: 'transfer',
    send: {
      asset: 'BRL',
      value: '100',
      source: { from: [{ account: 'acc-a', amount: { asset: 'BRL', value: '100' } }] },
      distribute: { to: [{ account: 'acc-b', amount: { asset: 'BRL', value: '100' } }] },
    },
  };

  const mockTransaction: Transaction = {
    id: 'tx-1',
    amount: '100',
    assetCode: 'BRL',
    status: { code: StatusCode.ACTIVE, timestamp: new Date().toISOString() },
    ledgerId,
    organizationId: orgId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let mockHttpClient: jest.Mocked<HttpClient>;
  let client: HttpTransactionApiClient;

  class HttpErrorLike extends Error {
    constructor(
      public readonly status: number,
      public readonly response: unknown
    ) {
      super(`HTTP ${status}: Unprocessable Entity`);
      this.name = 'HttpError';
    }
  }

  function skipRejection(which: 'fees' | 'tracer'): HttpErrorLike {
    return new HttpErrorLike(422, {
      title: 'Skip Not Permitted',
      status: 422,
      detail:
        `The ${which} skip requested for this operation is not permitted on this ledger. ` +
        'Enable the matching ledger override to allow it, or remove the skip from your request.',
      code: '0490',
    });
  }

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

  it('sends a skip the SDK cannot evaluate rather than guessing the ledger settings', async () => {
    await client.createTransaction(orgId, ledgerId, { ...input, skip: { fees: true } });

    expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
    expect(mockHttpClient.post.mock.calls[0][1]).toMatchObject({ skip: { fees: true } });
  });

  it('names the ledger override the caller has to enable when fees are refused', async () => {
    mockHttpClient.post.mockRejectedValue(skipRejection('fees'));

    const error = await client
      .createTransaction(orgId, ledgerId, { ...input, skip: { fees: true } })
      .catch((caught) => caught);

    expect(error).toBeInstanceOf(MidazError);
    expect(error.midazCode).toBe('0490');
    expect(error.statusCode).toBe(422);
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.category).toBe(ErrorCategory.VALIDATION);
    expect(error.message).toContain('overrides.allowFeeSkip');
  });

  it('names the tracer override when the tracer skip is refused', async () => {
    mockHttpClient.post.mockRejectedValue(skipRejection('tracer'));

    const error = await client
      .createTransaction(orgId, ledgerId, { ...input, skip: { tracer: true } })
      .catch((caught) => caught);

    expect(error.message).toContain('overrides.allowTracerSkip');
  });

  it('keeps the server detail so the caller sees what midaz said', async () => {
    mockHttpClient.post.mockRejectedValue(skipRejection('fees'));

    const error = await client
      .createTransaction(orgId, ledgerId, { ...input, skip: { fees: true } })
      .catch((caught) => caught);

    expect(error.message).toContain('not permitted on this ledger');
  });

  it('reads the code out of a problem document the transport left as a string', async () => {
    mockHttpClient.post.mockRejectedValue(
      new HttpErrorLike(
        422,
        `${JSON.stringify({ status: 422, detail: 'The fees skip requested for this operation is not permitted on this ledger.', code: '0490' })}\n`
      )
    );

    const error = await client
      .createTransaction(orgId, ledgerId, { ...input, skip: { fees: true } })
      .catch((caught) => caught);

    expect(error).toBeInstanceOf(MidazError);
    expect(error.midazCode).toBe('0490');
    expect(error.message).toContain('overrides.allowFeeSkip');
  });

  it('maps the same rejection on the label endpoints, which take the same body', async () => {
    mockHttpClient.post.mockRejectedValue(skipRejection('fees'));

    const error = await client
      .blockFunds(orgId, ledgerId, { ...input, skip: { fees: true } })
      .catch((caught) => caught);

    expect(error.midazCode).toBe('0490');
    expect(error.message).toContain('overrides.allowFeeSkip');
  });

  it('leaves an unrelated 422 untouched', async () => {
    const other = new HttpErrorLike(422, {
      title: 'Insufficient Funds',
      status: 422,
      detail: 'The account does not have enough funds.',
      code: '0018',
    });
    mockHttpClient.post.mockRejectedValue(other);

    const error = await client.createTransaction(orgId, ledgerId, input).catch((caught) => caught);

    expect(error).toBe(other);
  });
});
