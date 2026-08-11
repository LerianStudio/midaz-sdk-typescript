import { UrlBuilder } from '../../src/api/url-builder';
import { MidazError } from '../../src/util/error';

const BASE_URL = 'http://ledger.test';
const ENV_KEYS = ['MIDAZ_LEDGER_URL', 'MIDAZ_ONBOARDING_URL', 'MIDAZ_TRANSACTION_URL'];

const SAFE = 'SAFE';

/**
 * Values that re-target the request rather than address a resource. The traversal one is
 * the proven escape: interpolated raw it normalises to a path outside the intended route.
 */
const POISONS: [string, string][] = [
  ['a traversal', '../../../../evil'],
  ['a query separator', 'x?limit=1'],
  ['a fragment separator', 'x#frag'],
];

type BuilderMethod = (...args: string[]) => string;

/**
 * Names of the parameters a builder declares up to its first defaulted one, read off the
 * function itself so a builder added later is swept without anyone remembering to list it.
 */
function declaredParameters(fn: (...args: never[]) => unknown): string[] {
  const source = fn.toString();
  const open = source.indexOf('(');

  let depth = 0;
  let close = -1;

  for (let index = open; index < source.length; index += 1) {
    if (source[index] === '(') {
      depth += 1;
    } else if (source[index] === ')') {
      depth -= 1;
      if (depth === 0) {
        close = index;
        break;
      }
    }
  }

  return source
    .slice(open + 1, close)
    .split(',')
    .map((parameter) => parameter.trim().split(/[=:]/)[0].trim())
    .filter((parameter) => parameter.length > 0)
    .slice(0, fn.length);
}

const builderNames = Object.getOwnPropertyNames(UrlBuilder.prototype).filter((name) =>
  /^build.*Url$/.test(name)
);

interface SweepCase {
  method: string;
  parameter: string;
  index: number;
  arity: number;
}

const sweepCases: SweepCase[] = builderNames.flatMap((method) => {
  const fn = (UrlBuilder.prototype as unknown as Record<string, BuilderMethod>)[method];
  const parameters = declaredParameters(fn);

  return parameters.map((parameter, index) => ({
    method,
    parameter,
    index,
    arity: parameters.length,
  }));
});

describe('UrlBuilder refuses a segment that re-targets the path', () => {
  const savedEnv: Record<string, string | undefined> = {};
  let builder: UrlBuilder;

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
    builder = new UrlBuilder({ baseUrls: { ledger: BASE_URL } });
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedEnv[key];
      }
    }
  });

  it('sweeps every public builder the class exposes', () => {
    expect(builderNames.length).toBeGreaterThanOrEqual(31);
    expect(sweepCases.length).toBeGreaterThanOrEqual(builderNames.length);
  });

  it('reads a parameter name for every swept position', () => {
    const unnamed = sweepCases.filter(({ parameter }) => !/^[A-Za-z_$][\w$]*$/.test(parameter));

    expect(unnamed).toEqual([]);
  });

  const invocations = sweepCases.flatMap((sweepCase) =>
    POISONS.map(
      ([reason, poison]) =>
        [
          `${sweepCase.method} refuses ${reason} in ${sweepCase.parameter}`,
          sweepCase,
          poison,
        ] as const
    )
  );

  it.each(invocations)('%s', (_title, sweepCase, poison) => {
    const args = new Array<string>(sweepCase.arity).fill(SAFE);
    args[sweepCase.index] = poison;

    const invoke = () =>
      (builder as unknown as Record<string, BuilderMethod>)[sweepCase.method].apply(builder, args);

    expect(invoke).toThrow(MidazError);
    expect(invoke).toThrow(new RegExp(sweepCase.parameter));
  });

  it('refuses the traversal before it can produce a url at all', () => {
    let built: string | undefined;

    try {
      built = builder.buildAssetUrl('../../../../evil', 'L');
    } catch {
      built = undefined;
    }

    expect(built).toBeUndefined();
  });
});
