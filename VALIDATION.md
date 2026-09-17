# Validation record

Date: September 17, 2026

## Automated verification

- `npm run check`: strict TypeScript checking, esbuild bundling, and all 12 automated tests pass.
- `node --check main.js`: generated JavaScript syntax check passes.
- Release asset copies match the source project's generated files.
- Manifest and package versions are `0.1.1`; the compatibility map records Obsidian `1.13.7`.
- Author attribution is Tychoon. Interface text, documentation, and the demo note are in English.
- Bundled Lezer MIT notices are retained in `main.js` and `THIRD-PARTY-NOTICES.txt`.

Tests cover source-line boundaries, all six ATX heading levels, adjacent heading spacing, blank-line compensation, exclusions for complex blocks, decoration updates after editing, deletion of separator lines, break deduplication, preservation and restoration of inline DOM, inline code exclusions, settings validation, and fenced-code isolation.

## Real-app verification still needed

The plugin has not been installed into the user's existing vault. Automated checks are not pixel measurements in Obsidian. Before public release, use `Typography Demo.md` to check:

- Reading view and Live Preview in the default theme and the intended theme.
- Source mode, automatic wrapping, and strict line breaks.
- Setting changes, persistence after restart, reset, and disabling the plugin.
- Cursor placement on blank lines, text selection, IME input, undo, and folding.
- Pop-out windows, mobile devices, custom CSS, and other rendering plugins.
- Large-note responsiveness.

Each managed blank editor line retains 1 px. If the configured gap is smaller than the total blank-line height, a small visual difference remains. See the README for supported content and other limitations.

The minimum version was raised from the unvalidated 1.5.0 claim to a conservative 1.13.7 release baseline. This does not mean a real-app acceptance test has been completed on that version.
