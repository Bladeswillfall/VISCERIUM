# Privacy notice draft

> **Draft only. Do not publish this file as the site's final privacy notice yet.**
>
> Last updated: 15 September 2026

You should be able to read VISCERIUM without introducing yourself first.

We collect less on purpose. No advertising profiles. No cross-site behavioural tracking. No data hoarding because it might be useful one day.

## Read without an account

You do not need an account to browse the Codex. Your browser still has to talk to the server, so hosting and security systems may temporarily process technical data such as IP addresses, request times, requested URLs and browser details. That is infrastructure, not a reader profile.

## Analytics without surveillance

VISCERIUM uses a self-hosted Rybbit service at `analytics.viscerium.co.uk` to understand broad site use, including pages read, referrals, browser and device types, approximate location and navigation patterns.

Rybbit raw events are the short-lived source for reporting. They currently remain available while the aggregate archive is validated. The intended production retention is 60 days. Do not enable that shorter TTL until the aggregate backfill and source-comparison checks pass.

For long-term reporting, VISCERIUM stores selected daily and monthly aggregates in the separate `viscerium_metrics` analytics archive. The archive keeps counts and reporting dimensions, but does not copy visitor IDs, session IDs, IP addresses, city, coordinates or full query strings. Standard UTM campaign values can be retained as reporting dimensions.

Metabase is an internal reporting layer over that aggregate archive. It does not add tracking code to public Codex pages.

Rybbit visitor identifiers are salted daily, deliberately breaking persistent day-to-day tracking. Blocking analytics does not stop the Codex from working. We accept less precise long-term counts in exchange for knowing less about you.

## Comments

Comments use VISCERIUM-hosted Remark42 at `comments.viscerium.co.uk`. Anonymous commenting is supported.

If you sign in through a provider, the service receives the identity needed to associate you with your comments. It also processes what you publish and enough metadata to display, moderate and protect the conversation. Short-lived network signals may be used for rate limiting, spam prevention and moderation.

Published comments remain until you remove them where available, a moderator removes them, or an applicable deletion request is completed. Deleted data may remain in rotating backups until those backups expire.

## What stays in your browser

The Codex uses local browser storage for site preferences and state, including sensitive-media preferences, remembered era context and a local identifier used by Kudos. Clear VISCERIUM site data in your browser to remove it.

Remark42 and any sign-in provider you choose may also use cookies or similar storage to keep you signed in. VISCERIUM does not use advertising cookies or advertising profiles.

## Open-web features

VISCERIUM can use Webmention.io to receive public references to Codex pages from other websites. Webmentions are public web references, not private messages.

## Security

We use HTTPS, restrictive browser and security policies, and hardened DNS and network configuration where those controls are available. Cloudflare-served connections can use hybrid post-quantum TLS key agreement when the browser supports it.

We avoid invasive browser fingerprinting by default and aim to give each service only the data it needs. Your browser, operating system, internet provider and DNS resolver are outside our control. No website can promise perfect anonymity or perfect security. We will not pretend otherwise.

## What we do not do

We do not sell visitor data, build advertising profiles, track readers across unrelated websites, require an account to read public material, or collect personal information merely because it may become useful later. If that changes, this policy changes with it.

## Logs and retention

Servers keep logs. Hosting, network and security systems may temporarily record IP addresses, timestamps, requested URLs, browser details and suspicious requests so we can run the site, diagnose faults and investigate abuse. We do not use those logs as a second analytics system.

Analytics follows a two-layer retention model. Raw Rybbit events are intended to expire after 60 days once the validation gate above is complete. The long-term aggregate archive has no automatic expiry at present because it is used for historical trend reporting and is designed not to contain raw visitor or session identifiers.

If analytics instrumentation begins collecting user-entered or other potentially identifying event properties, review the archive and retention policy before keeping those properties long term. Replace generic property retention with an explicit allow-list where needed.

Before publication, confirm that the 60-day Rybbit TTL is active and add verified retention periods for infrastructure logs, moderation records and backups.

## Who is responsible

This is a publication blocker, not wording to hide behind.

Before the privacy notice goes live, identify the legal person or organisation that actually decides why and how VISCERIUM processes personal data. Do not name a planned company, a brand, or another entity unless it exists and is genuinely the controller.

The final notice must also give people a reliable way to contact that controller about privacy matters. A dedicated privacy email address or the VISCERIUM Contact page can provide a contact route, but the final setup must be checked against any separate legal requirement to publish a postal or geographic address.

Do not publish a residential address merely to remove this drafting note. If VISCERIUM later operates through an incorporated company, use the company only if it is actually the controller. A suitable registered or service address can then be considered separately from a home address.

Before publication, also confirm the lawful basis for each processing purpose, relevant recipients and international transfers, and the applicable complaint route to the supervisory authority.

## Your information and rights

Depending on your circumstances, data-protection law may give you rights to access, correct, delete, restrict or object to processing of personal data about you. Remark42 users should retain the export and deletion options provided by the comment system. Privacy questions and requests can be sent through the VISCERIUM Contact page once that route is confirmed for privacy requests.

Privacy-friendly analytics has a consequence. If a record cannot be linked to you, we may not be able to find "your" record either. We will not collect extra identifying information just to reconnect you with data deliberately collected without your identity.

## Changes

If VISCERIUM materially changes how it handles data, update this page and the date above. We would rather rewrite the policy than stretch old wording until it stops being true.

Knowing less is part of the design.
