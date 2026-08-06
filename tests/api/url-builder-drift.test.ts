import { readFileSync } from 'fs';
import { join } from 'path';

import { parse } from 'yaml';

import { UrlBuilder } from '../../src/api/url-builder';

const SPEC_PATH = join(__dirname, '..', '..', 'spec', 'ledger-v1.openapi.yaml');
const BASE_URL = 'http://ledger.test';
const PLACEHOLDER = '{}';
const ENV_KEYS = ['MIDAZ_LEDGER_URL', 'MIDAZ_ONBOARDING_URL', 'MIDAZ_TRANSACTION_URL'];
const SERVED = 'served by the ledger v1 spec';

const ORG = 'SENTINEL_ORG';
const LEDGER = 'SENTINEL_LEDGER';
const ACCOUNT = 'SENTINEL_ACCOUNT';
const TRANSACTION = 'SENTINEL_TRANSACTION';
const OPERATION = 'SENTINEL_OPERATION';
const ASSET = 'SENTINEL_ASSET';
const ASSET_CODE = 'SENTINEL_ASSET_CODE';
const EXTERNAL_ID = 'SENTINEL_EXTERNAL_ID';
const BALANCE = 'SENTINEL_BALANCE';
const PORTFOLIO = 'SENTINEL_PORTFOLIO';
const SEGMENT = 'SENTINEL_SEGMENT';
const ACCOUNT_TYPE = 'SENTINEL_ACCOUNT_TYPE';
const OPERATION_ROUTE = 'SENTINEL_OPERATION_ROUTE';
const TRANSACTION_ROUTE = 'SENTINEL_TRANSACTION_ROUTE';

interface SpecDocument {
  servers?: { url?: string }[];
  paths?: Record<string, Record<string, unknown>>;
}

const spec = parse(readFileSync(SPEC_PATH, 'utf8')) as SpecDocument;
const specPrefix = spec.servers?.[0]?.url ?? '';
const specPaths = Object.keys(spec.paths ?? {});

function normalize(path: string): string {
  return path
    .split('/')
    .map((segment) =>
      (segment.startsWith('{') && segment.endsWith('}')) || segment.startsWith('SENTINEL_')
        ? PLACEHOLDER
        : segment
    )
    .join('/');
}

const specTemplates = new Set(specPaths.map(normalize));

interface BuilderCase {
  method: string;
  build: (builder: UrlBuilder) => string;
}

