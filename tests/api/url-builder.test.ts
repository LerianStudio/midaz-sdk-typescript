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

    it('lets MIDAZ_LEDGER_URL override a ledger key from config', () => {
      process.env.MIDAZ_LEDGER_URL = 'https://env-ledger.example.com';

      const builder = new UrlBuilder({ baseUrls: { ledger: 'https://config-ledger.example.com' } });

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
