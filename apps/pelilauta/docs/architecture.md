# Pelilauta Architecture

> **Status:** Live

This document describes the high-level architecture of Pelilauta, with emphasis on the security model and rendering strategies.

## 1. Overview

Pelilauta is a role-playing games community platform built with:

- **Astro** (SSR framework)
- **Svelte 5** (CSR interactivity)
- **Firebase** (Auth, Firestore, Storage)
- **Netlify** (hosting)

The architecture follows a hybrid SSR/CSR pattern where server-side rendering provides SEO-friendly read-only content, and client-side rendering enables authenticated interactive features.

## 2. Security Model

### 2.1 Core Principle: Write Operations Are the Security Boundary

The fundamental insight of this architecture is that **read operations are inherently safe** and **write operations are protected by Firebase Auth tokens**.

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

### 2.2 Three Sub-Solutions

#### 2.2.1 SSR Read-Only Pages (Public, SEO-Optimized)

**Purpose:** Serve content with good SEO for open access.

**Characteristics:**
- Rendered on the server using Astro
- Access Firestore via `firebase-admin` (server-side) or API routes
- **READ-ONLY operations only** - cannot modify data
- No authentication required for rendering
- Publicly accessible, search engine indexable

**Data Access Patterns:**
- Direct Firestore access when data is SSR-specific
- API routes when data is shared with CSR functionality

**Security:** Inherently safe - no write capability exists.

#### 2.2.2 CSR Interactive Features (Authenticated, CRUD)

**Purpose:** Enable logged-in users to create, read, update, and delete content.

**Characteristics:**
- Rendered on the client using Svelte 5
- Access Firestore via Firebase client SDK (with user's auth token)
- Access API routes with Bearer token in Authorization header
- **Full CRUD operations** - requires valid Firebase session

**Data Access Patterns:**
- Direct Firestore access for simple operations
- API routes for complex operations or shared queries

**Security:** Protected by Firebase Auth tokens. Without a valid token:
- Client SDK operations fail
- API routes return 401 Unauthorized

#### 2.2.3 Cookie-Gated Pages (Cosmetic Protection)

**Purpose:** Hide certain pages from anonymous users for UX purposes.

**Characteristics:**
- Session cookie indicates logged-in state
- Used to cosmetically hide pages (e.g., profile settings, dashboards)
- **NOT a security control** - purely UX

**Security Reality:**
- If accidentally exposed, these pages are **impotent**
- Without a CSR Firebase session, users cannot perform write operations
- The cookie check is a courtesy, not a security gate

### 2.3 Where Security Is Actually Enforced

| Layer | Enforcement | Purpose |
|-------|-------------|---------|
| **Firebase Client SDK** | Auth token required for writes | Primary security for CSR writes |
| **API Routes** | Bearer token verification via `tokenToUid()` | Primary security for API writes |
| **Firestore Rules** | Server-side rule evaluation | Defense in depth |
| **Session Cookie** | Optional check in Astro pages | UX only (cosmetic) |
| **Middleware** | N/A (currently disabled) | Was incorrectly blocking safe reads |

### 2.4 Anti-Patterns

1. **Middleware blocking SSR reads** - SSR pages are read-only; blocking them adds no security value and breaks functionality.

2. **Treating cookie gating as security** - Cookies hide pages cosmetically. Real security comes from Firebase tokens on write operations.

3. **Conflating "hidden" with "protected"** - A hidden page without write capability is not a security risk.

## 3. Rendering Strategy

### 3.1 When to Use SSR

- Public content that should be indexed by search engines
- Content that doesn't require user-specific data at render time
- Performance-critical pages (faster initial load)

### 3.2 When to Use CSR

- Interactive features (forms, editors, real-time updates)
- User-specific content after initial page load
- Operations that modify data

### 3.3 Hybrid Approach

Most pages use both:
1. SSR renders the page shell and public content
2. CSR (Svelte islands) hydrates interactive components
3. User-specific data loads client-side after authentication

## 4. Data Access Patterns

### 4.1 SSR Data Access

```typescript
// Direct Firestore (server-side) - for SSR-only data
import { serverDB } from '@firebase/server';
const doc = await serverDB.collection('threads').doc(id).get();

// Via API route - for shared data patterns
const response = await fetch('/api/threads/' + id);
```

### 4.2 CSR Data Access

```typescript
// Direct Firestore (client-side) - requires auth for writes
const { doc, getDoc, setDoc } = await import('firebase/firestore');
const { db } = await import('@firebase/client');

// Read (works for public data)
const snapshot = await getDoc(doc(db, 'threads', id));

// Write (requires authenticated user)
await setDoc(doc(db, 'threads', id), data); // Fails without auth

// Via API route - requires Bearer token for writes
const response = await authedFetch('/api/threads', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

## 5. Authentication Flow

See `plans/session-and-auth/spec.md` for detailed authentication specification.

**Summary:**
1. User signs in via Firebase Auth (client-side)
2. Client obtains ID token and exchanges it for session cookie via `/api/auth/session`
3. Session cookie enables cosmetic gating of pages
4. Write operations use Firebase ID token (client) or Bearer token (API)

## 6. Related Documentation

- **AGENTS.md** - Section 7: Security Architecture (SSR/CSR Model)
- **plans/session-and-auth/spec.md** - Detailed auth specification
- **docs/pbi/054-auth-middleware-gating.md** - Middleware (currently disabled)
