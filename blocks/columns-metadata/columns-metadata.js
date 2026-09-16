/*
 * columns-metadata — adventure metadata sidebar (label / value rows).
 * Content model: one row per attribute; cell 1 = label, cell 2 = value.
 */
export default function decorate(block) {
  const dl = document.createElement('dl');
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const dt = document.createElement('dt');
    dt.className = 'columns-metadata-label';
    if (cells[0]) dt.append(...cells[0].childNodes);
    const dd = document.createElement('dd');
    dd.className = 'columns-metadata-value';
    if (cells[1]) dd.append(...cells[1].childNodes);
    dl.append(dt, dd);
  });
  block.textContent = '';
  block.append(dl);
}
