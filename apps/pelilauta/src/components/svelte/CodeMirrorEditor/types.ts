export interface CodeMirrorEditorProps {
  value: string; // Editor content (bindable)
  placeholder?: string; // Placeholder text
  disabled?: boolean; // Read-only mode
  required?: boolean; // Form validation
  gutter?: boolean; // Show line numbers
  autofocus?: boolean; // Auto-focus on mount
  name?: string; // Form field name

  // Event callbacks (Svelte style)
  oninput?: (event: CustomEvent<string>) => void;
  onchange?: (event: CustomEvent<string>) => void;
  onblur?: (event: FocusEvent) => void;
  onfocus?: (event: FocusEvent) => void;
}

// Public methods exposed via bind:this
export interface CodeMirrorEditorInstance {
  focus(): void;
  select(): void;
  copy(): void;
  insertText(text: string): void;
  getValue(): string;
  setValue(value: string): void;
}
