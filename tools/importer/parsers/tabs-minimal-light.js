/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the tabs-minimal-light block (WKND adventure Overview/Itinerary/What to Bring).
 * Tabs convention: 2 columns, one row per tab — tab label cell + tab content cell.
 */
export default function parse(element, { document }) {
  const tabLabels = [...element.querySelectorAll('.cmp-tabs__tab')];
  const panels = [...element.querySelectorAll('.cmp-tabs__tabpanel')];
  if (!tabLabels.length || !panels.length) return;

  const cells = [];
  tabLabels.forEach((tab, i) => {
    const label = document.createElement('div');
    label.textContent = tab.textContent.trim();
    const body = document.createElement('div');
    const panel = panels[i];
    if (panel) {
      [...panel.childNodes].forEach((n) => body.append(n.cloneNode(true)));
    }
    cells.push([label, body]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-minimal-light', cells });
  element.replaceWith(block);
}
