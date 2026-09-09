# Solacon adaptation notice

VISCERIUM uses a compact adaptation of the Solacon visual-hash path-generation algorithm for generated contributor avatars.

Upstream project: https://github.com/misaki-web/solacon

The adapted implementation is in `Site/src/lib/contributors.mjs`. It removes the upstream browser UI, download code, random generation, and configuration controls. VISCERIUM supplies a contributor name as the deterministic seed and writes the generated SVG during the manual contributor-avatar sync command.

The upstream code is MIT-licensed. See [`Solacon-MIT.txt`](./Solacon-MIT.txt).
