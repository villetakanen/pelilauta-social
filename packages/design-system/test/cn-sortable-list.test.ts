// @vitest-environment jsdom
/**
 * Tests verify drag, single-pointer activation, keyboard reordering, markup,
 * and status announcements for `CnSortableList` against
 * `specs/design-system/components/cn-sortable-list/spec.md`.
 *
 * Tests mount the component in jsdom and stub bounding client rectangles from
 * sibling indices because jsdom calculates no layout. These stubs provide the
 * geometry required to evaluate midpoint insertion rules. Because jsdom omits
 * drag event APIs, tests dispatch mouse events carrying stubbed `DataTransfer`
 * objects. Tests exclude stylesheet presentation rules, which visual specimen
 * books evaluate.
 */
import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import CnSortableList, {
  type CnListItem,
} from '../components/CnSortableList.svelte';

const ROW = 100;
const ROW_INLINE = 200;

let announced: string[];

function record(message: string) {
  announced.push(message);
  return message;
}

const announcements = {
  pickup: (title: string, position: number, length: number) =>
    record(`pickup ${title} ${position}/${length}`),
  position: (title: string, position: number, length: number) =>
    record(`position ${title} ${position}/${length}`),
  completion: (title: string, position: number, length: number) =>
    record(`completion ${title} ${position}/${length}`),
  cancellation: (title: string, position: number, length: number) =>
    record(`cancellation ${title} ${position}/${length}`),
};

let target: HTMLDivElement;
let instance: Record<string, never> | undefined;
let reported: CnListItem[][];

function abc(): CnListItem[] {
  return [
    { key: 'a', title: 'A' },
    { key: 'b', title: 'B' },
    { key: 'c', title: 'C' },
  ];
}

function open(items: readonly CnListItem[], label = 'Pages') {
  instance = mount(CnSortableList, {
    target,
    props: {
      items,
      label,
      announcements,
      onitemschange: (next: CnListItem[]) => {
        reported.push(next);
      },
    },
  });
  flushSync();
}

function list(): HTMLElement {
  const element = target.querySelector('ul');
  if (!element) throw new Error('the sortable list did not mount');
  return element;
}

function rows(): HTMLLIElement[] {
  return [...list().querySelectorAll('li')];
}

function order(): string[] {
  return rows().map((row) => row.querySelector('button')?.ariaLabel ?? '');
}

function row(title: string): HTMLLIElement {
  const found = rows().find(
    (candidate) =>
      candidate.querySelector('button')?.getAttribute('aria-label') === title,
  );
  if (!found) throw new Error(`no row named ${title}`);
  return found;
}

function handle(title: string): HTMLButtonElement {
  const button = row(title).querySelector('button');
  if (!button) throw new Error(`no handle named ${title}`);
  return button;
}

function status(): HTMLElement {
  const element = target.querySelector('[role="status"]');
  if (!(element instanceof HTMLElement)) throw new Error('no status region');
  return element;
}

function message(): string {
  return status().textContent ?? '';
}

function blockStart(index: number) {
  return { clientX: 10, clientY: index * ROW + ROW * 0.2 };
}
function blockEnd(index: number) {
  return { clientX: 10, clientY: index * ROW + ROW * 0.8 };
}
function centre(index: number) {
  return { clientX: 10, clientY: index * ROW + ROW * 0.5 };
}

function transfer() {
  const data = new Map<string, string>();
  return {
    effectAllowed: 'none',
    dropEffect: 'none',
    dragImage: undefined as
      | undefined
      | { element: Element; x: number; y: number },
    setData(format: string, value: string) {
      data.set(format, value);
    },
    getData(format: string) {
      return data.get(format) ?? '';
    },
    setDragImage(element: Element, x: number, y: number) {
      this.dragImage = { element, x, y };
    },
  };
}

type Transfer = ReturnType<typeof transfer>;

function drag(
  type: string,
  at: { clientX: number; clientY: number },
  dataTransfer: Transfer,
) {
  const event = new MouseEvent(type, {
    ...at,
    bubbles: true,
    cancelable: true,
  });
  Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });
  return event;
}

function click() {
  return new MouseEvent('click', { bubbles: true, cancelable: true });
}

function pointerdown() {
  return new MouseEvent('pointerdown', { bubbles: true, cancelable: true });
}

function keydown(key: string) {
  return new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
}

