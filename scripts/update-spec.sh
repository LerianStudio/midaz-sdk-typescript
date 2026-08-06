#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: npm run spec:update -- <midaz-repo-path> [git-ref]

Reads the ledger OpenAPI specs out of a local midaz checkout into spec/,
stamps spec/VERSION with the resolved ref and commit, and regenerates
src/generated. The source repository is never modified.

  <midaz-repo-path>  Path to a midaz checkout (defaults to $MIDAZ_REPO).
  [git-ref]          Ref to read from that repo (defaults to HEAD).
EOF
}

MIDAZ_REPO="${1:-${MIDAZ_REPO:-}}"
MIDAZ_REF="${2:-HEAD}"

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

if ! MIDAZ_SHA="$(git -C "$MIDAZ_REPO" rev-parse --verify --quiet "${MIDAZ_REF}^{commit}")"; then
  echo "error: '$MIDAZ_REF' does not resolve to a commit in '$MIDAZ_REPO'" >&2
  exit 1
fi

MIDAZ_SHORT_SHA="$(git -C "$MIDAZ_REPO" rev-parse --short "$MIDAZ_SHA")"
MIDAZ_DATE="$(git -C "$MIDAZ_REPO" log -1 --format=%cI "$MIDAZ_SHA")"

MIDAZ_REF_NAME="$(git -C "$MIDAZ_REPO" rev-parse --abbrev-ref --symbolic-full-name "$MIDAZ_REF" 2>/dev/null || true)"
if [ -z "$MIDAZ_REF_NAME" ] || [ "$MIDAZ_REF_NAME" = "HEAD" ]; then
  MIDAZ_REF_NAME="$MIDAZ_SHA"
fi

STAGE_DIR="$(mktemp -d)"
trap 'rm -rf "$STAGE_DIR"' EXIT

for pair in "$SOURCE_V1:ledger-v1.openapi.yaml" "$SOURCE_V2:ledger-v2.openapi.yaml"; do
  source_path="${pair%%:*}"
  target_name="${pair##*:}"
  if ! git -C "$MIDAZ_REPO" show "$MIDAZ_SHA:$source_path" > "$STAGE_DIR/$target_name" 2>/dev/null; then
    echo "error: '$source_path' is missing at $MIDAZ_SHORT_SHA in '$MIDAZ_REPO'" >&2
    exit 1
  fi
done

count_binary_bodies() {
  local count
  count="$(grep -c 'format: binary' "$1" || true)"
  echo "${count:-0}"
}

BINARY_BODIES_V1="$(count_binary_bodies "$STAGE_DIR/ledger-v1.openapi.yaml")"
BINARY_BODIES_V2="$(count_binary_bodies "$STAGE_DIR/ledger-v2.openapi.yaml")"

cat > "$STAGE_DIR/VERSION" <<EOF
# Vendored midaz ledger OpenAPI specs.
#
# Regenerate with: npm run spec:update -- <midaz-repo-path> [git-ref]
# Never hand-edit spec/*.yaml or src/generated/*.d.ts; CI fails on drift.
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
# format: binary request bodies: ledger-v1=$BINARY_BODIES_V1, ledger-v2=$BINARY_BODIES_V2

source_repo=https://github.com/LerianStudio/midaz
source_ref=$MIDAZ_REF_NAME
source_commit=$MIDAZ_SHA
source_commit_short=$MIDAZ_SHORT_SHA
source_commit_date=$MIDAZ_DATE
ledger-v1.openapi.yaml=$SOURCE_V1
ledger-v2.openapi.yaml=$SOURCE_V2
EOF

mv "$STAGE_DIR/ledger-v1.openapi.yaml" "$SPEC_DIR/ledger-v1.openapi.yaml"
mv "$STAGE_DIR/ledger-v2.openapi.yaml" "$SPEC_DIR/ledger-v2.openapi.yaml"
mv "$STAGE_DIR/VERSION" "$SPEC_DIR/VERSION"

cd "$SDK_ROOT"
npm run generate:types

echo "spec updated from $MIDAZ_REPO @ $MIDAZ_SHORT_SHA ($MIDAZ_REF_NAME)"
