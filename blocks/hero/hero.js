/*
 * Hero Block
 * Full-width image band with an overlaid content card (heading, text, CTA).
 * Accepts either a single 2-cell row (image | content) or two 1-cell rows
 * (image row, content row) as produced by the WKND hero-feature parser.
 */

export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  cells.forEach((cell) => {
    const hasMedia = cell.querySelector('picture, img');
    const hasText = cell.textContent.trim().length > 0;
    if (hasMedia && !hasText) {
      cell.classList.add('hero-image');
    } else if (hasText) {
      cell.classList.add('hero-content');
    }
  });
}
