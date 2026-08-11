/**
 * @file Count methods across the seven counted resources
 *
 * Every count route answers `HEAD` only, with `204` and the total in
 * `X-Total-Count`. Six of the seven take no filters; transactions takes four and
 * silently narrows to today when no window is given.
 */
import { HttpAccountApiClient } from '../../../src/api/http/http-account-api-client';
import { HttpAssetApiClient } from '../../../src/api/http/http-asset-api-client';
import { HttpLedgerApiClient } from '../../../src/api/http/http-ledger-api-client';
import { HttpOrganizationApiClient } from '../../../src/api/http/http-organization-api-client';
import { HttpPortfolioApiClient } from '../../../src/api/http/http-portfolio-api-client';
import { HttpSegmentApiClient } from '../../../src/api/http/http-segment-api-client';
import { HttpTransactionApiClient } from '../../../src/api/http/http-transaction-api-client';
import { UrlBuilder } from '../../../src/api/url-builder';
import { HttpClient } from '../../../src/util/network/http-client';
import { Observability, Span } from '../../../src/util/observability/observability';

const ORG = 'org-123';
const LEDGER = 'ledger-456';
const BASE = 'https://ledger.test/v1';

function makeSpan(): jest.Mocked<Span> {
  return {
    setAttribute: jest.fn(),
    setStatus: jest.fn(),
    recordException: jest.fn(),
    end: jest.fn(),
  } as unknown as jest.Mocked<Span>;
}

function makeObservability(span: Span): jest.Mocked<Observability> {
  return {
    startSpan: jest.fn().mockReturnValue(span),
    recordMetric: jest.fn(),
  } as unknown as jest.Mocked<Observability>;
}

function makeHttpClient(count: string | undefined): jest.Mocked<HttpClient> {
  return {
    head: jest.fn().mockResolvedValue({
      data: undefined,
      headers: count === undefined ? new Headers() : new Headers({ 'X-Total-Count': count }),
    }),
  } as unknown as jest.Mocked<HttpClient>;
}

interface CountCase {
  name: string;
  path: string;
  build: (httpClient: HttpClient, observability: Observability) => () => Promise<number>;
}

const urlBuilder = new UrlBuilder({ baseUrls: { ledger: 'https://ledger.test' } });

const unfilteredCases: CountCase[] = [
  {
    name: 'countOrganizations',
    path: `${BASE}/organizations/metrics/count`,
    build: (http, obs) => {
      const client = new HttpOrganizationApiClient(http, urlBuilder, obs);
      return () => client.countOrganizations();
    },
  },
  {
    name: 'countLedgers',
    path: `${BASE}/organizations/${ORG}/ledgers/metrics/count`,
    build: (http, obs) => {
      const client = new HttpLedgerApiClient(http, urlBuilder, obs);
      return () => client.countLedgers(ORG);
    },
  },
  {
    name: 'countAccounts',
    path: `${BASE}/organizations/${ORG}/ledgers/${LEDGER}/accounts/metrics/count`,
    build: (http, obs) => {
      const client = new HttpAccountApiClient(http, urlBuilder, obs);
      return () => client.countAccounts(ORG, LEDGER);
    },
  },
  {
    name: 'countAssets',
    path: `${BASE}/organizations/${ORG}/ledgers/${LEDGER}/assets/metrics/count`,
    build: (http, obs) => {
      const client = new HttpAssetApiClient(http, urlBuilder, obs);
      return () => client.countAssets(ORG, LEDGER);
    },
  },
  {
    name: 'countPortfolios',
    path: `${BASE}/organizations/${ORG}/ledgers/${LEDGER}/portfolios/metrics/count`,
    build: (http, obs) => {
      const client = new HttpPortfolioApiClient(http, urlBuilder, obs);
      return () => client.countPortfolios(ORG, LEDGER);
    },
  },
  {
    name: 'countSegments',
    path: `${BASE}/organizations/${ORG}/ledgers/${LEDGER}/segments/metrics/count`,
    build: (http, obs) => {
      const client = new HttpSegmentApiClient(http, urlBuilder, obs);
      return () => client.countSegments(ORG, LEDGER);
    },
  },
];

describe('counts on the six unfiltered resources', () => {
  it.each(unfilteredCases.map((testCase) => [testCase.name, testCase] as const))(
    '%s reads X-Total-Count off a HEAD of the metrics path',
    async (_name, testCase) => {
      const span = makeSpan();
      const http = makeHttpClient('42');

      const count = await testCase.build(http, makeObservability(span))();

      expect(count).toBe(42);
      expect(http.head).toHaveBeenCalledTimes(1);
      expect(http.head).toHaveBeenCalledWith(testCase.path, expect.anything());
    }
  );

  it.each(unfilteredCases.map((testCase) => [testCase.name, testCase] as const))(
    '%s sends no query parameters, because the server ignores every one',
    async (_name, testCase) => {
      const span = makeSpan();
      const http = makeHttpClient('7');

      await testCase.build(http, makeObservability(span))();

      expect(http.head.mock.calls[0][1]).not.toHaveProperty('params');
    }
  );

  it.each(unfilteredCases.map((testCase) => [testCase.name, testCase] as const))(
    '%s refuses a response that carries no count header',
    async (_name, testCase) => {
      const span = makeSpan();
      const http = makeHttpClient(undefined);

      await expect(testCase.build(http, makeObservability(span))()).rejects.toThrow(
        /X-Total-Count/
      );
    }
  );

  it('refuses a count header that is not a whole number', async () => {
    const span = makeSpan();
    const http = makeHttpClient('not-a-number');
    const client = new HttpAccountApiClient(http, urlBuilder, makeObservability(span));

    await expect(client.countAccounts(ORG, LEDGER)).rejects.toThrow(/not-a-number/);
  });

  it('requires the identifiers the path needs', async () => {
    const span = makeSpan();
    const http = makeHttpClient('1');
    const client = new HttpAccountApiClient(http, urlBuilder, makeObservability(span));

    await expect(client.countAccounts('', LEDGER)).rejects.toThrow();
    await expect(client.countAccounts(ORG, '')).rejects.toThrow();
  });
});

