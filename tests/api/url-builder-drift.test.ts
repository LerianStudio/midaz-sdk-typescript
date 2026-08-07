import { readFileSync } from 'fs';
import { join } from 'path';

import { parse } from 'yaml';

import { UrlBuilder } from '../../src/api/url-builder';
import { buildSpecPathIndex, normalizePath } from '../support/spec-templates';

const SPEC_PATH = join(__dirname, '..', '..', 'spec', 'ledger-v1.openapi.yaml');
const BASE_URL = 'http://ledger.test';
const ENV_KEYS = ['MIDAZ_LEDGER_URL', 'MIDAZ_ONBOARDING_URL', 'MIDAZ_TRANSACTION_URL'];
const SERVED = 'served by the ledger v1 spec';

const ORG = 'SENTINEL_ORG';
const LEDGER = 'SENTINEL_LEDGER';
const ACCOUNT = 'SENTINEL_ACCOUNT';
const TRANSACTION = 'SENTINEL_TRANSACTION';
const OPERATION = 'SENTINEL_OPERATION';
const ASSET = 'SENTINEL_ASSET';
const ASSET_CODE = 'SENTINEL_ASSET_CODE';
const ALIAS = 'SENTINEL_ALIAS';
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

const normalize = normalizePath;

const specIndex = buildSpecPathIndex(spec.paths ?? {});
const specTemplates = specIndex.templates;
const specVerbs = specIndex.verbs;

interface BuilderCase {
  method: string;
  verbs: string[];
  build: (builder: UrlBuilder) => string;
}

const COLLECTION_VERBS = ['get', 'post'];
const ITEM_VERBS = ['get', 'patch', 'delete'];

