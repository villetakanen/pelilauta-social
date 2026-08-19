<script lang="ts">
/**
 * LightboxSpecimens — the four states CnLightbox's book renders: no images,
 * one image, a strip that overflows a panel, and a caption-less image, which
 * live data supplies as a supported state rather than an authoring mistake.
 *
 * The strip's five thumbnails are flat colour squares built as data URIs
 * below. They are test rig, not a system value: their only job is to look
 * different from each other, so the specimen page shows the supplied order
 * is what renders.
 *
 * Book: apps/design/src/content/components/cn-lightbox.mdx
 */
import CnLightbox from '../../components/CnLightbox.svelte';
import { COVER_PLACEHOLDER_URI } from '../../components/cover-placeholder';

let {
  group,
}: {
  group: 'empty' | 'single' | 'strip' | 'uncaptioned';
} = $props();

/** One flat-colour square, encoded as a data URI. Test rig, not system artwork. */
function square(fill: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="${fill}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const STRIP_CAPTIONS = [
  'Aamunkoin vartijat',
  'Sundered Skerry',
  'Rautainen torni',
  'Kadonnut kartta',
  'Metsän portti',
];

const STRIP_FILLS = ['#b7410e', '#2f5233', '#264653', '#e9c46a', '#7b2d8e'];

const stripImages = STRIP_FILLS.map((fill, index) => ({
  src: square(fill),
  caption: STRIP_CAPTIONS[index],
}));

const singleImage = [
  { src: COVER_PLACEHOLDER_URI, caption: 'Saaristo aamuvalossa' },
];

const uncaptionedImages = [{ src: COVER_PLACEHOLDER_URI, caption: '' }];
</script>

<div class="lightbox-specimen" data-group={group}>
  {#if group === 'empty'}
    <CnLightbox images={[]} openLabel="Avaa kuva" closeLabel="Sulje" />
  {:else if group === 'single'}
    <CnLightbox images={singleImage} openLabel="Avaa kuva" closeLabel="Sulje" />
  {:else if group === 'strip'}
    <CnLightbox images={stripImages} openLabel="Avaa kuva" closeLabel="Sulje" />
  {:else}
    <CnLightbox images={uncaptionedImages} openLabel="Avaa kuva" closeLabel="Sulje" />
  {/if}
</div>
