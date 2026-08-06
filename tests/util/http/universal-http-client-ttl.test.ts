/**
 * @file Idempotency TTL header contract
 *
 * The ledger reads the lifetime of an idempotency slot from `X-TTL`, in seconds,
 * defaulting to 300 when the header is absent. The SDK therefore sends it only when
 * the caller asked for a different window, and never invents one.
 */
import { UniversalHttpClient } from '../../../src/util/http/universal-http-client';
import { HttpClient } from '../../../src/util/network/http-client';

const TTL_HEADER = 'X-TTL';
const IDEMPOTENCY_HEADER = 'X-Idempotency';

let mockFetch: jest.Mock;
const originalFetch = global.fetch;

function okResponse(): Response {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => ({ id: 'tx-1' }),
    text: async () => '{"id":"tx-1"}',
  } as unknown as Response;
}

function sentHeaders(): Record<string, string> {
  return (mockFetch.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
}

beforeEach(() => {
  mockFetch = jest.fn().mockResolvedValue(okResponse());
  global.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

describe('UniversalHttpClient idempotency TTL header', () => {
  const client = () => new UniversalHttpClient({ baseURL: 'http://localhost:3000', retries: 0 });

  it('sends the caller-supplied TTL under X-TTL, in seconds', async () => {
    await client().request('/transactions/inflow', {
      method: 'POST',
      body: { amount: 100 },
      idempotencyKey: 'dep-1',
      idempotencyTtlSeconds: 600,
    });

    const headers = sentHeaders();
    expect(headers[TTL_HEADER]).toBe('600');
    expect(headers[IDEMPOTENCY_HEADER]).toBe('dep-1');
  });

  it('sends no TTL header when the caller supplies none, leaving the server default', async () => {
    await client().request('/transactions/inflow', {
      method: 'POST',
      body: { amount: 100 },
      idempotencyKey: 'dep-1',
    });

    expect(sentHeaders()).not.toHaveProperty(TTL_HEADER);
  });

  it('sends the TTL even without a key, since the body-hash slot honours it too', async () => {
    await client().request('/transactions/inflow', {
      method: 'POST',
      body: { amount: 100 },
      idempotencyTtlSeconds: 60,
    });

    const headers = sentHeaders();
    expect(headers[TTL_HEADER]).toBe('60');
    expect(headers).not.toHaveProperty(IDEMPOTENCY_HEADER);
  });
});

describe('HttpClient wrapper idempotency TTL', () => {
  it('forwards the TTL request option to the transport', async () => {
    const client = new HttpClient({ baseURL: 'http://localhost:3000', maxRetries: 0 });

    await client.post(
      '/transactions/inflow',
      { amount: 100 },
      { idempotencyKey: 'dep-1', idempotencyTtlSeconds: 600 }
    );

    expect(sentHeaders()[TTL_HEADER]).toBe('600');
  });
});
