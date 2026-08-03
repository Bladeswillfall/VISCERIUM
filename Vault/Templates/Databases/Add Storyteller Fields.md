<%*
const START = "<!-- viscerium:storyteller:start -->";
const END = "<!-- viscerium:storyteller:end -->";
const file = tp.file.find_tfile(tp.file.path(true));
const current = file ? await tp.app.vault.read(file) : "";

if (current.includes(START) || current.includes(END)) {
  new Notice("This note already contains a Storyteller section.");
  tR = "";
} else {
  tR = `${START}\n\n## Storyteller View\n\n${END}`;
}
%>
