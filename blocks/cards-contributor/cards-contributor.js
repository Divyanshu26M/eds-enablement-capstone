import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * cards-contributor — people cards (circular photo, name, role, social icons).
 * Content model: one row per person; cell 1 = image, cell 2 = name/role/socials.
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-contributor-card';
    while (row.firstElementChild) {
      const cell = row.firstElementChild;
      // The photo cell is a <picture>; the body cell holds name/role/socials.
      // Match on <picture> only — social links are decorated into bare <img>
      // icons before this block runs, so a plain `img` test would misclassify
      // the body cell as the image cell (and blow the icons up to photo size).
      if (cell.querySelector('picture')) {
        cell.className = 'cards-contributor-image';
      } else {
        cell.className = 'cards-contributor-body';
      }
      li.append(cell);
    }
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ width: '300' }]),
    );
  });
  block.textContent = '';
  block.append(ul);
}
