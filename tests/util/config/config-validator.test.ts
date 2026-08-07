/**
 * Tests for ConfigValidator, focused on the unified `ledger` base URL key.
 */

import { ConfigValidator } from '../../../src/util/config/config-validator';
import { MidazConfig } from '../../../src/client';

const configWith = (baseUrls: Record<string, string>): MidazConfig => ({ baseUrls }) as MidazConfig;

describe('ConfigValidator base URL validation', () => {
  const savedNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (savedNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = savedNodeEnv;
    }
  });

  it('accepts a configuration whose only base URL is the ledger', () => {
    const result = ConfigValidator.validate(configWith({ ledger: 'https://ledger.example.com' }));

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects a malformed ledger URL naming the ledger field', () => {
    const result = ConfigValidator.validate(configWith({ ledger: 'not-a-url' }));

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'baseUrls.ledger',
      message: 'Invalid URL format',
      value: 'not-a-url',
    });
  });

  it('rejects a ledger URL that does not speak HTTP or HTTPS', () => {
    const result = ConfigValidator.validate(configWith({ ledger: 'ftp://ledger.example.com' }));

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'baseUrls.ledger',
      message: 'URL must use HTTP or HTTPS protocol',
      value: 'ftp://ledger.example.com',
    });
  });

  it('warns about a localhost ledger in production without failing validation', () => {
    process.env.NODE_ENV = 'production';

    const result = ConfigValidator.validate(configWith({ ledger: 'http://localhost:3002' }));

    expect(result.valid).toBe(true);
    expect(result.warnings.map((warning) => warning.field)).toContain('baseUrls.ledger');
  });

  it('reports a malformed ledger URL alongside a malformed legacy URL', () => {
    const result = ConfigValidator.validate(
      configWith({ ledger: 'not-a-url', onboarding: 'also-not-a-url' })
    );

    expect(result.errors.map((error) => error.field).sort()).toEqual([
      'baseUrls.ledger',
      'baseUrls.onboarding',
    ]);
  });

  it('still requires at least one base URL', () => {
    const result = ConfigValidator.validate(configWith({}));

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'baseUrls',
      message: 'At least one base URL must be provided (ledger, onboarding or transaction)',
    });
  });
});
