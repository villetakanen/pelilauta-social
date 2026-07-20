import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const codeMirrorStyles = readFileSync(
  new URL(
    '../src/components/svelte/CodeMirrorEditor/styles.css',
    import.meta.url,
  ),
  'utf8',
);

test('v20 theme follows the browser color scheme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('http://127.0.0.1:4321/');
  await page.addStyleTag({ content: codeMirrorStyles });

  const light = await readTheme(page);
  expect(light.documentClasses).not.toContain('light');
  expect(light.documentClasses).not.toContain('dark');
  expect(light.bodyBackground).toBe(light.references.surface99);
  expect(light.themeBackground).toBe(light.references.surface99);
  expect(light.bodyColor).toBe(light.references.surface10);
  expect(light.footerLinkColor).toBe(light.references.primary50);
  expect(light.footerIconColor).toBe(light.references.surface30);
  expect(light.footerIconDefined).toBe(true);
  expect(light.inputBackground).toBe(light.references.surface80);
  expect(light.inputColor).toBe(light.references.surface10);
  expect(light.inputBorder).toBe(light.references.surface70);
  expect(light.inputFocus).toBe(light.references.primary60);
  expect(light.statusBackground).toBe(light.references.error40);
  expect(light.buttonColor).toBe(light.references.surface100);
  expect(light.editorCaret).toBe(light.references.primary60);
  expect(light.editorBackground).toBe(light.references.surface80);
  expect(light.editorColor).toBe(light.references.surface10);
  expect(light.editorStrong).toBe(light.references.surface50);
  expect(light.editorEmphasis).toBe(light.references.surface40);

  await page.emulateMedia({ colorScheme: 'dark' });
  await expect
    .poll(async () => (await readTheme(page)).bodyBackground)
    .not.toBe(light.bodyBackground);

  const dark = await readTheme(page);
  expect(dark.bodyBackground).toBe(dark.references.surface20);
  expect(dark.themeBackground).toBe(dark.references.surface20);
  expect(dark.bodyColor).toBe(dark.references.surface90);
  expect(dark.footerLinkColor).toBe(dark.references.surface80);
  expect(dark.footerIconColor).toBe(dark.references.surface60);
  expect(dark.inputBackground).toBe(dark.references.surface0);
  expect(dark.inputColor).toBe(dark.references.surface90);
  expect(dark.inputBorder).toBe(dark.references.surface30);
  expect(dark.inputFocus).toBe(dark.references.primary40);
  expect(dark.statusBackground).toBe(dark.references.error60);
  expect(dark.buttonColor).toBe(dark.references.surface100);
  expect(dark.footerIconDefined).toBe(true);
  expect(dark.editorCaret).toBe(dark.references.primary40);
  expect(dark.editorBackground).toBe(dark.references.surface0);
  expect(dark.editorColor).toBe(dark.references.surface90);
  expect(dark.editorStrong).toBe(dark.references.primary80);
  expect(dark.editorEmphasis).toBe(dark.references.surface80);
  expect(dark.bodyColor).not.toBe(light.bodyColor);
  expect(dark.footerLinkColor).not.toBe(light.footerLinkColor);
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

    // The contract behind lessons Finding 1: a legacy icon without an
    // explicit color resolves to its parent's currentColor, which requires
    // the bare --color-on custom property to stay undefined.
    expect(probe.bareColorOn, `${colorScheme}: --color-on must stay undefined`)
      .toBe('');
    expect(probe.iconColor, `${colorScheme}: icon inherits parent color`).toBe(
      'rgb(11, 22, 33)',
    );
  }
});

async function readTheme(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.cssText = `
      position: fixed;
      visibility: hidden;
      background-color: var(--cn-background);
      color: var(--cn-on-background);
      border-color: var(--cn-link);
      outline-color: var(--cn-text-low);
    `;
    const inputProbe = document.createElement('div');
    inputProbe.style.cssText = `
      position: fixed;
      visibility: hidden;
      background-color: var(--cn-input);
      color: var(--cn-on-input);
      border: 1px solid var(--cn-border);
      outline: 1px solid var(--cn-focus-ring);
    `;
    const statusProbe = document.createElement('div');
    statusProbe.style.cssText = `
      position: fixed;
      visibility: hidden;
      background-color: var(--cn-color-error);
    `;
    const button = document.createElement('button');
    button.style.visibility = 'hidden';
    const editorProbe = document.createElement('div');
    editorProbe.className = 'codemirror-editor-container';
    editorProbe.style.cssText = `
      position: fixed;
      visibility: hidden;
      background-color: var(--color-code);
      color: var(--color-on-code);
      border-color: var(--color-on-code-strong);
      outline-color: var(--color-on-code-emphasis);
      caret-color: var(--color-caret);
    `;
    document.body.append(probe, inputProbe, statusProbe, button, editorProbe);

    const footerLinkElement = document.querySelector('main > footer a');
    const footerIconElement = document.querySelector('main > footer cn-icon');
    if (!footerLinkElement || !footerIconElement) {
      throw new Error('Expected the application footer theme probes');
    }

    const body = getComputedStyle(document.body);
    const probeStyle = getComputedStyle(probe);
    const inputStyle = getComputedStyle(inputProbe);
    const statusStyle = getComputedStyle(statusProbe);
    const buttonStyle = getComputedStyle(button);
    const editorStyle = getComputedStyle(editorProbe);
    const footerLink = getComputedStyle(footerLinkElement);
    const footerIcon = getComputedStyle(footerIconElement);
    const root = getComputedStyle(document.documentElement);
    const reference = (property: string) =>
      root.getPropertyValue(property).trim();
    const result = {
      documentClasses: [...document.documentElement.classList],
      bodyBackground: body.backgroundColor,
      bodyColor: body.color,
      footerLinkColor: footerLink.color,
      footerIconColor: footerIcon.color,
      footerIconDefined: customElements.get('cn-icon') !== undefined,
      themeBackground: probeStyle.backgroundColor,
      inputBackground: inputStyle.backgroundColor,
      inputColor: inputStyle.color,
      inputBorder: inputStyle.borderColor,
      inputFocus: inputStyle.outlineColor,
      statusBackground: statusStyle.backgroundColor,
      buttonColor: buttonStyle.color,
      editorCaret: editorStyle.caretColor,
      editorBackground: editorStyle.backgroundColor,
      editorColor: editorStyle.color,
      editorStrong: editorStyle.borderColor,
      editorEmphasis: editorStyle.outlineColor,
      references: {
        primary40: reference('--cn-color-primary-40'),
        primary50: reference('--cn-color-primary-50'),
        primary60: reference('--cn-color-primary-60'),
        primary80: reference('--cn-color-primary-80'),
        surface0: reference('--cn-color-surface-0'),
        surface10: reference('--cn-color-surface-10'),
        surface20: reference('--cn-color-surface-20'),
        surface30: reference('--cn-color-surface-30'),
        surface40: reference('--cn-color-surface-40'),
        surface50: reference('--cn-color-surface-50'),
        surface60: reference('--cn-color-surface-60'),
        surface70: reference('--cn-color-surface-70'),
        surface80: reference('--cn-color-surface-80'),
        surface90: reference('--cn-color-surface-90'),
        surface99: reference('--cn-color-surface-99'),
        surface100: reference('--cn-color-surface-100'),
        error40: reference('--cn-color-error-40'),
        error60: reference('--cn-color-error-60'),
      },
    };
    probe.remove();
    inputProbe.remove();
    statusProbe.remove();
    button.remove();
    editorProbe.remove();
    return result;
  });
}
