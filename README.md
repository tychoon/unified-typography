# Unified Typography

Consistent typography for reading and writing in Obsidian.

Unified Typography brings body line height, source line break spacing, heading sizes, and list outer spacing into one native settings panel. Reading view, Live Preview, and source mode share the same values, and changes take effect immediately.

No Style Settings dependency or CSS editing required.

**Version:** 0.1.2 · **Author:** Tychoon · **License:** MIT

## What's new in 0.1.2

Ordered, unordered, and task lists now share two settings: **Space before lists** and **Space after lists**. These control the outer spacing of the whole list.

List boundaries follow the same spacing rules as headings and body text. For example, if a heading has 12 px of space after it and a list has 8 px of space before it, the gap is 12 px, rather than 20 px. Blank separator lines between supported blocks are handled by the shared spacing model.

Spacing between list items, nested indentation, and list line height retain the theme's layout. Existing settings are preserved when updating; both new list spacing values default to 8 px.

## Features

- Set body line height independently of spacing between source lines.
- Add spacing at actual line breaks without adding gaps at automatic visual wraps.
- Customize font size, space before, and space after each heading level, H1–H6.
- Set shared space before and after ordered, unordered, and task lists.
- Share all settings across reading and editing views, with immediate updates.
- Merge spacing between supported blocks instead of stacking both margins.
- Normalize blank separator lines between supported blocks.
- Preserve the theme's fonts, colors, and font weights.

The plugin changes presentation only. It does not rewrite your Markdown files.

## Installation

### Manual installation