function activate(element: Element) {
  element.dispatchEvent(pointerdown());
  element.dispatchEvent(click());
  flushSync();
}

beforeEach(() => {
  target = document.createElement('div');
  document.body.appendChild(target);
  reported = [];
  announced = [];
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
    function rect(this: Element) {
      const parent = this.parentElement;
      if (this.tagName !== 'LI' || !parent) {
        return new DOMRect(0, 0, 0, 0);
      }
      const index = [...parent.children].indexOf(this);
      return new DOMRect(0, index * ROW, ROW_INLINE, ROW);
    },
  );
});

afterEach(() => {
  if (instance) unmount(instance);
  instance = undefined;
  target.remove();
  vi.restoreAllMocks();
});

describe('drag reordering', () => {
  test('a drop on a target block-start half inserts before it', () => {
    const items = abc();
    open(items);
    const data = transfer();
    handle('C').dispatchEvent(drag('dragstart', centre(2), data));
    flushSync();
    row('A').dispatchEvent(drag('dragover', blockStart(0), data));
    flushSync();
    row('A').dispatchEvent(drag('drop', blockStart(0), data));
    flushSync();
    expect(reported).toHaveLength(1);
    expect(reported[0].map((item) => item.key)).toEqual(['c', 'a', 'b']);
    expect(reported[0].map((item) => item.title)).toEqual(['C', 'A', 'B']);
    expect(items.map((item) => item.key)).toEqual(['a', 'b', 'c']);
    expect(reported[0]).not.toBe(items);
  });

  test('a drop on a target block-end half inserts after it', () => {
    open(abc());
    const data = transfer();
    handle('B').dispatchEvent(drag('dragstart', centre(1), data));
    flushSync();
    row('C').dispatchEvent(drag('dragover', blockEnd(2), data));
    flushSync();
    row('C').dispatchEvent(drag('drop', blockEnd(2), data));
    flushSync();
    expect(reported).toHaveLength(1);
    expect(reported[0].map((item) => item.key)).toEqual(['a', 'c', 'b']);
  });

  test('a drop on the dragged item reports nothing', () => {
    open(abc());
    const data = transfer();
    handle('B').dispatchEvent(drag('dragstart', centre(1), data));
    flushSync();
    row('B').dispatchEvent(drag('dragover', blockStart(1), data));
    flushSync();
    row('B').dispatchEvent(drag('drop', blockStart(1), data));
    handle('B').dispatchEvent(drag('dragend', centre(1), data));
    flushSync();
    expect(reported).toHaveLength(0);
    expect(order()).toEqual(['A', 'B', 'C']);
  });

  test('a drag ending outside an item reports nothing', () => {
    open(abc());
    const data = transfer();
    handle('C').dispatchEvent(drag('dragstart', centre(2), data));
    flushSync();
    row('A').dispatchEvent(drag('dragover', blockStart(0), data));
    flushSync();
    handle('C').dispatchEvent(
      drag('dragend', { clientX: 10, clientY: 900 }, data),
    );
    flushSync();
    expect(reported).toHaveLength(0);
    expect(order()).toEqual(['A', 'B', 'C']);
  });

  test('a line marks the insertion position and no row moves', () => {
    open(abc());
    const data = transfer();
    handle('C').dispatchEvent(drag('dragstart', centre(2), data));
    flushSync();
    row('A').dispatchEvent(drag('dragover', blockStart(0), data));
    flushSync();
    expect(row('A').getAttribute('data-insert')).toBe('before');
    expect(order()).toEqual(['A', 'B', 'C']);
    row('A').dispatchEvent(drag('dragover', blockEnd(0), data));
    flushSync();
    expect(row('A').getAttribute('data-insert')).toBe('after');
    row('A').dispatchEvent(drag('dragleave', blockEnd(0), data));
    flushSync();
    expect(row('A').getAttribute('data-insert')).toBeNull();
  });

  test('the drag paints the row and permits a move', () => {
    open(abc());
    const data = transfer();
    handle('C').dispatchEvent(drag('dragstart', centre(2), data));
    flushSync();
    expect(data.effectAllowed).toBe('move');
    expect(data.getData('text/plain')).toBe('c');
    expect(data.dragImage).toEqual({ element: row('C'), x: 10, y: 50 });
    row('A').dispatchEvent(drag('dragover', blockStart(0), data));
    flushSync();
    expect(data.dropEffect).toBe('move');
  });

  test('a click concluding a drag does not pick the item up', () => {
    open(abc());
    const data = transfer();
    handle('C').dispatchEvent(pointerdown());
    handle('C').dispatchEvent(drag('dragstart', centre(2), data));
    flushSync();
    row('A').dispatchEvent(drag('dragover', blockStart(0), data));
    row('A').dispatchEvent(drag('drop', blockStart(0), data));
    handle('C').dispatchEvent(drag('dragend', blockStart(0), data));
    handle('C').dispatchEvent(click());
    flushSync();
    expect(reported).toHaveLength(1);
    expect(announced.at(-1)).toBe('completion C 1/3');
  });
});

