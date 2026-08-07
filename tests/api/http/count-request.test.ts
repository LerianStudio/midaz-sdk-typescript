/**
 * @file The message a missing `X-Total-Count` is reported with
 *
 * The ledger sends the count in a response header and does not name it in
 * `Access-Control-Expose-Headers`, so a browser hides it from the SDK even
 * though it arrived. Only the runtime tells the two causes apart.
 */
import { parseTotalCount, TOTAL_COUNT_HEADER } from '../../../src/api/http/count-request';
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
});
