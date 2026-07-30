import { formatAbsoluteDay } from '../calendar/runtime.mjs';
import { escapeHtml } from '../codex-paths.mjs';

const importanceLabels = {
  landmark: 'Landmark',
  major: 'Major',
  standard: 'Standard',
  minor: 'Minor',
  incidental: 'Incidental',
};

const certaintyLabels = {
  exact: 'Exact',
  approximate: 'Approximate',
  disputed: 'Disputed',
  legendary: 'Legendary',
};
function cssToken(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
}

function formatEventDate(event, calendarId) {
  const start = formatAbsoluteDay(event.absoluteStartDay, calendarId, event.precision);
  if (event.absoluteEndDay === undefined) return start;
  return `${start} — ${formatAbsoluteDay(
    event.absoluteEndDay,
    calendarId,
    event.endPrecision ?? event.precision,
  )}`;
}

function resolveEra(event, erasById, eras) {
  for (const id of event.eras ?? []) {
    const era = erasById.get(id);
    if (era) return era;
  }
  return eras.find((era) => (
    event.absoluteStartDay >= era.absoluteStartDay
    && event.absoluteStartDay <= era.absoluteEndDay
  ));
}

function renderTag(label, className = '') {
  return `<span class="vc-chronicle-tag${className ? ` ${className}` : ''}">${escapeHtml(label)}</span>`;
}

function renderSummaryTags(event) {
  const tags = [
    renderTag(importanceLabels[event.importance] ?? event.importance, `importance-${cssToken(event.importance)}`),
    renderTag(certaintyLabels[event.certainty] ?? event.certainty, `certainty-${cssToken(event.certainty)}`),
    ...(event.categories ?? []).slice(0, 2).map((category) => renderTag(category, `category-${cssToken(category)}`)),
  ];
  const hiddenCategoryCount = Math.max(0, (event.categories?.length ?? 0) - 2);
  if (hiddenCategoryCount) tags.push(renderTag(`+${hiddenCategoryCount}`));
  return tags.join('');
}

