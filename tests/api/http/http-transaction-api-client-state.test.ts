/**
 * @file State transitions of HttpTransactionApiClient: commit, cancel, revert
 *
 * All three are body-less POSTs returning 201 with a Transaction. Verified live against
 * midaz main @33cb93f: commit only from PENDING, cancel only from PENDING, revert only
 * from APPROVED, and a second commit on a committed transaction returns 409/0486
 * permanently.
 */
import { HttpTransactionApiClient } from '../../../src/api/http/http-transaction-api-client';
import { UrlBuilder } from '../../../src/api/url-builder';
import { StatusCode } from '../../../src/models/common';
import { Transaction } from '../../../src/models/transaction';
import { ErrorCategory, ErrorCode, MidazError } from '../../../src/util/error/error-types';
import { HttpClient } from '../../../src/util/network/http-client';
import { Observability, Span } from '../../../src/util/observability/observability';

describe('HttpTransactionApiClient state transitions', () => {
  const orgId = 'org-123';
  const ledgerId = 'ledger-456';
  const transactionId = 'tx-789';

  const mockTransaction: Transaction = {
    id: transactionId,
    amount: '100',
    assetCode: 'BRL',
    status: { code: StatusCode.ACTIVE, timestamp: new Date().toISOString() },
    ledgerId,
    organizationId: orgId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
          (org: string, ledger: string, txId?: string, _isCreate?: boolean, action?: string) =>
            `/v1/organizations/${org}/ledgers/${ledger}/transactions/${txId}${action ? `/${action}` : ''}`
        ),
      getApiVersion: jest.fn().mockReturnValue('v1'),
    } as unknown as jest.Mocked<UrlBuilder>;

    client = new HttpTransactionApiClient(mockHttpClient, mockUrlBuilder, mockObservability);
  });

  /** Returns [url, body, options] of the single POST the client issued. */
  function postArgs(): [string, unknown, any] {
    expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
    const call = mockHttpClient.post.mock.calls[0];
    return [call[0], call[1], call[2]];
  }

  describe.each([
    ['commitTransaction', 'commit'],
    ['cancelTransaction', 'cancel'],
    ['revertTransaction', 'revert'],
  ] as const)('%s', (method, action) => {
    it(`posts to the ${action} sub-path with no body`, async () => {
      const result = await (client as any)[method](orgId, ledgerId, transactionId);

      expect(result).toEqual(mockTransaction);
      expect(mockUrlBuilder.buildTransactionUrl).toHaveBeenCalledWith(
        orgId,
        ledgerId,
        transactionId,
        false,
        action
      );

      const [url, body] = postArgs();
      expect(url).toBe(
        `/v1/organizations/${orgId}/ledgers/${ledgerId}/transactions/${transactionId}/${action}`
      );
      expect(body).toBeUndefined();
    });

    it('rejects a missing transaction id before any request', async () => {
      await expect((client as any)[method](orgId, ledgerId, '')).rejects.toThrow(
        'transactionId is required'
      );
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });
  });

  it('never sends an idempotency key on commit, which the server ignores', async () => {
    await client.commitTransaction(orgId, ledgerId, transactionId);

    const [, , options] = postArgs();
    expect(options.idempotencyKey).toBeUndefined();
  });

  it('never sends an idempotency key on cancel, which the server ignores', async () => {
    await client.cancelTransaction(orgId, ledgerId, transactionId);

    const [, , options] = postArgs();
    expect(options.idempotencyKey).toBeUndefined();
  });

  it('forwards the idempotency key on revert, which the server honours', async () => {
    await client.revertTransaction(orgId, ledgerId, transactionId, {
      idempotencyKey: 'estorno-nf123',
    });

    const [, , options] = postArgs();
    expect(options.idempotencyKey).toBe('estorno-nf123');
  });

  describe('the permanent 0486 lock', () => {
    const lockedDetail = 'This transaction is currently being processed by another request.';

    class HttpErrorLike extends Error {
      constructor(
        public readonly status: number,
        public readonly response: unknown
      ) {
        super(`HTTP ${status}: Conflict`);
        this.name = 'HttpError';
      }
    }

    function lockedError(): HttpErrorLike {
      return new HttpErrorLike(409, {
        type: 'https://errors.lerian.studio/v1/0486',
        title: 'Transaction Locked',
        status: 409,
        detail: `${lockedDetail} Please retry shortly.`,
        code: '0486',
      });
    }

    it('issues exactly one request and surfaces the code so callers can branch', async () => {
      mockHttpClient.post.mockRejectedValue(lockedError());

      const error = await client
        .commitTransaction(orgId, ledgerId, transactionId)
        .catch((caught) => caught);

      expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
      expect(error).toBeInstanceOf(MidazError);
      expect(error.midazCode).toBe('0486');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe(ErrorCode.TRANSACTION_LOCKED);
      expect(error.category).toBe(ErrorCategory.CONFLICT);
    });

    it("keeps the server's misleading detail and adds the SDK's terminal note", async () => {
      mockHttpClient.post.mockRejectedValue(lockedError());

      const error = await client
        .cancelTransaction(orgId, ledgerId, transactionId)
        .catch((caught) => caught);

      expect(error.message).toContain('Please retry shortly');
      expect(error.message).toContain('terminal');
      expect(error.resourceId).toBe(transactionId);
    });

    it('reads the code out of a problem document the transport left as a string', async () => {
      // The ledger answers application/problem+json, which the transport does not
      // recognise as JSON, so the body reaches the error unparsed.
      mockHttpClient.post.mockRejectedValue(
        new HttpErrorLike(
          409,
          `${JSON.stringify({ status: 409, detail: `${lockedDetail} Please retry shortly.`, code: '0486' })}\n`
        )
      );

      const error = await client
        .commitTransaction(orgId, ledgerId, transactionId)
        .catch((caught) => caught);

      expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
      expect(error).toBeInstanceOf(MidazError);
      expect(error.midazCode).toBe('0486');
      expect(error.message).toContain('Please retry shortly');
      expect(error.message).toContain('terminal');
    });

    it('leaves an illegal-transition 0099 conflict untouched', async () => {
      const conflict = new HttpErrorLike(409, {
        title: 'Invalid Transaction Status',
        status: 409,
        detail: 'The transaction status does not allow the requested action.',
        code: '0099',
      });
      mockHttpClient.post.mockRejectedValue(conflict);

      const error = await client
        .commitTransaction(orgId, ledgerId, transactionId)
        .catch((caught) => caught);

      expect(error).toBe(conflict);
    });
  });
});
