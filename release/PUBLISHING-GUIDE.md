# Publishing guide

Prepared on September 17, 2026. Repository: https://github.com/tychoon/unified-typography. A GitHub release and community directory submission are still pending.

## Before uploading

- Author: Tychoon.
- Plugin ID and recommended repository name: `unified-typography`.
- Release version: `0.1.2`.
- License: MIT, prepared as the default license for this project. Review it before publishing.
- Minimum Obsidian version: `1.13.7`, a conservative baseline rather than a claim of older-version testing.
- Complete the real-app checks in `VALIDATION.md` before making compatibility claims.
- Verify that the name and ID are still available in the community directory. Availability has not been reserved or confirmed by this project.

## 1. Create a GitHub repository

Sign in to GitHub, create a public repository named `unified-typography`, and use the repository description in `PUBLISHING-COPY.md`.

Extract the source archive. Upload the CONTENTS of its `unified-typography` folder to the repository root, including the source files, `README.md`, `LICENSE`, `manifest.json`, `versions.json`, package files, build configuration, and notices. Do not upload just the ZIP, nest the entire project one folder below the root, or upload `node_modules`.

Keep the generated `main.js` and `styles.css` in the repository as provided. Run `npm ci` and `npm run check` before releasing. The committed source, generated bundle, and release assets should all describe the same version.

## 2. Create the GitHub release

Create a release from the uploaded commit:

- Tag: `0.1.2` (exactly, without `v`).
- Title: `Unified Typography 0.1.2`.
- Body: paste `RELEASE-NOTES.md`.
- Attach the prepared `main.js`, `manifest.json`, and `styles.css` individually.

GitHub's automatically generated source archives and the manual installation ZIP do not replace these three assets. Publish the release when ready; a draft release is not available for plugin installation.

## 3. Submit to the community directory

Go to https://community.obsidian.md, sign in with your Obsidian account, and link your GitHub account. Add the plugin using the new repository's URL. The directory reads the manifest from the repository's default branch and verifies ownership through the linked account.

Use `PUBLISHING-COPY.md` for the listing description and optional reviewer explanation. The current official flow uses the community directory submission form; an old-style pull request to `obsidian-releases` is not the primary flow described by the current documentation.

Resolve the automatic review findings. If changes are needed, increment the version, rebuild, commit, and publish matching new release assets. A prepared package or a published GitHub release does not itself mean directory approval.

## 4. Announce after approval

Once the listing is available, use the forum or short announcement from `PUBLISHING-COPY.md`. Update the README installation section to reflect the actual listing status.

## Official references

- Submission and release assets: https://docs.obsidian.md/plugins/releasing/submit-plugin
- Description and compatibility requirements: https://docs.obsidian.md/community-directory/submission-requirements-for-plugins
- Licensing and disclosures: https://docs.obsidian.md/community-directory/developer-policies
- Review and build verification: https://docs.obsidian.md/community-directory/manage-entry
