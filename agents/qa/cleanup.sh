#!/usr/bin/env bash
# cleanup.sh — sweep test material from the shared test database.
#
# Dry run by default; pass --apply to delete. The Firestore work needs the
# firebase-admin SDK, so this delegates to the Node script that carries it.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
exec node "$REPO_ROOT/apps/pelilauta/scripts/cleanup-test-db.mjs" "$@"
