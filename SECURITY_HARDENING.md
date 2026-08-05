# VISCERIUM Codex security hardening

This document records security controls that require repository or Cloudflare administration. They are deliberately not enforced by code in this pull request because enabling them without checking account access can lock out maintainers or automated contributors.

## GitHub repository settings

Recommended settings under **Settings → Code security and analysis**:

- enable the dependency graph;
- enable Dependabot alerts and security updates;
- enable secret scanning and push protection when available;
- enable private vulnerability reporting;
- enable CodeQL default setup for JavaScript/TypeScript and GitHub Actions.

Recommended `main` ruleset after confirming every maintainer and integration can still contribute:

- require a pull request before merging;
- require the Build check and Timeline system checks;
- require review conversations to be resolved;
- block force pushes and branch deletion;
- require CODEOWNER approval for security-sensitive paths only when a second reliable reviewer or emergency bypass is available;
- retain an explicit owner bypass for repository recovery and connected automation.

Do not require signed commits or remove all bypass access until the GitHub connector and every normal maintenance route have been verified against those controls.

## GitHub Actions

Workflows in this repository use least-privilege token permissions where practical and pin reusable actions to immutable commit SHAs. The main checks workflow has read-only repository access. Its plugin build compares the generated bundle with the committed runtime and fails on drift. It does not create a follow-up commit. Dependabot should be allowed to keep action SHAs current.

The Timeline system workflow retains `pull-requests: write` because it posts verification comments. If those comments are no longer useful, remove the commenting steps and reduce the workflow to `contents: read` only.

The Obsidian plugin has a committed lockfile, and CI installs it reproducibly with `npm ci` before comparing the generated bundle with the tracked runtime.

## Cloudflare Pages

- Keep the production branch set to `main`.
- Disable preview deployments or restrict them to trusted branch patterns.
- Do not expose production secrets or resource bindings to preview builds.
- Keep `RESEND_API_KEY` and `TURNSTILE_SECRET_KEY` out of the static Pages build.
- Deploy the future contact form as a separate Worker with its own narrow secrets and rate limits.
- Require MFA for the Cloudflare account and review member roles regularly.

The committed `_headers` file begins with a report-only Content Security Policy. Review browser CSP reports and site behaviour before changing it to an enforced `Content-Security-Policy` header. Remove `'unsafe-inline'` only after inline scripts and styles have been migrated.

## Public content boundary

A note is eligible for the generated public Codex only when it lives under `Vault/Lore/` and uses `status: published`. Draft, review, archived, private, story, template and system notes are not publishable sources. This publication state does not make a file private when the repository itself is public.

Keep embargoed lore, contracts, personal data, credentials, restricted commissioned source files and private planning material in a private source vault. Export only approved public canon into this repository.

Published Markdown and MDX are checked for obvious active-content payloads. SVG assets are checked for scripts, `foreignObject`, inline event handlers and unsafe URL schemes. These checks are guardrails, not a substitute for reviewing changes to `.mdx` and `.svg` files as executable content.
