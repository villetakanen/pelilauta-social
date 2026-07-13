# Package Manager: pnpm

**This project uses `pnpm` as the exclusive package manager.**

## Why pnpm?

- **Disk efficiency**: Uses a content-addressable store for all packages
- **Fast installations**: Links packages from a single store instead of copying
- **Strict dependency resolution**: Prevents phantom dependencies
- **Monorepo support**: Better workspace handling than npm
- **Lock file**: `pnpm-lock.yaml` ensures consistent installations

## Enforcement

### 1. package.json Configuration

The `packageManager` field in `package.json` specifies the required version:

```json
{
  "packageManager": "pnpm@8.0.0"
}
```

This field is used by:
- **Corepack** (Node.js 16.9+): Automatically uses the correct package manager
- **CI/CD systems**: Validates the package manager version
- **IDE integrations**: Provides warnings if wrong package manager is used

### 2. Agent Instructions

All AI agent instruction files specify pnpm usage:
- `.github/copilot-instructions.md`
- `AGENTS.md`
- `GEMINI.md`

These files instruct AI assistants to always use `pnpm` commands in:
- Documentation
- Scripts
- Code examples
- Terminal commands

### 3. Lock Files

The project maintains `pnpm-lock.yaml` as the source of truth for dependencies.

**Note:** `package-lock.json` exists for legacy reasons but should not be used. Consider removing it:

```bash
rm package-lock.json
echo "package-lock.json" >> .gitignore
```

## Usage

### Installation

```bash
# Install pnpm globally (if not already installed)
npm install -g pnpm

# Or use Corepack (Node.js 16.9+)
corepack enable
corepack prepare pnpm@8.0.0 --activate
```

### Common Commands

```bash
# Install dependencies
pnpm install

# Add a package
pnpm add package-name
pnpm add -D package-name  # dev dependency

# Remove a package
pnpm remove package-name

# Run scripts
pnpm run dev
pnpm run build
pnpm run test
pnpm run test:e2e

# Update dependencies
pnpm update
pnpm update package-name

# Clean install (remove node_modules and reinstall)
pnpm install --force
```

### Scripts Compatibility

Some scripts in `package.json` still reference `npm` internally (e.g., `npm run generateSW`). These are:
- Legacy references that should be updated to `pnpm`
- Third-party tools that internally use npm

To find and update these:

```bash
# Find npm references in package.json
grep -n "npm " package.json

# Update them to pnpm
sed -i '' 's/npm run/pnpm run/g' package.json
```

## CI/CD Configuration

### GitHub Actions

```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8.0.0
      
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm run test
```

### Netlify

Add to `netlify.toml`:

```toml
[build.environment]
  NPM_FLAGS = "--version"  # Disable npm
  NODE_VERSION = "20"

[build]
  command = "pnpm install && pnpm run build"
  publish = "dist"
```

Or use build plugins:
1. Install: `pnpm add -D @netlify/plugin-pnpm`
2. Configure in `netlify.toml`:

```toml
[[plugins]]
  package = "@netlify/plugin-pnpm"
```

## Troubleshooting

### "pnpm: command not found"

**Solution:**
```bash
npm install -g pnpm
# or
corepack enable
```

### "Lockfile is up to date, resolution step is skipped"

This is normal behavior. pnpm is very efficient and skips unnecessary work.

### "ERR_PNPM_OUTDATED_LOCKFILE"

**Solution:**
```bash
pnpm install --no-frozen-lockfile
# Then commit the updated pnpm-lock.yaml
```

### Phantom Dependencies

If code imports a package not listed in `package.json`:

**Error:**
```
Cannot find module 'some-package'
```

**Solution:** Add the package explicitly:
```bash
pnpm add some-package
```

Unlike npm/yarn, pnpm enforces strict dependency resolution.

### Mixed Lock Files

If you see both `package-lock.json` and `pnpm-lock.yaml`:

**Solution:**
```bash
# Remove npm lock file
rm package-lock.json

# Add to .gitignore
echo "package-lock.json" >> .gitignore

# Reinstall with pnpm
pnpm install
```

## Migration from npm

If you're migrating from npm to pnpm:

```bash
# 1. Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# 2. Install with pnpm
pnpm install

# 3. Update scripts in package.json
sed -i '' 's/npm run/pnpm run/g' package.json
sed -i '' 's/npm install/pnpm install/g' package.json

# 4. Test everything works
pnpm run dev
pnpm run build
pnpm run test

# 5. Commit changes
git add pnpm-lock.yaml package.json .gitignore
git commit -m "chore: migrate to pnpm"
```

## For Contributors

### New Contributors

When cloning the repository:

```bash
# Clone
git clone <repository-url>
cd pelilauta-17

# Install pnpm if needed
npm install -g pnpm

# Install dependencies
pnpm install

# Start development
pnpm run dev
```

### Pull Requests

- ✅ Always use `pnpm install` to add dependencies
- ✅ Commit `pnpm-lock.yaml` changes
- ✅ Run `pnpm install` before pushing if `package.json` changed
- ❌ Never commit `package-lock.json` or `yarn.lock`
- ❌ Never use `npm install` or `yarn install`

### Code Review Checklist

When reviewing PRs, check:
- [ ] No `package-lock.json` or `yarn.lock` added
- [ ] `pnpm-lock.yaml` updated if dependencies changed
- [ ] Documentation uses `pnpm` commands (not `npm` or `yarn`)
- [ ] Scripts use `pnpm run` (not `npm run`)

## Resources

- **Official Documentation**: https://pnpm.io/
- **Motivation**: https://pnpm.io/motivation
- **CLI Commands**: https://pnpm.io/cli/install
- **Workspaces**: https://pnpm.io/workspaces
- **FAQ**: https://pnpm.io/faq

## Support

If you encounter issues with pnpm:

1. Check the [pnpm documentation](https://pnpm.io/)
2. Search [GitHub issues](https://github.com/pnpm/pnpm/issues)
3. Ask in project chat/Slack
4. Create an issue in this repository with:
   - pnpm version (`pnpm --version`)
   - Node version (`node --version`)
   - Error message
   - Steps to reproduce

---

**Last Updated:** 2025-01-06  
**pnpm Version:** 8.0.0  
**Node Version:** >=20.0.0  
**Status:** ✅ Enforced project-wide