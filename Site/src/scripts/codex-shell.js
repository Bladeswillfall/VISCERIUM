(() => {
  const telescopeTrigger = () =>
    document.querySelector('telescope-search .telescope__trigger-btn');

  const sync = () => {
    const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
    document.querySelectorAll('[data-codex-search-open]').forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) return;
      button.disabled = !(telescopeTrigger() instanceof HTMLButtonElement);
      button.setAttribute('aria-keyshortcuts', isMac ? 'Meta+K' : 'Control+K');
      const shortcut = button.querySelector('kbd');
      if (shortcut) shortcut.textContent = isMac ? '⌘ K' : 'Ctrl K';
    });
  };

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element
      ? event.target.closest('[data-codex-search-open]')
      : null;
    if (!target) return;
    const trigger = telescopeTrigger();
    if (trigger instanceof HTMLButtonElement) trigger.click();
  });
  document.addEventListener('astro:page-load', () => requestAnimationFrame(sync));
  requestAnimationFrame(sync);
})();

(() => {
  const key = 'viscerium-era-context';
  const eras = ['CITADEL', 'SMOG', 'NEARSIGHT', 'ENTROPY'];
  const root = document.documentElement;

  const normalise = (value) => {
    const match = eras.find((era) => era.toLowerCase() === String(value || '').trim().toLowerCase());
    return match || null;
  };

  const pathEra = () => {
    const match = location.pathname.match(/(?:^|\/)eras\/(citadel|smog|nearsight|entropy)(?:\/|$)/i);
    return match ? normalise(match[1]) : null;
  };

  const setStored = (era) => {
    try {
      if (era) localStorage.setItem(key, era);
      else localStorage.removeItem(key);
    } catch {}
  };

  const stored = () => {
    try { return normalise(localStorage.getItem(key)); } catch { return null; }
  };

  const scopeTagLinks = (active) => {
    if (!active) return;
    const prefix = `/eras/${active.toLowerCase()}/tags/`;
    document.querySelectorAll('a[href^="/tags/"]').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;
      link.setAttribute('href', prefix + href.slice('/tags/'.length));
    });
  };

  const syncSidebarScope = (active) => {
    document.querySelectorAll('.codex-sidebar-global').forEach((node) => {
      node.hidden = Boolean(active);
    });
    document.querySelectorAll('.codex-sidebar-era-scope').forEach((node) => {
      const scope = normalise(node.getAttribute('data-era-sidebar'));
      node.hidden = !active || scope !== active;
    });
  };

  const sync = () => {
    const control = document.querySelector('[data-era-context-control]');
    const declared = normalise(control?.getAttribute('data-page-era'));
    const fromPath = pathEra();
    let remembered = stored();
    const neutralAllEraView = location.pathname === '/'
      || location.pathname === '/entities/'
      || location.pathname.startsWith('/entities/');
    if (neutralAllEraView) {
      setStored(null);
      remembered = null;
    }

    // If an era is remembered, open the relationships page for that era.
    if (remembered && !fromPath && !declared && location.pathname === '/relationships/') {
      location.replace(`/eras/${remembered.toLowerCase()}/relationships/`);
      return;
    }

    const active = neutralAllEraView ? null : (fromPath || declared || remembered);
    if (!neutralAllEraView && (fromPath || declared)) setStored(active);

    if (active) root.setAttribute('data-era-context', active);
    else root.removeAttribute('data-era-context');

    syncSidebarScope(active);
    document.querySelectorAll('[data-era-context-control]').forEach((node) => {
      node.hidden = !active;
      const label = node.querySelector('[data-era-context-label]');
      const home = node.querySelector('[data-era-home]');
      const exit = node.querySelector('[data-era-exit-label]');
      if (label) label.textContent = active ? `${active} mode` : '';
      if (home && active) home.setAttribute('href', `/eras/${active.toLowerCase()}/`);
      if (exit) exit.textContent = active ? `Exit ${active} · All eras` : 'All eras';
    });
    scopeTagLinks(active);
    document.dispatchEvent(new CustomEvent('viscerium:era-context', { detail: { era: active } }));
  };

  if (!window.__visceriumEraContextBound) {
    document.addEventListener('click', (event) => {
      const exit = event.target instanceof Element ? event.target.closest('[data-era-exit]') : null;
      if (exit) {
        setStored(null);
        root.removeAttribute('data-era-context');
      }
    }, true);
    document.addEventListener('astro:page-load', sync);
    window.__visceriumEraContextBound = true;
  }
  sync();
})();

