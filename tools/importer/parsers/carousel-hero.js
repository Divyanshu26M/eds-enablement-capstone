/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-hero. Base: carousel.
 * Source: WKND homepage (.carousel.cmp-carousel--hero)
 * Generated: 2026-09-16
 *
 * Library structure (carousel): 2 columns, multiple rows.
 *  - Row 1: block name (handled by createBlock)
 *  - Each subsequent row = one slide: cell 1 = image (only), cell 2 = text content (title/description/CTA)
 */
export default function parse(element, { document }) {
  // Each slide is a carousel item; fall back to teasers if item wrappers are absent.
  let slides = Array.from(element.querySelectorAll('.cmp-carousel__item'));
  if (!slides.length) {
    slides = Array.from(element.querySelectorAll('.cmp-teaser--hero, .teaser'));
  }

  const cells = [];

  slides.forEach((slide) => {
    // Image (mandatory) — first cell.
    const image = slide.querySelector('.cmp-teaser__image img, .cmp-image img, img');

    // Text content (optional) — second cell.
    const contentCell = [];
    const heading = slide.querySelector('.cmp-teaser__title, h1, h2, h3, [class*="title"]');
    if (heading) contentCell.push(heading);

    const description = slide.querySelector('.cmp-teaser__description, [class*="description"], p');
    if (description) contentCell.push(description);

    const ctaLinks = Array.from(
      slide.querySelectorAll('.cmp-teaser__action-link, .cmp-teaser__action-container a, a.button'),
    );
    contentCell.push(...ctaLinks);

    // Only add a slide row if it has real content.
    if (image || contentCell.length) {
      cells.push([image || '', contentCell.length ? contentCell : '']);
    }
  });

  // Empty-block guard: nothing extracted.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-hero', cells });
  element.replaceWith(block);
}
