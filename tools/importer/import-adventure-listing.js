/* eslint-disable */
/* global WebImporter */
import heroFeatureParser from './parsers/hero-feature.js';
import cardsArticlesParser from './parsers/cards-articles.js';
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

const parsers = { 'hero-feature': heroFeatureParser, 'cards-articles': cardsArticlesParser };
const PAGE_TEMPLATE = {
  name: 'adventure-listing',
  description: 'Adventure listing: title, hero band, filterable card grid',
  urls: ['https://wknd.site/us/en/adventures.html'],
  blocks: [
    { name: 'hero-feature', instances: ['.teaser.cmp-teaser--hero', '.cmp-teaser--hero'] },
    { name: 'cards-articles', instances: ['.image-list.list', '.cmp-image-list'] },
  ],
  sections: [
    { id: 'adv-hero', name: 'Hero', selector: ['.teaser.cmp-teaser--hero'], style: null, blocks: ['hero-feature'], defaultContent: ['h1'] },
    { id: 'adv-grid', name: 'Current Adventures', selector: ['.cmp-tabs', '.image-list.list'], style: null, blocks: ['cards-articles'], defaultContent: ['h2'] },
  ],
};
const transformers = [cleanupTransformer, ...(PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : [])];
function executeTransformers(h, e, p) { const ep = { ...p, template: PAGE_TEMPLATE }; transformers.forEach((fn) => { try { fn.call(null, h, e, ep); } catch (x) { console.error(x); } }); }
function findBlocksOnPage(document, template) {
  const pb = []; const seen = new Set();
  template.blocks.forEach((bd) => bd.instances.forEach((sel) => document.querySelectorAll(sel).forEach((el) => { if (seen.has(el)) return; if (bd.name !== 'hero-feature' && el.closest('.cmp-carousel')) return; seen.add(el); pb.push({ name: bd.name, selector: sel, element: el }); })));
  return pb;
}
export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    executeTransformers('beforeTransform', main, payload);
    findBlocksOnPage(document, PAGE_TEMPLATE).forEach((b) => { if (!b.element.parentNode) return; const pr = parsers[b.name]; if (pr) { try { pr(b.element, { document, url, params }); } catch (e) { console.error(`Failed ${b.name}:`, e); } } });
    executeTransformers('afterTransform', main, payload);
    const hr = document.createElement('hr'); main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    const rp = new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html?$/, '');
    return [{ element: main, path: WebImporter.FileUtils.sanitizePath(rp === '' ? '/index' : rp), report: { title: document.title, template: PAGE_TEMPLATE.name } }];
  },
};
