/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-articles. Base: cards.
 * Source: WKND homepage (.image-list.list / .cmp-image-list)
 * Generated: 2026-09-16
 *
 * Library structure (cards): 2 columns, multiple rows.
 *  - Row 1: block name (handled by createBlock)
 *  - Each subsequent row = one card: cell 1 = image, cell 2 = title + description (+ CTA)
 */
export default function parse(element, { document }) {
  let cards = Array.from(element.querySelectorAll('.cmp-image-list__item'));
  if (!cards.length) {
    cards = Array.from(element.querySelectorAll('li, .card, [class*="item"]'));
  }

  const cells = [];

  cards.forEach((card) => {
    // Image (mandatory) — first cell.
    const image = card.querySelector('.cmp-image-list__item-image img, .cmp-image img, img');

    // Text content (mandatory) — second cell: title + description (+ CTA).
    const contentCell = [];

    // Title text (span) — promote to a heading; preserve its link if present.
    const titleLink = card.querySelector('.cmp-image-list__item-title-link');
    const titleText = card.querySelector('.cmp-image-list__item-title');
    if (titleText) {
      const heading = document.createElement('h3');
      if (titleLink) {
        const a = document.createElement('a');
        a.href = titleLink.getAttribute('href') || '';
        a.textContent = titleText.textContent.trim();
        heading.append(a);
      } else {
        heading.textContent = titleText.textContent.trim();
      }
      contentCell.push(heading);
    }

    const description = card.querySelector('.cmp-image-list__item-description, [class*="description"], p');
    if (description) contentCell.push(description);

    if (image || contentCell.length) {
      cells.push([image || '', contentCell.length ? contentCell : '']);
    }
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-articles', cells });
  element.replaceWith(block);
}
