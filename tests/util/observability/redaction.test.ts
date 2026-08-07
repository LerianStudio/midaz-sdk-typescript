import { REDACTED, redactAliasInUrl } from '../../../src/util/observability/redaction';

describe('redactAliasInUrl', () => {
  const prefix = 'https://ledger.test/v1/organizations/ORG/ledgers/LEDGER';

  it('withholds the alias of an account lookup', () => {
    expect(redactAliasInUrl(`${prefix}/accounts/alias/team@lerian:ops`)).toBe(
      `${prefix}/accounts/alias/${REDACTED}`
    );
  });

  it('withholds the alias of the balances variant and keeps the tail', () => {
    expect(redactAliasInUrl(`${prefix}/accounts/alias/team@lerian:ops/balances`)).toBe(
      `${prefix}/accounts/alias/${REDACTED}/balances`
    );
  });

  it('withholds an alias that carries an email', () => {
    expect(redactAliasInUrl(`${prefix}/accounts/alias/ana.pires@lerian.studio`)).not.toContain(
      'lerian.studio'
    );
  });

  it('leaves a URL without an alias segment alone', () => {
    const untouched = `${prefix}/accounts/external/BRL/balances`;

    expect(redactAliasInUrl(untouched)).toBe(untouched);
  });

  it('leaves an account-by-id lookup alone', () => {
    const untouched = `${prefix}/accounts/019fda19-97cd-7b29-b90a-c962df8bbdc7`;

    expect(redactAliasInUrl(untouched)).toBe(untouched);
  });
});
