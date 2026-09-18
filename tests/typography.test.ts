import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EditorState} from '@codemirror/state';
import {JSDOM} from 'jsdom';
import {buildPlan, readingGap} from '../src/model';
import {typographyField} from '../src/editor';
import {decorateBreaks} from '../src/reading';
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
test('code, lists, callouts, tables, frontmatter, math and comments remain unmanaged', () => {
  const source = '---\ntitle: Hi\n---\n\n```md\n# code\n```\n\n- list\n  continued\n\n> [!note]\n> # quote\n\n| a | b |\n| - | - |\n| 1 | 2 |\n\n$$\nx+y\n$$\n\n%%\n# comment\n%%\n\nBody';
  const p = buildPlan(source);
  assert.equal(p.blocks.length, 1);
  assert.equal(p.sourceLines[p.blocks[0].start], 'Body');
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

