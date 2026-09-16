/*
 * Breadcrumbs Block
 * Renders a breadcrumb trail from an authored list of links.
 * Content model: a single cell containing a <ul>/<ol> (or paragraphs) of links,
 * ordered from the top-level ancestor to the current page.
 */

export default function decorate(block) {
  const nav = document.createElement('nav');
  nav.className = 'breadcrumbs-nav';
  nav.setAttribute('aria-label', 'Breadcrumb');

  const crumbs = [...block.querySelectorAll('a')];
  const list = document.createElement('ol');
  list.className = 'breadcrumbs-list';

  // Collect any plain-text trailing crumb (current page, not a link)
  const textNodes = [...block.querySelectorAll('p, li')]
    .filter((el) => !el.querySelector('a') && el.textContent.trim());

  const items = crumbs.length ? crumbs : [];
  items.forEach((a) => {
    const li = document.createElement('li');
    li.className = 'breadcrumbs-item';
    a.classList.remove('button');
    li.append(a);
    list.append(li);
  });

  // current page (last non-link text) rendered as a plain span
  const last = textNodes[textNodes.length - 1];
  if (last) {
    const li = document.createElement('li');
    li.className = 'breadcrumbs-item breadcrumbs-current';
    li.setAttribute('aria-current', 'page');
    li.textContent = last.textContent.trim();
    list.append(li);
  }

  nav.append(list);
  block.textContent = '';
  block.append(nav);
}
