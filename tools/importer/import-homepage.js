/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import carouselHeroParser from './parsers/carousel-hero.js';
import columnsFeaturedParser from './parsers/columns-featured.js';
import cardsArticlesParser from './parsers/cards-articles.js';
import heroFeatureParser from './parsers/hero-feature.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'carousel-hero': carouselHeroParser,
  'columns-featured': columnsFeaturedParser,
  'cards-articles': cardsArticlesParser,
  'hero-feature': heroFeatureParser,
};

// PAGE TEMPLATE CONFIGURATION (embedded from page-templates.json)
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Landing page: full-width hero carousel, featured-article split panel, and multiple card-grid teaser sections between headings',
  urls: ['https://wknd.site/us/en.html'],
  blocks: [
    { name: 'carousel-hero', instances: ['.carousel.cmp-carousel--hero', '.cmp-carousel--hero'] },
    { name: 'columns-featured', instances: ['.teaser.cmp-teaser--featured', '.cmp-teaser--featured'] },
    { name: 'cards-articles', instances: ['.image-list.list', '.cmp-image-list'] },
    { name: 'hero-feature', instances: ['.teaser.cmp-teaser--hero', '.cmp-teaser--hero'] },
  ],
  sections: [
    { id: 'hero-carousel', name: 'Hero Carousel', selector: ['.carousel.cmp-carousel--hero'], style: null, blocks: ['carousel-hero'], defaultContent: [] },
    { id: 'featured-article', name: 'Featured Article', selector: ['.teaser.cmp-teaser--featured'], style: 'grey', blocks: ['columns-featured'], defaultContent: [] },
    { id: 'recent-articles', name: 'Recent Articles', selector: ['.image-list.list'], style: null, blocks: ['cards-articles'], defaultContent: ['h2', 'p.button-container'] },
    { id: 'next-adventures-feature', name: 'Next Adventures', selector: ['.teaser.cmp-teaser--hero'], style: null, blocks: ['hero-feature'], defaultContent: ['h2'] },
    { id: 'where-do-you-want-to-go', name: 'Where do you want to go', selector: ['.image-list.list'], style: null, blocks: ['cards-articles'], defaultContent: ['h3', 'p.button-container'] },
  ],
};

// TRANSFORMER REGISTRY (cleanup first, sections after)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        if (seen.has(element)) return;
        // Skip hero-feature instances nested inside the carousel (they are slides)
        if (blockDef.name === 'hero-feature' && element.closest('.cmp-carousel')) return;
        seen.add(element);
        pageBlocks.push({
          name: blockDef.name, selector, element, section: blockDef.section || null,
        });
      });
    });
  });
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;
    const main = document.body;

    // 1. beforeTransform cleanup
    executeTransformers('beforeTransform', main, payload);

    // 2. find blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. parse each block (skip elements already replaced)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      }
    });

    // 4. afterTransform (section breaks + metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. sanitized path (map root to /index)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
