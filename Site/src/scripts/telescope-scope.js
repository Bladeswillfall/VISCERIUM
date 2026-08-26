import { filterTelescopePages, telescopeScopeLabel } from '../lib/telescope-scope.mjs';

(() => {
  const runtime = window.__visceriumTelescopeScope ??= {};
  const root = document.documentElement;
  const historicalEras = ['CITADEL', 'SMOG', 'NEARSIGHT', 'ENTROPY'];
  const metadataUrl = '/telescope-scope.json';
  const telescopeConfig = {
    shortcut: {
      key: 'k',
      ctrl: true,
      meta: true,
      shift: false,
      alt: false,
    },
    fuseOptions: {
      threshold: 0.3,
      ignoreLocation: true,
      distance: 100,
      minMatchCharLength: 2,
      findAllMatches: false,
      keys: [
        { name: 'title', weight: 1 },
        { name: 'path', weight: 0.6 },
        { name: 'tags', weight: 0.5 },
        { name: 'description', weight: 0.3 },
      ],
    },
    recentPagesCount: 5,
    maxResults: 20,
    debounceMs: 100,
    theme: {},
  };

  const normaliseEra = (value) => historicalEras.find(
    (era) => era.toLowerCase() === String(value ?? '').trim().toLowerCase(),
  ) ?? null;

  const rememberedEra = () => {
    try {
      return normaliseEra(localStorage.getItem('viscerium-era-context'));
    } catch {
      return null;
    }
  };

  const activeEra = () => {
    const declared = normaliseEra(root.getAttribute('data-era-context'));
    if (declared) return declared;

    const pathMatch = location.pathname.match(/(?:^|\/)eras\/(citadel|smog|nearsight|entropy)(?:\/|$)/i);
    if (pathMatch) return normaliseEra(pathMatch[1]);

    const neutral = location.pathname === '/'
      || location.pathname === '/entities/'
      || location.pathname.startsWith('/entities/');
    return neutral ? null : rememberedEra();
  };

  const telescopeElement = () => document.querySelector('telescope-search[data-viscerium-telescope-bridge]');
  const telescopeController = () => telescopeElement()?.telescopeSearch ?? runtime.controller ?? null;

  const setVisibleTriggerReady = (ready) => {
    document.querySelectorAll('[data-codex-search-open]').forEach((button) => {
      if (button instanceof HTMLButtonElement) button.disabled = !ready;
    });
    root.toggleAttribute('data-telescope-scope-ready', ready);
  };

  const ensureBridge = () => {
    let element = telescopeElement();
    if (!element) {
      const controls = document.querySelector('.right-group');
      if (!controls) return null;

      element = document.createElement('telescope-search');
      element.setAttribute('data-viscerium-telescope-bridge', '');
      element.hidden = true;

      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'telescope__trigger-btn';
      trigger.tabIndex = -1;
      trigger.setAttribute('aria-hidden', 'true');
      trigger.addEventListener('click', () => void runtime.open());
      element.append(trigger);
      controls.prepend(element);
    }

    if (runtime.controller) element.telescopeSearch = runtime.controller;
    return element;
  };

  const resetDetachedController = () => {
    if (!runtime.controller || document.getElementById('telescope-dialog')) return;
    if (typeof runtime.controller.destroy === 'function') runtime.controller.destroy();
    runtime.controller = null;
    runtime.loadPromise = null;
  };

  const ensureTelescopeStyles = (css) => {
    if (document.getElementById('viscerium-telescope-styles')) return;
    const style = document.createElement('style');
    style.id = 'viscerium-telescope-styles';
    style.textContent = css;
    document.head.append(style);
  };

  const syncScopeLabel = (era) => {
    const dialog = document.getElementById('telescope-dialog');
    if (!(dialog instanceof HTMLDialogElement)) return;

    let label = dialog.querySelector('[data-telescope-scope-label]');
    if (!label) {
      label = document.createElement('p');
      label.className = 'telescope__scope';
      label.setAttribute('data-telescope-scope-label', '');
      const tabs = dialog.querySelector('.telescope__tabs');
      if (tabs) tabs.insertAdjacentElement('afterend', label);
    }

    const scope = telescopeScopeLabel(era);
    label.textContent = `Search scope · ${scope}`;
    dialog.setAttribute('data-search-scope', era || 'all');
  };

  runtime.loadMetadata ??= async () => {
    if (!runtime.metadataPromise) {
      runtime.metadataPromise = fetch(metadataUrl, { cache: 'force-cache' })
        .then((response) => {
          if (!response.ok) throw new Error(`Telescope scope metadata returned ${response.status}`);
          return response.json();
        })
        .catch((error) => {
          runtime.metadataPromise = null;
          console.error('[VISCERIUM] Telescope scope metadata unavailable.', error);
          throw error;
        });
    }
    return runtime.metadataPromise;
  };

  runtime.loadTelescope ??= async () => {
    resetDetachedController();
    if (runtime.controller) return runtime.controller;

    if (!runtime.loadPromise) {
      runtime.loadPromise = Promise.all([
        import('starlight-telescope/styles/telescope.css?raw'),
        import('starlight-telescope/libs/modal'),
        import('starlight-telescope/libs/telescope-search'),
      ])
        .then(([styleModule, modalModule, searchModule]) => {
          ensureTelescopeStyles(styleModule.default);
          if (!document.getElementById('telescope-dialog')) {
            document.body.insertAdjacentHTML('beforeend', modalModule.getModalHTML());
          }

          runtime.controller = new searchModule.default(telescopeConfig);
          const element = ensureBridge();
          if (element) element.telescopeSearch = runtime.controller;
          return runtime.controller;
        })
        .catch((error) => {
          runtime.loadPromise = null;
          console.error('[VISCERIUM] Telescope search failed to load.', error);
          throw error;
        });
    }

    return runtime.loadPromise;
  };

  runtime.apply = async () => {
    const controller = telescopeController();
    if (!controller || controller.isLoading !== false || !Array.isArray(controller.allPages)) {
      return false;
    }
    if (typeof controller.initializeFuse !== 'function') {
      console.error('[VISCERIUM] Telescope internals changed; era-scoped search was not applied.');
      return false;
    }

    let metadata;
    try {
      metadata = await runtime.loadMetadata();
    } catch {
      return false;
    }

    if (!Array.isArray(controller.__visceriumAllPages)) {
      controller.__visceriumAllPages = [...controller.allPages];
    }

    const era = activeEra();
    const scopedPages = filterTelescopePages(controller.__visceriumAllPages, metadata, era);
    controller.allPages = scopedPages;
    controller.filteredPages = [...scopedPages];
    controller.searchResultsWithMatches = [];
    controller.selectedIndex = 0;
    controller.initializeFuse();

    const dialog = document.getElementById('telescope-dialog');
    if (dialog instanceof HTMLDialogElement && dialog.open) {
      if (typeof controller.renderSearchResults === 'function') controller.renderSearchResults();
      if (typeof controller.renderRecentResults === 'function') controller.renderRecentResults();
      if (typeof controller.updateSelectedResult === 'function') controller.updateSelectedResult();
    }

    syncScopeLabel(era);
    runtime.lastEra = era;
    return true;
  };

  runtime.waitUntilReady = async (timeoutMs = 2500) => {
    try {
      await runtime.loadTelescope();
    } catch {
      return false;
    }

    const deadline = performance.now() + timeoutMs;
    do {
      if (await runtime.apply()) return true;
      await new Promise((resolve) => setTimeout(resolve, 50));
    } while (performance.now() < deadline);
    return false;
  };

  runtime.open ??= async () => {
    if (runtime.openPromise) return runtime.openPromise;

    setVisibleTriggerReady(false);
    runtime.openPromise = (async () => {
      if (!await runtime.waitUntilReady()) return;
      const controller = telescopeController();
      if (controller && typeof controller.open === 'function') controller.open();
    })().finally(() => {
      runtime.openPromise = null;
      setVisibleTriggerReady(true);
    });

    return runtime.openPromise;
  };

  runtime.schedule = () => {
    resetDetachedController();
    ensureBridge();
    if (!runtime.controller) {
      setVisibleTriggerReady(true);
      return;
    }

    setVisibleTriggerReady(false);
    clearTimeout(runtime.timer);
    let attempts = 0;

    const tick = async () => {
      attempts += 1;
      if (await runtime.apply()) {
        setVisibleTriggerReady(true);
        return;
      }
      if (attempts < 50) {
        runtime.timer = setTimeout(tick, Math.min(40 + attempts * 10, 250));
      } else {
        setVisibleTriggerReady(true);
      }
    };

    runtime.timer = setTimeout(tick, 0);
  };

  document.addEventListener('keydown', (event) => {
    const key = String(event.key).toLowerCase();
    const shortcut = key === 'k'
      && (event.ctrlKey || event.metaKey)
      && !event.shiftKey
      && !event.altKey;
    if (!shortcut) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    void runtime.open();
  }, true);

  document.addEventListener('astro:page-load', runtime.schedule);
  document.addEventListener('viscerium:era-context', runtime.schedule);
  ensureBridge();
  setVisibleTriggerReady(true);
})();
