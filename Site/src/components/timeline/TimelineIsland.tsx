import { useEffect, useRef } from 'preact/hooks';
import type { TimelineDataset, TimelineLaneMode } from '../../lib/timeline/types';
import { installTimelineChronicle } from '../../lib/timeline/chronicle-view.mjs';
import { installTimelineHovercard } from '../../lib/timeline/hovercard.mjs';
import { installTimelineToolbar } from '../../lib/timeline/toolbar-ui.mjs';
import '../../styles/timeline-chronicle.css';
import '../../styles/timeline-controls.css';

type TimelineIslandOptions = {
  defaultCalendar?: string;
  laneMode?: TimelineLaneMode;
  showFilters?: boolean;
  showMinimap?: boolean;
  showLegend?: boolean;
  compact?: boolean;
};

type FallbackEvent = {
  id: string;
  date: string;
  title: string;
  description: string;
  href: string;
};

type TimelineIslandProps = {
  dataset: TimelineDataset;
  options: TimelineIslandOptions;
  fallbackEvents: FallbackEvent[];
};

export default function TimelineIsland({ dataset, options, fallbackEvents }: TimelineIslandProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLElement>(null);
  const skeletonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    async function mount() {
      const root = mountRef.current;
      if (!root) return;

      root.setAttribute('aria-busy', 'true');
      if (fallbackRef.current) fallbackRef.current.hidden = true;
      if (skeletonRef.current) skeletonRef.current.hidden = false;

      try {
        const { mountTimeline } = await import('../../lib/timeline/chronos-native-renderer.mjs');
        if (cancelled || !mountRef.current) return;

        const cleanupTimeline = mountTimeline(root, dataset, options);
        const cleanupHovercard = installTimelineHovercard(root, dataset);
        try {
          const cleanupChronicle = installTimelineChronicle(root, dataset);
          try {
            const cleanupToolbar = installTimelineToolbar(root);
            cleanup = () => {
              cleanupToolbar();
              cleanupChronicle();
              cleanupHovercard();
              cleanupTimeline();
            };
          } catch (error) {
            cleanupChronicle();
            throw error;
          }
        } catch (error) {
          cleanupHovercard();
          cleanupTimeline();
          throw error;
        }

        root.setAttribute('data-vc-island-mounted', 'true');
        root.setAttribute('aria-busy', 'false');
        if (skeletonRef.current) skeletonRef.current.hidden = true;
        if (fallbackRef.current) fallbackRef.current.hidden = true;
      } catch (error) {
        root.replaceChildren();
        root.removeAttribute('data-vc-island-mounted');
        root.setAttribute('aria-busy', 'false');
        if (skeletonRef.current) skeletonRef.current.hidden = true;
        if (fallbackRef.current) fallbackRef.current.hidden = false;
        console.error('VISCERIUM Chronos timeline failed to mount.', error);
      }
    }

    void mount();

    return () => {
      cancelled = true;
      cleanup?.();
      cleanup = undefined;
    };
  }, [dataset, options]);

  return (
    <div class="vc-timeline-shell not-content" data-vc-timeline-island>
      <div ref={mountRef} data-vc-timeline-mount aria-live="polite" />
      <div
        ref={skeletonRef}
        class={`vc-timeline-skeleton${options.compact ? ' is-compact' : ''}`}
        data-vc-timeline-skeleton
        aria-hidden="true"
        hidden
      >
        <div class="vc-timeline-skeleton-toolbar">
          <span class="vc-timeline-skeleton-field" />
          <span class="vc-timeline-skeleton-field is-wide" />
          <span class="vc-timeline-skeleton-field" />
          <span class="vc-timeline-skeleton-actions" />
        </div>
        <div class="vc-timeline-skeleton-eras">
          <span /><span /><span /><span />
        </div>
        <div class="vc-timeline-skeleton-stage">
          <span class="vc-timeline-skeleton-axis" />
          <div class="vc-timeline-skeleton-events">
            <span /><span /><span /><span /><span /><span />
          </div>
        </div>
        {options.showMinimap !== false && <span class="vc-timeline-skeleton-minimap" />}
      </div>
      <section
        ref={fallbackRef}
        class="vc-timeline-fallback"
        data-vc-fallback
        aria-label="Chronological list"
      >
        <h2>Chronological list</h2>
        <p>This list remains available when the interactive timeline cannot run.</p>
        <ol>
          {fallbackEvents.map((event) => (
            <li key={event.id}>
              <p class="timeline-date">{event.date}</p>
              <h3><a href={event.href}>{event.title}</a></h3>
              <p>{event.description}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
