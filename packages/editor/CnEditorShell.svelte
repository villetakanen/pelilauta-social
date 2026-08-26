<script lang="ts">
/**
 * The editor shell — the view a member edits one markdown document in.
 *
 * It holds two things the canvas cannot hold for itself: the geometry, so the
 * writing column stands where the published page's text stands, and the dirty
 * state, so leaving with unsaved work asks first.
 *
 * The split with the consumer is the whole design, and it never saves.
 * `specs/editor/shell/spec.md` governs it.
 */
import { onDestroy, onMount, type Snippet } from 'svelte';
import CnEditor from './CnEditor.svelte';

interface Props {
  /** The body markdown. Bindable, as the canvas's value is. */
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Line numbers. The shell reserves their width outside the measure. */
  gutter?: boolean;
  dark?: boolean;
  name?: string;
  /**
   * The frontmatter region's fields. A consumer that slots none gets no
   * region, and the canvas keeps its column.
   */
  frontmatter?: Snippet;
  /** What the shell asks before leaving a dirty document. */
  confirmTitle?: string;
  confirmBody?: string;
  confirmLeave?: string;
  confirmStay?: string;
  onChange?: (value: string) => void;
  onBlur?: (value: string) => void;
  /** Reports the dirty state. The consumer reads it; it cannot set it. */
  onDirtyChange?: (dirty: boolean) => void;
}

let {
  value = $bindable(''),
  placeholder = '',
  disabled = false,
  gutter = false,
  dark,
  name,
  frontmatter,
  confirmTitle = 'Unsaved changes',
  confirmBody = 'Leaving now discards what you have written.',
  confirmLeave = 'Leave',
  confirmStay = 'Keep editing',
  onChange,
  onBlur,
  onDirtyChange,
}: Props = $props();

let root: HTMLDivElement;
let region: HTMLDivElement | undefined = $state();
let confirmDialog: HTMLDialogElement | undefined = $state();

/*
 * The last clean point: the body as it read, and the frontmatter's fields as
 * they read. Dirty is the difference between the document now and this, which
 * is why editing a field back to what it was makes the document clean again —
 * a flag set on the first keystroke could never do that.
 */
let cleanBody = $state(value);
let cleanFields = $state('');
/*
 * The frontmatter's current reading. Slotted fields are the consumer's
 * elements, so the shell reads them from the DOM rather than being told: an
 * `input` anywhere in the region re-reads them, and nothing about the
 * consumer's state shape has to cross the boundary.
 */
let fields = $state('');

const dirty = $derived(value !== cleanBody || fields !== cleanFields);

/**
 * The frontmatter's fields as one string. Native controls only — a consumer
 * whose field is a component with state of its own reports through its own
 * hidden input, which is what a form reads it from anyway.
 */
function readFields(): string {
  if (!region) return '';
  const controls = region.querySelectorAll<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >('input, textarea, select');
  return Array.from(controls)
    .map((control) => {
      if (control instanceof HTMLInputElement && control.type === 'checkbox')
        return `${control.name}=${control.checked}`;
      if (control instanceof HTMLInputElement && control.type === 'radio')
        return `${control.name}:${control.value}=${control.checked}`;
      return `${control.name}=${control.value}`;
    })
    .join('\u0000');
}

/**
 * The consumer's one lever. A save has landed, so the document as it reads now
 * is the clean point. Editing after this makes it dirty again.
 */
export function markClean(): void {
  cleanBody = value;
  fields = readFields();
  cleanFields = fields;
}

/** The dirty state, for a consumer holding a reference rather than a callback. */
export function isDirty(): boolean {
  return dirty;
}

/**
 * A consumer control that means departure — a cancel — reports here. It cannot
 * dispatch the bar's event instead: a `cn-back` born inside the shell is a
 * control's dismissal and passes untouched, so from in here only this call
 * gets the ask. Confirmed or clean, the departure leaves as one `cn-back`
 * carrying `confirmed`, the same shape the bar's confirmed departure takes.
 */
export function requestBack(): void {
  if (dirty) {
    confirmDialog?.showModal();
    return;
  }
  root.dispatchEvent(
    new CustomEvent('cn-back', { bubbles: true, detail: { confirmed: true } }),
  );
}

function onRegionInput(): void {
  fields = readFields();
}

/*
 * A departure through the bar's back action. The bar is chrome, outside this
 * component, and its action reports intent by a bubbling `cn-back` — so the
 * shell listens where that event passes on its way to the consumer's handler,
 * and while the document is dirty it stops there.
 *
 * Confirming re-dispatches the same event carrying `confirmed`, rather than
 * navigating: where leaving lands is the consumer's, and this way it stays one
 * handler in the consumer whether the shell asked or not.
 */
