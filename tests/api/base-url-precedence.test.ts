/**
 * Precedence contract between the unified `ledger` base URL and the deprecated
 * `onboarding` / `transaction` keys.
 */

import { UrlBuilder } from '../../src/api/url-builder';
import { loadBuilderModule } from '../support/load-builder-module';

const URL_ENV_KEYS = ['MIDAZ_LEDGER_URL', 'MIDAZ_ONBOARDING_URL', 'MIDAZ_TRANSACTION_URL'];

describe('base URL precedence', () => {
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of URL_ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of URL_ENV_KEYS) {
      if (savedEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedEnv[key];
      }
    }
  });

  describe('an explicit legacy key wins for its own service family', () => {
    it('routes asset rates through the configured transaction URL', () => {
      const builder = new UrlBuilder({
        baseUrls: {
          ledger: 'https://ledger.example.com',
          transaction: 'https://transaction.example.com',
        },
      });

      expect(builder.getBaseUrl('asset-rates')).toBe('https://transaction.example.com');
      expect(builder.buildAssetRateUrl('ORG', 'LED')).toBe(
        'https://transaction.example.com/v1/organizations/ORG/ledgers/LED/asset-rates'
      );
    });

    it('routes onboarding-family services through the configured onboarding URL', () => {
      const builder = new UrlBuilder({
        baseUrls: {
          ledger: 'https://ledger.example.com',
          onboarding: 'https://onboarding.example.com',
        },
      });

      expect(builder.getBaseUrl('accounts')).toBe('https://onboarding.example.com');
      expect(builder.getBaseUrl('balances')).toBe('https://ledger.example.com');
    });
  });

  describe('a back-filled default never shadows an explicit ledger URL', () => {
    it('keeps transaction-family calls on the ledger host when only a legacy onboarding var is set', () => {
      process.env.MIDAZ_LEDGER_URL = 'https://midaz.acme.com';
      process.env.MIDAZ_ONBOARDING_URL = 'https://onboarding.acme.com';

      const config = loadBuilderModule().createProductionConfig('v1').build();

      expect(config.baseUrls).toEqual({
        onboarding: 'https://onboarding.acme.com',
        ledger: 'https://midaz.acme.com',
      });

      for (const key of URL_ENV_KEYS) {
        delete process.env[key];
      }
      const builder = new UrlBuilder(config);

      expect(builder.buildTransactionUrl('ORG', 'LED')).toBe(
        'https://midaz.acme.com/v1/organizations/ORG/ledgers/LED/transactions'
      );
      expect(builder.buildBalanceUrl('ORG', 'LED')).toBe(
        'https://midaz.acme.com/v1/organizations/ORG/ledgers/LED/balances'
      );
      expect(builder.buildOrganizationUrl()).toBe('https://onboarding.acme.com/v1/organizations');
    });

    it('keeps asset rates on the configured transaction host instead of a default ledger', () => {
      process.env.MIDAZ_TRANSACTION_URL = 'https://tx.prod.example';

      const config = loadBuilderModule().createProductionConfig('v1').build();

      for (const key of URL_ENV_KEYS) {
        delete process.env[key];
      }
      const builder = new UrlBuilder(config);

      expect(builder.buildAssetRateUrl('ORG', 'LED')).toBe(
        'https://tx.prod.example/v1/organizations/ORG/ledgers/LED/asset-rates'
      );
    });

    it('serves every service from MIDAZ_LEDGER_URL when it is the only URL variable', () => {
      process.env.MIDAZ_LEDGER_URL = 'https://midaz.acme.com';

      const config = loadBuilderModule().createProductionConfig('v1').build();

      expect(config.baseUrls).toEqual({ ledger: 'https://midaz.acme.com' });
    });
  });
});
