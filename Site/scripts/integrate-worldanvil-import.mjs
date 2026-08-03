import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { isMainModule } from './script-entry.mjs';

const DEFAULT_VAULT = path.resolve(process.cwd(), '../Vault');
const IMPORT_REL = 'Drafts/WorldAnvil Import';
const REVIEW_START = '<!-- worldanvil-migration-review:start -->';
const REVIEW_END = '<!-- worldanvil-migration-review:end -->';
const STORY_TYPES = new Set(['item', 'fauna', 'flora', 'fungi']);
const WORLDANVIL_TYPES = new Set(['Article','Condition','Ethnicity','Formation','Item','Landmark','Language','Law','Location','Material','MilitaryConflict','Organization','Person','Plot','Profession','Rank','Ritual','Settlement','Species','Technology','Vehicle']);
const UNSUPPORTED = new Set(['Vehicle','Formation','Law','Profession','Rank','Condition','Ritual','Language','Material','Ethnicity','Technology','Plot']);
const REL_HINTS = ['title: "Leadership"','title: "Membership"','title: "Succession"','title: "Members"','Related historical events','label: "Rulers"','label: "Leader"','Sister Nation','Facility opperators','Key holders'];

function yamlScalar(value) { return JSON.stringify(String(value)); }
function yamlList(key, values) { return [`${key}:`, ...values.map((value) => `  - ${yamlScalar(value)}`)]; }
function hasKey(frontmatter, key) { return new RegExp(`^${key}:`, 'm').test(frontmatter); }
function splitFrontmatter(markdown) {
  const text = String(markdown ?? '').replace(/\r\n/g, '\n');
  if (!text.startsWith('---\n')) return { frontmatter: '', body: text, hasFrontmatter: false };
  const end = text.indexOf('\n---\n', 4);
  if (end === -1) return { frontmatter: '', body: text, hasFrontmatter: false };
  return { frontmatter: text.slice(4, end), body: text.slice(end + 5), hasFrontmatter: true };
}
function frontmatterTitle(frontmatter, fallback) {
  const m = frontmatter.match(/^title:\s*(.+)$/m);
  if (!m) return fallback;
  return m[1].trim().replace(/^['"]|['"]$/g, '') || fallback;
}
function removeTopLevelProperty(frontmatter, key) {
  const lines = String(frontmatter ?? '').split('\n');
  const output = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (!new RegExp(`^${key}:`).test(lines[index])) {
      output.push(lines[index]);
      continue;
    }
    index += 1;
    while (index < lines.length && (lines[index].trim() === '' || /^\s+/.test(lines[index]))) index += 1;
    index -= 1;
  }
  return output.join('\n').trimEnd();
}
function sourceInfo(file) {
  const base = path.basename(file, '.md');
  const dash = base.indexOf('-');
  const sourceType = dash === -1 ? 'Article' : base.slice(0, dash);
  const rest = dash === -1 ? base : base.slice(dash + 1);
  const title = rest.replace(/-[A-Za-z0-9]{3}$/,'');
  return { sourceType, title };
}
export function isWorldAnvilArticleFile(file) {
  if (!String(file).endsWith('.md') || !/-[A-Za-z0-9]{3}\.md$/i.test(file)) return false;
  return WORLDANVIL_TYPES.has(sourceInfo(file).sourceType);
}
function normalType(file, sourceType, data) {
  for (const [type, files] of Object.entries(data.speciesTypes ?? {})) if (files.includes(file)) return { type, typeReview: false };
  const map = { Person:'character', Organization:'faction', Settlement:'location', Landmark:'location', MilitaryConflict:'event', Item:'item', Location:'location', Article:'article', Species:'species' };
  return { type: map[sourceType] ?? 'article', typeReview: sourceType === 'Species' || UNSUPPORTED.has(sourceType) };
}
function erasFor(file, data) {
  for (const [key, files] of Object.entries(data.eras ?? {})) if (files.includes(file)) return key.split('|');
  return [];
}
function locationKind(sourceType) {
  if (sourceType === 'Settlement') return 'settlement';
  if (sourceType === 'Landmark') return 'site';
  return null;
}
function vaultLink(targetPath, targetTitle, display) {
  const pathNoExt = targetPath.replace(/\.md$/i, '');
  return display === targetTitle ? `[[${pathNoExt}]]` : `[[${pathNoExt}|${display}]]`;
}
export function convertLegacyArticleLinks(body, titleTargets) {
  let converted = 0;
  const output = String(body).replace(/\[([^\]]+)\]\((?:https?:\/\/www\.worldanvil\.com)?(\/w\/viscerium\/a\/[^)\s]+)\)/g, (whole, display) => {
    const candidates = titleTargets.get(display.trim().toLocaleLowerCase('en')) ?? [];
    const current = candidates.filter((candidate) => candidate.current);
    const target = current.length === 1 ? current[0] : (current.length === 0 && candidates.length === 1 ? candidates[0] : null);
    if (!target) return whole;
    converted += 1;
    return vaultLink(target.path, target.title, display.trim());
  });
  return { body: output, converted };
}
function remainingLegacyLinks(text) {
  return (String(text).match(/(?:https?:\/\/www\.worldanvil\.com)?\/w\/viscerium\/(?:a|h)\/[A-Za-z0-9_\-/%]+/g) ?? []).length;
}
function legacyAssetRefs(text) {
  const s = String(text);
  return (s.match(/\[img:[^\]]+\]|!\[[^\]]*\]\((?!https?:\/\/|Assets\/|\/Assets\/)[^)]+\)|\/uploads\/images\//gi) ?? []).length;
}
function relationshipReviewNeeded(frontmatter) { return REL_HINTS.some((hint) => frontmatter.includes(hint)); }

