/**
 * @file HEAD support for the backward-compatible HttpClient wrapper
 *
 * `request()` returns only the body, which is useless for `HEAD
 * .../metrics/count`: the ledger puts the count in `X-Total-Count` and sends
 * `204` with no body. The wrapper therefore needs a separate entry point that
 * hands the headers back alongside the (empty) body.
 */
import { HttpClient } from '../../../src/util/network/http-client';

let mockFetch: jest.Mock;
const originalFetch = global.fetch;

function noContentResponse(): Response {
  return {
    ok: true,
    status: 204,
    statusText: 'No Content',
    headers: new Headers({ 'X-Total-Count': '7' }),
    json: async () => {
      throw new Error('json() called on an empty body');
    },
    text: async () => '',
    blob: async () => {
      throw new Error('blob() called on an empty body');
    },
  } as unknown as Response;
}

function sentMethod(call = 0): string {
  return (mockFetch.mock.calls[call][1] as RequestInit).method as string;
}

beforeEach(() => {
  mockFetch = jest.fn().mockResolvedValue(noContentResponse());
  global.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

describe('HttpClient wrapper HEAD support', () => {
  const client = () => new HttpClient({ baseURL: 'http://localhost:3002', maxRetries: 0 });

  it('puts HEAD on the wire', async () => {
    await client().head('/v1/organizations/metrics/count');

    expect(sentMethod()).toBe('HEAD');
  });

  it('returns the response headers alongside the body', async () => {
    const response = await client().head('/v1/organizations/metrics/count');

    expect(response.headers.get('X-Total-Count')).toBe('7');
    expect(response.data).toBeUndefined();
  });

  it('forwards caller headers and query params', async () => {
    await client().head('/v1/organizations/metrics/count', {
      headers: { 'X-Custom': 'yes' },
      params: { start_date: '2026-08-01' },
    });

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('start_date=2026-08-01');
    expect((init.headers as Record<string, string>)['X-Custom']).toBe('yes');
  });
});
