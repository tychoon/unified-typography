import {parser, GFM} from '@lezer/markdown';
const markdown = parser.configure(GFM);
export interface Block { start: number; end: number; level: number; kind: 'body' | 'heading' | 'list'; listType?: 'ordered' | 'unordered' }
export interface LineStyle { from: number; kind: 'body' | 'heading' | 'list' | 'blank'; level: number; before: string; after: string }
export interface Plan { blocks: Block[]; lines: Map<number, LineStyle>; sourceLines: string[] }
const before = (b: Block) => b.kind === 'heading' ? `var(--ut-h${b.level}-before)` : b.kind === 'list' ? 'var(--ut-list-before)' : '0px';
const after = (b: Block) => b.kind === 'heading' ? `var(--ut-h${b.level}-after)` : b.kind === 'list' ? 'var(--ut-list-after)' : 'var(--ut-paragraph-gap)';
export function buildPlan(source: string): Plan {
  const sourceLines = source.split('\n');
  const offsets: number[] = []; let position = 0;
  for (const line of sourceLines) { offsets.push(position); position += line.length + 1; }
  const lineAt = (pos: number) => {
    let lo = 0, hi = offsets.length;
    while (lo + 1 < hi) { const mid = (lo + hi) >>> 1; if (offsets[mid] <= pos) lo = mid; else hi = mid; }
    return lo;
  };
  // Mask Obsidian-specific blocks without changing offsets. Never style their contents.
  const masked = [...sourceLines];
  let frontmatter = sourceLines[0]?.trim() === '---';
  let math = false, comment = false;
  let fence: {char: string; length: number} | undefined;
  for (let i = 0; i < sourceLines.length; i++) {
    const t = sourceLines[i].trim();
    if (frontmatter) { masked[i] = ' '.repeat(sourceLines[i].length); if (i > 0 && /^(---|\.\.\.)$/.test(t)) frontmatter = false; continue; }
    const fenceMatch = /^ {0,3}(`{3,}|~{3,})/.exec(sourceLines[i]);
    if (fence) {
      if (fenceMatch && fenceMatch[1][0] === fence.char && fenceMatch[1].length >= fence.length &&
          sourceLines[i].slice(fenceMatch[0].length).trim() === '') fence = undefined;
      continue;
    }
    if (!math && !comment && fenceMatch) {
      fence = {char: fenceMatch[1][0], length: fenceMatch[1].length}; continue;
    }
    const mathMarks = t.match(/\$\$/g)?.length ?? 0;
    const commentMarks = t.match(/%%/g)?.length ?? 0;
    if (math || comment || mathMarks || commentMarks) masked[i] = ' '.repeat(sourceLines[i].length);
    if (mathMarks % 2) math = !math;
    if (commentMarks % 2) comment = !comment;
  }
  const tree = markdown.parse(masked.join('\n'));
  const blocks: Block[] = [];
  for (let n = tree.topNode.firstChild; n; n = n.nextSibling) {
    const heading = /^ATXHeading([1-6])$/.exec(n.name);
    const list = n.name === 'BulletList' || n.name === 'OrderedList';
    if (n.name !== 'Paragraph' && !heading && !list) continue;
    const start = lineAt(n.from), end = lineAt(Math.max(n.from, n.to - 1));
    const raw = sourceLines.slice(start, end + 1).join('\n');
    // Embedded/custom rendered blocks are outside the MVP's plain-prose scope.
    if (!list && /!\[|<[^>]+>|\$\$|%%/.test(raw)) continue;
    blocks.push({start, end, level: heading ? Number(heading[1]) : 0, kind: heading ? 'heading' : list ? 'list' : 'body',
      ...(list ? {listType: n.name === 'OrderedList' ? 'ordered' as const : 'unordered' as const} : {})});
  }
  const lines = new Map<number, LineStyle>();
  blocks.forEach((block, index) => {
    const previous = blocks[index - 1];
    const connected = previous && sourceLines.slice(previous.end + 1, block.start).every(l => !l.trim());
    const gap = connected ? `max(${after(previous)}, ${before(block)})` : before(block);
    const blanks = connected ? block.start - previous.end - 1 : 0;
    for (let i = block.start; i <= block.end; i++) {
      // Outer list boundaries only: nested items, continuation lines and internal blanks retain theme layout.
      if (block.kind === 'list' && i !== block.start && i !== block.end) continue;
      lines.set(i, {from: offsets[i], kind: block.kind, level: block.level,
        before: i === block.start ? (blanks ? `max(0px, calc(${gap} - ${blanks}px))` : gap) : block.kind === 'list' ? '0px' : 'var(--ut-paragraph-gap)',
        after: '0px'});
    }
    if (connected) for (let i = previous.end + 1; i < block.start; i++) {
      lines.set(i, {from: offsets[i], kind: 'blank', level: 0, before: '0px', after: '0px'});
    }
    const next = blocks[index + 1];
    const nextConnected = next && sourceLines.slice(block.end + 1, next.start).every(l => !l.trim());
    if (!nextConnected && block.kind !== 'body') lines.get(block.end)!.after = after(block);
  });
  return {blocks, lines, sourceLines};
}
export function readingGap(plan: Plan, block: Block): string {
  const index = plan.blocks.indexOf(block), previous = plan.blocks[index - 1];
  return previous && plan.sourceLines.slice(previous.end + 1, block.start).every(l => !l.trim())
    ? `max(${after(previous)}, ${before(block)})` : before(block);
}
