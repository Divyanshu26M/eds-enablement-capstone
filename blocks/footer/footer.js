/**
 * Fetch the footer fragment. Metadata-independent dual-fetch:
 *  1. /content/footer.plain.html  (localhost / aem up)
 *  2. /footer.plain.html          (DA/EDS production — fragment at site root)
 */
async function fetchFooter() {
  let resp = await fetch('/content/footer.plain.html');
  let prefix = '/content/';
  if (!resp.ok) {
    resp = await fetch('/footer.plain.html');
    prefix = '/';
  }
  if (!resp.ok) return null;
  const html = await resp.text();
  const container = document.createElement('div');
  container.innerHTML = html;
  // Resolve relative image paths against the fragment root (nested pages).
  container.querySelectorAll('img[src^="images/"]').forEach((img) => {
    img.src = `${prefix}${img.getAttribute('src')}`;
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

  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Map the three fragment sections: brand, social, legal
  const classes = ['brand', 'social', 'legal'];
  classes.forEach((c, i) => {
    const section = footer.children[i];
    if (section) section.classList.add(`footer-${c}`);
  });

  // Tag the social icon links so CSS can style the icon buttons
  const social = footer.querySelector('.footer-social');
  if (social) {
    social.querySelectorAll('a').forEach((a) => {
      if (a.querySelector('img')) a.classList.add('social-icon');
    });
  }

  block.append(footer);
}
