#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: npm run spec:update -- <midaz-repo-path> [type-ref] [released-ref]

Reads the ledger OpenAPI specs out of a local midaz checkout into spec/,
stamps spec/VERSION with the resolved refs and commits, and regenerates
src/generated. The source repository is never modified.

  <midaz-repo-path>  Path to a midaz checkout (defaults to $MIDAZ_REPO).
  [type-ref]         Ref the response TYPES are generated from (defaults to HEAD).
  [released-ref]     Ref the PATH gate is enforced against (defaults to v3.8.0).

Two refs, because they answer different questions. The Huma documents on the
type ref describe the wire accurately (decimal.Decimal as a string); the swaggo
document on the released ref describes which routes a supported ledger actually
serves. See the header of spec/VERSION.
EOF
}

MIDAZ_REPO="${1:-${MIDAZ_REPO:-}}"
MIDAZ_REF="${2:-HEAD}"
RELEASED_REF="${3:-v3.8.0}"

if [ -z "$MIDAZ_REPO" ]; then
  usage
  exit 1
fi

if ! git -C "$MIDAZ_REPO" rev-parse --git-dir >/dev/null 2>&1; then
  echo "error: '$MIDAZ_REPO' is not a git repository" >&2
  exit 1
fi

SDK_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SPEC_DIR="$SDK_ROOT/spec"
SOURCE_V1=components/ledger/api/openapi.huma.yaml
SOURCE_V2=components/ledger/api/openapi.v2.huma.yaml
SOURCE_RELEASED=components/ledger/api/openapi.yaml

resolve_sha() {
  local ref="$1"
  if ! git -C "$MIDAZ_REPO" rev-parse --verify --quiet "${ref}^{commit}"; then
    echo "error: '$ref' does not resolve to a commit in '$MIDAZ_REPO'" >&2
    exit 1
  fi
}

MIDAZ_SHA="$(resolve_sha "$MIDAZ_REF")"
RELEASED_SHA="$(resolve_sha "$RELEASED_REF")"

MIDAZ_SHORT_SHA="$(git -C "$MIDAZ_REPO" rev-parse --short "$MIDAZ_SHA")"
MIDAZ_DATE="$(git -C "$MIDAZ_REPO" log -1 --format=%cI "$MIDAZ_SHA")"
RELEASED_SHORT_SHA="$(git -C "$MIDAZ_REPO" rev-parse --short "$RELEASED_SHA")"
RELEASED_DATE="$(git -C "$MIDAZ_REPO" log -1 --format=%cI "$RELEASED_SHA")"

MIDAZ_REF_NAME="$(git -C "$MIDAZ_REPO" rev-parse --abbrev-ref --symbolic-full-name "$MIDAZ_REF" 2>/dev/null || true)"
if [ -z "$MIDAZ_REF_NAME" ] || [ "$MIDAZ_REF_NAME" = "HEAD" ]; then
  MIDAZ_REF_NAME="$MIDAZ_SHA"
fi

STAGE_DIR="$(mktemp -d)"
trap 'rm -rf "$STAGE_DIR"' EXIT

stage() {
  local sha="$1" short="$2" source_path="$3" target_name="$4"
  if ! git -C "$MIDAZ_REPO" show "$sha:$source_path" > "$STAGE_DIR/$target_name" 2>/dev/null; then
    echo "error: '$source_path' is missing at $short in '$MIDAZ_REPO'" >&2
    exit 1
  fi
}

stage "$MIDAZ_SHA" "$MIDAZ_SHORT_SHA" "$SOURCE_V1" ledger-v1.openapi.yaml
stage "$MIDAZ_SHA" "$MIDAZ_SHORT_SHA" "$SOURCE_V2" ledger-v2.openapi.yaml
stage "$RELEASED_SHA" "$RELEASED_SHORT_SHA" "$SOURCE_RELEASED" ledger-v1-released.openapi.yaml

count_binary_bodies() {
  local count
  count="$(grep -c 'format: binary' "$1" || true)"
  echo "${count:-0}"
}

BINARY_BODIES_V1="$(count_binary_bodies "$STAGE_DIR/ledger-v1.openapi.yaml")"
BINARY_BODIES_V2="$(count_binary_bodies "$STAGE_DIR/ledger-v2.openapi.yaml")"
RELEASED_PATHS="$(grep -c '^  /v1/' "$STAGE_DIR/ledger-v1-released.openapi.yaml" || true)"

