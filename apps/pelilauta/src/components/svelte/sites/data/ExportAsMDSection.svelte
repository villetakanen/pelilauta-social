<script lang="ts">
import { saveAs } from 'file-saver';
import { createSiteExport } from 'src/firebase/client/site/createSiteExport';
import { exportSiteAsMd } from 'src/firebase/client/site/exportSiteAsMd';
import { t } from 'src/utils/i18n';
import { site } from '../../../../stores/site';

async function exportSite() {
  if (!$site) return;
  const zipFile = createSiteExport($site, window.location.origin);
  const blob = await zipFile;
  saveAs(blob, `${$site.key}.zip`);
}

async function exportSiteAsDoc() {
  if (!$site) return;
  const md = await exportSiteAsMd($site, window.location.origin);
  const blob = new Blob([md], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${$site.key}.md`);
}
</script>

<section class="elevation-1 p-2 column-s">
  <h2>{t('site:data.export.title')}</h2>
  <h3>{t('site:data.export.asMarkdown')}</h3>
    
  <button class="text" onclick={exportSite} type="button">
    <cn-icon noun="arrow-down"></cn-icon>
    <span>{t('actions:export.asZippedFolder')}</span>
  </button>

  <p class="downscaled text-low">{t('site:toc.importExport.description')}</p>

  <button class="text" onclick={exportSiteAsDoc} type="button">
    <cn-icon noun="arrow-down"></cn-icon>
    <span>{t('site:data.actions.asMarkdonwDocument')}</span>
  </button>

  <p class="downscaled text-low">{t('site:data.export.asMarkdownDocument')}</p>
</section>
