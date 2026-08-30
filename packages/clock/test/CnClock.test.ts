/**
 * Verifies CnClock rendering, input bindings, and accessibility attributes
 * across interactive, disabled, and view presentations against
 * `specs/clock/spec.md`.
 */
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import CnClock from '../CnClock.svelte';


let target: HTMLDivElement;
let instance: Record<string, never> | undefined;

beforeEach(() => {
  target = document.createElement('div');
  document.body.appendChild(target);
});

afterEach(() => {
  if (instance) unmount(instance);
  instance = undefined;
  target.remove();
  vi.useRealTimers();
});

function host(): HTMLElement {
  const element = target.querySelector('.cn-clock');
  if (!(element instanceof HTMLElement)) throw new Error('clock did not mount');
  return element;
}

function completedSlices(): number {
  return target.querySelectorAll('.cn-clock-slice[data-completed="true"]')
    .length;
}

function totalSlices(): number {
  return target.querySelectorAll('.cn-clock-slice').length;
}

describe('interactive mode', () => {
  test('a 4-tick clock at value 0 renders every slice uncompleted, with the declared ARIA', () => {
    instance = mount(CnClock, { target, props: { label: 'Alarm', ticks: 4 } });
    flushSync();
    const el = host();
    expect(el.getAttribute('role')).toBe('slider');
    expect(el.getAttribute('tabindex')).toBe('0');
    expect(el.getAttribute('aria-label')).toBe('Alarm');
    expect(el.getAttribute('aria-valuemin')).toBe('0');
    expect(el.getAttribute('aria-valuemax')).toBe('4');
    expect(el.getAttribute('aria-valuenow')).toBe('0');
    expect(el.getAttribute('aria-valuetext')).toBe('0/4');
    expect(completedSlices()).toBe(0);
    expect(totalSlices()).toBe(4);
  });

  test('a click increments value, fills the completed slices, and fires onchange', () => {
    let seen: number | undefined;
    instance = mount(CnClock, {
      target,
      props: {
        label: 'Alarm',
        ticks: 4,
        value: 2,
        onchange: (event: { value: number }) => {
          seen = event.value;
        },
      },
    });
    flushSync();
    host().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    flushSync();
    expect(host().getAttribute('aria-valuenow')).toBe('3');
    expect(host().getAttribute('aria-valuetext')).toBe('3/4');
    expect(completedSlices()).toBe(3);
    expect(seen).toBe(3);
  });

  test('a click past the top wraps value to 0', () => {
    instance = mount(CnClock, {
      target,
      props: { label: 'Alarm', ticks: 4, value: 4 },
    });
    flushSync();
    host().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    flushSync();
    expect(host().getAttribute('aria-valuenow')).toBe('0');
    expect(host().getAttribute('aria-valuetext')).toBe('0/4');
    expect(completedSlices()).toBe(0);
  });

  test('ArrowUp past the top also wraps value to 0', () => {
    instance = mount(CnClock, {
      target,
      props: { label: 'Alarm', ticks: 4, value: 4 },
    });
    flushSync();
    host().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
    );
    flushSync();
    expect(host().getAttribute('aria-valuenow')).toBe('0');
  });

  test('a Shift-click below 0 wraps value to the total slice count', () => {
    let seen: number | undefined;
    instance = mount(CnClock, {
      target,
      props: {
        label: 'Alarm',
        ticks: 4,
        value: 0,
        onchange: (event: { value: number }) => {
          seen = event.value;
        },
      },
    });
    flushSync();
    host().dispatchEvent(
      new MouseEvent('click', { bubbles: true, shiftKey: true }),
    );
    flushSync();
    expect(host().getAttribute('aria-valuenow')).toBe('4');
    expect(host().getAttribute('aria-valuetext')).toBe('4/4');
    expect(completedSlices()).toBe(4);
    expect(seen).toBe(4);
  });

  test('ArrowDown below 0 also wraps value to the total slice count', () => {
    instance = mount(CnClock, {
      target,
      props: { label: 'Alarm', ticks: 4, value: 0 },
    });
    flushSync();
    host().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    flushSync();
    expect(host().getAttribute('aria-valuenow')).toBe('4');
  });

  test('a long press (500ms hold) below 0 wraps value to the total slice count', () => {
    vi.useFakeTimers();
    instance = mount(CnClock, {
      target,
      props: { label: 'Alarm', ticks: 4, value: 0 },
    });
    flushSync();
    host().dispatchEvent(new Event('pointerdown', { bubbles: true }));
    vi.advanceTimersByTime(500);
    flushSync();
    expect(host().getAttribute('aria-valuenow')).toBe('4');
  });

  test('a click following a long press does not trigger an additional increment', () => {
    vi.useFakeTimers();
    let calls = 0;
    instance = mount(CnClock, {
      target,
      props: {
        label: 'Alarm',
        ticks: 4,
        value: 2,
        onchange: () => {
          calls += 1;
        },
      },
    });
    flushSync();
    host().dispatchEvent(new Event('pointerdown', { bubbles: true }));
    vi.advanceTimersByTime(500);
    flushSync();
    host().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    flushSync();
    expect(host().getAttribute('aria-valuenow')).toBe('1');
    expect(calls).toBe(1);
  });

  test('ArrowDown decrements a mid-range value, updating aria-valuetext and firing onchange', () => {
    let seen: number | undefined;
    instance = mount(CnClock, {
      target,
      props: {
        label: 'Alarm',
        ticks: 6,
        value: 3,
        onchange: (event: { value: number }) => {
          seen = event.value;
        },
      },
    });
    flushSync();
    host().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    flushSync();
    expect(host().getAttribute('aria-valuenow')).toBe('2');
    expect(host().getAttribute('aria-valuetext')).toBe('2/6');
    expect(seen).toBe(2);
  });

  test('Shift+Enter decrements the same as ArrowDown', () => {
    instance = mount(CnClock, {
      target,
      props: { label: 'Alarm', ticks: 6, value: 3 },
    });
    flushSync();
    host().dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        shiftKey: true,
        bubbles: true,
      }),
    );
    flushSync();
    expect(host().getAttribute('aria-valuenow')).toBe('2');
  });

  test('ArrowRight, Enter, and Space each increment', () => {
    for (const key of ['ArrowRight', 'Enter', ' ']) {
      instance = mount(CnClock, {
        target,
        props: { label: 'Alarm', ticks: 4, value: 1 },
      });
      flushSync();
      host().dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true }),
      );
      flushSync();
      expect(host().getAttribute('aria-valuenow')).toBe('2');
      unmount(instance);
      instance = undefined;
    }
  });

  test('ArrowLeft decrements', () => {
    instance = mount(CnClock, {
      target,
      props: { label: 'Alarm', ticks: 4, value: 2 },
    });
    flushSync();
    host().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
    );
    flushSync();
    expect(host().getAttribute('aria-valuenow')).toBe('1');
  });

  test('Home sets value to 0, End sets value to the total slice count', () => {
    instance = mount(CnClock, {
      target,
      props: { label: 'Alarm', ticks: 4, value: 2 },
    });
    flushSync();
    host().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true }),
    );
    flushSync();
    expect(host().getAttribute('aria-valuenow')).toBe('0');

    host().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true }),
    );
    flushSync();
    expect(host().getAttribute('aria-valuenow')).toBe('4');
  });

  test('a declared slice label wins over the fallback fraction', () => {
    instance = mount(CnClock, {
      target,
      props: {
        label: 'Threat',
        ticks: [{ label: 'Spotted' }, { label: 'Alarmed' }],
        value: 1,
      },
    });
    flushSync();
    expect(host().getAttribute('aria-valuetext')).toBe('Spotted');
  });

  test('a NaN value resolves to 0 with every slice uncompleted', () => {
    instance = mount(CnClock, {
      target,
      props: { label: 'Alarm', ticks: 4, value: Number.NaN },
    });
    flushSync();
    expect(host().getAttribute('aria-valuenow')).toBe('0');
    expect(completedSlices()).toBe(0);
  });

  test('a fractional value truncates toward zero', () => {
    instance = mount(CnClock, {
      target,
      props: { label: 'Alarm', ticks: 4, value: 2.8 },
    });
    flushSync();
    expect(host().getAttribute('aria-valuenow')).toBe('2');
    expect(completedSlices()).toBe(2);
  });

  test('renders a hidden input under name for FormData submission', () => {
    const form = document.createElement('form');
    target.appendChild(form);
    instance = mount(CnClock, {
      target: form,
      props: { label: 'Alarm', ticks: 4, value: 3, name: 'threat' },
    });
    flushSync();
    const data = new FormData(form);
    expect(data.get('threat')).toBe('3');
  });

  test('renders no hidden input when name is omitted', () => {
    instance = mount(CnClock, {
      target,
      props: { label: 'Alarm', ticks: 4, value: 3 },
    });
    flushSync();
    expect(target.querySelector('input[type="hidden"]')).toBeNull();
  });
});

