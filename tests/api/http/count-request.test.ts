/**
 * @file The message a missing `X-Total-Count` is reported with
 *
 * The ledger sends the count in a response header and does not name it in
 * `Access-Control-Expose-Headers`, so a browser hides it from the SDK even
 * though it arrived. Only the runtime tells the two causes apart.
 */
import {
  parseTotalCount,
  requestTotalCount,
  TOTAL_COUNT_HEADER,
} from '../../../src/api/http/count-request';
import { HttpClient } from '../../../src/util/network/http-client';
import { detectEnvironment } from '../../../src/util/runtime/environment';

jest.mock('../../../src/util/runtime/environment', () => ({
  detectEnvironment: jest.fn(() => 'node'),
}));

const detectEnvironmentMock = detectEnvironment as jest.MockedFunction<typeof detectEnvironment>;

describe('parseTotalCount without the count header', () => {
  beforeEach(() => {
    detectEnvironmentMock.mockReturnValue('node');
  });

  it('names the CORS exposure gap in a browser', () => {
    detectEnvironmentMock.mockReturnValue('browser');

    expect(() => parseTotalCount('countAccounts', new Headers())).toThrow(
      `In a browser the header is stripped from a cross-origin response unless the ledger returns it in Access-Control-Expose-Headers: ${TOTAL_COUNT_HEADER}`
    );
  });

  it('does not blame CORS outside a browser', () => {
    const thrown = (() => {
      try {
        parseTotalCount('countAccounts', new Headers());
      } catch (error) {
        return error as Error;
      }

      return undefined;
    })();

    expect(thrown?.message).toContain(
      `countAccounts was answered without a readable ${TOTAL_COUNT_HEADER} header`
    );
    expect(thrown?.message).not.toContain('Access-Control-Expose-Headers');
  });

  it('reports the value it could not read as a count', () => {
    expect(() => parseTotalCount('countAccounts', { 'X-Total-Count': 'abc' })).toThrow(
      "was answered with X-Total-Count: 'abc', which is not a count"
    );
  });

  it('reads a plain-record header whatever its casing', () => {
    expect(parseTotalCount('countAccounts', { 'x-total-count': '7' })).toBe(7);
    expect(parseTotalCount('countAccounts', { 'X-TOTAL-COUNT': '7' })).toBe(7);
  });
});

describe('requestTotalCount', () => {
  const httpClient = { head: jest.fn() } as unknown as jest.Mocked<HttpClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('asks over HEAD, because the count routes answer nothing else', async () => {
    httpClient.head.mockResolvedValueOnce({
      headers: new Headers({ 'X-Total-Count': '7' }),
      data: undefined,
    });

    const count = await requestTotalCount(httpClient, 'countSegments', '/segments/metrics/count');

    expect(count).toBe(7);
    expect(httpClient.head).toHaveBeenCalledWith('/segments/metrics/count', {});
  });

  it('reports the operation that was answered without a readable count', async () => {
    httpClient.head.mockResolvedValueOnce({ headers: new Headers(), data: undefined });

    await expect(
      requestTotalCount(httpClient, 'countPortfolios', '/portfolios/metrics/count')
    ).rejects.toThrow('countPortfolios');
  });
});