function onBack(event: Event): void {
  /*
   * Only the bar's action is a departure. The bar is chrome outside this
   * component; a `cn-back` born inside the shell's subtree — a lightbox in
   * the frontmatter region closing itself — is a control's dismissal, not
   * the writer leaving, and passes untouched. The shell's confirmed
   * re-dispatch leaves from the root, so it exempts itself by the same test.
   */
  if (event.target instanceof Node && root?.contains(event.target)) return;
  const detail = (event as CustomEvent<{ confirmed?: boolean }>).detail;
  if (detail?.confirmed) return;
  if (!dirty) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  confirmDialog?.showModal();
}

function leave(): void {
  confirmDialog?.close();
  root.dispatchEvent(
    new CustomEvent('cn-back', { bubbles: true, detail: { confirmed: true } }),
  );
}

function stay(): void {
  confirmDialog?.close();
}

/*
 * Departure by the browser's means — closing, reloading, a link out — gets
 * the browser's native guard, whose wording and shape the shell cannot reach.
 */
function onBeforeUnload(event: BeforeUnloadEvent): void {
  if (!dirty) return;
  event.preventDefault();
}

onMount(() => {
  fields = readFields();
  cleanFields = fields;
  /*
   * The view locks to the viewport and the page never scrolls: the canvas
   * scrolls its document instead. The shell decides that, because it is the
   * surface that decides the fixed bar's clearance.
   */
  document.documentElement.classList.add('cn-editor-shell-host');
  document.addEventListener('cn-back', onBack, true);
  window.addEventListener('beforeunload', onBeforeUnload);
});

onDestroy(() => {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove('cn-editor-shell-host');
  document.removeEventListener('cn-back', onBack, true);
  window.removeEventListener('beforeunload', onBeforeUnload);
});

$effect(() => {
  onDirtyChange?.(dirty);
});
</script>

