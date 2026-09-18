# Unified Typography 0.1.2

Use one set of typography settings across reading view, Live Preview, and source mode.

## Features

- Adjustable body line height and spacing at source line breaks.
- Shared outer spacing for ordered, unordered, and task lists.
- Independent font size, space before, and space after for H1–H6.
- Immediate updates through Obsidian's native settings panel.
- Automatic visual wrapping without extra paragraph gaps.
- Shared spacing rules for adjacent headings and blank separators.
- Local processing, with no account, network requests, or Style Settings dependency.

## Changes in this release

Adds shared space before and after ordered, unordered, and task lists. List boundaries merge with adjacent heading and body spacing. Nested indentation and internal list item spacing retain the theme layout. Existing settings are preserved; list spacing defaults to 8 px before and after.

## Manual installation

Place `main.js`, `manifest.json`, and `styles.css` in `<your-vault>/.obsidian/plugins/unified-typography/`, restart Obsidian, and enable Unified Typography under Community plugins.

## Scope

This early release adjusts top-level body paragraphs, ATX headings, and outer list spacing. Other Markdown blocks retain their existing layout. Theme-specific and mobile visual validation is still pending; please report reproducible differences with a small sample note.

Strict TypeScript checking, bundling, and all 19 automated tests pass.
