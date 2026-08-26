# Minimum Fidelity Audit

This audit records visual, functional and structural defects in `apps/pelilauta`
after removing legacy Cyan stylesheets, comparing `https://pelilauta.social` with
the repository.

---

## Executive summary

Deprecating `@11thdeg/cyan-css` exposed hundreds of call sites that rely on
unsupported atomic classes, missing content containers and unstyled markup.
While the front page (`/`), the channel directory (`/channels`) and the thread view
(`/threads/[threadKey]`) received initial triage, numerous application surfaces
remain below minimum fidelity.

The defects fall into six architectural categories:

1. **Missing content container for card collections**: Deleting `.content-cards`
   left `/library`, `/sites` and `/admin/sites` without layout containment, so
   cards stretch or stack unconstrained.
2. **Preflight margin collapse in prose flow**: User-authored wiki and document
   surfaces (`PageArticle.astro`, `PageSidebar.astro`, `HandoutApp.astro`,
   `docs/[id].astro`, `EulaForm.svelte`) render HTML without `class="text-prose"`.
   Because `preflight.css` resets margins on headings, paragraphs and lists to
   zero, prose content collapses vertically.
3. **Unwrapped form controls**: Form fields authored with sibling `<label>` and
   `<input>` elements do not match `fields.css` selectors (`label:has(> input)`),
   losing container styling, label typography, focus states and field borders.
4. **Missing surface backing over posters**: Containers over site artwork rely
   on bare `<article>` or `.elevation-1` without `.surface`. Under `poster.css`,
   only `.surface` receives translucent attenuation. Bare elements render text
   directly against unattenuated artwork.
5. **Dangling Cyan and Tailwind atomics**: Over 400 dead class instances
   (`toolbar`, `grow`, `p-2`, `m-0`, `flex`, `flex-col`, `downscaled`,
   `sm-hidden`, `border-t`, `text-h5`) remain in templates, leaving toolbars and
   action rows unaligned.
6. **Critical functional and auth defects**: Missing `return` statements on SSR
   redirects crash the server, several editor pages lack SSR session guards,
   and buttons lack click handlers.

---

## Findings by application area

### Area 1: Library and sites directory

| File | Line | Defect | Impact |
| :--- | :--- | :--- | :--- |
| `apps/pelilauta/src/components/svelte/site-library/UserSitesList.svelte` | 21 | `<div class="content-cards">` | Dead container class. Cards stack without column constraints or container query context. |
| `apps/pelilauta/src/components/svelte/site-library/UserSitesList.svelte` | 23–24 | `<nav class="toolbar"><h1 class="grow">` | Dead `toolbar` and `grow` classes. `h1` spans full width and drops sort controls onto an unaligned row. |
| `apps/pelilauta/src/components/svelte/site-library/UserSitesList.svelte` | 25–40 | Sorting buttons toggle | Swapping filled and `.text` buttons lacks button group layout or spatial interval. |
| `apps/pelilauta/src/components/svelte/site-library/UserSitesList.svelte` | 45–47 | `<footer><p>` count | Bare paragraph text without caption styling or alignment. |
| `apps/pelilauta/src/components/server/SiteList/PublicSiteListing.astro` | 29 | `<section class="content-cards">` | Dead container class. Public directory lacks card grid constraints. |
| `apps/pelilauta/src/components/server/SiteList/PublicSiteListing.astro` | 31, 42 | `<div class="toolbar">` | Dead class in header and footer. Title and `MySitesButton` do not align. |
| `apps/pelilauta/src/components/svelte/sites/SiteCard.svelte` | 15–16 | Runes derivation | `$derived(() => ...)` passes arrow functions, requiring function calls in templates (`owns()`) rather than boolean evaluation. |
| `apps/pelilauta/src/components/svelte/sites/SiteCard.svelte` | 37–57 | Missing `eyebrow` slot | Omits the system tag link `specs/pelilauta/sites/site-card/spec.md` governs. |
| `apps/pelilauta/src/components/svelte/sites/SiteCard.svelte` | 59–66 | App-local `<style>` | Uses scoped `.membership` style instead of design system primitives. |
| `apps/pelilauta/src/components/svelte/site-library/LibrarySitesFabs.svelte` | 9 | `sm-hidden` | Dead class. FAB responsiveness belongs in `fab.css` container queries. |
| `apps/pelilauta/src/components/server/SiteList/SiteListItem.astro` | 1–111 | Entire component | Legacy v18 artifact containing dead Tailwind and Cyan classes; current routes do not use it. |

