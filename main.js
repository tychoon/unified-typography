/**
 * Unified Typography
 *
 * Unified content rendering controls for Obsidian's editing mode (Live Preview
 * and source mode) and reading mode. All rules are generated from the plugin
 * settings and injected as a single <style> element.
 *
 * The plugin intentionally drives Obsidian's own CSS variables wherever they
 * exist (--line-height-normal, --p-spacing, --list-spacing, --list-indent,
 * --hN-size, --hN-weight, ...) so both modes and most themes stay in sync.
 */
'use strict';

const { Plugin, PluginSettingTab, Setting, Notice } = require('obsidian');

const STYLE_ID = 'unified-typography-dynamic-styles';
const HEADING_COUNT = 6;

const DEFAULT_SETTINGS = {
	enabled: true,
	applyToReading: true,
	applyToEditor: true,
	lineHeight: '1.5',
	paragraphSpacing: '12px',
	headings: [
		{ above: '16px', below: '8px', size: '', weight: '' },
		{ above: '14px', below: '7px', size: '', weight: '' },
		{ above: '13px', below: '6px', size: '', weight: '' },
		{ above: '12px', below: '6px', size: '', weight: '' },
		{ above: '11px', below: '5px', size: '', weight: '' },
		{ above: '11px', below: '5px', size: '', weight: '' },
	],
	lists: {
		ulAbove: '4px',
		ulBelow: '4px',
		ulItemGap: '4px',
		olAbove: '4px',
		olBelow: '4px',
		olItemGap: '4px',
		internalPara: '12px',
		indent: '',
		lineSpacing: '',
	},
	quote: { above: '8px', below: '8px', internal: '8px' },
	code: { above: '8px', below: '8px', lineSpacing: '' },
	table: { above: '8px', below: '8px', cellPadding: '', lineSpacing: '' },
	hr: { above: '16px', below: '16px' },
	callout: { above: '8px', below: '8px' },
	math: { above: '8px', below: '8px' },
	embed: { above: '8px', below: '8px' },
};

/* ------------------------------------------------------------------ */
/* Value helpers                                                       */
/* ------------------------------------------------------------------ */

const LENGTH_RE = /^-?(?:\d+\.?\d*|\.\d+)(?:em|rem|px|pt|%)?$/;
const UNIT_RE = /(?:em|rem|px|pt|%)$/;
const UNITLESS_RE = /^\d+(?:\.\d+)?$/;
const WEIGHT_RE = /^(?:normal|bold|bolder|lighter|[1-9]00)$/;

function normalizeLength(value, fallback) {
	const v = String(value == null ? '' : value).trim();
	if (!LENGTH_RE.test(v)) return fallback;
	return UNIT_RE.test(v) ? v : `${v}px`;
}

function optionalLength(value) {
	const v = String(value == null ? '' : value).trim();
	if (!v || !LENGTH_RE.test(v)) return null;
	return UNIT_RE.test(v) ? v : `${v}px`;
}

function normalizeLineHeight(value) {
	const v = String(value == null ? '' : value).trim();
	if (UNITLESS_RE.test(v)) return v;
	if (LENGTH_RE.test(v)) return v;
	return '1.5';
}

function optionalWeight(value) {
	const v = String(value == null ? '' : value).trim();
	return WEIGHT_RE.test(v) ? v : null;
}

function deepMerge(base, patch) {
	if (Array.isArray(base)) {
		if (!Array.isArray(patch)) return base;
		return base.map((item, i) => {
			if (i < patch.length && patch[i] != null && typeof item === 'object' && item !== null) {
				return deepMerge(item, patch[i]);
			}
			return i < patch.length && patch[i] !== undefined ? patch[i] : item;
		});
	}
	if (base && typeof base === 'object') {
		const out = Object.assign({}, base);
		if (patch && typeof patch === 'object' && !Array.isArray(patch)) {
			for (const key of Object.keys(patch)) {
				out[key] = key in base ? deepMerge(base[key], patch[key]) : patch[key];
			}
		}
		return out;
	}
	return patch !== undefined ? patch : base;
}

/* ------------------------------------------------------------------ */
/* CSS generation                                                      */
/* ------------------------------------------------------------------ */

