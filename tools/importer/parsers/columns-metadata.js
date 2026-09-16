/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the columns-metadata block (WKND adventure metadata sidebar).
 * Columns convention: multiple rows, 2 cells each — label column + value column.
 */
export default function parse(element, { document }) {
  const rows = [...element.querySelectorAll('.cmp-contentfragment__element')];
  if (!rows.length) return;

  const cells = [];
  rows.forEach((row) => {
    const label = row.querySelector('.cmp-contentfragment__element-title');
    const value = row.querySelector('.cmp-contentfragment__element-value');
    const labelCell = document.createElement('div');
    labelCell.textContent = label ? label.textContent.trim() : '';
    const valueCell = document.createElement('div');
    valueCell.textContent = value ? value.textContent.trim() : '';
    cells.push([labelCell, valueCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-metadata', cells });
  element.replaceWith(block);
}
