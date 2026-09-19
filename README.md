# Unified Typography

**English** | [简体中文](README.zh-CN.md)

Unified typography controls for **Obsidian**. One set of settings drives **both
editing mode** (Live Preview + source mode) **and reading mode**, so your notes
look the same wherever you read or edit them.

No build step required — `main.js` is plain JavaScript.

## What's new in 2.0.0

Version 2.0.0 is a **complete rebuild** of the plugin:

- Every value can be adjusted in **`px` or `em`** — switch units on any slider
  at any time.
- Beyond body text and headings, spacing is now adjustable for **lists**
  (ordered and unordered, separately), **blockquotes**, **code blocks**,
  **tables**, **horizontal rules**, **callouts**, **math blocks** and
  **embedded content**.
- A rebuilt settings tab: slider controls with live value readouts, on/off
  switches for optional overrides, one-click reset, and every setting
  searchable from Obsidian's settings search on 1.13+.

## Features

### General
- **Line height** — unitless multiplier for body text (both modes).
- **Paragraph spacing** — the gap between paragraphs. In reading mode this is
  the paragraph margin; in editing mode it is the height of blank lines, so
  both modes show the exact same gap.

### Headings (H1–H6)
- Space above / space below (both modes).
- Optional font size and font weight per level, driven through Obsidian's
  `--hN-size` / `--hN-weight` variables so themes stay in sync.
- Blank lines directly below a heading are collapsed in editing mode so the
  heading's "space below" is the full gap — exactly like reading mode.

### Lists (ordered, unordered and task lists)
- Space above / below the whole list, configured **separately for ordered and
  unordered lists** (both modes).
- Space between items (both modes, via Obsidian's `--list-spacing`).
- Space between paragraphs inside a single item.
- Optional indentation per nesting level (both modes, `--list-indent`) and
  optional line height inside items.

### Other blocks
- **Blockquotes** — space above/below, gap between paragraphs inside.
- **Code blocks** — space above/below (both modes), optional internal line
  height (both modes).
- **Tables** — space above/below, optional vertical cell padding, optional
  line height (`--table-line-height`).
- **Horizontal rules** — space above/below (both modes).
- **Callouts** — space above/below (reading mode; editing mode when the callout
  is not focused).
- **Math blocks** (`$$…$$`) — space above/below (both modes).
- **Embedded content** (block transclusions `![[note]]`) — space above/below.

### Extras
- Master enable toggle plus separate *Apply in reading mode* /
  *Apply in editing mode* switches.
- One-click **Reset to defaults**.
- All length values are **`px` or `em`** — your choice, per setting.

## How it works

The plugin reads its settings and generates one CSS stylesheet that is
injected into the app. Wherever Obsidian already exposes typography CSS
variables (`--line-height-normal`, `--p-spacing`, `--list-spacing`,
`--list-indent`, `--hN-size`, `--hN-weight`, `--table-line-height`, …) the
plugin sets those variables, which keeps editing mode, reading mode, rendered
embeds, hover popovers and canvas cards consistent and theme-friendly. Where
no variable exists it emits targeted rules for `.markdown-rendered` (reading)
and `.markdown-source-view.mod-cm6` / `HyperMD-*` line classes (editing).

Editing-mode spacing is applied through line padding on CodeMirror lines
(`HyperMD-header-N`, `HyperMD-codeblock-begin/end`, `HyperMD-hr`, …) and
through the height of blank lines, using the same `:has(> br:only-child)`
blank-line detection that Obsidian itself uses.

## Installation

### From GitHub
1. Download `main.js`, `styles.css` and `manifest.json` from the
   [latest release](https://github.com/tychoon/unified-typography/releases).
2. Copy them into `<vault>/.obsidian/plugins/unified-typography/`.
3. Restart Obsidian (or reload it without saving).
4. Open **Settings → Community plugins** and enable **Unified Typography**.

### Manual install from source
Copy `manifest.json`, `main.js` and `styles.css` from this repository into
`<vault>/.obsidian/plugins/unified-typography/` — no build step is needed.

Configure everything under **Settings → Unified Typography**.

## Settings reference

| Section | Setting | Modes |
| --- | --- | --- |
| General | Line height | both |
| General | Paragraph spacing | both |
| Headings | Above / below / size / weight ×6 | both |
| Lists | Space above/below, item gap (unordered) | both |
| Lists | Space above/below, item gap (ordered) | both |
| Lists | Internal paragraph gap | reading |
| Lists | Indentation per level / line height | both |
| Blockquotes | Above / below / internal | reading |
| Code blocks | Above / below / line height | both |
| Tables | Above / below / cell padding / line height | reading (line height: both) |
| Horizontal rules | Above / below | both |
| Callouts | Above / below | reading (+ editing widgets) |
| Math blocks | Above / below | both |
| Embedded content | Above / below | reading |

## A note on the two modes

Obsidian renders **reading mode** as static HTML and **editing mode** with
CodeMirror 6, where live blocks (tables, callouts, embeds, …) appear as
embedded widgets. The two pipelines have different DOM structures and layout
engines, so while the plugin aligns typography as closely as possible,
**minor visual differences on some embedded elements between the two modes are
unavoidable**. If a difference bothers you, please report it (see below) —
reports with concrete examples help improve the alignment rules.

## Feedback

Found a spacing inconsistency between the two modes, or any other issue?
Please open an issue on
[GitHub](https://github.com/tychoon/unified-typography/issues) —
**a screenshot comparing reading mode and editing mode side by side** makes
diagnosis much faster. Feature requests and pull requests are welcome too.

## Compatibility

- Requires Obsidian **1.5.0+** (uses CSS `:has()`, available since Obsidian
  1.2).
- On Obsidian **1.13+** the settings tab is rendered declaratively, so every
  setting is searchable from Obsidian's settings search; older versions fall
  back to the same UI.
- Works with most themes; generated rules use `!important` so they win over
  theme defaults. Disable the master toggle to compare against your theme.

## License

MIT
