#!/usr/bin/env bash
set -euo pipefail

SKILL="${1:-}"
CANDIDATE="${2:-}"

if [ -z "$SKILL" ]; then
  echo "Usage: ./evals/eval.sh <skill-name> [candidate-file]"
  echo "Available skills:"
  ls -1 evals/skills/
  exit 1
fi

SKILL_DIR="evals/skills/$SKILL"
if [ ! -d "$SKILL_DIR" ]; then
  echo "Error: Skill eval directory '$SKILL_DIR' not found."
  exit 1
fi

echo "========================================"
echo "Evaluating skill: $SKILL"
echo "========================================"

if [ -z "$CANDIDATE" ]; then
  echo "No candidate file provided. Rubric and prompt:"
  echo ""
  cat "$SKILL_DIR/rubric.md"
  exit 0
fi

if [ ! -f "$CANDIDATE" ]; then
  echo "Error: Candidate file '$CANDIDATE' not found."
  exit 1
fi

FAILURES=0

if [ "$SKILL" = "technical-writer" ]; then
  echo "Running deterministic checks for technical-writer..."
  
  # 1. Banned words check
  echo -n "Checking for forbidden words... "
  FORBIDDEN=$(grep -rnwE 'easy|simply|quick|just|please|leverage' "$CANDIDATE" || true)
  FORBIDDEN_PHRASES=$(grep -rniE 'note that|in order to' "$CANDIDATE" || true)
  POSSESSIVES=$(grep -rnE "'s own|their own" "$CANDIDATE" || true)
  
  if [ -n "$FORBIDDEN" ] || [ -n "$FORBIDDEN_PHRASES" ] || [ -n "$POSSESSIVES" ]; then
    echo "FAILED"
    [ -n "$FORBIDDEN" ] && echo "  Forbidden words found: $FORBIDDEN"
    [ -n "$FORBIDDEN_PHRASES" ] && echo "  Forbidden phrases found: $FORBIDDEN_PHRASES"
    [ -n "$POSSESSIVES" ] && echo "  Forbidden possessives found: $POSSESSIVES"
    FAILURES=$((FAILURES + 1))
  else
    echo "PASSED (0 forbidden terms)"
  fi

elif [ "$SKILL" = "next-task" ]; then
  echo "Next-task requires qualitative review against $SKILL_DIR/rubric.md."
  echo "No automated grade assigned. Candidate: $CANDIDATE"
  exit 0
fi

echo "----------------------------------------"
if [ "$FAILURES" -eq 0 ]; then
  echo "Deterministic checks: ALL PASSED"
else
  echo "Deterministic checks: $FAILURES FAILURE(S)"
  exit 1
fi