(() => {
  const runtimeKey = '__visceriumHeaderRuntime';
  const root = document.documentElement;
  const runtime = window[runtimeKey] ?? (window[runtimeKey] = {});
  const desktopQuery = runtime.desktopQuery ?? window.matchMedia('(min-width: 800px)');
  const mobileTopThreshold = 12;
  const mobileRevealDistance = 64;
  const mobileHideDistance = 36;

  runtime.desktopQuery = desktopQuery;

  runtime.setMobileHeaderHidden = (hidden) => {
    root.toggleAttribute('data-codex-mobile-header-hidden', hidden && !desktopQuery.matches);
  };

  runtime.resetMobileHeader = () => {
    runtime.mobileScrollY = Math.max(0, window.scrollY);
    runtime.mobileScrollDirection = 0;
    runtime.mobileScrollDistance = 0;
    runtime.setMobileHeaderHidden(false);
  };

  runtime.onMobileScroll = () => {
    if (desktopQuery.matches) return;

    const scrollY = Math.max(0, window.scrollY);

    if (scrollY <= mobileTopThreshold) {
      runtime.mobileScrollY = scrollY;
      runtime.mobileScrollDirection = 0;
      runtime.mobileScrollDistance = 0;
      runtime.setMobileHeaderHidden(false);
      return;
    }

    const previousScrollY = runtime.mobileScrollY ?? scrollY;
    const delta = scrollY - previousScrollY;
    runtime.mobileScrollY = scrollY;

    if (Math.abs(delta) < 1) return;

    const direction = delta > 0 ? 1 : -1;
    if (direction !== runtime.mobileScrollDirection) {
      runtime.mobileScrollDirection = direction;
      runtime.mobileScrollDistance = 0;
    }

    runtime.mobileScrollDistance += Math.abs(delta);
    const hidden = root.hasAttribute('data-codex-mobile-header-hidden');

    if (hidden && direction < 0 && runtime.mobileScrollDistance >= mobileRevealDistance) {
      runtime.mobileScrollDistance = 0;
      runtime.setMobileHeaderHidden(false);
    } else if (!hidden && direction > 0 && runtime.mobileScrollDistance >= mobileHideDistance) {
      runtime.mobileScrollDistance = 0;
      runtime.setMobileHeaderHidden(true);
    }
  };

  runtime.sync = () => {
    const isDesktop = desktopQuery.matches;
    root.toggleAttribute('data-codex-wide-header', isDesktop);
    root.toggleAttribute('data-codex-mobile-header', !isDesktop);
    runtime.resetMobileHeader();
  };

  if (!runtime.bound) {
    desktopQuery.addEventListener('change', runtime.sync);
    document.addEventListener('astro:page-load', runtime.sync);
    window.addEventListener('scroll', runtime.onMobileScroll, { passive: true });
    document.addEventListener('focusin', (event) => {
      if (!desktopQuery.matches && event.target instanceof Element && event.target.closest('header.header')) {
        runtime.setMobileHeaderHidden(false);
        runtime.mobileScrollDistance = 0;
      }
    });
    runtime.bound = true;
  }

  runtime.sync();
})();

