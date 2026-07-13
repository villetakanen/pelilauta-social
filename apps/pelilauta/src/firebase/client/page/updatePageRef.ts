import type { Page } from 'src/schemas/PageSchema';

export async function updatePageRef(page: Page) {
  const { addPageRef } = await import('./addPageRef');

  const { key, name, flowTime, category, author } = page;

  await addPageRef(
    {
      key,
      name,
      flowTime,
      category: category || '-',
      author: author || '-',
    },
    page.siteKey,
  );
}