function buildCss(s) {
	if (!s.enabled) return '/* Unified Typography is disabled. */';

	const vars = [];
	const reading = [];
	const editor = [];

	// Reading rules must match every container Obsidian may use for rendered
	// Markdown: the reading view, preview panes, popovers and embeds.
	const R = ':is(.markdown-rendered, .markdown-preview-view, .markdown-reading-view)';

	const lh = normalizeLineHeight(s.lineHeight);
	const ps = normalizeLength(s.paragraphSpacing, '12px');

	vars.push(`--line-height-normal: ${lh};`);
	vars.push(`--p-spacing: ${ps};`);
	// Space that stock Obsidian adds below a heading on the next line is
	// replaced by the per-heading "space below" padding.
	vars.push('--p-spacing-empty: 0;');

	/* ----- General: line height & paragraph spacing ----- */
	if (s.applyToReading) {
		reading.push(`${R} { line-height: ${lh} !important; }`);
		// Browser UA stylesheets set `<h1>`–`<h6>` to `line-height: 1.2`,
		// which beats inherited values from the container. Force every heading
		// to the configured line-height so reading and editing modes match.
		reading.push(
			`${R} h1, ${R} h2, ${R} h3, ${R} h4, ${R} h5, ${R} h6 { line-height: ${lh} !important; }`
		);
		// Single-direction margins: the gap between two paragraphs is exactly
		// the paragraph spacing, and blocks after a paragraph stack additively
		// (same behaviour as the editor's blank lines).
		// Padding instead of margins: padding never collapses, so the gap
		// stays additive and mirrors the editor's blank-line + line-padding
		// model exactly (margins would collapse with the next block's margin).
		reading.push(
			`${R} p { margin-block: 0 !important; padding-block-end: ${ps} !important; }`
		);
	}
	if (s.applyToEditor) {
		editor.push(
			`.markdown-source-view.mod-cm6 .cm-scroller,\n` +
			`.markdown-source-view.mod-cm6 .cm-line { line-height: ${lh} !important; }`
		);
		// A blank source line marks a paragraph boundary: give it exactly the
		// paragraph spacing so editing mode matches reading mode.
		editor.push(
			`.markdown-source-view.mod-cm6 .cm-content > .cm-line:has(> br:only-child) { line-height: ${ps} !important; }`
		);
	}

	/* ----- Headings ----- */
	for (let i = 1; i <= HEADING_COUNT; i++) {
		const h = (s.headings && s.headings[i - 1]) || {};
		const def = DEFAULT_SETTINGS.headings[i - 1];
		const above = normalizeLength(h.above, def.above);
		const below = normalizeLength(h.below, def.below);
		const size = optionalLength(h.size);
		const weight = optionalWeight(h.weight);
		if (size) vars.push(`--h${i}-size: ${size};`);
		if (weight) vars.push(`--h${i}-weight: ${weight};`);
		if (s.applyToReading) {
			// Padding instead of margins so reading mode adds gaps exactly
			// like editing mode (blank line + line padding), keeping both
			// modes visually identical.
			reading.push(
				`${R} h${i} { margin-block: 0 !important; padding-block-start: ${above} !important; padding-block-end: ${below} !important; }`
			);
		}
		if (s.applyToEditor) {
			editor.push(
				`.markdown-source-view.mod-cm6 .cm-line.HyperMD-header-${i} { padding-top: ${above} !important; padding-bottom: ${below} !important; }`
			);
			// Reading mode always adds the paragraph padding below a preceding
			// <p>. In the editor that gap exists only when the author left a
			// blank line before the heading. When a heading directly follows a
			// plain text line (no blank line), fold the paragraph spacing into
			// the heading's top padding so both modes produce the same gap.
			editor.push(
				`.markdown-source-view.mod-cm6 .cm-content > .cm-line:not(:has(> br:only-child)):not([class*="HyperMD"]) + .cm-line.HyperMD-header-${i} { padding-top: calc(${above} + ${ps}) !important; }`
			);
		}
	}
	if (s.applyToEditor) {
		// A blank line directly below a heading is collapsed: the heading's
		// own "space below" already provides the gap (same as reading mode).
		editor.push(
			`.markdown-source-view.mod-cm6 .cm-content > .cm-line.HyperMD-header + .cm-line:has(> br:only-child) { line-height: 0 !important; min-height: 0 !important; padding-block: 0 !important; }`
		);
	}

	/* ----- Lists (ordered & unordered, configured separately) ----- */
	const L = s.lists || {};
	const ulAbove = normalizeLength(L.ulAbove ?? L.above, DEFAULT_SETTINGS.lists.ulAbove);
	const ulBelow = normalizeLength(L.ulBelow ?? L.below, DEFAULT_SETTINGS.lists.ulBelow);
	const ulItemGap = normalizeLength(L.ulItemGap ?? L.itemGap, DEFAULT_SETTINGS.lists.ulItemGap);
	const olAbove = normalizeLength(L.olAbove ?? L.above, DEFAULT_SETTINGS.lists.olAbove);
	const olBelow = normalizeLength(L.olBelow ?? L.below, DEFAULT_SETTINGS.lists.olBelow);
	const olItemGap = normalizeLength(L.olItemGap ?? L.itemGap, DEFAULT_SETTINGS.lists.olItemGap);
	const listInternal = normalizeLength(L.internalPara, DEFAULT_SETTINGS.lists.internalPara);
	const listIndent = optionalLength(L.indent);
	const listLh = optionalLength(L.lineSpacing);

	// --list-spacing pads list items in BOTH modes (base value = unordered
	// lists); --list-indent drives the indentation of nested lists in BOTH
	// modes. Ordered lists override the padding with explicit rules below.
	vars.push(`--list-spacing: ${ulItemGap};`);
	if (listIndent) vars.push(`--list-indent: ${listIndent};`);

	if (s.applyToReading) {
		reading.push(
			`${R} ul { margin-block-start: ${ulAbove} !important; margin-block-end: ${ulBelow} !important; }`
		);
		reading.push(
			`${R} ol { margin-block-start: ${olAbove} !important; margin-block-end: ${olBelow} !important; }`
		);
		reading.push(
			`${R} ul ul, ${R} ul ol, ${R} ol ul, ${R} ol ol { margin-block: 0 !important; }`
		);
		reading.push(`${R} ul li { padding-block: ${ulItemGap} !important; }`);
		reading.push(`${R} ol li { padding-block: ${olItemGap} !important; }`);
		// "Space above/below list" is the EXACT total gap. Top-level lists
		// drop the first/last item's own padding (the list margin carries the
		// configured gap alone), and a paragraph directly before a list drops
		// its bottom padding (otherwise it would stack on top of the list
		// margin). Nested lists keep the item padding.
		reading.push(`${R} :not(li) > ul > li:first-child { padding-block-start: 0 !important; }`);
		reading.push(`${R} :not(li) > ol > li:first-child { padding-block-start: 0 !important; }`);
		reading.push(`${R} :not(li) > ul > li:last-child { padding-block-end: 0 !important; }`);
		reading.push(`${R} :not(li) > ol > li:last-child { padding-block-end: 0 !important; }`);
		// Recent Obsidian versions wrap every reading-mode block in its own
		// container div (.el-p, .el-ul, ...) and the inner element is an
		// only child, so no sibling combinator on <p>/<ul> can ever match.
		// Match at the wrapper level instead (.el-p followed by .el-ul);
		// the bare forms remain as fallbacks for unwrapped contexts (e.g.
		// paragraphs inside list items, where no wrappers exist).
		reading.push(
			`${R} p:has(+ ul), ${R} p:has(+ ol), ${R} p:has(+ * ul), ${R} p:has(+ * ol),\n` +
			`${R} .el-p:has(+ .el-ul) > p, ${R} .el-p:has(+ .el-ol) > p { padding-block-end: 0 !important; }`
		);
		reading.push(`${R} li > p { margin-block: 0 !important; padding-block-end: 0 !important; }`);
		reading.push(
			`${R} li > p + p { margin-block-start: ${listInternal} !important; }`
		);
		if (listLh) reading.push(`${R} li { line-height: ${listLh} !important; }`);
	}
	if (s.applyToEditor) {
		// A blank line directly below a list is collapsed: reading mode shows
		// nothing beyond the list's own "space below" there. Loose lists
		// (blank lines between items) therefore match tight lists in both
		// modes — the same pattern already used for headings.
		editor.push(
			`.markdown-source-view.mod-cm6 .cm-content > .cm-line.HyperMD-list-line + .cm-line:has(> br:only-child) { line-height: 0 !important; min-height: 0 !important; padding-block: 0 !important; }`
		);
		// "Space above/below list" is the EXACT total gap in both modes.
		// Reading mode drops the preceding paragraph's bottom padding and the
		// first/last item's padding; here the blank line before a list is
		// collapsed and the first/last list line carries the exact value.
		editor.push(
			`.markdown-source-view.mod-cm6 .cm-content > .cm-line:has(> br:only-child):has(+ .cm-line.HyperMD-list-line) { line-height: 0 !important; min-height: 0 !important; padding-block: 0 !important; }`
		);
		// First list line: previous sibling can only be a blank line, a plain
		// paragraph line or a heading. The list type is read from the
		// formatting marker (cm-formatting-list-ul / -ol).
		const listPrevSels = [
			'.cm-line:has(> br:only-child)',
			'.cm-line:not(:has(> br:only-child)):not([class*="HyperMD"]):not(.cm-gap)',
			'.cm-line.HyperMD-header',
		];
		for (const prevSel of listPrevSels) {
			editor.push(
				`.markdown-source-view.mod-cm6 .cm-content > ${prevSel} + .cm-line.HyperMD-list-line:has(.cm-formatting-list-ul) { padding-top: ${ulAbove} !important; }`
			);
			editor.push(
				`.markdown-source-view.mod-cm6 .cm-content > ${prevSel} + .cm-line.HyperMD-list-line:has(.cm-formatting-list-ol) { padding-top: ${olAbove} !important; }`
			);
		}
		// Last list line before a non-list line carries the exact
		// "space below list" (reading mode uses the list's own margin).
		editor.push(
			`.markdown-source-view.mod-cm6 .cm-content > .cm-line.HyperMD-list-line:has(.cm-formatting-list-ul):has(+ .cm-line:not(.HyperMD-list-line)) { padding-bottom: ${ulBelow} !important; }`
		);
		editor.push(
			`.markdown-source-view.mod-cm6 .cm-content > .cm-line.HyperMD-list-line:has(.cm-formatting-list-ol):has(+ .cm-line:not(.HyperMD-list-line)) { padding-bottom: ${olBelow} !important; }`
		);
		// Ordered lists use their own item gap (--list-spacing covers
		// unordered lists as the base value).
		editor.push(
			`.markdown-source-view.mod-cm6 .cm-line.HyperMD-list-line:has(.cm-formatting-list-ol) { padding-block: ${olItemGap} !important; }`
		);
		if (listLh) {
			editor.push(
				`.markdown-source-view.mod-cm6 .cm-line.HyperMD-list-line { line-height: ${listLh} !important; }`
			);
		}
	}

	/* ----- Blockquotes ----- */
	const q = s.quote || {};
	const qAbove = normalizeLength(q.above, DEFAULT_SETTINGS.quote.above);
	const qBelow = normalizeLength(q.below, DEFAULT_SETTINGS.quote.below);
	const qInternal = normalizeLength(q.internal, DEFAULT_SETTINGS.quote.internal);
	if (s.applyToReading) {
		reading.push(
			`${R} blockquote { margin-block-start: ${qAbove} !important; margin-block-end: ${qBelow} !important; }`
		);
		reading.push(`${R} blockquote > p { margin-block: 0 !important; padding-block-end: 0 !important; }`);
		reading.push(
			`${R} blockquote > p + p { margin-block-start: ${qInternal} !important; }`
		);
		reading.push(`${R} blockquote > :is(ul, ol) { margin-block: 0 !important; }`);
	}

	/* ----- Code blocks ----- */
	const c = s.code || {};
	const cAbove = normalizeLength(c.above, DEFAULT_SETTINGS.code.above);
	const cBelow = normalizeLength(c.below, DEFAULT_SETTINGS.code.below);
	const cLh = optionalLength(c.lineSpacing);
	if (s.applyToReading) {
		reading.push(
			`${R} pre { margin-block-start: ${cAbove} !important; margin-block-end: ${cBelow} !important; }`
		);
		if (cLh) reading.push(`${R} pre { line-height: ${cLh} !important; }`);
	}
	if (s.applyToEditor) {
		editor.push(
			`.markdown-source-view.mod-cm6 .cm-line.HyperMD-codeblock-begin { padding-top: ${cAbove} !important; }`
		);
		editor.push(
			`.markdown-source-view.mod-cm6 .cm-line.HyperMD-codeblock-end { padding-bottom: ${cBelow} !important; }`
		);
		if (cLh) {
			editor.push(
				`.markdown-source-view.mod-cm6 .cm-line.HyperMD-codeblock { line-height: ${cLh} !important; }`
			);
		}
	}

	/* ----- Tables ----- */
	const t = s.table || {};
	const tAbove = normalizeLength(t.above, DEFAULT_SETTINGS.table.above);
	const tBelow = normalizeLength(t.below, DEFAULT_SETTINGS.table.below);
	const tPad = optionalLength(t.cellPadding);
	const tLh = optionalLength(t.lineSpacing);
	if (s.applyToReading) {
		reading.push(
			`${R} table { margin-block-start: ${tAbove} !important; margin-block-end: ${tBelow} !important; }`
		);
		if (tPad) {
			reading.push(
				`${R} th,\n${R} td { padding-block-start: ${tPad} !important; padding-block-end: ${tPad} !important; }`
			);
		}
	}
	if (tLh) vars.push(`--table-line-height: ${tLh};`);
	if (s.applyToEditor) {
		editor.push(
			`.markdown-source-view.mod-cm6 .cm-table-widget { margin-block-start: ${tAbove} !important; margin-block-end: ${tBelow} !important; }`
		);
		// The table widget is a direct child of .cm-content (not inside a
		// .cm-line). Strip Obsidian's default padding and neutralise the
		// reading-mode margins on the inner <table> (the widget itself carries
		// the "space above/below table" values) so the total gap matches
		// reading mode exactly. Inline margins/padding are zeroed as well so
		// the table's left edge aligns with the surrounding text like it does
		// in reading mode.
		editor.push(
			`.markdown-source-view.mod-cm6 .cm-table-widget { padding: 0 !important; margin-inline: 0 !important; }\n` +
			`.markdown-source-view.mod-cm6 .cm-table-widget table { margin-block: 0 !important; margin-inline: 0 !important; }`
		);
		// A blank line directly below the table widget is collapsed: reading
		// mode shows nothing beyond the table's own "space below" there (same
		// pattern as headings and lists).
		editor.push(
			`.markdown-source-view.mod-cm6 .cm-content > .cm-table-widget + .cm-line:has(> br:only-child) { line-height: 0 !important; min-height: 0 !important; padding-block: 0 !important; }`
		);
	}

	/* ----- Horizontal rules ----- */
	const hrS = s.hr || {};
	const hrAbove = normalizeLength(hrS.above, DEFAULT_SETTINGS.hr.above);
	const hrBelow = normalizeLength(hrS.below, DEFAULT_SETTINGS.hr.below);
	if (s.applyToReading) {
		reading.push(
			`${R} hr { margin-block-start: ${hrAbove} !important; margin-block-end: ${hrBelow} !important; }`
		);
	}
	if (s.applyToEditor) {
		editor.push(
			`.markdown-source-view.mod-cm6 .cm-line.HyperMD-hr { padding-top: ${hrAbove} !important; padding-bottom: ${hrBelow} !important; }`
		);
	}

	/* ----- Callouts ----- */
	const cal = s.callout || {};
	const calAbove = normalizeLength(cal.above, DEFAULT_SETTINGS.callout.above);
	const calBelow = normalizeLength(cal.below, DEFAULT_SETTINGS.callout.below);
	if (s.applyToReading) {
		reading.push(
			`${R} .callout { margin-block-start: ${calAbove} !important; margin-block-end: ${calBelow} !important; }`
		);
		reading.push(
			`${R} .callout-content > p:last-child { margin-block-end: 0 !important; padding-block-end: 0 !important; }`
		);
	}
	if (s.applyToEditor) {
		editor.push(
			`.markdown-source-view.mod-cm6 .cm-callout { margin-block-start: ${calAbove} !important; margin-block-end: ${calBelow} !important; }`
		);
	}

	/* ----- Math blocks ----- */
	const m = s.math || {};
	const mAbove = normalizeLength(m.above, DEFAULT_SETTINGS.math.above);
	const mBelow = normalizeLength(m.below, DEFAULT_SETTINGS.math.below);
	if (s.applyToReading) {
		reading.push(
			`${R} .math-block { margin-block-start: ${mAbove} !important; margin-block-end: ${mBelow} !important; }`
		);
	}
	if (s.applyToEditor) {
		editor.push(
			`.markdown-source-view.mod-cm6 .math-block > mjx-container { padding-block-start: ${mAbove} !important; padding-block-end: ${mBelow} !important; }`
		);
	}

	/* ----- Embedded content (block transclusions) ----- */
	const em = s.embed || {};
	const emAbove = normalizeLength(em.above, DEFAULT_SETTINGS.embed.above);
	const emBelow = normalizeLength(em.below, DEFAULT_SETTINGS.embed.below);
	if (s.applyToReading) {
		reading.push(
			`${R} .markdown-embed:not(.inline-embed) { margin-block-start: ${emAbove} !important; margin-block-end: ${emBelow} !important; }`
		);
		reading.push(
			`${R} .markdown-embed-content > p:last-child { margin-block-end: 0 !important; padding-block-end: 0 !important; }`
		);
	}

	/* ----- Assemble ----- */
	const sections = [];
	if (vars.length) sections.push(`/* CSS variables (shared by both modes) */\nbody {\n  ${vars.join('\n  ')}\n}`);
	if (reading.length) sections.push(`/* Reading mode */\n${reading.join('\n')}`);
	if (editor.length) sections.push(`/* Editing mode (Live Preview & source) */\n${editor.join('\n')}`);
	return sections.join('\n\n') + '\n';
}

