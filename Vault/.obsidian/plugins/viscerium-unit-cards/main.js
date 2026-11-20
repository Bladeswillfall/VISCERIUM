const { Plugin, BasesView, setIcon, Keymap } = require("obsidian");

const VIEW_TYPE = "viscerium-unit-cards";

const THREAT_COLORS = {
  0: "#6f747c",
  1: "#727b62",
  2: "#9d8b48",
  3: "#c99b3f",
  4: "#db7928",
  5: "#d84a32",
  6: "#c8322d",
  7: "#ad2029",
  8: "#861823",
  9: "#63131d",
  10: "#3f0b15",
};

const CLASS_ICONS = {
  infantry: "shield",
  cavalry: "shield-plus",
  artillery: "crosshair",
  vehicle: "truck",
  aircraft: "plane",
  vessel: "ship",
  creature: "paw-print",
  construct: "bot",
  installation: "landmark",
  myrkild: "biohazard",
};

const ENGAGEMENT_ICONS = {
  melee: "swords",
  ranged: "crosshair",
  hybrid: "scan-line",
  support: "heart-pulse",
  mixed: "shuffle",
  "non-combat": "circle-off",
};

const ROLE_ICONS = {
  frontline: "shield",
  shock: "chevrons-up",
  assault: "swords",
  "fire-support": "crosshair",
  skirmish: "footprints",
  reconnaissance: "binoculars",
  infiltration: "eye-off",
  hunter: "target",
  defence: "shield-check",
  siege: "bomb",
  command: "crown",
  transport: "truck",
  engineering: "wrench",
  logistics: "package",
  support: "life-buoy",
};

function clean(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  return String(value).trim();
}

function list(value) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  if (value === null || value === undefined || value === "") return [];
  if (typeof value === "string" && value.includes(",")) {
    return value.split(",").map((v) => v.trim()).filter(Boolean);
  }
  return [clean(value)].filter(Boolean);
}

function slug(value) {
  return clean(value).toLowerCase().replace(/\s+/g, "-").replace(/_/g, "-");
}

function humanize(value) {
  const text = clean(value).replace(/[-_]+/g, " ");
  if (!text) return "";
  return text.replace(/\b\w/g, (m) => m.toUpperCase());
}

function roman(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 10) return "?";
  const numerals = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  return numerals[Math.round(n)] || "?";
}

function protectionLevel(value) {
  const map = { none: 0, light: 1, standard: 2, heavy: 3, fortified: 4 };
  const key = slug(value);
  return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null;
}

function mobilityLevel(value) {
  const map = { static: 0, limited: 1, standard: 2, high: 3, extreme: 4 };
  const key = slug(value);
  return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null;
}

function statRoman(level) {
  if (level === null || level === undefined) return "?";
  return roman(level);
}

function icon(parent, name, cls = "") {
  const el = parent.createSpan({ cls });
  try {
    setIcon(el, name);
  } catch (_) {
    el.setText("•");
  }
  return el;
}

function resolveImage(app, value, contextFile) {
  if (!value) return null;
  if (Array.isArray(value)) return value.length ? resolveImage(app, value[0], contextFile) : null;

  if (typeof value === "object" && typeof value.toString === "function") {
    const str = value.toString();
    if (str && str !== "[object Object]") return resolveImage(app, str, contextFile);
  }

  if (typeof value !== "string") return null;
  const str = value.trim();
  if (!str) return null;
  if (/^https?:\/\//i.test(str)) return str;

  const wiki = str.match(/^!?\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]$/);
  const md = str.match(/^!\[[^\]]*\]\(([^)]+)\)$/);
  const linkpath = wiki ? wiki[1] : md ? md[1] : str;
  if (/^https?:\/\//i.test(linkpath)) return linkpath;

  const file = app.metadataCache.getFirstLinkpathDest(linkpath, contextFile.path);
  return file ? app.vault.getResourcePath(file) : null;
}

