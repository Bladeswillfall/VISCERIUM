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

function sensitiveWarningText(node) {
  return String(node.getAttribute('data-sensitive-warnings') || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .join(' · ');
}

function prepareSensitiveMedia() {
  const settings = document.querySelector('viscerium-reader-settings');
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
    if (warnings) {
      const detail = document.createElement('span');
      detail.textContent = warnings;
      button.append(detail);
      button.setAttribute('aria-label', `${revealLabel}: ${warnings}`);
    } else {
      const detail = document.createElement('span');
      detail.textContent = warningLabel;
      button.append(detail);
    }

    button.addEventListener('click', () => {
      node.setAttribute('data-sensitive-media-revealed', '');
      node.querySelector('img')?.focus?.();
    });

    node.append(button);
  });
}

class VisceriumReaderSettings extends HTMLElement {
  connectedCallback() {
    if (this.hasAttribute('data-reader-settings-ready')) return;
    this.setAttribute('data-reader-settings-ready', '');

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
    });

    close?.addEventListener('click', () => closePanel({ restoreFocus: true }));

    document.addEventListener('pointerdown', (event) => {
      if (!panel.hidden && event.target instanceof Node && !this.contains(event.target)) closePanel();
    });

    this.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !panel.hidden) {
        event.preventDefault();
        closePanel({ restoreFocus: true });
      }
    });

    const currentTheme = nativeThemeSelect instanceof HTMLSelectElement
      ? nativeThemeSelect.value || readThemePreference()
      : readThemePreference();
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
      });
    }

    if (sensitiveToggle instanceof HTMLInputElement) {
      const conceal = readBooleanPreference(sensitiveStorageKey);
      sensitiveToggle.checked = conceal;
      applySensitivePreference(conceal);
      sensitiveToggle.addEventListener('change', () => {
        writeBooleanPreference(sensitiveStorageKey, sensitiveToggle.checked);
        applySensitivePreference(sensitiveToggle.checked);
        prepareSensitiveMedia();
      });
    }

    prepareSensitiveMedia();
  }
}

if (!customElements.get('viscerium-reader-settings')) {
  customElements.define('viscerium-reader-settings', VisceriumReaderSettings);
}

applySensitivePreference(readBooleanPreference(sensitiveStorageKey));
prepareSensitiveMedia();
document.addEventListener('astro:page-load', prepareSensitiveMedia);
