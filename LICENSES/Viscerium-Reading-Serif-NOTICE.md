# Viscerium Reading Serif notice

## Upstream

- Source: Lora variable fonts supplied with the typography assets for this repository.
- Copyright: Copyright 2011 The Lora Project Authors (https://github.com/cyrealtype/Lora-Cyrillic), with Reserved Font Name "Lora".
- License: SIL Open Font License 1.1. See `OFL-1.1-Lora.txt`.

## VISCERIUM modifications

The WOFF2 files under `Vault/.obsidian/snippets/fonts/` are modified subsets for offline Obsidian reading and writing. They:

- were converted from TTF to WOFF2;
- are split by Unicode range for basic Latin, Latin-1, Latin Extended-A, common punctuation, currency, arrows, and the minus sign;
- keep the 400–700 variable weight axis; and
- use the primary family name `Viscerium Reading Serif` because the upstream reserved name `Lora` may not be used for modified versions.

True italic subsets cover basic Latin letters and Latin-1 characters. Other italic characters may be synthesized from the regular face or fall through to the system serif stack declared in `Typography.css`.
