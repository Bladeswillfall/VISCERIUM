export function explorationMobileQuery() {
  return window.matchMedia('(max-width: 48rem), (max-height: 32rem) and (max-width: 64rem)');
}

export function closeContainingPopover(element) {
  const popover = element?.closest?.('[popover]');
  if (popover?.matches?.(':popover-open')) popover.hidePopover();
}

export function showExplorationDialog(dialog) {
  if (!dialog || dialog.open) return;
  dialog.showModal();
}

export function bindExplorationDialog(dialog) {
  if (!dialog || dialog.dataset.explorationDialogBound === 'true') return;
  dialog.dataset.explorationDialogBound = 'true';
  dialog.querySelectorAll('[data-exploration-dialog-close]').forEach((button) => {
    button.addEventListener('click', () => dialog.close());
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}

function bindExplorationFocusCleanup() {
  const runtime = window.__visceriumExplorationFocus ??= {};
  if (runtime.cleanupBound) return;

  document.addEventListener('astro:page-load', () => {
    if (!document.querySelector('[data-exploration-focus-toggle]')) {
      document.documentElement.removeAttribute('data-exploration-focus');
    }
  });
  runtime.cleanupBound = true;
}

export function bindExplorationFocus(root, onChange = () => {}) {
  bindExplorationFocusCleanup();

  const buttons = [...root.querySelectorAll('[data-exploration-focus-toggle]')];
  if (!buttons.length) return;

  const documentRoot = document.documentElement;
  const sync = () => {
    const active = documentRoot.hasAttribute('data-exploration-focus');
    buttons.forEach((button) => {
      button.setAttribute('aria-pressed', String(active));
      button.setAttribute('aria-label', active
        ? root.dataset.focusExitLabel
        : root.dataset.focusEnterLabel);
      const label = button.querySelector('[data-exploration-focus-label]');
      if (label) label.textContent = active
        ? root.dataset.focusExitText
        : root.dataset.focusEnterText;
    });
    onChange(active);
  };

  buttons.forEach((button) => {
    if (button.dataset.explorationFocusBound === 'true') return;
    button.dataset.explorationFocusBound = 'true';
    button.addEventListener('click', () => {
      documentRoot.toggleAttribute('data-exploration-focus');
      sync();
    });
  });

  sync();
}
