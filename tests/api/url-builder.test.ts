import { UrlBuilder } from '../../src/api/url-builder';
import { MidazConfigError } from '../../src/util/error/error-types';
import { getLogger } from '../../src/util/observability/logger';

const LEGACY_ENV_KEYS = ['MIDAZ_LEDGER_URL', 'MIDAZ_ONBOARDING_URL', 'MIDAZ_TRANSACTION_URL'];

describe('UrlBuilder base URL resolution', () => {
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of LEGACY_ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of LEGACY_ENV_KEYS) {
      if (savedEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedEnv[key];
      }
    }
    jest.restoreAllMocks();
  });

  describe('rung 1: explicit service key', () => {
    it('returns the explicit key even when ledger is also configured', () => {
      const builder = new UrlBuilder({
        baseUrls: {
          ledger: 'https://ledger.example.com',
          onboarding: 'https://onboarding.example.com',
        },
      });

      expect(builder.getBaseUrl('onboarding')).toBe('https://onboarding.example.com');
      expect(builder.getBaseUrl('transaction')).toBe('https://ledger.example.com');
    });

    it('keeps legacy-only configuration behaving exactly as before', () => {
      const builder = new UrlBuilder({
        baseUrls: { onboarding: 'https://onboarding.example.com' },
      });

      expect(builder.getBaseUrl('onboarding')).toBe('https://onboarding.example.com');
      expect(builder.getBaseUrl('transaction')).toBe('http://localhost:3001');
    });

    it('keeps the legacy defaults when nothing is configured', () => {
      const builder = new UrlBuilder({});

      expect(builder.getBaseUrl('onboarding')).toBe('http://localhost:3000');
      expect(builder.getBaseUrl('transaction')).toBe('http://localhost:3001');
    });
  });

  describe('rung 2: unified ledger key', () => {
    it('serves every service from ledger when it is the only key', () => {
      const builder = new UrlBuilder({ baseUrls: { ledger: 'https://ledger.example.com' } });

      expect(builder.getBaseUrl('onboarding')).toBe('https://ledger.example.com');
      expect(builder.getBaseUrl('transaction')).toBe('https://ledger.example.com');
      expect(builder.getBaseUrl('anything-else')).toBe('https://ledger.example.com');
    });

    it('builds both service families from a ledger-only map', () => {
      const builder = new UrlBuilder({ baseUrls: { ledger: 'https://ledger.example.com' } });

      expect(builder.buildAccountUrl('ORG', 'LED')).toBe(
        'https://ledger.example.com/v1/organizations/ORG/ledgers/LED/accounts'
      );
      expect(builder.buildAssetRateUrl('ORG', 'LED')).toBe(
        'https://ledger.example.com/v1/organizations/ORG/ledgers/LED/asset-rates'
      );
    });

    it('strips trailing slashes from the ledger URL', () => {
      const builder = new UrlBuilder({ baseUrls: { ledger: 'https://ledger.example.com//' } });

      expect(builder.getBaseUrl('onboarding')).toBe('https://ledger.example.com');
    });

    it('defaults ledger to port 3002 when nothing is configured', () => {
      const builder = new UrlBuilder({});

      expect(builder.getBaseUrl('ledger')).toBe('http://localhost:3002');
    });

    it('does not mutate the caller configuration object', () => {
      const baseUrls: Record<string, string> = { ledger: 'https://ledger.example.com' };

      new UrlBuilder({ baseUrls });

      expect(baseUrls).toEqual({ ledger: 'https://ledger.example.com' });
    });
  });

  describe('rung 3: legacy family fallback', () => {
    it('resolves onboarding-family services from the legacy onboarding key', () => {
      const builder = new UrlBuilder({
        baseUrls: { onboarding: 'https://onboarding.example.com' },
      });

      expect(builder.getBaseUrl('accounts')).toBe('https://onboarding.example.com');
      expect(builder.getBaseUrl('portfolios')).toBe('https://onboarding.example.com');
    });

    it('resolves transaction-family services from the legacy transaction key', () => {
      const builder = new UrlBuilder({
        baseUrls: { transaction: 'https://transaction.example.com' },
      });

      expect(builder.getBaseUrl('balances')).toBe('https://transaction.example.com');
      expect(builder.getBaseUrl('asset-rates')).toBe('https://transaction.example.com');
    });
  });

  describe('rung 4: unresolvable service', () => {
    it('throws instead of silently falling back to onboarding', () => {
      const builder = new UrlBuilder({
        baseUrls: { onboarding: 'https://onboarding.example.com' },
      });

      expect(() => builder.getBaseUrl('nonexistent-service')).toThrow(MidazConfigError);
      expect(() => builder.getBaseUrl('nonexistent-service')).toThrow(/nonexistent-service/);
    });
  });

  describe('environment variables', () => {
    it('takes MIDAZ_LEDGER_URL over the deprecated service env vars', () => {
      process.env.MIDAZ_LEDGER_URL = 'https://env-ledger.example.com';
      process.env.MIDAZ_ONBOARDING_URL = 'https://env-onboarding.example.com';
      process.env.MIDAZ_TRANSACTION_URL = 'https://env-transaction.example.com';

      const builder = new UrlBuilder({});

      expect(builder.getBaseUrl('onboarding')).toBe('https://env-ledger.example.com');
      expect(builder.getBaseUrl('transaction')).toBe('https://env-ledger.example.com');
    });

    it('still honours the deprecated env vars when MIDAZ_LEDGER_URL is absent', () => {
      process.env.MIDAZ_ONBOARDING_URL = 'https://env-onboarding.example.com';
      process.env.MIDAZ_TRANSACTION_URL = 'https://env-transaction.example.com';

      const builder = new UrlBuilder({});

      expect(builder.getBaseUrl('onboarding')).toBe('https://env-onboarding.example.com');
      expect(builder.getBaseUrl('transaction')).toBe('https://env-transaction.example.com');
    });

    it('lets a ledger key from config beat MIDAZ_LEDGER_URL', () => {
      process.env.MIDAZ_LEDGER_URL = 'https://env-ledger.example.com';

      const builder = new UrlBuilder({ baseUrls: { ledger: 'https://config-ledger.example.com' } });

      expect(builder.getBaseUrl('ledger')).toBe('https://config-ledger.example.com');
      expect(builder.getBaseUrl('accounts')).toBe('https://config-ledger.example.com');
    });

    it('lets an onboarding key from config beat MIDAZ_ONBOARDING_URL', () => {
      process.env.MIDAZ_ONBOARDING_URL = 'https://env-onboarding.example.com';

      const builder = new UrlBuilder({
        baseUrls: { onboarding: 'https://config-onboarding.example.com' },
      });

      expect(builder.getBaseUrl('onboarding')).toBe('https://config-onboarding.example.com');
    });

    it('lets a transaction key from config beat MIDAZ_TRANSACTION_URL', () => {
      process.env.MIDAZ_TRANSACTION_URL = 'https://env-transaction.example.com';

      const builder = new UrlBuilder({
        baseUrls: { transaction: 'https://config-transaction.example.com' },
      });

      expect(builder.getBaseUrl('transaction')).toBe('https://config-transaction.example.com');
    });

    it('still applies MIDAZ_LEDGER_URL when the caller configured no ledger key', () => {
      process.env.MIDAZ_LEDGER_URL = 'https://env-ledger.example.com';

      const builder = new UrlBuilder({});

      expect(builder.getBaseUrl('ledger')).toBe('https://env-ledger.example.com');
    });
  });

  describe('deprecation warning', () => {
    it('warns once through the logger when a supplied legacy key resolves a request', () => {
      const warn = jest.spyOn(getLogger('url-builder'), 'warn').mockImplementation(() => undefined);

      const builder = new UrlBuilder({
        baseUrls: { onboarding: 'https://onboarding.example.com' },
      });
      builder.getBaseUrl('onboarding');
      builder.getBaseUrl('accounts');

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toMatch(/deprecated/i);
    });

    it('does not warn when only the ledger key is configured', () => {
      const warn = jest.spyOn(getLogger('url-builder'), 'warn').mockImplementation(() => undefined);

      const builder = new UrlBuilder({ baseUrls: { ledger: 'https://ledger.example.com' } });
      builder.getBaseUrl('onboarding');

      expect(warn).not.toHaveBeenCalled();
    });

    it('does not warn when the legacy defaults were never supplied by the caller', () => {
      const warn = jest.spyOn(getLogger('url-builder'), 'warn').mockImplementation(() => undefined);

      const builder = new UrlBuilder({});
      builder.getBaseUrl('onboarding');

      expect(warn).not.toHaveBeenCalled();
    });
  });
});