describe('countTransactions date window', () => {
  const path = `${BASE}/organizations/${ORG}/ledgers/${LEDGER}/transactions/metrics/count`;
  let http: jest.Mocked<HttpClient>;
  let client: HttpTransactionApiClient;

  beforeEach(() => {
    http = makeHttpClient('9');
    client = new HttpTransactionApiClient(http, urlBuilder, makeObservability(makeSpan()));
  });

  it('sends an explicit RFC 3339 window as start_date and end_date', async () => {
    const count = await client.countTransactions(ORG, LEDGER, {
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2026-08-07T23:59:59Z',
    });

    expect(count).toBe(9);
    expect(http.head).toHaveBeenCalledWith(
      path,
      expect.objectContaining({
        params: { start_date: '2026-01-01T00:00:00Z', end_date: '2026-08-07T23:59:59Z' },
      })
    );
  });

  it("sends no dates when the caller opts into the server's today-only window", async () => {
    await client.countTransactions(ORG, LEDGER, { window: 'today' });

    expect(http.head.mock.calls[0][1]).toEqual(expect.objectContaining({ params: {} }));
  });

  it('refuses a call that names no window at all', async () => {
    await expect(
      client.countTransactions(ORG, LEDGER, {} as unknown as { window: 'today' })
    ).rejects.toThrow(/window/);
    expect(http.head).not.toHaveBeenCalled();
  });

  it('refuses a half window, because the missing bound silently becomes today', async () => {
    await expect(
      client.countTransactions(ORG, LEDGER, {
        startDate: '2026-01-01T00:00:00Z',
      } as unknown as { window: 'today' })
    ).rejects.toThrow(/endDate/);

    await expect(
      client.countTransactions(ORG, LEDGER, {
        endDate: '2026-01-01T00:00:00Z',
      } as unknown as { window: 'today' })
    ).rejects.toThrow(/startDate/);

    expect(http.head).not.toHaveBeenCalled();
  });

  it('refuses a window mixed with the today opt-in', async () => {
    await expect(
      client.countTransactions(ORG, LEDGER, {
        window: 'today',
        startDate: '2026-01-01T00:00:00Z',
        endDate: '2026-01-02T00:00:00Z',
      } as unknown as { window: 'today' })
    ).rejects.toThrow(/window/);
    expect(http.head).not.toHaveBeenCalled();
  });

  it('refuses a date-only bound, which the ledger answers 400', async () => {
    await expect(
      client.countTransactions(ORG, LEDGER, {
        startDate: '2026-01-01',
        endDate: '2026-08-07T23:59:59Z',
      })
    ).rejects.toThrow(/RFC 3339/);
    expect(http.head).not.toHaveBeenCalled();
  });

  it('refuses a window whose start follows its end', async () => {
    await expect(
      client.countTransactions(ORG, LEDGER, {
        startDate: '2026-08-07T00:00:00Z',
        endDate: '2026-01-01T00:00:00Z',
      })
    ).rejects.toThrow(/startDate/);
    expect(http.head).not.toHaveBeenCalled();
  });
});

describe('countTransactions filters', () => {
  const path = `${BASE}/organizations/${ORG}/ledgers/${LEDGER}/transactions/metrics/count`;
  let http: jest.Mocked<HttpClient>;
  let client: HttpTransactionApiClient;

  beforeEach(() => {
    http = makeHttpClient('3');
    client = new HttpTransactionApiClient(http, urlBuilder, makeObservability(makeSpan()));
  });

  it('sends status and route alongside the window', async () => {
    await client.countTransactions(ORG, LEDGER, {
      window: 'today',
      status: 'APPROVED',
      route: 'route-1',
    });

    expect(http.head).toHaveBeenCalledWith(
      path,
      expect.objectContaining({ params: { status: 'APPROVED', route: 'route-1' } })
    );
  });

  it('refuses a status outside the ledger enum', async () => {
    await expect(
      client.countTransactions(ORG, LEDGER, {
        window: 'today',
        status: 'approved' as unknown as 'APPROVED',
      })
    ).rejects.toThrow(/status/);
    expect(http.head).not.toHaveBeenCalled();
  });

  it('requires the identifiers the path needs', async () => {
    await expect(client.countTransactions('', LEDGER, { window: 'today' })).rejects.toThrow();
    await expect(client.countTransactions(ORG, '', { window: 'today' })).rejects.toThrow();
  });
});
