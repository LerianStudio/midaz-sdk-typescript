/**
 * The ledger's `0486 Transaction Locked` is permanent: midaz takes a Redis lock in
 * commitOrCancelTransaction, never releases it on the success path, and builds its TTL
 * as time.Duration(300) — 300 nanoseconds. Its detail says "Please retry shortly" and
 * lies. Every case here counts attempts so a retry fails the test.
 */

import { ErrorCategory, ErrorCode, MidazError } from '../../src/util/error/error-types';
import { RetryPolicy } from '../../src/util/network/retry-policy';

class HttpErrorLike extends Error {
  constructor(
    public readonly status: number,
    public readonly response: unknown
  ) {
    super(`HTTP ${status}: Conflict`);
    this.name = 'HttpError';
  }
}

const LOCKED_DETAIL = 'This transaction is currently being processed by another request.';

function lockedProblem(code: string): Record<string, unknown> {
  return {
    type: `https://errors.lerian.studio/v1/${code}`,
    title: 'Transaction Locked',
    status: 409,
    detail: LOCKED_DETAIL,
    code,
  };
}

function countingOperation(error: unknown): { run: () => Promise<never>; calls: () => number } {
  let calls = 0;
  return {
    run: async () => {
      calls += 1;
      throw error;
    },
    calls: () => calls,
  };
}

describe('RetryPolicy against the permanent 0486 transaction lock', () => {
  const retryEverything = {
    maxRetries: 3,
    initialDelay: 1,
    maxDelay: 2,
    retryableStatusCodes: [409, 500],
  };

  it('issues exactly one attempt for a raw 409/0486 even when the caller retries everything', async () => {
    const operation = countingOperation(new HttpErrorLike(409, lockedProblem('0486')));
    const policy = new RetryPolicy({ ...retryEverything, retryCondition: () => true });

    await expect(policy.execute(operation.run)).rejects.toThrow('HTTP 409');

    expect(operation.calls()).toBe(1);
  });

  it('issues exactly one attempt when the problem document arrives as a raw string', async () => {
    // The ledger answers application/problem+json, which the transport does not
    // recognise as JSON, so the body reaches the error unparsed.
    const operation = countingOperation(
      new HttpErrorLike(409, `${JSON.stringify(lockedProblem('0486'))}\n`)
    );
    const policy = new RetryPolicy({ ...retryEverything, retryCondition: () => true });

    await expect(policy.execute(operation.run)).rejects.toThrow('HTTP 409');

    expect(operation.calls()).toBe(1);
  });

  it('issues exactly one attempt for a MidazError carrying midazCode 0486', async () => {
    const operation = countingOperation(
      new MidazError({
        category: ErrorCategory.CONFLICT,
        code: ErrorCode.TRANSACTION_LOCKED,
        midazCode: '0486',
        message: LOCKED_DETAIL,
        statusCode: 409,
      })
    );
    const policy = new RetryPolicy(retryEverything);

    await expect(policy.execute(operation.run)).rejects.toThrow(MidazError);

    expect(operation.calls()).toBe(1);
  });

  it('still retries a 409 whose string body is not a problem document at all', async () => {
    const operation = countingOperation(new HttpErrorLike(409, '<html>0486</html>'));
    const policy = new RetryPolicy({ ...retryEverything, retryCondition: () => true });

    await expect(policy.execute(operation.run)).rejects.toThrow('HTTP 409');

    expect(operation.calls()).toBe(4);
  });

  it('still retries an ordinary 409 the caller opted into, so the guard stays narrow', async () => {
    const operation = countingOperation(new HttpErrorLike(409, lockedProblem('0099')));
    const policy = new RetryPolicy({ ...retryEverything, retryCondition: () => true });

    await expect(policy.execute(operation.run)).rejects.toThrow('HTTP 409');

    expect(operation.calls()).toBe(4);
  });

  it('still retries a 500 carrying an unrelated midaz code', async () => {
    const operation = countingOperation(
      new MidazError({
        category: ErrorCategory.INTERNAL,
        code: ErrorCode.INTERNAL_ERROR,
        midazCode: '0057',
        message: 'internal',
        statusCode: 500,
      })
    );
    const policy = new RetryPolicy(retryEverything);

    await expect(policy.execute(operation.run)).rejects.toThrow(MidazError);

    expect(operation.calls()).toBe(4);
  });
});