SPEC_FILES=(ledger-v1.openapi.yaml ledger-v2.openapi.yaml ledger-v1-released.openapi.yaml VERSION)

cat > "$STAGE_DIR/VERSION" <<EOF
# Vendored midaz ledger OpenAPI specs.
#
# Regenerate with: npm run spec:update -- <midaz-repo-path> [type-ref] [released-ref]
# Never hand-edit spec/*.yaml or src/generated/*.d.ts; CI fails on drift.
#
# TWO REFS, TWO QUESTIONS. The SDK supports the released ledger, so the path
# gate is enforced against the released ref: a builder aiming at a route only
# \`develop\` serves fails the drift suite. Response TYPES are still generated
# from the Huma documents on the type ref, because the two refs declare the
# same Go types but render one of them differently - swaggo emits
# decimal.Decimal as \`number\`, the Huma document emits it as \`string\`, and
# \`string\` is what the ledger actually sends. Generating money types from the
# released document would reintroduce the float that the balance fix removed.
# So: the released document is the authority on WHICH ROUTES EXIST, the Huma
# document is the authority on WHAT A RESPONSE CONTAINS.
#
# LIMITATION - ledger-v1 request bodies are unusable. The ledger serves its v1
# Huma routes with RawBody handlers, so every request body in ledger-v1 is
# typed {type: string, format: binary} instead of a real schema, and the
# generated v1 types expose request bodies as \`string\`. For v1 only RESPONSE
# types and component schemas are usable; v1 SDK input models stay
# hand-written and are guarded by the path-drift suite instead.
#
# ledger-v2 is only partly affected. The four transaction create routes
# (/transactions/direct, /transactions/hold, /transactions/block,
# /transactions/unblock) reference a real CreateTransactionV2Input schema, so
# their generated request types are usable and must not be hand-written. Every
# other v2 request body is {type: string, format: binary} as in v1.
#
# ledger-v1-released is read by the drift suite alone. It is never fed to
# openapi-typescript, so its \`number\` money fields never reach the SDK.
#
# format: binary request bodies: ledger-v1=$BINARY_BODIES_V1, ledger-v2=$BINARY_BODIES_V2
# released paths: $RELEASED_PATHS

source_repo=https://github.com/LerianStudio/midaz
source_ref=$MIDAZ_REF_NAME
source_commit=$MIDAZ_SHA
source_commit_short=$MIDAZ_SHORT_SHA
source_commit_date=$MIDAZ_DATE
released_ref=$RELEASED_REF
released_commit=$RELEASED_SHA
released_commit_short=$RELEASED_SHORT_SHA
released_commit_date=$RELEASED_DATE
ledger-v1.openapi.yaml=$SOURCE_V1
ledger-v2.openapi.yaml=$SOURCE_V2
ledger-v1-released.openapi.yaml=$SOURCE_RELEASED
EOF

backup_dir=$(mktemp -d)
trap 'rm -rf "$STAGE_DIR" "$backup_dir"' EXIT

for f in "${SPEC_FILES[@]}"; do
  [ -f "$SPEC_DIR/$f" ] && cp "$SPEC_DIR/$f" "$backup_dir/$f"
done
[ -d "$SDK_ROOT/src/generated" ] && cp -R "$SDK_ROOT/src/generated" "$backup_dir/generated"

restore() {
  for f in "${SPEC_FILES[@]}"; do
    [ -f "$backup_dir/$f" ] && cp "$backup_dir/$f" "$SPEC_DIR/$f"
  done
  if [ -d "$backup_dir/generated" ]; then
    rm -rf "$SDK_ROOT/src/generated"
    cp -R "$backup_dir/generated" "$SDK_ROOT/src/generated"
  fi
  echo "generate:types failed; specs, VERSION and src/generated restored" >&2
}

for f in "${SPEC_FILES[@]}"; do
  mv "$STAGE_DIR/$f" "$SPEC_DIR/$f"
done

cd "$SDK_ROOT"
if ! npm run generate:types; then
  restore
  exit 1
fi

echo "types from $MIDAZ_SHORT_SHA ($MIDAZ_REF_NAME); path gate from $RELEASED_SHORT_SHA ($RELEASED_REF)"
