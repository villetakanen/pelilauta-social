# Feature Request: `cn-nick` Component

## Problem
The current implementation of author links (e.g., in reply bubbles) relies on standard anchor tags (`<a>`) or `ProfileLink.svelte`. Visually, this renders as a generic link, which can be jarring and lacks the "premium" feel of a dedicated identity component, especially within styled containers like reply bubbles.

## Proposal A: `cn-nick` Web Component
Create a new Web Component `cn-nick` in the `@11thdeg/cyan-lit` library (or local equivalent) to handle user identity toggles.

### API
- **`label`** (string, required): The displayed name of the user.
- **`href`** (string, optional): The profile URL. If provided, the component wraps the label in a link or handles navigation. If omitted, it renders as a static label (useful for deleted users or non-linkable contexts).
- **`width`** (string, optional): Width of the element, defaults to auto.

### Usage Contexts
1.  **Inside Reply Bubbles**: Should integrate seamlessly with the bubble header, potentially with specific styling adjustments (opacity, font-weight).
2.  **Standalone**: Should work in other contexts (e.g., lists, headers) as a consistent representation of a user's nickname.

## Proposal B: CSS Class Utility
Alternatively, provide a utility CSS class (e.g., `.cn-link-nick` or `.link-subtle`) that can be applied to standard anchor tags to achieve the same visual result without the overhead of a web component.

### Implementation
- **Class**: `.cn-link-nick`
- **Styles**:
    - Remove text-decoration (underline).
    - Font-weight: Bold or Semibold (consistent with headers).
    - Color: Inherit or specific semantic color (e.g., `var(--color-text-heading)`).
    - Hover: Subtle background change or color shift, no underline.

## Expected Behavior
- **Default**: Renders `label` with a specific font weight/style.
- **With `href`**: Renders interactively, with hover states consistent with the design system but distinct from generic body text links.
- **Styling**: Should remove default link underlines in favor of more subtle interactive cues (color shift, slight background hover, etc.).
