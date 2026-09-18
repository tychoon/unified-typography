/** Replace only source newline text and actual BRs; preserve inline element identity/listeners. */
export function decorateBreaks(element: HTMLElement): () => void {
  const document = element.ownerDocument;
  const undo: (() => void)[] = [];
  const walker = document.createTreeWalker(element, 4);
  const texts: Text[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (node.data.includes('\n') && !node.parentElement?.closest('code, pre, .math, .internal-embed, .ut-break')) texts.push(node);
  }
  const marker = () => { const span = document.createElement('span'); span.className = 'ut-break'; span.setAttribute('aria-hidden', 'true'); return span; };
  // Some renderers emit BR followed by a formatting newline; consume that newline only once.
  for (const br of Array.from(element.querySelectorAll('br'))) {
    if (br.closest('code, pre, .math, .internal-embed')) continue;
    const next = br.nextSibling;
    if (next?.nodeType === 3 && (next as Text).data.startsWith('\n')) {
      const text = next as Text; text.deleteData(0, 1); undo.push(() => text.insertData(0, '\n'));
    }
    const span = marker(); br.replaceWith(span); undo.push(() => span.replaceWith(br));
  }
  for (const original of texts) {
    if (!original.data.includes('\n')) continue;
    const pieces: Node[] = [];
    original.data.split('\n').forEach((text, i) => { if (i) pieces.push(marker()); pieces.push(document.createTextNode(text)); });
    original.replaceWith(...pieces);
    undo.push(() => { pieces[0].parentNode?.insertBefore(original, pieces[0]); pieces.forEach(n => n.parentNode?.removeChild(n)); });
  }
  return () => { for (const restore of undo.reverse()) restore(); };
}

/** Select outer blocks only; list descendants keep the theme's internal layout. */
export function readingCandidates(element: HTMLElement): HTMLElement[] {
  return [element, ...Array.from(element.querySelectorAll<HTMLElement>('p,h1,h2,h3,h4,h5,h6,ul,ol'))]
    .filter(node => /^(P|H[1-6]|UL|OL)$/.test(node.tagName) && !node.closest('li, blockquote, table, pre, .callout, .internal-embed'));
}
