# WorldAnvil contributor credits

Source: the original WorldAnvil HTML author notes in the supplied `articles.zip`, reviewed on 2026-10-12. Credits belong to individual articles, not the entire setting. Profile URLs live in `Site/src/data/contributors.json`.

The local `Drafts/WorldAnvil Import` migration queue is Git-ignored. This tracked reference preserves its 17 attribution tasks across 13 source articles. On filing an article, identify its true draft or published destination before applying these IDs and roles to **source frontmatter**. Do not edit the generated `Site/src/content/docs/` pages directly.

| WorldAnvil source article | Contributor ID | Role(s) | Original credited work |
| --- | --- | --- | --- |
| 7 Zeniths of Virtue | `negev1812` | Consultant | Concept scoping, support |
| 7 Zeniths of Virtue | `emberean` | Consultant | Kindness & Temperance concept support |
| Evaxi, Nadir of Envy | `negev1812` | Consultant | Concept support |
| G12 Devil's Tongue | `negev1812` | Concept creator | Concept by |
| Helix Technica | `negev1812` | Consultant | NeMeSIS program name |
| Intico Control Facility | `negev1812` | Consultant | Concept, naming and lore support |
| Intico Cypher Engines | `negev1812` | Consultant | Assistance with naming, functionality and lore |
| Myrkild | `nimrodiallibrary` | Consultant | Pride concept support |
| Ophir | `gabrielle-decker` | Consultant | Concept and character development support |
| RD-76 Dart | `negev1812` | Consultant | Concept and function support |
| The Hornd-bound | `negev1812` | Consultant, Editor | Concept and editorial support |
| The Hornd-bound | `tulcor` | Editor | Content editorial support |
| The Sevenfold Blight | `negev1812` | Consultant | Concept, quote and structure support |
| Vanaer, Nadir of Pride | `negev1812` | Consultant, Editor | Concept and editorial support |
| Xateal, Nadir of Greed | `negev1812` | Consultant | Concept support (display text Negev182, link Negev1812) |
| Xateal, Nadir of Greed | `chrispy-0` | Consultant | Concept support |
| Xateal, Nadir of Greed | `everwild` | Consultant | Concept support |

## Applied to public Lore

- `Vault/Lore/Myrkildicary/Myrkild.md` credits **only** `nimrodiallibrary` as Consultant for the original Myrkild article's "Pride concept support" note, with `source: worldanvil`.
- The Hornd-bound WorldAnvil article separately credits `negev1812` and `tulcor`. Even though the public Myrkild article incorporates Hornd-bound material, these remain attached to their original source title in this migration record until an appropriate destination is established.

## Pending migration matches

The other 12 original source titles remain in this list until their canonical destinations are verified. Every imported credit should include `source: worldanvil` when applied to a public article. Do not attribute content based only on a similar title.

- `RD-76 Dart` is a vehicle, not the same article as `The RD-76 Dart Plunge Trial` event.
- The `Xateal, Nadir of Greed` source displays **Negev182** but links to the **Negev1812** profile. This merge by URL is provisional and must be confirmed before applying the Xateal attribution.
- `Ophir` credits **Gabrielle Decker** and links to the WorldAnvil account `1337spectra`. Keep the credited display name.
- `G12 Devil's Tongue` credits Negev1812 with **Concept by**, so `Concept creator` is more precise than Author. The current contributor display supports custom text roles with the neutral ring.
- Use `Consultant` for credited concepts, naming, functionality and lore support, and `Editor` only for explicit editorial credits. Do not infer prose authorship.

Example for an article with a verified destination:

```yaml
contributors:
  - id: negev1812
    role: Consultant
    source: worldanvil
```

Preserve the original author notes so attribution can be checked during migration.