function resolveProfile(frontmatter, file) {
  const scope = slug(frontmatter.profile_scope) || "profile";
  const explicitClass = slug(frontmatter.unit_class);
  const legacyType = slug(frontmatter.type);
  const unitClass = explicitClass || (legacyType === "myrkild-unit" ? "myrkild" : "");
  const role = slug(frontmatter.primary_role || frontmatter.role);
  const engagement = slug(frontmatter.engagement);
  const threat = Number(frontmatter.threat_rating);
  const threatValue = Number.isFinite(threat) ? Math.max(0, Math.min(10, Math.round(threat))) : null;

  return {
    title: clean(frontmatter.title || frontmatter.unit_name || file.basename),
    era: clean(frontmatter.era),
    faction: list(frontmatter.faction),
    scope,
    composition: clean(frontmatter.composition),
    physicalScale: clean(frontmatter.physical_scale),
    formationScale: clean(frontmatter.formation_scale),
    unitClass,
    engagement,
    role,
    traits: list(frontmatter.traits),
    threat: threatValue,
    protection: clean(frontmatter.protection),
    mobility: clean(frontmatter.mobility),
    disposition: clean(frontmatter.disposition),
    intelligence: clean(frontmatter.intelligence),
    description: clean(frontmatter.description),
    image: frontmatter.image || frontmatter.headerImage || null,
    species: clean(frontmatter.myrkild_species || frontmatter.species),
    origin: clean(frontmatter.origin),
    subtype: clean(frontmatter.subtype),
    strain: clean(frontmatter.strain),
  };
}

class VisceriumUnitCardsView extends BasesView {
  constructor(controller, containerEl) {
    super(controller);
    this.type = VIEW_TYPE;
    this.containerEl = containerEl;
    this.hoverPopover = null;
  }

  onDataUpdated() {
    this.containerEl.empty();

    const cardSize = Number(this.config.get("cardSize")) || 320;
    const density = String(this.config.get("density") || "detailed");
    const root = this.containerEl.createDiv({ cls: `viscerium-unit-cards-root is-${density}` });
    root.style.setProperty("--vuc-card-width", `${cardSize}px`);

    const groups = this.data.groupedData || [];
    for (const group of groups) {
      const hasKey = typeof group.hasKey === "function" && group.hasKey();
      let grid = root;

      if (hasKey) {
        const groupEl = root.createDiv({ cls: "vuc-group" });
        const heading = groupEl.createDiv({ cls: "vuc-group-heading" });
        heading.setText(group.key?.toString() || "Uncategorised");
        grid = groupEl.createDiv({ cls: "vuc-card-grid" });
      } else if (!root.querySelector(":scope > .vuc-card-grid")) {
        grid = root.createDiv({ cls: "vuc-card-grid" });
      } else {
        grid = root.querySelector(":scope > .vuc-card-grid");
      }

      for (const entry of group.entries || []) {
        this.renderCard(grid, entry, density);
      }
    }
  }

