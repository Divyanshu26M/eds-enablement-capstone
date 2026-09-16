/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the cards-related block (WKND "Share This Story" related list).
 * Follows the "Cards (no images)" convention: 1 column, one row per card,
 * each cell holding the linked title (heading) and the date (description).
 */
export default function parse(element, { document }) {
  const items = [...element.querySelectorAll('.cmp-list__item')];
  if (!items.length) return;

  const cells = [];
  items.forEach((item) => {
    const link = item.querySelector('a');
    const title = item.querySelector('.cmp-list__item-title');
    const date = item.querySelector('.cmp-list__item-date');
    const cell = document.createElement('div');
    if (link && title) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.textContent = title.textContent.trim();
      cell.append(a);
    }
    if (date) {
      const p = document.createElement('p');
      p.textContent = date.textContent.trim();
      cell.append(p);
    }
    cells.push([cell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-related', cells });
  element.replaceWith(block);
}
