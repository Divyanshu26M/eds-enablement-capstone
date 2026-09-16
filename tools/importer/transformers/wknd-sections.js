/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND section boundaries + section metadata.
 *
 * Driven by payload.template.sections from page-templates.json. Inserts a bare
 * <hr> before every non-first section and a "Section Metadata" block after each
 * section that declares a style (homepage: the "featured-article" section is
 * style=grey).
 *
 * Why both hooks: block parsers run between beforeTransform and afterTransform and
 * call element.replaceWith(block) on the exact element a section selector targets
 * (each WKND section wraps a single block). Breaks are therefore inserted in
 * beforeTransform while all section elements still exist, marking styled sections
 * with a temp attribute; metadata is inserted in afterTransform anchored to that
 * surviving marker. Sections are processed in reverse so live-element inserts never
 * disturb not-yet-processed anchors.
 *
 * Page-DOM-specific selector resolution (verified in migration-work/cleaned.html):
 *   - `.teaser.cmp-teaser--hero` matches the 3 hero-carousel slides (lines
 *     169/190/211, nested in `.cmp-carousel`) AND the standalone Next Adventures
 *     teaser (line 364). Candidates inside `.cmp-carousel` are skipped so the
 *     Next Adventures section resolves to line 364, not a carousel slide.
 *   - `.image-list.list` matches Recent Articles (line 281) and Where do you want
 *     to go (line 391); dedup by already-used element assigns them in doc order.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

// Resolve each section to a distinct element on THIS page. Candidate selectors are
// tried in order; a candidate is accepted only if it is not already claimed by an
// earlier section and is not one of the hero-carousel's nested teaser slides.
function resolveSections(root, sections) {
  const used = new Set();
  const resolved = {};
  for (const section of sections) {
    let match = null;
    for (const sel of section.selector || []) {
      const candidates = root.querySelectorAll(sel);
      for (const candidate of candidates) {
        if (used.has(candidate)) continue;
        // Exclude hero-carousel slide teasers (they live inside `.cmp-carousel`).
        // The hero-carousel anchor itself (`.carousel.cmp-carousel--hero`) is the
        // carousel's parent, so `.closest('.cmp-carousel')` is null for it.
        if (candidate.closest('.cmp-carousel')) continue;
        match = candidate;
        break;
      }
      if (match) break;
    }
    if (match) {
      used.add(match);
      resolved[section.id] = match;
    }
  }
  return resolved;
}

export default function transform(hookName, element, payload) {
  const sections = (payload.template && payload.template.sections) || [];
  if (sections.length < 2) return;

  if (hookName === 'beforeTransform') {
    const resolved = resolveSections(element, sections);
    // Insert breaks now, before parsers can replace any section element. Reverse
    // order keeps earlier anchors in place while we work.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const sectionEl = resolved[section.id];
      if (!sectionEl) continue; // no selector matched on this page — skip, never guess
      if (i === 0 && !section.style) continue; // first section: no leading break needed

      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      sectionEl.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    // Parsers may have replaced styled section elements. Anchor each Section
    // Metadata block to whichever survives: the marker <hr>, or (first section,
    // no marker inserted) the re-resolved original element.
    const resolved = resolveSections(element, sections);
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || resolved[section.id];
      if (!anchor) continue; // neither survived — skip, never guess

      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(metadataBlock);

      if (marker) {
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (i === 0) marker.remove(); // section 0 never gets a real leading break
      }
    }
  }
}
