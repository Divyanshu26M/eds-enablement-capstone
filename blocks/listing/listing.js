import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * Listing Block — dynamic, query-index driven.
 *
 * Reads its configuration from the authored block cells (key/value rows),
 * then fetches the site query-index and renders matching entries as cards.
 *
 * Supported config keys (first cell = key, second cell = value):
 *   source     - query-index path (default: /query-index.json)
 *   template   - filter by template (e.g. article-detail, adventure-detail)
 *   category   - filter by a single category value
 *   limit      - max number of cards to show
 *   sort       - 'date' (newest first) | 'title'
 *   filters    - 'true' to render category filter tabs (adventures)
 *   cta        - label for a per-card call-to-action link (optional)
 */

function readConfig(block) {
  const config = {};
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase();
      const value = cells[1].textContent.trim();
      if (key) config[key] = value;
    }
  });
  return config;
}

async function fetchIndex(source) {
  try {
    const resp = await fetch(source);
    if (!resp.ok) return [];
    const json = await resp.json();
    return json.data || [];
  } catch (e) {
    return [];
  }
}

function matchItem(item, config) {
  if (config.template && item.template !== config.template) return false;
  if (config.category && (item.category || '').toLowerCase() !== config.category.toLowerCase()) return false;
  return true;
}

/*
 * Resolve a comparable timestamp (ms) for an index row. The EDS indexer emits
 * `lastModified` as an epoch in SECONDS; `date` (when present) is an ISO string.
 * Prefer an explicit `date`, else fall back to `lastModified`. Returns 0 when
 * neither is usable so undated rows sort last.
 */
function itemTime(item) {
  const d = item.date && Date.parse(item.date);
  if (d) return d;
  const lm = Number(item.lastModified);
  return Number.isFinite(lm) && lm > 0 ? lm * 1000 : 0;
}

function sortItems(items, sort) {
  const list = [...items];
  if (sort === 'date') {
    // newest first, by real timestamp (numeric) — not a string compare
    list.sort((a, b) => itemTime(b) - itemTime(a));
  } else if (sort === 'title') {
    list.sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));
  }
  return list;
}

function buildCard(item, cta) {
  const li = document.createElement('li');
  li.className = 'listing-card';

  const link = document.createElement('a');
  link.className = 'listing-card-link';
  link.href = item.path;

  if (item.image) {
    const imgWrap = document.createElement('div');
    imgWrap.className = 'listing-card-image';
    let sameOrigin = false;
    try {
      sameOrigin = new URL(item.image, window.location.href).origin === window.location.origin;
    } catch { /* keep false */ }
    if (sameOrigin) {
      // EDS media on our own origin: use responsive optimized picture
      const pic = createOptimizedPicture(item.image, item.title || '', false, [{ width: '750' }]);
      const pImg = pic.querySelector('img');
      if (pImg) { pImg.width = 750; pImg.height = 500; }
      imgWrap.append(pic);
    } else {
      // external image (e.g. still-remote source media): plain img, no EDS optimize params
      const img = document.createElement('img');
      img.loading = 'lazy';
      // explicit intrinsic dimensions reserve layout space (avoids CLS)
      img.width = 750;
      img.height = 500;
      img.src = item.image;
      img.alt = item.title || '';
      imgWrap.append(img);
    }
    link.append(imgWrap);
  }

  const body = document.createElement('div');
  body.className = 'listing-card-body';
  // h2 keeps the outline valid whether the listing sits under the page h1
  // (magazine/adventures) or an h2 section heading (home); its size is set by
  // the class-scoped CSS rule, so appearance is unchanged.
  const title = document.createElement('h2');
  title.textContent = item.title || '';
  body.append(title);
  if (item.description) {
    const desc = document.createElement('p');
    desc.textContent = item.description;
    body.append(desc);
  }
  if (cta) {
    const ctaEl = document.createElement('span');
    ctaEl.className = 'listing-card-cta';
    ctaEl.textContent = cta;
    body.append(ctaEl);
  }
  link.append(body);
  li.append(link);
  return li;
}

function renderGrid(container, items, config) {
  container.textContent = '';
  const ul = document.createElement('ul');
  ul.className = 'listing-grid';
  const limit = config.limit ? parseInt(config.limit, 10) : items.length;
  items.slice(0, limit).forEach((item) => ul.append(buildCard(item, config.cta)));
  container.append(ul);
}

function buildFilters(items, onSelect) {
  const categories = ['All', ...[...new Set(items.map((i) => i.category).filter(Boolean))].sort()];
  const nav = document.createElement('div');
  nav.className = 'listing-filters';
  categories.forEach((cat, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'listing-filter';
    btn.textContent = cat;
    if (i === 0) btn.setAttribute('aria-pressed', 'true');
    btn.addEventListener('click', () => {
      nav.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      onSelect(cat === 'All' ? null : cat);
    });
    nav.append(btn);
  });
  return nav;
}

export default async function decorate(block) {
  const config = readConfig(block);
  const source = config.source || '/query-index.json';
  const all = await fetchIndex(source);
  const items = sortItems(all.filter((i) => matchItem(i, config)), config.sort);

  block.textContent = '';

  const grid = document.createElement('div');
  grid.className = 'listing-results';

  if (config.filters === 'true') {
    const filters = buildFilters(items, (category) => {
      const filtered = category ? items.filter((i) => i.category === category) : items;
      renderGrid(grid, filtered, config);
    });
    block.append(filters);
  }

  block.append(grid);
  renderGrid(grid, items, config);
}
