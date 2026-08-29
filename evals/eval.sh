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
  echo "Running deterministic checks for next-task..."
  
  # 1. Check exactly 3 non-empty paragraphs
  PARAGRAPH_COUNT=$(awk 'BEGIN{RS=""; FS="\n"} {print NF}' "$CANDIDATE" | wc -l | tr -d ' ')
  echo -n "Checking paragraph count (expected 3)... "
  if [ "$PARAGRAPH_COUNT" -eq 3 ]; then
    echo "PASSED (3 paragraphs)"
  else
    echo "FAILED (found $PARAGRAPH_COUNT paragraphs)"
    FAILURES=$((FAILURES + 1))
  fi

  # 2. Check paragraph headers and lengths
  TASK_LEN=$(grep '^Task:' "$CANDIDATE" | sed 's/^Task: *//' | tr -d '\n' | wc -c | tr -d ' ')
  RATIONALE_LEN=$(grep '^Rationale:' "$CANDIDATE" | sed 's/^Rationale: *//' | tr -d '\n' | wc -c | tr -d ' ')
  RISKS_LEN=$(grep '^Risks:' "$CANDIDATE" | sed 's/^Risks: *//' | tr -d '\n' | wc -c | tr -d ' ')

  echo -n "Checking Task length (<= 73 chars, actual $TASK_LEN)... "
  if [ "$TASK_LEN" -gt 0 ] && [ "$TASK_LEN" -le 73 ]; then
    echo "PASSED"
  else
    echo "FAILED"
    FAILURES=$((FAILURES + 1))
  fi

  echo -n "Checking Rationale length (<= 221 chars, actual $RATIONALE_LEN)... "
  if [ "$RATIONALE_LEN" -gt 0 ] && [ "$RATIONALE_LEN" -le 221 ]; then
    echo "PASSED"
  else
    echo "FAILED"
    FAILURES=$((FAILURES + 1))
  fi

  echo -n "Checking Risks length (<= 221 chars, actual $RISKS_LEN)... "
  if [ "$RISKS_LEN" -gt 0 ] && [ "$RISKS_LEN" -le 221 ]; then
    echo "PASSED"
  else
    echo "FAILED"
    FAILURES=$((FAILURES + 1))
  fi

  # 3. Check for placeholder nouns
  PLACEHOLDERS=$(grep -iE '\b(ownership|capability|contract|boundary|surface|slice)\b' "$CANDIDATE" || true)
  echo -n "Checking for placeholder nouns... "
  if [ -z "$PLACEHOLDERS" ]; then
    echo "PASSED (0 placeholder nouns)"
  else
    echo "FAILED"
    echo "  Found placeholder nouns: $PLACEHOLDERS"
    FAILURES=$((FAILURES + 1))
  fi
fi

echo "----------------------------------------"
if [ "$FAILURES" -eq 0 ]; then
  echo "Deterministic checks: ALL PASSED"
else
  echo "Deterministic checks: $FAILURES FAILURE(S)"
  exit 1
fi