---

### Area 2: Site pages, wikis, and sub-features

| File | Line | Defect | Impact |
| :--- | :--- | :--- | :--- |
| `apps/pelilauta/src/components/server/sites/pages/PageArticle.astro` | 15–18 | `set:html={page.htmlContent}` | Missing `class="text-prose"`. Wiki markdown blocks collapse with zero vertical margins. |
| `apps/pelilauta/src/components/server/SiteApp/PageSidebar.astro` | 54 | `set:html={sidebarPage.htmlContent}` | Custom sidebar content lacks `text-prose` and collapses vertically. |
| `apps/pelilauta/src/components/server/SiteApp/PageSidebar.astro` | 57 | Link href | Uses invalid route `/sites/${site.key}/pages/${sidebarPage.key}` instead of `/sites/${site.key}/${sidebarPage.key}`. |
| `apps/pelilauta/src/components/server/SiteApp/PageSidebar.astro` | 13, 39 | `withPosterCSS` | Missing `.surface` when `posterURL` is absent, so text renders directly over background artwork without a ground plane. |
| `apps/pelilauta/src/components/server/SiteApp/HandoutApp.astro` | 14, 16 | `<section class="handout elevation-1 p-2">` | Lacks `.surface`, so elevation lacks padding, and inner content lacks `text-prose`. |
| `apps/pelilauta/src/pages/sites/[siteKey]/handouts/[id]/index.astro` | 32 | Handout redirect route | Redirects to invalid singular `/sites/${siteKey}/handout/` instead of `/sites/${siteKey}/handouts`. |
| `apps/pelilauta/src/pages/sites/[siteKey]/handouts/[id]/edit.astro` | 42 | Handout redirect route | Redirects to invalid singular `/sites/${siteKey}/handout/`. |
| `apps/pelilauta/src/components/svelte/sites/settings/SiteThemingSection.svelte` | 20–21 | Inline background image | Sets raw background URL on container without `poster.css` scrim, breaking form control contrast. |
| `apps/pelilauta/src/components/svelte/sites/Clock.svelte` | 35 | Variable leak | Renders boolean variable `{view}` into text label: `<p class="grow">{clock.label} {view}`. |
| `apps/pelilauta/src/components/svelte/sites/ClocksApp.svelte` | 19, 21–25 | Missing surface and invalid HTML | `<article>` lacks `.surface`. `<ul>` contains `<StoryClock>` without `<li>` elements. |
| `apps/pelilauta/src/components/svelte/sites/handouts/HandoutList.svelte` | 8–18 | Invalid HTML list | `<section>` contains `<HandoutListItem>`, which renders `<li>` elements without a parent `<ul>`. |
| `apps/pelilauta/src/components/svelte/sites/history/PageHistoryArticle.svelte` | 129–130 | Dead diff classes | `.diff-added` and `.diff-deletion` declare no CSS rules, leaving diff additions and deletions unstyled. |
| `apps/pelilauta/src/components/svelte/page-editor/PageEditorForm.svelte` | 180–182 | Dead tag classes | Uses dead `tags`, `py-1`, `flex` and `cn-tag` classes instead of `.chip-list` and `.chip`. |
| `apps/pelilauta/src/components/svelte/sites/settings/SiteDangerZoneSection.svelte` | 38, 52 | Dead alert classes | Uses dead `radius-m`, `warning` and `notify` classes instead of `.surface.error`. |
| `apps/pelilauta/src/components/svelte/sites/import/PreviewImport.svelte` | 171–221 | Dead classes | Uses dead `toolbar`, `flex-col`, `border`, `text-warning`, `text-info` and `text-success` classes. |
| `apps/pelilauta/src/components/svelte/sites/CreateClockApp.svelte` | 52, 114 | Dead classes and missing surface | `<section class="border p-2">` lacks `.surface` and uses dead `toolbar`. |
| `apps/pelilauta/src/components/svelte/sites/CreatePageForm.svelte` | 94, 139 | Missing surface and dead toolbar | `<section>` lacks `.surface` and uses dead `toolbar` and `justify-end`. |
| `apps/pelilauta/src/components/svelte/sites/CreateSiteForm.svelte` | 113, 139 | Missing surface and dead classes | Uses dead `column`, `downscaled`, `p-1` and `border` classes. |

