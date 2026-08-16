export function stringifyGeneratedFrontmatter(frontmatter, generated) {
  const lines = frontmatter.split(/\r?\n/);

  function setField(key, value) {
    if (value === undefined || value === null || value === '') return;
    const line = `${key}: ${value}`;
    const index = lines.findIndex((entry) => entry.startsWith(`${key}:`));
    if (index === -1) lines.push(line);
    else lines[index] = line;
  }

  setField('slug', generated.slug);
  setField('type', generated.type);
  setField('era', generated.era);
  setField('eraStyle', generated.eraStyle);
  for (const [key, value] of Object.entries(generated.assets ?? {})) setField(key, value);
  if (generated.links?.length && !lines.some((line) => line.startsWith('links:'))) {
    lines.push(`links: ${JSON.stringify(generated.links)}`);
  }
  setField('sourcePath', JSON.stringify(generated.sourcePath));
  setField('giscus', generated.giscus);

  return `---\n${lines.join('\n')}\n---\n\n`;
}
