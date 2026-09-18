import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EditorState} from '@codemirror/state';
import {JSDOM} from 'jsdom';
import {buildPlan, readingGap} from '../src/model';
import {typographyField} from '../src/editor';
import {decorateBreaks, readingCandidates} from '../src/reading';
import {normalize, DEFAULTS} from '../src/settings';

test('hard source breaks get one gap; a long wrapped source line has only one decoration', () => {
  const p = buildPlan('a'.repeat(2000) + '\nb');
  assert.equal(p.lines.size, 2);
  assert.equal(p.lines.get(1)?.before, 'var(--ut-paragraph-gap)');
});
test('adjacent headings merge with max, body after heading uses heading bottom', () => {
  const p = buildPlan('# A\n## B\nBody');
  assert.equal(p.lines.get(1)?.before, 'max(var(--ut-h1-after), var(--ut-h2-before))');
  assert.equal(p.lines.get(2)?.before, 'max(var(--ut-h2-after), 0px)');
  assert.equal(p.lines.get(1)?.after, '0px');
});
test('blank cm-lines are classified only between managed blocks and compensated once', () => {
  const p = buildPlan('\n# A\n\n\nBody\n\n```\ncode\n```\n');
  assert.equal(p.lines.has(0), false);
  assert.equal(p.lines.get(2)?.kind, 'blank');
  assert.equal(p.lines.get(3)?.kind, 'blank');
  assert.match(p.lines.get(4)!.before, /- 2px/);
  assert.equal(readingGap(p, p.blocks[1]), 'max(var(--ut-h1-after), 0px)');
  assert.equal(p.lines.has(5), false);
});
test('all six heading levels and closing hashes', () => {
  const p = buildPlan(Array.from({length: 6}, (_, i) => '#'.repeat(i + 1) + ' Heading ##').join('\n'));
  assert.deepEqual(p.blocks.map(b => b.level), [1,2,3,4,5,6]);
});
test('code, callouts, tables, frontmatter, math and comments remain unmanaged', () => {
  const source = '---\ntitle: Hi\n---\n\n```md\n# code\n```\n\n- list\n  continued\n\n> [!note]\n> # quote\n\n| a | b |\n| - | - |\n| 1 | 2 |\n\n$$\nx+y\n$$\n\n%%\n# comment\n%%\n\nBody';
  const p = buildPlan(source);
  assert.deepEqual(p.blocks.map(b => b.kind), ['list', 'body']);
  assert.equal(p.sourceLines[p.blocks[1].start], 'Body');
});
test('setext heading and embedded image paragraphs safely keep theme defaults', () => {
  assert.equal(buildPlan('Title\n=====\n\n![[image.png]]').blocks.length, 0);
});
test('editing a heading into fenced code rebuilds decorations without stale styles', () => {
  let state = EditorState.create({doc: '# Heading\nBody', extensions: [typographyField]});
  assert.equal(state.field(typographyField).size, 2);
  state = state.update({changes: {from: 0, to: state.doc.length, insert: '```\n# Heading\nBody\n```'}}).state;
  assert.equal(state.field(typographyField).size, 0);
});
test('reading hard breaks preserve link identity and restore the original DOM', () => {
  const dom = new JSDOM('<p>A <a href="#">link</a>\n<strong>B\nC</strong><br>\nD</p>');
  const p = dom.window.document.querySelector('p')!;
  const original = p.innerHTML, link = p.querySelector('a');
  const restore = decorateBreaks(p);
  assert.equal(p.querySelectorAll('.ut-break').length, 3);
  assert.equal(p.querySelector('a'), link);
  restore(); assert.equal(p.innerHTML, original);
});
test('reading inline code newlines are untouched', () => {
  const dom = new JSDOM('<p>A<code>x\ny</code>\nB</p>');
  const p = dom.window.document.querySelector('p')!;
  decorateBreaks(p);
  assert.equal(p.querySelectorAll('.ut-break').length, 1);
  assert.equal(p.querySelector('code')!.textContent, 'x\ny');
});
test('invalid saved settings are sanitized and defaults are not shared', () => {
  const s = normalize({lineHeight: Infinity, paragraphGap: -5, headings: [{size: 900}]});
  assert.equal(s.lineHeight, DEFAULTS.lineHeight); assert.equal(s.paragraphGap, 0);
  assert.equal(s.headings.length, 6); assert.equal(s.headings[0].size, 4);
  s.headings[1].size = 3; assert.equal(DEFAULTS.headings[1].size, 1.65);
});
test('math and comment markers inside fences do not suppress later prose', () => {
  const p = buildPlan('```\n$$\n%%\n```\n\n# Visible\nBody');
  assert.deepEqual(p.blocks.map(b => b.kind), ['heading', 'body']);
});
test('deleting separator lines recomputes the compensation', () => {
  let state = EditorState.create({doc: '# H\n\nBody', extensions: [typographyField]});
  state = state.update({changes: {from: 4, to: 5}}).state;
  const value = state.field(typographyField);
  assert.equal(value.size, 2);
  let finalStyle = '';
  value.between(0, state.doc.length, (_from, _to, decoration) => {finalStyle = decoration.spec.attributes.style;});
  assert.equal(finalStyle, '--ut-before:max(var(--ut-h1-after), 0px);--ut-after:0px;');
});