---

### Area 3: Core user, session, navigation, and meta

| File | Line | Defect | Impact |
| :--- | :--- | :--- | :--- |
| `apps/pelilauta/src/pages/logout.astro` | 15–23 | Unstyled raw HTML | Renders bare unstyled `<p>Signing out...</p>` with no `BaseHead` or `ds.css` link. |
| `apps/pelilauta/src/pages/create-profile.astro` | 7 | Wrong modal title | Uses `t('app:docs.title')` ("Dokumentaatio") instead of `settings:profile.create.title`. |
| `apps/pelilauta/src/pages/onboarding.astro` | 14 | Wrong modal title | Uses `t('app:docs.title')` instead of onboarding title key. |
| `apps/pelilauta/src/pages/eula.astro` | 14 | Wrong modal title | Uses `t('app:docs.title')` instead of EULA title key. |
| `apps/pelilauta/src/components/svelte/CreateProfileForm.svelte` | 30–36 | Unwrapped form controls | `<label for="...">` and `<input>` are sibling elements, breaking `fields.css` styling. |
| `apps/pelilauta/src/components/svelte/eula/EulaForm.svelte` | 105 | Dead `prose` class | `<article class="prose">` uses dead Tailwind class instead of `text-prose`. |
| `apps/pelilauta/src/components/svelte/eula/NickNameInput.svelte` | 100–102 | Dead flex and grow | `<div class="flex flex-no-wrap"><fieldset class="grow">` misaligns avatar and input. |
| `apps/pelilauta/src/pages/settings.astro` | 14–19 | Redundant prose wrapper | Stacks outer `.content-prose` above the inner `.content-prose` of `SettingsApp.svelte`. |
| `apps/pelilauta/src/components/svelte/settings/ProfileTool.svelte` | 111, 116 | Dead `text-h5` | Scale stops at `h4`. `h5` declares no CSS rules. |
| `apps/pelilauta/src/components/svelte/settings/ProfileTool.svelte` | 141–149 | Legacy Lit component | Uses `<cn-avatar-button>` from Cyan 3 instead of Svelte avatar control. |
| `apps/pelilauta/src/components/svelte/settings/ProfileTool.svelte` | 164–186 | Dead list and card classes | Uses dead `flex-col`, `gap-1`, `surface-2`, `radius-s` and `button-icon` classes. |
| `apps/pelilauta/src/components/svelte/settings/AuthnSection.svelte` | 58–62 | Missing surface and dead classes | `<section>` lacks `.surface` and uses dead `downscaled`, `field-grid` and `my-1` classes. |
| `apps/pelilauta/src/components/svelte/settings/RemoveAccountSection.svelte` | 80, 88 | Missing surface | Uses `.elevation-1` and `.elevation-2` without `.surface`. |
| `apps/pelilauta/src/pages/profiles/[uid].astro` | 38 | Uncontained `h1` | `<h1>` renders directly in `.app-main` outside `.content-triad`. |
| `apps/pelilauta/src/pages/search.astro` | 18 | Uncontained `h1` | `<h1>` renders directly in `.app-main` outside `.content-prose`. |
| `apps/pelilauta/src/components/svelte/search/AlgoliaSearchApp.svelte` | 188–233 | Dead search classes | Uses dead `toolbar`, `search-input`, `search-button`, `bg-surface-variant` and `text-link` classes. |
| `apps/pelilauta/src/components/svelte/search/SearchResult.svelte` | 20–28 | Missing surface container | Uses dead `search-result`, `border-t`, `text-h5` and `read-more` classes without `.surface`. |
| `apps/pelilauta/src/pages/docs/[id].astro` | 19–24 | Missing `text-prose` | `<article>` lacks `class="text-prose"`, so markdown vertical margins collapse. |
| `apps/pelilauta/src/pages/403.astro` | 9–24 | Dead classes and unstyled links | Uses dead `flex-col`, `p-4` and `toolbar` classes. Links lack `class="button"`. Page contains hardcoded English. |
| `apps/pelilauta/src/pages/404.astro` | 12 | Dead subtitle class | Uses dead `subtitle` class; valid class is `text-subtitle`. |
| `apps/pelilauta/src/pages/offline.html.astro` | 15–40 | Broken layout and hardcoded title | Overrides `.app-main` with viewport height override. Buttons lack `.button` class. Title hardcodes "Pelilauta 16". |
| `apps/pelilauta/src/components/server/BaseHead/BaseHead.astro` | 45, 69 | Legacy metadata branding | Hardcodes "Pelilauta 16" in OpenGraph and Apple PWA title tags. |

