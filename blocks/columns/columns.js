export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
        // Reserve layout space: give the img explicit dimensions if it lacks
        // them, deriving the ratio from the source URL's width/height params
        // when present (EDS media) so we avoid CLS and the a11y unsized flag.
        const img = pic.querySelector('img');
        if (img && !img.getAttribute('width')) {
          const src = img.getAttribute('src') || '';
          const w = src.match(/[?&]width=(\d+)/);
          const h = src.match(/[?&]height=(\d+)/);
          img.setAttribute('width', w ? w[1] : '750');
          img.setAttribute('height', h ? h[1] : '500');
        }
      }
    });
  });
}
