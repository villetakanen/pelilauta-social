---
name: 'Solution Architecture'
noun: 'veil-advance'
---

**(in english only)**

The Pelilauta is a progressive web application built on top of the excellent Astro.build SSR generator.

The application consists of 2 bespoke apps: the discussions or "threads" app and the Game-wiki app. The threads app is a forum-like application that allows users to create threads and post messages. The Game-wiki app is a wiki-like application that allows users to create and edit game related wiki-sites.

## Principles

### Locally cached multi-page app

The Pelilauta is a multi page app that is designed to be fast and responsive. The application is designed to be used on a mobile device and on a desktop computer. To enable this, we use svelte to progressively enhance the user experience by adding interactivity to the server-rendered pages. By default, the SSR pages are fully functional for reading content, and svelte is used to enhance the experience for logged-in users and for actions that require interactivity, such as posting reacting to a post, creating a new thread or editing a wiki page.

Both apps have their own local storage and cache the data that is needed to render the UI. The data is fetched from the server when the app is loaded and when the user navigates to a new page. The data is then stored in the local storage and used to render the UI.

This approach allows the app to be fast and responsive, even on a slow network connection. The app should also work (at least somehow) offline, as the data is stored in the local storage.

**Do note: we are not doing full local-firs, so there is no merge-conflict resolution or anything like that.**

...

### Project Structure

The project structure is organized as follows:

- **Root Directory**:
  - `astro.config.mjs`: Configuration for the Astro site generator.
  - `biome.json`: Configuration for Biome, used for linting and formatting.
  - `netlify.toml`: Configuration for deploying the application to Netlify.
  - `package.json`: Contains project dependencies and scripts.
  - `tsconfig.json`: TypeScript configuration file.
  - `vitest.config.js`: Configuration for Vitest, the testing framework.

- **Directories**:
  - `docs/`: Project documentation files, including integration guides and performance optimization plans.
  - `e2e/`: End-to-end test specifications.
  - `public/`: Static assets like icons, manifest files, and service workers.
  - `src/`: Main source code directory, containing components, layouts, pages, schemas, stores, and utilities.
  - `test/`: Unit and integration tests for APIs, libraries, and schemas.
  - `tooling/`: Utility scripts for tasks like cache warming and data conversion.

- **Special Directories**:
  - `playwright/`: Playwright-specific configurations and reports.
  - `playwright-report/`: Contains Playwright test reports.

This structure ensures a clear separation of concerns, making the project easy to navigate and maintain.

#### Code Organization

The `src/` directory is structured as follows:

- **`components/`**: Reusable UI components, further divided into:
  - **`server/`**: Astro components for server-side rendering.
    - **`[app-name]/`**: Components specific to each microfrontend or application (e.g., `threads`, `sites`).
  - **`shared/`**: Components shared between server and client.
    - **`[app-name]/`**: Shared components specific to each microfrontend or application, named accordingly (e.g., `threads`, `sites`).
  - **`client/`**: Svelte components for client-side interactivity.
    - **`[app-name]/`**: Components specific to each microfrontend or application (e.g., `threads`, `sites`).

- **`docs/`**: Documentation-specific components and utilities.
- **`firebase/`**: Firebase utilities, organized into:
  - **`server/`**: Server-side Firebase utilities for authentication and Firestore operations.
  - **`client/`**: Client-side Firebase utilities for interacting with Firebase services from the browser.

- **`layouts/`**: Page layout components, including headers, footers, and navigation.
- **`lib/`**: Shared libraries and helper functions.
- **`locales/`**: Localization files for supporting multiple languages.
- **`pages/`**: Astro and Svelte pages, organized by route.
- **`schemas/`**: Zod schemas for data validation and Firestore collections.
- **`stores/`**: Nanostores for state management.
- **`utils/`**: General utility functions and helpers.

This organization ensures modularity and reusability, making it easier to maintain and scale the application.

> N.B. The `[app-name]` folders are named according to the specific microfrontend or application they belong to, such as `threads` for the discussions app and `sites` for the Game-wiki app. The naming happens
> at this level so we can easily identify SSR and CSR code from the typescript alias (e.g., `@server/[component-name]` and `@svelte/[component-name]`).

## Authentication and Session Management

We employ a multi-layered approach to authentication to cater to different rendering and data access scenarios, from client-side UI checks to server-side rendering and API protection.

### Client-Side Authentication (UI)

For client-side components (Svelte), we rely on a nanostore to manage the user's authentication state.

- **Mechanism**: A simple check is performed against the `uid` store imported from `@stores/session`.
- **Usage**: This is primarily for controlling UI elements, like showing or hiding buttons or links. It provides a fast and reactive way to update the view based on whether a user is logged in.
- **Example**:
  ```svelte
  <script lang="ts">
    import { uid } from '@stores/session';
  </script>

  {#if $uid}
    <a href="/profile">Your Profile</a>
  {:else}
    <a href="/login">Log In</a>
  {/if}
  ```

### Server-Side Authentication (Astro Pages)

For server-rendered Astro pages that require user authentication, we use a cookie-based session verification.

- **Mechanism**: The `verifySession` utility from `@utils/server/auth/verifySession` is called in the page's frontmatter. It inspects the session cookie sent with the request.
- **Usage**: This is used to protect entire pages and redirect unauthenticated users. It ensures that sensitive content is not rendered or sent to unauthorized clients.
- **Example**:
  ```astro
  ---
  import { verifySession } from '@utils/server/auth/verifySession';

  const session = await verifySession(Astro);
  if (!session?.uid) {
    return Astro.redirect('/login');
  }
  ---
  <!-- Page content for authenticated users -->
  ```

### Server-Side Authentication (API Routes)

For our API endpoints, we use a token-based approach to secure them.

- **Mechanism**: API routes are protected using the `tokenToUid` utility from `@utils/server/auth/tokenToUid`. This function validates a Bearer token from the `Authorization` header.
- **Usage**: This is crucial for securing data operations (CRUD) initiated from the client. The client must attach a valid Firebase Auth ID token to its requests.
- **Example**:
  ```typescript
  // src/pages/api/some-data.ts
  import { tokenToUid } from '@utils/server/auth/tokenToUid';

  export async function POST(request: Request) {
    const uid = await tokenToUid(request);
    if (!uid) {
      return new Response('Unauthorized', { status: 401 });
    }
    // Proceed with data operation for the authenticated user
  }
  ```

### Code Patterns

The following code patterns are used throughout the project:

- **Svelte Components**: Runes mode is used for client-side interactivity.
- **Firebase Integration**: Dynamic imports for client-side utilities and static imports for server-side utilities.
- **Schema Validation**: Zod schemas ensure data consistency.

For examples, refer to the [README](../../README.md).