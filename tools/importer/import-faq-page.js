/* eslint-disable */
/* global WebImporter */
import accordionFaqParser from './parsers/accordion-faq.js';
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

const parsers = { 'accordion-faq': accordionFaqParser };

const PAGE_TEMPLATE = {
  name: 'faq-page',
  description: 'FAQ page: title, intro image/text, accordion Q&A, contact sidebar',
  urls: ['https://wknd.site/us/en/faqs.html'],
  blocks: [{ name: 'accordion-faq', instances: ['.accordion.panelcontainer', '.cmp-accordion', '.accordion'] }],
  sections: [
    { id: 'faq-main', name: 'FAQ main content', selector: ['main.aem-GridColumn--default--8', '.cmp-container'], style: null, blocks: ['accordion-faq'], defaultContent: ['h1', 'img', 'p'] },
    { id: 'need-help', name: 'Need more help sidebar', selector: ['aside', 'aside.cmp-layoutcontainer--sidebar'], style: null, blocks: [], defaultContent: ['h2', 'p'] },
  ],
};

const transformers = [cleanupTransformer, ...(PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : [])];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => { try { fn.call(null, hookName, element, enhancedPayload); } catch (e) { console.error(`Transformer failed at ${hookName}:`, e); } });
}
function findBlocksOnPage(document, template) {
  const pageBlocks = []; const seen = new Set();
  template.blocks.forEach((bd) => bd.instances.forEach((sel) => document.querySelectorAll(sel).forEach((el) => { if (seen.has(el)) return; seen.add(el); pageBlocks.push({ name: bd.name, selector: sel, element: el }); })));
  return pageBlocks;
}
export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    executeTransformers('beforeTransform', main, payload);
    findBlocksOnPage(document, PAGE_TEMPLATE).forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) { try { parser(block.element, { document, url, params }); } catch (e) { console.error(`Failed to parse ${block.name}:`, e); } }
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
