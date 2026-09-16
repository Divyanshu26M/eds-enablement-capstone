import decorate from '../cards/cards.js';

/*
 * cards-articles — WKND 4-across article/adventure card grid.
 * Adds the base `cards` class so shared decorate + CSS apply.
 */
export default function decorateCardsArticles(block) {
  block.classList.add('cards');
  decorate(block);
}