describe('disabled mode', () => {
  test('declares role="slider", tabindex="0", and aria-disabled="true"', () => {
    instance = mount(CnClock, {
      target,
      props: { label: 'Locked Clock', ticks: 4, value: 2, disabled: true },
    });
    flushSync();
    const el = host();
    expect(el.getAttribute('role')).toBe('slider');
    expect(el.getAttribute('tabindex')).toBe('0');
    expect(el.getAttribute('aria-disabled')).toBe('true');
  });

  test('ignores clicks and arrow keys: no state change, no onchange', () => {
    let calls = 0;
    instance = mount(CnClock, {
      target,
      props: {
        label: 'Locked Clock',
        ticks: 4,
        value: 2,
        disabled: true,
        onchange: () => {
          calls += 1;
        },
      },
    });
    flushSync();
    host().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    host().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
    );
    flushSync();
    expect(host().getAttribute('aria-valuenow')).toBe('2');
    expect(calls).toBe(0);
  });

  test('submits nothing to FormData, even with a name given', () => {
    const form = document.createElement('form');
    target.appendChild(form);
    instance = mount(CnClock, {
      target: form,
      props: {
        label: 'Locked Clock',
        ticks: 4,
        value: 2,
        disabled: true,
        name: 'threat',
      },
    });
    flushSync();
    expect(form.querySelector('input[type="hidden"]')).toBeNull();
    expect(new FormData(form).get('threat')).toBeNull();
  });
});

