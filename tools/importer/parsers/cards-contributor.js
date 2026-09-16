/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the cards-contributor block (WKND people cards grid).
 * Follows the Cards convention: 2 columns, one row per card.
 * The block instance is the grid container; each
 * .cmp-experience-fragment--contributor tile becomes one card row:
 * cell 1 = avatar image, cell 2 = name (heading) + role + social links.
 */
export default function parse(element, { document }) {
  const tiles = [...element.querySelectorAll('.cmp-experience-fragment--contributor')];
  if (!tiles.length) return;

  const cells = [];
  tiles.forEach((tile) => {
    const img = tile.querySelector('img');
    const titles = [...tile.querySelectorAll('.cmp-title__text, h2, h3, h4, h5')];
    const name = titles[0];
    const role = titles[1];
    const socials = [...tile.querySelectorAll('a[href*="facebook" i], a[href*="twitter" i], a[href*="instagram" i]')];

    const imageCell = document.createElement('div');
    if (img) {
      const picture = document.createElement('picture');
      const newImg = document.createElement('img');
      newImg.src = img.getAttribute('src');
      newImg.alt = img.getAttribute('alt') || (name ? name.textContent.trim() : '');
      picture.append(newImg);
      imageCell.append(picture);
    }

    const bodyCell = document.createElement('div');
    if (name) {
      const h3 = document.createElement('h3');
      h3.textContent = name.textContent.trim();
      bodyCell.append(h3);
    }
    if (role) {
      const h5 = document.createElement('h5');
      h5.textContent = role.textContent.trim();
      bodyCell.append(h5);
    }
    if (socials.length) {
      const p = document.createElement('p');
      socials.forEach((s, idx) => {
        const a = document.createElement('a');
        a.href = s.getAttribute('href');
        a.textContent = (s.getAttribute('aria-label') || s.textContent || '').trim() || 'Social';
        p.append(a);
        if (idx < socials.length - 1) p.append(document.createTextNode(' '));
      });
      bodyCell.append(p);
    }

    cells.push([imageCell, bodyCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-contributor', cells });
  element.replaceWith(block);
}