/* ------------------------------------------------------------------ */
/* Plugin                                                              */
/* ------------------------------------------------------------------ */

class UnifiedTypographyPlugin extends Plugin {
	constructor(app, manifest) {
		super(app, manifest);
		this.settings = null;
		this.styleEl = null;
	}

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new UnifiedTypographySettingTab(this.app, this));
		this.addCommand({
			id: 'diagnose-spacing',
			name: 'Diagnose spacing (write computed styles to console)',
			callback: () => this.diagnoseSpacing(),
		});
		this.applyStyles();
		this.register(() => {
			// Flush any debounced save so settings are never lost on unload.
			if (this._saveTimer) {
				clearTimeout(this._saveTimer);
				this._saveTimer = null;
				this.saveData(this.settings);
			}
			if (this.styleEl) this.styleEl.remove();
			this.styleEl = null;
		});
	}

	async loadSettings() {
		const data = (await this.loadData()) || {};
		// v1.x stored one shared value per list spacing; split into
		// unordered (ul*) / ordered (ol*) pairs BEFORE deepMerge — merging
		// first would fill the new keys with defaults and mask the legacy
		// values. An earlier buggy migration already wrote the DEFAULT
		// values into the new keys, so treat new keys that still equal the
		// defaults as untouched and let the legacy value win.
		const L = data && data.lists;
		let migratedLists = false;
		if (L) {
			const d = DEFAULT_SETTINGS.lists;
			const untouched = (v, dv) => v == null || v === dv;
			if (L.above != null && untouched(L.ulAbove, d.ulAbove) && untouched(L.olAbove, d.olAbove)) { L.ulAbove = L.above; L.olAbove = L.above; migratedLists = true; }
			if (L.below != null && untouched(L.ulBelow, d.ulBelow) && untouched(L.olBelow, d.olBelow)) { L.ulBelow = L.below; L.olBelow = L.below; migratedLists = true; }
			if (L.itemGap != null && untouched(L.ulItemGap, d.ulItemGap) && untouched(L.olItemGap, d.olItemGap)) { L.ulItemGap = L.itemGap; L.olItemGap = L.itemGap; migratedLists = true; }
		}
		this.settings = deepMerge(DEFAULT_SETTINGS, data);
		if (migratedLists || this.migrateToPx()) await this.saveData(this.settings);
	}

	/* Debug helper: dump computed spacing of headings/paragraphs/lists/tables
	 * in whichever mode is active, so reading/editing mismatches can be
	 * verified against real numbers. Results go to the developer console
	 * (Ctrl/Cmd+Opt+I). */
	diagnoseSpacing() {
		const leaf = document.querySelector('.workspace-leaf.mod-active');
		const sample = (el) => {
			if (!el) return null;
			const cs = getComputedStyle(el);
			return {
				selector: el.className || el.tagName,
				fontSize: cs.fontSize,
				lineHeight: cs.lineHeight,
				marginTop: cs.marginTop,
				marginBottom: cs.marginBottom,
				paddingTop: cs.paddingTop,
				paddingBottom: cs.paddingBottom,
			};
		};
		const out = {};
		/* Measure the real vertical gap between an element and its previous
		 * sibling: prev.bottom -> el.top, in rendered pixels. This catches
		 * extra space that computed styles alone don't explain. */
		const gapAbove = (el) => {
			if (!el) return null;
			const prev = el.previousElementSibling;
			if (!prev) return null;
			const a = prev.getBoundingClientRect();
			const b = el.getBoundingClientRect();
			return {
				prev: (prev.className || prev.tagName).slice(0, 80),
				prevHeight: Math.round(a.height * 10) / 10,
				gap: Math.round((b.top - a.bottom) * 10) / 10,
			};
		};
		for (const sel of ['.markdown-reading-view', '.markdown-rendered', '.markdown-preview-view']) {
			const root = leaf && leaf.querySelector(sel);
			if (root) {
				const li = root.querySelector('li');
				const ul = root.querySelector('ul, ol');
				const table = root.querySelector('table');
				// Blocks are wrapped in .el-* containers whose inner element
				// is an only child — measure/siblings at the wrapper level.
				const wrapOf = (el) => (el && el.parentElement && /(^|\s)el-/.test(String(el.parentElement.className)) ? el.parentElement : el);
				const ulW = wrapOf(ul);
				out.reading = {
					container: sel,
					h1: sample(root.querySelector('h1')),
					h2: sample(root.querySelector('h2')),
					p: sample(root.querySelector('p')),
					list: sample(ul),
					listAboveGap: gapAbove(ulW),
					listDom: ulW ? {
						parent: String((ulW.parentElement && ulW.parentElement.className) || ulW.parentElement.tagName).slice(0, 60),
						prev: ulW.previousElementSibling ? String(ulW.previousElementSibling.className || ulW.previousElementSibling.tagName).slice(0, 60) : null,
						next: ulW.nextElementSibling ? String(ulW.nextElementSibling.className || ulW.nextElementSibling.tagName).slice(0, 60) : null,
					} : null,
					listBelowGap: (() => {
						if (!ulW || !ulW.nextElementSibling) return null;
						const n = ulW.nextElementSibling.getBoundingClientRect();
						const b = ulW.getBoundingClientRect();
						return { next: (ulW.nextElementSibling.className || ulW.nextElementSibling.tagName).slice(0, 60), gap: Math.round((n.top - b.bottom) * 10) / 10 };
					})(),
					li: sample(li),
					liP: sample(li && li.querySelector(':scope > p')),
					table: sample(table),
					tableAboveGap: gapAbove(wrapOf(table)),
				};
				break;
			}
		}
		const ed = leaf && leaf.querySelector('.markdown-source-view.mod-cm6 .cm-content');
		if (ed) {
			const listLines = ed.querySelectorAll('.HyperMD-list-line');
			const tableLine = ed.querySelector('.cm-line:has(.cm-table-widget)');
			const tableWidget = ed.querySelector('.cm-table-widget');
			// Dump the DOM structure around the table widget so the editor
			// collapse rules can target the right sibling lines. The widget is
			// a direct child of .cm-content, so sample its siblings directly.
			let tableDom = null;
			if (tableWidget) {
				const cls = (el) => (el ? el.className : null);
				tableDom = {
					widgetParent: cls(tableWidget.parentElement),
					prev: cls(tableWidget.previousElementSibling),
					next: cls(tableWidget.nextElementSibling),
				};
			}
			const lastList = listLines[listLines.length - 1] || null;
			out.editor = {
				container: '.cm-content',
				header1: sample(ed.querySelector('.HyperMD-header-1')),
				header2: sample(ed.querySelector('.HyperMD-header-2')),
				line: sample(ed.querySelector('.cm-line:not(.HyperMD-header):not(:has(> br:only-child))')),
				listLine1: sample(listLines[0] || null),
				listLine2: sample(listLines[1] || null),
				listAboveGap: gapAbove(listLines[0] || null),
				listBelowGap: gapAbove(lastList && lastList.nextElementSibling),
				tableLine: sample(tableLine),
				tableWidget: sample(tableWidget),
				tableAboveGap: gapAbove(tableWidget),
				tableDom,
			};
		}
		console.log('[Unified Typography] spacing diagnostics:', out);
		new Notice('Unified Typography: diagnostics written to the developer console.');
	}

	/* Versions <= 1.2 stored lengths in em; the plugin now defaults to px.
	 * Convert every stored em value (1em = 16px) so all sliders show px. */
	migrateToPx() {
		let changed = false;
		const conv = (v) => {
			const m = /^(-?(?:\d+\.?\d*|\.\d+))em$/.exec(String(v == null ? '' : v).trim());
			if (!m) return v;
			changed = true;
			return `${round2(parseFloat(m[1]) * 16)}px`;
		};
		this.settings.paragraphSpacing = conv(this.settings.paragraphSpacing);
		for (const h of this.settings.headings || []) {
			h.above = conv(h.above);
			h.below = conv(h.below);
			h.size = conv(h.size);
		}
		for (const group of ['lists', 'quote', 'code', 'table', 'hr', 'callout', 'math', 'embed']) {
			const g = this.settings[group];
			if (g) for (const k of Object.keys(g)) g[k] = conv(g[k]);
		}
		return changed;
	}

	async saveSettings() {
		// Apply immediately so slider drags feel live; debounce the disk write
		// so a single drag does not trigger dozens of data.json writes.
		this.applyStyles();
		if (this._saveTimer) clearTimeout(this._saveTimer);
		this._saveTimer = setTimeout(() => {
			this._saveTimer = null;
			this.saveData(this.settings);
		}, 400);
	}

	applyStyles() {
		if (!this.styleEl) {
			this.styleEl = document.head.createEl('style', { attr: { id: STYLE_ID } });
		}
		this.styleEl.textContent = buildCss(this.settings);
	}

	async resetSettings() {
		this.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
		await this.saveSettings();
	}
}

