const sensitiveStorageKey = 'viscerium-conceal-sensitive-media';
const themeStorageKey = 'starlight-theme';

function readBooleanPreference(key) {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function writeBooleanPreference(key, value) {
  try {
    localStorage.setItem(key, value ? 'true' : 'false');
  } catch {
    // Storage can be unavailable in hardened/private browsing contexts.
  }
}

function readThemePreference() {
  try {
    const value = localStorage.getItem(themeStorageKey);
    return value === 'light' || value === 'dark' ? value : 'auto';
  } catch {
    return 'auto';
  }
}

function applySensitivePreference(conceal) {
  document.documentElement.toggleAttribute('data-conceal-sensitive-media', conceal);
  if (conceal) {
    document.querySelectorAll('[data-sensitive-media-revealed]').forEach((node) => {
      node.removeAttribute('data-sensitive-media-revealed');
    });
  }
}

function assetFilename(value) {
  try {
    const url = new URL(String(value || ''), window.location.href);
    return decodeURIComponent(url.pathname.split('/').pop() || '').trim().toLowerCase();
  } catch {
    return String(value || '').split(/[?#]/, 1)[0].split('/').pop()?.trim().toLowerCase() || '';
  }
}

function readSensitiveManifest(settings) {
  const manifestNode = settings?.querySelector('[data-sensitive-media-manifest]');
  if (!(manifestNode instanceof HTMLTemplateElement)) return new Map();

  try {
    const entries = JSON.parse(manifestNode.content.textContent || '[]');
    return new Map(entries
      .filter((entry) => entry && typeof entry.asset === 'string')
      .map((entry) => [
        assetFilename(entry.asset),
        {
          sensitive: entry.sensitive === true,
          warnings: Array.isArray(entry.warnings)
            ? entry.warnings.filter((warning) => typeof warning === 'string')
            : [],
        },
      ])
      .filter(([asset]) => asset));
  } catch {
    return new Map();
  }
}

function mediaContainer(image) {
  const figure = image.closest('figure');
  if (figure instanceof HTMLElement) return figure;

  const sidebarArtwork = image.closest('.codex-sidebar-artwork');
  if (sidebarArtwork instanceof HTMLElement) return sidebarArtwork;

  const parent = image.parentElement;
  if (parent instanceof HTMLAnchorElement && parent.parentElement instanceof HTMLElement) {
    return parent.parentElement;
  }
  return parent instanceof HTMLElement ? parent : null;
}

function markSensitiveMedia(settings) {
  const manifest = readSensitiveManifest(settings);
  if (manifest.size === 0) return;

  document.querySelectorAll('img[src]').forEach((image) => {
    if (!(image instanceof HTMLImageElement)) return;
    const metadata = manifest.get(assetFilename(image.currentSrc || image.src));
    if (!metadata) return;

    const container = mediaContainer(image);
    if (!container) return;
    if (metadata.warnings.length > 0) {
      container.setAttribute('data-image-content-warnings', metadata.warnings.join(','));
    }
    if (!metadata.sensitive) return;

    container.setAttribute('data-sensitive-media', 'true');
    container.setAttribute('data-sensitive-media-auto', '');
    container.setAttribute('data-sensitive-warnings', metadata.warnings.join(','));
  });
}

function warningTokens(value) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function formatWarning(warning) {
  return String(warning).trim().replace(/-/g, ' ');
}

function sensitiveWarningText(node) {
  return warningTokens(node.getAttribute('data-sensitive-warnings'))
    .map(formatWarning)
    .join(' · ');
}

function syncContentNotes() {
  const notes = document.querySelector('[data-content-notes]');
  if (!(notes instanceof HTMLElement)) return;

  const warnings = new Set(warningTokens(notes.dataset.authoredWarnings));
  document.querySelectorAll('[data-image-content-warnings]').forEach((node) => {
    warningTokens(node.getAttribute('data-image-content-warnings')).forEach((warning) => warnings.add(warning));
  });

  const list = notes.querySelector('[data-content-notes-list]');
  if (!(list instanceof HTMLElement)) return;

  const rendered = [...warnings].map(formatWarning);
  list.textContent = rendered.join(' · ');
  notes.hidden = rendered.length === 0;
}

function prepareSensitiveMedia() {
  const settings = document.querySelector('viscerium-reader-settings');
  markSensitiveMedia(settings);
  syncContentNotes();

  const revealLabel = settings?.getAttribute('data-sensitive-reveal-label') || 'Reveal image';
  const warningLabel = settings?.getAttribute('data-sensitive-warning-label') || 'Sensitive image';

  document.querySelectorAll('[data-sensitive-media="true"]').forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (node.querySelector(':scope > .vc-sensitive-media-reveal')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'vc-sensitive-media-reveal';
    button.setAttribute('aria-label', revealLabel);

    const title = document.createElement('strong');
    title.textContent = revealLabel;
    button.append(title);

    const warnings = sensitiveWarningText(node);
    const detail = document.createElement('span');
    detail.textContent = warnings || warningLabel;
    button.append(detail);
    if (warnings) button.setAttribute('aria-label', `${revealLabel}: ${warnings}`);

    button.addEventListener('click', () => {
      node.setAttribute('data-sensitive-media-revealed', '');
      const link = node.querySelector('a[href]');
      if (link instanceof HTMLElement) {
        link.focus();
        return;
      }
      node.setAttribute('tabindex', '-1');
      node.focus();
      node.addEventListener('blur', () => node.removeAttribute('tabindex'), { once: true });
    });

    node.append(button);
  });
}

class VisceriumReaderSettings extends HTMLElement {
  controller = null;

  connectedCallback() {
    if (this.controller) return;
    this.controller = new AbortController();
    const { signal } = this.controller;

    const trigger = this.querySelector('[data-reader-settings-trigger]');
    const panel = this.querySelector('[data-reader-settings-panel]');
    const close = this.querySelector('[data-reader-settings-close]');
    const sensitiveToggle = this.querySelector('[data-reader-sensitive-toggle]');
    const themeOptions = [...this.querySelectorAll('[data-reader-theme-option]')];
    const nativeThemeSelect = this.querySelector('starlight-theme-select select');

    if (!(trigger instanceof HTMLButtonElement) || !(panel instanceof HTMLElement)) return;

    const closePanel = ({ restoreFocus = false } = {}) => {
      panel.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      if (restoreFocus) trigger.focus();
    };

    const openPanel = () => {
      panel.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
    };

    trigger.addEventListener('click', () => {
      if (panel.hidden) openPanel();
      else closePanel();
    }, { signal });

    close?.addEventListener('click', () => closePanel({ restoreFocus: true }), { signal });

    document.addEventListener('pointerdown', (event) => {
      if (!panel.hidden && event.target instanceof Node && !this.contains(event.target)) closePanel();
    }, { signal });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !panel.hidden) {
        event.preventDefault();
        closePanel({ restoreFocus: true });
      }
    }, { signal });

    const currentTheme = readThemePreference();
    for (const option of themeOptions) {
      if (option instanceof HTMLInputElement) option.checked = option.value === currentTheme;
    }

    for (const option of themeOptions) {
      option.addEventListener('change', () => {
        if (!(option instanceof HTMLInputElement) || !option.checked) return;
        if (nativeThemeSelect instanceof HTMLSelectElement) {
          nativeThemeSelect.value = option.value;
          nativeThemeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, { signal });
    }

    if (sensitiveToggle instanceof HTMLInputElement) {
      const conceal = readBooleanPreference(sensitiveStorageKey);
      sensitiveToggle.checked = conceal;
      applySensitivePreference(conceal);
      sensitiveToggle.addEventListener('change', () => {
        writeBooleanPreference(sensitiveStorageKey, sensitiveToggle.checked);
        applySensitivePreference(sensitiveToggle.checked);
        prepareSensitiveMedia();
      }, { signal });
    }

    prepareSensitiveMedia();
  }

  disconnectedCallback() {
    this.controller?.abort();
    this.controller = null;
  }
}

if (!customElements.get('viscerium-reader-settings')) {
  customElements.define('viscerium-reader-settings', VisceriumReaderSettings);
}

applySensitivePreference(readBooleanPreference(sensitiveStorageKey));
prepareSensitiveMedia();
document.addEventListener('astro:page-load', prepareSensitiveMedia);
