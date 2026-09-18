# Unified Typography 0.1.1

Use one set of typography settings across reading view, Live Preview, and source mode.

## Features

- Adjustable body line height and spacing at source line breaks.
- Independent font size, space before, and space after for H1–H6.
- Immediate updates through Obsidian's native settings panel.
- Automatic visual wrapping without extra paragraph gaps.
- Shared spacing rules for adjacent headings and blank separators.
- Local processing, with no account, network requests, or Style Settings dependency.

## Changes in this release

The interface, documentation, and demo note are now entirely in English. The release includes licensing and publishing materials. Existing settings from 0.1.0 are preserved. The minimum supported version is now Obsidian 1.13.7.

## Manual installation

Place `main.js`, `manifest.json`, and `styles.css` in `<your-vault>/.obsidian/plugins/unified-typography/`, restart Obsidian, and enable Unified Typography under Community plugins.

## Scope

This early release adjusts top-level body paragraphs and ATX headings. Other Markdown blocks retain their existing layout. Theme-specific and mobile visual validation is still pending; please report reproducible differences with a small sample note.

Strict TypeScript checking, bundling, and all 12 automated tests pass.

