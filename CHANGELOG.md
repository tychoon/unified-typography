# Changelog

## 2.0.0

- Complete rebuild as a single plain-JavaScript plugin — no build step required.
- Every length value now supports `px` and `em` units, switchable at any time.
- Add spacing controls beyond body text and headings: ordered and unordered
  lists (separately), blockquotes, code blocks, tables, horizontal rules,
  callouts, math blocks, and embedded content.
- Keep editing mode and reading mode aligned through shared values, Obsidian
  CSS variables, and blank-line collapse rules.
- Add bilingual documentation (English default, Simplified Chinese).

## 0.1.2

- Add shared outer spacing settings for ordered, unordered, and task lists.
- Merge list boundaries with headings and body text; normalize blank separators between supported blocks.
- Preserve nested list and list item layout.
- Migrate existing settings with list defaults and add seven regression tests.

## 0.1.1

- Translate the entire settings interface, documentation, and demo note into English.
- Credit Tychoon as the author.
- Prepare the project for community directory submission with release copy, an MIT license, bundled dependency notices, and version compatibility metadata.
- Use native setting headings for heading-level groups.
- Set a conservative minimum version of Obsidian 1.13.7 pending broader compatibility testing.
- Retain the typography behavior and settings keys from 0.1.0. Existing settings are preserved when updating.

## 0.1.0

- Initial local prototype with shared body and H1–H6 typography settings.
- Add source line break spacing without adding gaps to automatic wraps.
- Merge adjacent heading spacing and compensate for blank separator lines.
- Add scoped CodeMirror decorations and reversible reading-view break markers.
