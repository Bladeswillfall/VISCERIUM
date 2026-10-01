import { parseIconLabel } from './icon-spec.mjs';

function isOverviewLink(entry) {
  return entry?.type === 'link'
    && parseIconLabel(entry.label ?? '').label.trim() === 'Overview';
}

export function sidebarGroupContent(entries = []) {
  const visibleEntries = entries.filter((entry) => !isOverviewLink(entry));
  return {
    visibleEntries,
    overviewOnlyLink: visibleEntries.length === 0 ? entries.find(isOverviewLink) : undefined,
  };
}
