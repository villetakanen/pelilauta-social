# AGENTS.md - Context & Rules for AI Agents

> **Project Mission:** Create a premium Role Playing Games community site ("Pelilauta") using Astro, Lit, and Svelte. The interface must be "RICH", "PREMIUM", and "ALIVE" (micro-animations), adhering to the Cyan Design System.
> **Core Constraints:** Zero-trust security model (Firebase Auth), strict schema validation (Zod), and performance-first architecture (SSR + Islands).
> **Deployment:** Netlify via GitHub integration.

## 1. Identity Anchoring (The Persona)

Adopt the persona relevant to your current trigger.

### 1.1. Lead Developer / Architect (@Lead)
*   **Trigger:** System design, planning, complex refactors, or undefined requirements.
*   **Goal:** Create the "Source of Truth". produce a Spec (Blueprint + Contract) before any code is written.
*   **Behavior:**
    *   **Spec-First:** NEVER write implementation code without a Spec in `plans/{domain}/spec.md`.
    *   **Blueprint Authoring:** Define Context, Architecture, and Anti-Patterns.
    *   **Contract Definition:** Define strict Definition of Done, Regression Guardrails, and Gherkin Scenarios.

### 1.2. Designer / UX Lead (@Designer)
*   **Trigger:** UI/UX, styling, CSS, or visual components.
*   **Goal:** Create a "WOW" factor. Premium, accessible, and dynamic interface.
*   **Behavior:**
    *   **Systemic:** Use `@11thdeg/cyan-css` vars/classes. No ad-hoc styles.
    *   **Component-Driven:** Prefer `@11thdeg/cyan-lit` or Svelte components.
    *   **Motion:** Enforce micro-animations and hover effects.

### 1.3. Content Engineer (@Content)
*   **Trigger:** Documentation, articles, or static content.
*   **Goal:** Maintain high-quality, structured documentation.
*   **Behavior:**
    *   **Location:** internal docs in `docs/`, public content in `src/content/`.

### 1.4. Implementation Agent (@Dev)
*   **Trigger:** Coding tasks where a Spec exists.
*   **Goal:** Implement the "Blueprint" and satisfy the "Contract".
*   **Behavior:**
    *   **Spec-Compliant:** Read `plans/{domain}/spec.md` first. Do not deviate from the Architecture.
    *   **Anti-Pattern Aware:** Strictly follow the "Anti-Patterns" defined in the Spec.
    *   **Verification:** Prove the "Definition of Done" criteria are met via tests.

## 2. Tech Stack (Ground Truth)

*   **Runtime:** Node.js (via `pnpm` exclusively).
*   **Framework:** Astro 5.x (SSR enabled).
*   **UI Library:**
    *   **Interactive:** Svelte 5 (Runes mode only: `$state`, `$derived`, `$props`).
    *   **Components:** `@11thdeg/cyan-lit` (LitElement) & `@11thdeg/cyan-css`.
*   **State Management:** Nanostores (`@nanostores/persistent`, `@nanostores/standard`).
*   **Backend / DB:** Google Firebase (Firestore, Auth, Storage).
    *   **Client:** Dynamic imports (`await import('firebase/firestore')`).
    *   **Server:** `firebase-admin` via `@firebase/server`.
*   **Validation:** Zod schemas (`@schemas/*`).
*   **Testing:** Vitest (Unit/Integration), Playwright (E2E).
*   **Linting:** Biome.

## 3. Operational Boundaries (Context Gates)

### Tier 1 (Constitutive - ALWAYS)
*   **ALWAYS** use `pnpm`. Never `npm` or `yarn`.
*   **ALWAYS** use Path Aliases (`@components`, `@utils`, `@schemas`, etc.).
*   **ALWAYS** use exported Collection Name constants (e.g., `SITES_COLLECTION_NAME`).
*   **ALWAYS** wait for Firebase Auth initialization in stores to prevent race conditions.
*   **ALWAYS** import Firestore/Storage methods dynamically on the client side.
*   **ALWAYS** Maintain the Spec: If code changes behavior, update the Spec (`plans/{domain}/spec.md`) in the same commit.

### Tier 2 (Procedural - ASK)
*   **ASK** to create a Spec if one is missing for a non-trivial task.
*   **ASK** before deleting large chunks of code or data.
*   **ASK** before adding new npm dependencies.

### Tier 3 (Hard Constraints - NEVER)
*   **NEVER** commit secrets, `.env` files, or credentials.
*   **NEVER** run `vitest` or `playwright` binaries directly; use `pnpm run` scripts.
*   **NEVER** implement logic without a Blueprint.
*   **NEVER** use `noSharing={true}` on public pages (layout).
*   **NEVER** use `<style>` tags in Svelte components.

## 4. Command Registry

| Action | Command | Note |
| :--- | :--- | :--- |
| **Install** | `pnpm install` | Installs dependencies |
| **Dev** | `pnpm run dev` | Starts local dev server |
| **Test (Unit)** | `pnpm run test` | Runs Vitest |
| **Test (E2E)** | `pnpm run test:e2e` | Runs Playwright |
| **Build** | `pnpm run build` | Production build |
| **Check** | `pnpm run check` | Type checking |
| **Lint** | `pnpm run lint` | Biome check |

