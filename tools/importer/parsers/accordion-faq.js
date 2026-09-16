/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the accordion-faq block (WKND FAQ Q&A accordion).
 * Convention: 2 columns, one row per item — title cell + content cell.
 */
export default function parse(element, { document }) {
  const items = [...element.querySelectorAll('.cmp-accordion__item')];
  if (!items.length) return;

  const cells = [];
  items.forEach((item) => {
    const title = item.querySelector('.cmp-accordion__title, .cmp-accordion__button, button');
    const panel = item.querySelector('.cmp-accordion__panel, .cmp-accordion__content');
    const label = document.createElement('div');
    label.textContent = title ? title.textContent.trim() : '';
    const body = document.createElement('div');
    if (panel) {
      [...panel.childNodes].forEach((n) => body.append(n.cloneNode(true)));
    }
    cells.push([label, body]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  element.replaceWith(block);
}
