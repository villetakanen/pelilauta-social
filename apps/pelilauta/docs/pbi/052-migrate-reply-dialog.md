# PBI-052: Migrate Reply Dialogs to cn-reply-dialog

## Goal
Update the discussion reply user experience by adopting the new `cn-reply-dialog` web component from the Cyan Design System. This unifies the UX across the application and leverages the design system's built-in responsive behaviors (docked on desktop, fullscreen on mobile).

## Context
The current implementation of reply dialogs (`ReplyDialog.svelte` and `EditReplyDialog.svelte`) relies on native `<dialog>` elements with custom styling and manual DOM manipulation. The [new `cn-reply-dialog` component](https://github.com/villetakanen/cyan-design-system-4/tree/main/packages/cyan-lit/src/cn-reply-dialog) provides a standardized, responsive container that handles layout, animations, and accessibility out of the box.

## Requirements

### Component Integration
1.  **Verify Usage**: Ensure `@11thdeg/cyan-lit` is imported in a way that registers `<cn-reply-dialog>`.
    *   Currently, `src/components/server/BaseHead/BaseHead.astro` imports the entire library.
    *   Verify if `cn-reply-dialog` is included in the installed version (`4.0.0-beta.27`). If not, update the package or add a specific import if available in the distribution.

### Refactoring `ReplyDialog.svelte`
1.  **Replace Container**:
    *   Replace the native `<dialog>` element with `<cn-reply-dialog>`.
    *   Bind the `open` property to the local state (e.g., `bind:open={isOpen}`).
    *   Remove manual `showModal()` and `close()` calls on the DOM element; rely on state changes.
2.  **Integrate Slots**:
    *   **Header**: Move the title/close button logic to the `header` slot (or let the component handle the close button if it has a built-in one for mobile - source shows it does for mobile).
        *   *Note*: `cn-reply-dialog` has a built-in close button on **mobile**. For desktop, or if custom actions are needed, use the `header` slot, but avoid duplicating the close action if the component provides it.
        *   Source check: `cn-reply-dialog` renders a generic header slot. On mobile, it appends a close icon.
    *   **Content**: Move the `textarea` and image previews to the default slot.
    *   **Actions**: Move the "Add Files", "Cancel", and "Send" buttons to the `actions` slot.
3.  **Refine Styling**:
    *   Remove custom CSS that manages the dialog's position and dimensions (handled by the component).
    *   Keep CSS relevant to the *internal* layout of the form (e.g., textarea sizing).

### Refactoring `EditReplyDialog.svelte`
1.  **Apply Consistent Pattern**:
    *   Refactor `EditReplyDialog.svelte` similarly to `ReplyDialog.svelte` to use `<cn-reply-dialog>`.
    *   Ensure the "Edit" context is clear (Change title in header).

### Design & UX Requirements (from @Designer)
1.  **Visual Consistency**:
    *   Use **Cyan Design System** tokens for all internal spacing (e.g., `var(--cn-gap)`).
    *   *Note*: The component handles the backdrop (`--background-dialog-backdrop`) and z-index (`--cn-reply-dialog-z-index`) automatically. No manual CSS needed for these unless overriding.
2.  **Typography**:
    *   Header title should use standard heading classes (e.g., `text-high`) to match the system.
3.  **Interactions**:
    *   **Focus State**: The text area should auto-focus when the dialog opens (desktop) to allow immediate typing.
    *   *Note*: The component automatically handles the mobile/desktop switch via a ResizeObserver and provides the standard entrance animations.
4.  **Premium Feel**:
    *   Ensure the "Send" button uses the `call-to-action` class.
    *   The "Cancel" button should be subtle.

## Acceptance Criteria
- [ ] `ReplyDialog` and `EditReplyDialog` use `<cn-reply-dialog>` instead of native `<dialog>`.
- [ ] Dialog state is controlled via the `open` property.
- [ ] **Mobile Experience**: Automatically handled by the component (fullscreen, focus trap).
- [ ] **Desktop Experience**: Automatically handled by the component (docked at bottom).
- [ ] **Functionality**:
    - [ ] Writing, file attachment, and submission work as before.
    - [ ] Closing via "Cancel" or backdrop/escape works.
- [ ] **Accessibility**: Focus trapping is handled by the component.

## Technical Implementation Notes
- **State**: Bind `open` to local state.
- **Customization**: Use `--cn-reply-dialog-height` or `--cn-reply-dialog-width` only if the default content area is too small/large for the specific form content.
- **Slots**: Place title in `slot="header"`, form in default slot, and buttons in `slot="actions"`.
