# Lefthook setup and usage

This project uses Lefthook to manage Git hooks. We run fast checks on `pre-commit` and validate commit messages with `commitlint`.

## Commands Overview

### Pre-commit Hook (Automatic)
- Runs automatically when you commit
- Checks **only staged files** using `pnpm biome check --write --staged {staged_files}`
- Formats and fixes issues when possible
- Re-stages fixed files automatically
- Fast and efficient for quick commits

### Manual Check (Full Project)
- Run manually with `pnpm check`
- Checks **all files** in the project using `biome check --write .`
- Use this when:
  - You want to check the entire codebase
  - You've pulled changes from others
  - You want to ensure consistency across all files
  - Pre-commit didn't catch something due to file not being staged

## What changed:
- `pre-commit` now runs `pnpm biome check --write --staged {staged_files}` which only checks staged files
- `commit-msg` runs `pnpm commitlint --edit {1}` to validate conventional commits
- A `postinstall` script was added to `package.json` to run `lefthook install` automatically for new clones

## Developer notes

### Installation
- Install dependencies with pnpm or npm as usual. After install, lefthook will be installed automatically via `postinstall`.
- If hooks are not installed (e.g., you use a different package manager), run manually:

```bash
# with pnpm
pnpm install
npx lefthook install

# or with npm
npm install
npx lefthook install
```

### Best Practices
1. **Before committing**: The pre-commit hook will automatically check your staged files
2. **After pulling**: Run `pnpm check` to ensure the entire codebase is consistent
3. **Before pushing**: Run `pnpm test` to ensure all tests pass
4. **When in doubt**: Run `pnpm check` to check everything

### File Coverage
The following file types are checked:
- JavaScript/TypeScript: `*.js`, `*.ts`, `*.jsx`, `*.tsx`
- Config files: `*.json`, `*.jsonc`, `*.cjs`, `*.mjs`
- Component files: `*.astro`, `*.svelte`

## Troubleshooting

### Hooks not running
- If lefthook shows old scripts, remove the `.git/hooks` entries and rerun `npx lefthook install`
- Verify hooks are installed: `npx lefthook run pre-commit --help`

### Inconsistent results between pre-commit and `pnpm check`
- This is expected! Pre-commit only checks **staged files** while `pnpm check` checks **all files**
- If you see issues in CI but not locally, run `pnpm check` to check all files
- Consider running `pnpm check` before pushing to avoid CI failures

### Bypassing hooks (not recommended)
If absolutely necessary:
```bash
git commit --no-verify -m "your message"
```

## Acceptance Criteria
- Pre-commit should auto-format staged files and block commits with unfixable issues
- Commit messages violating Conventional Commits should be rejected
- `pnpm check` should check and fix all files in the project
- CI should pass if `pnpm check` and `pnpm test` pass locally
