# PBI: Restore Lefthook Configuration

**Title:** Restore and Improve Lefthook Git Hooks Configuration

**As a** developer, **I want** proper git hooks that run lint/format checks on pre-commit and commit message validation, **so that** code quality is maintained consistently and commits follow conventional commit standards.

---

### Description

The current lefthook configuration is overly complex and runs checks on `pre-push` instead of `pre-commit`, which is less effective for catching issues early. Additionally, it uses a custom bash script for commitlint instead of the simpler direct command approach.

We should align our lefthook configuration with the design system's cleaner approach that:
- Runs biome check and format on pre-commit (faster feedback)
- Uses direct commitlint command for commit message validation
- Follows simpler, more maintainable patterns

#### Current Configuration Issues:

**File:** `lefthook.yml`
```yaml
pre-push:  # Should be pre-commit for faster feedback
  commands:
    check:
      glob: "*.{js,ts,cjs,mjs,d.cts,d.mts,jsx,tsx,json,jsonc}"
      run: npx @biomejs/biome check --no-errors-on-unmatched --files-ignore-unknown=true {push_files}
    test:unit:  # Unit tests on pre-push might be too slow
      glob: '*.{ts,js,{spec,test}.{ts,js}}'
      run: npx vitest --run

commit-msg:
  scripts:
    "commitlint.sh":  # Unnecessary custom script
      runner: bash
```

**Current custom script:** `.lefthook/.commit-msg/commitlint.sh`
- 7 lines of bash code that could be 1 line
- More complex error handling than needed
- Additional maintenance overhead

**Current commitlint config:** `commitlint.config.ts`
- TypeScript export syntax (unnecessary complexity)
- Missing body-max-line-length rule (can cause issues with longer commit bodies)

#### Proposed Configuration:

**File:** `lefthook.yml`
```yaml
pre-commit:
  commands:
    lint-and-format:
      run: pnpm biome check --write .

commit-msg:
  commands:
    commitlint:
      run: pnpm commitlint --edit {1}
```

**File:** `commitlint.config.js` (simplified from .ts)
```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-max-line-length': [0, 'always', 100],
  },
};
```

### Benefits

- **Faster Feedback:** Pre-commit hooks catch issues before they're committed
- **Simpler Maintenance:** Direct commands instead of custom scripts
- **Consistency:** Aligns with design system patterns
- **Better Developer Experience:** Auto-formatting on commit
- **Reduced Complexity:** Eliminates custom bash scripts and complex globbing

### Implementation Details

#### Package Version Alignment

Current versions vs design system:
- **lefthook**: `^1.11.11` → `^1.12.2` (update to latest)
- **@commitlint/cli**: `^19.6.1` → `^19.8.1` (minor update)
- **@commitlint/config-conventional**: `^19.6.0` → `^19.8.1` (minor update)
- **@biomejs/biome**: `2.2.0` ✓ (already up to date)

#### Files to Modify:

1. **`lefthook.yml`**
   - Replace entire configuration with simplified version
   - Move from pre-push to pre-commit
   - Remove unit test execution (too slow for commits)
   - Use direct pnpm commands

2. **`package.json`**
   - Update lefthook to `^1.12.2`
   - Update commitlint packages to `^19.8.1`
   - Add postinstall script: `"postinstall": "lefthook install"`

3. **Remove custom script:**
   - Delete `.lefthook/.commit-msg/commitlint.sh`
   - Lefthook will clean up automatically

4. **`commitlint.config.ts`**
   - Simplify configuration following design system pattern
   - Add body-max-line-length rule with relaxed 100-character limit
   - Convert from TypeScript to JavaScript for simplicity

#### Git Hook Strategy:

**Pre-commit:**
- Run biome check with `--write` flag to auto-fix issues
- Fast execution (only linting/formatting)
- Block commits with unfixable issues

**Commit-msg:**
- Validate commit message format using conventional commits
- Provide clear feedback on message format issues

**Pre-push considerations:**
- Unit tests moved out of git hooks (too slow)
- Developers should run `pnpm test` manually or in CI/CD
- Focus on fast, essential checks only

#### Merge Protection (Optional Enhancement):

For merge protection to main branch, consider GitHub branch protection rules requiring:
- Status checks must pass (CI/CD build and test)
- No pre-push hooks needed if CI/CD handles comprehensive testing

### Acceptance Criteria

- [ ] Pre-commit hook runs biome check and formats code automatically
- [ ] Pre-commit hook blocks commits with unfixable linting issues
- [ ] Commit message validation works with conventional commit format
- [ ] Custom commitlint.sh script is removed
- [ ] Commitlint config simplified to JavaScript with body-max-line-length rule
- [ ] Lefthook packages are updated to latest versions
- [ ] Postinstall script ensures lefthook is installed for new developers
- [ ] Hook execution is fast (< 2 seconds for typical commits)
- [ ] Hooks work consistently across different developer environments
- [ ] Documentation updated if needed

### Testing Requirements

- [ ] Manual testing: Make a commit with lint issues → should auto-fix
- [ ] Manual testing: Make a commit with unfixable issues → should block
- [ ] Manual testing: Use invalid commit message → should reject
- [ ] Manual testing: Use valid conventional commit → should accept
- [ ] Fresh clone test: Verify postinstall sets up hooks correctly
- [ ] Cross-platform test: Verify hooks work on macOS, Linux, Windows

### Priority

**Medium Priority** - Improves developer experience and code quality consistency. Current setup works but is unnecessarily complex and provides slower feedback.

### Estimated Effort

**Small** - Straightforward configuration changes:
- Update package.json dependencies (3 packages)
- Replace lefthook.yml configuration (10 lines → 8 lines)
- Add postinstall script
- Remove custom script file
- Test on local development environment

### Migration Strategy

1. **Phase 1:** Update package dependencies and add postinstall script
2. **Phase 2:** Replace lefthook.yml configuration
3. **Phase 3:** Remove custom commitlint.sh script
4. **Phase 4:** Test pre-commit and commit-msg hooks locally
5. **Phase 5:** Commit changes and verify hooks work in practice
6. **Phase 6:** Document any team workflow changes if needed

### Rollback Plan

If issues arise:
1. Revert lefthook.yml to previous version
2. Restore custom commitlint.sh script
3. Downgrade package versions if compatibility issues occur

The changes are minimal and easily reversible, making this a low-risk improvement.