/* ------------------------------------------------------------------ */
/* Settings UI helpers                                                 */
/* ------------------------------------------------------------------ */

const HEADING_SIZE_INITIALS = ['32px', '26px', '22px', '19px', '18px', '16px'];

function round2(n) {
	return Math.round(n * 100) / 100;
}

function parseLen(value) {
	const m = /^(-?(?:\d+\.?\d*|\.\d+))(em|rem|px|pt|%)?$/.exec(String(value == null ? '' : value).trim());
	if (!m) return null;
	return { n: round2(parseFloat(m[1])), unit: !m[2] || m[2] === 'px' ? 'px' : 'em' };
}

/**
 * Adds a Setting row with a slider (and an em/px unit picker for lengths).
 * opts: {
 *   name, desc, save(),
 *   get(): string, set(v: string),
 *   kind: 'length' | 'unitless' | 'weight',
 *   min, max, step,      // in em for lengths; raw for unitless/weight
 *   optional: boolean,   // adds a toggle; off stores ''
 *   initial: string,     // value used when an optional row is switched on
 * }
 */
function addSliderRow(container, opts) {
	// `container` is either a container element (imperative display()) or an
	// already-created Setting row (declarative render callback).
	const setting = container instanceof Setting
		? container
		: new Setting(container).setName(opts.name).setDesc(opts.desc || '');
	setting.controlEl.addClass('ut-slider');

	const isLength = opts.kind === 'length';
	let curUnit = 'px';
	if (isLength) {
		const p = parseLen(opts.get());
		if (p) curUnit = p.unit;
	}

	const limits = () =>
		isLength && curUnit === 'px'
			? { min: Math.round(opts.min * 16), max: Math.round(opts.max * 16), step: 1 }
			: { min: opts.min, max: opts.max, step: opts.step };

	const clamp = (n) => {
		const { min, max, step } = limits();
		return round2(Math.min(max, Math.max(min, Math.round(n / step) * step)));
	};

	const currentValue = () => {
		const raw = String(opts.get() == null ? '' : opts.get());
		if (opts.kind === 'weight') {
			const v = parseInt(raw.trim(), 10);
			if (Number.isFinite(v)) return Math.min(900, Math.max(100, v));
			const init = parseInt(String(opts.initial || '').trim(), 10);
			return Number.isFinite(init) ? init : 400;
		}
		if (opts.kind === 'unitless') {
			const v = parseFloat(raw);
			if (Number.isFinite(v)) return clamp(v);
			const init = parseFloat(String(opts.initial || ''));
			return clamp(Number.isFinite(init) ? init : opts.min);
		}
		const p = parseLen(raw);
		if (p) return clamp(p.n);
		const initP = parseLen(opts.initial || '') || { n: opts.min, unit: 'px' };
		return clamp(initP.n);
	};

	const format = (n) => (isLength ? `${n}${curUnit}` : String(n));

	const valueEl = createSpan({ cls: 'ut-value' });

	let sliderCmp = null;
	let dropdownCmp = null;
	let enabled = !opts.optional;

	const setDisabled = (d) => {
		if (sliderCmp && typeof sliderCmp.setDisabled === 'function') sliderCmp.setDisabled(d);
		if (dropdownCmp && typeof dropdownCmp.setDisabled === 'function') dropdownCmp.setDisabled(d);
	};

	const commit = (n) => {
		opts.set(format(n));
		valueEl.textContent = format(n);
		opts.save();
	};

	if (opts.optional) {
		enabled = String(opts.get() == null ? '' : opts.get()).trim() !== '';
		setting.addToggle((t) =>
			t.setValue(enabled).onChange((v) => {
				enabled = v;
				if (v) {
					if (isLength) {
						const p = parseLen(opts.initial) || { n: opts.min, unit: 'px' };
						curUnit = p.unit;
						const L = limits();
						sliderCmp.setLimits(L.min, L.max, L.step);
					}
					const n = currentValue();
					sliderCmp.setValue(n);
					commit(n);
				} else {
					opts.set('');
					valueEl.textContent = '—';
					opts.save();
				}
				setDisabled(!v);
			})
		);
	}

	if (isLength) {
		setting.addDropdown((d) => {
			dropdownCmp = d;
			d.addOptions({ em: 'em', px: 'px' });
			d.setValue(curUnit);
			d.onChange((u) => {
				// Keep the visual size roughly constant when switching units.
				const n = sliderCmp ? sliderCmp.getValue() : 0;
				const converted = u === 'px' ? Math.round(n * 16) : round2(n / 16);
				curUnit = u;
				const L = limits();
				const v = clamp(converted);
				sliderCmp.setLimits(L.min, L.max, L.step);
				sliderCmp.setValue(v);
				if (enabled) commit(v);
				else valueEl.textContent = '—';
			});
		});
	}

	setting.addSlider((sl) => {
		sliderCmp = sl;
		const { min, max, step } = limits();
		sl.setLimits(min, max, step);
		sl.setValue(currentValue());
		sl.onChange((v) => {
			if (enabled) commit(round2(v));
		});
	});

	setting.controlEl.appendChild(valueEl);
	valueEl.textContent = enabled ? format(currentValue()) : '—';
	setDisabled(!enabled);
}

