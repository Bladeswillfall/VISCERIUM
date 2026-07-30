---
---

# Creator Tasks

This is the vault-wide task view for **ordinary Markdown checkboxes** used during worldbuilding and writing.

Use tasks when something genuinely needs a future action:

```markdown
- [ ] Decide how this species reacts to Resonance.
- [ ] Rework the opening beat of this scene.
```

Do not turn every incomplete idea or optional database field into a task. The task system is for work you have deliberately decided to return to.

The Home page shows a small **Next Actions** sample from recently modified creator notes. This page shows the complete live list. `System/`, `Templates/` and `Home.md` are excluded so documentation and interface maintenance do not become creator obligations.

```dataviewjs
const pages = dv.pages("")
  .where((page) => {
    const path = page.file.path;
    return path !== "Home.md"
      && !path.startsWith("System/")
      && !path.startsWith("Templates/");
  })
  .sort((page) => page.file.mtime, "desc");

const tasks = [];
for (const page of pages) {
  for (const task of page.file.tasks ?? []) {
    if (!task.completed) tasks.push(task);
  }
}

if (tasks.length === 0) {
  dv.paragraph("No open creator tasks. Add an ordinary Markdown checkbox to a worldbuilding or story note when there is something you deliberately want to return to.");
} else {
  dv.taskList(tasks, true);
}
```

> [!tip] Keep tasks intentional
> A task should describe a real next action. Missing optional lore fields, unused Storyteller modules and undeveloped ideas are **not automatically tasks**.
