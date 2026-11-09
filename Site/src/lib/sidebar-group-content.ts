import { parseIconLabel } from './icon-spec.mjs';

type SidebarEntry = { type?: string; label?: string; href?: string; isCurrent?: boolean };

function isOverviewLink(entry: SidebarEntry | null | undefined): boolean {
  return entry?.type === 'link'
    && parseIconLabel(entry.label ?? '').label.trim() === 'Overview';
}

export function sidebarGroupContent<T extends SidebarEntry>(entries: T[] = []) {
  const visibleEntries = entries.filter((entry) => !isOverviewLink(entry));
  return {
    visibleEntries,
    overviewOnlyLink: visibleEntries.length === 0 ? entries.find(isOverviewLink) : undefined,
  };
}
