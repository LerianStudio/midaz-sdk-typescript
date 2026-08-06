#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: npm run spec:update -- <midaz-repo-path> [git-ref]

Copies the ledger OpenAPI specs from a local midaz checkout into spec/,
stamps spec/VERSION with the source commit, and regenerates src/generated.

  <midaz-repo-path>  Path to a midaz checkout (defaults to $MIDAZ_REPO).
  [git-ref]          Optional ref to check out in that repo before copying.
EOF
}

MIDAZ_REPO="${1:-${MIDAZ_REPO:-}}"
MIDAZ_REF="${2:-}"

if [ -z "$MIDAZ_REPO" ]; then
  usage
  exit 1
fi

if [ ! -d "$MIDAZ_REPO/.git" ]; then
  echo "error: '$MIDAZ_REPO' is not a git repository" >&2
  exit 1
fi

SDK_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SPEC_DIR="$SDK_ROOT/spec"
SOURCE_DIR="$MIDAZ_REPO/components/ledger/api"

if [ -n "$MIDAZ_REF" ]; then
  git -C "$MIDAZ_REPO" checkout "$MIDAZ_REF"
fi

for file in openapi.huma.yaml openapi.v2.huma.yaml; do
  if [ ! -f "$SOURCE_DIR/$file" ]; then
    echo "error: missing $SOURCE_DIR/$file" >&2
    exit 1
  fi
done

cp "$SOURCE_DIR/openapi.huma.yaml" "$SPEC_DIR/ledger-v1.openapi.yaml"
cp "$SOURCE_DIR/openapi.v2.huma.yaml" "$SPEC_DIR/ledger-v2.openapi.yaml"

MIDAZ_SHA="$(git -C "$MIDAZ_REPO" rev-parse HEAD)"
MIDAZ_SHORT_SHA="$(git -C "$MIDAZ_REPO" rev-parse --short HEAD)"
MIDAZ_BRANCH="$(git -C "$MIDAZ_REPO" rev-parse --abbrev-ref HEAD)"
MIDAZ_DATE="$(git -C "$MIDAZ_REPO" log -1 --format=%cI)"
BINARY_BODIES_V1="$(grep -c 'format: binary' "$SPEC_DIR/ledger-v1.openapi.yaml")"
BINARY_BODIES_V2="$(grep -c 'format: binary' "$SPEC_DIR/ledger-v2.openapi.yaml")"

cat > "$SPEC_DIR/VERSION" <<EOF
# Vendored midaz ledger OpenAPI specs.
#
# Regenerate with: npm run spec:update -- <midaz-repo-path> [git-ref]
# Never hand-edit spec/*.yaml or src/generated/*.d.ts; CI fails on drift.
#
# LIMITATION - request bodies are unusable. The ledger serves its Huma routes
# with RawBody handlers, so every request body in these specs is typed
# {type: string, format: binary} instead of a real schema. The generated
# types therefore expose request bodies as \`string\`. Only RESPONSE types and
# component schemas are usable; SDK input models stay hand-written and are
# guarded by the path-drift suite instead.
#
# format: binary request bodies: ledger-v1=$BINARY_BODIES_V1, ledger-v2=$BINARY_BODIES_V2

source_repo=https://github.com/LerianStudio/midaz
source_branch=$MIDAZ_BRANCH
source_commit=$MIDAZ_SHA
source_commit_short=$MIDAZ_SHORT_SHA
source_commit_date=$MIDAZ_DATE
ledger-v1.openapi.yaml=components/ledger/api/openapi.huma.yaml
ledger-v2.openapi.yaml=components/ledger/api/openapi.v2.huma.yaml
EOF

cd "$SDK_ROOT"
npm run generate:types

echo "spec updated from $MIDAZ_REPO @ $MIDAZ_SHORT_SHA"
