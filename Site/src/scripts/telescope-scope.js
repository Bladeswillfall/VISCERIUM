import { filterTelescopePages, telescopeScopeLabel } from '../lib/telescope-scope.mjs';

(() => {
  const runtime = window.__visceriumTelescopeScope ??= {};
  const root = document.documentElement;
  const historicalEras = ['CITADEL', 'SMOG', 'NEARSIGHT', 'ENTROPY'];
  const metadataUrl = '/telescope-scope.json';

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

  const telescopeElement = () => document.querySelector('telescope-search');
  const telescopeController = () => telescopeElement()?.telescopeSearch ?? null;
  const telescopeTrigger = () => telescopeElement()?.querySelector('.telescope__trigger-btn') ?? null;

  const setVisibleTriggerReady = (ready) => {
    document.querySelectorAll('[data-codex-search-open]').forEach((button) => {
      if (button instanceof HTMLButtonElement) button.disabled = !ready;
    });
    root.toggleAttribute('data-telescope-scope-ready', ready);
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

  runtime.apply = async () => {
    const controller = telescopeController();
    if (!controller || controller.isLoading !== false || !Array.isArray(controller.allPages)) {
      setVisibleTriggerReady(false);
      return false;
    }
    if (typeof controller.initializeFuse !== 'function') {
      setVisibleTriggerReady(false);
      console.error('[VISCERIUM] Telescope internals changed; era-scoped search was not applied.');
      return false;
    }

    let metadata;
    try {
      metadata = await runtime.loadMetadata();
    } catch {
      setVisibleTriggerReady(false);
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
    setVisibleTriggerReady(true);
    runtime.lastEra = era;
    return true;
  };

  runtime.waitUntilReady = async (timeoutMs = 2500) => {
    const deadline = performance.now() + timeoutMs;
    do {
      if (await runtime.apply()) return true;
      await new Promise((resolve) => setTimeout(resolve, 50));
    } while (performance.now() < deadline);
    return false;
  };

  runtime.schedule = () => {
    setVisibleTriggerReady(false);
    clearTimeout(runtime.timer);
    let attempts = 0;

    const tick = async () => {
      attempts += 1;
      if (await runtime.apply()) return;
      if (attempts < 50) runtime.timer = setTimeout(tick, Math.min(40 + attempts * 10, 250));
    };

    runtime.timer = setTimeout(tick, 0);
  };

  // Guard the visible header control while Telescope is still loading or being re-scoped.
  document.addEventListener('click', async (event) => {
    const button = event.target instanceof Element
      ? event.target.closest('[data-codex-search-open]')
      : null;
    if (!button || root.hasAttribute('data-telescope-scope-ready')) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (await runtime.waitUntilReady()) {
      const trigger = telescopeTrigger();
      if (trigger instanceof HTMLButtonElement) trigger.click();
    }
  }, true);

  document.addEventListener('astro:page-load', runtime.schedule);
  document.addEventListener('viscerium:era-context', runtime.schedule);
  runtime.schedule();
})();
