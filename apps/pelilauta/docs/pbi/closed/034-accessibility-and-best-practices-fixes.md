# PBI-034: Accessibility and Best Practices Lighthouse Fixes

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Effort:** 3-5 days  
**Created:** October 20, 2025  
**Last Updated:** October 20, 2025  
**Dependencies:** PBI-033 (RSS Feed API Caching - completed)

**User Story:** As a site visitor and content consumer, I want excellent accessibility and security so that the site is usable by everyone and follows modern web standards.

---

## Problem Statement

### Current Lighthouse Scores (Production)
- ✅ **Performance: FCP 0.7s, LCP 1.5s, Speed Index 0.9s** (Excellent!)
- ⚠️ **Accessibility: 84** → Target: 95+
- ⚠️ **Best Practices: 83** → Target: 95+
- ✅ **SEO: 92** (Good!)
- ✅ **PWA: 100** (Perfect!)

### What This PBI Addresses

This PBI focuses on the **two main gaps** identified in PBI-032:
1. Accessibility improvements (+11 points needed)
2. Best Practices fixes (+12 points needed)

**Out of Scope:** Performance optimization (already excellent), major refactoring

---

## Proposed Solution

### Part 1: Accessibility Improvements (84 → 95+)

#### 1.1 Add ARIA Labels to Icon-Only Buttons

**Problem:** Interactive elements without text need labels for screen readers

**Files to Update:**
- `src/components/client/svelte/FrontpageFabs.svelte`
- `src/components/client/svelte/EditorTools.svelte`
- Any component with icon-only buttons

**Changes:**
```svelte
<!-- Before -->
<button><cn-icon noun="add" /></button>

<!-- After -->
<button aria-label="Create new thread">
  <cn-icon noun="add" />
</button>
```

**Audit Strategy:**
1. Search for all `<button>` tags with only `<cn-icon>` children
2. Search for all `<cn-icon-button>` without labels
3. Add descriptive `aria-label` attributes

#### 1.2 Fix Color Contrast Issues

**Problem:** Some text/background combinations may not meet WCAG AA 4.5:1 ratio

**Tools:**
- Chrome DevTools → Lighthouse → Accessibility audit
- axe DevTools extension
- Manual contrast checker: https://webaim.org/resources/contrastchecker/

**Common Problem Areas:**
- Secondary text (`.text-low` class)
- Disabled buttons
- Placeholder text
- Link colors on colored backgrounds

**Fix Strategy:**
1. Run axe DevTools on main pages
2. Document all contrast failures
3. Adjust CSS variables in `src/overrides.css` or cyan-css

#### 1.3 Keyboard Navigation Improvements

**Problem:** Some interactive elements may not be keyboard accessible

**Testing Checklist:**
- [ ] Tab through all interactive elements on front page
- [ ] Tab through thread creation modal
- [ ] Tab through editor toolbar
- [ ] Verify visible focus indicators on all elements
- [ ] Test Esc key closes modals/trays
- [ ] Test Enter/Space activates buttons

**Fixes:**
- Add `:focus-visible` styles if missing
- Ensure proper tabindex on custom components
- Add keyboard event handlers where needed

#### 1.4 Form Label Associations

**Problem:** Form inputs may be missing proper labels

**Audit:**
- Search for all `<input>`, `<textarea>`, `<select>` elements
- Verify each has associated `<label>` or `aria-label`
- Add `aria-describedby` for help text

**Example Fix:**
```astro
<!-- Before -->
<input type="text" placeholder="Thread title" />

<!-- After -->
<label for="thread-title">Thread title</label>
<input 
  id="thread-title" 
  type="text" 
  aria-describedby="thread-title-help" 
/>
<span id="thread-title-help" class="text-low">
  Enter a descriptive title for your thread
</span>
```

---

### Part 2: Best Practices Fixes (83 → 95+)

#### 2.1 Add Security Headers

**Problem:** Missing Content Security Policy and other security headers

**File to Update:** `netlify.toml`

