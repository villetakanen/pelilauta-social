import type { Page } from 'src/schemas/PageSchema';
import type { Site } from 'src/schemas/SiteSchema';

export async function exportSiteAsMd(site: Site, origin: string) {
  const pages: Array<string> = [];
  const TurndownService = (await import('turndown')).default;
  const _turndownService = new TurndownService();

  // Fetch all pages from the API
  const pageResults = await fetch(`${origin}/api/sites/${site.key}/pages.json`);
  const pageData = await pageResults.json();
  const pageEntries = pageData as Array<Page>;

  // Lets order page-entries by their locale title
  pageEntries.sort((a, b) => a.name.localeCompare(b.name));

  // We want to take the site toc, and loop throuhg it to get the markdown for each page,
  // from the _rendered html_ of the page. We will use the turndown library to convert the html to markdown.
  //
  // If a page does not have entry in the toc, it will be added to the end of the md file.
  for (const ref of site.pageRefs ?? []) {
    const index = pageEntries.findIndex((page) => page.key === ref.key);
    if (index >= 0) {
      const page = pageEntries[index];
      const markdown = page.htmlContent
        ? _turndownService.turndown(page.htmlContent ?? '')
        : (page.markdownContent ?? '');
      pages.push(markdown);
      pageEntries.splice(index, 1);
    }
  }

  // Add the pages that were not in the toc
  for (const page of pageEntries) {
    const markdown = page.htmlContent
      ? _turndownService.turndown(page.htmlContent ?? '')
      : (page.markdownContent ?? '');
    pages.push(markdown);
  }

  const intro = `# ${site.name}\n\n${site.description}\n\n----\n\n`;
  const markdown = intro + pages.join('\n\n----\n\n');

  return markdown;
}
