/**
 * @file Idempotency contract for the backward-compatible HttpClient wrapper
 *
 * The wrapper must hand a caller-supplied key to the transport under
 * `X-Idempotency`, honour `disableIdempotencyKey`, and never invent a key of
 * its own — the ledger deduplicates by body hash when no header arrives.
 */
import { HttpClient } from '../../../src/util/network/http-client';

const CANONICAL_HEADER = 'X-Idempotency';
const LEGACY_HEADER = 'Idempotency-Key';

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

describe('HttpClient wrapper idempotency', () => {
  const client = () => new HttpClient({ baseURL: 'http://localhost:3000', maxRetries: 0 });

  it('sends a caller-supplied key under X-Idempotency', async () => {
    await client().post('/transactions', { amount: 100 }, { idempotencyKey: 'pgto-nf123' });

    expect(sentHeaders()[CANONICAL_HEADER]).toBe('pgto-nf123');
  });

  it('sends no idempotency header when disableIdempotencyKey is set', async () => {
    await client().post(
      '/transactions',
      { amount: 100 },
      { idempotencyKey: 'pgto-nf123', disableIdempotencyKey: true }
    );

    const headers = sentHeaders();
    expect(headers).not.toHaveProperty(CANONICAL_HEADER);
    expect(headers).not.toHaveProperty(LEGACY_HEADER);
  });

  it('sends no idempotency header when the caller supplies no key', async () => {
    await client().post('/transactions', { amount: 100 });

    const headers = sentHeaders();
    expect(headers).not.toHaveProperty(CANONICAL_HEADER);
    expect(headers).not.toHaveProperty(LEGACY_HEADER);
  });
});
