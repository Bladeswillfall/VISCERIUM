const { MarkdownView, Notice, Plugin, TFile, normalizePath } = require('obsidian');

const DAILY_NOTE_COMMAND = 'daily-notes';
const DAILY_ACTIVITY_COMMAND = 'daily-activity:db-activity-timeline';
const JOURNAL_ROOT = 'Private/Journal/Daily';
const ACTIVITY_HEADING = '## Vault Activity';
const ACTIVITY_TIMELINE_HEADING = "# Today's Activity Timeline";

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

module.exports = class VisceriumJournalToolsPlugin extends Plugin {
  onload() {
    this.addCommand({
      id: 'seal-todays-activity',
      name: "Seal Today's Activity",
      callback: () => void this.sealTodaysActivity(),
    });
  }

  todaysJournalPath() {
    return normalizePath(`${JOURNAL_ROOT}/${window.moment().format('YYYY/YYYY-MM-DD')}.md`);
  }

  async openTodaysJournal() {
    const expectedPath = this.todaysJournalPath();
    const existing = this.app.vault.getAbstractFileByPath(expectedPath);

    if (existing instanceof TFile) {
      const leaf = this.app.workspace.getLeaf(false);
      await leaf.openFile(existing);
      this.app.workspace.setActiveLeaf(leaf, { focus: true });
    } else if (!this.app.commands.executeCommandById(DAILY_NOTE_COMMAND)) {
      new Notice('Enable Obsidian\'s Daily notes core plugin before sealing activity.', 9000);
      return null;
    }

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (view?.file?.path === expectedPath) return view;
      await pause(50);
    }

    new Notice(`Could not open today's journal at ${expectedPath}. Check Daily notes settings.`, 10000);
    return null;
  }

  activitySection(text) {
    const headingOffset = text.indexOf(ACTIVITY_HEADING);
    if (headingOffset === -1) return null;

    const start = headingOffset + ACTIVITY_HEADING.length;
    const nextHeading = text.slice(start).search(/^##\s+/m);
    const end = nextHeading === -1 ? text.length : start + nextHeading;
    const content = text.slice(start, end);
    const comment = content.match(/<!--[\s\S]*?-->/);

    return {
      start,
      end,
      content,
      insertionOffset: comment ? start + comment.index + comment[0].length : start,
    };
  }

  async sealTodaysActivity() {
    if (!this.app.commands.commands[DAILY_ACTIVITY_COMMAND]) {
      new Notice('Install and enable Daily Activity before using Seal Today\'s Activity.', 9000);
      return;
    }

    const view = await this.openTodaysJournal();
    if (!view) return;

    const editor = view.editor;
    const text = editor.getValue();
    const activity = this.activitySection(text);
    if (!activity) {
      new Notice(`Today's journal is missing ${ACTIVITY_HEADING}. Add it or recreate the note from the daily template.`, 10000);
      return;
    }

    if (activity.content.includes(ACTIVITY_TIMELINE_HEADING)) {
      new Notice("Today's activity is already sealed. Remove the existing timeline before generating another snapshot.", 9000);
      return;
    }

    let insertionOffset = activity.insertionOffset;

    const following = text.slice(insertionOffset);
    const existingNewlines = following.match(/^\n*/)?.[0].length ?? 0;
    const missingNewlines = Math.max(0, 2 - existingNewlines);
    if (missingNewlines > 0) {
      const position = editor.offsetToPos(insertionOffset);
      editor.replaceRange('\n'.repeat(missingNewlines), position);
    }
    insertionOffset += existingNewlines + missingNewlines;
    editor.setCursor(editor.offsetToPos(insertionOffset));

    if (!this.app.commands.executeCommandById(DAILY_ACTIVITY_COMMAND)) {
      new Notice('Daily Activity could not generate the timeline.', 9000);
    }
  }
};
