import decorate from '../carousel/carousel.js';

/*
 * carousel-hero — WKND hero carousel variant.
 * Adds the base `carousel` class so the shared decorate logic and CSS apply,
 * then delegates to the base carousel decorator.
 */
export default async function decorateCarouselHero(block) {
  block.classList.add('carousel');
  await decorate(block);
}