const builderCases: BuilderCase[] = [
  { method: 'buildOrganizationUrl', build: (b) => b.buildOrganizationUrl() },
  { method: 'buildOrganizationUrl', build: (b) => b.buildOrganizationUrl(ORG) },
  { method: 'buildLedgerUrl', build: (b) => b.buildLedgerUrl(ORG) },
  { method: 'buildLedgerUrl', build: (b) => b.buildLedgerUrl(ORG, LEDGER) },
  { method: 'buildAccountUrl', build: (b) => b.buildAccountUrl(ORG, LEDGER) },
  { method: 'buildAccountUrl', build: (b) => b.buildAccountUrl(ORG, LEDGER, ACCOUNT) },
  { method: 'buildAssetUrl', build: (b) => b.buildAssetUrl(ORG, LEDGER) },
  { method: 'buildAssetUrl', build: (b) => b.buildAssetUrl(ORG, LEDGER, ASSET) },
  { method: 'buildTransactionUrl', build: (b) => b.buildTransactionUrl(ORG, LEDGER) },
  {
    method: 'buildTransactionUrl',
    build: (b) => b.buildTransactionUrl(ORG, LEDGER, undefined, true),
  },
  { method: 'buildTransactionUrl', build: (b) => b.buildTransactionUrl(ORG, LEDGER, TRANSACTION) },
  { method: 'buildAssetRateUrl', build: (b) => b.buildAssetRateUrl(ORG, LEDGER) },
  {
    method: 'buildAssetRateFromUrl',
    build: (b) => b.buildAssetRateFromUrl(ORG, LEDGER, ASSET_CODE),
  },
  {
    method: 'buildAssetRateByExternalIdUrl',
    build: (b) => b.buildAssetRateByExternalIdUrl(ORG, LEDGER, EXTERNAL_ID),
  },
  { method: 'buildBalanceUrl', build: (b) => b.buildBalanceUrl(ORG, LEDGER) },
  { method: 'buildBalanceUrl', build: (b) => b.buildBalanceUrl(ORG, LEDGER, BALANCE) },
  {
    method: 'buildAccountOperationUrl',
    build: (b) => b.buildAccountOperationUrl(ORG, LEDGER, ACCOUNT),
  },
  {
    method: 'buildAccountOperationUrl',
    build: (b) => b.buildAccountOperationUrl(ORG, LEDGER, ACCOUNT, OPERATION),
  },
  {
    method: 'buildTransactionOperationUrl',
    build: (b) => b.buildTransactionOperationUrl(ORG, LEDGER, TRANSACTION, OPERATION),
  },
  { method: 'buildPortfolioUrl', build: (b) => b.buildPortfolioUrl(ORG, LEDGER) },
  { method: 'buildPortfolioUrl', build: (b) => b.buildPortfolioUrl(ORG, LEDGER, PORTFOLIO) },
  { method: 'buildSegmentUrl', build: (b) => b.buildSegmentUrl(ORG, LEDGER) },
  { method: 'buildSegmentUrl', build: (b) => b.buildSegmentUrl(ORG, LEDGER, SEGMENT) },
  { method: 'buildAccountTypeUrl', build: (b) => b.buildAccountTypeUrl(ORG, LEDGER) },
  { method: 'buildAccountTypeUrl', build: (b) => b.buildAccountTypeUrl(ORG, LEDGER, ACCOUNT_TYPE) },
  { method: 'buildOperationRouteUrl', build: (b) => b.buildOperationRouteUrl(ORG, LEDGER) },
  {
    method: 'buildOperationRouteUrl',
    build: (b) => b.buildOperationRouteUrl(ORG, LEDGER, OPERATION_ROUTE),
  },
  { method: 'buildTransactionRouteUrl', build: (b) => b.buildTransactionRouteUrl(ORG, LEDGER) },
  {
    method: 'buildTransactionRouteUrl',
    build: (b) => b.buildTransactionRouteUrl(ORG, LEDGER, TRANSACTION_ROUTE),
  },
];

describe('UrlBuilder path drift against the vendored ledger spec', () => {
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

  it('reads a spec with paths and a versioned server prefix', () => {
    expect(specPaths.length).toBeGreaterThan(0);
    expect(specPrefix).toBe('/v1');
  });

  it.each(builderCases.map((testCase) => [testCase.method, testCase] as const))(
    '%s builds a path the ledger spec serves',
    (_method, testCase) => {
      const url = testCase.build(builder);

      expect(url.startsWith(`${BASE_URL}${specPrefix}/`)).toBe(true);

      const template = normalize(url.slice(BASE_URL.length + specPrefix.length));
      const verdict = specTemplates.has(template)
        ? SERVED
        : `${template} is not a path of the ledger v1 spec`;

      expect(verdict).toBe(SERVED);
    }
  );

  it('covers every public build*Url method with at least one case', () => {
    const publicBuilders = Object.getOwnPropertyNames(UrlBuilder.prototype).filter((name) =>
      /^build.*Url$/.test(name)
    );
    const covered = new Set(builderCases.map((testCase) => testCase.method));

    expect(publicBuilders.filter((name) => !covered.has(name))).toEqual([]);
  });

  it('reports spec paths that no builder reaches yet', () => {
    const builtTemplates = new Set(
      builderCases.map((testCase) =>
        normalize(testCase.build(builder).slice(BASE_URL.length + specPrefix.length))
      )
    );
    const uncovered = specPaths.filter((path) => !builtTemplates.has(normalize(path))).sort();

    console.log(
      `UrlBuilder covers ${specPaths.length - uncovered.length}/${specPaths.length} ledger v1 spec paths. Not reachable yet:\n${uncovered.map((path) => `  ${path}`).join('\n')}`
    );

    expect(uncovered.length).toBeLessThanOrEqual(specPaths.length);
  });
});