**Implementation:**
```toml
[[headers]]
  for = "/*"
  [headers.values]
    # Content Security Policy
    Content-Security-Policy = """
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' 
        https://simpleanalyticscdn.com 
        https://browser.sentry-cdn.com 
        https://*.firebaseio.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https: blob:;
      font-src 'self' data:;
      connect-src 'self' 
        https://*.firebaseio.com 
        https://*.googleapis.com 
        https://simpleanalyticscdn.com
        https://sentry.io;
      worker-src 'self' blob:;
      frame-ancestors 'self';
    """
    
    # Security Headers
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "SAMEORIGIN"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```

**Testing:**
1. Deploy to staging
2. Verify site still works (check console for CSP violations)
3. Test Firebase auth, Sentry, Simple Analytics
4. Adjust CSP if needed for any blocked resources

#### 2.2 Fix Console Errors and Warnings

**Problem:** JavaScript errors/warnings appear in browser console

**Audit Process:**
1. Open Chrome DevTools console on front page
2. Navigate to key pages (threads, sites, editor)
3. Document all errors and warnings
4. Categorize by severity and component

**Common Issues:**
- Deprecated API usage
- Missing error boundaries
- Uncaught promise rejections
- Third-party library warnings

**Fix Strategy:**
- Add try-catch blocks where needed
- Update deprecated API calls
- Add error boundaries to Svelte components
- Silence known harmless warnings

#### 2.3 Review and Update Dependencies

**Problem:** Outdated packages may have security vulnerabilities or deprecation warnings

**Commands:**
```bash
# Check for outdated packages
pnpm outdated

# Check for security vulnerabilities
pnpm audit

# Update minor/patch versions
pnpm update

# Check for breaking changes in major versions
pnpm outdated | grep -E "^\s+\w+\s+\d+\.\d+\.\d+\s+→\s+\d+\."
```

**Focus Areas:**
- Firebase SDK updates
- Cyan Design System updates
- Astro framework updates
- Security-critical packages

**Testing Required:**
- Run full test suite after updates
- Manual smoke testing of key features
- Check for breaking changes in changelogs

#### 2.4 Add Skip Links for Keyboard Navigation

**Problem:** Keyboard users may need to tab through navigation to reach main content

**Implementation in PageWithTray.astro:**
```astro
<a href="#main-content" class="skip-link">
  Skip to main content
</a>

<style>
  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: var(--color-primary);
    color: white;
    padding: 8px;
    text-decoration: none;
    z-index: 100;
  }
  
  .skip-link:focus {
    top: 0;
  }
</style>

<main id="main-content">
  <!-- Content -->
</main>
```

---

## Implementation Checklist

### Accessibility (Target: 95+)
- [x] **ARIA Labels** (1-2 hours)
  - [x] Audit all icon-only buttons
  - [x] Add `aria-label` to FrontpageFabs buttons
  - [x] Add `aria-label` to EditorTools buttons
  - [x] Add `aria-label` to navigation icons
  - [ ] Test with screen reader (VoiceOver on macOS)

- [ ] **Color Contrast** (2-3 hours)
  - [ ] Run axe DevTools on front page
  - [ ] Run axe DevTools on thread page
  - [ ] Run axe DevTools on site page
  - [ ] Document all contrast failures
  - [ ] Fix contrast issues in CSS
  - [ ] Re-test with contrast checker

- [ ] **Keyboard Navigation** (2-3 hours)
  - [ ] Tab through front page
  - [ ] Tab through thread creation flow
  - [ ] Tab through page editor
  - [ ] Add visible focus indicators where missing
  - [ ] Test modal keyboard interactions
  - [ ] Test Esc key behavior

- [ ] **Form Labels** (1-2 hours)
  - [ ] Audit all input fields
  - [ ] Add labels where missing
  - [ ] Add `aria-describedby` for help text
  - [ ] Test form accessibility with screen reader

- [ ] **Skip Links** (30 min)
  - [ ] Add skip link to PageWithTray layout
  - [ ] Add skip link to Page layout
  - [ ] Test keyboard navigation with Tab
  - [ ] Verify focus moves to main content

### Best Practices (Target: 95+)
- [x] **Security Headers** (1-2 hours)
  - [x] Add CSP to netlify.toml
  - [x] Add other security headers
  - [ ] Deploy to staging
  - [ ] Test Firebase auth works
  - [ ] Test Sentry works
  - [ ] Test Simple Analytics works
  - [ ] Adjust CSP if needed
  - [ ] Deploy to production

