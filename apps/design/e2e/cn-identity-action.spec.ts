import { expect, type Locator, type Page, test } from '@playwright/test';

/**
 * What only a browser knows about `CnIdentityAction`: whether the identity
 * mark actually occupies the same box the login Icon occupies once the
 * cascade runs — the mark is sized from `--cn-avatar-size-small` and the
 * Icon from `--cn-icon-size`, two independently declared tokens that
 * coincide today rather than one restating the other — whether the
 * accessible name in the signed-in mode is the label alone, given the mark
 * renders inside the anchor and could contribute a second announcement, and
 * whether the mark keeps its own backdrop and foreground as the current
 * destination, given that rule recolours the chrome action's own foreground.
 *
 * Locators read the design-system book's own rendered
 * `IdentityActionSpecimens`, not a hand-written fixture, per
 * docs/lessons/a-hand-written-fixture-hid-a-live-accessibility-defect.md.
 *
 * `Composition`'s `themes` mode renders each specimen's slot HTML twice: once
 * inside a `.themed` panel whose inline style forces `color-scheme: light`,
 * once forcing `color-scheme: dark`. That is a *local* override, independent
 * of the page's own `prefers-color-scheme`, so both panels exist on the page
 * at once. Colour resolves per scheme, so the current-destination check runs
 * under both, with `page.emulateMedia` set to match the panel it reads.
 */

const BOOK = '/components/cn-identity-action';

const specimenRoot = (
  page: Page,
  scheme: 'light' | 'dark',
  group: 'modes',
  presentation: 'compact' | 'labelled',
) =>
  page.locator(
    `#content [data-mode="${scheme}"] .identity-action-specimen[data-group="${group}"][data-presentation="${presentation}"]`,
  );

const rig = (root: Locator, key: string) =>
  root.locator(`[data-specimen="${key}"]`);
const control = (rigLocator: Locator) =>
  rigLocator.locator('a.cn-identity-action');
const icon = (controlLocator: Locator) => controlLocator.locator('.cn-icon');
const mark = (controlLocator: Locator) => controlLocator.locator('.cn-avatar');

const box = async (locator: Locator) => {
  const bounds = await locator.boundingBox();
  expect(bounds).not.toBeNull();
  return bounds as { x: number; y: number; width: number; height: number };
};

test.describe('geometry and the accessibility tree', () => {
  // Read from the light panel throughout: geometry and accessible names are
  // identical in both panels.
  const scheme = 'light' as const;

  test.beforeEach(async ({ page }) => {
    await page.goto(BOOK);
  });

  for (const presentation of ['compact', 'labelled'] as const) {
    test(`the identity mark occupies the box the login glyph occupies, ${presentation}`, async ({
      page,
    }) => {
      const root = specimenRoot(page, scheme, 'modes', presentation);

      const signedOutControl = control(rig(root, 'signed-out-surface'));
      const signedInControl = control(rig(root, 'signed-in-surface'));

      const iconBox = await box(icon(signedOutControl));
      const markBox = await box(mark(signedInControl));

      // The two rows sit at different places on the page, so their glyphs
      // are compared against their own target's box rather than against
      // each other's page position.
      const signedOutTarget = await box(signedOutControl);
      const signedInTarget = await box(signedInControl);

      expect(markBox.width).toBeCloseTo(iconBox.width, 0);
      expect(markBox.height).toBeCloseTo(iconBox.height, 0);
      expect(markBox.x - signedInTarget.x).toBeCloseTo(
        iconBox.x - signedOutTarget.x,
        0,
      );
      expect(markBox.y - signedInTarget.y).toBeCloseTo(
        iconBox.y - signedOutTarget.y,
        0,
      );
    });
  }

  test("the signed-in mode's accessible name is the label alone", async ({
    page,
  }) => {
    const root = specimenRoot(page, scheme, 'modes', 'compact');
    const theRig = rig(root, 'signed-in-surface');

    await expect(
      theRig.getByRole('link', { name: 'Oma profiili', exact: true }),
    ).toHaveCount(1);

    await expect(mark(control(theRig))).toHaveAttribute('aria-hidden', 'true');
  });
});

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`under the ${scheme} scheme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(BOOK);
    });

    // The current-destination rule sets `color` on the anchor. A mark that
    // did not keep its own backdrop and foreground would inherit that
    // change, so the two marks are compared against each other rather than
    // against the tokens they happen to name today.
    test("current-surface's identity mark keeps its backdrop and foreground, matching the non-current mark", async ({
      page,
    }) => {
      const root = specimenRoot(page, scheme, 'modes', 'compact');
      const currentControl = control(rig(root, 'current-surface'));
      const plainControl = control(rig(root, 'signed-in-surface'));

      await expect(currentControl).toHaveAttribute('aria-current', 'page');

      const readMark = (controlLocator: Locator) =>
        mark(controlLocator).evaluate((node) => {
          const style = getComputedStyle(node);
          return { background: style.backgroundColor, color: style.color };
        });

      const currentMark = await readMark(currentControl);
      const plainMark = await readMark(plainControl);

      expect(currentMark.background).toBe(plainMark.background);
      expect(currentMark.color).toBe(plainMark.color);
    });
  });
}
