import { describe, expect, test } from 'vitest';
import { sanitizeHtml } from './sanitizeHtml';

describe('permitted markup', () => {
  test('keeps document structure and permitted attributes', () => {
    const html =
      '<h2 lang="fi" dir="rtl" title="t">Otsikko</h2><details open><summary>S</summary><p>x</p></details>' +
      '<table><tr><th scope="col" align="center" colspan="2">a</th><td rowspan="3">b</td></tr></table>' +
      '<ol start="3" reversed><li value="4">x</li></ol><img src="https://x.fi/a.png" alt="a" width="10" height="20">';
    const out = sanitizeHtml(html);
    expect(out).toContain('<h2 lang="fi" dir="rtl" title="t">Otsikko</h2>');
    expect(out).toContain('<details open>');
    expect(out).toContain('scope="col"');
    expect(out).toContain('align="center"');
    expect(out).toContain('colspan="2"');
    expect(out).toContain('<ol start="3" reversed>');
    expect(out).toContain('<li value="4">');
    expect(out).toContain('width="10" height="20"');
  });
});

describe('rejected markup', () => {
  test('removes scripts with contents, handlers, styles and frames', () => {
    const out = sanitizeHtml(
      '<p onclick="x" style="color:red" class="c" id="i" data-x="1">a</p><script>alert(1)</script>' +
        '<style>p{}</style><iframe src="x">in</iframe><object>o</object><embed src="x">' +
        '<svg><p>svg</p></svg><math>m</math>',
    );
    expect(out).toBe('<p>a</p>');
  });

  test('unwraps other excluded elements', () => {
    expect(
      sanitizeHtml('<div>a <b>b</b><form><button>c</button></form></div>'),
    ).toBe('a <b>b</b>c');
  });

  test('rejects attribute values outside the policy', () => {
    const out = sanitizeHtml(
      '<p dir="x">a</p><td colspan="0" align="justify" rowspan="x">b</td><a href="/x" target="_blank">l</a>',
    );
    expect(out).not.toContain('dir=');
    expect(out).not.toContain('colspan');
    expect(out).not.toContain('align');
    expect(out).not.toContain('target');
  });

  test('form controls other than disabled checkboxes are removed', () => {
    const out = sanitizeHtml(
      '<input type="text" name="x"><input type="checkbox" name="n" checked>',
    );
    expect(out).not.toContain('text');
    expect(out).not.toContain('name=');
    expect(out).toContain('disabled');
    expect(out).toContain('checked');
  });
});

describe('URL schemes', () => {
  test('links permit http, https, mailto, relative and fragments', () => {
    for (const href of [
      'http://a.fi',
      'https://a.fi/x',
      'mailto:a@b.fi',
      '/x',
      './x',
      '../x',
      'x/y',
      '#f',
      '?q=1',
    ]) {
      expect(sanitizeHtml(`<a href="${href}">l</a>`)).toBe(
        `<a href="${href}">l</a>`,
      );
    }
  });

  test('an unsafe link loses its destination and keeps its label', () => {
    for (const href of [
      'javascript:alert(1)',
      'JaVa\nScRiPt:alert(1)',
      'data:text/html,x',
      'ftp://a.fi',
      'vbscript:x',
      ' javascript:x',
    ]) {
      expect(sanitizeHtml(`<a href="${href}">label</a>`)).toBe('<a>label</a>');
    }
  });

  test('images permit http, https and relative sources, not mailto', () => {
    expect(sanitizeHtml('<img src="/a.png" alt="a">')).toContain(
      'src="/a.png"',
    );
    expect(sanitizeHtml('<img src="mailto:a@b.fi" alt="a">')).toBe('a');
  });

  test('an image with a rejected source is replaced by its alt text', () => {
    expect(
      sanitizeHtml(
        '<p>x <img src="javascript:alert(1)" alt="Kartta &amp; <b>"> y</p>',
      ),
    ).toBe('<p>x Kartta &amp; &lt;b&gt; y</p>');
    expect(sanitizeHtml('<img src="data:image/png;base64,AAA">')).toBe('');
  });
});

describe('stored HTML fallback', () => {
  test('uses the same policy', () => {
    expect(sanitizeHtml('<script>alert(1)</script><p>kept</p>')).toBe(
      '<p>kept</p>',
    );
  });
});

describe('extension markup', () => {
  test('invalid Dice attributes and arbitrary classes are dropped', () => {
    expect(
      sanitizeHtml(
        '<span class="dice" role="img" data-sides="7" data-value="2" data-kind="die" data-length="1" aria-label="[2]">2</span>',
      ),
    ).toBe('<span>2</span>');
    expect(sanitizeHtml('<span class="evil" data-x="1">x</span>')).toBe(
      '<span>x</span>',
    );
  });

  test('bare-URL class survives only as url', () => {
    expect(
      sanitizeHtml('<a class="url" href="https://a.fi">https://a.fi</a>'),
    ).toBe('<a href="https://a.fi" class="url">https://a.fi</a>');
    expect(sanitizeHtml('<a class="other" href="https://a.fi">x</a>')).toBe(
      '<a href="https://a.fi">x</a>',
    );
  });

  const notes =
    '<sup><a id="fnref-p1-1-1" href="#fn-p1-1" aria-label="Footnote 1">1</a></sup>' +
    '<section class="footnotes"><ol><li id="fn-p1-1"><p>n <a href="#fnref-p1-1-1" aria-label="Back">↩</a></p></li></ol></section>';

  test('footnote markup survives for the supplied namespace', () => {
    const out = sanitizeHtml(notes, { namespace: 'p1' });
    expect(out).toContain('id="fnref-p1-1-1"');
    expect(out).toContain('<li id="fn-p1-1">');
    expect(out).toContain('<section class="footnotes">');
    expect(out).toContain('aria-label="Footnote 1"');
    expect(out).toContain('aria-label="Back"');
  });

  test('footnote identifiers outside the namespace are removed', () => {
    const other = sanitizeHtml(notes, { namespace: 'p2' });
    expect(other).not.toContain('id=');
    expect(other).not.toContain('aria-label');
    const none = sanitizeHtml(notes);
    expect(none).not.toContain('id=');
    expect(
      sanitizeHtml('<p id="fn-p1-1">x</p><a id="top">x</a>', {
        namespace: 'p1',
      }),
    ).toBe('<p>x</p><a>x</a>');
  });

  test('aria-label is dropped from non-footnote links', () => {
    expect(
      sanitizeHtml('<a href="https://a.fi" aria-label="x">l</a>', {
        namespace: 'p1',
      }),
    ).toBe('<a href="https://a.fi">l</a>');
  });
});
