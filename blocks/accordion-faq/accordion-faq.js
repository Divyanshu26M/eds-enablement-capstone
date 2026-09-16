import decorate from '../accordion/accordion.js';

/*
 * accordion-faq — WKND FAQ accordion variant.
 * Adds the base `accordion` class so shared decorate + CSS apply.
 */
export default function decorateAccordionFaq(block) {
  block.classList.add('accordion');
  decorate(block);
}
