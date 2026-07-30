import type { CalendarDateCertainty, CalendarDateInput, CalendarDatePrecision } from '../calendar/types';

export type TimelineEventKind = 'milestone' | 'event' | 'period';
export type TimelineRecordKind = TimelineEventKind | 'era';
export type TimelineImportance = 'landmark' | 'major' | 'standard' | 'minor' | 'incidental';
export type TimelineEditorialOverride = 'auto' | 'include' | 'exclude';
export type TimelineLaneMode = 'unified' | 'lane' | 'category';

export type ResolvedTimelineDate = {
  source: CalendarDateInput;
  absoluteDay: number;
  precision: CalendarDatePrecision;
  certainty: CalendarDateCertainty;
};

export type TimelineEvent = {
  id: string;
  title: string;
  description: string;
  href: string;
  sourcePath?: string;
  absoluteStartDay: number;
  absoluteEndDay?: number;
  precision: CalendarDatePrecision;
  endPrecision?: CalendarDatePrecision;
  certainty: CalendarDateCertainty;
  kind: TimelineEventKind;
  importance: TimelineImportance;
  categories: string[];
  lanes: string[];
  eras: string[];
  factions: string[];
  locations: string[];
  participants: string[];
  status?: string;
  tags: string[];
  editorialOrder?: number;
};

export type TimelineEra = {
  id: string;
  title: string;
  description: string;
  href: string;
  sourcePath?: string;
  absoluteStartDay: number;
  absoluteEndDay: number;
  order: number;
  visualToken: string;
  defaultViewport: {
    startDay?: number;
    endDay?: number;
    paddingDays?: number;
  };
  allowGapAfter?: boolean;
};

export type TimelineDataset = {
  id: string;
  title: string;
  description: string;
  defaultCalendar: string;
  absoluteStartDay: number;
  absoluteEndDay: number;
  events: TimelineEvent[];
  eras: TimelineEra[];
  generatedAt: string;
};

export type TimelineManifestEntry = {
  id: string;
  title: string;
  description: string;
  href: string;
  eventCount: number;
  absoluteStartDay: number;
  absoluteEndDay: number;
  defaultCalendar: string;
  eraArticle?: string;
};

export type TimelineManifest = {
  generatedAt: string;
  timelines: TimelineManifestEntry[];
};

export type TimelineFilterState = {
  search: string;
  importance: TimelineImportance[];
  categories: string[];
  eras: string[];
  laneMode: TimelineLaneMode;
};

export type TimelineDisplayConfiguration = {
  timelineId: string;
  defaultCalendar?: string;
  laneMode?: TimelineLaneMode;
  showFilters?: boolean;
  showMinimap?: boolean;
  showLegend?: boolean;
  compact?: boolean;
};

export type TimelineValidationIssue = {
  severity: 'error' | 'warning';
  sourcePath: string;
  field: string;
  message: string;
};
