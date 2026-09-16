/* eslint-disable */
/* global WebImporter */
import cardsContributorParser from './parsers/cards-contributor.js';
import cleanupTransformer from './transformers/wknd-cleanup.js';

const parsers = { 'cards-contributor': cardsContributorParser };
const PAGE_TEMPLATE = {
  name: 'card-grid-listing',
  description: 'Listing: title, intro, responsive grids of people cards',
  urls: ['https://wknd.site/us/en/about-us.html'],
  blocks: [{ name: 'cards-contributor', instances: ['main.cmp-layout-container--fixed .aem-Grid--default--12', '.aem-Grid--12'] }],
  sections: [{ id: 'cg-main', name: 'Contributors and Guides', selector: ['main.cmp-layout-container--fixed'], style: null, blocks: ['cards-contributor'], defaultContent: ['h1', 'h2', 'p'] }],
};
const transformers = [cleanupTransformer];
function executeTransformers(h, e, p) { const ep = { ...p, template: PAGE_TEMPLATE }; transformers.forEach((fn) => { try { fn.call(null, h, e, ep); } catch (x) { console.error(x); } }); }
function findBlocksOnPage(document, template) {
  const pb = []; const seen = new Set();
  template.blocks.forEach((bd) => { for (const sel of bd.instances) { const els = [...document.querySelectorAll(sel)].filter((el) => el.querySelector('.cmp-experience-fragment--contributor')); if (els.length) { els.forEach((el) => { if (!seen.has(el)) { seen.add(el); pb.push({ name: bd.name, selector: sel, element: el }); } }); break; } } });
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
