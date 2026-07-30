# Myrkild Unit Database

The Myrkild unit database uses **Obsidian Bases** as a browsing and editing layer over normal Markdown notes.

> [!important] Source of truth
> The `.base` file is only a view. Each unit profile is a Markdown note whose YAML properties hold the structured data. This keeps the vault portable and lets the Codex consume the same data later.

## Open the database

Open [[Myrkild Units.base]] directly, or use the embedded card browser below.

![[Myrkild Units.base#All Units]]

The Base currently provides:

- **All Units** — cards grouped by Myrkild species.
- **CITADEL / SMOG / NEARSIGHT / ENTROPY** — era-specific card browsers.
- **Mutated / Purespawn** — origin-specific card browsers.
- **Irradiated** — irradiated variants only.
- **Database** — table view for bulk editing and comparison.

## Seed data

The first pass seeds **20 real profiles** from `Myrkild units - populated.xlsx` so the workflow can be tested without treating the entire messy WIP sheet as settled canon.

The seed covers all seven Myrkild species in both Mutated and Purespawn CITADEL profiles, plus representative irradiated profiles in SMOG, NEARSIGHT, and ENTROPY.

They live under `Drafts/Databases/Myrkild Units/` and are deliberately marked `publish: false`, `status: draft`, and `review_status: imported`.

Repeated constructs across eras are treated as era-specific profiles. This preserves era-specific threat ratings, tactics, counterplay, and visual notes rather than flattening them into one record.

## Adding a new unit

1. Create the note inside the appropriate `Drafts/Databases/Myrkild Units/<Origin>/<ERA>/` folder.
2. Apply the [[Myrkild Unit Profile]] template.
3. Give it a unique `unit_id`.
4. Fill in the structured properties needed to place and use it.
5. Add artwork using an Obsidian attachment link in `image`, for example `"[[Assets/Images/Myrkild/example.webp]]"`.
6. Review the result in [[Myrkild Units.base]].

Because the Base filters on `type: myrkild-unit` rather than folder path, a reviewed unit can later move into `Lore/` without disappearing from the database.

## Progressive Storyteller fields

The default unit template remains focused on battlefield role, tactics, weaknesses and availability.

When a specific story needs more, run **Templater: Insert template** and choose [[Add Storyteller Fields]]. For Myrkild units, this can add:

- signs of presence and encounter context;
- what informed people know or do in response;
- a consequence or complication beyond combat.

Do not add these fields simply to make the profile look complete. Follow [[Entity Authoring SOP]].

## Availability model

The first-pass constraint fields are intentionally light:

- `era` — when this profile exists.
- `locations` — known places or territories where it can occur.
- `biomes` — environmental constraints.
- `rarity` — how exceptional the encounter is.
- `natural_host` — biological prerequisite for Mutated profiles.
- `myrkild_species`, `strain`, and `subtype` — Myrkild-specific constraints.

Do not turn this into a simulation for its own sake. Add a field when it answers a useful worldbuilding question.

The practical target is:

> **Can X plausibly exist in Y place during Z era?**

If the database can answer that consistently, it is doing its job.

## Promotion to public canon

Imported notes are WIP. When a unit is ready for the Codex:

1. Review and rewrite the imported profile.
2. Resolve any source-sheet discrepancy warning.
3. Move it into an appropriate folder under `Lore/`.
4. Set `status: published`.
5. Ensure `title` and `description` are suitable for publication.
