import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const creatorSource = await readFile(
  new URL('../../Tools/obsidian-viscerium-creator-tools/src/main.js', import.meta.url),
  'utf8',
);

function loadPluginHarness() {
  let activeModal = null;
  const opened = [];
  const blocked = [];
  const executed = [];

  class FakeSuggestModal {
    constructor(app) {
      this.app = app;
      this.placeholder = '';
    }
    setPlaceholder(value) {
      this.placeholder = value;
    }
    open() {
      opened.push(this.placeholder);
      if (activeModal) {
        blocked.push(this.placeholder);
        return;
      }
      activeModal = this;
      queueMicrotask(() => {
        const wanted = this.placeholder === 'What are you creating?'
          ? 'Worldbuilding'
          : this.placeholder === 'What kind of worldbuilding?'
            ? 'Location'
            : null;
        if (!wanted) throw new Error(`Unexpected modal: ${this.placeholder}`);
        const option = this.getSuggestions('').find((entry) => entry.label === wanted);
        if (!option) throw new Error(`Missing option: ${wanted}`);
        this.onChooseSuggestion(option);
        queueMicrotask(() => this.close());
      });
    }
    close() {
      if (activeModal === this) activeModal = null;
      this.onClose();
    }
    onClose() {}
  }

  class FakePlugin {
    constructor(app) {
      this.app = app;
    }
  }

  class FakeItemView {}
  class FakeModal {}
  class FakeSetting {}
  class FakeTFile {}

  const app = {
    commands: {
      commands: {
        'templater-obsidian:create-Templates/Lore/New Location.md': {},
      },
      executeCommandById(commandId) {
        executed.push(commandId);
      },
    },
  };

  const module = { exports: {} };
  const fakeRequire = (id) => {
    if (id !== 'obsidian') throw new Error(`Unexpected require: ${id}`);
    return {
      ItemView: FakeItemView,
      Modal: FakeModal,
      Notice: class {},
      Plugin: FakePlugin,
      Setting: FakeSetting,
      SuggestModal: FakeSuggestModal,
      TFile: FakeTFile,
      normalizePath: (value) => value,
    };
  };

  const context = vm.createContext({
    module,
    exports: module.exports,
    require: fakeRequire,
    console,
    setTimeout,
    clearTimeout,
    queueMicrotask,
  });

  new vm.Script(creatorSource, { filename: 'creator-tools-main.js' }).runInContext(context);
  return { PluginClass: module.exports, app, opened, blocked, executed };
}

test('Worldbuilding opens its second picker after the first picker closes', async () => {
  const harness = loadPluginHarness();
  const plugin = new harness.PluginClass(harness.app);

  await Promise.race([
    plugin.openCreate(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('creator flow did not complete')), 250)),
  ]);

  assert.deepEqual(harness.opened, [
    'What are you creating?',
    'What kind of worldbuilding?',
  ]);
  assert.deepEqual(harness.blocked, []);
  assert.deepEqual(harness.executed, [
    'templater-obsidian:create-Templates/Lore/New Location.md',
  ]);
});
