# PBI-050: Edit Discussion Reply

## Goal
Allow users to edit their own replies in a discussion thread.

## Background
Currently, users can add and delete replies, but they cannot edit them. This leads to users having to delete and re-post replies to fix typos or add information, which disrupts the conversation flow and timestamp ordering.

## Requirements

### UI Changes
1.  **Reply Menu**:
    - In `src/components/svelte/discussion/ReplyArticle.svelte`, add an "Edit" option to the menu.
    - This option should only be visible to the author of the reply (similar to the "Delete" option).
    - Icon: `edit` (or similar).
    - Label: `t('actions:edit')`.

2.  **Edit Dialog**:
    - Create a mechanism to edit the reply content.
    - This could be a new component `EditReplyDialog.svelte` or a refactored `ReplyDialog.svelte`.
    - The dialog should:
        - Be pre-filled with the current markdown content of the reply.
        - Allow modifying the text.
        - Allow adding/removing images (optional for MVP, but good to have).
        - Have "Cancel" and "Save" buttons.

### Client-side Logic
1.  **Update Function**:
    - Create `src/firebase/client/threads/updateReply.ts`.
    - This function should send the updated content to the server.

### Server-side API
1.  **API Endpoint**:
    - Create `src/pages/api/threads/update-reply.ts`.
    - Method: `POST` (or `PUT`).
    - Authentication: Verify the user is the author of the reply.
    - Validation: Ensure required fields are present.
    - Operation: Update the reply document in Firestore.
        - Update `markdownContent`.
        - Update `updatedAt` timestamp.
        - **IMPORTANT**: Do NOT update `flowTime`. Replies are ordered by `flowTime`, and editing should not change the order.
        - Handle image uploads if supported.

## Acceptance Criteria
- [ ] A user can see an "Edit" button on their own replies.
- [ ] Clicking "Edit" opens a dialog with the current content.
- [ ] The user can modify the content and save.
- [ ] The reply is updated in the UI without a page refresh (or with a refresh if easier for MVP).
- [ ] The `updatedAt` timestamp is updated in the database.
- [ ] Users cannot edit other users' replies.

## Technical Notes
- Reuse existing translation keys where possible.
- Ensure the `ReplySchema` is respected.
- Consider how to handle the `htmlContent` if it's being stored (currently it seems `markdownContent` is the source of truth and rendered on the fly or on the server).
