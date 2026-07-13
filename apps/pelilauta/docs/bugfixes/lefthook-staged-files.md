# Lefthook Staged Files Configuration Fix

**Date**: 2024
**Issue**: Lefthook pre-commit hook was checking all files instead of only staged files, causing inconsistency with `pnpm check`

## Problem

The lefthook configuration was running `pnpm biome check --write .` which checks **all files** in the project, but users expected it to only check **staged files** (files about to be committed). This caused:

1. Confusion about why lefthook and `pnpm check` behaved differently
2. Slower pre-commit hooks (checking unnecessary files)
3. Potential issues where unstaged files would block commits

## Root Cause

The original `lefthook.yml` configuration was:

```yaml
pre-commit:
  commands:
    lint-and-format:
      run: pnpm biome check --write .
```

This command checks all files (`.` means current directory and subdirectories), not just staged files.

## Solution

Updated `lefthook.yml` to properly handle staged files:

```yaml
pre-commit:
  commands:
    lint-and-format:
      glob: "*.{js,ts,cjs,mjs,jsx,tsx,json,jsonc,astro,svelte}"
      run: pnpm biome check --write --staged --no-errors-on-unmatched {staged_files}
      stage_fixed: true
```

### Key Changes

1. **Added `glob` pattern**: Specifies which file types to check
2. **Added `--staged` flag**: Tells Biome to only check staged files
3. **Added `{staged_files}` placeholder**: Lefthook passes the actual staged files to the command
4. **Added `--no-errors-on-unmatched` flag**: Prevents errors when no files match the pattern
5. **Added `stage_fixed: true`**: Automatically re-stages files that were fixed

## Behavior After Fix

### Pre-commit Hook (Automatic)
- ✅ Runs on `git commit`
- ✅ Checks **only staged files**
- ✅ Fast (only processes files you're committing)
- ✅ Auto-fixes and re-stages fixed files

### Manual Check (`pnpm check`)
- ✅ Run manually when needed
- ✅ Checks **all files** in the project
- ✅ Use after pulling changes or to ensure project-wide consistency

## When to Use Each

| Command | Scope | When to Use |
|---------|-------|-------------|
| Git commit (automatic) | Staged files only | Every commit (automatic) |
| `pnpm check` | All files | After pulling, before pushing, or when you want to check everything |

## Testing the Fix

1. **Test pre-commit hook**:
   ```bash
   # Stage a file with formatting issues
   echo "const x=1" > test.js
   git add test.js
   git commit -m "test"
   # Should fix only test.js
   ```

2. **Test manual check**:
   ```bash
   pnpm check
   # Should check all 612 files in the project
   ```

## Documentation Updates

- Updated `docs/lefthook.md` with detailed explanation of the difference
- Updated `README.md` with linting and formatting section
- Added this bugfix document for future reference

## Related Files

- `lefthook.yml` - Main configuration file
- `docs/lefthook.md` - Comprehensive lefthook documentation
- `README.md` - Quick reference in Key Commands section

## Acceptance Criteria

- ✅ Pre-commit hook only checks staged files
- ✅ `pnpm check` checks all files
- ✅ Both use the same Biome rules
- ✅ Fixed files are automatically re-staged
- ✅ Documentation clearly explains the difference