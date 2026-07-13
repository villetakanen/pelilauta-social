# PBI: Implement CDN-Friendly User Registration & EULA Flow (Astro-Centric)

**User Story:** As a developer, I want to implement a secure, server-verified user onboarding flow (EULA acceptance & profile creation) that does not interfere with the CDN caching of static pages, using the Astro backend to manage all state initialization.

### **Description & Context**

This architecture prioritizes CDN performance by serving static HTML to all users first, then progressively enhancing the experience. The flow is orchestrated using **Firebase Custom Claims**, which are initialized and managed exclusively by our Astro API endpoints upon user form submission. **This approach does not require a Firebase Cloud Function.**

**The High-Level User Journey:**

1. A new user signs up via the client SDK. Their Firebase Auth account is created with **no initial custom claims**.
    
2. The user lands on a page. The static HTML is served instantly from the CDN.
    
3. A client-side `AuthManager.svelte` component runs. It checks the user's local auth state.
    
4. **Onboarding Path:** The user's token has no `eula_accepted` claim (`undefined`). The client treats this the same as `false`. It makes a secure `GET` request to `/api/auth/status` to confirm the user's state and then redirects them to the EULA page.
    
5. The user submits the EULA form. The Astro backend API (`/api/onboarding/complete-eula`) creates their `account` document in Firestore and, crucially, **sets their initial custom claims for the first time**: `{ eula_accepted: true, account_created: false }`.
    
6. The user is redirected to the profile creation page (driven by the new claims). They submit the profile form. A separate Astro API (`/api/onboarding/complete-profile`) updates their `profile` document and **updates their claims**: `{ eula_accepted: true, account_created: true }`.
    
7. **Happy Path:** A fully onboarded user visits the site. The client sees `eula_accepted: true` and `account_created: true` in the local token claims and **makes no API call.**
    

### **Acceptance Criteria**

**1. Server API: Auth Status Endpoint**

- [ ] Create a server-side API endpoint in Astro at `src/pages/api/auth/status.ts`.
    
- [ ] It must handle `GET` requests and use server-side Firebase helpers (`@firebase/server`).
    
- [x] It must verify the `session` cookie and return a JSON response with the user's status derived from their custom claims (which may be `undefined` for new users). A missing `eula_accepted` claim should be returned as `false` in the JSON payload for client convenience.
    
    ```
    // Example for a new user with no claims set yet
    { "loggedIn": true, ..., "eula_accepted": false, "account_created": false }
    ```