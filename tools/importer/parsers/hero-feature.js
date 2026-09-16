/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-feature. Base: hero.
 * Source: WKND homepage (.teaser.cmp-teaser--hero)
 * Generated: 2026-09-16
 *
 * Library structure (hero): 1 column, 3 rows.
 *  - Row 1: block name (handled by createBlock)
 *  - Row 2: background image (optional) — single cell
 *  - Row 3: title / subheading / CTA (optional) — single cell holding all elements
 */
export default function parse(element, { document }) {
  const bgImage = element.querySelector('.cmp-teaser__image img, .cmp-image img, img');

  const contentCell = [];
  const heading = element.querySelector('.cmp-teaser__title, h1, h2, h3');
  if (heading) contentCell.push(heading);

  const description = element.querySelector('.cmp-teaser__description, [class*="description"], [class*="subtitle"], p');
  if (description) contentCell.push(description);

  const ctaLinks = Array.from(
    element.querySelectorAll('.cmp-teaser__action-link, .cmp-teaser__action-container a, a.button'),
  );
  contentCell.push(...ctaLinks);

  // Empty-block guard.
  if (!bgImage && !contentCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  // Row 2: background image (single-cell row) — only if present.
  if (bgImage) cells.push([bgImage]);
  // Row 3: content (single-cell row holding all text/CTA elements).
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-feature', cells });
  element.replaceWith(block);
}
