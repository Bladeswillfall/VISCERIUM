const toolbarIcons = {
  calendar: 'event',
  search: 'search',
  grouping: 'view-column',
  previous: 'chevron-left',
  next: 'chevron-right',
  zoomOut: 'zoom-out',
  zoomIn: 'zoom-in',
  reset: 'restart-alt',
  chronicle: 'codex',
  graph: 'bar-chart',
};

function localIcon(document, asset, className) {
  const icon = document.createElement('span');
  icon.className = `codex-icon codex-local-icon ${className}`;
  icon.setAttribute('aria-hidden', 'true');
  icon.style.setProperty('--icon', `url('/icons/${asset}.svg')`);
  return icon;
}

function replaceTimelineIcons(root) {
  for (const source of root.querySelectorAll('svg.vc-timeline-control-icon[data-vc-toolbar-icon]')) {
    const name = source.dataset.vcToolbarIcon;
    const asset = toolbarIcons[name];
    if (!asset) continue;

    const replacement = localIcon(root.ownerDocument, asset, 'vc-timeline-control-icon');
    replacement.dataset.vcToolbarIcon = name;
    source.replaceWith(replacement);
  }

  for (const source of root.querySelectorAll('.vc-timeline-refit-button > svg')) {
    const replacement = localIcon(root.ownerDocument, 'fit-screen', 'vc-timeline-refit-site-icon');
    replacement.style.width = '1rem';
    replacement.style.height = '1rem';
    replacement.style.margin = 'auto';
    source.replaceWith(replacement);
  }
}

export function installTimelineSiteIcons(root) {
  replaceTimelineIcons(root);

  let queued = false;
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      replaceTimelineIcons(root);
    });
  });
  observer.observe(root, { childList: true, subtree: true });

  return () => observer.disconnect();
}