describe('view mode', () => {
  test('declares role="img" with a combined label and no tabindex', () => {
    instance = mount(CnClock, {
      target,
      props: {
        label: 'Threat Clock',
        ticks: 6,
        value: 3,
        view: true,
      },
    });
    flushSync();
    const el = host();
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Threat Clock: 3/6');
    expect(el.hasAttribute('tabindex')).toBe(false);
  });

  test('ignores clicks: no state change, no onchange, no interactive markup', () => {
    let calls = 0;
    instance = mount(CnClock, {
      target,
      props: {
        label: 'Threat Clock',
        ticks: 6,
        value: 3,
        view: true,
        onchange: () => {
          calls += 1;
        },
      },
    });
    flushSync();
    host().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    flushSync();
    expect(host().getAttribute('aria-label')).toBe('Threat Clock: 3/6');
    expect(calls).toBe(0);
  });

  test('takes precedence over disabled: still role="img", still no tabindex', () => {
    instance = mount(CnClock, {
      target,
      props: {
        label: 'Threat Clock',
        ticks: 4,
        view: true,
        disabled: true,
      },
    });
    flushSync();
    const el = host();
    expect(el.getAttribute('role')).toBe('img');
    expect(el.hasAttribute('tabindex')).toBe(false);
    expect(el.hasAttribute('aria-disabled')).toBe(false);
  });
});