(() => {
  const root = document.documentElement;
  const runtime = window.__visceriumSidebar ??= {};
  const desktopQuery = window.matchMedia('(min-width: 800px)');

  const setCollapsed = (button, collapsed) => {
    root.classList.toggle('codex-sidebar-collapsed', collapsed);
    button.setAttribute('aria-expanded', String(!collapsed));
    button.setAttribute('aria-label', collapsed ? 'Show sidebar' : 'Hide sidebar');
    const icon = button.querySelector('span');
    if (icon) icon.textContent = collapsed ? '☰' : '←';
  };

  runtime.syncMobileToc = () => {
    const summary = document.getElementById('starlight__on-this-page--mobile');
    const navigation = summary?.closest('nav');
    if (!navigation) return;

    if (desktopQuery.matches) {
      navigation.style.setProperty('display', 'none', 'important');
      navigation.setAttribute('aria-hidden', 'true');
    } else {
      navigation.style.removeProperty('display');
      navigation.removeAttribute('aria-hidden');
    }
  };

  runtime.sync = (resetCollapsed = false) => {
    const button = document.querySelector('[data-codex-sidebar-toggle]');
    const sidebar = document.getElementById('starlight__sidebar');
    const hasDesktopSidebar = Boolean(sidebar && desktopQuery.matches);

    root.toggleAttribute('data-codex-desktop-sidebar', hasDesktopSidebar);
    runtime.syncMobileToc();

    if (!button) return;

    if (!hasDesktopSidebar) {
      button.hidden = true;
      root.classList.remove('codex-sidebar-collapsed');
      return;
    }

    button.hidden = false;
    setCollapsed(button, resetCollapsed || root.classList.contains('codex-sidebar-collapsed'));

    if (button.dataset.codexSidebarBound === 'true') return;
    button.dataset.codexSidebarBound = 'true';
    button.addEventListener('click', () => {
      const collapsed = !root.classList.contains('codex-sidebar-collapsed');
      setCollapsed(button, collapsed);
    });
  };

  if (!runtime.pageLoadBound) {
    document.addEventListener('astro:page-load', () => runtime.sync(true));
    runtime.pageLoadBound = true;
  }

  if (!runtime.desktopQueryBound) {
    desktopQuery.addEventListener('change', () => runtime.sync(true));
    runtime.desktopQueryBound = true;
  }

  if (!runtime.mobileTocObserver) {
    runtime.mobileTocObserver = new MutationObserver(() => runtime.syncMobileToc());
    runtime.mobileTocObserver.observe(document.body, { childList: true, subtree: true });
  }

  runtime.sync(true);
})();

const safeUrl = (value) => {
  try {
    const url = new URL(String(value));
    return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
};

const actionFor = (mention) => ({
  'like-of': 'liked this page',
  'repost-of': 'reposted this page',
  'bookmark-of': 'bookmarked this page',
  'in-reply-to': 'replied',
  'mention-of': 'mentioned this page',
})[String(mention['wm-property'])] ?? 'responded';

class CodexWebmentions extends HTMLElement {
  async connectedCallback() {
    if (this.dataset.loaded) return;
    this.dataset.loaded = 'true';

    const state = this.querySelector('[data-state]');
    const list = this.querySelector('[data-list]');
    if (!state || !list || !this.dataset.api) return;

    try {
      const canonical = document.querySelector('link[rel="canonical"]')?.href ?? location.href;
      const target = new URL(canonical);
      target.hash = '';
      target.search = '';

      const api = new URL(this.dataset.api);
      api.searchParams.set('target', target.href);
      api.searchParams.set('per-page', this.dataset.limit ?? '24');
      const response = await fetch(api, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(String(response.status));

      const payload = await response.json();
      const mentions = (Array.isArray(payload.children) ? payload.children : [])
        .filter((mention) => !mention?.['wm-private'])
        .slice(0, Number(this.dataset.limit) || 24);

      state.textContent = mentions.length
        ? `${mentions.length} response${mentions.length === 1 ? '' : 's'}`
        : 'No responses yet.';

      for (const mention of mentions) {
        const author = mention.author ?? {};
        const article = document.createElement('article');
        const meta = document.createElement('p');
        const authorUrl = safeUrl(author.url);
        const authorName = author.name || author.url || 'Someone';
        const authorNode = authorUrl ? document.createElement('a') : document.createElement('strong');
        authorNode.textContent = authorName;
        if (authorUrl && authorNode instanceof HTMLAnchorElement) {
          authorNode.href = authorUrl;
          authorNode.rel = 'nofollow ugc noopener noreferrer';
        }
        meta.append(authorNode, ` ${actionFor(mention)}`);

        const date = new Date(mention.published || mention['wm-received'] || '');
        if (!Number.isNaN(date.valueOf())) {
          const time = document.createElement('time');
          time.dateTime = date.toISOString();
          time.textContent = date.toLocaleDateString();
          meta.append(' on ', time);
        }
        article.append(meta);

        const text = String(mention.content?.text ?? '').trim().replace(/\s+/g, ' ');
        if (text) {
          const content = document.createElement('p');
          content.textContent = text.length > 520 ? `${text.slice(0, 519)}...` : text;
          article.append(content);
        }

        const sourceUrl = safeUrl(mention.url);
        if (sourceUrl) {
          const source = document.createElement('a');
          source.href = sourceUrl;
          source.rel = 'nofollow ugc noopener noreferrer';
          source.textContent = 'View source';
          article.append(source);
        }
        list.append(article);
      }
    } catch {
      state.textContent = 'Responses are unavailable.';
    }
  }
}

if (!customElements.get('codex-webmentions')) {
  customElements.define('codex-webmentions', CodexWebmentions);
}
