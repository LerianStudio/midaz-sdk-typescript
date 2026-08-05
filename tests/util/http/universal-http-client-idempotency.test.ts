/**
 * @file Idempotency header contract for UniversalHttpClient
 *
 * The Midaz backend reads the idempotency key from `X-Idempotency`
 * (LerianStudio/lib-commons commons/constants/headers.go). When no key is
 * sent, the ledger falls back to deduplicating by a SHA-256 of the request
 * body, so the SDK must stay silent instead of inventing a per-call key.
 */
import { UniversalHttpClient } from '../../../src/util/http/universal-http-client';

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

/** Reads the headers the client handed to fetch for the given call. */
function sentHeaders(call = 0): Record<string, string> {
  return (mockFetch.mock.calls[call][1] as RequestInit).headers as Record<string, string>;
}

beforeEach(() => {
  mockFetch = jest.fn().mockResolvedValue(okResponse());
  global.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

describe('UniversalHttpClient idempotency header', () => {
  const client = () =>
    new UniversalHttpClient({ baseURL: 'http://localhost:3000', retries: 0 });

  it('sends a caller-supplied key under X-Idempotency', async () => {
    await client().request('/transactions', {
      method: 'POST',
      body: { amount: 100 },
      idempotencyKey: 'pgto-nf123',
    });

    expect(sentHeaders()[CANONICAL_HEADER]).toBe('pgto-nf123');
  });

  it('never sends the legacy Idempotency-Key header, which the backend ignores', async () => {
    await client().request('/transactions', {
      method: 'POST',
      body: { amount: 100 },
      idempotencyKey: 'pgto-nf123',
    });

    expect(sentHeaders()).not.toHaveProperty(LEGACY_HEADER);
  });

  it.each(['POST', 'PUT', 'PATCH'] as const)(
    'sends no idempotency header on %s when the caller supplies no key',
    async (method) => {
      await client().request('/transactions', { method, body: { amount: 100 } });

      const headers = sentHeaders();
      expect(headers).not.toHaveProperty(CANONICAL_HEADER);
      expect(headers).not.toHaveProperty(LEGACY_HEADER);
    }
  );

  it('treats an empty key as suppression rather than falling back to auto-generation', async () => {
    await client().request('/transactions', {
      method: 'POST',
      body: { amount: 100 },
      idempotencyKey: '',
    });

    const headers = sentHeaders();
    expect(headers).not.toHaveProperty(CANONICAL_HEADER);
    expect(headers).not.toHaveProperty(LEGACY_HEADER);
  });

  it('never invents a key on GET', async () => {
    await client().request('/transactions', { method: 'GET' });

    const headers = sentHeaders();
    expect(headers).not.toHaveProperty(CANONICAL_HEADER);
    expect(headers).not.toHaveProperty(LEGACY_HEADER);
  });

  it('forwards a caller-supplied key on any method, GET included', async () => {
    await client().request('/transactions', { method: 'GET', idempotencyKey: 'pgto-nf123' });

    expect(sentHeaders()[CANONICAL_HEADER]).toBe('pgto-nf123');
  });

  it('reuses the same key across retries of a single call', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(okResponse());

    const retryingClient = new UniversalHttpClient({
      baseURL: 'http://localhost:3000',
      retries: 1,
      retryDelay: 1,
    });

    await retryingClient.request('/transactions', {
      method: 'POST',
      body: { amount: 100 },
      idempotencyKey: 'pgto-nf123',
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(sentHeaders(0)[CANONICAL_HEADER]).toBe('pgto-nf123');
    expect(sentHeaders(1)[CANONICAL_HEADER]).toBe('pgto-nf123');
  });
});
