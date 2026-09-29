#!/usr/bin/env bash
# Runs the pmwiki-to-markdown converter from a sibling checkout, building it when
# the build is stale, and forwards every argument to it.
#
# The converter is a standalone project (github.com/villetakanen/pmwiki-to-markdown),
# kept outside this repository so it can be taken and used on its own.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
converter="${PMWIKI_TO_MARKDOWN:-$root/../pmwiki-to-markdown}"

if [ ! -f "$converter/package.json" ]; then
  echo "pmwiki-to-markdown not found at $converter" >&2
  echo "Clone it, or set PMWIKI_TO_MARKDOWN to its checkout:" >&2
  echo "  git clone https://github.com/villetakanen/pmwiki-to-markdown.git" >&2
  exit 1
fi

bin="$converter/dist/index.js"

if [ ! -d "$converter/node_modules" ]; then
  echo "Installing converter dependencies…" >&2
  pnpm --dir "$converter" install
fi

if [ ! -f "$bin" ] || [ -n "$(find "$converter/src" -newer "$bin" -print -quit)" ]; then
  echo "Building converter…" >&2
  pnpm --dir "$converter" build
fi

exec node "$bin" "$@"