<div class="cn-editor-shell" bind:this={root} data-dirty={dirty}>
  <!--
    The inline geometry is a content container's, composed rather than restated.
    With fields slotted it is golden: the canvas is its primary at the measure,
    the frontmatter region its small secondary, and the stacking condition is
    golden's. Source order is the wide track order; `order` is what puts the
    frontmatter first once the regions stack.

    With no fields it is prose. A golden container has exactly two regions, so
    one region in golden is not golden — it would leave the canvas standing
    beside the space a secondary would have taken. Prose is the mode that
    centres one column at the measure, which is the column the canvas keeps.
  -->
  <div
    class="cn-editor-shell__layout"
    class:content-golden={!!frontmatter}
    class:content-prose={!frontmatter}
  >
    <div class="cn-editor-shell__canvas" data-gutter={gutter}>
      <CnEditor
        bind:value
        {placeholder}
        {disabled}
        {gutter}
        {dark}
        {name}
        {onChange}
        {onBlur}
      />
    </div>
    {#if frontmatter}
      <div
        class="cn-editor-shell__frontmatter"
        bind:this={region}
        oninput={onRegionInput}
        onchange={onRegionInput}
      >
        {@render frontmatter()}
      </div>
    {/if}
  </div>

  <!--
    `elevation-4` rather than `surface`: a surface is an inline-size container,
    and a container is sized independently of what it holds, so a dialog asking
    to fit its content would measure nothing. The inset is stated here instead.
  -->
  <dialog class="cn-editor-shell__confirm elevation-4" bind:this={confirmDialog}>
    <h2 class="text-h4">{confirmTitle}</h2>
    <p>{confirmBody}</p>
    <div class="cn-editor-shell__confirm-actions">
      <button type="button" class="text" onclick={stay}>{confirmStay}</button>
      <button type="button" class="cta" onclick={leave}>{confirmLeave}</button>
    </div>
  </dialog>
</div>

<style>
  /*
   * The shell locks to the viewport rather than growing with its content, which
   * is the opposite of what a content container's host does — so it is its own
   * host rather than `.app-main`.
   *
   * `box-sizing: border-box` with `padding-block-start` reserves the fixed
   * bar's depth inside a box already capped to the viewport, so what is left is
   * exactly the space below the bar and no second subtraction has to stay in
   * sync with it. `--cn-keyboard-inset` shortens the same box the way
   * `CnAppChrome` shortens itself, so a keyboard covers no more of the canvas
   * than it already covers of the bar.
   *
   * `padding-inline` and `container-type` are `.app-main`'s, on one element as
   * they are there: the container then reports the same width the published
   * page's host reports, which is what makes the editor stack exactly where the
   * page would.
   *
   * The page's edge inset stands on all four sides, the bar's depth on top of
   * it at the block start. A canvas is a filled field, and a fill running into
   * the bar and off the block end reads as a surface that was cut rather than
   * one that was placed.
   */
  .cn-editor-shell {
    box-sizing: border-box;
    block-size: calc(100dvh - var(--cn-keyboard-inset));
    padding-block-start: calc(var(--cn-app-bar-height) + var(--cn-gap));
    padding-block-end: var(--cn-gap);
    padding-inline: var(--cn-gap);
    overflow: hidden;
    container-type: inline-size;
  }

  :global(html.cn-editor-shell-host),
  :global(html.cn-editor-shell-host body) {
    block-size: 100%;
    overflow: hidden;
  }

  /*
   * The block axis is the shell's. A content container sizes a region to its
   * content; this view does the opposite, so the layout fills the space below
   * the bar and the canvas takes what the frontmatter does not.
   */
  .cn-editor-shell__layout {
    block-size: 100%;
    align-items: stretch;
    grid-template-rows: minmax(0, 1fr);
  }

  /*
   * How much room stands outside the composition, on the side the gutter has to
   * bleed into. Both are the mode's tracks summed from the spatial tokens,
   * not a second statement of the width: golden's 32 grid units are its small
   * secondary, and prose's cap is the measure itself.
   */
  .cn-editor-shell__layout.content-golden {
    --_shell-surplus: calc(
      (100cqw - (var(--cn-measure) + var(--cn-gap) + var(--cn-grid) * 32)) / 2
    );

    /*
     * Stacked, the frontmatter is as tall as its fields and the canvas takes
     * the rest — which is the block axis the shell decides, rather than two
     * regions each as tall as its content with the page scrolling past them.
     */
    grid-template-rows: auto minmax(0, 1fr);
  }

  .cn-editor-shell__layout.content-prose {
    --_shell-surplus: calc((100cqw - var(--cn-measure)) / 2);
  }

  .cn-editor-shell__canvas {
    display: flex;
    min-block-size: 0;
  }

  /*
   * The container places this region and reaches no deeper, so the interval between
   * the fields the caller slots in is stated here. `align-content: start` keeps them
   * at the block start of a region as tall as the canvas beside it.
   */
  .cn-editor-shell__frontmatter {
    min-block-size: 0;
    overflow-y: auto;
    display: grid;
    align-content: start;
    row-gap: var(--cn-line);
  }

  /*
   * The frontmatter reads first while the regions stack: a writer scrolling a
   * canvas would otherwise have to scroll past the document to reach the
   * fields. Beside the canvas there is no order to choose.
   */
  .cn-editor-shell__frontmatter {
    order: -1;
  }

  /*
   * Golden's condition, and the only literal here. `58.5rem` is 117 grid
   * units — the measure, a gap and a small secondary — and it is written in
   * `packages/design-system/styles/content-containers.css`;
   * `test/shellGeometry.test.ts` fails when the two disagree.
   */
  @container (min-width: 58.5rem) {
    /*
     * Beside each other there is one row, and both regions fill it. The
     * selector carries `.content-golden` so it outweighs the stacked rule
     * above, which is the only rule it has to beat.
     */
    .cn-editor-shell__layout.content-golden {
      grid-template-rows: minmax(0, 1fr);
    }

    .cn-editor-shell__frontmatter {
      order: 0;
    }
  }

  /*
   * The one addition to the container's geometry: the gutter stands at the text
   * column's inline start, outside the measure. The canvas box reaches that far
   * back, so its text lands on the measure exactly where the published page's
   * text lands, and the canvas track is the measure plus the gutter.
   *
   * It reaches back as far as there is room outside the composition, and no
   * further — a gutter bleeding past the surplus would leave the page's edge
   * inset to be clipped, and clipped line numbers are worse than line numbers
   * inside the measure. The clamp is also what stacks it: below the wide
   * condition there is no surplus, so the canvas takes the full inline size and
   * the gutter stands inside it, where there is no published column to align
   * to.
   */
  .cn-editor-shell__canvas[data-gutter="true"] {
    margin-inline-start: calc(
      -1 * clamp(0px, var(--_shell-surplus), var(--_shell-gutter-width))
    );
  }

  /*
   * CodeMirror sizes its gutter to the widest line number it has rendered, and
   * the bleed above has to be a length. So the gutter is pinned instead: five
   * grid units holds four digits at the field's size, which is longer than any
   * document this editor is for.
   */
  .cn-editor-shell__canvas {
    --_shell-gutter-width: calc(var(--cn-grid) * 5);
  }

  .cn-editor-shell__canvas :global(.cm-gutters) {
    min-inline-size: var(--_shell-gutter-width);
  }

  /*
   * A modal dialog stands in the top layer, and the browser centres it there
   * with `margin: auto` against `inset: 0`. The preflight zeroes margin on
   * every element, so the centring has to be restated — without it the box
   * collapses into the viewport's inline start.
   */
  .cn-editor-shell__confirm {
    margin: auto;
    /* Medium, from the spatial family, less the page's edge inset on a phone. */
    inline-size: min(
      calc(var(--cn-grid) * 51),
      calc(100dvw - var(--cn-gap) * 2)
    );
    padding: var(--cn-gap);
    border: none;
    border-radius: var(--cn-grid);
  }

  .cn-editor-shell__confirm::backdrop {
    background-color: var(--cn-color-scrim);
  }

  .cn-editor-shell__confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--cn-gap);
    margin-block-start: var(--cn-line);
  }
</style>
