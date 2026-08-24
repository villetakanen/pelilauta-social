import { expect, type Page, test } from '@playwright/test';

/**
 * What only a browser knows about Surface.
 *
 * Every claim here is a cascade fact: which rule wins on an element carrying two
 * classes, and what a shadow resolves to once an elevated ancestor has been taken
 * into account. Neither can be parsed out of the stylesheet, because both depend
 * on selector specificity and source order together.
 *
 * The expected values are never written down. Each probe is compared against a
 * second element styled from the token the level is built on, resolved by the
 * same page under the same scheme — so a token whose value moves moves both sides,
 * and only a broken utility separates them.
 */

const BOOK = '/base/surface';

type Probe = {
  /** Classes under test, applied to the innermost element. */
  classes: string;
  /** Elevated ancestors, outermost first. */
  ancestors?: string[];
  /** Inline style on the probe, for the cases a class cannot express. */
  style?: string;
};

type Resolved = {
  backgroundColor: string;
  backgroundImage: string;
  boxShadow: string;
  padding: string;
  containerName: string;
  containerType: string;
};

/**
 * Render probes on the book page and read back what the cascade resolved. Probes
 * hang off <body>, which carries no elevation class, so a standalone level is
 * genuinely standalone.
 */
const measure = (page: Page, probes: Probe[]) =>
  page.evaluate((cases: Probe[]) => {
    const host = document.createElement('div');
    host.id = 'surface-probes';
    document.body.append(host);

    const read = (node: Element): Resolved => {
      const style = getComputedStyle(node);
      return {
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        boxShadow: style.boxShadow,
        padding: style.padding,
        containerName: style.containerName,
        containerType: style.containerType,
      };
    };

    const resolved = cases.map((probe) => {
      let mount = host;
      for (const ancestor of probe.ancestors ?? []) {
        const wrapper = document.createElement('div');
        wrapper.className = ancestor;
        mount.append(wrapper);
        mount = wrapper;
      }
      const element = document.createElement('div');
      element.className = probe.classes;
      if (probe.style) element.setAttribute('style', probe.style);
      element.textContent = probe.classes;
      mount.append(element);
      return read(element);
    });

    host.remove();
    return resolved;
  }, probes);

