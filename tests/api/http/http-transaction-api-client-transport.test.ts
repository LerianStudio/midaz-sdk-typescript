/**
 * @file State transitions driven through the real transport, counting HTTP requests
 *
 * The transaction client's own suite mocks HttpClient, so nothing there can observe a
 * re-send. These cases wire the production HttpClient and UniversalHttpClient behind a
 * fake `fetch` and count the calls, because a re-sent commit is a money-reporting
 * hazard: the ledger keeps the pending lock for 300 seconds after a successful
 * transition, so the second attempt answers 409/0486 and a settled commit is reported to
 * the caller as a failure. Revert is deduplicated server-side and stays retryable.
 */
import { HttpTransactionApiClient } from '../../../src/api/http/http-transaction-api-client';
import { UrlBuilder } from '../../../src/api/url-builder';
import { MidazError } from '../../../src/util/error/error-types';
import { MetricsCollector } from '../../../src/util/monitoring/metrics';
import { HttpClient } from '../../../src/util/network/http-client';
import { Observability, Span } from '../../../src/util/observability/observability';

const BASE_URL = 'http://localhost:3002';

describe('HttpTransactionApiClient over the real transport', () => {
  const orgId = 'org-123';
  const ledgerId = 'ledger-456';
  const transactionId = 'tx-789';

  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;
  let openClients: HttpClient[];

  function respondWith(status: number, body: Record<string, unknown>): jest.Mock {
    return jest.fn().mockResolvedValue({
      ok: false,
      status,
      statusText: status === 409 ? 'Conflict' : 'Internal Server Error',
      headers: new Headers({ 'content-type': 'application/problem+json' }),
      json: async () => body,
      text: async () => JSON.stringify(body),
    } as unknown as Response);
  }

  function buildClient(): HttpTransactionApiClient {
    const mockSpan = {
      setAttribute: jest.fn(),
      setStatus: jest.fn(),
      recordException: jest.fn(),
      end: jest.fn(),
    } as unknown as jest.Mocked<Span>;

    const observability = {
      startSpan: jest.fn().mockReturnValue(mockSpan),
      recordMetric: jest.fn(),
    } as unknown as jest.Mocked<Observability>;

    // Three retries with a 1 ms delay: anything the client leaves retryable re-sends
    // four times, so a single call is proof the client forbade the re-send.
    const httpClient = new HttpClient({
      baseURL: BASE_URL,
      maxRetries: 3,
      retryDelay: 1,
      enforceHttps: false,
      allowInsecureHttp: true,
      observability,
    });

    openClients.push(httpClient);

    const urlBuilder = new UrlBuilder({
      apiVersion: 'v1',
      baseUrls: { ledger: BASE_URL },
    } as never);

    return new HttpTransactionApiClient(httpClient, urlBuilder, observability);
  }

  beforeEach(() => {
    openClients = [];
  });

  afterEach(async () => {
    // The connection pool and circuit breaker keep timers alive, which would outlive
    // the run and stop jest from exiting.
    await Promise.all(openClients.map((client) => client.shutdown()));
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  afterAll(() => {
    // UniversalHttpClient wakes the metrics singleton, whose flush interval outlives the
    // suite. Its default-metrics interval is unreferenced and cannot be cleared at all,
    // so an in-band single-file run of anything touching this transport needs
    // --forceExit; a full run exits because the leak stays inside the jest worker.
    MetricsCollector.destroy();
  });

  it('issues exactly one commit request for the 409/0486 lock', async () => {
    fetchMock = respondWith(409, {
      type: 'https://errors.lerian.studio/v1/0486',
      title: 'Transaction Locked',
      status: 409,
      detail: 'This transaction is currently being processed by another request.',
      code: '0486',
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const error = await buildClient()
      .commitTransaction(orgId, ledgerId, transactionId)
      .catch((caught) => caught);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(error).toBeInstanceOf(MidazError);
    expect(error.midazCode).toBe('0486');
    expect(fetchMock.mock.calls[0][0]).toBe(
      `${BASE_URL}/v1/organizations/${orgId}/ledgers/${ledgerId}/transactions/${transactionId}/commit`
    );
  });

  it('issues exactly one commit request even when the ledger answers 500', async () => {
    fetchMock = respondWith(500, { status: 500, detail: 'boom' });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(
      buildClient().commitTransaction(orgId, ledgerId, transactionId)
    ).rejects.toBeDefined();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('issues exactly one cancel request even when the ledger answers 500', async () => {
    fetchMock = respondWith(500, { status: 500, detail: 'boom' });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(
      buildClient().cancelTransaction(orgId, ledgerId, transactionId)
    ).rejects.toBeDefined();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('re-sends a revert the ledger failed to answer, since it deduplicates it', async () => {
    fetchMock = respondWith(500, { status: 500, detail: 'boom' });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(
      buildClient().revertTransaction(orgId, ledgerId, transactionId)
    ).rejects.toBeDefined();

    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