- [ ] **Console Errors** (2-3 hours)
  - [ ] Document all console errors
  - [ ] Fix critical errors
  - [ ] Add error boundaries
  - [ ] Add try-catch for promises
  - [ ] Test error-free console

- [ ] **Dependencies** (1-2 hours)
  - [ ] Run `pnpm outdated`
  - [ ] Run `pnpm audit`
  - [ ] Update safe dependencies
  - [ ] Document breaking changes
  - [ ] Run test suite
  - [ ] Manual smoke test

### Testing & Validation
- [ ] **Lighthouse Audits**
  - [ ] Run Lighthouse on front page
  - [ ] Run Lighthouse on thread page
  - [ ] Run Lighthouse on site page
  - [ ] Verify Accessibility 95+
  - [ ] Verify Best Practices 95+
  - [ ] Document final scores

- [ ] **Manual Testing**
  - [ ] Screen reader testing (VoiceOver)
  - [ ] Keyboard-only navigation
  - [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
  - [ ] Mobile accessibility testing

- [ ] **Documentation**
  - [ ] Update PBI-032 with learnings
  - [ ] Document accessibility patterns
  - [ ] Document CSP policy
  - [ ] Create testing checklist for future

---

## Acceptance Criteria

### Measurable Targets
- [ ] **Accessibility Score: 95+** (currently 84) - +11 points minimum
- [ ] **Best Practices Score: 95+** (currently 83) - +12 points minimum
- [ ] **Performance scores maintained** (FCP, LCP, Speed Index stay excellent)
- [ ] **Zero console errors** on front page load
- [ ] **All interactive elements keyboard accessible**
- [ ] **All images have alt text** or `role="presentation"`
- [ ] **CSP deployed without breaking functionality**

### Quality Gates
- [ ] Lighthouse CI passes with 95+ on Accessibility and Best Practices
- [ ] Manual screen reader testing completed
- [ ] Keyboard navigation testing completed
- [ ] Cross-browser testing passed (4 browsers)
- [ ] No new console errors introduced
- [ ] pnpm audit shows no high/critical vulnerabilities

---

## Success Metrics

### Before (Baseline)
- Accessibility: 84
- Best Practices: 83
- Console Errors: Unknown (to be measured)
- ARIA Coverage: Unknown (to be measured)

### After (Target)
- **Accessibility: 95+** (+11 points minimum)
- **Best Practices: 95+** (+12 points minimum)
- **Console Errors: 0** on front page
- **ARIA Coverage: 100%** on interactive elements

### User Experience Improvements
- ✅ Screen reader users can navigate effectively
- ✅ Keyboard-only users can access all features
- ✅ Improved security posture with CSP
- ✅ Better compliance with web standards
- ✅ Maintained excellent performance metrics

---

## Risk Assessment

### Low Risk
- ✅ Adding ARIA labels (no visual impact)
- ✅ Adding skip links (only visible on focus)
- ✅ Updating dependencies (patch versions)

### Medium Risk
- ⚠️ Color contrast changes (may affect branding)
- ⚠️ Keyboard navigation changes (may change UX)
- ⚠️ Dependency updates (minor versions)

### High Risk
- 🔴 Content Security Policy (can break functionality if misconfigured)
- 🔴 Major dependency updates (can introduce breaking changes)

### Mitigation Strategy
1. **Test CSP in staging first** - verify all functionality
2. **Incremental deployment** - deploy to staging → test → production
3. **Monitor Sentry** - watch for new errors after deployment
4. **Keep rollback plan ready** - git revert if issues arise
5. **Test with real screen readers** - don't rely only on tools

---

## Testing Strategy

### Automated Testing
```bash
# Run Lighthouse CI
pnpm lighthouse https://pelilauta.social/

# Check for accessibility issues with axe-core (future)
# pnpm test:a11y
```

### Manual Testing Checklist
- [ ] **Screen Reader Testing** (VoiceOver on macOS)
  - [ ] Navigate front page with VoiceOver
  - [ ] Test thread creation with VoiceOver
  - [ ] Verify all buttons have labels
  - [ ] Verify form labels are announced

- [ ] **Keyboard Navigation** (Tab/Shift+Tab/Enter/Esc)
  - [ ] Tab through entire front page
  - [ ] Verify visible focus indicators
  - [ ] Test modal open/close with keyboard
  - [ ] Test skip links work

- [ ] **Cross-Browser Testing**
  - [ ] Chrome (accessibility audit + manual)
  - [ ] Firefox (manual testing)
  - [ ] Safari (manual testing + VoiceOver)
  - [ ] Edge (manual testing)

- [ ] **Mobile Testing**
  - [ ] iOS Safari (VoiceOver)
  - [ ] Android Chrome (TalkBack)

---

## Rollback Plan

If issues arise after deployment:

1. **Identify Issue:**
   - Check Sentry for new errors
   - Check Lighthouse scores
   - Check user reports

2. **Quick Fixes:**
   - CSP too strict → adjust in netlify.toml
   - Console errors → add error boundaries
   - Contrast issues → revert CSS changes

3. **Full Rollback:**
   ```bash
   git revert <commit-hash>
   git push
   # Netlify auto-deploys
   ```

4. **Post-Mortem:**
   - Document what went wrong
   - Add to testing checklist
   - Update PBI for next attempt

---

## Related PBIs

- **PBI-032:** Lighthouse Performance Optimization (parent)
- **PBI-033:** RSS Feed API Caching (completed - dependency)
- **Future PBI:** Accessibility automation in CI/CD
- **Future PBI:** Real User Monitoring for accessibility metrics

---

## Notes

- **Focus on measurable impact** - each task must improve Lighthouse scores
- **Test incrementally** - don't deploy all changes at once
- **Prioritize user experience** - scores are means, not ends
- **Document patterns** - create reusable accessibility patterns for team
- **CSP is tricky** - test thoroughly in staging before production
- **Screen reader testing is essential** - automated tools catch only ~30% of issues
- **Keep it simple** - avoid over-engineering accessibility fixes
- **Maintain performance** - don't regress existing excellent metrics

---

## Definition of Done

- [ ] All checklist items completed
- [ ] Lighthouse Accessibility score ≥ 95
- [ ] Lighthouse Best Practices score ≥ 95
- [ ] Performance scores maintained (FCP, LCP, Speed Index)
- [ ] Zero console errors on front page
- [ ] Manual screen reader testing passed
- [ ] Keyboard navigation testing passed
- [ ] Cross-browser testing passed (4 browsers)
- [ ] CSP deployed and verified working
- [ ] Documentation updated
- [ ] Changes deployed to production
- [ ] Lighthouse CI passing on main branch
- [ ] Team reviewed and approved

---

## Time Estimate Breakdown

### Day 1 (4-5 hours)
- ARIA labels audit and implementation (2h)
- Color contrast audit with axe DevTools (1h)
- Skip links implementation (30m)
- Initial testing (1h)

### Day 2 (4-5 hours)
- Color contrast fixes (2h)
- Form label associations (1h)
- Keyboard navigation testing and fixes (2h)

### Day 3 (4-5 hours)
- Security headers implementation (1h)
- Console errors audit and fixes (2h)
- Dependency updates (1h)
- Testing (1h)

### Day 4 (3-4 hours)
- CSP testing and adjustment (2h)
- Final Lighthouse audits (1h)
- Manual accessibility testing (1h)

### Day 5 (2-3 hours - Buffer)
- Cross-browser testing (1h)
- Documentation (1h)
- Deployment and monitoring (1h)

**Total: 17-22 hours (3-5 days at 4-6h/day)**

---

## Success Celebration 🎉

When this PBI is complete, we'll have:
- ✅ 95+ Accessibility score (up from 84)
- ✅ 95+ Best Practices score (up from 83)
- ✅ Modern security headers protecting users
- ✅ Screen reader friendly site
- ✅ Keyboard accessible for all users
- ✅ Maintained excellent performance
- ✅ Better web standards compliance

**This directly improves user experience for people with disabilities and makes the site more secure and professional.**
