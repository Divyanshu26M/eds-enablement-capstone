/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the breadcrumbs block (WKND article breadcrumb trail).
 * Emits a single cell containing an ordered list of crumb links plus the
 * current (active) page as plain text.
 */
export default function parse(element, { document }) {
  const items = [...element.querySelectorAll('.cmp-breadcrumb__item')];
  if (!items.length) return;

  const list = document.createElement('ol');
  items.forEach((item) => {
    const li = document.createElement('li');
    const link = item.querySelector('a');
    if (link) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.textContent = link.textContent.trim();
      li.append(a);
    } else {
      li.textContent = item.textContent.trim();
    }
    list.append(li);
  });

  const cells = [[list]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'breadcrumbs', cells });
  element.replaceWith(block);
}