function renderDefinition(label, values) {
  const items = Array.isArray(values) ? values.filter(Boolean) : [values].filter(Boolean);
  if (!items.length) return '';
  return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(items.join(', '))}</dd></div>`;
}

function renderDossier(event) {
  const precision = event.absoluteEndDay === undefined || !event.endPrecision
    ? event.precision
    : `${event.precision} — ${event.endPrecision}`;
  return `
    <div class="vc-chronicle-dossier">
      <p class="vc-chronicle-dossier-kicker">Archival dossier</p>
      <dl>
        ${renderDefinition('Record type', event.kind)}
        ${renderDefinition('Precision', precision)}
        ${renderDefinition('Certainty', certaintyLabels[event.certainty] ?? event.certainty)}
        ${renderDefinition('Importance', importanceLabels[event.importance] ?? event.importance)}
        ${renderDefinition('Categories', event.categories)}
        ${renderDefinition('Declared lanes', event.lanes)}
        ${renderDefinition('Factions', event.factions)}
        ${renderDefinition('Locations', event.locations)}
        ${renderDefinition('Participants', event.participants)}
        ${renderDefinition('Status', event.status)}
        ${renderDefinition('Tags', event.tags)}
      </dl>
      <div class="vc-chronicle-actions">
        <button
          type="button"
          data-vc-select-event="${escapeHtml(event.id)}"
          data-vc-chronicle-locate
        >Locate on timeline</button>
        <a
          class="vc-chronicle-article-link"
          href="${escapeHtml(event.href)}"
          data-vc-chronicle-article
          data-vc-event-id="${escapeHtml(event.id)}"
        >Open full article</a>
      </div>
    </div>`;
}

function renderEntry(event, calendarId) {
  return `
    <li
      class="vc-chronicle-item importance-${cssToken(event.importance)} certainty-${cssToken(event.certainty)}"
      data-vc-chronicle-event="${escapeHtml(event.id)}"
    >
      <details class="vc-chronicle-entry">
        <summary>
          <time class="vc-chronicle-date">${escapeHtml(formatEventDate(event, calendarId))}</time>
          <span class="vc-chronicle-marker" aria-hidden="true"></span>
          <span class="vc-chronicle-summary-copy">
            <strong class="vc-chronicle-title">${escapeHtml(event.title)}</strong>
            <span class="vc-chronicle-excerpt">${escapeHtml(event.description)}</span>
            <span class="vc-chronicle-tags" aria-label="Event classification">${renderSummaryTags(event)}</span>
          </span>
          <span class="vc-chronicle-disclosure" aria-hidden="true">Dossier</span>
        </summary>
        ${renderDossier(event)}
      </details>
    </li>`;
}

function groupIntoChapters(events, erasById, eras) {
  const chapters = [];
  for (const event of events) {
    const era = resolveEra(event, erasById, eras);
    const key = era?.id ?? 'unassigned';
    let chapter = chapters.at(-1);
    if (!chapter || chapter.key !== key) {
      chapter = { key, era, events: [] };
      chapters.push(chapter);
    }
    chapter.events.push(event);
  }
  return chapters;
}

function renderChapter(chapter, calendarId, index) {
  const era = chapter.era;
  const title = era?.title ?? 'Unassigned chronology';
  const description = era?.description ?? 'Records outside the presently defined eras.';
  const className = era ? ` era-${cssToken(era.id)}` : '';
  return `
    <section class="vc-chronicle-chapter${className}" data-vc-chronicle-chapter="${escapeHtml(chapter.key)}">
      <header class="vc-chronicle-chapter-header">
        <div>
          <p class="vc-chronicle-chapter-index">Era ${String(index + 1).padStart(2, '0')}</p>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(description)}</p>
        </div>
        ${era?.href ? `<a href="${escapeHtml(era.href)}">Open era article</a>` : ''}
      </header>
      <ol class="vc-chronicle-records">
        ${chapter.events.map((event) => renderEntry(event, calendarId)).join('')}
      </ol>
    </section>`;
}

function uniqueEventIds(elements) {
  const seen = new Set();
  const ids = [];
  for (const element of elements) {
    const id = element.getAttribute('data-vc-select-event');
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

/**
 * Turns the renderer's intentionally plain, filtered list into an archival
 * chronicle. The Chronos graph and its data lifecycle remain untouched: this
 * module observes only the list panel and enhances the rows that renderer has
 * already selected, ordered and paginated.
 */
export function installTimelineChronicle(root, dataset) {
  const listPanel = root.querySelector('[data-vc-list-panel]');
  const listButton = root.querySelector('[data-vc-list]');
  const timelineStage = root.querySelector('.vc-timeline-stage');
  const minimapWrap = root.querySelector('[data-vc-minimap-wrap]');
  const calendarSelect = root.querySelector('[data-vc-calendar]');
  if (!listPanel || !listButton || !timelineStage || !calendarSelect) return () => {};

  const eventById = new Map((dataset.events ?? []).map((event) => [event.id, event]));
  const eras = [...(dataset.eras ?? [])].sort((left, right) => left.order - right.order);
  const erasById = new Map(eras.map((era) => [era.id, era]));
  let destroyed = false;
  let renderQueued = false;

  const renderChronicle = () => {
    renderQueued = false;
    if (destroyed || listPanel.hidden || listPanel.querySelector(':scope > .vc-chronicle')) return;

    const plainList = listPanel.querySelector(':scope > ol');
    if (!plainList) return;
    const eventIds = uniqueEventIds(plainList.querySelectorAll('[data-vc-select-event]'));
    const events = eventIds.map((id) => eventById.get(id)).filter(Boolean);
    const moreButton = listPanel.querySelector('[data-vc-list-more]');
    const chapters = groupIntoChapters(events, erasById, eras);
    const recordLabel = `${events.length} ${events.length === 1 ? 'record' : 'records'}`;

    listPanel.innerHTML = `
      <section class="vc-chronicle" aria-labelledby="vc-chronicle-title">
        <header class="vc-chronicle-masthead">
          <div>
            <p class="vc-chronicle-kicker">Chronicle</p>
            <h2 id="vc-chronicle-title">${escapeHtml(dataset.title)}</h2>
            <p>${escapeHtml(dataset.description)}</p>
          </div>
          <p class="vc-chronicle-count"><strong>${escapeHtml(recordLabel)}</strong><span>matching the current view</span></p>
        </header>
        ${events.length
          ? `<div class="vc-chronicle-chapters">${chapters.map((chapter, index) => renderChapter(chapter, calendarSelect.value, index)).join('')}</div>`
          : `<div class="vc-chronicle-empty"><h3>No records found</h3><p>Adjust the search or filters to broaden this chronicle.</p></div>`}
        ${moreButton ? `<button type="button" class="vc-timeline-list-more vc-chronicle-more" data-vc-list-more>${escapeHtml(moreButton.textContent?.trim() ?? 'Show more records')}</button>` : ''}
      </section>`;
    listPanel.dataset.vcChronicleEnhanced = 'true';
  };

  const scheduleRender = () => {
    if (destroyed || renderQueued || listPanel.hidden) return;
    renderQueued = true;
    queueMicrotask(renderChronicle);
  };

  const syncMode = () => {
    if (destroyed) return;
    const chronicleVisible = !listPanel.hidden;
    timelineStage.hidden = chronicleVisible;
    if (minimapWrap) minimapWrap.hidden = chronicleVisible;
    root.classList.toggle('is-chronicle-view', chronicleVisible);
    listButton.textContent = chronicleVisible ? 'Graph view' : 'Chronicle';
    listButton.setAttribute('aria-label', chronicleVisible ? 'Return to graph view' : 'Open chronicle view');
    if (chronicleVisible) scheduleRender();
  };

  const handleRootClick = (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (target.closest('[data-vc-list]')) {
      queueMicrotask(syncMode);
      return;
    }

    const locateButton = target.closest('[data-vc-chronicle-locate]');
    if (locateButton) {
      queueMicrotask(() => {
        if (!listPanel.hidden) listButton.click();
      });
      return;
    }

    const summary = target.closest('.vc-chronicle-entry > summary');
    if (summary) {
      queueMicrotask(() => {
        const opened = summary.parentElement;
        if (!opened?.open) return;
        for (const entry of listPanel.querySelectorAll('.vc-chronicle-entry[open]')) {
          if (entry !== opened) entry.open = false;
        }
      });
    }
  };

  const observer = new MutationObserver(() => {
    if (destroyed || listPanel.hidden || listPanel.querySelector(':scope > .vc-chronicle')) return;
    scheduleRender();
  });
  observer.observe(listPanel, { childList: true });

  root.addEventListener('click', handleRootClick);
  listButton.textContent = 'Chronicle';
  listButton.setAttribute('aria-label', 'Open chronicle view');
  syncMode();

  return () => {
    destroyed = true;
    observer.disconnect();
    root.removeEventListener('click', handleRootClick);
    root.classList.remove('is-chronicle-view');
    timelineStage.hidden = false;
    if (minimapWrap) minimapWrap.hidden = false;
  };
}
