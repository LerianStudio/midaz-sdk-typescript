# Ledger API Parity Implementation Plan

> **For implementers:** Use ring:executing-plans (rolling wave: dispatch each
> wave — a phase or one epic, your choice — as a workflow → review → user
> checkpoint → detail the next phase against the real code → repeat),
> ring:dispatching-workflows to run each phase as a reviewed multi-agent
> workflow (review + contrarian baked in), or ring:running-dev-cycle for the
> full subagent-orchestrated workflow.
> This document is the living source of truth — task elaboration for later
> phases is written back into it during execution.

**Goal:** Bring `@lerianstudio/midaz-sdk` (TypeScript) back to parity with the Midaz ledger API on `main`, starting with a contract-drift gate so the SDK can never silently fall behind again.

**Architecture:** The ledger is now a single service exposing 72 v1 paths (+23 v2); the SDK still models two services (`onboarding`/`transaction`) and hand-writes every URL, which is how two clients ended up targeting removed or unversioned paths. The fix is layered: (1) vendor the ledger's OpenAPI spec and gate CI on path drift, (2) route ALL URL construction through `UrlBuilder` against a unified `ledger` base URL, (3) close the endpoint gaps in priority order — broken clients first, then transaction lifecycle, then lookups, then whole new domains. The hand-written ergonomic layer (builders, retry, idempotency) stays; only types and path inventory become spec-derived.

**Tech Stack:** TypeScript 5 (strict, dual CJS/ESM via three `tsc` passes), Jest 30 + ts-jest (DI-seam mocks, no fetch mocking), `openapi-typescript` (types-only codegen, new dev dependency), semantic-release (conventional commits; `develop` = beta channel), GitHub Actions CI.

**Ground truth:** Midaz `main` @ `33cb93f` (2026-08-05), spec at `components/ledger/api/openapi.huma.yaml` (v1) and `openapi.v2.huma.yaml` (v2) in the midaz repo. Gap audit verified live against a local stack on 2026-08-06: old asset-rate path → 404, ledger-level operations → 404, `X-Idempotency` contract confirmed working (SDK v2.3.0).

## Phase Overview

| Phase | Milestone | Epics | Status |
|-------|-----------|-------|--------|
| 1 | Spec vendored + drift gate in CI; unified `ledger` base URL; asset-rate and operation clients work against midaz main | 1.1, 1.2, 1.3, 1.4 | Complete (1 open decision) |
| 2 | Full transaction lifecycle: pending commit/cancel, revert, inflow/outflow, block/unblock, annotation, updates; model field parity; money-safety guards | 2.0, 2.1, 2.2, 2.3, 2.4 | Detailed |
| 3 | Account lookups (alias/external), balance history, metrics counts, ledger settings | 3.1, 3.2, 3.3 | Epic-level |
| 4 | New domains: holders/CRM, billing, encryption/protection, v2 API | 4.1, 4.2, 4.3, 4.4 | Epic-level |

**Decisions already made (apply to all phases):**

- Base URL unifies on service name **`ledger`** (single midaz service). `onboarding`/`transaction` keys and their env vars remain as deprecated aliases resolving to the same URL — no breaking change until a future major.
- All URL construction goes through `UrlBuilder`. Hand-rolled `getBaseUrl(...) + template` in clients is a defect (it is how the missing-`/v1` bug shipped).
- Monetary `value` fields are **decimal strings** on the wire. SDK accepts `string | number`, serializes to string, rejects non-finite numbers client-side.
- The request transformer must **fail loudly** on unknown input fields instead of silently dropping them.
- Types are generated from the vendored spec into `src/generated/` (types only, zero runtime code); hand-written models narrow or alias them.
- Conventional commits: endpoint additions are `feat` (minor), path fixes are `fix` (patch). No `BREAKING CHANGE` footers in Phases 1–3.

---

## Phase 1: Contract foundation and broken clients

### Epic 1.1: Vendored spec, generated types, drift gate

**Goal:** The ledger OpenAPI spec lives in this repo, TypeScript types are generated from it, and CI fails when any SDK-built path is absent from the spec.
**Scope:** `spec/` (new), `src/generated/` (new), `scripts/`, `package.json`, `.github/workflows/ci.yml`, `tests/api/`
**Dependencies:** none
**Done when:** `npm run generate:types` is reproducible; a jest drift suite proves every `UrlBuilder` path exists in the spec; CI runs both; reverting the asset-rate fix (Epic 1.3) makes the drift suite fail.
**Status:** Pending

#### Task 1.1.1: Vendor the ledger spec and generate types

- [x] Done

**Context:** The repo has zero OpenAPI tooling (confirmed by audit). Ground-truth specs live in the midaz repo at `components/ledger/api/openapi.huma.yaml` and `openapi.v2.huma.yaml`. The SDK's models (`src/models/*.ts`) are all hand-written and already drifted (e.g. no `routeId`, `transactionDate`, `skip` on transaction input).

**Elaboration finding (verified 2026-08-06, blocks the naive version of this task):** the ledger's Huma spec types **every one of its 43 request bodies** as `{type: string, format: binary}` (a `RawBody` handler artifact) — there is not one usable request schema in the file. Response bodies are fine: 92 of them resolve to real schemas across 64 components. So **input types cannot be generated** and must stay hand-written; **response types can and should be**. This makes the path-drift gate (Task 1.1.2) the primary anti-drift mechanism rather than a supporting one, since types alone would never have caught the asset-rate break.

