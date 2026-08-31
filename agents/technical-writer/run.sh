#!/usr/bin/env bash
# run.sh — runs technical-writer on target files via headless agy.
#
# Usage:
#   agents/technical-writer/run.sh [file ...] [--model <id>] [--effort <low|medium|high>]
#
# If no files are specified, it targets modified prose and source files in the current git changeset.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PRINT_TIMEOUT="${WRITER_PRINT_TIMEOUT:-10m}"

model=""
effort=""
files=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --model)
      model="$2"
      shift 2
      ;;
    --effort)
      effort="$2"
      shift 2
      ;;
    *)
      files+=("$1")
      shift
      ;;
  esac
done

if [[ ${#files[@]} -eq 0 ]]; then
  cd "$REPO_ROOT"
  main_branch="$(git rev-parse --abbrev-ref origin/HEAD 2>/dev/null | sed 's@origin/@@' || echo "main")"
  branch_point="$(git merge-base HEAD "$main_branch" 2>/dev/null || echo "$main_branch")"

  changed_files=$(
    {
      git diff --name-only "$branch_point" 2>/dev/null || true
      git diff --name-only HEAD 2>/dev/null || true
      git diff --name-only --staged 2>/dev/null || true
      git ls-files --others --exclude-standard 2>/dev/null || true
    } | sort -u | grep -E '\.(md|mdx|ts|js|svelte|css|html|yaml|yml|json)$' || true
  )

  if [[ -z "$changed_files" ]]; then
    echo "No modified or untracked files found in the working tree."
    exit 0
  fi

  while IFS= read -r f; do
    [[ -n "$f" && -f "$f" ]] && files+=("$f")
  done <<< "$changed_files"
fi

if [[ ${#files[@]} -eq 0 ]]; then
  echo "No target files to process."
  exit 0
fi

echo "Running technical-writer on ${#files[@]} file(s):"
file_list=""
for f in "${files[@]}"; do
  echo "  - $f"
  file_list="$file_list
- $f"
done
echo

prompt="You are the technical writer agent.
Follow the instructions in .agents/skills/technical-writer/SKILL.md and docs/WRITING.md precisely.

Rewrite the prose and code comments in the following target files directly in the working tree:
$file_list

Procedure:
1. Open and inspect each file.
2. In code files, touch only comment syntax. Test each code comment as a block first: delete the comment if the code beside it carries what it said.
3. Rewrite every surviving sentence to conform to docs/WRITING.md.
4. Run the docs/WRITING.md word-list greps as a check.
5. Report the files read, the word count per file before and after, and list all exceptions (sentences deleted whole, sentences left unchanged, and sentences that could not be rewritten without changing meaning).

Leave all edits directly in the working tree files."

cd "$REPO_ROOT"
exec agy -p "$prompt" \
  --mode accept-edits \
  --print-timeout "$PRINT_TIMEOUT" \
  ${model:+--model "$model"} \
  ${effort:+--effort "$effort"}

