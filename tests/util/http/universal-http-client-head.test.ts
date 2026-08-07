/**
 * @file HEAD support and bodyless-response handling for UniversalHttpClient
 *
 * The ledger answers `HEAD .../metrics/count` with `204`, an empty body, no
 * `Content-Type`, and the count in `X-Total-Count`. Parsing that response by
 * content type falls through to `blob()`, so the client needs a bodyless
 * short-circuit and it needs to hand the response headers back to the caller.
 */
import { HttpError, UniversalHttpClient } from '../../../src/util/http/universal-http-client';

let mockFetch: jest.Mock;
let jsonSpy: jest.Mock;
let textSpy: jest.Mock;
let blobSpy: jest.Mock;
const originalFetch = global.fetch;

function noContentResponse(headers: Record<string, string> = {}): Response {
  return {
    ok: true,
    status: 204,
    statusText: 'No Content',
    headers: new Headers(headers),
    json: jsonSpy,
    text: textSpy,
    blob: blobSpy,
  } as unknown as Response;
}

function sentMethod(call = 0): string {
  return (mockFetch.mock.calls[call][1] as RequestInit).method as string;
}

beforeEach(() => {
  jsonSpy = jest.fn(async () => {
    throw new Error('json() called on an empty body');
  });
  textSpy = jest.fn(async () => '');
  blobSpy = jest.fn(async () => {
    throw new Error('blob() called on an empty body');
  });
  mockFetch = jest.fn().mockResolvedValue(noContentResponse({ 'X-Total-Count': '46' }));
  global.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

describe('UniversalHttpClient HEAD support', () => {
  const client = () => new UniversalHttpClient({ baseURL: 'http://localhost:3002', retries: 0 });

  it('puts HEAD on the wire', async () => {
    await client().head('/v1/organizations/metrics/count');

    expect(sentMethod()).toBe('HEAD');
  });

  it('accepts HEAD as an explicit method on request()', async () => {
    await client().request('/v1/organizations/metrics/count', { method: 'HEAD' });

    expect(sentMethod()).toBe('HEAD');
  });

  it('resolves a 204 without parsing a body', async () => {
    const response = await client().head('/v1/organizations/metrics/count');

    expect(response.status).toBe(204);
    expect(response.data).toBeUndefined();
    expect(blobSpy).not.toHaveBeenCalled();
    expect(jsonSpy).not.toHaveBeenCalled();
    expect(textSpy).not.toHaveBeenCalled();
  });

  it('surfaces the response headers to the caller', async () => {
    const response = await client().head('/v1/organizations/metrics/count');

    expect(response.headers.get('X-Total-Count')).toBe('46');
  });

  it('parses no body on a HEAD that advertises a JSON content type', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: jsonSpy,
      text: textSpy,
      blob: blobSpy,
    } as unknown as Response);

    const response = await client().head('/v1/organizations');

    expect(response.data).toBeUndefined();
    expect(jsonSpy).not.toHaveBeenCalled();
  });
});

describe('UniversalHttpClient HEAD error replies', () => {
  let attempts: number;

  // HTTP strips the body of every HEAD reply, but the ledger still answers a failing
  // count with the error's Content-Type and Content-Length, so a client that parses
  // by content type destroys the status it was handed.
  function bodilessErrorFetch(status: number, contentType: string): jest.Mock {
    attempts = 0;

    return jest.fn(async () => {
      attempts += 1;

      return new Response(null, {
        status,
        statusText: 'Bad Request',
        headers: new Headers({ 'Content-Type': contentType }),
      });
    });
  }

  const client = () => new UniversalHttpClient({ baseURL: 'http://localhost:3002', retryDelay: 1 });

  beforeEach(() => {
    attempts = 0;
  });

  it('turns a bodiless HEAD 400 into a typed HttpError carrying the status', async () => {
    global.fetch = bodilessErrorFetch(
      400,
      'application/json; charset=utf-8'
    ) as unknown as typeof fetch;

    const thrown = await client()
      .request('/v1/organizations/nope/ledgers/metrics/count', { method: 'HEAD' })
      .catch((error) => error);

    expect(thrown).toBeInstanceOf(HttpError);
    expect((thrown as HttpError).status).toBe(400);
  });

  it('never reads the body of a HEAD error', async () => {
    const json = jest.fn(async () => ({ code: '0085' }));
    const text = jest.fn(async () => '');
    attempts = 0;
    global.fetch = jest.fn(async () => {
      attempts += 1;
      const response = new Response(null, {
        status: 404,
        statusText: 'Not Found',
        headers: new Headers({ 'Content-Type': 'application/json; charset=utf-8' }),
      });
      (response as any).json = json;
      (response as any).text = text;

      return response;
    }) as unknown as typeof fetch;

    await expect(
      client().request('/v1/organizations/metrics/count', { method: 'HEAD' })
    ).rejects.toBeInstanceOf(HttpError);
    expect(json).not.toHaveBeenCalled();
    expect(text).not.toHaveBeenCalled();
  });

  it('does not retry a bodiless HEAD 4xx', async () => {
    global.fetch = bodilessErrorFetch(
      400,
      'application/json; charset=utf-8'
    ) as unknown as typeof fetch;

    await expect(
      client().request('/v1/organizations/metrics/count', { method: 'HEAD' })
    ).rejects.toBeInstanceOf(HttpError);
    expect(attempts).toBe(1);
  });

  it('keeps the status when a GET declares JSON but sends no body', async () => {
    global.fetch = bodilessErrorFetch(
      502,
      'application/json; charset=utf-8'
    ) as unknown as typeof fetch;

    const thrown = await client()
      .request('/v1/organizations', { method: 'GET', retries: 0 })
      .catch((error) => error);

    expect(thrown).toBeInstanceOf(HttpError);
    expect((thrown as HttpError).status).toBe(502);
  });
});