describe('activation reordering', () => {
  test('activating a handle and then a row moves the item', () => {
    open(abc());
    activate(handle('C'));
    expect(message()).toBe('pickup C 3/3');
    activate(row('A'));
    expect(reported).toHaveLength(1);
    expect(reported[0].map((item) => item.key)).toEqual(['c', 'a', 'b']);
    expect(announced).toEqual([
      'pickup C 3/3',
      'position C 1/3',
      'completion C 1/3',
    ]);
  });

  test('activating the picked-up handle again reports nothing', () => {
    open(abc());
    activate(handle('C'));
    activate(handle('C'));
    expect(reported).toHaveLength(0);
    expect(order()).toEqual(['A', 'B', 'C']);
  });
});

describe('keyboard reordering', () => {
  test('Space, ArrowUp and Space report the move and announce it throughout', () => {
    open(abc());
    handle('B').focus();
    handle('B').dispatchEvent(keydown(' '));
    flushSync();
    expect(message()).toBe('pickup B 2/3');
    handle('B').dispatchEvent(keydown('ArrowUp'));
    flushSync();
    expect(message()).toBe('position B 1/3');
    handle('B').dispatchEvent(keydown(' '));
    flushSync();
    expect(message()).toBe('completion B 1/3');
    expect(reported).toHaveLength(1);
    expect(reported[0].map((item) => item.key)).toEqual(['b', 'a', 'c']);
    expect(document.activeElement).toBe(handle('B'));
  });

  test('Space and ArrowUp render the provisional order and report nothing', () => {
    open(abc());
    handle('B').focus();
    handle('B').dispatchEvent(keydown(' '));
    flushSync();
    handle('B').dispatchEvent(keydown('ArrowUp'));
    flushSync();
    expect(order()).toEqual(['B', 'A', 'C']);
    expect(reported).toHaveLength(0);
  });

  test('Enter, ArrowDown and Escape restore the order and announce the cancellation', () => {
    open(abc());
    handle('B').focus();
    handle('B').dispatchEvent(keydown('Enter'));
    flushSync();
    handle('B').dispatchEvent(keydown('ArrowDown'));
    flushSync();
    expect(order()).toEqual(['A', 'C', 'B']);
    handle('B').dispatchEvent(keydown('Escape'));
    flushSync();
    expect(reported).toHaveLength(0);
    expect(order()).toEqual(['A', 'B', 'C']);
    expect(message()).toBe('cancellation B 2/3');
  });

  test('ArrowUp at the boundary leaves the order, announces and keeps focus', () => {
    open(abc());
    handle('A').focus();
    handle('A').dispatchEvent(keydown(' '));
    flushSync();
    handle('A').dispatchEvent(keydown('ArrowUp'));
    flushSync();
    expect(order()).toEqual(['A', 'B', 'C']);
    expect(message()).toBe('position A 1/3');
    expect(document.activeElement).toBe(handle('A'));
    expect(reported).toHaveLength(0);
  });

  test('ArrowLeft and ArrowRight leave a picked-up item in place', () => {
    open(abc());
    handle('B').focus();
    handle('B').dispatchEvent(keydown(' '));
    flushSync();
    handle('B').dispatchEvent(keydown('ArrowLeft'));
    handle('B').dispatchEvent(keydown('ArrowRight'));
    flushSync();
    expect(order()).toEqual(['A', 'B', 'C']);
    expect(message()).toBe('pickup B 2/3');
    expect(reported).toHaveLength(0);
  });
});