const builderCases: BuilderCase[] = [
  {
    method: 'buildOrganizationUrl',
    verbs: COLLECTION_VERBS,
    build: (b) => b.buildOrganizationUrl(),
  },
  { method: 'buildOrganizationUrl', verbs: ITEM_VERBS, build: (b) => b.buildOrganizationUrl(ORG) },
  { method: 'buildLedgerUrl', verbs: COLLECTION_VERBS, build: (b) => b.buildLedgerUrl(ORG) },
  { method: 'buildLedgerUrl', verbs: ITEM_VERBS, build: (b) => b.buildLedgerUrl(ORG, LEDGER) },
  {
    method: 'buildAccountUrl',
    verbs: COLLECTION_VERBS,
    build: (b) => b.buildAccountUrl(ORG, LEDGER),
  },
  {
    method: 'buildAccountUrl',
    verbs: ITEM_VERBS,
    build: (b) => b.buildAccountUrl(ORG, LEDGER, ACCOUNT),
  },
  {
    method: 'buildAccountByAliasUrl',
    verbs: ['get'],
    build: (b) => b.buildAccountByAliasUrl(ORG, LEDGER, ALIAS),
  },
  {
    method: 'buildAccountAliasBalancesUrl',
    verbs: ['get'],
    build: (b) => b.buildAccountAliasBalancesUrl(ORG, LEDGER, ALIAS),
  },
  {
    method: 'buildExternalAccountUrl',
    verbs: ['get'],
    build: (b) => b.buildExternalAccountUrl(ORG, LEDGER, ASSET_CODE),
  },
  {
    method: 'buildExternalAccountBalancesUrl',
    verbs: ['get'],
    build: (b) => b.buildExternalAccountBalancesUrl(ORG, LEDGER, ASSET_CODE),
  },
  { method: 'buildAssetUrl', verbs: COLLECTION_VERBS, build: (b) => b.buildAssetUrl(ORG, LEDGER) },
  {
    method: 'buildAssetUrl',
    verbs: ITEM_VERBS,
    build: (b) => b.buildAssetUrl(ORG, LEDGER, ASSET),
  },
  {
    method: 'buildTransactionUrl',
    verbs: ['get'],
    build: (b) => b.buildTransactionUrl(ORG, LEDGER),
  },
  {
    method: 'buildTransactionUrl',
    verbs: ['post'],
    build: (b) => b.buildTransactionUrl(ORG, LEDGER, undefined, true),
  },
  {
    method: 'buildTransactionUrl',
    verbs: ['post'],
    build: (b) => b.buildTransactionUrl(ORG, LEDGER, undefined, 'inflow'),
  },
  {
    method: 'buildTransactionUrl',
    verbs: ['post'],
    build: (b) => b.buildTransactionUrl(ORG, LEDGER, undefined, 'outflow'),
  },
  {
    method: 'buildTransactionUrl',
    verbs: ['post'],
    build: (b) => b.buildTransactionUrl(ORG, LEDGER, undefined, 'block'),
  },
  {
    method: 'buildTransactionUrl',
    verbs: ['post'],
    build: (b) => b.buildTransactionUrl(ORG, LEDGER, undefined, 'unblock'),
  },
  {
    method: 'buildTransactionUrl',
    verbs: ['post'],
    build: (b) => b.buildTransactionUrl(ORG, LEDGER, undefined, 'annotation'),
  },
  {
    method: 'buildTransactionUrl',
    verbs: ['get'],
    build: (b) => b.buildTransactionUrl(ORG, LEDGER, TRANSACTION),
  },
  {
    method: 'buildTransactionUrl',
    verbs: ['post'],
    build: (b) => b.buildTransactionUrl(ORG, LEDGER, TRANSACTION, false, 'commit'),
  },
  {
    method: 'buildTransactionUrl',
    verbs: ['post'],
    build: (b) => b.buildTransactionUrl(ORG, LEDGER, TRANSACTION, false, 'cancel'),
  },
  {
    method: 'buildTransactionUrl',
    verbs: ['post'],
    build: (b) => b.buildTransactionUrl(ORG, LEDGER, TRANSACTION, false, 'revert'),
  },
  { method: 'buildAssetRateUrl', verbs: ['put'], build: (b) => b.buildAssetRateUrl(ORG, LEDGER) },
  {
    method: 'buildAssetRateFromUrl',
    verbs: ['get'],
    build: (b) => b.buildAssetRateFromUrl(ORG, LEDGER, ASSET_CODE),
  },
  {
    method: 'buildAssetRateByExternalIdUrl',
    verbs: ['get'],
    build: (b) => b.buildAssetRateByExternalIdUrl(ORG, LEDGER, EXTERNAL_ID),
  },
  { method: 'buildBalanceUrl', verbs: ['get'], build: (b) => b.buildBalanceUrl(ORG, LEDGER) },
  {
    method: 'buildBalanceUrl',
    verbs: ITEM_VERBS,
    build: (b) => b.buildBalanceUrl(ORG, LEDGER, BALANCE),
  },
  {
    method: 'buildAccountOperationUrl',
    verbs: ['get'],
    build: (b) => b.buildAccountOperationUrl(ORG, LEDGER, ACCOUNT),
  },
  {
    method: 'buildAccountOperationUrl',
    verbs: ['get'],
    build: (b) => b.buildAccountOperationUrl(ORG, LEDGER, ACCOUNT, OPERATION),
  },
  {
    method: 'buildTransactionOperationUrl',
    verbs: ['patch'],
    build: (b) => b.buildTransactionOperationUrl(ORG, LEDGER, TRANSACTION, OPERATION),
  },
  {
    method: 'buildPortfolioUrl',
    verbs: COLLECTION_VERBS,
    build: (b) => b.buildPortfolioUrl(ORG, LEDGER),
  },
  {
    method: 'buildPortfolioUrl',
    verbs: ITEM_VERBS,
    build: (b) => b.buildPortfolioUrl(ORG, LEDGER, PORTFOLIO),
  },
  {
    method: 'buildSegmentUrl',
    verbs: COLLECTION_VERBS,
    build: (b) => b.buildSegmentUrl(ORG, LEDGER),
  },
  {
    method: 'buildSegmentUrl',
    verbs: ITEM_VERBS,
    build: (b) => b.buildSegmentUrl(ORG, LEDGER, SEGMENT),
  },
  {
    method: 'buildAccountTypeUrl',
    verbs: COLLECTION_VERBS,
    build: (b) => b.buildAccountTypeUrl(ORG, LEDGER),
  },
  {
    method: 'buildAccountTypeUrl',
    verbs: ITEM_VERBS,
    build: (b) => b.buildAccountTypeUrl(ORG, LEDGER, ACCOUNT_TYPE),
  },
  {
    method: 'buildOperationRouteUrl',
    verbs: COLLECTION_VERBS,
    build: (b) => b.buildOperationRouteUrl(ORG, LEDGER),
  },
  {
    method: 'buildOperationRouteUrl',
    verbs: ITEM_VERBS,
    build: (b) => b.buildOperationRouteUrl(ORG, LEDGER, OPERATION_ROUTE),
  },
  {
    method: 'buildTransactionRouteUrl',
    verbs: COLLECTION_VERBS,
    build: (b) => b.buildTransactionRouteUrl(ORG, LEDGER),
  },
  {
    method: 'buildTransactionRouteUrl',
    verbs: ITEM_VERBS,
    build: (b) => b.buildTransactionRouteUrl(ORG, LEDGER, TRANSACTION_ROUTE),
  },
];

/**
 * Spec paths at least one builder reaches today. Phases 2-4 widen this list;
 * a shrinking list means a builder drifted off the contract.
 */
