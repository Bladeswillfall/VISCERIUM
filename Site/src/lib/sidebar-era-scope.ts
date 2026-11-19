import { HISTORICAL_ERAS, normaliseEra } from './era-context.mjs';
import { parseIconLabel } from './icon-spec.mjs';

type SidebarEntry = {
  type?: string;
  label?: string;
  collapsed?: boolean;
  entries?: SidebarEntry[];
};

function sidebarLabel(entry: SidebarEntry | null | undefined): string {
  return parseIconLabel(entry?.label ?? '').label.trim();
}

function historicalEra(value: unknown): string | undefined {
  const era = normaliseEra(value);
  return era && HISTORICAL_ERAS.includes(era) ? era : undefined;
}

/**
 * Keep the complete Codex tree intact while marking the four historical era
 * branches for contextual visibility. Universal and utility entries are never
 * filtered or moved; an active era only hides its three historical siblings.
 */
export function scopeHistoricalEraBranches(
  entries: SidebarEntry[] | null | undefined,
  activeEra?: unknown,
): SidebarEntry[] {
  const scopedEra = historicalEra(activeEra);

  return (entries ?? []).map((entry) => {
    if (entry?.type !== 'group' || sidebarLabel(entry).toLowerCase() !== 'eras') {
      return entry;
    }

    return {
      ...entry,
      collapsed: scopedEra ? false : entry.collapsed,
      entries: (entry.entries ?? []).map((child) => {
        const era = historicalEra(sidebarLabel(child));
        if (!era) return child;

        return {
          ...child,
          collapsed: scopedEra ? era !== scopedEra : child.collapsed,
          sidebarEra: era,
          sidebarHidden: Boolean(scopedEra && era !== scopedEra),
        };
      }),
    };
  });
}
