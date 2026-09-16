# WKND Site Migration to Edge Delivery Services — Plan

## Objective
Migrate `wknd.site/us/en.html` and its key pages into the `divyanshu26m/eds-enablement-capstone` EDS site, using **Document Authoring (da.live)** as the content source. Target a responsive, high-fidelity (~85%+) reproduction across mobile, tablet, and desktop, with dynamic (query-index-driven) listings for the Home, Magazine, and Adventures pages, and dynamically rendered articles.

## Target / Environment
- **Org / Site:** `divyanshu26m` / `eds-enablement-capstone`
- **Content source:** `https://content.da.live/divyanshu26m/eds-enablement-capstone/`
- **Preview:** `https://main--eds-enablement-capstone--divyanshu26m.aem.page/`
- **Live:** `https://main--eds-enablement-capstone--divyanshu26m.aem.live/`
- **Source site:** `https://wknd.site/us/en.html` (Home, Magazine listing, Article detail, Adventures listing, Adventure detail, plus About/other content pages)

## Scope
**In scope:** Site Scope report; global design → `styles/styles.css`; header/nav/footer; representative page per template + bulk import; magazine listing + article detail; dynamic listings via query index; block & page critique; DA sync + GitHub PRs.
**Out of scope:** Commerce/search, MarTech/targeting, sign-in, custom business logic, strict pixel perfection beyond practical fidelity.

## Working Principles
- Judge results on the **preview URL**, never the DA editor (blocks render as tables there).
- Keep durable changes in **parsers/CSS** — re-imports overwrite one-off doc edits.
- Localize images to `assets/` so they serve as optimized `media_` hashes.
- All work via **feature branches + PRs** — no direct commits to `main`. Every PR includes a preview link.
- `scripts/aem.js` is vendored — never edit. Scope block CSS to `.blockname`.
- Use Plan mode for complex steps; Execute once the plan is approved.

---

## Checklist

### Phase 0 — Setup & Discovery
- [ ] Confirm optional plugins (see Open Questions) and enable via `.agents/settings.json` if requested
- [ ] Verify repo/DA/GitHub credentials are wired (test `aem up` local preview renders boilerplate)
- [ ] Discover WKND URLs via sitemap/crawl (`excat-url-discovery`)

### Phase 1 — Site Scope Report
- [ ] Run `excat-site-scope` / `excat-site-catalog` on `wknd.site/us/en.html`
- [ ] Produce **Site Scope report**: templates, block variants, and full page inventory grouped by template
- [ ] Identify template set (Home, Magazine/Article listing, Article detail, Adventures listing, Adventure detail, generic content page)

### Phase 2 — Global Design Migration
- [ ] Extract design tokens (colours, typography, spacing, backgrounds) with `excat-complete-design-expert`
- [ ] Migrate global design into `styles/styles.css` (+ `fonts.css`, `lazy-styles.css`); localize fonts to `fonts/`
- [ ] Verify base typography/colors on preview across breakpoints

### Phase 3 — Header, Navigation & Footer
- [ ] Migrate header + navigation via `excat-navigation-orchestrator` (desktop, mobile, megamenu)
- [ ] Migrate footer via `excat-footer-orchestrator`
- [ ] Wire `content/nav.plain.html` and `content/footer.plain.html`; verify responsive behavior

### Phase 4 — Representative Page per Template
- [ ] Build import infrastructure (parsers/transformers) via `excat-import-infrastructure` / `import-parser` / `import-transformer`
- [ ] Migrate **one representative page per template** (Home, Magazine listing, Article detail, Adventures listing, Adventure detail, content page)
- [ ] Generate required blocks (`excat-block-generator`) and style them (`excat-block-design-expert`)

### Phase 5 — Dynamic Listings & Articles (Query Index)
- [ ] Create/configure `query-index` to index article + adventure content
- [ ] Implement **dynamic listing** blocks for Home, Magazine, and Adventures pages (replace static listings)
- [ ] Render **articles dynamically** from the query index
- [ ] Verify listings populate and paginate/filter correctly on preview

### Phase 6 — Bulk Import
- [ ] Bulk-import remaining pages per template via `excat-content-import` (`run-bulk-import.js`)
- [ ] Localize all images to `assets/`
- [ ] Run `excat-import-validation` — score content completeness vs source, fix divergences

### Phase 7 — Critique & Visual Gap Closure
- [ ] Run `excat-visual-critique` on key blocks and pages (block-, section-, page-level)
- [ ] Close visual gaps to ~85%+ fidelity across mobile, tablet, desktop
- [ ] Re-verify responsive behavior on preview at all breakpoints

### Phase 8 — Quality Gates
- [ ] `npm run lint` passes (JS + CSS)
- [ ] Mobile Lighthouse: Performance 100 & Accessibility 100; Core Web Vitals in "good"
- [ ] Cross-breakpoint responsive QA

### Phase 9 — Ship & Publish
- [ ] Sync all content to Document Authoring (da.live) and publish
- [ ] Open feature-branch PRs (no direct commits to `main`); each PR includes a `{branch}--{repo}--{owner}.aem.page/{path}` preview link
- [ ] Share live URL + repository for review

---

## Open Questions
Before executing, I'd like to confirm a couple of decisions that affect scope. I'll ask these next if you want to lock them down; otherwise I'll proceed with sensible defaults (migrate the core WKND template set, enable no extra plugins).

## Execution Note
This plan is in **Plan mode**. Actual migration (scraping, file writes, imports, PRs) requires switching to **Execute mode**. Once you approve, I'll begin at Phase 0/1.

Would you like me to lock down a few scope decisions before we start executing?