const COVERED_SPEC_PATHS = [
  '/organizations',
  '/organizations/{id}',
  '/organizations/{organization_id}/ledgers',
  '/organizations/{organization_id}/ledgers/{ledger_id}',
  '/organizations/{organization_id}/ledgers/{ledger_id}/account-types',
  '/organizations/{organization_id}/ledgers/{ledger_id}/account-types/{id}',
  '/organizations/{organization_id}/ledgers/{ledger_id}/accounts',
  '/organizations/{organization_id}/ledgers/{ledger_id}/accounts/alias/{alias}',
  '/organizations/{organization_id}/ledgers/{ledger_id}/accounts/alias/{alias}/balances',
  '/organizations/{organization_id}/ledgers/{ledger_id}/accounts/external/{code}',
  '/organizations/{organization_id}/ledgers/{ledger_id}/accounts/external/{code}/balances',
  '/organizations/{organization_id}/ledgers/{ledger_id}/accounts/{account_id}/operations',
  '/organizations/{organization_id}/ledgers/{ledger_id}/accounts/{account_id}/operations/{operation_id}',
  '/organizations/{organization_id}/ledgers/{ledger_id}/accounts/{id}',
  '/organizations/{organization_id}/ledgers/{ledger_id}/asset-rates',
  '/organizations/{organization_id}/ledgers/{ledger_id}/asset-rates/from/{asset_code}',
  '/organizations/{organization_id}/ledgers/{ledger_id}/asset-rates/{external_id}',
  '/organizations/{organization_id}/ledgers/{ledger_id}/assets',
  '/organizations/{organization_id}/ledgers/{ledger_id}/assets/{id}',
  '/organizations/{organization_id}/ledgers/{ledger_id}/balances',
  '/organizations/{organization_id}/ledgers/{ledger_id}/balances/{balance_id}',
  '/organizations/{organization_id}/ledgers/{ledger_id}/operation-routes',
  '/organizations/{organization_id}/ledgers/{ledger_id}/operation-routes/{operation_route_id}',
  '/organizations/{organization_id}/ledgers/{ledger_id}/portfolios',
  '/organizations/{organization_id}/ledgers/{ledger_id}/portfolios/{id}',
  '/organizations/{organization_id}/ledgers/{ledger_id}/segments',
  '/organizations/{organization_id}/ledgers/{ledger_id}/segments/{id}',
  '/organizations/{organization_id}/ledgers/{ledger_id}/transaction-routes',
  '/organizations/{organization_id}/ledgers/{ledger_id}/transaction-routes/{transaction_route_id}',
  '/organizations/{organization_id}/ledgers/{ledger_id}/transactions',
  '/organizations/{organization_id}/ledgers/{ledger_id}/transactions/annotation',
  '/organizations/{organization_id}/ledgers/{ledger_id}/transactions/block',
  '/organizations/{organization_id}/ledgers/{ledger_id}/transactions/inflow',
  '/organizations/{organization_id}/ledgers/{ledger_id}/transactions/json',
  '/organizations/{organization_id}/ledgers/{ledger_id}/transactions/outflow',
  '/organizations/{organization_id}/ledgers/{ledger_id}/transactions/unblock',
  '/organizations/{organization_id}/ledgers/{ledger_id}/transactions/{transaction_id}',
  '/organizations/{organization_id}/ledgers/{ledger_id}/transactions/{transaction_id}/cancel',
  '/organizations/{organization_id}/ledgers/{ledger_id}/transactions/{transaction_id}/commit',
  '/organizations/{organization_id}/ledgers/{ledger_id}/transactions/{transaction_id}/operations/{operation_id}',
  '/organizations/{organization_id}/ledgers/{ledger_id}/transactions/{transaction_id}/revert',
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

  it('reduces every spec path to a template of its own', () => {
    const collapsed = [...specIndex.collisions.entries()].map(
      ([template, paths]) => `${template} <- ${paths.join(' , ')}`
    );

    expect(collapsed).toEqual([]);
    expect(specTemplates.size).toBe(specPaths.length);
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

  it.each(builderCases.map((testCase) => [testCase.method, testCase] as const))(
    '%s builds a path the ledger spec serves under every verb the SDK issues',
    (_method, testCase) => {
      const template = normalize(
        testCase.build(builder).slice(BASE_URL.length + specPrefix.length)
      );
      const served = specVerbs.get(template) ?? new Set<string>();
      const unserved = testCase.verbs.filter((verb) => !served.has(verb));
      const verdict = unserved.length
        ? `${template} is not served under ${unserved.join(', ').toUpperCase()} (spec serves ${[...served].sort().join(', ').toUpperCase() || 'nothing'})`
        : SERVED;

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

  it('reaches exactly the pinned set of spec paths', () => {
    const builtTemplates = new Set(
      builderCases.map((testCase) =>
        normalize(testCase.build(builder).slice(BASE_URL.length + specPrefix.length))
      )
    );
    const covered = specPaths.filter((path) => builtTemplates.has(normalize(path))).sort();

    expect(covered).toEqual(COVERED_SPEC_PATHS);
  });
});
