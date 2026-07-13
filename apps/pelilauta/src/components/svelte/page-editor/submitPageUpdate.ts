import { updatePage } from 'src/firebase/client/page/updatePage';
import type { Page } from 'src/schemas/PageSchema';
import { logWarn } from 'src/utils/logHelpers';

export async function submitPageUpdate(page: Page, data: Partial<Page>) {
  // Here you can do whatever you want with the data
  console.log(data);
  const changes: Partial<Page> = {};
  if (data.name && data.name !== page.name) {
    changes.name = data.name;
  }
  if (data.category && data.category !== page.category) {
    changes.category = data.category;
  }
  if (data.markdownContent && data.markdownContent !== page.markdownContent) {
    changes.markdownContent = data.markdownContent;
  }
  if (data.tags && data.tags !== page.tags) {
    changes.tags = data.tags;
  }
  if (Object.keys(changes).length === 0) {
    logWarn('No changes detected, aborting update');
    return;
  }
  await updatePage(page.siteKey, page.key, changes);
}
