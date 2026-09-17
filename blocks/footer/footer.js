/**
 * Fetch the footer fragment. On DA/EDS hosts the fragment is served at the
 * site root (`/footer.plain.html`); local `aem up` serves it under `/content/`.
 * Pick the primary path by host to avoid a spurious 404 in the console, with
 * the other as a fallback.
 */
async function fetchFooter() {
  const onAemHost = /\.aem\.(page|live)$/.test(window.location.hostname);
  const primary = onAemHost ? '/footer.plain.html' : '/content/footer.plain.html';
  const fallback = onAemHost ? '/content/footer.plain.html' : '/footer.plain.html';
  let resp = await fetch(primary);
  let prefix = onAemHost ? '/' : '/content/';
  if (!resp.ok) {
    resp = await fetch(fallback);
    prefix = onAemHost ? '/content/' : '/';
  }
  if (!resp.ok) return null;
  const html = await resp.text();
  const container = document.createElement('div');
  container.innerHTML = html;
  // Resolve relative image paths against the fragment root. The footer fragment
  // lives at the site root, but its images are authored relative — either
  // `images/…` (our committed assets) or DA-localized `./media_….svg` hashes.
  // On a nested page (e.g. /us/en/magazine/arctic-surfing) a relative src would
  // resolve against the page path and 404, so rewrite both to the fragment root.
  container.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (/^(https?:)?\/\//.test(src) || src.startsWith('/')) return; // already absolute
    const clean = src.replace(/^\.\//, ''); // drop leading ./
    img.src = `${prefix}${clean}`;
    const source = img.closest('picture')?.querySelector('source[srcset]');
    if (source) {
      const ss = source.getAttribute('srcset');
      if (ss && !/^(https?:)?\/\//.test(ss) && !ss.startsWith('/')) {
        source.setAttribute('srcset', `${prefix}${ss.replace(/^\.\//, '')}`);
      }
    }
  });
  return container;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  block.textContent = '';
  if (!fragment) return;

  // The block element itself carries the `.footer` grid CSS. Append the three
  // fragment sections DIRECTLY to it — an extra inner wrapper <div> made the
  // sections grandchildren of `.footer`, so the grid-template-areas couldn't
  // place them and the footer stacked instead of laying out in a row.
  const footer = block;
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Map the three fragment sections: brand, social, legal
  const classes = ['brand', 'social', 'legal'];
  classes.forEach((c, i) => {
    const section = footer.children[i];
    if (section) section.classList.add(`footer-${c}`);
  });

  // Promote footer section headings to h2 so the document outline never skips
  // a level (the footer follows main content that may end at h2 or h3). Keep the
  // original visual size via a heading-size class so appearance is unchanged.
  footer.querySelectorAll('h3, h4, h5, h6').forEach((h) => {
    const level = h.tagName[1];
    const h2 = document.createElement('h2');
    [...h.attributes].forEach((attr) => h2.setAttribute(attr.name, attr.value));
    h2.classList.add(`heading-size-h${level}`);
    h2.append(...h.childNodes);
    h.replaceWith(h2);
  });

  // Give footer images explicit intrinsic dimensions so the browser reserves
  // layout space (CSS still controls their rendered size). Avoids CLS + a11y flag.
  footer.querySelectorAll('img').forEach((img) => {
    if (img.getAttribute('width')) return;
    const isLogo = /wknd-logo/.test(img.getAttribute('src') || '');
    img.setAttribute('width', isLogo ? '239' : '24');
    img.setAttribute('height', isLogo ? '89' : '24');
  });

  // Tag the social icon links so CSS can style the icon buttons
  const social = footer.querySelector('.footer-social');
  if (social) {
    social.querySelectorAll('a').forEach((a) => {
      if (a.querySelector('img')) a.classList.add('social-icon');
    });
  }
  // sections were appended straight onto `block` (= footer), nothing more to add.
}
