# Reply Bubbles Specification

## 1. Overview
The **Reply Bubble** is the primary UI component for individual messages within a Discussion thread. It encapsulates the user's content, identity, and available actions in a distinct "speech bubble" visual metaphor.

## 2. Component Architecture
- **File**: `src/components/svelte/discussion/ReplyArticle.svelte`
- **Wrapper**: `<article>` element.
  > **Note**: Semantically correct as per HTML5 standards for "user-submitted comments", representing self-contained, distributable content.
- **Core Component**: `<cn-bubble>` (Web Component from `@11thdeg/cyan-lit`).

## 3. Visual Anatomy

### 3.1. Layout
- **Container**: Flexbox layout.
  > **Note**: Flexbox is ideal here. It natively supports the required direction swapping (`row` vs `row-reverse`) to handle the "avatar on left" vs "avatar on right" pattern without DOM reordering, and handles component flexibility (fixed avatar, growing bubble) robustly.
- **Alignment**:
    - **Others' Replies**: Left-aligned (`flex-row`).
    - **Own Replies**: Right-aligned (`flex-row-reverse`).
- **Avatar**:
    - displayed outside the bubble on larger screens (`sm-hidden`).
    - Linked to the user's profile.

### 3.2. The Bubble (`<cn-bubble>`)
- **Visuals**:
    - Uses the `cyan-lit` design system bubble style.
    - **Own Replies**: Differentiated visual treatment (likely differing background color or tail direction) triggered by the `reply` attribute.
    - **Class**: `grow` to take available width within limits.

### 3.3. Toolbar
Located at the top of the bubble content.
- **Profile Link**: Name/link to the author.
  > **Future Improvement**: Replaced by `<cn-nick>` (see `docs/outgoing/cn-nick-feature-request.md`) to resolve visual consistency issues.
- **Reaction Button**: Allows users to react to the specific reply.
- **Menu**:
    - **Fork**: Create a new thread branching from this reply.
    - **Edit**: (Owner only) Modify reply content.
    - **Delete**: (Owner only) Remove the reply.
    - **Visibility**: Uses `<cn-menu>` for a dropdown/inline experience.

### 3.4. Content Area
- **Images**: Rendered via `<cn-lightbox>` if any images are attached.
- **Text**: Markdown content rendered to HTML.

## 4. Behavior & Interaction

### 4.1. Responsiveness
- **Desktop**: Avatar displayed next to the bubble.
- **Mobile**: Avatar next to bubble is hidden (`sm-hidden`). Identity likely relies on the toolbar profile link.

### 4.2. Ownership Logic
- **Determination**: Checks if the current authenticated user (`$uid`) is in the `reply.owners` array.
- **Effects**:
    - Reverses layout direction.
    - Enables "Edit" and "Delete" actions.
    - Applies `reply` attribute to `<cn-bubble>` for visual distinction.

### 4.3. Data Model
Based on `ReplySchema` (`src/schemas/ReplySchema.ts`):
- `key`: Unique identifier.
- `owners`: Array of user IDs (authors).
- `markdownContent`: The text content.
- `images`: Optional array of attached images.
- `threadKey`: Reference to the parent thread.
- `quoteref`: (Optional) Reference to a quoted reply.
### 4.4. Timestamp Display (Proposed)
To communicate when a reply was last updated without cluttering the UI:
- **Location**: Bottom-right corner of the bubble, inside the content area.
  > **Note (SSR/CSR)**: Since relative time ("5m ago") requires client-side calculation to avoid stale SSR content, the timestamp component should either hydrate on the client or fall back to an absolute date in static SSR contexts (like `QuoteBubble.astro`).
- **Trigger**: Only display if `updatedAt` is significantly different from `createdAt` (or simply if `updatedAt` exists).

- **Trigger**: Only display if `updatedAt` is significantly different from `createdAt` (or simply if `updatedAt` exists).
- **Style**: Small, muted text (classes: `text-small`, `text-low`).
- **Format**: Relative time (e.g., "5m ago") or a short date/time string.
- **Implementation**: Could use a `<p class="caption text-right">` or a dedicated `<cn-timestamp>` component if available.

## 5. Integration
- **Server-Side**: Can be rendered via `QuoteBubble.astro` for static views or quotes.
- **Client-Side**: Managed by `DiscussionSection.svelte` which handles real-time Firestore updates and rendering the list of `ReplyArticle` components.

## 6. behaviors & Edge Cases (Critical Review)
- **Deep Linking**: The `<article>` element MUST have an `id` attribute corresponding to the `reply.key` to allow direct anchor links (e.g., `#reply-123`).
- **Deleted Replies**: Currently, deleted replies are **removed** from the data stream and DOM entirely. There is no visual "tombstone" state.
- **Accessibility**:
    - The `<article>` should potentially use `aria-labelledby` pointing to the author's name to give context to screen readers.
    - Interactive elements (Menu, Reaction) must remain keyboard accessible.
- **Content Overflow**: The bubble expands vertically to fit content. There is no line-clamp or "Read more" truncation currently specified.

## 7. Navigation Requirements
To support thread traversal and unread tracking:
- **Deep Linking Target**:
    - The `<article>` MUST have an `id` attribute set to `reply.key` (or a consistent derived ID like `reply-{key}`).
    - **Purpose**: Enables external links (e.g., from the Forum index) to jump directly to the **latest unread reply**.
- **Floating Action Button (FAB)**:
    - **Context**: The parent container (`DiscussionSection`) should implement a FAB for quick navigation.
    - **Logic**:
        1.  **Primary**: Scroll to the **first unread reply** if one exists and is not currently visible.
        2.  **Fallback**: If no unread replies (or all viewed), scroll to the **bottom/latest reply**.


