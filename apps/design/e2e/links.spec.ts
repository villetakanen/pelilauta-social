import { expect, type Page, test } from '@playwright/test';

/**
 * What only a browser knows about the default native-link presentation.
 *
 * Every claim here is a cascade fact: whether a rule of specificity (0,0,1)
 * still reaches an anchor once the site's own stylesheets have loaded, and what
 * :hover and :focus-visible resolve to. Neither can be parsed out of the
 * stylesheet, because both depend on selector specificity and source order
 * together.
 *
 * The expected colours are never written down. Each probe is compared against an
 * element styled from the token the state is built on, resolved by the same page
 * under the same scheme — so a token whose value moves moves both sides.
 *
 * `:visited` is absent by construction: browsers report the unvisited style to
 * getComputedStyle, which is the same privacy guarantee the rule exists to keep.
 * A stylesheet check covers it — see packages/design-system/test/links.test.ts.
 *
 * Spec: specs/design-system/links-and-actions/spec.md
 */

const BOOK = '/base/links-actions-buttons';
const PROBE = 'link-probe';

type Resolved = {
  color: string;
  textDecorationLine: string;
  textUnderlineOffset: string;
  outlineColor: string;
  outlineStyle: string;
  outlineWidth: string;
};

/**
 * Mount one anchor at the top of the book's content and read back what the
 * cascade resolved. It is a real anchor in the real page, so any rule that would
 * reach a link in a book reaches this one too.
 */
const mount = async (page: Page, markup: string) => {
  await page.evaluate(
    ([html, id]) => {
      document.getElementById(id)?.remove();
      const host = document.createElement('div');
      host.id = id;
      host.innerHTML = html;
      document.querySelector('main#content')?.prepend(host);
    },
    [markup, PROBE] as const,
  );
  return page.locator(`#${PROBE} a`);
};

const read = (page: Page): Promise<Resolved> =>
  page.locator(`#${PROBE} a`).evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      color: style.color,
      textDecorationLine: style.textDecorationLine,
      textUnderlineOffset: style.textUnderlineOffset,
      outlineColor: style.outlineColor,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
    };
  });

/** The link and focus roles, as this page resolves them under its scheme. */
const references = (page: Page) =>
  page.evaluate(() => {
    const host = document.createElement('div');
    document.body.append(host);
    const resolve = (token: string) => {
      const node = document.createElement('div');
      node.setAttribute('style', `color: var(${token});`);
      host.append(node);
      const value = getComputedStyle(node).color;
      node.remove();
      return value;
    };
    const values = {
      link: resolve('--cn-link'),
      hover: resolve('--cn-link-hover'),
      focus: resolve('--cn-focus-ring'),
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

    test('an anchor with a destination is underlined in the link role', async ({
      page,
    }) => {
      const tokens = await references(page);
      await mount(page, '<a href="/base/surface">Study surface elevation</a>');
      const probe = await read(page);

      expect(probe.color).toBe(tokens.link);
      // A failed var() falls back to the inherited text colour, which a broken
      // rule and a missing rule would both produce.
      expect(tokens.link).not.toBe('rgb(0, 0, 0)');
      expect(probe.textDecorationLine).toBe('underline');
      // The UA underlines links too. The offset is ours, so it is what
      // distinguishes our rule having applied from it not having applied.
      expect(probe.textUnderlineOffset).not.toBe('auto');
    });

    test('hover moves to the hover role and keeps the underline', async ({
      page,
    }) => {
      const tokens = await references(page);
      const link = await mount(
        page,
        '<a href="/principles/color-system">Explore colour and surface roles</a>',
      );
      await link.hover();
      const probe = await read(page);

      expect(probe.color).toBe(tokens.hover);
      expect(tokens.hover).not.toBe(tokens.link);
      expect(probe.textDecorationLine).toBe('underline');
    });

    test('keyboard focus draws the focus ring without losing the link treatment', async ({
      page,
    }) => {
      const tokens = await references(page);
      const link = await mount(
        page,
        '<a href="/base/fonts">Review the font system</a>',
      );

      // The probe is the first focusable element in the content, and the skip
      // link is the first in the page — so tabbing from the top reaches it, and
      // the focus arrives by keyboard, which is what :focus-visible asks.
      await page.keyboard.press('Tab');
      await page.locator('a.skip-link').press('Enter');
      await page.keyboard.press('Tab');
      await expect(link).toBeFocused();

      const probe = await read(page);
      expect(probe.outlineStyle).toBe('solid');
      expect(probe.outlineWidth).toBe('2px');
      expect(probe.outlineColor).toBe(tokens.focus);
      expect(probe.textDecorationLine).toBe('underline');
    });

    test('an anchor without a destination is not presented as a link', async ({
      page,
    }) => {
      const tokens = await references(page);
      await mount(page, '<a>Not a destination</a>');
      const probe = await read(page);

      expect(probe.color).not.toBe(tokens.link);
      expect(probe.textUnderlineOffset).toBe('auto');
    });

    // Buttons and FABs have no presentation yet. What this holds is the seam the
    // later capabilities are specified to fill: the default treatment does not
    // claim these anchors, so replacing it is a matter of styling them.
    for (const classes of ['button', 'fab', 'button fab']) {
      test(`the default treatment does not claim a.${classes.replace(' ', '.')}`, async ({
        page,
      }) => {
        const tokens = await references(page);
        await mount(
          page,
          `<a class="${classes}" href="/base/surface">Study surface elevation</a>`,
        );
        const probe = await read(page);

        expect(probe.color).not.toBe(tokens.link);
        expect(probe.textUnderlineOffset).toBe('auto');
      });
    }
  });
}