---

### Area 4: Forum, channels, threads, and tags

| File | Line | Defect | Impact |
| :--- | :--- | :--- | :--- |
| `apps/pelilauta/src/components/server/FrontPage/TopThreadsStream.astro` | 49 | Dead error class | `<div class="error">` lacks `.surface`. Error text fails contrast rules. |
| `apps/pelilauta/src/components/svelte/threads/ChannelFabs.svelte` | 16, 18 | Dead classes | `<a>` lacks `class="button fab"` and uses dead `sm-hidden`. |
| `apps/pelilauta/src/pages/threads/[threadKey]/edit.astro` | 1–30 | Missing SSR auth guard | Shell lacks `requireSession(Astro)` check while `EditorPage.astro` omits client `AuthManager`. |
| `apps/pelilauta/src/pages/threads/[threadKey]/replies/[replyKey]/fork.astro` | 17, 30 | Missing `return` on redirect | Calls `Astro.redirect('/404')` without `return`. Execution continues and crashes on invalid parameters. |
| `apps/pelilauta/src/pages/threads/[threadKey]/replies/[replyKey]/fork.astro` | 1–40 | Missing SSR auth guard | Lacks `requireSession(Astro)` check. |
| `apps/pelilauta/src/components/svelte/thread-editor/ThreadEditorForm.svelte` | 183–185 | Dead tag classes | Uses dead `elevation-1`, `p-1` and `cn-tag` classes instead of `.chip-list` and `.chip`. |
| `apps/pelilauta/src/components/svelte/thread-editor/ThreadEditorForm.svelte` | 191–195 | Inactive delete button | `<button type="button" class="text">` has no `onclick` or navigation link to `/confirmDelete`. |
| `apps/pelilauta/src/components/svelte/thread-editor/ForkThreadApp.svelte` | 144–150 | Dead layout classes | Uses dead `mb-2`, `m-0`, `downscaled` and undeclared `clip-after-3` classes. |
| `apps/pelilauta/src/pages/tags/[tag].astro` | 120–149 | Unstyled lists and inline styles | Uses inline `margin-bottom` calculation and dead `flex` and `items-center` on `<li>`. |
| `apps/pelilauta/src/components/server/TagHeader.astro` | 14 | Dead border class | Uses dead `mb-2`, `pb-2` and `border-b` classes. |

---

### Area 5: Admin and debug tools

