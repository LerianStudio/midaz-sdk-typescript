/**
 * @file headRequest and case-insensitive header reads on HttpBaseApiClient
 *
 * `HEAD .../metrics/count` answers 204 with the count in `X-Total-Count`, so
 * the resource clients need a base-class path that reaches the headers.
 */
import { HttpBaseApiClient } from '../../../src/api/http/http-base-api-client';
import { UrlBuilder } from '../../../src/api/url-builder';
import { HttpClient } from '../../../src/util/network/http-client';
import { Observability, Span } from '../../../src/util/observability/observability';

class ProbeApiClient extends HttpBaseApiClient<unknown> {
  public head(url: string, options?: any) {
    return this.headRequest('probe.head', url, options, { resource: 'probe' });
  }

  public readHeader(headers: any, name: string) {
    return this.readResponseHeader(headers, name);
  }
}

describe('HttpBaseApiClient headRequest', () => {
  let mockHttpClient: jest.Mocked<HttpClient>;
  let mockUrlBuilder: jest.Mocked<UrlBuilder>;
  let mockObservability: jest.Mocked<Observability>;
  let mockSpan: jest.Mocked<Span>;
  let client: ProbeApiClient;

  beforeEach(() => {
    mockSpan = {
      setAttribute: jest.fn(),
      setStatus: jest.fn(),
      recordException: jest.fn(),
      end: jest.fn(),
    } as unknown as jest.Mocked<Span>;

    mockObservability = {
      startSpan: jest.fn().mockReturnValue(mockSpan),
      recordMetric: jest.fn(),
    } as unknown as jest.Mocked<Observability>;

    mockUrlBuilder = {
      getApiVersion: jest.fn().mockReturnValue('v1'),
    } as unknown as jest.Mocked<UrlBuilder>;

    mockHttpClient = {
      head: jest.fn().mockResolvedValue({
        data: undefined,
        headers: new Headers({ 'X-Total-Count': '46' }),
      }),
    } as unknown as jest.Mocked<HttpClient>;

    client = new ProbeApiClient(mockHttpClient, mockUrlBuilder, 'organizations', mockObservability);
  });

  it('issues the request through the client HEAD path', async () => {
    await client.head('/v1/organizations/metrics/count');

    expect(mockHttpClient.head).toHaveBeenCalledWith(
      '/v1/organizations/metrics/count',
      expect.objectContaining({ headers: expect.objectContaining({ 'X-API-Version': 'v1' }) })
    );
  });

  it('returns the response headers to the caller', async () => {
    const response = await client.head('/v1/organizations/metrics/count');

    expect(client.readHeader(response.headers, 'X-Total-Count')).toBe('46');
  });

  it('reads a header case-insensitively from a Headers object', async () => {
    const headers = new Headers({ 'X-Total-Count': '46' });

    expect(client.readHeader(headers, 'x-total-count')).toBe('46');
  });

  it('reads a header case-insensitively from a plain record', async () => {
    expect(client.readHeader({ 'x-total-count': '46' }, 'X-Total-Count')).toBe('46');
  });

  it('reads a canonically cased record key under a lowercase lookup name', async () => {
    expect(client.readHeader({ 'X-Total-Count': '46' }, 'x-total-count')).toBe('46');
  });

  it('reads a record key whose casing matches neither side', async () => {
    expect(client.readHeader({ 'X-TOTAL-COUNT': '46' }, 'X-Total-Count')).toBe('46');
  });

  it('returns undefined for a header the response does not carry', async () => {
    expect(client.readHeader(new Headers(), 'X-Total-Count')).toBeUndefined();
    expect(client.readHeader({}, 'X-Total-Count')).toBeUndefined();
  });

  it('records the failure on the span and rethrows', async () => {
    const failure = new Error('boom');
    mockHttpClient.head = jest.fn().mockRejectedValue(failure);

    await expect(client.head('/v1/organizations/metrics/count')).rejects.toThrow('boom');
    expect(mockSpan.recordException).toHaveBeenCalledWith(failure);
    expect(mockSpan.end).toHaveBeenCalled();
  });
});