describe('markup', () => {
  test('an empty list renders a labelled list with no rows', () => {
    open([], 'Table of contents');
    expect(list().getAttribute('role')).toBe('list');
    expect(list().getAttribute('aria-label')).toBe('Table of contents');
    expect(rows()).toHaveLength(0);
  });

  test('the handle is a native draggable button named by the title', () => {
    open([{ key: 'p', title: 'Page' }]);
    const button = handle('Page');
    expect(button.tagName).toBe('BUTTON');
    expect(button.getAttribute('type')).toBe('button');
    expect(button.getAttribute('aria-label')).toBe('Page');
    expect(button.getAttribute('draggable')).toBe('true');
  });

  test('the dragger icon exposes nothing to assistive technology', () => {
    open([{ key: 'p', title: 'Page' }]);
    const svg = handle('Page').querySelector('svg');
    expect(
      handle('Page').querySelector('[data-noun="dragger"]'),
    ).not.toBeNull();
    expect(svg?.getAttribute('role')).toBeNull();
    expect(svg?.getAttribute('aria-label')).toBeNull();
    expect(svg?.querySelector('title')).toBeNull();
  });

  test('the title renders in the content region when no content is supplied', () => {
    open([{ key: 'p', title: 'Page' }]);
    const content = rows()[0].querySelector('.content');
    expect(content?.textContent?.trim()).toBe('Page');
  });

  test('content and actions render in their regions, after the handle', () => {
    open([
      {
        key: 'p',
        title: 'Page',
        content: createRawSnippet(() => ({
          render: () => '<span class="supplied">Chapter one</span>',
        })),
        actions: createRawSnippet(() => ({
          render: () => '<button type="button" class="remove">Remove</button>',
        })),
      },
    ]);
    const item = rows()[0];
    const regions = [...item.children].map((child) => child.className);
    expect(regions).toEqual(['cn-sortable-list-handle', 'content', 'actions']);
    expect(item.querySelector('.content .supplied')?.textContent).toBe(
      'Chapter one',
    );
    expect(item.querySelector('.actions .remove')?.textContent).toBe('Remove');
    expect(item.querySelector('.content')?.textContent).not.toContain('Page');
  });

  test('the content region and the actions stay operable without a reorder', () => {
    let activated = 0;
    open([
      {
        key: 'p',
        title: 'Page',
        content: createRawSnippet(() => ({
          render: () => '<span class="supplied">Chapter one</span>',
        })),
        actions: createRawSnippet(() => ({
          render: () => '<button type="button" class="remove">Remove</button>',
        })),
      },
    ]);
    const item = rows()[0];
    const action = item.querySelector('.remove');
    action?.addEventListener('click', () => {
      activated += 1;
    });
    const content = item.querySelector('.supplied');
    content?.dispatchEvent(pointerdown());
    content?.dispatchEvent(click());
    action?.dispatchEvent(pointerdown());
    action?.dispatchEvent(click());
    flushSync();
    expect(activated).toBe(1);
    expect(message()).toBe('');
    expect(item.hasAttribute('data-dragging')).toBe(false);
  });
});

describe('announcements', () => {
  test('the status region carries the message the operation produced', () => {
    open(abc());
    expect(status().getAttribute('role')).toBe('status');
    expect(message()).toBe('');
    handle('B').focus();
    handle('B').dispatchEvent(keydown(' '));
    flushSync();
    expect(message()).toBe('pickup B 2/3');
    handle('B').dispatchEvent(keydown('ArrowDown'));
    flushSync();
    expect(message()).toBe('position B 3/3');
    handle('B').dispatchEvent(keydown(' '));
    flushSync();
    expect(message()).toBe('completion B 3/3');
  });

  test('the handle describes itself by the status region while picked up', () => {
    open(abc());
    expect(handle('B').getAttribute('aria-describedby')).toBeNull();
    handle('B').focus();
    handle('B').dispatchEvent(keydown(' '));
    flushSync();
    expect(handle('B').getAttribute('aria-describedby')).toBe(status().id);
    expect(status().id).not.toBe('');
    expect(message()).toContain('2/3');
    handle('B').dispatchEvent(keydown('Escape'));
    flushSync();
    expect(handle('B').getAttribute('aria-describedby')).toBeNull();
  });
});

describe('the supplied order', () => {
  test('a consumer that ignores the report sees its own order return', () => {
    open(abc());
    activate(handle('C'));
    activate(row('A'));
    expect(reported).toHaveLength(1);
    expect(order()).toEqual(['A', 'B', 'C']);
  });
});