1. Extract the provided manual installation ZIP. If a matching version is available on the [Releases page](https://github.com/tychoon/unified-typography/releases), you can instead download its `main.js`, `manifest.json`, and `styles.css` attachments.
2. Put the three files in `<your-vault>/.obsidian/plugins/unified-typography/`.
3. Restart Obsidian.
4. Open **Settings → Community plugins** and enable **Unified Typography**. Disable restricted mode if necessary.
5. Open **Settings → Unified Typography** to adjust your typography.

If your vault uses a custom configuration folder, replace `.obsidian` with that folder's name.

### Updating an existing installation

1. Disable Unified Typography in **Settings → Community plugins**.
2. Replace `main.js`, `manifest.json`, and `styles.css` in the plugin folder with files from the same new version.
3. Keep `data.json` to retain your saved settings.
4. Enable the plugin again.

After upgrading to 0.1.2, open **Settings → Unified Typography → Lists** to adjust the new spacing controls.

### Community plugins directory

The plugin has not yet been submitted or approved. After it is listed, you will be able to search for **Unified Typography** in **Settings → Community plugins → Browse**.

## Settings

| Setting | Default | Range |
| --- | --- | --- |
| Body line height | 1.65× | 1–3× |
| Source line break spacing | 8 px | 0–80 px |
| Space before lists | 8 px | 0–120 px |
| Space after lists | 8 px | 0–120 px |
| H1–H6 font sizes | 2 / 1.65 / 1.4 / 1.2 / 1.1 / 1× | 0.6–4× |
| H1–H6 space before | 24 / 20 / 16 / 14 / 12 / 10 px | 0–120 px |
| H1–H6 space after | 12 / 10 / 8 / 6 / 6 / 4 px | 0–120 px |

Heading sizes are relative to the current body font size. Heading line height is fixed at 1.25×. Use **Reset to defaults** to restore all values.

### Source line breaks versus automatic wrapping

A source line break is a newline stored in your Markdown file, such as pressing Enter while writing body text. It receives the configured extra spacing. A long line that wraps because the pane is narrow only uses the configured body line height.

Supported body text displays source newlines as visible breaks in reading view, including Markdown soft breaks. This intentionally changes how soft breaks appear when Obsidian's strict line breaks option is enabled. Two trailing spaces or a backslash before a newline also produce one break, without a duplicate gap.

### List outer spacing

Ordered lists (`1.`), unordered lists (`-`, `*`, or `+`), and task lists (`- [ ]`) use the same pair of outer spacing values. A nested list does not receive another copy of the outer gap. Automatic wrapping inside an item does not add an outer gap either.

These settings do not control list item spacing, checkbox appearance, bullet alignment, or indentation. Differences inside a list may remain between views, depending on the theme and Markdown structure.

### Spacing between blocks

| Boundary | Applied spacing |
| --- | --- |
| Body → body | Source line break spacing |
| Body → heading | Larger of body spacing and heading space before |
| Heading → body | Heading space after |
| Heading → heading | Larger of the first heading's space after and the next heading's space before |
| Heading → list | Larger of heading space after and list space before |
| List → heading | Larger of list space after and heading space before |
| Body → list | Larger of body spacing and list space before |
| List → body | List space after |
| List → list | Larger of list space after and list space before |

These rules apply when supported blocks are adjacent or separated only by blank source lines. The first supported heading or list retains its space before, and the last retains its space after.

One or more blank source lines between supported blocks act as a separator rather than repeated paragraph gaps. The editor retains 1 px per blank line to preserve an editable document position and subtracts that amount from the next block's gap. If the configured gap is smaller than the number of blank lines, a small difference from reading view remains. Leading, trailing, and out-of-scope blank lines retain their existing layout.

## Supported content and limitations

Version 0.1.2 targets top-level body paragraphs, ATX headings (`#` through `######`), and outer spacing of ordered, unordered, and task lists. List item spacing, internal blank lines, nested indentation, and list line height retain the theme layout. Setext headings, blockquotes and callouts, code blocks, tables, HTML, custom embeds, and paragraphs containing images keep their existing layout.

The plugin applies styles only to classified content. It does not reset every `.cm-line`. Themes that add spacing to outer containers or plugins that rewrite rendered Markdown can still cause differences. List edges containing rendered widgets (such as code blocks or embeds) need real-app validation. Complex inline content, folded headings, and editor controls may also differ between views. Newlines inside rendered inline code, math, and embeds are not split.

- Requires Obsidian 1.13.7 or later. This is a conservative release baseline; older versions have not been validated.
- Uses the modern CodeMirror 6 editor. The legacy editor, Canvas, PDF views, and Obsidian Publish are outside the scope.
- Contains no desktop-only runtime APIs, but mobile behavior has not been tested on a device.
- Reclassifies the document when its text changes. Very large notes still need performance testing.
- Automated tests have passed; real-vault visual acceptance testing is still pending. See [VALIDATION.md](VALIDATION.md).

Open [Typography Demo.md](Typography%20Demo.md) in a test vault to compare views and check wrapping, blank lines, adjacent headings, and ordered, unordered, nested, loose, and task lists.

## Privacy

The plugin runs locally. It makes no network requests, collects no analytics, requires no account, and has no paid features. It processes the note content provided by Obsidian for display and saves settings in its plugin `data.json` file. It does not directly access files outside your vault.

## Development

Requires Node.js 20 or later.

```sh
npm ci
npm run check
npm run dev
```

`npm run check` runs strict TypeScript checking, bundles `main.js`, and runs the automated tests. Version 0.1.2 passes all 19 tests covering spacing boundaries, Markdown classification, reading-view DOM handling, editor updates, and settings migration. The build externalizes Obsidian and CodeMirror so the plugin uses the host's runtime instances.

| File | Responsibility |
| --- | --- |
| `main.ts` | Lifecycle, native settings, reading postprocessor, cleanup |
| `src/model.ts` | Shared Markdown classification and spacing rules |
| `src/editor.ts` | CodeMirror line decorations |
| `src/reading.ts` | Reversible reading-view break markers |
| `src/settings.ts` | Defaults, validation, and CSS variables |
| `styles.css` | Styles scoped to classified content |

## Reporting issues

Open an issue in the [GitHub issue tracker](https://github.com/tychoon/unified-typography/issues). Include your Obsidian version, platform, theme, relevant CSS snippets or rendering plugins, and a small Markdown example. If possible, include screenshots of both views and the settings used. Do not include private note content.

## License

MIT. See [LICENSE](LICENSE). Bundled Lezer libraries retain their MIT notices in [THIRD-PARTY-NOTICES.txt](THIRD-PARTY-NOTICES.txt) and the generated `main.js`.

This is an independent community project and is not affiliated with or endorsed by Obsidian.
