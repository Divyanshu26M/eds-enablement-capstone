import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
} from './aem.js';

if (window.trustedTypes && window.trustedTypes.createPolicy) {
  const innerTT = window.trustedTypes.createPolicy('tt-inner', {
    createHTML: (s) => s, // avoid stack overflow
  });

  window.trustedTypes.createPolicy('default', {
    createHTML: (input, type, sink) => {
      let processedInput = input;
      if (/srcdoc\s*=/i.test(processedInput)) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('iframe[srcdoc]').forEach((el) => el.removeAttribute('srcdoc'));
        processedInput = doc.body.innerHTML;
      }
      if (sink.includes('createContextualFragment') || sink.includes('Document write')) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('script').forEach((el) => el.remove());
        processedInput = doc.body.innerHTML;
      }
      return processedInput;
    },
    createScriptURL: (input) => input,
    createScript: (input) => input,
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p
      && p.querySelectorAll('a').length === 1
      && p.querySelector('a') === link
      && p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildWidgetAutoBlocks(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // Any paragraph that is a single, solo call-to-action link becomes a
    // button (matches standard EDS + WKND, whose CTAs are plain <a> with no
    // strong/em). Authored formatting still selects the variant:
    //   strong+em → accent, strong → primary, em → secondary,
    //   plain link → primary (WKND yellow), the site default.
    const strong = a.closest('strong');
    const em = a.closest('em');

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else if (em) {
      a.classList.add('secondary');
      em.replaceWith(a);
    } else {
      a.classList.add('primary');
    }
  });
}

/**
 * Applies section-metadata blocks as classes/styles on their section, then
 * removes the block so it does not render as visible content. Mirrors the
 * standard EDS behaviour that this vendored aem.js omits.
 * @param {Element} main The main container element
 */
function decorateSectionMetadata(main) {
  main.querySelectorAll(':scope > div > .section-metadata').forEach((meta) => {
    const section = meta.parentElement;
    [...meta.children].forEach((row) => {
      const cols = [...row.children];
      if (cols.length < 2) return;
      const key = cols[0].textContent.trim().toLowerCase();
      const value = cols[1].textContent.trim();
      if (key === 'style') {
        value.split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => {
          section.classList.add(s.replace(/\s+/g, '-').toLowerCase());
        });
      } else {
        section.dataset[key] = value;
      }
    });
    meta.remove();
  });
}

/**
 * Fixes heading-order accessibility issues by demoting headings that skip a
 * level (e.g. an h1 followed directly by an h4). Imported content and some
 * blocks author headings by visual size rather than document outline, which
 * fails the axe `heading-order` rule. We rewrite the tag to the correct level
 * and carry the original size across with a `heading-size-hN` class so the
 * change is purely semantic and invisible to users.
 * @param {Element} main The main container element
 */
function fixHeadingOrder(main) {
  // Empty headings (common in imported content) are ignored by assistive tech
  // when computing outline order and fail the `empty-heading` rule — drop them.
  main.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
    if (!h.textContent.trim() && !h.querySelector('img, picture, svg')) h.remove();
  });
  const headings = [...main.querySelectorAll('h1, h2, h3, h4, h5, h6')];
  let prevLevel = 0;
  headings.forEach((h) => {
    const level = Number(h.tagName[1]);
    // the deepest level allowed here is one below the previous heading
    const maxLevel = prevLevel === 0 ? 1 : prevLevel + 1;
    const target = level > maxLevel ? maxLevel : level;
    if (target !== level) {
      const replacement = document.createElement(`h${target}`);
      [...h.attributes].forEach((attr) => replacement.setAttribute(attr.name, attr.value));
      replacement.classList.add(`heading-size-h${level}`);
      replacement.append(...h.childNodes);
      h.replaceWith(replacement);
      prevLevel = target;
    } else {
      prevLevel = level;
    }
  });
}

/**
 * Gives content images meaningful alt text when the source left it empty.
 * Much of the imported WKND content carries `alt=""` on inline article/adventure
 * photos (the source authored them that way) and the AEM image filenames are
 * generic (`image.coreimg.jpeg`), so the only meaningful signal is page context.
 * We derive alt from the image's nearest preceding heading, falling back to the
 * page title — so a photo under "Ski Touring" becomes alt="Ski Touring". Images
 * that already have non-empty alt, and icons/SVGs, are left untouched.
 * @param {Element} main The main container element
 */
