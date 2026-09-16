import decorate from '../hero/hero.js';

/*
 * hero-feature — WKND full-width feature band with overlay content.
 * Adds the base `hero` class so shared decorate + CSS apply.
 */
export default function decorateHeroFeature(block) {
  block.classList.add('hero');
  if (decorate) decorate(block);
}