/* ------------------------------------------------------------------ */
/* Settings tab                                                        */
/* ------------------------------------------------------------------ */

class UnifiedTypographySettingTab extends PluginSettingTab {
	constructor(app, plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/* Shared description of every row in this tab. Consumed by both
	 * getSettingDefinitions() (Obsidian 1.13+, declarative) and display()
	 * (older hosts, imperative). */
	describeRows() {
		const s = this.plugin.settings;
		const rows = [];
		const section = (name, desc) => rows.push({ section: name, desc });
		const toggle = (name, desc, key) => rows.push({ type: 'toggle', name, desc, key });
		const slider = (name, desc, obj, key, kind, min, max, step, optional, initial) =>
			rows.push({ type: 'slider', name, desc, obj, key, kind, min, max, step, optional, initial });
		const len = (name, desc, obj, key, opts) => {
			const o = opts || {};
			slider(
				name, desc, obj, key, 'length',
				o.min != null ? o.min : 0,
				o.max != null ? o.max : 4,
				o.step != null ? o.step : 0.05,
				!!o.optional,
				o.initial || '16px'
			);
		};
		const unitless = (name, desc, obj, key, opts) => {
			const o = opts || {};
			slider(
				name, desc, obj, key, 'unitless',
				o.min != null ? o.min : 1,
				o.max != null ? o.max : 3,
				o.step != null ? o.step : 0.05,
				!!o.optional,
				o.initial || '1.5'
			);
		};

		/* ----- General ----- */
		section('General', 'Core spacing values shared by both modes.');
		toggle('Enable typography overrides', 'Master switch for every rule generated by this plugin.', 'enabled');
		toggle('Apply in reading mode', 'Apply the reading-mode rules (also affects rendered embeds, hover popovers and canvas cards).', 'applyToReading');
		toggle('Apply in editing mode', 'Apply the editing-mode rules to Live Preview and source mode.', 'applyToEditor');
		unitless('Line height', 'Unitless multiplier for body text (e.g. 1.5). Applies to both modes.', s, 'lineHeight', { min: 1, max: 3, step: 0.05 });
		len('Paragraph spacing', 'Gap between paragraphs. Reading mode: paragraph margin. Editing mode: height of blank lines.', s, 'paragraphSpacing');

		/* ----- Headings ----- */
		section('Headings', 'Spacing applies to both modes. Font size and font weight are optional — switch them on to override the theme default.');
		for (let i = 0; i < HEADING_COUNT; i++) {
			const h = s.headings[i];
			const n = i + 1;
			len(`H${n} · space above`, '', h, 'above');
			len(`H${n} · space below`, '', h, 'below');
			len(`H${n} · font size`, 'Optional. Off = theme default.', h, 'size', { min: 0.6, max: 3, optional: true, initial: HEADING_SIZE_INITIALS[i] });
			slider(`H${n} · font weight`, 'Optional. Off = theme default.', h, 'weight', 'weight', 100, 900, 100, true, '600');
		}

		/* ----- Lists ----- */
		section('Lists', 'Ordered, unordered and task lists. "Space above/below list" is the exact total gap around the list.');
		len('Space above unordered list', 'Total gap above a bullet list. Both modes.', s.lists, 'ulAbove');
		len('Space below unordered list', 'Total gap below a bullet list. Both modes.', s.lists, 'ulBelow');
		len('Space between items (unordered)', 'Gap between list items. Both modes.', s.lists, 'ulItemGap', { max: 2 });
		len('Space above ordered list', 'Total gap above a numbered list. Both modes.', s.lists, 'olAbove');
		len('Space below ordered list', 'Total gap below a numbered list. Both modes.', s.lists, 'olBelow');
		len('Space between items (ordered)', 'Gap between list items. Both modes.', s.lists, 'olItemGap', { max: 2 });
		len('Space inside items', 'Gap between paragraphs inside one item (reading mode).', s.lists, 'internalPara');
		len('Indentation per level', 'Optional. Per nesting level, both modes. Off = Obsidian default.', s.lists, 'indent', { optional: true, initial: '32px' });
		unitless('List line height', 'Optional line height inside list items. Both modes.', s.lists, 'lineSpacing', { min: 0.8, max: 2.5, optional: true, initial: '1.5' });

		/* ----- Blockquotes ----- */
		section('Blockquotes');
		len('Space above blockquote', '', s.quote, 'above');
		len('Space below blockquote', '', s.quote, 'below');
		len('Gap inside blockquote', 'Between paragraphs inside the quote (reading mode).', s.quote, 'internal');

		/* ----- Code blocks ----- */
		section('Code blocks');
		len('Space above code block', 'Both modes.', s.code, 'above');
		len('Space below code block', 'Both modes.', s.code, 'below');
		unitless('Code line height', 'Optional. Both modes.', s.code, 'lineSpacing', { min: 0.8, max: 2.5, optional: true, initial: '1.5' });

		/* ----- Tables ----- */
		section('Tables');
		len('Space above table', '', s.table, 'above');
		len('Space below table', '', s.table, 'below');
		len('Cell padding', 'Optional vertical padding of header and body cells (reading mode).', s.table, 'cellPadding', { max: 2, optional: true, initial: '8px' });
		unitless('Table line height', 'Optional. Both modes.', s.table, 'lineSpacing', { min: 0.8, max: 2.5, optional: true, initial: '1.5' });

		/* ----- Horizontal rules ----- */
		section('Horizontal rules');
		len('Space above rule', 'Both modes.', s.hr, 'above');
		len('Space below rule', 'Both modes.', s.hr, 'below');

		/* ----- Callouts ----- */
		section('Callouts');
		len('Space above callout', '', s.callout, 'above');
		len('Space below callout', '', s.callout, 'below');

		/* ----- Math blocks ----- */
		section('Math blocks');
		len('Space above math block', 'Both modes.', s.math, 'above');
		len('Space below math block', 'Both modes.', s.math, 'below');

		/* ----- Embedded content ----- */
		section('Embedded content', 'Block transclusions such as ![[note]] and ![[note#heading]].');
		len('Space above embed', '', s.embed, 'above');
		len('Space below embed', '', s.embed, 'below');

		/* ----- Reset ----- */
		rows.push({ type: 'reset' });

		return rows;
	}

	/* Declarative settings (Obsidian 1.13+): makes every setting appear in
	 * Obsidian's settings search. Complex slider rows use render callbacks. */
	getSettingDefinitions() {
		return this.describeRows().map((row) => {
			if (row.section) {
				return {
					name: row.section,
					desc: row.desc || '',
					render: (setting) => setting.setHeading(),
				};
			}
			if (row.type === 'toggle') {
				return {
					name: row.name,
					desc: row.desc || '',
					control: { type: 'toggle', key: row.key },
				};
			}
			if (row.type === 'slider') {
				return {
					name: row.name,
					desc: row.desc || '',
					render: (setting) => {
						addSliderRow(setting, {
							name: row.name,
							desc: row.desc || '',
							save: () => this.plugin.saveSettings(),
							kind: row.kind,
							min: row.min,
							max: row.max,
							step: row.step,
							optional: row.optional,
							initial: row.initial,
							get: () => row.obj[row.key],
							set: (v) => { row.obj[row.key] = v; },
						});
					},
				};
			}
			if (row.type === 'reset') {
				return {
					name: 'Reset',
					desc: 'Restore every value to the plugin defaults.',
					render: (setting) => {
						setting.addButton((b) => {
							b.setButtonText('Reset to defaults').onClick(async () => {
								await this.plugin.resetSettings();
								new Notice('Unified Typography: settings reset.');
								this.refreshTab();
							});
						});
					},
				};
			}
			return null;
		}).filter(Boolean);
	}

	/* Value binding for declarative controls: dot-path access into
	 * plugin.settings, persisted through saveSettings() so the generated CSS
	 * is refreshed as well. */
	getControlValue(key) {
		return key.split('.').reduce((o, k) => (o == null ? o : o[k]), this.plugin.settings);
	}

	setControlValue(key, value) {
		const path = key.split('.');
		const last = path.pop();
		const target = path.reduce((o, k) => (o == null ? o : o[k]), this.plugin.settings);
		if (target != null) target[last] = value;
		this.plugin.saveSettings();
	}

	/* On Obsidian 1.13+ re-calling display() does not refresh declarative
	 * settings — call update() there, and fall back to display() otherwise. */
	refreshTab() {
		if (typeof this.update === 'function') this.update();
		else this.display();
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();
		const save = () => this.plugin.saveSettings();

		for (const row of this.describeRows()) {
			if (row.section) {
				const heading = new Setting(containerEl).setName(row.section).setHeading();
				if (row.desc) heading.setDesc(row.desc);
			} else if (row.type === 'toggle') {
				new Setting(containerEl)
					.setName(row.name)
					.setDesc(row.desc || '')
					.addToggle((t) => t.setValue(this.plugin.settings[row.key]).onChange((v) => {
						this.plugin.settings[row.key] = v;
						save();
					}));
			} else if (row.type === 'slider') {
				addSliderRow(containerEl, {
					name: row.name,
					desc: row.desc || '',
					save,
					kind: row.kind,
					min: row.min,
					max: row.max,
					step: row.step,
					optional: row.optional,
					initial: row.initial,
					get: () => row.obj[row.key],
					set: (v) => { row.obj[row.key] = v; },
				});
			} else if (row.type === 'reset') {
				new Setting(containerEl).setName('Reset').setDesc('Restore every value to the plugin defaults.').addButton((b) => {
					b.setButtonText('Reset to defaults').onClick(async () => {
						await this.plugin.resetSettings();
						new Notice('Unified Typography: settings reset.');
						this.refreshTab();
					});
				});
			}
		}
	}
}

module.exports = UnifiedTypographyPlugin;
