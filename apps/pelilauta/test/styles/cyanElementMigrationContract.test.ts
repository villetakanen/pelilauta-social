import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appRoot = fileURLToPath(new URL('../..', import.meta.url));
const migration = readFileSync(
  join(appRoot, 'src/styles/migrations/cyan-elements.css'),
  'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '');
const compact = migration.replace(/\s+/g, ' ').trim();

describe('Cyan element migration contract', () => {
  it('keeps a bridge for every reached element context', () => {
    const contexts = [
      'cn-sortable-list',
      'cn-d20-ability-score',
      'cn-dice',
      'cn-navigation-icon',
      'cn-app-bar',
    ];

    for (const context of contexts) {
      expect(migration, context).toContain(context);
    }

    expect(compact).toContain(
      'cn-sortable-list { display: block; font-family: var(--cn-font-family-ui); font-weight: var(--cn-font-weight-ui); font-size: var(--cn-font-size-ui); letter-spacing: var(--cn-letter-spacing-ui); }',
    );

    // Cyan declares --cn-line-height-ui nowhere, so restating its read here would
    // change a text input's leading the moment anything declares it.
    expect(migration).not.toContain('--cn-line-height-ui');
  });

  it('keeps no bridge for an element the application no longer renders', () => {
    // CnCard is a local component and no `cn-card` element is left in the
    // application, so a rule reappearing here would be styling nothing — and
    // would read as a live dependency to whoever finds it.
    expect(migration).not.toMatch(/\bcn-card\b/);

    // CnBubble replaced the reply bubble, the only cn-bubble the application
    // rendered. Its bands are a `header` and a `footer` the consumer writes, so
    // the rules that cancelled Cyan's `.toolbar` padding govern nothing.
    expect(migration).not.toMatch(/\bcn-bubble\b/);

    // CnReactionButton replaced the love toggle every entry, reply and site
    // sidebar rendered. Its state surface and count are the component's own
    // styles, so the host tokens Cyan read govern nothing.
    expect(migration).not.toMatch(/\bcn-reaction-button\b/);

    // CnLoader replaced every `cn-loader` element, including the ones inside
    // buttons and fabs whose negative margins pulled a 72px ring back into a
    // control. The inline variant needs none of that.
    expect(migration).not.toMatch(/\bcn-loader\b/);

    // CnLightbox replaced every cn-lightbox: the thread body, a reply, and the
    // unsaved previews in the editor and both reply dialogs. Its gallery and its
    // dialog compose the shared elevation utilities and state their own radii and
    // inset, so the host custom properties Cyan's component read govern nothing.
    expect(migration).not.toMatch(/\bcn-lightbox\b/);

    // CnMenu replaced the reply menu, the only cn-menu the application had. Its
    // rows are the anchors and buttons the consumer wrote rather than a ul of li,
    // so
    // a bridge keyed on that shape would match nothing on any page.
    expect(migration).not.toMatch(/\bcn-menu\b/);

    // The design system places the tray, so no bridge restates its geometry.
    expect(migration).not.toMatch(/fab-tray/);

    // CnToggle replaced every cn-toggle-button, so the toolbar rule that kept
    // Cyan's host from stretching in a flex row governs nothing. The local
    // toggle is a full-width row by design, and styles/toggle.css says so.
    expect(migration).not.toMatch(/\bcn-toggle-button\b/);

    // Nothing renders cn-tray-button since the layouts moved to CnRail, so a
    // rule keyed on it would match nothing on any page.
    expect(migration).not.toMatch(/\bcn-tray-button\b/);
  });

  it.each([
    'Base.astro',
    'Library.astro',
    'Site.astro',
    'Docs.astro',
    'Admin.astro',
    'ModalPage.astro',
  ])('leaves tray placement to the design system in %s', (layout) => {
    // Cyan styles `nav#fab-tray` and the design system styles `nav.fab-tray`.
    // An identifier beats a class whatever the import order, so a layout that
    // reintroduced the id would silently take Cyan's fixed placement back and
    // strand the chrome layer.
    //
    // Either layer counts: CnAppChrome is the design system's, and the local
    // AppChrome is what a layout still on Cyan's bar keeps until it migrates.
    const source = readFileSync(join(appRoot, 'src/layouts', layout), 'utf8');

    expect(source).not.toMatch(/id="fab-tray"/);
    expect(source).toMatch(/<(Cn)?AppChrome/);
  });

  it('does not copy selectors that cannot cross a component shadow root', () => {
    expect(migration).not.toMatch(/cn-sortable-list\s+(?:ul|\.item|\.title)/);
    expect(migration).not.toContain('.cyan-accordion');
    expect(migration).not.toContain('cn-editor');
    expect(migration).not.toMatch(/\bcn-icon\b/);
    expect(migration).not.toContain('@import');
  });

  it.each(['BaseHead.astro', 'EditorHead.astro'])(
    'loads the bridge between the design system and overrides in %s',
    (head) => {
      const source = readFileSync(
        join(appRoot, 'src/components/server/BaseHead', head),
        'utf8',
      );
      const designSystem = source.indexOf(
        "import '@design-system/styles/ds.css';",
      );
      const bridge = source.indexOf(
        "import '../../../styles/migrations/cyan-elements.css';",
      );
      const overrides = source.indexOf("import '../../../overrides.css';");

      expect(designSystem).toBeGreaterThan(-1);
      expect(bridge).toBeGreaterThan(designSystem);
      expect(overrides).toBeGreaterThan(bridge);
    },
  );
});
