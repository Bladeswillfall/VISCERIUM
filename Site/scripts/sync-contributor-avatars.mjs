import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import contributorRegistry from '../src/data/contributors.json' with { type: 'json' };
import {
  generateSolaconSvg,
  githubUsernameFromUrl,
} from '../src/lib/contributors.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(here, '..');
const publicRoot = path.join(siteRoot, 'public', 'assets', 'contributors');
const assetsPath = path.join(siteRoot, 'src', 'data', 'contributor-avatars.json');
const fallbackPath = '/assets/contributors/fallback.svg';

async function writeSolacon(id, profile, assets) {
  const fileName = `${id}.svg`;
  const outputDir = path.join(publicRoot, 'generated');
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, fileName), generateSolaconSvg(profile.name), 'utf8');
  assets[id] = `/assets/contributors/generated/${fileName}`;
}

async function writeGithubAvatar(id, profile, username, assets) {
  const response = await fetch(`https://github.com/${encodeURIComponent(username)}.png?size=192`, {
    headers: { 'User-Agent': 'VISCERIUM contributor avatar sync' },
    redirect: 'follow',
  });
  if (!response.ok) throw new Error(`GitHub returned ${response.status}.`);

  const contentType = response.headers.get('content-type')?.split(';')[0] ?? '';
  const extension = new Map([
    ['image/png', 'png'],
    ['image/jpeg', 'jpg'],
    ['image/webp', 'webp'],
    ['image/gif', 'gif'],
  ]).get(contentType);
  if (!extension) throw new Error(`GitHub returned ${contentType || 'an unsupported content type'}.`);

  const fileName = `${username.toLowerCase()}.${extension}`;
  const outputDir = path.join(publicRoot, 'github');
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, fileName), Buffer.from(await response.arrayBuffer()));
  assets[id] = `/assets/contributors/github/${fileName}`;
}

const assets = { fallback: fallbackPath };

for (const [id, profile] of Object.entries(contributorRegistry.profiles)) {
  const username = githubUsernameFromUrl(profile.url);
  if (username) {
    try {
      await writeGithubAvatar(id, profile, username, assets);
      continue;
    } catch (error) {
      console.warn(`Could not cache GitHub avatar for ${profile.name}: ${error.message}`);
    }
  }

  try {
    await writeSolacon(id, profile, assets);
  } catch (error) {
    console.warn(`Could not generate Solacon for ${profile.name}: ${error.message}`);
    assets[id] = fallbackPath;
  }
}

await fs.writeFile(assetsPath, `${JSON.stringify(assets, null, 2)}\n`, 'utf8');
console.log(`Updated ${path.relative(siteRoot, assetsPath)} for ${Object.keys(contributorRegistry.profiles).length} contributors.`);