/** The five surface roles and the three shadow values, as this page resolves them. */
const references = (page: Page) =>
  page.evaluate(() => {
    const host = document.createElement('div');
    document.body.append(host);
    const resolve = (
      declaration: string,
      property: 'backgroundColor' | 'boxShadow',
    ) => {
      const node = document.createElement('div');
      node.setAttribute('style', declaration);
      host.append(node);
      const value = getComputedStyle(node)[property];
      node.remove();
      return value;
    };

    const background = (token: string) =>
      resolve(`background-color: var(${token});`, 'backgroundColor');
    const shadow = (token: string) =>
      resolve(`box-shadow: var(${token});`, 'boxShadow');
    const gap = () => {
      const node = document.createElement('div');
      node.setAttribute('style', 'padding: var(--cn-gap);');
      host.append(node);
      const value = getComputedStyle(node).padding;
      node.remove();
      return value;
    };

    const values = {
      surface: [
        background('--cn-color-surface'),
        background('--cn-color-surface-1'),
        background('--cn-color-surface-2'),
        background('--cn-color-surface-3'),
        background('--cn-color-surface-4'),
      ],
      shadow: [
        shadow('--cn-shadow-elevation-2'),
        shadow('--cn-shadow-elevation-3'),
        shadow('--cn-shadow-elevation-4'),
      ],
      gap: gap(),
    };
    host.remove();
    return values;
  });

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`under the ${scheme} scheme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(BOOK);
    });

    test('every standalone level paints its own surface role', async ({
      page,
    }) => {
      const tokens = await references(page);
      const probes = await measure(
        page,
        [0, 1, 2, 3, 4].map((level) => ({ classes: `elevation-${level}` })),
      );

      for (const [level, probe] of probes.entries()) {
        expect(
          probe.backgroundColor,
          `elevation-${level} does not paint --cn-color-surface${level === 0 ? '' : `-${level}`}`,
        ).toBe(tokens.surface[level]);
        // A failed var() falls back to transparent, which would otherwise pass
        // against a role that also failed.
        expect(probe.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      }
    });

    test('levels 0 and 1 are shadowless, and 2 to 4 carry their full shadow', async ({
      page,
    }) => {
      const tokens = await references(page);
      const probes = await measure(
        page,
        [0, 1, 2, 3, 4].map((level) => ({ classes: `elevation-${level}` })),
      );

      expect(probes[0].boxShadow).toBe('none');
      expect(probes[1].boxShadow).toBe('none');
      expect(probes[2].boxShadow).toBe(tokens.shadow[0]);
      expect(probes[3].boxShadow).toBe(tokens.shadow[1]);
      expect(probes[4].boxShadow).toBe(tokens.shadow[2]);
      expect(tokens.shadow[0]).not.toBe('none');
    });

    test('a nested level shows only its rise above the nearest ancestor', async ({
      page,
    }) => {
      const tokens = await references(page);
      const [none, one, two] = ['none', tokens.shadow[0], tokens.shadow[1]];
      // The relative-elevation table, ancestor to child.
      const transitions: Array<[string, string, string]> = [
        ['elevation-1', 'elevation-2', none],
        ['elevation-1', 'elevation-3', one],
        ['elevation-1', 'elevation-4', two],
        ['elevation-2', 'elevation-3', none],
        ['elevation-2', 'elevation-4', one],
        ['elevation-3', 'elevation-4', none],
      ];

      const probes = await measure(
        page,
        transitions.map(([ancestor, child]) => ({
          classes: child,
          ancestors: [ancestor],
        })),
      );

      for (const [
        index,
        [ancestor, child, expected],
      ] of transitions.entries()) {
        expect(
          probes[index].boxShadow,
          `${ancestor} > ${child} does not show the shadow of its rise`,
        ).toBe(expected);
      }
    });

    test('a nested level keeps the background of its absolute level', async ({
      page,
    }) => {
      const tokens = await references(page);
      const probes = await measure(page, [
        { classes: 'elevation-4', ancestors: ['elevation-1'] },
        { classes: 'elevation-4', ancestors: ['elevation-2'] },
        { classes: 'elevation-4', ancestors: ['elevation-3'] },
      ]);

      for (const probe of probes) {
        expect(probe.backgroundColor).toBe(tokens.surface[4]);
      }
    });

    test('a chain resolves against its nearest elevated ancestor', async ({
      page,
    }) => {
      const tokens = await references(page);
      const [deep] = await measure(page, [
        { classes: 'elevation-4', ancestors: ['elevation-1', 'elevation-3'] },
      ]);

      // Level 3 is the nearest ancestor, so the rise is one level: shadowless.
      // Resolved against the level-1 ancestor instead it would carry the
      // three-step shadow.
      expect(deep.boxShadow).toBe('none');
      expect(deep.boxShadow).not.toBe(tokens.shadow[1]);
    });

    test('a background image survives an elevation utility', async ({
      page,
    }) => {
      const [probe] = await measure(page, [
        {
          classes: 'elevation-3',
          style: 'background-image: linear-gradient(black, white);',
        },
      ]);

      expect(probe.backgroundImage).toContain('linear-gradient');
    });

    test('a surface is a padded container at level 1', async ({ page }) => {
      const tokens = await references(page);
      const [probe] = await measure(page, [{ classes: 'surface' }]);

      expect(probe.padding).toBe(tokens.gap);
      expect(probe.containerName).toBe('surface-area');
      expect(probe.containerType).toContain('inline-size');
      expect(probe.backgroundColor).toBe(tokens.surface[1]);
      expect(probe.boxShadow).toBe('none');
    });

    test('an elevation class on a surface changes the level, not the container', async ({
      page,
    }) => {
      const tokens = await references(page);
      const [plain, raised] = await measure(page, [
        { classes: 'surface' },
        { classes: 'surface elevation-3' },
      ]);

      expect(raised.padding).toBe(plain.padding);
      expect(raised.containerName).toBe('surface-area');
      expect(raised.backgroundColor).toBe(tokens.surface[3]);
      expect(raised.boxShadow).toBe(tokens.shadow[1]);
    });

    test('a surface participates in nesting as level 1', async ({ page }) => {
      const tokens = await references(page);
      const [child] = await measure(page, [
        { classes: 'elevation-3', ancestors: ['surface'] },
      ]);

      expect(child.boxShadow).toBe(tokens.shadow[0]);
    });

    test('a surface at an explicit level participates at that level', async ({
      page,
    }) => {
      const [child] = await measure(page, [
        { classes: 'elevation-3', ancestors: ['surface elevation-2'] },
      ]);

      expect(child.boxShadow).toBe('none');
    });
  });
}

test('an attention class paints its flag on a surface rendered without one', async ({
  page,
}) => {
  // The state exists for consumers that learn it in the browser and never hydrate
  // the element, so the class alone has to be enough. The two roles have to stay
  // distinguishable, or the flag carries no signal; which colour each takes, and how
  // translucent it is, are the stylesheet's to state and not this test's to pin.
  await page.goto(BOOK);

  const flags = await page.evaluate(() => {
    const host = document.createElement('div');
    document.body.append(host);

    const read = (className: string) => {
      const element = document.createElement('div');
      element.className = 'surface';
      host.append(element);
      const resting = getComputedStyle(element, '::after').content;
      element.classList.add(className);
      const style = getComputedStyle(element, '::after');
      const flagged = {
        content: style.content,
        background: style.backgroundColor,
        clipPath: style.clipPath,
        pointerEvents: style.pointerEvents,
      };
      element.remove();
      return { resting, ...flagged };
    };

    const result = {
      notify: read('has-notify'),
      alert: read('has-alert'),
    };
    host.remove();
    return result;
  });

  expect(flags.notify.resting).toBe('none');
  expect(flags.notify.content).not.toBe('none');
  expect(flags.notify.background).not.toBe(flags.alert.background);
  expect(flags.notify.clipPath).toContain('polygon');
  expect(flags.notify.pointerEvents).toBe('none');
});