describe('UrlBuilder asset-rate paths', () => {
  const orgId = 'ORG';
  const ledgerId = 'LEDGER';
  const prefix = `https://ledger.example.com/v1/organizations/${orgId}/ledgers/${ledgerId}`;
  const savedEnv: Record<string, string | undefined> = {};
  let builder: UrlBuilder;

  beforeEach(() => {
    for (const key of LEGACY_ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
    builder = new UrlBuilder({ baseUrls: { ledger: 'https://ledger.example.com' } });
  });

  afterEach(() => {
    for (const key of LEGACY_ENV_KEYS) {
      if (savedEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedEnv[key];
      }
    }
  });

  it('builds the versioned asset-rates collection path', () => {
    expect(builder.buildAssetRateUrl(orgId, ledgerId)).toBe(`${prefix}/asset-rates`);
  });

  it('builds the versioned from-asset-code path', () => {
    expect(builder.buildAssetRateFromUrl(orgId, ledgerId, 'BRL')).toBe(
      `${prefix}/asset-rates/from/BRL`
    );
  });

  it('builds the versioned external-id path', () => {
    expect(builder.buildAssetRateByExternalIdUrl(orgId, ledgerId, 'EXTERNAL')).toBe(
      `${prefix}/asset-rates/EXTERNAL`
    );
  });
});

describe('UrlBuilder transaction create variants', () => {
  const orgId = 'ORG';
  const ledgerId = 'LEDGER';
  const prefix = `https://ledger.example.com/v1/organizations/${orgId}/ledgers/${ledgerId}`;
  const savedEnv: Record<string, string | undefined> = {};
  let builder: UrlBuilder;

  beforeEach(() => {
    for (const key of LEGACY_ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
    builder = new UrlBuilder({ baseUrls: { ledger: 'https://ledger.example.com' } });
  });

  afterEach(() => {
    for (const key of LEGACY_ENV_KEYS) {
      if (savedEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedEnv[key];
      }
    }
  });

  it('keeps the json path for the legacy boolean create flag', () => {
    expect(builder.buildTransactionUrl(orgId, ledgerId, undefined, true)).toBe(
      `${prefix}/transactions/json`
    );
  });

  it('builds the inflow path', () => {
    expect(builder.buildTransactionUrl(orgId, ledgerId, undefined, 'inflow')).toBe(
      `${prefix}/transactions/inflow`
    );
  });

  it('builds the outflow path', () => {
    expect(builder.buildTransactionUrl(orgId, ledgerId, undefined, 'outflow')).toBe(
      `${prefix}/transactions/outflow`
    );
  });

  it('builds the block path', () => {
    expect(builder.buildTransactionUrl(orgId, ledgerId, undefined, 'block')).toBe(
      `${prefix}/transactions/block`
    );
  });

  it('builds the unblock path', () => {
    expect(builder.buildTransactionUrl(orgId, ledgerId, undefined, 'unblock')).toBe(
      `${prefix}/transactions/unblock`
    );
  });

  it('builds the annotation path', () => {
    expect(builder.buildTransactionUrl(orgId, ledgerId, undefined, 'annotation')).toBe(
      `${prefix}/transactions/annotation`
    );
  });

  it('builds the collection path when no variant is asked for', () => {
    expect(builder.buildTransactionUrl(orgId, ledgerId)).toBe(`${prefix}/transactions`);
  });
});

describe('UrlBuilder alias and external account lookups', () => {
  const orgId = 'ORG';
  const ledgerId = 'LEDGER';
  const prefix = `https://ledger.example.com/v1/organizations/${orgId}/ledgers/${ledgerId}`;
  const alias = 'probe@lerian:acct_a';
  const savedEnv: Record<string, string | undefined> = {};
  let builder: UrlBuilder;

  beforeEach(() => {
    for (const key of LEGACY_ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
    builder = new UrlBuilder({ baseUrls: { ledger: 'https://ledger.example.com' } });
  });

  afterEach(() => {
    for (const key of LEGACY_ENV_KEYS) {
      if (savedEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedEnv[key];
      }
    }
  });

  it('places the alias on the wire verbatim, never percent-encoded', () => {
    const url = builder.buildAccountByAliasUrl(orgId, ledgerId, alias);

    expect(url).toBe(`${prefix}/accounts/alias/probe@lerian:acct_a`);
    expect(url.endsWith(`/accounts/alias/${alias}`)).toBe(true);
    expect(url).not.toContain(encodeURIComponent(alias));
    expect(url).not.toContain('%');
  });

  it('places the alias verbatim on the balances variant too', () => {
    const url = builder.buildAccountAliasBalancesUrl(orgId, ledgerId, alias);

    expect(url).toBe(`${prefix}/accounts/alias/probe@lerian:acct_a/balances`);
    expect(url).not.toContain(encodeURIComponent(alias));
    expect(url).not.toContain('%');
  });

  it('builds the external account path from the bare asset code', () => {
    expect(builder.buildExternalAccountUrl(orgId, ledgerId, 'BRL')).toBe(
      `${prefix}/accounts/external/BRL`
    );
  });

  it('builds the external account balances path from the bare asset code', () => {
    expect(builder.buildExternalAccountBalancesUrl(orgId, ledgerId, 'BRL')).toBe(
      `${prefix}/accounts/external/BRL/balances`
    );
  });

  it('preserves the asset code case the caller passed', () => {
    expect(builder.buildExternalAccountUrl(orgId, ledgerId, 'brl')).toBe(
      `${prefix}/accounts/external/brl`
    );
  });
});

describe('UrlBuilder resource count paths', () => {
  const orgId = 'ORG';
  const ledgerId = 'LEDGER';
  const root = 'https://ledger.example.com/v1';
  const ledgerPrefix = `${root}/organizations/${orgId}/ledgers/${ledgerId}`;
  const savedEnv: Record<string, string | undefined> = {};
  let builder: UrlBuilder;

  beforeEach(() => {
    for (const key of LEGACY_ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
    builder = new UrlBuilder({ baseUrls: { ledger: 'https://ledger.example.com' } });
  });

  afterEach(() => {
    for (const key of LEGACY_ENV_KEYS) {
      if (savedEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedEnv[key];
      }
    }
  });

  it('builds the organization count path', () => {
    expect(builder.buildOrganizationCountUrl()).toBe(`${root}/organizations/metrics/count`);
  });

  it('builds the ledger settings path', () => {
    expect(builder.buildLedgerSettingsUrl(orgId, ledgerId)).toBe(`${ledgerPrefix}/settings`);
  });

  it('builds the ledger count path', () => {
    expect(builder.buildLedgerCountUrl(orgId)).toBe(
      `${root}/organizations/${orgId}/ledgers/metrics/count`
    );
  });

  it('builds the ledger-scoped count paths', () => {
    expect(builder.buildAccountCountUrl(orgId, ledgerId)).toBe(
      `${ledgerPrefix}/accounts/metrics/count`
    );
    expect(builder.buildAssetCountUrl(orgId, ledgerId)).toBe(
      `${ledgerPrefix}/assets/metrics/count`
    );
    expect(builder.buildPortfolioCountUrl(orgId, ledgerId)).toBe(
      `${ledgerPrefix}/portfolios/metrics/count`
    );
    expect(builder.buildSegmentCountUrl(orgId, ledgerId)).toBe(
      `${ledgerPrefix}/segments/metrics/count`
    );
    expect(builder.buildTransactionCountUrl(orgId, ledgerId)).toBe(
      `${ledgerPrefix}/transactions/metrics/count`
    );
  });
});

describe('UrlBuilder per-account balance and history paths', () => {
  const orgId = 'ORG';
  const ledgerId = 'LEDGER';
  const accountId = 'ACCOUNT';
  const balanceId = 'BALANCE';
  const root = 'https://ledger.example.com/v1';
  const ledgerPrefix = `${root}/organizations/${orgId}/ledgers/${ledgerId}`;
  const savedEnv: Record<string, string | undefined> = {};
  let builder: UrlBuilder;

  beforeEach(() => {
    for (const key of LEGACY_ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
    builder = new UrlBuilder({ baseUrls: { ledger: 'https://ledger.example.com' } });
  });

  afterEach(() => {
    for (const key of LEGACY_ENV_KEYS) {
      if (savedEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedEnv[key];
      }
    }
  });

  it('builds the per-account balance collection path', () => {
    expect(builder.buildAccountBalanceUrl(orgId, ledgerId, accountId)).toBe(
      `${ledgerPrefix}/accounts/${accountId}/balances`
    );
  });

  it('builds the per-account balance history path', () => {
    expect(builder.buildAccountBalanceHistoryUrl(orgId, ledgerId, accountId)).toBe(
      `${ledgerPrefix}/accounts/${accountId}/balances/history`
    );
  });

  it('builds the single-balance history path', () => {
    expect(builder.buildBalanceHistoryUrl(orgId, ledgerId, balanceId)).toBe(
      `${ledgerPrefix}/balances/${balanceId}/history`
    );
  });
});