function improveImageAltText(main) {
  const pageTitle = (document.querySelector('meta[property="og:title"]')?.content
    || document.title || '').trim();
  main.querySelectorAll('img').forEach((img) => {
    const alt = (img.getAttribute('alt') || '').trim();
    if (alt) return; // author-provided alt wins
    // find the nearest heading that appears before this image in document order
    const headings = [...main.querySelectorAll('h1, h2, h3, h4, h5, h6')];
    let label = '';
    for (let i = headings.length - 1; i >= 0; i -= 1) {
      const h = headings[i];
      // eslint-disable-next-line no-bitwise
      if (h.compareDocumentPosition(img) & Node.DOCUMENT_POSITION_FOLLOWING) {
        label = h.textContent.trim();
        break;
      }
    }
    if (!label) label = pageTitle;
    if (label) img.setAttribute('alt', label);
  });
}

/**
 * Turns social links (author bios, contributor cards) into icon buttons.
 * The source authors these as text links — "Facebook", "Twitter Social Media",
 * href="#facebook-…" — so on their own they render as plain links (or, after
 * decorateButtons, as yellow buttons). WKND shows them as small monochrome
 * social glyphs. We detect the platform from the href or text, swap the label
 * for the matching /icons/social-*.svg, and tag the link so decorateButtons
 * leaves it alone. Any paragraph that ends up holding only social icons is
 * marked `.social-links` for horizontal layout.
 * @param {Element} main The main container element
 */
const SOCIAL_PLATFORMS = ['facebook', 'twitter', 'instagram'];
function decorateSocialLinks(main) {
  main.querySelectorAll('a[href]').forEach((a) => {
    const haystack = `${a.getAttribute('href')} ${a.textContent}`.toLowerCase();
    const platform = SOCIAL_PLATFORMS.find((p) => haystack.includes(p));
    // only convert when it's clearly just a social link (short label, no image)
    if (!platform || a.querySelector('img')) return;
    if (a.textContent.trim().length > 24) return;
    const label = platform.charAt(0).toUpperCase() + platform.slice(1);
    a.textContent = '';
    a.setAttribute('aria-label', label);
    a.classList.add('social-icon');
    a.dataset.socialIcon = platform;
    const img = document.createElement('img');
    img.src = `${window.hlx.codeBasePath}/icons/social-${platform}.svg`;
    img.alt = label;
    img.width = 24;
    img.height = 24;
    img.loading = 'lazy';
    a.append(img);
    const p = a.closest('p');
    if (p) p.classList.add('social-links');
  });

  // The source sometimes puts each social link in its own <p> (article author
  // bios). Merge runs of adjacent social-link paragraphs into one so the icons
  // sit on a single row.
  main.querySelectorAll('p.social-links').forEach((p) => {
    let next = p.nextElementSibling;
    while (next && next.tagName === 'P' && next.classList.contains('social-links')) {
      const following = next.nextElementSibling;
      while (next.firstChild) p.append(next.firstChild);
      next.remove();
      next = following;
    }
  });
}

/**
 * Tidies the article-detail header. The imported source emits, right after the
 * H1 title: a "By <author>" heading and then a second heading that repeats the
 * title verbatim. WKND shows the title once with a small byline. We detect the
 * "By …" byline, tag it for small styling, and drop the duplicate title that
 * immediately follows it.
 * @param {Element} main The main container element
 */
function decorateArticleHeader(main) {
  const h1 = main.querySelector('.default-content-wrapper h1');
  if (!h1) return;
  const byline = h1.nextElementSibling;
  if (!byline || !/^by\s+/i.test(byline.textContent.trim())) return;
  byline.classList.add('article-byline');
  const dup = byline.nextElementSibling;
  if (dup && /^h[1-6]$/i.test(dup.tagName)
      && dup.textContent.trim() === h1.textContent.trim()) {
    dup.remove();
  }
}

/**
 * FAQ page: place the accordion and the "Need more help?" block side by side on
 * desktop (accordion left, help rail right), matching WKND. The section holds an
 * `.accordion-faq-wrapper` followed by a default-content wrapper whose heading is
 * "Need more help?"; we wrap that pair in a `.faq-columns` grid. Idempotent and a
 * no-op on pages without that structure.
 * @param {Element} main The main container element
 */