| File | Line | Defect | Impact |
| :--- | :--- | :--- | :--- |
| `apps/pelilauta/src/pages/admin/index.astro` | 14–20 | Missing `h1` and unstyled banner | Document outline lacks `h1`. Tool banner places icon and text in bare unaligned `<div>`. |
| `apps/pelilauta/src/components/svelte/admin/channels/ChannelsAdmin.svelte` | 110–177 | Dead listing classes | Uses dead `content-listing`, `toolbar`, `px-0`, `grow`, `p-4`, `border-error` and `text-error` classes. |
| `apps/pelilauta/src/components/svelte/admin/channels/ChannelSettings.svelte` | 176–224 | Dead grid and flex classes | Uses dead `cols-2`, `flex-row`, `flex-none`, `grow`, `text-warning` and `toolbar` classes. |
| `apps/pelilauta/src/components/svelte/admin/channels/AddChannelForm.svelte` | 98–176 | Dead classes | Uses dead `border-success`, `bg-success-low`, `space-y-4`, `border-error`, `text-error` and `toolbar` classes. |
| `apps/pelilauta/src/pages/admin/channels/add.astro` | 10–12 | Malformed frontmatter | Contains duplicate Astro frontmatter delimiter (`---\n\n---`). |
| `apps/pelilauta/src/components/svelte/admin/SocialMediaPoster.svelte` | 30–47 | Missing surface and dead button | Renders inside `Admin.astro` without `.surface` and uses dead `downscaled` and `cn-button` classes. |
| `apps/pelilauta/src/components/svelte/admin/SitesAdmin.svelte` | 47–66 | Missing cards and dead toolbar | Site entries render as loose unstyled text nodes inside dead `toolbar` without card styling. |
| `apps/pelilauta/src/components/svelte/admin/SnackbarTestApp.svelte` | 65–139 | Dead layout classes | Uses dead `downscaled`, `mt-2`, `mb-1`, `flex-col`, `radius-m` and `toolbar` classes. |
| `apps/pelilauta/src/components/svelte/admin/UserAdmin.svelte` | 34–56 | Unstyled grid and dead classes | Uses hardcoded 5-column grid without container queries and uses `.elevation-1` without `.surface`. |
| `apps/pelilauta/src/components/svelte/debug/SessionPurge.svelte` | 126–158 | Dead classes and inline styles | Uses `.elevation-1` without `.surface`, dead `text-left`, `list-disc` and `pl-4` classes, and inline background colour override. |
| `apps/pelilauta/src/components/svelte/ui/NounSelect.svelte` | 243–389 | Dead legacy tokens | Reads deleted `--color-surface`, `--color-border`, `--radius-s`, `--color-focus` and `--color-primary` tokens. |

---

## Core architectural remedies

Apply these patterns across affected routes:

### Card containers
* Replace `.content-cards` on `/sites`, `/library` and `/admin/sites` with `.content-prose` or a dedicated card grid container.
* Wrap listing headers in alignment layouts and remove dead `toolbar` and `grow` classes.

### Prose flow
* Add `class="text-prose"` to container elements rendering markdown or user HTML:
  - `PageArticle.astro:15`
  - `PageSidebar.astro:54`
  - `HandoutApp.astro:16`
  - `docs/[id].astro:20`
  - `EulaForm.svelte:105`

### Form fields
* Wrap sibling `<label>` and `<input>` markup inside the `<label>` element:
  ```html
  <label>
    {t('field.label')}
    <input type="text" ... />
  </label>
  ```
* Place form sections inside `.surface` containers.

### Surface and poster contrast
* Replace `.elevation-X` wrappers with `.surface` or `.surface.elevation-X`.
* Remove conditional logic that strips `.surface` when `posterURL` is absent.

### Runtime and authentication
* Return `Astro.redirect('/404')` in `threads/.../fork.astro:17,30`.
* Add `requireSession(Astro)` to `threads/.../edit.astro` and `threads/.../fork.astro`.
* Wire the delete action in `ThreadEditorForm.svelte:191-195` to `/threads/${thread.key}/confirmDelete`.
