import decorate from '../columns/columns.js';

/*
 * columns-featured — WKND grey featured-article split panel.
 * Adds the base `columns` class so shared decorate + CSS apply.
 */
export default function decorateColumnsFeatured(block) {
  block.classList.add('columns');
  decorate(block);
}
