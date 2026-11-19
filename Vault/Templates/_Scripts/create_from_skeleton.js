module.exports = async function createFromSkeleton(tp, { template, folder, prompt = "Name" }) {
  const startedAt = Date.now();
  const currentTitle = tp.file.title === "Untitled" ? "" : tp.file.title;
  const title = String(await tp.system.prompt(prompt, currentTitle, true) ?? "").trim();
  if (!title) throw new Error("A title is required to create a VISCERIUM note.");
  if (title !== tp.file.title) await tp.file.rename(title);

  const templateFile = tp.app.vault.getAbstractFileByPath(template);
  if (!templateFile) throw new Error(`Missing VISCERIUM template: ${template}`);

  const rendered = (await tp.app.vault.read(templateFile)).replace(
    /^title:\s*["']?\{\{title\}\}["']?\s*$/m,
    `title: ${JSON.stringify(title)}`,
  );

  let current = "";
  for (const segment of folder.split("/").filter(Boolean)) {
    current = current ? `${current}/${segment}` : segment;
    if (!tp.app.vault.getAbstractFileByPath(current)) await tp.app.vault.createFolder(current);
  }

  if (tp.file.folder(true) !== folder) {
    const minimumAgeMs = 450;
    const remainingDelay = minimumAgeMs - (Date.now() - startedAt);
    if (remainingDelay > 0) await new Promise((resolve) => setTimeout(resolve, remainingDelay));
    await tp.file.move(`${folder}/${title}`);
  }

  return rendered;
};
