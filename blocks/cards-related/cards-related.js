/*
 * cards-related — text-only vertical list of related stories (title + date).
 * Content model: one row per story, a single cell with a linked title and date.
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-related-item';
    while (row.firstElementChild) li.append(row.firstElementChild);
    ul.append(li);
  });
  block.textContent = '';
  block.append(ul);
}