function decorateFaqLayout(main) {
  const accWrapper = main.querySelector('.accordion-faq-wrapper');
  if (!accWrapper || accWrapper.closest('.faq-columns')) return;
  const helper = accWrapper.nextElementSibling;
  if (!helper) return;
  const heading = helper.querySelector('h1, h2, h3, h4, h5, h6');
  if (!heading || !/need more help/i.test(heading.textContent)) return;
  const grid = document.createElement('div');
  grid.className = 'faq-columns';
  accWrapper.replaceWith(grid);
  grid.append(accWrapper, helper);
}

/**
 * Article author bio: the source emits, at the foot of the article, a lone
 * author photo (a <p> whose only child is a picture) followed by the author
 * name heading, role, and social icons. Rendered as-is the photo is a huge
 * full-width image. WKND shows a compact avatar beside the name/role/socials.
 * Wrap the photo + following author block into `.author-bio` (styled: small
 * round avatar left, text right) so it reads like WKND's byline card.
 * @param {Element} main The main container element
 */
function decorateAuthorBio(main) {
  main.querySelectorAll('.default-content-wrapper').forEach((wrapper) => {
    const pics = [...wrapper.children].filter((el) => el.tagName === 'P'
      && el.children.length === 1 && el.querySelector(':scope > picture'));
    pics.forEach((photoP) => {
      const heading = photoP.nextElementSibling;
      // author block = photo immediately followed by a heading whose next
      // siblings include a social-links row (marks it as an author card).
      if (!heading || !/^h[1-6]$/i.test(heading.tagName)) return;
      let scan = heading.nextElementSibling;
      let hasSocial = false;
      const members = [heading];
      while (scan && scan.tagName !== 'HR' && !/^h[1-2]$/i.test(scan.tagName)) {
        if (scan.classList.contains('social-links')) hasSocial = true;
        members.push(scan);
        scan = scan.nextElementSibling;
      }
      if (!hasSocial) return;
      const bio = document.createElement('div');
      bio.className = 'author-bio';
      const textCol = document.createElement('div');
      textCol.className = 'author-bio-text';
      photoP.classList.add('author-bio-photo');
      photoP.replaceWith(bio);
      bio.append(photoP, textCol);
      members.forEach((m) => textCol.append(m));
    });
  });
}

/**
 * Two-column body+rail layout for the article ("Share this story" related rail)
 * and adventure detail ("Share this adventure" metadata rail). The rail lives in
 * its own <section>, following the section that holds the main body. We build a
 * `.content-columns` grid that spans BOTH: the main body section's content on
 * the left, the rail section's content on the right. Runs after decorateSections
 * (so `.section` wrappers exist); idempotent and a no-op when the rail is absent.
 * @param {Element} main The main container element
 */
function decorateSidebarLayout(main) {
  const RAIL_RE = /^(share this story|share this adventure)$/i;
  const railSection = [...main.querySelectorAll(':scope > .section')].find((sec) => {
    if (sec.querySelector('.content-columns')) return false;
    const h = sec.querySelector('h1, h2, h3, h4, h5, h6');
    return h && RAIL_RE.test(h.textContent.trim());
  });
  if (!railSection) return;
  const bodySection = railSection.previousElementSibling;
  if (!bodySection || !bodySection.classList.contains('section')) return;

  const grid = document.createElement('div');
  grid.className = 'content-columns';
  const mainCol = document.createElement('div');
  mainCol.className = 'content-columns-main';
  const railCol = document.createElement('div');
  railCol.className = 'content-columns-rail';
  while (bodySection.firstElementChild) mainCol.append(bodySection.firstElementChild);
  while (railSection.firstElementChild) railCol.append(railSection.firstElementChild);
  grid.append(mainCol, railCol);
  bodySection.append(grid);
  railSection.remove();
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSectionMetadata(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateSocialLinks(main);
  decorateButtons(main);
  decorateArticleHeader(main);
  decorateAuthorBio(main);
  decorateFaqLayout(main);
  decorateSidebarLayout(main);
  fixHeadingOrder(main);
  improveImageAltText(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    // Hint the browser to fetch the likely LCP image (first image of the first
    // section) at high priority. aem.js already flips it to loading=eager in
    // waitForFirstImage; adding fetchpriority pulls its request forward, which
    // helps mobile LCP on plain-image hero pages (article/adventure detail).
    const firstSection = main.querySelector('.section');
    const lcpImg = firstSection && firstSection.querySelector('img');
    if (lcpImg && !lcpImg.getAttribute('fetchpriority')) {
      lcpImg.setAttribute('fetchpriority', 'high');
    }
    await loadSection(firstSection, waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('body > header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('body > footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  import('./consent-check.js');
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
