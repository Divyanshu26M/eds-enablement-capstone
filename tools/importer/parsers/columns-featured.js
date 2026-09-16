/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-featured. Base: columns.
 * Source: WKND homepage (.teaser.cmp-teaser--featured)
 * Generated: 2026-09-16
 *
 * Library structure (columns): first row = block name; second row defines the
 * column count. Target: one content row with 2 columns —
 *  - cell 1 = image
 *  - cell 2 = text content (eyebrow/pretitle, heading, description, CTA)
 */
export default function parse(element, { document }) {
  const image = element.querySelector('.cmp-teaser__image img, .cmp-image img, img');

  const contentCell = [];
  const eyebrow = element.querySelector('.cmp-teaser__pretitle, [class*="pretitle"], [class*="eyebrow"]');
  if (eyebrow) contentCell.push(eyebrow);

  // Note: avoid a broad [class*="title"] fallback here — it also matches the
  // "pretitle"/eyebrow element and would collide with the eyebrow selection.
  const heading = element.querySelector('.cmp-teaser__title, h1, h2, h3');
  if (heading) contentCell.push(heading);

  const description = element.querySelector('.cmp-teaser__description, [class*="description"], p:not([class*="pretitle"])');
  if (description) contentCell.push(description);

  const ctaLinks = Array.from(
    element.querySelectorAll('.cmp-teaser__action-link, .cmp-teaser__action-container a, a.button'),
  );
  contentCell.push(...ctaLinks);

  // Empty-block guard.
  if (!image && !contentCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[image || '', contentCell.length ? contentCell : '']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-featured', cells });
  element.replaceWith(block);
}
