/*
 * MySnippets compatibility runtime
 *
 * Based on MySnippets by Chetachi and the Obsidian 1.11 compatibility
 * work maintained in Moyf/MySnippets (upstream compatibility release 1.2.4).
 *
 * Additional compatibility work in this repository:
 * - prefers app.customCss.setSnippetEnabled when available
 * - falls back to setCssEnabledStatus for older Obsidian builds
 * - verifies and re-syncs visible toggle state after every change
 * - avoids relying on getSnippetsFolder when creating/opening snippets
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const {
  Plugin,
  PluginSettingTab,
  Setting,
  TextAreaComponent,
  TextComponent,
  Modal,
  Menu,
  ToggleComponent,
  ButtonComponent,
  Notice,
  setIcon,
  normalizePath,
} = require("obsidian");

const DEFAULT_SETTINGS = {
  aestheticStyle: false,
  snippetViewPosition: "left",
  openSnippetFile: true,
  stylingTemplate: "",
  snippetEnabledStatus: false,
};

function getMenuItemDom(item) {
  return item && (item.dom || (item.titleEl && item.titleEl.parentElement));
}

class CreateSnippetModal extends Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.fileName = "";
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Create CSS snippet" });

    const nameSetting = new Setting(contentEl).setName("Snippet name");
    const nameInput = new TextComponent(nameSetting.controlEl);
    nameInput.setPlaceholder("Example snippet").onChange((value) => {
      this.fileName = value;
    });

    const templateSetting = new Setting(contentEl).setName("CSS");
    templateSetting.settingEl.style.display = "grid";
    templateSetting.settingEl.style.gridTemplateColumns = "1fr";
    const editor = new TextAreaComponent(templateSetting.controlEl);
    editor.inputEl.addClass("ms-css-editor");
    editor.setValue(this.plugin.settings.stylingTemplate || "");

    new Setting(contentEl).addButton((button) => {
      button.setButtonText("Create snippet").setCta().onClick(async () => {
        try {
          await this.plugin.createSnippet(this.fileName, editor.getValue());
          this.close();
        } catch (error) {
          console.error("MySnippets: failed to create snippet", error);
          new Notice(`MySnippets: ${error.message || error}`);
        }
      });
    });

    nameInput.inputEl.focus();
  }

  onClose() {
    this.contentEl.empty();
  }
}

class MySnippetsSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h1", { text: "MySnippets" });
    containerEl.createEl("p", {
      text: "Quickly toggle CSS snippets from the status bar or command palette.",
    });

    new Setting(containerEl)
      .setName("Glass menu effect")
      .setDesc("Use a translucent blurred background for the snippets menu.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.aestheticStyle).onChange(async (value) => {
          this.plugin.settings.aestheticStyle = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Auto open new snippet")
      .setDesc("Open a newly created CSS snippet in the system default editor.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.openSnippetFile).onChange(async (value) => {
          this.plugin.settings.openSnippetFile = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Enable new snippet")
      .setDesc("Automatically enable newly created CSS snippets.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.snippetEnabledStatus).onChange(async (value) => {
          this.plugin.settings.snippetEnabledStatus = value;
          await this.plugin.saveSettings();
        });
      });

    const templateSetting = new Setting(containerEl)
      .setName("CSS snippet template")
      .setDesc("Default CSS inserted when creating a snippet from MySnippets.");
    templateSetting.settingEl.style.display = "grid";
    templateSetting.settingEl.style.gridTemplateColumns = "1fr";
    const editor = new TextAreaComponent(templateSetting.controlEl);
    editor.inputEl.addClass("ms-css-editor");
    editor.setValue(this.plugin.settings.stylingTemplate || "").onChange(async (value) => {
      this.plugin.settings.stylingTemplate = value;
      await this.plugin.saveSettings();
    });

    const api = this.plugin.getCssApiCapabilities();
    new Setting(containerEl)
      .setName("CSS API status")
      .setDesc(api.summary)
      .addButton((button) => {
        button.setButtonText("Recheck").onClick(() => {
          new Notice(this.plugin.getCssApiCapabilities().summary, 6000);
        });
      });
  }
}

module.exports = class MySnippetsPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new MySnippetsSettingTab(this.app, this));

    this.addCommand({
      id: "open-snippets-menu",
      name: "Open snippets menu",
      callback: () => this.openSnippetsMenu(),
    });

    this.addCommand({
      id: "open-snippets-create",
      name: "Create new CSS snippet",
      callback: () => new CreateSnippetModal(this.app, this).open(),
    });

    this.addCommand({
      id: "diagnose-css-api",
      name: "Diagnose CSS snippet API",
      callback: () => new Notice(this.getCssApiCapabilities().summary, 7000),
    });

    this.app.workspace.onLayoutReady(() => this.setupStatusBarIcon());

    const capabilities = this.getCssApiCapabilities();
    if (!capabilities.canToggle) {
      console.error("MySnippets:", capabilities.summary);
      new Notice(capabilities.summary, 8000);
    }
  }

  setupStatusBarIcon() {
    if (this.statusBarIcon) return;
    this.statusBarIcon = this.addStatusBarItem();
    this.statusBarIcon.addClass("MiniSettings-statusbar-button");
    this.statusBarIcon.addClass("mod-clickable");
    this.statusBarIcon.setAttribute("aria-label", "Configure CSS snippets");
    this.statusBarIcon.setAttribute("aria-label-position", "top");
    setIcon(this.statusBarIcon, "palette");
    this.statusBarIcon.addEventListener("click", () => this.openSnippetsMenu());
  }

  get customCss() {
    return this.app && this.app.customCss;
  }

  getCssApiCapabilities() {
    const css = this.customCss;
    if (!css) {
      return {
        canToggle: false,
        summary: "MySnippets: Obsidian CSS manager is unavailable (app.customCss missing).",
      };
    }

    const hasModern = typeof css.setSnippetEnabled === "function";
    const hasLegacy = typeof css.setCssEnabledStatus === "function";
    const hasState = css.enabledSnippets && typeof css.enabledSnippets.has === "function";
    const hasList = Array.isArray(css.snippets);

    return {
      canToggle: (hasModern || hasLegacy) && hasState,
      hasModern,
      hasLegacy,
      hasState,
      hasList,
      summary:
        `MySnippets CSS API: ${hasModern ? "setSnippetEnabled available" : "setSnippetEnabled unavailable"}; ` +
        `${hasLegacy ? "legacy fallback available" : "legacy fallback unavailable"}; ` +
        `${hasState ? "state readable" : "state unavailable"}.`,
    };
  }

  async setSnippetState(name, enabled) {
    const css = this.customCss;
    const capabilities = this.getCssApiCapabilities();
    if (!capabilities.canToggle) {
      throw new Error(capabilities.summary);
    }

    let primaryError = null;

    if (capabilities.hasModern) {
      try {
        await Promise.resolve(css.setSnippetEnabled(name, enabled));
      } catch (error) {
        primaryError = error;
        console.warn("MySnippets: setSnippetEnabled failed; trying legacy fallback", error);
      }
    }

    let actual = css.enabledSnippets.has(name);
    if ((!capabilities.hasModern || primaryError || actual !== enabled) && capabilities.hasLegacy) {
      await Promise.resolve(css.setCssEnabledStatus(name, enabled));
      actual = css.enabledSnippets.has(name);
    }

    if (actual !== enabled) {
      throw new Error(
        `Obsidian did not ${enabled ? "enable" : "disable"} '${name}'. ` +
          "Open Developer Tools for MySnippets diagnostics."
      );
    }

    return actual;
  }

  async reloadSnippets() {
    const css = this.customCss;
    if (!css || typeof css.requestLoadSnippets !== "function") {
      throw new Error("Obsidian CSS reload API is unavailable.");
    }
    await Promise.resolve(css.requestLoadSnippets());
  }

  async openSnippetsMenu() {
    const css = this.customCss;
    if (!css) {
      new Notice("MySnippets: Obsidian CSS manager is unavailable.");
      return;
    }

    try {
      if (typeof css.requestLoadSnippets === "function") {
        await Promise.resolve(css.requestLoadSnippets());
      }
    } catch (error) {
      console.warn("MySnippets: snippet reload before menu failed", error);
    }

    const existingMenu = document.querySelector(".menu.MySnippets-statusbar-menu");
    if (existingMenu) return;

    const menu = new Menu();
    const menuDom = menu.dom;
    if (menuDom) {
      menuDom.addClass("MySnippets-statusbar-menu");
      if (this.settings.aestheticStyle) {
        menuDom.style.backgroundColor = "transparent";
        menuDom.style.backdropFilter = "blur(8px)";
        menuDom.style.webkitBackdropFilter = "blur(8px)";
      }
    }

    const snippets = Array.isArray(css.snippets) ? [...css.snippets] : [];
    snippets.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    if (snippets.length === 0) {
      menu.addItem((item) => item.setTitle("No CSS snippets found").setDisabled(true));
    }

    for (const snippet of snippets) {
      menu.addItem((item) => {
        item.setTitle(snippet);
        const row = getMenuItemDom(item);
        if (!row) {
          item.onClick(async () => {
            try {
              await this.setSnippetState(snippet, !css.enabledSnippets.has(snippet));
            } catch (error) {
              console.error("MySnippets: toggle failed", error);
              new Notice(`MySnippets: ${error.message || error}`);
            }
          });
          return;
        }

        const toggle = new ToggleComponent(row);
        const openButton = new ButtonComponent(row);

        const applyState = async (desired) => {
          try {
            const actual = await this.setSnippetState(snippet, desired);
            toggle.setValue(actual);
          } catch (error) {
            console.error(`MySnippets: failed to toggle '${snippet}'`, error);
            toggle.setValue(css.enabledSnippets.has(snippet));
            new Notice(`MySnippets: ${error.message || error}`);
          }
        };

        toggle
          .setValue(css.enabledSnippets.has(snippet))
          .onChange((value) => void applyState(value));

        if (toggle.toggleEl) {
          toggle.toggleEl.addEventListener("click", (event) => event.stopPropagation());
        }

        openButton
          .setIcon("file-code")
          .setClass("MS-OpenSnippet")
          .setTooltip("Open snippet")
          .onClick((event) => {
            event.stopPropagation();
            this.openSnippetFile(snippet);
          });

        item.onClick((event) => {
          const target = event.target;
          if (
            target instanceof Element &&
            (target.closest(".MS-OpenSnippet") || target.closest(".checkbox-container"))
          ) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          void applyState(!css.enabledSnippets.has(snippet));
        });
      });
    }

    menu.addSeparator();

    menu.addItem((item) => {
      item.setTitle("Reload snippets").setIcon("refresh-cw").onClick(async () => {
        try {
          await this.reloadSnippets();
          new Notice("CSS snippets reloaded");
        } catch (error) {
          new Notice(`MySnippets: ${error.message || error}`);
        }
      });
    });

    menu.addItem((item) => {
      item.setTitle("Open snippets folder").setIcon("folder-open").onClick(() => {
        this.openSnippetsFolder();
      });
    });

    menu.addItem((item) => {
      item.setTitle("Create new snippet").setIcon("file-plus").onClick(() => {
        new CreateSnippetModal(this.app, this).open();
      });
    });

    menu.showAtPosition({
      x: Math.max(0, window.innerWidth - 16),
      y: Math.max(0, window.innerHeight - 40),
    });
  }

  openSnippetFile(name) {
    const css = this.customCss;
    try {
      if (
        css &&
        typeof css.getSnippetPath === "function" &&
        typeof this.app.openWithDefaultApp === "function"
      ) {
        this.app.openWithDefaultApp(css.getSnippetPath(name));
        return;
      }
      new Notice("MySnippets: opening snippet files is unavailable in this Obsidian build.");
    } catch (error) {
      console.error("MySnippets: failed to open snippet", error);
      new Notice(`MySnippets: ${error.message || error}`);
    }
  }

  openSnippetsFolder() {
    const css = this.customCss;
    try {
      if (css && typeof css.openSnippetsFolder === "function") {
        css.openSnippetsFolder();
        return;
      }
      new Notice("MySnippets: opening the snippets folder is unavailable in this Obsidian build.");
    } catch (error) {
      console.error("MySnippets: failed to open snippets folder", error);
      new Notice(`MySnippets: ${error.message || error}`);
    }
  }

  async createSnippet(rawName, contents) {
    const name = String(rawName || "")
      .trim()
      .replace(/\.css$/i, "")
      .replace(/[\\/:*?"<>|]/g, "-");

    if (!name) throw new Error("Enter a snippet name.");

    const configDir = this.app.vault.configDir || ".obsidian";
    const path = normalizePath(`${configDir}/snippets/${name}.css`);
    const adapter = this.app.vault.adapter;

    if (await adapter.exists(path)) {
      throw new Error(`'${name}.css' already exists.`);
    }

    await adapter.write(path, contents || "");
    await this.reloadSnippets();

    if (this.settings.snippetEnabledStatus) {
      await this.setSnippetState(name, true);
    }

    new Notice(`Created ${name}.css`);

    if (this.settings.openSnippetFile) {
      this.openSnippetFile(name);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
};