export function descriptionFromBody(body, fallbackTitle) {
  const blocks = String(body ?? '').replace(/\r\n/g, '\n').split(/\n\s*\n/);
  for (const block of blocks) {
    const raw = block.replace(/\u00a0/g, ' ').trim();
    if (!raw || /^(?:#{1,6}\s|>|!\[|\[!\[|```|~~~|<!--)/.test(raw)) continue;
    if (/all artwork that isn['’]t an original creation/i.test(raw)) continue;
    let text = raw
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g, (_, target, display) => display || target)
      .replace(/<[^>]+>/g, ' ')
      .replace(/[*_~`]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (text.length < 20) continue;
    const sentence = text.match(/^(.{20,240}?[.!?])(?:\s|$)/)?.[1];
    if (sentence) return sentence;
    if (text.length <= 240) return text;
    const clipped = text.slice(0, 240).replace(/\s+\S*$/, '').trim();
    if (clipped) return `${clipped}…`;
  }
  return String(fallbackTitle ?? '').trim();
}

function checkedReviewTasks(body) {
  const match = String(body).match(new RegExp(`${REVIEW_START}([\\s\\S]*?)${REVIEW_END}`, 'm'));
  return new Set([...(match?.[1] ?? '').matchAll(/^- \[[xX]\] (.+)$/gm)].map((entry) => entry[1]));
}
function reviewBlock(tasks, checkedTasks) {
  if (!tasks.length) return '';
  return `${REVIEW_START}\n## Import review\n\n${tasks.map((task) => `- [${checkedTasks.has(task) ? 'x' : ' '}] ${task}`).join('\n')}\n${REVIEW_END}`;
}
function replaceReviewBlock(body, tasks, checkedTasks) {
  const re = new RegExp(`${REVIEW_START}[\\s\\S]*?${REVIEW_END}\\n?`, 'm');
  const cleaned = String(body).replace(re, '').trimEnd();
  const block = reviewBlock(tasks, checkedTasks);
  return block ? `${cleaned}\n\n${block}\n` : `${cleaned}\n`;
}
function buildIssues({ sourceType, typeReview, eras, duplicate, existingMatch, relationshipReview, unresolvedLinks, assetRefs }) {
  const issues = [];
  if (!eras.length) issues.push('needs-era');
  if (sourceType === 'Species' && typeReview) issues.push('needs-type-review');
  if (UNSUPPORTED.has(sourceType)) issues.push('legacy-type-review');
  if (duplicate) issues.push('duplicate-title');
  if (existingMatch) issues.push('existing-codex-match');
  if (relationshipReview) issues.push('relationship-review');
  if (unresolvedLinks) issues.push('unresolved-legacy-links');
  if (assetRefs) issues.push('missing-inline-assets');
  return issues;
}
export function issueTasks({ sourceType, title, issues }) {
  const tasks = [];
  if (issues.includes('needs-type-review')) tasks.push('Classify this legacy World Anvil Species entry for the Codex (species, fauna/flora/fungi, Naranor, or the Myrkild workflow as appropriate).');
  if (issues.includes('legacy-type-review')) tasks.push(`Decide whether legacy World Anvil type **${sourceType}** should remain a general article or move into an existing/dedicated Codex structure.`);
  if (issues.includes('needs-era')) tasks.push('Place this import in the correct VISCERIUM era or eras if its chronology is established.');
  if (issues.includes('duplicate-title')) tasks.push(`Disambiguate this imported **${title}** from the other World Anvil record with the same title before final filing.`);
  if (issues.includes('existing-codex-match')) tasks.push('Reconcile this legacy import with the existing Codex note of the same title; preserve the current Codex as authoritative.');
  if (issues.includes('relationship-review')) tasks.push('Review the imported leadership/membership/succession data and promote only continuity-significant links into `relationships:` or `related:`.');
  if (issues.includes('unresolved-legacy-links')) tasks.push('Resolve the remaining legacy World Anvil links that could not be mapped safely to a unique Obsidian note.');
  if (issues.includes('missing-inline-assets')) tasks.push('Resolve legacy inline image references against `Assets/Images` / `Assets/Maps`; do not assume the absent export image is intentionally missing.');
  return tasks;
}
function addFrontmatter(existing, info) {
  const lines = [];
  const addScalar = (key, value) => { if (value !== null && value !== undefined && value !== '' && !hasKey(existing,key)) lines.push(`${key}: ${yamlScalar(value)}`); };
  const addList = (key, values) => { if (values?.length && !hasKey(existing,key)) lines.push(...yamlList(key, values)); };
  addScalar('title', info.title);
  addScalar('status','draft');
  addScalar('type',info.type);
  if (STORY_TYPES.has(info.type)) addScalar('description', info.description);
  addScalar('development_level','stub');
  if (info.locationKind) addScalar('location_kind',info.locationKind);
  if (info.itemType) addScalar('item_type',info.itemType);
  if (STORY_TYPES.has(info.type)) addList('eras',info.eras);
  else if (info.eras.length === 1) addScalar('era',info.eras[0]);
  else addList('eras',info.eras);
  addList('tags',info.tags);
  addScalar('import_source','worldanvil');
  addScalar('import_source_type',info.sourceType);
  addScalar('import_source_file',info.file);
  addList('import_issues',info.issues);
  return lines;
}
async function markdownFiles(root) { return (await Array.fromAsync(fs.glob('**/*.md', { cwd: root }))).sort(); }
async function titleIndex(vault, importFiles) {
  const index = new Map();
  const add = (title, entry) => {
    const key = title.toLocaleLowerCase('en').trim();
    if (!key) return;
    const list = index.get(key) ?? [];
    list.push(entry); index.set(key,list);
  };
  for (const rel of await markdownFiles(vault)) {
    if (rel.startsWith(`${IMPORT_REL}/`) || rel.startsWith('System/') || rel.startsWith('Templates/') || rel.startsWith('Demo/') || rel.startsWith('Stories/')) continue;
    const raw = await fs.readFile(path.join(vault,rel),'utf8');
    const parts = splitFrontmatter(raw);
    const fallback = path.basename(rel,'.md');
    const title = frontmatterTitle(parts.frontmatter,fallback);
    add(title, { path: rel, title, current: true });
  }
  for (const file of importFiles) {
    const { title } = sourceInfo(file);
    add(title,{ path: `${IMPORT_REL}/${file}`, title, current: false });
  }
  return index;
}
export function importBase() {
  return `filters:\n  and:\n    - file.inFolder("Drafts/WorldAnvil Import")\n    - import_source == "worldanvil"\nproperties:\n  title:\n    displayName: Article\n  type:\n    displayName: Codex type\n  import_source_type:\n    displayName: World Anvil type\n  era:\n    displayName: Era\n  eras:\n    displayName: Eras\n  tags:\n    displayName: Tags\n  import_issues:\n    displayName: Migration issues\n  development_level:\n    displayName: Development\n  file.mtime:\n    displayName: Modified\nviews:\n  - type: cards\n    name: Cards\n    order: [title, type, era, eras, import_issues]\n    sort:\n      - property: title\n        direction: ASC\n    cardSize: 260\n  - type: table\n    name: All Imports\n    order: [title, type, import_source_type, era, eras, tags, import_issues, file.mtime]\n    sort:\n      - property: title\n        direction: ASC\n  - type: table\n    name: Needs era\n    filters:\n      and:\n        - list(import_issues).contains("needs-era")\n    order: [title, type, import_source_type, import_issues]\n  - type: table\n    name: Type review\n    filters:\n      or:\n        - list(import_issues).contains("needs-type-review")\n        - list(import_issues).contains("legacy-type-review")\n    order: [title, import_source_type, type, import_issues]\n  - type: table\n    name: Existing matches\n    filters:\n      and:\n        - list(import_issues).contains("existing-codex-match")\n    order: [title, type, import_issues]\n  - type: table\n    name: Relationship review\n    filters:\n      and:\n        - list(import_issues).contains("relationship-review")\n    order: [title, type, import_issues]\n  - type: table\n    name: Link and asset review\n    filters:\n      or:\n        - list(import_issues).contains("unresolved-legacy-links")\n        - list(import_issues).contains("missing-inline-assets")\n    order: [title, type, import_issues]\n`;
}
function inbox(stats) {
  const count = (id) => stats.issues.get(id) ?? 0;
  return `---\ntitle: "World Anvil Migration Review"\nstatus: draft\ntype: article\ndevelopment_level: stub\n---\n# World Anvil Migration Review\n\nUse [[System/Bases/World Anvil Import.base|World Anvil Import]] to browse the imported corpus. Individual notes contain precise review tasks where judgement is still required.\n\n## Migration-level next actions\n\n- [ ] Review the **${count('needs-era')}** imports whose era could not be established from the export metadata.\n- [ ] Review the **${count('needs-type-review') + count('legacy-type-review')}** imports whose final Codex structure/type still needs judgement.\n- [ ] Reconcile the **${count('existing-codex-match')}** imports that have an existing Codex note with the same canonical title.\n- [ ] Review meaningful structured relationships for the **${count('relationship-review')}** imports carrying leadership, membership, succession or similar legacy data.\n- [ ] Resolve link/asset exceptions: **${count('unresolved-legacy-links')}** note(s) with legacy links and **${count('missing-inline-assets')}** note(s) with legacy inline asset references.\n\n## Current state\n\n- Total imported articles: **${stats.total}**\n- Mechanically clean (no migration issue flags): **${stats.clean}**\n- Still carrying one or more review flags: **${stats.withIssues}**\n\n→ [[System/Imports/WorldAnvil/report|Full generated report]]\n\n> [!tip]\n> These are migration decisions, not a completeness score. Checking a migration-level task does not automatically resolve the corresponding note-level tasks.\n`;
}
function report(stats) {
  const typeLines = [...stats.types].sort((a,b)=>b[1]-a[1]).map(([k,v])=>`- ${k}: ${v}`).join('\n');
  const issueLines = [...stats.issues].sort((a,b)=>b[1]-a[1]).map(([k,v])=>`- ${k}: ${v}`).join('\n');
  return `# World Anvil integration report\n\nGenerated by \`npm run migration:worldanvil:integrate:write\`.\n\n## Coverage\n\n- Imported notes: ${stats.total}\n- Notes changed in this run: ${stats.changed}\n- Additional legacy body links converted in this run: ${stats.linksConverted}\n- Mechanically clean: ${stats.clean}\n- Carrying review flags: ${stats.withIssues}\n\n## Codex type assignment\n\n${typeLines || '- None'}\n\n## Remaining review workload\n\n${issueLines || '- None'}\n\n## Working views\n\n- [[System/Bases/World Anvil Import.base|World Anvil Import Base]]\n- [[Drafts/Inbox/World Anvil Migration Review|World Anvil Migration Review]]\n- [[System/Creator Tasks|Creator Tasks]]\n\nCurrent Codex notes remain authoritative over legacy World Anvil material.\n`;
}
function updateHome(text) {
  let out = text;
  const taskLink = '> > → [[System/Creator Tasks|View all creator tasks]]';
  const reviewLink = '> > → [[Drafts/Inbox/World Anvil Migration Review|World Anvil migration review]]';
  if (!out.includes(reviewLink) && out.includes(taskLink)) out = out.replace(taskLink, `${taskLink}\n> > ${reviewLink.slice(4)}`);
  const baseNeedle = '> > **[[System/Bases/Myrkild Units.base|Myrkild Units]]**  \n> > Specialised construct database for answering whether a Myrkild can plausibly exist in a particular era, place and context.';
  const addition = `${baseNeedle}\n> >\n> > **[[System/Bases/World Anvil Import.base|World Anvil Import]]**  \n> > Temporary migration browser across every imported World Anvil record, including type, era, tags and unresolved review flags.`;
  if (!out.includes('[[System/Bases/World Anvil Import.base|World Anvil Import]]') && out.includes(baseNeedle)) out = out.replace(baseNeedle,addition);
  return out;
}
function parseArgs(argv) {
  const args={ write:false, vault:DEFAULT_VAULT };
  for (let i=0;i<argv.length;i++) {
    if (argv[i]==='--write') args.write=true;
    else if (argv[i]==='--vault') { i++; args.vault=path.resolve(argv[i]); }
    else if (argv[i]==='--help' || argv[i]==='-h') args.help=true;
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  return args;
}
export async function runIntegration({ vault=DEFAULT_VAULT, write=false }={}) {
  const importDir=path.join(vault,IMPORT_REL);
  const data=JSON.parse(await fs.readFile(path.join(vault,'System/Imports/WorldAnvil/integration-data.json'),'utf8'));
  const importFiles=(await fs.readdir(importDir)).filter(isWorldAnvilArticleFile).sort();
  const titles=new Map();
  for (const f of importFiles) { const t=sourceInfo(f).title.toLocaleLowerCase('en'); titles.set(t,(titles.get(t)??0)+1); }
  const targets=await titleIndex(vault,importFiles);
  const stats={ total:importFiles.length, changed:0, linksConverted:0, clean:0, withIssues:0, types:new Map(), issues:new Map() };
  for (const file of importFiles) {
    const full=path.join(importDir,file); const raw=await fs.readFile(full,'utf8'); const parts=splitFrontmatter(raw); const src=sourceInfo(file);
    const managedFrontmatter=removeTopLevelProperty(parts.frontmatter,'import_issues');
    const nt=normalType(file,src.sourceType,data); const eras=erasFor(file,data); const tags=data.tags?.[file]??[]; const itemType=data.itemTypes?.[file]??null;
    const key=src.title.toLocaleLowerCase('en'); const currentMatches=(targets.get(key)??[]).filter((x)=>x.current);
    const converted=convertLegacyArticleLinks(parts.body,targets); const unresolved=remainingLegacyLinks(converted.body); const assets=legacyAssetRefs(converted.body);
    const relationshipReview=relationshipReviewNeeded(managedFrontmatter);
    const detectedIssues=buildIssues({ sourceType:src.sourceType, typeReview:nt.typeReview, eras, duplicate:(titles.get(key)??0)>1, existingMatch:currentMatches.length>0, relationshipReview, unresolvedLinks:unresolved, assetRefs:assets });
    const checkedTasks=checkedReviewTasks(parts.body);
    const tasks=issueTasks({ sourceType:src.sourceType, title:src.title, issues:detectedIssues });
    const issues=detectedIssues.filter((issue) => !issueTasks({ sourceType:src.sourceType, title:src.title, issues:[issue] }).some((task) => checkedTasks.has(task)));
    const description=descriptionFromBody(converted.body,src.title);
    const additions=addFrontmatter(managedFrontmatter,{ file,title:src.title,description,sourceType:src.sourceType,type:nt.type,eras,tags,itemType,locationKind:locationKind(src.sourceType),issues });
    const fm=[managedFrontmatter,...additions].filter(Boolean).join('\n'); const body=replaceReviewBlock(converted.body,tasks,checkedTasks);
    const output=`---\n${fm}\n---\n${body}`;
    if (output!==raw) { stats.changed++; if (write) await fs.writeFile(full,output,'utf8'); }
    stats.linksConverted += converted.converted; stats.types.set(nt.type,(stats.types.get(nt.type)??0)+1);
    if (issues.length) stats.withIssues++; else stats.clean++;
    for (const issue of issues) stats.issues.set(issue,(stats.issues.get(issue)??0)+1);
  }
  if (write) {
    await fs.mkdir(path.join(vault,'System/Bases'),{recursive:true});
    await fs.mkdir(path.join(vault,'Drafts/Inbox'),{recursive:true});
    await fs.mkdir(path.join(vault,'System/Imports/WorldAnvil'),{recursive:true});
    await fs.writeFile(path.join(vault,'System/Bases/World Anvil Import.base'),importBase(),'utf8');
    await fs.writeFile(path.join(vault,'Drafts/Inbox/World Anvil Migration Review.md'),inbox(stats),'utf8');
    await fs.writeFile(path.join(vault,'System/Imports/WorldAnvil/report.md'),report(stats),'utf8');
    const home=path.join(vault,'Home.md'); await fs.writeFile(home,updateHome(await fs.readFile(home,'utf8')),'utf8');
  }
  console.log(`World Anvil Obsidian integration (${write?'write':'audit'})`);
  console.log(`Imported notes: ${stats.total}`); console.log(`${write?'Changed':'Would change'}: ${stats.changed}`); console.log(`Links converted: ${stats.linksConverted}`); console.log(`Mechanically clean: ${stats.clean}`); console.log(`With review flags: ${stats.withIssues}`);
  return stats;
}
if (isMainModule(import.meta.url)) {
  try { const args=parseArgs(process.argv.slice(2)); if (args.help) console.log('Usage: node scripts/integrate-worldanvil-import.mjs [--write] [--vault PATH]'); else await runIntegration(args); }
  catch (error) { console.error(error?.stack??error); process.exitCode=1; }
}
