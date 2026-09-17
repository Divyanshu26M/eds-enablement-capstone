// media query match that indicates desktop width
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Fetch the nav fragment. On DA/EDS hosts the fragment is served at the site
 * root (`/nav.plain.html`); local `aem up` serves it under `/content/`.
 * Choose the primary path by host so we don't log a 404 for the wrong one,
 * and keep the other as a metadata-independent fallback.
 */
async function fetchNav() {
  const onAemHost = /\.aem\.(page|live)$/.test(window.location.hostname);
  const primary = onAemHost ? '/nav.plain.html' : '/content/nav.plain.html';
  const fallback = onAemHost ? '/content/nav.plain.html' : '/nav.plain.html';
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
  // Resolve relative image paths (images/…) against the fragment root so they
  // work on nested pages, not just the site root.
  container.querySelectorAll('img[src^="images/"]').forEach((img) => {
    img.src = `${prefix}${img.getAttribute('src')}`;
  });
  return container;
}

/**
 * Toggle the mobile menu open/closed.
 */
function toggleMenu(nav, forceExpanded = null) {
  const expanded = forceExpanded !== null
    ? !forceExpanded
    : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (button) {
    button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  }
}

/**
 * Build the search form (form controls are created in JS, not in the fragment).
 */
function buildSearch() {
  const form = document.createElement('form');
  form.className = 'nav-search';
  form.setAttribute('role', 'search');
  form.action = '/us/en/search';
  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = 'Search';
  input.setAttribute('aria-label', 'Search');
  form.append(input);
  return form;
}

/**
 * Turn the first (locale) section into a click-to-open dropdown.
 * The trigger is the first paragraph link; the list is the following <ul>.
 */
function decorateLocale(section) {
  const trigger = section.querySelector('p > a');
  const list = section.querySelector('ul');
  if (!trigger || !list) return;
  const wrapper = trigger.closest('p');
  wrapper.classList.add('nav-locale-trigger');
  list.classList.add('nav-locale-list');
  // aria-expanded belongs on the interactive trigger, not the plain container.
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-haspopup', 'true');
  const setOpen = (open) => {
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    section.dataset.expanded = open ? 'true' : 'false';
  };
  // stop the trigger link from navigating; it only toggles the list
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    setOpen(trigger.getAttribute('aria-expanded') !== 'true');
  });
  setOpen(false);
  // close when clicking outside
  document.addEventListener('click', (e) => {
    if (!section.contains(e.target)) setOpen(false);
  });
}

/**
 * Reset nav state when crossing the desktop/mobile breakpoint.
 */
function handleBreakpointChange(nav) {
  // close the mobile menu and reset hamburger label when moving to desktop
  toggleMenu(nav, isDesktop.matches);
  // close any open locale dropdown
  const locale = nav.querySelector('.nav-utility');
  if (locale) locale.setAttribute('aria-expanded', 'false');
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  block.textContent = '';
  if (!fragment) return;

  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // Map the three fragment sections: utility bar, brand, nav links
  const classes = ['utility', 'brand', 'sections'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // Utility bar: locale dropdown + sign-in
  const navUtility = nav.querySelector('.nav-utility');
  if (navUtility) decorateLocale(navUtility);

  // Brand: strip button styling from the logo link
  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const brandLink = navBrand.querySelector('a');
    if (brandLink && brandLink.classList.contains('button')) {
      brandLink.className = '';
      const bc = brandLink.closest('.button-container');
      if (bc) bc.className = '';
    }
    // Give the logo explicit intrinsic dimensions so the browser reserves
    // layout space (CSS still sizes it to 128px wide). Avoids CLS + a11y flag.
    const brandImg = navBrand.querySelector('img');
    if (brandImg && !brandImg.getAttribute('width')) {
      brandImg.setAttribute('width', '239');
      brandImg.setAttribute('height', '89');
    }
  }

  // Nav links + search live in the main bar
  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    // mark the top-level list + its triggers so the nav is traversable/testable
    const topList = navSections.querySelector(':scope > ul');
    if (topList) {
      topList.classList.add('nav-list');
      // the top-level label ("Home") may be a bare <a> or wrapped in a <p>
      topList.querySelectorAll(':scope > li > a, :scope > li > p > a').forEach((a) => a.classList.add('nav-trigger'));
    }
    navSections.prepend(buildSearch());
  }

  // Hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  // set initial state and handle viewport resize
  toggleMenu(nav, isDesktop.matches);
  isDesktop.addEventListener('change', () => handleBreakpointChange(nav));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
