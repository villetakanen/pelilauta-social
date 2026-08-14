import { expect, type Locator, type Page, test } from '@playwright/test';

/**
 * What only a browser knows about `CnNotificationAction`'s badge: where its
 * absolutely positioned corner actually lands against the Icon's own
 * measured box once the cascade runs, whether the accessible-name algorithm
 * really folds the count into the name exactly once while `aria-hidden`
 * truly drops the badge from the accessibility tree, whether an absolutely
 * positioned badge really adds no width or height to the target's own flow,
 * and whether `light-dark()` still resolves `--cn-color-info` and
 * `--cn-on-button` the same way for a current destination as for a plain
 * one. None of that is visible from reading chrome-actions.css or the
 * component's markup — it depends on the cascade, the accessibility tree
 * and real layout actually running.
 *
 * Every expected length and colour is resolved from a token on this same
 * page, exactly as chrome-actions.spec.ts resolves its own — a token whose
 * value moves both sides of the assertion. Locators read the design-system
 * book's own rendered `NotificationActionSpecimens`, not a hand-written
 * fixture, per
 * docs/lessons/a-hand-written-fixture-hid-a-live-accessibility-defect.md — a
 * mismatch between the real component's markup and a hand-copied stand-in
 * is exactly the class of defect that lesson exists to prevent.
 *
 * `Composition`'s `themes` mode renders each specimen's slot HTML twice: once
 * inside a `.themed` panel whose inline style forces `color-scheme: light`,
 * once forcing `color-scheme: dark`. That is a *local* override, independent
 * of the page's own `prefers-color-scheme`, so both panels exist on the page
 * at once. Geometry and accessible names resolve identically in either
 * panel, so those checks run once, reading a single named panel. Colour
 * resolves per scheme, so that check alone runs under both, with
 * `page.emulateMedia` set to match the panel it reads.
 */

const BOOK = '/components/cn-notification-action';

const specimenRoot = (
  page: Page,
  scheme: 'light' | 'dark',
  group: 'counts' | 'no-badge',
  presentation: 'compact' | 'labelled',
) =>
  page.locator(
    `#content [data-mode="${scheme}"] .notification-action-specimen[data-group="${group}"][data-presentation="${presentation}"]`,
  );

const rig = (root: Locator, key: string) =>
  root.locator(`[data-specimen="${key}"]`);
const control = (rigLocator: Locator) =>
  rigLocator.locator('a.cn-notification-action');
const icon = (controlLocator: Locator) => controlLocator.locator('.cn-icon');
const badge = (controlLocator: Locator) =>
  controlLocator.locator('span.cn-notification-badge');

/**
 * Resolve a colour reference — a custom-property token — on a throwaway
 * element on this same page, exactly as chrome-actions.spec.ts resolves
 * `--cn-indicator` and `--cn-on-indicator`.
 */
const resolveColor = (page: Page, colorExpr: string) =>
  page.evaluate((colorExpr) => {
    const node = document.createElement('div');
    node.setAttribute('style', `color: ${colorExpr};`);
    document.body.append(node);
    const value = getComputedStyle(node).color;
    node.remove();
    return value;
  }, colorExpr);

const box = async (locator: Locator) => {
  const bounds = await locator.boundingBox();
  expect(bounds).not.toBeNull();
  return bounds as { x: number; y: number; width: number; height: number };
};

test.describe('geometry and the accessibility tree', () => {
  // Read from the light panel throughout: geometry and accessible names are
  // identical in both panels, so either would do, and naming the choice
  // keeps a later reader from assuming it was left to chance.
  const scheme = 'light' as const;

  test.beforeEach(async ({ page }) => {
    await page.goto(BOOK);
  });

  for (const presentation of ['compact', 'labelled'] as const) {
    test(`count-3-surface's badge is centred on the Icon's block-start, inline-end corner, ${presentation}`, async ({
      page,
    }) => {
      const root = specimenRoot(page, scheme, 'counts', presentation);
      const theControl = control(rig(root, 'count-3-surface'));

      const iconBox = await box(icon(theControl));
      const badgeBox = await box(badge(theControl));

      const badgeCenterX = badgeBox.x + badgeBox.width / 2;
      const badgeCenterY = badgeBox.y + badgeBox.height / 2;

      // The Icon's own block-start, inline-end corner: its top edge and its
      // right edge — the three languages this book serves are all
      // left-to-right, so inline-end is the right edge here.
      expect(badgeCenterY).toBeCloseTo(iconBox.y, 0);
      expect(badgeCenterX).toBeCloseTo(iconBox.x + iconBox.width, 0);
    });
  }

  test("count-3-surface's accessible name announces the count exactly once, and the badge is hidden from assistive technology", async ({
    page,
  }) => {
    const root = specimenRoot(page, scheme, 'counts', 'compact');
    const theRig = rig(root, 'count-3-surface');

    await expect(
      theRig.getByRole('link', { name: 'Ilmoitukset 3', exact: true }),
    ).toHaveCount(1);

    const name = await control(theRig).getAttribute('aria-label');
    expect(name?.match(/3/g)).toHaveLength(1);

    await expect(badge(control(theRig))).toHaveAttribute('aria-hidden', 'true');
  });

  // Removing the badge from a rendered control, rather than comparing against a
  // second control that never had one, keeps the measurement on one element:
  // any difference is the badge's own contribution to the flow.
  test("the badge takes no space in the target's flow", async ({ page }) => {
    const root = specimenRoot(page, scheme, 'counts', 'compact');
    const theControl = control(rig(root, 'count-3-surface'));

    const withBadge = await box(theControl);
    await badge(theControl).evaluate((node) => node.remove());
    const without = await box(theControl);

    expect(withBadge.width).toBeCloseTo(without.width, 0);
    expect(withBadge.height).toBeCloseTo(without.height, 0);
  });
});

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`under the ${scheme} scheme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(BOOK);
    });

    // The current-destination rule sets `color` on the anchor. A badge that did
    // not declare its own would inherit `--cn-on-indicator` and change with the
    // state, so the two badges are compared against each other rather than
    // against the tokens they happen to name today.
    test("current-surface's badge fill and characters match the non-current badge", async ({
      page,
    }) => {
      const root = specimenRoot(page, scheme, 'counts', 'compact');
      const currentControl = control(rig(root, 'current-surface'));
      const plainControl = control(rig(root, 'count-3-surface'));

      await expect(currentControl).toHaveAttribute('aria-current', 'page');

      const readBadge = (controlLocator: Locator) =>
        badge(controlLocator).evaluate((node) => {
          const style = getComputedStyle(node);
          return { background: style.backgroundColor, color: style.color };
        });

      const currentBadge = await readBadge(currentControl);
      const plainBadge = await readBadge(plainControl);

      expect(currentBadge.background).toBe(plainBadge.background);
      expect(currentBadge.color).toBe(plainBadge.color);
    });
  });
}
