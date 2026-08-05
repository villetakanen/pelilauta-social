import { expect, test } from '@playwright/test';

/**
 * What a browser can see that a parse cannot: whether the theme reaches the
 * application's own DOM, and whether the no-preference default is the one the
 * design system intends.
 *
 * Alias chains are not checked here. A probe whose inline style is
 * `var(--cn-link)`, asserted against the reference token that `--cn-link` names,
 * holds one artifact against itself; `packages/design-system/test/color-contrast.test.ts`
 * resolves those chains from source instead.
 */

test('v20 theme follows the browser color scheme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('http://127.0.0.1:4321/');

  const light = await readTheme(page);
  // No preference means no class: the scheme comes from color-scheme alone.
  expect(light.documentClasses).not.toContain('light');
  expect(light.documentClasses).not.toContain('dark');
  // preflight.css paints the body; a bare button is Cyan's element rule.
  expect(light.bodyBackground).toBe(light.references.surface95);
  expect(light.bodyColor).toBe(light.references.surface10);
  expect(light.buttonColor).toBe(light.references.surface100);

  await page.emulateMedia({ colorScheme: 'dark' });
  await expect
    .poll(async () => (await readTheme(page)).bodyBackground)
    .not.toBe(light.bodyBackground);

  const dark = await readTheme(page);
  expect(dark.bodyBackground).toBe(dark.references.surface20);
  expect(dark.bodyColor).toBe(dark.references.surface95);
  expect(dark.buttonColor).toBe(dark.references.surface100);
  expect(dark.bodyColor).not.toBe(light.bodyColor);
});

test('legacy icons inherit the contextual foreground color', async ({
  page,
}) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto('http://127.0.0.1:4321/');

    const probe = await page.evaluate(async () => {
      await customElements.whenDefined('cn-icon');
      const parent = document.createElement('div');
      parent.style.color = 'rgb(11, 22, 33)';
      const icon = document.createElement('cn-icon');
      icon.setAttribute('noun', 'search');
      parent.append(icon);
      document.body.append(parent);
      await (icon as HTMLElement & { updateComplete: Promise<void> })
        .updateComplete;
      const iconColor = getComputedStyle(icon).color;
      const bareColorOn = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-on')
        .trim();
      parent.remove();
      return { iconColor, bareColorOn };
    });

    // A legacy icon without an explicit color resolves to its parent's
    // currentColor, which requires the bare --color-on property to stay
    // undefined (specs/design-system/components/cn-icon/spec.md).
    expect(
      probe.bareColorOn,
      `${colorScheme}: --color-on must stay undefined`,
    ).toBe('');
    expect(probe.iconColor, `${colorScheme}: icon inherits parent color`).toBe(
      'rgb(11, 22, 33)',
    );
  }
});

async function readTheme(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const button = document.createElement('button');
    button.style.visibility = 'hidden';
    document.body.append(button);

    const body = getComputedStyle(document.body);
    const buttonStyle = getComputedStyle(button);
    const root = getComputedStyle(document.documentElement);
    const reference = (property: string) =>
      root.getPropertyValue(property).trim();
    const result = {
      documentClasses: [...document.documentElement.classList],
      bodyBackground: body.backgroundColor,
      bodyColor: body.color,
      buttonColor: buttonStyle.color,
      references: {
        surface10: reference('--cn-color-surface-10'),
        surface20: reference('--cn-color-surface-20'),
        surface95: reference('--cn-color-surface-95'),
        surface100: reference('--cn-color-surface-100'),
      },
    };
    button.remove();
    return result;
  });
}
