import decorate from '../tabs/tabs.js';

/*
 * tabs-minimal-light — light-scheme 3-tab panel with inline images.
 * Adds the base `tabs` class so shared decorate + CSS apply.
 */
export default async function decorateTabsMinimalLight(block) {
  block.classList.add('tabs');
  await decorate(block);
}
