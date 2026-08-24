# Comments privacy and retention

This document defines the operational privacy baseline for VISCERIUM comments. It should remain consistent with the public privacy text served alongside the comment interface.

## Data used to provide comments

Remark42 stores the comment content and metadata required to display and moderate it, together with the identity supplied by the selected sign-in method. Anonymous commenting remains supported. OAuth credentials themselves are handled by the configured provider and Remark42; VISCERIUM must not log access tokens, session cookies or OAuth client secrets.

The abuse-prevention layer may process short-lived network and request signals such as source address context, request timing, target article, account identifier and submitted links. These signals are used to rate-limit, detect abuse and protect the service. They are not public identity claims and must not be used to announce that two users are the same person.

## Minimisation

Only collect information needed to run, secure, moderate and recover the service. Do not add invasive browser fingerprinting by default. Do not log complete drafts or routine comment bodies in infrastructure logs. Security logs should record compact event metadata and redact credentials and authentication headers.

User-uploaded comment images and files are disabled. This deliberately avoids creating a second store of potentially sensitive media, EXIF metadata and copyright material. Avatars supplied through supported identities may still be cached by Remark42 as part of its normal authentication flow.

## Retention

Published comments remain until removed by the author where supported, by moderation, or through an applicable data-deletion request. Operational abuse/rate-limit records should expire automatically after the shortest period that still provides useful protection. Idempotency records should be short lived. Security/audit records may be kept longer when needed to understand moderation or repeated abuse, but should avoid storing unnecessary raw network identifiers.

Backups follow a rotating retention policy and may preserve recently deleted data until the relevant backup expires. Off-site backups must be encrypted and access-controlled separately from the public VPS. Restore access is restricted to administrators who need it for recovery.

## Deletion and correction

Remark42's user-data deletion/export mechanisms should be preserved. Requests requiring administrator assistance should be handled through the site's contact route. Deleting data from the live service does not imply immediate deletion from every immutable or rotating backup; expired backups should remove it through the normal retention cycle unless law or incident response requires a different hold.

## Providers

The public comment service currently depends on the VISCERIUM-hosted Remark42 instance and any authentication provider a reader chooses to use. Link reputation or anti-bot providers must receive no more data than needed for the relevant security decision. If a URL reputation lookup is enabled, submit only the URL required for that check; do not send the surrounding comment or user identity unless the provider explicitly requires it and the privacy policy has been updated first.