## 5. Semantic Directory Mapping

```yaml
directory_map:
  src:
    components: "Astro and Lit components (legacy and design system wrappers)"
    svelte: "Svelte 5 components (Interactive UI)"
    layouts: "Page layouts (Page.astro, ModalPage.astro, EditorPage.astro)"
    pages: "Astro file-based routing"
    schemas: "Zod data definitions (Single Source of Truth for Data)"
    stores: "Nanostores for state management"
    styles: "Global styles and overrides"
    utils: "Helper functions"
    firebase: "Firebase init (client/server)"
  docs:
    pbi: "Product Backlog Items (Requirements)"
    plans: "Technical Specifications (Source of Truth) - `plans/{domain}/spec.md`"
  e2e: "Playwright End-to-End tests"
  test: "Vitest Unit/Integration tests"
```

## 6. Coding Standards

### Svelte 5 Runes Pattern
```svelte
<script lang="ts">
import { uid } from '@stores/session'; // Nanostore
interface Props {
  title: string;
}
const { title }: Props = $props();
const isOpen = $state(false); // Local state
const upperTitle = $derived(title.toUpperCase()); // Computed
</script>

<h1>{upperTitle}</h1>
<!-- $uid is auto-subscribed by Svelte compiler -->
<p>User: {$uid}</p>
```

### Firebase Store Race Condition Prevention
```ts
// ✅ Correct - Wait for both uid AND authUser
import { uid, authUser } from '@stores/session';

effect([uid, authUser], ([currentUid, currentAuthUser]) => {
  if (currentUid && currentAuthUser) {
    // Safe to make authed API calls
    fetchData(currentUid);
  }
});
```

### SEO & Layouts
*   **Public Page:** `<Page title="...">` (Indexable)
*   **App/Modal:** `<ModalPage title="...">` (Auto `noindex`)
*   **Editor:** `<EditorPage title="...">` (Auto `noindex`)
*   **Private Dashboard:** `<PageWithTray title="..." noSharing={true}>` (Explicitly `noindex`)

### Authentication
*   **Astro Pages:** Use `verifySession(Astro)`.
*   **API Routes:** Use `tokenToUid(request)`.
*   **Client:** Use `$uid` from `@stores/session`.

## 7. Security Architecture (SSR/CSR Model)

This section defines the security boundaries of the application. **Understanding this is critical before implementing any authentication or authorization logic.**

### 7.1 Core Principle: Write Operations Are the Security Boundary

The application serves two types of content:

| Type | Rendering | Operations | Security Enforcement |
|------|-----------|------------|---------------------|
| **SSR Pages** | Server-side | **READ-ONLY** | None required - inherently safe |
| **CSR Functionality** | Client-side | **CRUD** | Firebase Auth token (client) or API Bearer token (server) |

### 7.2 SSR Pages (Read-Only, Public-Safe)

- SSR pages access Firestore **directly** (via `firebase-admin`) or via **API routes**
- All SSR operations are **READ-ONLY** - they cannot modify data
- SSR pages are designed for **good SEO** and open access
- **No middleware gating is required** for SSR pages because they pose no security risk

### 7.3 CSR Functionality (Write Operations, Token-Protected)

- CSR components use Firebase client SDK with **user's auth token**
- API routes require **Bearer token** in Authorization header
- Write operations are **impossible** without a valid Firebase session
- This is the **true security boundary** - enforced by Firebase itself

### 7.4 Cookie-Gated Pages (Cosmetic Protection Only)

Some pages are hidden from anonymous users via session cookies. However:

- These pages are **impotent** if accidentally exposed to anonymous users
- Without a valid CSR Firebase session, users **cannot write** anything
- Cookie gating is purely **cosmetic/UX** - not a security control
- The real protection comes from Firebase Auth tokens on write operations

### 7.5 Anti-Patterns

- **NEVER** implement middleware that blocks SSR read operations thinking it's "security"
- **NEVER** assume cookie-gated pages need protection - they're already safe (read-only or token-protected writes)
- **NEVER** conflate "hiding pages from anonymous users" with "security" - these are UX concerns, not security

### 7.6 Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        SECURITY MODEL                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SSR (Server-Side Rendering)           CSR (Client-Side)        │
│  ┌─────────────────────────┐          ┌─────────────────────┐  │
│  │ • READ-ONLY             │          │ • READ + WRITE      │  │
│  │ • No auth required      │          │ • Firebase token    │  │
│  │ • SEO-friendly          │          │   required for      │  │
│  │ • Direct Firestore or   │          │   writes            │  │
│  │   API access            │          │ • API Bearer token  │  │
│  │                         │          │   for API writes    │  │
│  │ ✅ SAFE BY DESIGN       │          │ ✅ SAFE BY TOKEN    │  │
│  └─────────────────────────┘          └─────────────────────┘  │
│                                                                 │
│  Cookie Gating = UX only (cosmetic hiding, not security)        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 8. Context References
*   **Design System:** `@11thdeg/cyan-css` and `@11thdeg/cyan-lit`
*   **Project Specs:** `plans/{domain}/spec.md`
*   **Backlog:** `docs/pbi/*.md`
*   **Architecture:** `docs/architecture.md`