**Implementation vision:** Create `spec/` with both YAML files copied verbatim from midaz `main`, plus `spec/VERSION` recording the midaz commit SHA (`33cb93f`) and date. Add `openapi-typescript` as a devDependency (types-only generator — no runtime, no fetch client, keeps bundlewatch's 100kb cap safe). Add scripts: `generate:types` → emits `src/generated/ledger-v1.d.ts` and `ledger-v2.d.ts`; `spec:update` → shell script `scripts/update-spec.sh <midaz-repo-path-or-ref>` that copies the files and rewrites `spec/VERSION`. Generated files are committed (build must not depend on network). Add a CI step in the existing "Lint and Format" job (`.github/workflows/ci.yml:22`) that runs `generate:types` and fails on `git diff --exit-code src/generated` — same pattern as the existing "Check for uncommitted changes" step at `ci.yml:81`. Add a header comment in `spec/VERSION` recording the binary-request-body limitation so the next reader does not re-derive it. Do NOT rewrite existing models to use the generated types yet — that migration happens opportunistically per epic (1.3 onward) to keep this task mechanical.

**Files:**
- Create: `spec/ledger-v1.openapi.yaml`, `spec/ledger-v2.openapi.yaml`, `spec/VERSION`, `scripts/update-spec.sh`, `src/generated/ledger-v1.d.ts`, `src/generated/ledger-v2.d.ts`
- Modify: `package.json` (scripts + devDependency), `.github/workflows/ci.yml`
- Test: covered by Task 1.1.2's suite (generation is verified by the CI diff check)

**Source of truth:** copy the two YAML files from a local midaz checkout at `~/workspace/midaz-smoke` (already on `main` @ `33cb93f`): `components/ledger/api/openapi.huma.yaml` → `spec/ledger-v1.openapi.yaml`, `components/ledger/api/openapi.v2.huma.yaml` → `spec/ledger-v2.openapi.yaml`.

**Verification:** `npm run generate:types && git diff --exit-code src/generated` passes; `npm run typecheck` clean; `npm run build` clean; `dist/index.js` still under the 100kb bundlewatch cap (generated files are types-only, so this must not move at all).

**Done when:** spec files, VERSION stamp, generated response types, and CI check are all in place and reproducible.

#### Task 1.1.2: Path-drift test suite over UrlBuilder

- [x] Done

**Context:** `UrlBuilder` (`src/api/url-builder.ts:11`) exposes one `buildXxxUrl` method per resource (lines 84–293). Two of them are dead code (`buildAssetRateUrl:176`, `buildOperationUrl:204`) while the corresponding clients hand-roll wrong URLs — exactly the drift class this suite must catch. After Epics 1.3/1.4 remove the hand-rolled URLs, `UrlBuilder` becomes the single choke point, so testing it covers the whole SDK surface.

**Implementation vision:** New test `tests/api/url-builder-drift.test.ts`. Parse `spec/ledger-v1.openapi.yaml` (`yaml@2.9.0` and `js-yaml@4.3.1` are already present as transitive dev deps — promote one to an explicit `devDependency` rather than relying on hoisting) into a set of path templates with `{param}` placeholders normalized. For every public `build*Url` method on `UrlBuilder`: call it with sentinel ids (`ORG`, `LEDGER`, `ID`…), strip the base URL and `/v1` prefix, replace sentinels back into `{param}` form, and assert the template is in the spec set. Table-driven: one `it.each` row per builder method, so a new builder without a spec entry fails with a readable message. Also assert the inverse direction as a **coverage report, not a failure**: log spec paths with no builder (that list IS the roadmap for Phases 2–4; failing on it would block CI forever). Prove the suite bites by mutation: temporarily point one builder at a wrong path and watch the suite go red before landing.

**Files:**
- Create: `tests/api/url-builder-drift.test.ts`
- Modify: `package.json` (yaml devDependency if needed)

**Verification:** `npx jest tests/api/url-builder-drift.test.ts` — green on the fixed builders; mutation check (wrong path in one builder) turns it red.

**Done when:** every UrlBuilder path is asserted against the spec and the suite demonstrably fails on a bogus path.

### Epic 1.2: Unified `ledger` base URL

**Goal:** One base URL (`ledger`) drives every request; legacy `onboarding`/`transaction` config keeps working as deprecated aliases.
**Scope:** `src/api/url-builder.ts`, `src/client-config-builder.ts`, `src/client.ts`, `tests/`
**Dependencies:** none (parallel-safe with 1.1)
**Done when:** `withBaseUrls({ ledger: url })` alone configures the whole SDK; legacy keys and env vars still resolve; existing tests pass unchanged.
**Status:** Pending

#### Task 1.2.1: Resolve `ledger` in UrlBuilder with legacy fallback

- [x] Done

**Context:** `UrlBuilder`'s constructor (`src/api/url-builder.ts:26-50`) populates only `onboarding` (default `localhost:3000`) and `transaction` (default `localhost:3001`), with `MIDAZ_ONBOARDING_URL`/`MIDAZ_TRANSACTION_URL` env overrides at lines 31–36. `getBaseUrl` (line 66) silently falls back to `onboarding` for unknown service names. The real midaz ledger is one service (default local port 3002).

**Resolution contract** (the one snippet other epics depend on):

```
getBaseUrl(service):
  1. explicit baseUrls[service] if set
  2. baseUrls.ledger if set
  3. legacy: baseUrls.onboarding for onboarding-family, baseUrls.transaction for transaction-family
  4. throw MidazConfigError — no more silent onboarding fallback
Env precedence: MIDAZ_LEDGER_URL > MIDAZ_ONBOARDING_URL/MIDAZ_TRANSACTION_URL (deprecated, log once)
```

**Implementation vision:** Add `ledger` to the constructor's URL map, sourced from config key or `MIDAZ_LEDGER_URL`. When only `ledger` is provided, it satisfies every `getBaseUrl` call. When only legacy keys are provided (current users), behavior is unchanged. When nothing is provided, default `ledger` to `http://localhost:3002` and keep the legacy defaults for the aliases. Replace the silent-fallback line 67 with the contract above; emit a single deprecation warning (via the existing logger, not console) the first time a legacy key resolves a request. Type `MidazConfig.baseUrls` (`src/client.ts:23`) stays `Record<string, string>` — no breaking type change.

**Files:**
- Modify: `src/api/url-builder.ts:26-68`
- Test: `tests/api/url-builder.test.ts` (extend existing)

**Verification:** `npx jest tests/api/url-builder.test.ts` — new cases: ledger-only config, legacy-only config, mixed, env precedence, unknown service throws.

**Done when:** all four resolution rungs are covered by tests and no existing test changed its assertion.

#### Task 1.2.2: Surface `ledger` in config builders and env plumbing

- [x] Done

**Context:** `ENVIRONMENT_URLS` (`src/client-config-builder.ts:~50-73`) hardcodes `onboarding`+`transaction` pairs per environment, evaluated at module load. `createLocalConfig` (~530) derives ports N and N+1 from `MIDAZ_LOCAL_PORT`. `client.ts:328` defaults the HTTP client's baseURL to `config.baseUrls?.onboarding`.

**Implementation vision:** Add a `ledger` entry to each `ENVIRONMENT_URLS` environment (env var `MIDAZ_LEDGER_URL`, local default `http://localhost:3002`; sandbox/production single hostname). `createLocalConfig` gains the ledger key (port 3002 default) while keeping the legacy pair. Fix `client.ts:328` to prefer `ledger` then fall back to legacy. Update `withBaseUrls` docs/JSDoc to name the three accepted keys. README and `docs/` examples switch to `{ ledger: ... }`; the smoke-tested legacy form stays documented under a "migrating" note.

**Files:**
- Modify: `src/client-config-builder.ts`, `src/client.ts:315-330`, `README.md`, `docs/utilities/http-client.md`
- Test: `tests/client-config-builder.test.ts` (extend existing)

**Verification:** `npm test` full suite green; `npm run docs` clean.

**Done when:** a user can configure the SDK with only `MIDAZ_LEDGER_URL` or `withBaseUrls({ ledger })` end-to-end.

### Epic 1.3: Asset-rate client rebuilt on `/asset-rates`

**Goal:** Asset-rate operations hit the endpoints that exist on midaz main, carry the `/v1` version segment, and send the body shape the ledger actually accepts.
**Scope:** `src/api/http/http-asset-rate-api-client.ts`, `src/api/url-builder.ts`, `src/api/interfaces/asset-rate-api-client.ts`, `src/entities/asset-rates.ts`, `src/models/asset-rate.ts`, `src/models/validators/asset-rate-validator.ts`, tests
**Dependencies:** Epic 1.2 (uses `ledger` base URL)
**Done when:** create/update and both GET shapes work against a local midaz main stack; the input model matches the ledger contract; drift suite covers the three paths.
**Status:** Pending

#### Task 1.3.1: Rewrite asset-rate paths and client plumbing

- [x] Done

**Context:** `HttpAssetRateApiClient` (`src/api/http/http-asset-rate-api-client.ts:25`) hand-rolls `${getBaseUrl('transaction')}/organizations/{o}/ledgers/{l}/assets/{code}/rates` (private builder at line 290) — no `/v1`, and the path itself was removed from midaz. Live check on midaz main: that path → 404. Current API: `PUT .../v1/.../asset-rates` (upsert), `GET .../asset-rates/from/{asset_code}` (list by source), `GET .../asset-rates/{external_id}`. The client also does NOT extend `HttpBaseApiClient` — it duplicates observability/validation helpers (lines 305–320). The unused `UrlBuilder.buildAssetRateUrl` (url-builder.ts:176) encodes the same dead path.

**Elaboration finding — the model is broken, not just the path (verified live 2026-08-06).** The spec cannot describe the request body (see Task 1.1.1), so the contract was read from `components/ledger/internal/adapters/postgres/assetrate/assetrate.go:33-74` and confirmed against the running ledger. The accepted body is:

```
{ from: string(2..10), to: string(2..10), rate: integer, scale?: integer>=0,
  source?: string(<=200), ttl?: integer>=0 (seconds), externalId?: uuid, metadata?: object }
```

`PUT` with `{from:"BRL",to:"USD",rate:520,scale:2,ttl:3600,source:"smoke"}` → 200. The SDK's current body `{toAsset, rate: 5.2, effectiveAt}` → **400 `0094`: "invalid value for field 'rate': expected type 'int', but got 'number 5.2'"**. So three independent breaks stack here: wrong path, wrong field names (`toAsset` vs `to`, no `from`), and wrong numeric model — `rate` is an **integer paired with `scale`** (520 + scale 2 = 5.20), never a float; `effectiveAt`/`expirationAt` do not exist and are replaced by `ttl` in seconds. Response `AssetRate` mirrors these fields (`from`, `to`, `rate`, `scale`, `source`, `ttl`, `externalId`) — take the response type from the generated `AssetRate` schema.

**Implementation vision:** Rewrite `UrlBuilder.buildAssetRateUrl` to emit the three templates (collection `/asset-rates`, `/from/{assetCode}`, `/{externalId}`) via `getVersionedUrl` — this un-deads the builder and puts asset-rates under the drift suite. Rework the client to extend `HttpBaseApiClient` (pattern: `http-transaction-api-client.ts:23-26`), deleting the duplicated observability/validation helpers (lines 305–320). Replace the input model with the contract above and rewrite `asset-rate-validator.ts` to enforce it: `from`/`to` required and 2–10 chars, `rate` required and an integer (reject floats with a message naming `scale` as the fix — that is the trap users will hit), `scale`/`ttl` non-negative integers, `source` ≤200 chars, `externalId` a UUID. `createOrUpdateAssetRate` PUTs the collection path. `getAssetRate(org, ledger, source, destination)` keeps its signature: GET `/asset-rates/from/{source}` then the existing client-side find, but matching on the response's `to` field (not `toAsset`); keep the synthetic 1.0 same-asset short-circuit (line 79) — users may rely on it, but make its `scale` consistent with the new model. Add `getAssetRateByExternalId`. Update interface (`src/api/interfaces/asset-rate-api-client.ts:14-33`), entity service (`src/entities/asset-rates.ts:37-55`) and impl. The old input field names are removed outright, not aliased: they never reached a working server, so no consumer can depend on them.

**Files:**
- Modify: `src/api/http/http-asset-rate-api-client.ts`, `src/api/url-builder.ts:176-184`, `src/api/interfaces/asset-rate-api-client.ts`, `src/entities/asset-rates.ts`, `src/entities/implementations/asset-rates-impl.ts`
- Test: `tests/api/http/http-asset-rate-api-client.test.ts` (rewrite URL assertions; mock seam unchanged)

**Verification:** `npx jest tests/api/http/http-asset-rate-api-client.test.ts` green; drift suite includes the three paths; live smoke: PUT + both GETs return 2xx against local midaz (`make up` stack, ledger :3002).

**Done when:** all three asset-rate endpoints round-trip against midaz main and no hand-rolled URL remains in the client.

### Epic 1.4: Operation client versioned paths + decimal-string values

**Goal:** Operation endpoints carry `/v1` and monetary values are serialized as decimal strings with client-side validation.
**Scope:** `src/api/http/http-operation-api-client.ts`, `src/api/url-builder.ts`, `src/models/validators/`, `src/models/transaction-transformer.ts`, tests
**Dependencies:** Epic 1.2
**Done when:** list/get/update operations work against local midaz main; numeric `value` inputs serialize as strings; non-finite numbers are rejected client-side with a clear error.
**Status:** Pending

#### Task 1.4.1: Route operation client through versioned UrlBuilder

- [x] Done

**Context:** `HttpOperationApiClient` hand-rolls `${getBaseUrl('transaction')}/organizations/{o}/ledgers/{l}/accounts/{a}/operations` (private `buildOperationsUrl` at `http-operation-api-client.ts:234-238`) — missing `/v1`, so every call 404s against midaz main. All methods are account-scoped (correct — ledger-level `/operations` does not exist on main; the dead `UrlBuilder.buildOperationUrl:204` that encodes it must go). The `transactionId` variant (line 256) builds a query-string lookup that must be checked against the spec — main exposes `GET .../accounts/{account_id}/operations/{operation_id}` and `PATCH .../transactions/{transaction_id}/operations/{operation_id}`.

**Implementation vision:** Replace `UrlBuilder.buildOperationUrl` with account-scoped builders emitting versioned paths (`getVersionedUrl` + `accounts/{id}/operations[/{opId}]`), delete the ledger-level template, and point the client's three methods at them. `updateOperation` moves to the spec's PATCH route, which on main is transaction-scoped only (`PATCH .../transactions/{transaction_id}/operations/{operation_id}` — there is no account-scoped PATCH): the method gains a required `transactionId`, taken from the existing optional-options position so the positional signature does not break, and throws a clear validation error when absent. Migrate the client to extend `HttpBaseApiClient`, dropping its duplicated helpers (lines 267–282). Keep the metrics counters (lines 86–99) — wire them through the base client's `recordMetrics`.

**Files:**
- Modify: `src/api/http/http-operation-api-client.ts`, `src/api/url-builder.ts:204-218`, `src/api/interfaces/operation-api-client.ts`, `src/entities/operations.ts`, `src/entities/implementations/operations-impl.ts`
- Test: `tests/api/http/http-operation-api-client.test.ts`

**Verification:** `npx jest tests/api/http/http-operation-api-client.test.ts` green; live smoke: list + get operations on a seeded account return 2xx.

**Done when:** every operation path is versioned, spec-listed, and the drift suite covers it.

#### Task 1.4.2: Decimal-string value handling

- [x] Done

**Context:** Midaz main requires monetary `value` as a JSON **string** (`pkg/mtransaction/transaction.go:85-111`, `shopspring/decimal`); a JSON number is rejected with the misleading `0053 Unexpected Fields` (verified live). The SDK passes `value` through untouched (`src/models/transaction-transformer.ts:11-105`), so `value: 100` compiles, ships, and dies server-side.

**Implementation vision:** In the transformer's `toApiTransaction`, coerce `send.value` and every `amount.value` (source + distribute) with: string → validated against a decimal regex (`/^-?\d+(\.\d+)?$/`); number → reject non-finite, reject beyond `Number.MAX_SAFE_INTEGER` magnitude or with float artifacts (use `String(n)` and re-parse check), else serialize `String(n)`; anything else → throw a validation error naming the exact path (`send.source.from[0].amount.value`). Mirror the same rule in `validateCreateTransactionInput` (`src/models/validators/`) so failures surface before the HTTP layer. Type the model fields as `string | number` explicitly. Document string as the recommended form (float precision).

**Files:**
- Modify: `src/models/transaction-transformer.ts`, `src/models/validators/transaction-validator.ts` (locate exact file via `validateCreateTransactionInput` import in `http-transaction-api-client.ts:109`), `src/models/transaction.ts`
- Test: `tests/models/transaction-transformer.test.ts`, validator tests alongside existing ones

**Verification:** `npx jest tests/models` green — cases: string passthrough, integer, float with exact representation, `NaN`/`Infinity` rejected, unsafe integer rejected, nested path named in the error. Live smoke: `value: 100` (number) now succeeds end-to-end.

**Done when:** a numeric `value` works against midaz main and every invalid value fails client-side with the offending path in the message.

---

## Phase 2: Transaction lifecycle

**Contract source.** The ledger's Huma spec cannot describe request bodies (Task 1.1.1 finding), so every shape below was read from the Go source on midaz `main` @`33cb93f` and confirmed against a live ledger on 2026-08-06. Implementers must treat these as authoritative and must not re-derive them from `spec/ledger-v1.openapi.yaml`, which only carries response schemas. Response schema for all nine endpoints is `Transaction`; errors are RFC 9457 `application/problem+json` carrying a midaz `code`.

**Three server behaviours the SDK has to defend against — verified, not assumed:**

1. 🔴 **`remaining` silently destroys money.** A leg carrying `remaining` is counted by the server's balance check but never turned into an operation. Measured: send 100 with `acc-b` at 30 and `acc-c` as `remaining` → source debited 100, `acc-b` credited 30, **`acc-c` unchanged**; 70 vanished with a `201 CREATED`. As the sole destination, nothing is credited at all. The SDK therefore **refuses to emit `remaining`** (see Task 2.4.2) — a deliberate divergence from the server contract, reversible once midaz fixes it.
2. 🔴 **`0486 Transaction Locked` is permanent, not transient.** `commitOrCancelTransaction` takes a Redis lock and never releases it on the success path, and its TTL is built as `time.Duration(300)` — 300 **nanoseconds**, not seconds. A second commit/cancel on an already-committed transaction returns `0486` forever, while its `detail` says "Please retry shortly". Any SDK retry on `0486` loops indefinitely. The honest `0099` only appears where no lock was ever taken.
3. ⚠️ **Idempotency replays instead of rejecting.** Same `X-Idempotency` key with a *different* body silently returns the FIRST transaction — no 409, no `0084`. With no key at all, midaz still dedupes on a body hash for 300s, so a bare retry of a create silently no-ops. `X-Idempotency-Replayed: true|false` is the only way to tell a fresh write from a replay, and it is returned on exactly seven operations (json/inflow/outflow/block/unblock/annotation/revert). `commit`/`cancel` accept the header and ignore it.

### Epic 2.0: Carried-over base URL defaults

**Goal:** Zero-config helpers point at the single ledger service instead of the retired two-service pair.
**Scope:** `src/client-config-builder.ts`, tests, README
**Dependencies:** none
**Done when:** `createDevelopmentConfig()` and `createLocalConfig()` route every builder at the ledger host; explicitly supplied legacy keys behave exactly as before.
**Status:** Pending

#### Task 2.0.1: Emit `ledger` alone when the caller configures nothing

- [x] Done

**Context:** Resolved decision from the Phase 1 checkpoint (see "Phase 1 outcome" above). `resolveBaseUrls` (`src/client-config-builder.ts:65-86`) currently returns all three keys when no `MIDAZ_LEDGER_URL` is set, and `UrlBuilder.getBaseUrl` (`src/api/url-builder.ts:130-153`) consults the legacy family key before `ledger`, so those defaulted legacy entries outrank the ledger default. Measured against the built package: `createDevelopmentConfig()` sends accounts to `:3000` and asset-rates to `:3001`, neither of which midaz main serves.

**Implementation vision:** Change only the no-ledger-env branch of `resolveBaseUrls`: emit `onboarding`/`transaction` **only when the caller actually supplied them** (env var present), and always emit `ledger` from the defaults. When nothing is supplied the map is `{ ledger }` alone, so the ledger default is reachable. Do **not** touch the rung order in `getBaseUrl` — an explicitly supplied legacy key must keep winning for its own family, which is what README.md already documents. Apply the same rule to every `ENVIRONMENT_URLS` environment and to `createLocalConfig` (which must stop deriving the `N+1` legacy port unless the caller asked for it). Update `README.md` and `docs/utilities/http-client.md` so the documented default is the single ledger host.

**Files:**
- Modify: `src/client-config-builder.ts`, `README.md`, `docs/utilities/http-client.md`
- Test: `tests/client-config-builder.test.ts`, `tests/api/url-builder.test.ts`

**Verification:** `npx jest tests/client-config-builder.test.ts tests/api/url-builder.test.ts`. New cases: nothing configured → `{ledger}` only and both `buildAccountUrl` and `buildAssetRateUrl` resolve to the ledger host; `MIDAZ_ONBOARDING_URL` set → onboarding still wins for its family; `MIDAZ_TRANSACTION_URL` set → transaction still wins for asset-rates. Then rebuild and confirm empirically that `createDevelopmentConfig()` sends both builders to the ledger host.

**Done when:** zero-config helpers work against midaz main and no existing legacy-configured behaviour changed.

### Epic 2.1: State transitions — commit, cancel, revert

**Goal:** The two-phase pending flow and reversal are usable from the SDK, and the client never retries the permanent `0486` lock.
**Scope:** transaction client/interface/entity, error mapping, retry policy, tests
**Dependencies:** Phase 1
**Done when:** create-pending → commit, create-pending → cancel, and create → revert all round-trip live; a repeated commit surfaces `0486` once without retrying.
**Status:** Pending

#### Task 2.1.1: Commit, cancel and revert with a non-retry guard on 0486

- [x] Done

**Context:** `HttpTransactionApiClient` (`src/api/http/http-transaction-api-client.ts`) exposes only create/get/list. The three state endpoints are `POST .../transactions/{id}/{commit|cancel|revert}`, all **body-less** (a body is accepted and ignored), all returning **201** with a `Transaction`. Legal transitions, verified: commit only from `PENDING`, cancel only from `PENDING`, revert only from `APPROVED`. Illegal transitions return `409/0099`; a second commit on a committed transaction returns `409/0486` permanently because of the server's leaked lock (see the phase preamble). Revert creates a **new** transaction carrying `parentTransactionId`, with the legs swapped and status `CREATED`. Cancel emits a single `RELEASE` operation on the source only.

**Implementation vision:** Add `commitTransaction`, `cancelTransaction`, `revertTransaction` to the client, its interface, the entity service (`src/entities/transactions.ts`) and impl, each `(orgId, ledgerId, transactionId, options?)` and each POSTing **no body**. Extend `UrlBuilder.buildTransactionUrl` with the sub-path forms so the drift suite from Task 1.1.2 covers them. `revertTransaction` accepts an `idempotencyKey`; `commit`/`cancel` must **not** send one — the server ignores it and sending it would imply a guarantee that does not exist. Guard the retry path: whatever the SDK's retry policy currently treats as retryable, `409` carrying midaz code `0486` must be excluded, and the thrown error must carry the `code` so callers can branch. Do not paper over the misleading server `detail` ("retry shortly") — surface it, but add the SDK's own note that the condition is terminal. Model `parentTransactionId` on the response type.

**Files:**
- Modify: `src/api/http/http-transaction-api-client.ts`, `src/api/interfaces/transaction-api-client.ts`, `src/entities/transactions.ts`, `src/entities/implementations/transactions-impl.ts`, `src/api/url-builder.ts`, `src/models/transaction.ts`
- Test: `tests/api/http/http-transaction-api-client.test.ts`, `tests/entities/implementations/transactions-impl.test.ts`, plus a new retry-policy test

**Verification:** `npx jest tests/api/http tests/entities` green. Live, against `http://localhost:3002`: create with `pending:true` → account shows `onHold`; commit → `APPROVED` and `onHold` moves to the destination; a second create-pending → cancel → `CANCELED` with one `RELEASE` operation; create (non-pending) → commit → `409/0099`; commit twice on the same approved transaction → `0486` returned **once**, with the request count asserted so a retry would fail the test.

**Done when:** all three transitions round-trip live and the `0486` non-retry is proven by a test that counts requests.

### Epic 2.2: Inflow and outflow

**Goal:** The single-sided endpoints are usable with their own input shapes, and the shape each one forbids is rejected client-side.
**Scope:** transaction client/interface/entity, new input models, validators, tests
**Dependencies:** Epic 2.1 (shares the client's request plumbing)
**Done when:** both endpoints round-trip live; supplying `source` to inflow or `distribute` to outflow fails before the wire.
**Status:** Pending

#### Task 2.2.1: createInflow and createOutflow

- [x] Done

**Context:** `POST .../transactions/inflow` takes `SendInflow` — `{asset, value, distribute}` — where **`source` is forbidden** (`400/0053`) and there is **no `pending` field** (sending it is `0053`); the server synthesizes the debit from `@external/{asset}`. `POST .../transactions/outflow` takes `SendOutflow` — `{asset, value, source}` — where **`distribute` is forbidden**, and `pending` **is** supported; the server synthesizes the credit to `@external/{asset}`. Both accept the create-family headers (`X-Idempotency`, `X-TTL`) and return 201 with `X-Idempotency-Replayed`. Body decoding is strict, so any stray field is `0053`.

**Implementation vision:** Add `CreateInflowInput` and `CreateOutflowInput` model types that make the forbidden sub-object **unrepresentable in TypeScript** rather than merely validated — the type system is the first line, the validator the second for JS callers. Two new transformer entry points reusing the decimal-string coercion from Task 1.4.2; do not extend `toApiTransaction` with conditionals, since its allowlist is what pins the `0053` hazard. Validators reject the forbidden sub-object and `pending` on inflow, each naming the field. Wire `X-TTL` alongside the existing idempotency header plumbing as an optional `idempotencyTtlSeconds` request option, defaulting to omitted (server default 300).

**Files:**
- Create: `src/models/transaction-inflow.ts` or extend `src/models/transaction.ts` (implementer's call — keep it consistent with existing model layout)
- Modify: `src/api/http/http-transaction-api-client.ts`, its interface, `src/entities/transactions.ts` + impl, `src/models/transaction-transformer.ts`, `src/models/validators/transaction-validator.ts`, `src/api/url-builder.ts`, `src/util/http/universal-http-client.ts` (X-TTL)
- Test: transformer, validator and client tests alongside the existing ones

**Verification:** `npx jest tests/models tests/api/http` green. Live: inflow funds an account from `@external/BRL` and the response shows `source:["@external/BRL"]`; outflow with `pending:true` yields `PENDING`; a JS-side call passing `source` to inflow throws before any fetch (assert fetch was never called).

**Done when:** both endpoints round-trip live and each forbidden shape fails client-side.

### Epic 2.3: Block, unblock and annotation

**Goal:** The three full-input variants are exposed with their status semantics made explicit.
**Scope:** transaction client/interface/entity, validators, tests
**Dependencies:** Epic 2.2
**Done when:** block and unblock round-trip live producing `BLOCK`/`UNBLOCK` operations; annotation produces a `NOTED` transaction that moves no balance.
**Status:** Pending

#### Task 2.3.1: blockFunds, unblockFunds and createAnnotation

- [x] Done

**Context:** All three take the **full** `CreateTransactionInput` (both `source` and `distribute` required) and differ only in server-side labelling. Block/unblock relabel the persisted operation type to `BLOCK`/`UNBLOCK` while balances move exactly as a normal transfer; **`pending` is accepted but forced to `false`**. Annotation forces status to `NOTED` and writes operations with `amount.value: "0"` and `balanceAffected: false`, leaving balances untouched — and a `NOTED` transaction can be neither committed nor reverted (`0099`). Verified quirk: sending `pending: true` to annotation keeps `NOTED` but flips both operations to `CREDIT`/`CREDIT` via a `DetermineOperation` leak.

**Implementation vision:** Three methods reusing the existing `toApiTransaction` path — the body is identical to `/json`, so no new transformer. Because `pending` is either ignored (block/unblock) or actively harmful (annotation), the input types for these three must **omit** `pending` entirely rather than accept-and-drop it; a JS caller who passes it gets a validation error naming the endpoint's behaviour. Document the `NOTED` terminal state on `createAnnotation` so callers do not build a commit flow on it.

**Files:**
- Modify: `src/api/http/http-transaction-api-client.ts`, its interface, `src/entities/transactions.ts` + impl, `src/models/transaction.ts`, `src/models/validators/transaction-validator.ts`, `src/api/url-builder.ts`
- Test: client, validator and entity tests

**Verification:** `npx jest tests/api/http tests/models tests/entities` green. Live: block yields operations typed `BLOCK` with balances moved; unblock the same with `UNBLOCK`; annotation yields `NOTED` with `balanceAffected:false` and the account balance byte-identical before and after; committing the annotation returns `0099`.

**Done when:** all three round-trip live and `pending` is unrepresentable on their inputs.

### Epic 2.4: Model field parity and money-safety guards

**Goal:** Every field the ledger accepts is expressible, every field that would silently lose money or be silently ignored is blocked, and transaction metadata can be updated.
**Scope:** models, transformer, validators, transaction client, tests
**Dependencies:** Epic 2.1
**Done when:** the create-transaction input covers the ledger's full field list; `remaining` and a mismatched `amount.asset` fail client-side; PATCH round-trips with documented merge semantics.
**Status:** Pending

#### Task 2.4.1: CreateTransactionInput field parity

- [x] Done

**Context:** The SDK's input (`src/models/transaction.ts`, transformed at `src/models/transaction-transformer.ts:11`) lacks `routeId`, `transactionDate` and `skip`, and its allowlist transformer drops them silently. Verified server behaviour: `routeId` must be a UUID (`400/0047` otherwise) but a non-existent one is accepted while `accounting.validateRoutes` is off; `transactionDate` accepts six formats and **overwrites the response `createdAt`**, with a future date rejected as `400/0121`; `skip` is `{fees?: boolean, tracer?: boolean}` and is honoured only when the matching per-ledger override is on — otherwise **`422/0490`** — and its outcome is read from the response's `feesSkipped`/`tracerSkipped`, never from an echoed `skip`. `code` is persisted but **not echoed** in the response.

**Implementation vision:** Add the four fields to the input model and the transformer allowlist. Validate client-side what is cheap and unambiguous: `routeId` as a UUID, `transactionDate` as one of the accepted formats and not in the future, `description`/`chartOfAccountsGroupName` at 256 and `code` at 100 characters. Do **not** try to pre-validate `skip` against ledger settings — the SDK cannot know them; instead surface `0490` with a message naming the ledger override the caller must enable. Document on the type that `code` will not appear in the response and that `transactionDate` rewrites `createdAt`, since both look like bugs otherwise.

**Files:**
- Modify: `src/models/transaction.ts`, `src/models/transaction-transformer.ts`, `src/models/validators/transaction-validator.ts`
- Test: `tests/models/transaction-transformer.test.ts`, transaction-validator tests

**Verification:** `npx jest tests/models` green, each new field proven by mutation (drop it from the allowlist → test red). Live: a transaction with `transactionDate` in the past returns that value as `createdAt`; a future date returns `0121`; `skip:{fees:true}` against a ledger with the override off returns `0490`, and against one with `allowFeeSkip:true` returns `feesSkipped:true`.

**Done when:** all four fields reach the wire and each client-side rule is proven by mutation.

#### Task 2.4.2: FromTo field parity, the `remaining` guard and asset mirroring

- [ ] Done

**Context:** The SDK's leg type carries only `account`, `amount`, `route`, `description`, `metadata`. The ledger's `FromTo` also accepts `balanceKey` (defaults to `"default"`, and must reference an **existing** balance — an unknown key is `422/0019`, it is not auto-created), `share` (`{percentage, percentageOfPercentage}` as **integers**, verified: 60/40 of 100 credits 60 and 40; `percentageOfPercentage:0` behaves as 100), `rate`, `chartOfAccounts` and `routeId`. Two verified hazards: **`amount.asset` is ignored entirely** — a leg declaring `USD` under `send.asset: "BRL"` produced a BRL operation — and **`remaining` silently destroys money** as described in the phase preamble.

**Implementation vision:** Add `balanceKey`, `share`, `rate`, `chartOfAccounts` and `routeId` to the leg type and the transformer allowlist. Two guards, both client-side and both loud:
- `remaining` is **refused**: the field exists on the type only so TypeScript users get a documented deprecation, and the validator throws naming `amount` or `share` as the correct alternative. Record in the JSDoc that this diverges from the server on purpose because the server loses the funds.
- `amount.asset` must equal `send.asset`. Mismatch throws client-side naming both values rather than letting the server silently coerce. Where the caller omits it, mirror `send.asset` in the transformer so the wire payload stays explicit.
Keep `share` percentages as integers and reject fractional ones, since the server takes int64.

**Files:**
- Modify: `src/models/transaction.ts`, `src/models/transaction-transformer.ts`, `src/models/validators/transaction-validator.ts`
- Test: `tests/models/transaction-transformer.test.ts`, transaction-validator tests

**Verification:** `npx jest tests/models` green. Live: a `share`-split transaction credits 60/40 as asserted on the returned operations; a leg naming a pre-created `balanceKey` produces an operation on that balance; a leg naming an unknown `balanceKey` returns `422/0019`. Client-side: `remaining` and a mismatched `amount.asset` both throw with fetch never called.

**Done when:** the leg type matches the ledger's, and both money-safety guards are proven by tests that assert no request was issued.

#### Task 2.4.3: PATCH transaction with merge semantics

- [ ] Done

**Context:** `PATCH .../transactions/{id}` accepts **only** `{description?, metadata?}` and returns **200** (not 201). Verified semantics that the SDK must document because they are surprising: `{}` is a no-op; `{"description": ""}` does **not** clear the description; and **`metadata` merges rather than replaces** — `{"metadata":{"only":"this"}}` against `{n:7, patched:"yes"}` yields all three keys, and there is no way to delete a metadata key through PATCH. `description` over 256 characters is `400/0047`.

**Implementation vision:** Add `updateTransaction(orgId, ledgerId, transactionId, input)` typed to exactly those two fields, wired to `patchRequest` on the base client (which already exists at `http-base-api-client.ts:133`). No transformer is needed — the body is already the wire shape — but route it through a validator enforcing the 256-character limit so the caller fails locally. Document the merge and empty-string behaviours on the method's JSDoc; do not attempt to emulate replace semantics client-side by reading-then-writing, which would race.

**Files:**
- Modify: `src/api/http/http-transaction-api-client.ts`, its interface, `src/entities/transactions.ts` + impl, `src/models/transaction.ts`, `src/models/validators/transaction-validator.ts`
- Test: client and validator tests

**Verification:** `npx jest tests/api/http tests/models` green. Live: patch description and metadata on an approved transaction → 200 with merged metadata; patch `{}` → prior values retained; 257-character description → rejected client-side with fetch never called.

**Done when:** PATCH round-trips live and the merge semantics are covered by a test asserting pre-existing keys survive.

---

## Phase 3: Lookups, history, settings

### Epic 3.1: Account alias and external lookups

**Goal:** `getAccountByAlias`, `getAccountBalancesByAlias`, `getExternalAccount(code)`, `getExternalAccountBalances(code)` per the four `accounts/alias|external` GET paths.
**Scope:** account + balance clients/entities, tests
**Dependencies:** Phase 1
**Done when:** all four lookups round-trip live (external `@external/BRL` seeded by asset creation).
**Status:** Pending

### Epic 3.2: Balance history and metrics counts

**Goal:** `getBalanceHistory` (account-scoped and balance-scoped variants) and `count*` methods backed by the `HEAD .../metrics/count` endpoints (organizations, ledgers, accounts, assets, portfolios, segments, transactions) reading the count response header.
**Scope:** balance client, base client (HEAD support — `HttpBaseApiClient` has no `headRequest` today), affected entities, tests
**Dependencies:** Phase 1
**Done when:** history returns seeded movements; counts match seeded fixtures live.
**Status:** Pending

### Epic 3.3: Ledger settings

**Goal:** `getLedgerSettings` / `updateLedgerSettings` (`GET|PATCH .../ledgers/{id}/settings`).
**Scope:** ledger client/entity, models, tests
**Dependencies:** Phase 1
**Done when:** settings round-trip live, including the per-ledger toggles that gate `skip` (interacts with Epic 2.4 — document the 422 behavior).
**Status:** Pending

---

## Phase 4: New domains

### Epic 4.1: Holders and instruments (embedded CRM)

**Goal:** Full holders domain: holders CRUD, holder accounts, instruments CRUD, related-party removal — 8 v1 paths under `organizations/{id}/holders|instruments`.
**Scope:** new client + entity + models (`src/api/http/http-holder-api-client.ts` etc.), factory wiring (`src/api/api-factory.ts`), entity aggregator (`src/entities/entity.ts:52-88`), tests
**Dependencies:** Phase 1
**Done when:** holder → instrument → account journey round-trips live.
**Status:** Pending

### Epic 4.2: Billing and packages

**Goal:** billing-packages CRUD, packages CRUD, `billing/calculate`, `estimates` (org-level v1 + ledger-level v2 variants).
**Scope:** new clients/entities/models, factory + aggregator wiring, tests
**Dependencies:** Phase 1
**Done when:** package create + calculate round-trip live.
**Status:** Pending

### Epic 4.3: Encryption and protection audit

**Goal:** `provisionEncryption` / `getEncryptionStatus` and `getProtectionAudit`.
**Scope:** new client/entity, tests
**Dependencies:** Phase 1
**Done when:** status/audit GETs round-trip live (provision may require env support — verify against local stack, else contract-test only and note it).
**Status:** Pending

### Epic 4.4: v2 API surface

**Goal:** v2 endpoints: `POST /transactions/direct`, `/hold`, `/block`, `/unblock` (org-less, header-scoped), plus v2 transaction lifecycle variants; SDK version-negotiation strategy (`X-API-Version` header already exists at `http-base-api-client.ts:68-74`; `apiVersion` config at `url-builder.ts:28`).
**Scope:** url-builder (v2 path style), transaction client or new v2 client, `spec/ledger-v2.openapi.yaml` drift coverage, tests
**Dependencies:** Phases 1–2 (v2 semantics build on lifecycle)
**Done when:** direct + hold round-trip live under v2; drift suite covers v2 paths.
**Status:** Pending

---

## Phase 1 outcome (2026-08-06)

Landed in 9 signed commits on `feat/ledger-api-parity-phase-1`. Gate verified independently by the supervisor: `tsc --noEmit` clean, 75 suites / 1521 tests green, `format:check` clean, and 6/6 live checks through the built SDK against a local midaz main ledger (asset-rate upsert + lookup with the integer-rate contract, client-side float-rate rejection, numeric transaction value serialized to a decimal string, non-finite value rejected naming its path, operations list on the versioned account path).

**Open decision — base-URL rung order.** Task 1.2.1's Resolution contract above puts `ledger` at rung 2 and the legacy service-family key at rung 3. The code shipped them **swapped**: an explicitly configured `onboarding`/`transaction` wins for its own family, and `ledger` serves everything else. README.md and docs/utilities/http-client.md document the shipped order; only this plan is out of step.

The swap is defensible on its own (a split legacy deployment keeps working), but it makes the `ledger` value emitted by `createDevelopmentConfig()` / `createLocalConfig()` / sandbox / production **inert**, because those helpers also emit legacy defaults that outrank it. Measured against the built package:

```
createDevelopmentConfig() -> baseUrls {onboarding: :3000, transaction: :3001, ledger: :3002}
  accounts  -> http://localhost:3000/v1/...      (midaz main serves nothing here)
  assetRate -> http://localhost:3001/v1/...      (idem)
withBaseUrls({ledger}) -> both -> http://ledger.example:3002/v1/...   (correct)
```

So the explicit `withBaseUrls({ ledger })` path — Epic 1.2's stated Done-when — works, while the zero-config helpers still describe the two-service topology midaz retired.

**Resolved 2026-08-06:** keep the shipped rung order (an explicit legacy key wins for its own family) and fix the defaults instead — when the caller configures nothing, the SDK emits `ledger` alone rather than a legacy pair, so zero-config points at the single service. Legacy keys are emitted only when the caller actually supplies them, which leaves genuine split deployments untouched. Carried into Phase 2 as Task 2.0.1; the Resolution contract snippet in Task 1.2.1 is superseded by this and by README.md.

## Cross-cutting verification

- **Per epic:** full `npm test` + `npm run typecheck` + `npm run lint:check` + `npm run build` + drift suite green.
- **Live smoke per phase boundary:** local midaz main stack (`make up` in the midaz repo; ledger on :3002, auth disabled) — extend the smoke script pattern from the 2026-08-06 idempotency verification (create org → ledger → asset → accounts → exercise the phase's endpoints, assert on response bodies, not just status codes).
- **Release train:** PRs target `develop` (beta channel); each phase lands as one or more `feat`/`fix` commits; stable release cut from `develop` → `main` after live smoke passes.
