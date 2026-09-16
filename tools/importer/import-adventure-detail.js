/* eslint-disable */
/* global WebImporter */
import breadcrumbsParser from './parsers/breadcrumbs.js';
import carouselHeroParser from './parsers/carousel-hero.js';
import columnsMetadataParser from './parsers/columns-metadata.js';
import tabsMinimalLightParser from './parsers/tabs-minimal-light.js';
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

const parsers = {
  breadcrumbs: breadcrumbsParser,
  'carousel-hero': carouselHeroParser,
  'columns-metadata': columnsMetadataParser,
  'tabs-minimal-light': tabsMinimalLightParser,
};

const PAGE_TEMPLATE = {
  name: 'adventure-detail',
  description: 'Adventure detail: breadcrumb, hero carousel, title, metadata sidebar, tabbed content',
  urls: ['https://wknd.site/us/en/adventures/bali-surf-camp.html'],
  blocks: [
    { name: 'breadcrumbs', instances: ['.breadcrumb', '.cmp-breadcrumb'] },
    { name: 'carousel-hero', instances: ['.carousel.panelcontainer', '.cmp-carousel'] },
    { name: 'columns-metadata', instances: ['.cmp-contentfragment--elements', '.contentfragment'] },
    { name: 'tabs-minimal-light', instances: ['.tabs.panelcontainer', '.cmp-tabs'] },
  ],
  sections: [
    { id: 'detail-main', name: 'Adventure detail', selector: ['main.cmp-layout-container--fixed', '.cmp-container'], style: null, blocks: ['breadcrumbs', 'carousel-hero', 'columns-metadata', 'tabs-minimal-light'], defaultContent: ['h1'] },
  ],
};

const transformers = [cleanupTransformer, ...(PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : [])];
function executeTransformers(hookName, element, payload) {
  const ep = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => { try { fn.call(null, hookName, element, ep); } catch (e) { console.error(`Transformer failed ${hookName}:`, e); } });
}
function findBlocksOnPage(document, template) {
  const pb = []; const seen = new Set();
  template.blocks.forEach((bd) => bd.instances.forEach((sel) => document.querySelectorAll(sel).forEach((el) => { if (seen.has(el)) return; if (bd.name !== 'carousel-hero' && el.closest('.cmp-carousel')) return; seen.add(el); pb.push({ name: bd.name, selector: sel, element: el }); })));
  return pb;
}
export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    executeTransformers('beforeTransform', main, payload);
    findBlocksOnPage(document, PAGE_TEMPLATE).forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) { try { parser(block.element, { document, url, params }); } catch (e) { console.error(`Failed ${block.name}:`, e); } }
    });
    executeTransformers('afterTransform', main, payload);
    const hr = document.createElement('hr'); main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);
    return [{ element: main, path, report: { title: document.title, template: PAGE_TEMPLATE.name } }];
  },
};