test('ordered, unordered and task lists share outer spacing with adjacent headings', () => {
  for (const source of ['- One\n- Two', '1. One\n2. Two', '- [ ] One\n- [x] Two']) {
    const p = buildPlan('# Before\n\n' + source + '\n\n## After');
    const list = p.blocks[1];
    assert.equal(list.kind, 'list');
    assert.equal(readingGap(p, list), 'max(var(--ut-h1-after), var(--ut-list-before))');
    assert.equal(readingGap(p, p.blocks[2]), 'max(var(--ut-list-after), var(--ut-h2-before))');
    assert.equal(p.lines.get(list.end)?.after, '0px');
    assert.equal(p.lines.get(1)?.kind, 'blank');
    assert.equal(p.lines.get(4)?.kind, 'blank');
  }
});
test('only outer list boundaries are decorated, including nested and loose lists', () => {
  const p = buildPlan('- One\n  wrapped source line\n  - Nested\n\n- Two');
  assert.equal(p.blocks.length, 1);
  assert.equal(p.blocks[0].kind, 'list');
  assert.deepEqual([...p.lines.keys()], [0, 4]);
  assert.equal(p.lines.get(0)?.before, 'var(--ut-list-before)');
  assert.equal(p.lines.get(4)?.after, 'var(--ut-list-after)');
  assert.equal(p.lines.get(4)?.before, '0px');
});
test('single item list receives both boundaries and adjacent list types merge once', () => {
  const single = buildPlan('- One');
  assert.equal(single.lines.get(0)?.after, 'var(--ut-list-after)');
  const p = buildPlan('- One\n\n1. Two');
  assert.deepEqual(p.blocks.map(b => b.listType), ['unordered', 'ordered']);
  assert.equal(readingGap(p, p.blocks[1]), 'max(var(--ut-list-after), var(--ut-list-before))');
});
test('body and list spacing merges at both edges without adding source gaps inside lists', () => {
  const p = buildPlan('Body\n\n- One\n- Two\n\nBody');
  assert.equal(readingGap(p, p.blocks[1]), 'max(var(--ut-paragraph-gap), var(--ut-list-before))');
  assert.equal(readingGap(p, p.blocks[2]), 'max(var(--ut-list-after), 0px)');
  assert.equal(p.lines.get(3)?.before, '0px');
});
test('reading candidates exclude nested lists, item paragraphs and callout contents', () => {
  const dom = new JSDOM('<div><h2>Heading</h2><ul><li><p>Item</p><ol><li>Nested</li></ol></li></ul><ol><li>Item</li></ol><blockquote><ul><li>Quote</li></ul></blockquote><p>Body</p></div>');
  const root = dom.window.document.querySelector('div')!;
  assert.deepEqual(readingCandidates(root).map(n => n.tagName), ['H2', 'UL', 'OL', 'P']);
  assert.equal(readingCandidates(root.querySelector('ul')!).length, 1);
});
test('old saved settings gain list defaults and invalid list spacing is bounded', () => {
  const old = normalize({paragraphGap: 12});
  assert.equal(old.paragraphGap, 12);
  assert.equal(old.listBefore, DEFAULTS.listBefore);
  assert.equal(old.listAfter, DEFAULTS.listAfter);
  const invalid = normalize({listBefore: -1, listAfter: 900});
  assert.equal(invalid.listBefore, 0);
  assert.equal(invalid.listAfter, 120);
});
test('changing a list into a paragraph removes list boundary decorations', () => {
  let state = EditorState.create({doc: '- One\n- Two', extensions: [typographyField]});
  state = state.update({changes: {from: 0, to: state.doc.length, insert: 'One\nTwo'}}).state;
  const classes: string[] = [];
  state.field(typographyField).between(0, state.doc.length, (_from, _to, d) => { classes.push(d.spec.attributes.class); });
  assert.deepEqual(classes, ['ut-line ut-body', 'ut-line ut-body']);
});
