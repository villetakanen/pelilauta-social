# PBI-041 Styling Guide

## Overview

This document explains the styling approach for the Thread Labels feature (PBI-041), following the Cyan Design System patterns as specified in `AGENTS.md`.

---

## Core Principle

**NO component-level `<style>` tags in Svelte components.**

From `AGENTS.md`:
> Avoid writing `<style>` tags inside the Svelte components, as we are using Lit + external CSS design system classes and atomics for styling.

---

## Why Cyan Design System Classes?

### Benefits

1. **Consistency**: All components use the same design tokens
2. **Performance**: Shared CSS, no duplicate styles
3. **Maintainability**: Change theme tokens, update everywhere
4. **Lightweight**: Components have no style overhead
5. **No Conflicts**: No CSS specificity issues

### What We Use

- **Cyan DS classes**: `.cn-tag`, `.cn-button`, `.cn-card`, etc.
- **Utility classes**: `.flex`, `.gap-1`, `.wrap`, `.p-2`, `.mt-1`
- **Typography**: `.text-caption`, `.downscaled`, `.text-low`
- **Visual utilities**: `.radius-s`, `.radius-m`, `.elevated`, `.accent`
- **Design tokens**: CSS variables like `var(--color-accent)`, `var(--cn-spacing-1)`

---

## Label vs Tag Styling

### Labels (Moderator-Assigned)

**Visual Treatment:**
- Accent color background
- Accent border
- Elevated appearance
- Remove button visible to admins

**Implementation:**
```svelte
<span 
  class="cn-tag elevated accent" 
  style="border: 1px solid var(--color-accent)"
>
  #beginner-friendly
  <button 
    onclick={removeLabel}
    class="text-button p-0 ml-05"
    style="font-size: 1.2em; line-height: 1; opacity: 0.7;"
  >
    ×
  </button>
</span>
```

**Classes Used:**
- `.cn-tag` - Base tag styling from Cyan DS
- `.elevated` - Elevated background color
- `.accent` - Accent color theme
- `.text-button` - Text-style button (no background)
- `.p-0` - No padding
- `.ml-05` - Left margin (half spacing unit)

**Inline Styles:**
- Border color using design token
- Button styling (font size, opacity) - minimal, for fine-tuning

### Tags (User-Generated)

**Visual Treatment:**
- Standard tag styling
- No special background
- No remove button

**Implementation:**
```svelte
<span class="cn-tag">
  #dnd
</span>
```

**Classes Used:**
- `.cn-tag` - Base tag styling, uses standard colors

---

## Component Structure

### LabelManager.svelte

```svelte
<script lang="ts">
  // Script content - no changes needed
</script>

<!-- Main container with padding -->
<section class="p-2">
  <h3 class="text-caption downscaled">{t('admin:thread_labels.title')}</h3>
  <p class="text-caption downscaled text-low mt-05">
    {t('admin:thread_labels.description')}
  </p>
  
  <!-- Input row with flex layout -->
  <div class="flex gap-1 mt-1">
    <input
      type="text"
      bind:value={newLabel}
      placeholder={t('admin:thread_labels.add_placeholder')}
      disabled={updating}
      class="grow"
    />
    <button
      onclick={addLabel}
      disabled={!newLabel.trim() || updating}
      class="button"
    >
      {t('actions:add')}
    </button>
  </div>

  <!-- Tag/label list with flex wrap -->
  {#if allTags.length > 0}
    <div class="mt-2 flex gap-1 wrap">
      {#each allTags as tag}
        {@const isModLabel = isLabel(thread, tag)}
        <span 
          class="cn-tag {isModLabel ? 'elevated accent' : ''}"
          style={isModLabel ? 'border: 1px solid var(--color-accent)' : ''}
        >
          #{tag}
          {#if isModLabel}
            <button
              onclick={() => removeLabel(tag)}
              disabled={updating}
              class="text-button p-0 ml-05"
              style="font-size: 1.2em; line-height: 1; opacity: 0.7;"
              aria-label={t('actions:remove')}
            >
              ×
            </button>
          {/if}
        </span>
      {/each}
    </div>
  {:else}
    <p class="text-caption downscaled text-low mt-2">
      {t('admin:thread_labels.no_items')}
    </p>
  {/if}

  <!-- Legend with flex layout -->
  <div class="mt-2 flex gap-2 text-caption downscaled text-low">
    <div class="flex items-center gap-05">
      <span 
        class="radius-round" 
        style="width: 8px; height: 8px; background-color: var(--color-accent); display: inline-block;"
      ></span>
      {t('admin:thread_labels.label')}
    </div>
    <div class="flex items-center gap-05">
      <span 
        class="radius-round" 
        style="width: 8px; height: 8px; background-color: var(--color-faint); display: inline-block;"
      ></span>
      {t('admin:thread_labels.tag')}
    </div>
  </div>
</section>

<!-- NO <style> TAG -->
```

---

## Class Reference

### Layout Utilities

| Class | Purpose |
|-------|---------|
| `.flex` | Flexbox container |
| `.flex-col` | Flex column direction |
| `.gap-05` | Gap: 0.5 spacing units |
| `.gap-1` | Gap: 1 spacing unit |
| `.gap-2` | Gap: 2 spacing units |
| `.wrap` | Flex wrap |
| `.grow` | Flex grow |
| `.items-center` | Align items center |

