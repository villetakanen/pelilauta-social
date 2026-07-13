# pnpm Quick Reference Card

**⚡ Fast, disk-efficient package manager**

## Essential Commands

### Installation & Setup
```bash
# Install pnpm globally
npm install -g pnpm

# Or use Corepack (Node.js 16.9+)
corepack enable
corepack prepare pnpm@8.0.0 --activate

# Verify installation
pnpm --version
```

### Daily Usage
```bash
# Install all dependencies
pnpm install

# Install from scratch (clean install)
pnpm install --frozen-lockfile

# Add a package
pnpm add <package>
pnpm add -D <package>          # Dev dependency
pnpm add -g <package>          # Global

# Remove a package
pnpm remove <package>

# Update packages
pnpm update                    # All packages
pnpm update <package>          # Specific package

# Run scripts
pnpm run dev
pnpm run build
pnpm run test
pnpm run test:e2e

# Shorter syntax (if script doesn't conflict)
pnpm dev
pnpm build
pnpm test
```

### Project-Specific Scripts
```bash
# Development
pnpm run dev                   # Start dev server
pnpm run build                 # Build for production
pnpm run preview               # Preview production build

# Testing
pnpm run test                  # Unit tests
pnpm run test:api              # API tests
pnpm run test:e2e              # E2E tests
pnpm run test:e2e:debug        # E2E tests with debugger

# Code Quality
pnpm run check                 # Biome lint and format
pnpm run astro check           # Astro type checking

# Database
pnpm run init-test-db          # Initialize test database
```

## Quick Comparisons

| Task | npm | pnpm |
|------|-----|------|
| Install | `npm install` | `pnpm install` |
| Add package | `npm install pkg` | `pnpm add pkg` |
| Add dev dep | `npm install -D pkg` | `pnpm add -D pkg` |
| Remove | `npm uninstall pkg` | `pnpm remove pkg` |
| Update | `npm update` | `pnpm update` |
| Run script | `npm run script` | `pnpm run script` |
| Global install | `npm install -g pkg` | `pnpm add -g pkg` |
| List | `npm list` | `pnpm list` |

## Why pnpm?

✅ **3x faster** than npm  
✅ **Saves disk space** (hard links instead of copies)  
✅ **Strict dependencies** (no phantom dependencies)  
✅ **Better monorepo** support  
✅ **Compatible** with npm packages

## Common Issues

### "pnpm: command not found"
```bash
npm install -g pnpm
```

### "ERR_PNPM_OUTDATED_LOCKFILE"
```bash
pnpm install --no-frozen-lockfile
```

### Phantom dependency error
```bash
# Add the missing package explicitly
pnpm add <missing-package>
```

### Clear cache
```bash
pnpm store prune
```

### Reinstall everything
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Don't Use npm!

❌ **Never use:**
- `npm install`
- `npm run <script>`
- `npm update`

✅ **Always use:**
- `pnpm install`
- `pnpm run <script>`
- `pnpm update`

## More Info

📖 Official Docs: https://pnpm.io/  
📖 Project Guide: `docs/package-manager.md`  
📖 CLI Reference: https://pnpm.io/cli/install

---

**Keep this card handy!** Pin to your workspace or bookmark this file.