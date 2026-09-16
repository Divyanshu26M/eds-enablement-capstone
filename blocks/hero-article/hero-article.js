/*
 * hero-article — full-bleed article hero image (no text overlay).
 * Content model: a single cell containing the hero image.
 */
export default function decorate(block) {
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    if (cell.querySelector('picture, img')) cell.classList.add('hero-article-image');
  });
}