### Spacing Atomics

| Class | Purpose |
|-------|---------|
| `.p-0` | Padding: 0 |
| `.p-1` | Padding: 1 unit |
| `.p-2` | Padding: 2 units |
| `.mt-05` | Margin top: 0.5 units |
| `.mt-1` | Margin top: 1 unit |
| `.mt-2` | Margin top: 2 units |
| `.ml-05` | Margin left: 0.5 units |

### Typography

| Class | Purpose |
|-------|---------|
| `.text-caption` | Caption font size |
| `.downscaled` | Slightly smaller |
| `.text-low` | Lower contrast text |
| `.text-high` | Higher contrast text |

### Visual Utilities

| Class | Purpose |
|-------|---------|
| `.radius-s` | Small border radius |
| `.radius-m` | Medium border radius |
| `.radius-round` | Fully rounded (circle) |
| `.border` | Add border |
| `.elevated` | Elevated background |
| `.accent` | Accent color theme |

### Component Classes

| Class | Purpose |
|-------|---------|
| `.cn-tag` | Base tag styling |
| `.cn-button` | Base button styling |
| `.button` | Standard button |
| `.text-button` | Text-style button |

---

## Design Tokens

### Colors

```css
var(--color-accent)           /* Accent color */
var(--color-accent-dark)      /* Dark accent */
var(--color-accent-text)      /* Text on accent */
var(--color-text)             /* Main text color */
var(--color-faint)            /* Faint/subtle color */
var(--background-elevated)    /* Elevated background */
```

### Spacing

```css
var(--cn-spacing-05)          /* 0.5 spacing unit */
var(--cn-spacing-1)           /* 1 spacing unit */
var(--cn-spacing-2)           /* 2 spacing units */
```

### Border Radius

```css
var(--cn-radius-s)            /* Small radius */
var(--cn-radius-m)            /* Medium radius */
var(--cn-radius-l)            /* Large radius */
```

---

## When to Use Inline Styles

### Allowed

✅ **Design token values:**
```svelte
style="border: 1px solid var(--color-accent)"
style="background-color: var(--color-accent)"
```

✅ **Fine-tuning that doesn't warrant a utility class:**
```svelte
style="width: 8px; height: 8px;"
style="font-size: 1.2em; line-height: 1; opacity: 0.7;"
```

### Not Allowed

❌ **Hardcoded colors:**
```svelte
style="border: 1px solid #ff0000"  /* NO - use design token */
```

❌ **Layout that should use utility classes:**
```svelte
style="display: flex; gap: 8px;"  /* NO - use .flex .gap-1 */
```

❌ **Spacing that should use atomics:**
```svelte
style="margin-top: 16px; padding: 8px;"  /* NO - use .mt-2 .p-1 */
```

---

## Migration from Component Styles

### Before (Wrong)

```svelte
<span class="my-label">Label</span>

<style>
  .my-label {
    background-color: var(--color-accent-dark);
    color: var(--color-accent-text);
    border: 1px solid var(--color-accent);
    padding: 4px 8px;
    border-radius: 4px;
  }
</style>
```

### After (Correct)

```svelte
<span 
  class="cn-tag elevated accent" 
  style="border: 1px solid var(--color-accent)"
>
  Label
</span>

<!-- NO <style> tag -->
```

---

## Testing Visual Styling

### Manual Testing Checklist

- [ ] Labels have accent background color
- [ ] Labels have accent border
- [ ] Tags have standard styling
- [ ] Legend dots match colors
- [ ] Spacing is consistent
- [ ] Layout responsive on mobile
- [ ] Remove button aligned properly
- [ ] Hover states work correctly

### Browser Testing

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (desktop)
- [ ] Safari (iOS)
- [ ] Chrome (Android)

### Theme Testing

- [ ] Light mode looks correct
- [ ] Dark mode looks correct
- [ ] High contrast mode works
- [ ] Accent colors apply correctly

---

## Common Issues and Solutions

### Issue: Styling Not Applying

**Cause:** Missing Cyan DS import
**Solution:** Ensure `@11thdeg/cyan-css` is imported in app entry point

### Issue: Wrong Colors

**Cause:** Using hardcoded colors instead of tokens
**Solution:** Use `var(--color-accent)` etc.

### Issue: Inconsistent Spacing

**Cause:** Using inline styles for spacing
**Solution:** Use spacing atomics (`.p-1`, `.mt-2`, etc.)

### Issue: Layout Breaks on Mobile

**Cause:** Not using `.wrap` on flex containers
**Solution:** Add `.wrap` class to allow wrapping

---

## Reference Documentation

- **AGENTS.md**: Project-wide styling guidelines
- **Cyan Design System docs**: https://cyan.11thdeg.com
- **CSS Custom Properties**: Available tokens and values
- **Component examples**: Existing components using Cyan DS

---

## Summary

✅ **DO:**
- Use Cyan DS classes (`.cn-tag`, `.flex`, `.p-2`, etc.)
- Use utility classes for layout and spacing
- Use typography classes for text styling
- Use design tokens in inline styles
- Test in multiple browsers and themes

❌ **DON'T:**
- Add component-level `<style>` tags in Svelte
- Use hardcoded colors or spacing values
- Duplicate styles that exist in Cyan DS
- Create custom classes when utilities exist

**Remember:** Consistency through design system = better UX, easier maintenance, better performance.