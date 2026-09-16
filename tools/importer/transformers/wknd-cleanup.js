/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND site-wide cleanup (AEM Sites / Core Components source).
 *
 * Removes non-authorable site shell + AEM Grid scaffolding so blocks and default
 * content extract cleanly. Every selector below was verified by reading
 * migration-work/cleaned.html (line references in comments) — none are guessed.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Non-authorable chrome that would otherwise confuse block matching.
    // Verified in cleaned.html:
    //   header.cmp-experiencefragment--header  (line 5)  — global header XF (logo, nav, search, language nav, sign-in)
    //   footer.cmp-experiencefragment--footer  (line 471) — global footer XF
    //   #destination_publishing_iframe...      (line 566) — demdex Adobe ID-syncing iframe
    //   #toggleNav / #mobileNav                (lines 568, 574) — mobile nav toggle + drawer
    WebImporter.DOMUtils.remove(element, [
      'header.cmp-experiencefragment--header',
      'footer.cmp-experiencefragment--footer',
      '#toggleNav',
      '#mobileNav',
    ]);

    // AEM cmp-separator layout dividers between content blocks. Verified in
    // cleaned.html at the grid-column wrapper class ".separator" (lines 351, 460,
    // 542) — NOT bare <hr>. These are non-authorable scaffolding; removing the
    // wrapper also drops the inner hr.cmp-separator__horizontal-rule so it cannot
    // inflate the section-break <hr> count that the section transformer manages.
    WebImporter.DOMUtils.remove(element, ['.separator']);
  }

  if (hookName === TransformHook.afterTransform) {
    // Leftover non-authorable / non-content elements verified in cleaned.html:
    //   <iframe> demdex ID sync (line 566), stray <meta> inside cmp-image (lines 183, 204, 227, 271, 334),
    //   plus generic non-authorable tags that should never reach the import.
    WebImporter.DOMUtils.remove(element, [
      'iframe',
      'meta',
      'noscript',
      'link',
      'style',
      'script',
    ]);

    // Strip AEM data-layer / accessibility / tracking attributes left on the DOM.
    // Verified on <body> (line 1: data-cmp-* attributes) and cmp components throughout.
    element.querySelectorAll('*').forEach((el) => {
      el.removeAttribute('data-cmp-data-layer');
      el.removeAttribute('data-cmp-hook-image');
      el.removeAttribute('data-cmp-hook-teaser');
      el.removeAttribute('data-cmp-hook-carousel');
      el.removeAttribute('data-cmp-hook-navigation');
      el.removeAttribute('data-cmp-is');
      el.removeAttribute('data-cmp-src');
      el.removeAttribute('data-cmp-autopause-disabled');
      el.removeAttribute('data-cmp-delay');
      el.removeAttribute('data-panel-container-id');
      el.removeAttribute('data-cmp-link-accessibility-enabled');
      el.removeAttribute('data-cmp-link-accessibility-text');
      el.removeAttribute('data-cmp-data-layer-enabled');
      el.removeAttribute('data-cmp-data-layer-name');
    });
  }
}