  renderCard(parent, entry, density) {
    const file = entry.file;
    if (!file) return;

    const cache = this.app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter || {};
    const data = resolveProfile(fm, file);
    const threatColor = data.threat === null ? THREAT_COLORS[0] : THREAT_COLORS[data.threat];

    const card = parent.createDiv({ cls: "vuc-card" });
    card.style.setProperty("--vuc-threat-color", threatColor);
    card.dataset.scope = data.scope;
    card.dataset.era = slug(data.era);
    card.dataset.threat = data.threat === null ? "unknown" : String(data.threat);

    const header = card.createDiv({ cls: "vuc-header" });
    const title = header.createDiv({ cls: "vuc-title" });
    title.setText(data.title);
    const scope = header.createDiv({ cls: "vuc-scope" });
    icon(scope, data.scope === "unit" ? "users-round" : data.scope === "entity" ? "circle-dot" : "badge", "vuc-scope-icon");
    scope.createSpan({ text: data.scope === "profile" ? "PROFILE" : data.scope.toUpperCase() });

    const eraBar = card.createDiv({ cls: "vuc-era-bar" });
    const eraLeft = eraBar.createDiv({ cls: "vuc-era" });
    icon(eraLeft, "hexagon", "vuc-era-icon");
    eraLeft.createSpan({ text: data.era || "UNASSIGNED" });
    const context = data.faction.length ? data.faction.join(" · ") : data.species || data.origin;
    if (context) eraBar.createDiv({ cls: "vuc-era-context", text: context });

    const art = card.createDiv({ cls: "vuc-art" });
    const imageUrl = resolveImage(this.app, data.image, file);
    if (imageUrl) {
      const img = art.createEl("img", { cls: "vuc-art-image", attr: { src: imageUrl, alt: "" } });
      img.setAttr("loading", "lazy");
    } else {
      art.addClass("is-placeholder");
      icon(art, data.unitClass === "myrkild" ? "biohazard" : "image", "vuc-art-placeholder-icon");
      art.createDiv({ cls: "vuc-art-placeholder-label", text: data.era || "VISCERIUM" });
    }

    const identity = card.createDiv({ cls: "vuc-identity-strip" });
    this.addIdentity(identity, CLASS_ICONS[data.unitClass] || "badge", humanize(data.unitClass || "Profile"));
    if (data.engagement) this.addIdentity(identity, ENGAGEMENT_ICONS[data.engagement] || "swords", humanize(data.engagement));
    if (data.role) this.addIdentity(identity, ROLE_ICONS[data.role] || "target", humanize(data.role));

    const body = card.createDiv({ cls: "vuc-body" });

    const details = body.createDiv({ cls: "vuc-details" });
    if (data.scope === "unit" && data.composition) this.addDetail(details, "users-round", "Composition", data.composition);
    if (data.scope === "unit" && data.formationScale && slug(data.formationScale) !== "unknown") {
      this.addDetail(details, "layers-3", "Formation", humanize(data.formationScale));
    }
    if (data.scope === "entity" && data.physicalScale && slug(data.physicalScale) !== "unknown") {
      this.addDetail(details, "ruler", "Scale", humanize(data.physicalScale));
    }

    const meta = [data.origin, data.strain, data.subtype].filter(Boolean);
    if (meta.length) {
      const metaRow = body.createDiv({ cls: "vuc-meta" });
      for (const item of meta.slice(0, 3)) metaRow.createSpan({ cls: "vuc-meta-chip", text: item });
    }

    if (data.traits.length) {
      const traits = body.createDiv({ cls: "vuc-traits" });
      for (const trait of data.traits.slice(0, density === "compact" ? 3 : 5)) {
        const chip = traits.createSpan({ cls: "vuc-trait" });
        icon(chip, "diamond", "vuc-trait-icon");
        chip.createSpan({ text: humanize(trait) });
      }
    }

    if (density !== "compact" && data.description) {
      body.createDiv({ cls: "vuc-description", text: data.description });
    }

    const stats = card.createDiv({ cls: "vuc-stats" });
    this.addThreat(stats, data.threat);
    this.addStat(stats, "shield", "Protection", statRoman(protectionLevel(data.protection)), data.protection);
    this.addStat(stats, "chevrons-right", "Mobility", statRoman(mobilityLevel(data.mobility)), data.mobility);

    card.setAttr("tabindex", "0");
    card.setAttr("role", "link");
    card.setAttr("aria-label", `Open ${data.title}`);

    card.addEventListener("click", (event) => {
      const target = event.target;
      if (target instanceof Element && target.closest("a, button")) return;
      const newTab = Keymap.isModEvent(event);
      void this.app.workspace.openLinkText(file.path, "", newTab);
    });

    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      void this.app.workspace.openLinkText(file.path, "", false);
    });

    card.addEventListener("mouseover", (event) => {
      this.app.workspace.trigger("hover-link", {
        event,
        source: "bases",
        hoverParent: this,
        targetEl: card,
        linktext: file.path,
      });
    });
  }

  addIdentity(parent, iconName, text) {
    const item = parent.createDiv({ cls: "vuc-identity" });
    icon(item, iconName, "vuc-identity-icon");
    item.createSpan({ text });
  }

  addDetail(parent, iconName, label, value) {
    const row = parent.createDiv({ cls: "vuc-detail" });
    icon(row, iconName, "vuc-detail-icon");
    row.createSpan({ cls: "vuc-detail-label", text: label });
    row.createSpan({ cls: "vuc-detail-value", text: value });
  }

  addThreat(parent, threat) {
    const stat = parent.createDiv({ cls: "vuc-stat is-threat" });
    const top = stat.createDiv({ cls: "vuc-stat-label" });
    icon(top, "skull", "vuc-stat-icon");
    top.createSpan({ text: "Threat" });
    stat.createDiv({ cls: "vuc-threat-badge", text: threat === null ? "?" : roman(threat) });
  }

  addStat(parent, iconName, label, numeral, raw) {
    const stat = parent.createDiv({ cls: "vuc-stat" });
    const top = stat.createDiv({ cls: "vuc-stat-label" });
    icon(top, iconName, "vuc-stat-icon");
    top.createSpan({ text: label });
    stat.createDiv({ cls: "vuc-stat-value", text: numeral });
    if (raw && slug(raw) !== "unknown" && slug(raw) !== "not-applicable") {
      stat.createDiv({ cls: "vuc-stat-raw", text: humanize(raw) });
    }
  }
}

module.exports = class VisceriumUnitCardsPlugin extends Plugin {
  async onload() {
    this.registerBasesView(VIEW_TYPE, {
      name: "VISCERIUM Cards",
      icon: "layout-grid",
      factory: (controller, containerEl) => new VisceriumUnitCardsView(controller, containerEl),
      options: () => [
        {
          key: "cardSize",
          displayName: "Card width",
          type: "slider",
          default: 320,
          min: 240,
          max: 420,
          step: 10,
        },
        {
          key: "density",
          displayName: "Card detail",
          type: "dropdown",
          default: "detailed",
          options: { compact: "Compact", detailed: "Detailed" },
        },
      ],
    });
  }
};
