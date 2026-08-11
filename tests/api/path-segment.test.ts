import { assertPathSegment } from '../../src/api/path-segment';
import { ErrorCategory, MidazError } from '../../src/util/error';

describe('assertPathSegment', () => {
  const legitimate = ['probe@lerian:acct_a', 'acct_a', 'team-ops', 'BRL', 'brl', 'a'.repeat(200)];

  it.each(legitimate)('accepts the legitimate segment %p', (value) => {
    expect(() => assertPathSegment('alias', value)).not.toThrow();
  });

  const rejected: [string, string][] = [
    ['a path separator', 'acct/../admin'],
    ['a bare traversal', '..'],
    ['a backslash', 'acct\\admin'],
    ['a query separator', 'acct?limit=1'],
    ['a fragment separator', 'acct#frag'],
    ['an external alias carrying its own route separator', '@external/BRL'],
  ];

  it.each(rejected)('refuses %s: %p', (_reason, value) => {
    expect(() => assertPathSegment('alias', value)).toThrow(MidazError);
  });

  it('names the offending parameter in the refusal', () => {
    expect(() => assertPathSegment('assetCode', 'BRL/../USD')).toThrow(/assetCode/);
    expect(() => assertPathSegment('alias', 'a/b')).toThrow(/alias/);
  });

  it('raises a validation error, not an internal one', () => {
    let raised: MidazError | undefined;

    try {
      assertPathSegment('alias', 'a?b');
    } catch (error) {
      raised = error as MidazError;
    }

    expect(raised?.category).toBe(ErrorCategory.VALIDATION);
    expect(raised?.statusCode).toBe(400);
  });

  it('keeps the alias charset the ledger itself allows', () => {
    for (const value of ['a@b', 'a:b', 'a_b', 'a-b', 'A0']) {
      expect(() => assertPathSegment('alias', value)).not.toThrow();
    }
  });
});
