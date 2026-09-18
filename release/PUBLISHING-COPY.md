# Publishing copy

Author: **Tychoon**

Use the following text in the corresponding fields. Repository: https://github.com/tychoon/unified-typography. A GitHub release and community directory submission are still pending.

## Repository name

```text
unified-typography
```

## GitHub repository description

```text
Shared body and heading typography for Obsidian reading view, Live Preview, and source mode. Native settings, no Style Settings dependency.
```

## Suggested GitHub topics

```text
obsidian obsidian-plugin typography markdown live-preview
```

## Community directory name

```text
Unified Typography
```

## Community directory / manifest description

```text
Unify body line height, source line break spacing, and heading sizes and spacing across reading view, Live Preview, and source mode.
```

## Longer listing introduction

Unified Typography gives you one place to adjust the typography of your notes across reading view, Live Preview, and source mode. Set body line height, add spacing at source line breaks, and customize the size and spacing of each heading level from Obsidian's native settings panel.

Automatic line wrapping does not introduce extra paragraph gaps. Adjacent headings share a single spacing boundary, while blank separator lines are normalized between supported blocks. Changes apply immediately, and the plugin does not rewrite your Markdown files.

The initial scope covers top-level body text, ATX headings, and outer list spacing. List interiors, callouts, code blocks, tables, and other complex blocks keep their existing layout. No Style Settings dependency, account, or network access is required.

## GitHub release tag

```text
0.1.2
```

The tag must match `manifest.json` exactly. Do not add a `v` prefix.

## GitHub release title

```text
Unified Typography 0.1.2
```

Use [RELEASE-NOTES.md](RELEASE-NOTES.md) for the release body. Upload `main.js`, `manifest.json`, and `styles.css` as three individual release assets.

## Optional reviewer context

Unified Typography uses a shared Markdown classification and spacing model for reading-view postprocessing and CodeMirror 6 line decorations. It only styles classified top-level body paragraphs, ATX headings, list boundaries, and their blank separators. It does not reset every editor line or modify note files.

The plugin runs locally, uses no desktop-only runtime APIs, and makes no network requests. Obsidian and CodeMirror are externalized from the bundle. MIT notices for bundled Lezer dependencies are included in the source repository and in `main.js`.

Strict TypeScript checking, the production build, and 19 automated tests pass. Real-vault visual testing, mobile testing, and older-version compatibility testing remain pending. The manifest uses a conservative Obsidian 1.13.7 minimum version.

## Forum announcement — use after the listing is available

Title:

```text
Unified Typography: shared typography settings for reading and editing
```

Body:

Hi everyone! I'm Tychoon, and I've released Unified Typography, a small plugin for adjusting the typography of notes across reading view, Live Preview, and source mode.

You can adjust body line height, spacing at source line breaks, and the size and spacing of H1–H6 through the native settings panel. Changes take effect immediately, with no Style Settings dependency or CSS editing required.

The plugin distinguishes source line breaks from automatic wrapping and merges the spacing between adjacent headings. This first release focuses on top-level body text, ATX headings, and outer list spacing; other Markdown blocks retain their existing layout.

You can find it by searching for “Unified Typography” in Community plugins.

Source and issues: https://github.com/tychoon/unified-typography

Feedback is welcome, especially small examples showing differences between reading view and Live Preview. Please include your Obsidian version and theme when reporting an issue.

## Short announcement — use after the listing is available

Unified Typography is now available for Obsidian: shared body line height, source line break spacing, and H1–H6 typography across reading view and the editor. Native settings, immediate updates, and no Style Settings dependency. By Tychoon.
