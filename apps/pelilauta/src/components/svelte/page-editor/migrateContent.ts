import TurndownService from 'turndown';

export function convertToMarkdown(html: string) {
  return new TurndownService().turndown(html);
}
