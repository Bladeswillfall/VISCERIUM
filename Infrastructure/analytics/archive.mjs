#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HOST_RE = /^[a-z0-9.-]+$/i;
const COMMENT_LIMIT = 10_000;
const SNAPSHOT_CONCURRENCY = 8;

function requiredEnv(name, fallback) {
  const value = process.env[name]?.trim() || fallback;
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function parseIsoDate(value) {
  if (!DATE_RE.test(value)) throw new Error(`Invalid date: ${value}`);
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid date: ${value}`);
  }
  return value;
}

function nextDate(value) {
  const date = new Date(`${parseIsoDate(value)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function londonYesterday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const localToday = `${values.year}-${values.month}-${values.day}`;
  const date = new Date(`${localToday}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function monthRange(month) {
  if (!MONTH_RE.test(month)) throw new Error(`Invalid month: ${month}`);
  const start = parseIsoDate(`${month}-01`);
  const end = new Date(`${start}T00:00:00Z`);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end: end.toISOString().slice(0, 10) };
}

function dateRange(from, to) {
  const start = parseIsoDate(from);
  const finish = parseIsoDate(to);
  if (finish < start) throw new Error('--to must be on or after --from');
  const dates = [];
  for (let date = start; date <= finish; date = nextDate(date)) dates.push(date);
  return dates;
}

function dailyTask(date) {
  const key = parseIsoDate(date);
  return { kind: 'daily', key, start: key, end: nextDate(key) };
}

export function dailyCatchupTasks(latest, yesterday = londonYesterday()) {
  const target = parseIsoDate(yesterday);
  if (!latest) return [dailyTask(target)];
  const start = nextDate(parseIsoDate(latest));
  if (start > target) return [];
  return dateRange(start, target).map(dailyTask);
}

export function parseArgs(argv) {
  const values = new Map();
  const flags = new Set();
  for (const arg of argv) {
    if (!arg.startsWith('--')) throw new Error(`Unknown argument: ${arg}`);
    const [key, value] = arg.split('=', 2);
    if (value === undefined) flags.add(key);
    else values.set(key, value);
  }

  const modes = [values.has('--date'), values.has('--month'), values.has('--from') || values.has('--to')]
    .filter(Boolean).length;
  if (modes > 1) throw new Error('Use only one of --date, --month, or --from/--to');
  if (values.has('--from') !== values.has('--to')) throw new Error('--from and --to must be used together');
  if (flags.has('--snapshots') && flags.has('--no-snapshots')) {
    throw new Error('Use only one of --snapshots or --no-snapshots');
  }

  const defaultDate = londonYesterday();
  let tasks;
  let snapshotsByDefault = false;
  if (values.has('--month')) {
    const month = values.get('--month');
    const { start, end } = monthRange(month);
    tasks = [{ kind: 'monthly', key: start, start, end }];
  } else if (values.has('--from')) {
    tasks = dateRange(values.get('--from'), values.get('--to')).map(dailyTask);
  } else {
    const date = parseIsoDate(values.get('--date') ?? defaultDate);
    tasks = [dailyTask(date)];
    snapshotsByDefault = !values.has('--date') || date === defaultDate;
  }

  return {
    tasks,
    automatic: modes === 0,
    snapshots: flags.has('--snapshots') || (!flags.has('--no-snapshots') && snapshotsByDefault),
    dryRun: flags.has('--dry-run'),
  };
}

function sqlString(value) {
  return `'${String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
}

function runDockerClickHouse(args, input = '') {
  const dockerBin = process.env.DOCKER_BIN?.trim() || 'docker';
  const container = process.env.CLICKHOUSE_CONTAINER?.trim() || 'clickhouse';
  const result = spawnSync(
    dockerBin,
    ['exec', '-i', container, 'clickhouse-client', ...args],
    { input, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || 'ClickHouse command failed').trim());
  }
  return result.stdout;
}

function queryClickHouse(sql) {
  const output = runDockerClickHouse(['--query', sql, '--format', 'JSONEachRow']).trim();
  return output ? output.split('\n').map((line) => JSON.parse(line)) : [];
}

function execClickHouse(sql) {
  runDockerClickHouse(['--multiquery'], sql);
}

function insertClickHouse(table, rows) {
  if (!rows.length) return;
  const input = `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`;
  runDockerClickHouse(['--query', `INSERT INTO ${table} FORMAT JSONEachRow`], input);
}

function eventsColumns() {
  return new Set(queryClickHouse(`
    SELECT name
    FROM system.columns
    WHERE database = 'analytics' AND table = 'events'
  `).map((row) => row.name));
}

function latestArchivedDailyDate() {
  const latest = queryClickHouse(`
    SELECT maxOrNull(period_start) AS latest
    FROM viscerium_metrics.site_periods
    WHERE period_kind = 'daily'
  `)[0]?.latest;
  return typeof latest === 'string' && latest ? parseIsoDate(latest) : null;
}

function timeFilter(start, end) {
  return `timestamp >= toDateTime(${sqlString(`${start} 00:00:00`)}, 'Europe/London')\n`
    + `AND timestamp < toDateTime(${sqlString(`${end} 00:00:00`)}, 'Europe/London')`;
}

function hostnameFilter(hostnames) {
  const values = hostnames.map((hostname) => {
    if (!HOST_RE.test(hostname)) throw new Error(`Invalid Rybbit hostname: ${hostname}`);
    return sqlString(hostname);
  });
  return `hostname IN (${values.join(', ')})`;
}

function sessionUserExpression(columns) {
  return columns.has('identified_user_id')
    ? "COALESCE(NULLIF(anyIf(identified_user_id, identified_user_id != ''), ''), anyLast(user_id))"
    : 'anyLast(user_id)';
}

function customPropertyExpression(columns, key) {
  if (columns.has('props')) return `JSONExtractString(CAST(props AS String), ${sqlString(key)})`;
  if (columns.has('properties')) return `JSONExtractString(properties, ${sqlString(key)})`;
  return null;
}

export function buildPageStatsQuery({ columns, hostnames, start, end, pages }) {
  const userExpr = sessionUserExpression(columns);
  const hosts = hostnameFilter(hostnames);
  const time = timeFilter(start, end);
  const aliases = pages.flatMap((page) => page.pathnames.map((pathname) =>
    `tuple(${sqlString(page.community_id)}, ${sqlString(pathname)})`,
  ));
  if (!aliases.length) throw new Error('Reporting manifest did not contain any page paths');
  return `
    WITH
    SessionUsers AS (
      SELECT
        session_id,
        ${userExpr} AS effective_user_id
      FROM analytics.events
      WHERE ${hosts}
        AND ${time}
      GROUP BY session_id
    ),
    PageAliases AS (
      SELECT
        tupleElement(alias, 1) AS community_id,
        tupleElement(alias, 2) AS pathname
      FROM (SELECT arrayJoin([${aliases.join(', ')}]) AS alias)
    )
    SELECT
      a.community_id AS community_id,
      toUInt64(count()) AS pageviews,
      toUInt64(uniqExactIf(s.effective_user_id, s.effective_user_id != '')) AS unique_visitors
    FROM analytics.events e
    INNER JOIN SessionUsers s USING (session_id)
    INNER JOIN PageAliases a ON e.pathname = a.pathname
    WHERE ${hosts.replaceAll('hostname', 'e.hostname')}
      AND ${time.replaceAll('timestamp', 'e.timestamp')}
      AND e.type = 'pageview'
    GROUP BY a.community_id
  `;
}

function fetchPageStats(input) {
  return queryClickHouse(buildPageStatsQuery(input));
}

function fetchSiteStats({ columns, hostnames, start, end }) {
  const userExpr = sessionUserExpression(columns);
  const hosts = hostnameFilter(hostnames);
  const time = timeFilter(start, end);
  return queryClickHouse(`
    WITH SessionStats AS (
      SELECT
        session_id,
        ${userExpr} AS effective_user_id,
        countIf(type = 'pageview') AS pageviews
      FROM analytics.events
      WHERE ${hosts}
        AND ${time}
      GROUP BY session_id
    )
    SELECT
      toUInt64(coalesce(sum(pageviews), 0)) AS pageviews,
      toUInt64(uniqExactIf(effective_user_id, effective_user_id != '')) AS unique_visitors
    FROM SessionStats
  `)[0] ?? { pageviews: 0, unique_visitors: 0 };
}

function fetchActivityStats({ columns, hostnames, start, end }) {
  const communityId = customPropertyExpression(columns, 'community_id');
  if (!communityId) return new Map();
  const hosts = hostnameFilter(hostnames);
  const time = timeFilter(start, end);
  const rows = queryClickHouse(`
    SELECT
      event_name,
      ${communityId} AS community_id,
      count() AS count
    FROM analytics.events
    WHERE ${hosts}
      AND ${time}
      AND type = 'custom_event'
      AND event_name IN ('kudos_add', 'kudos_remove', 'content_share')
      AND ${communityId} != ''
    GROUP BY event_name, community_id
  `);

  const stats = new Map();
  for (const row of rows) {
    if (!UUID_RE.test(row.community_id)) continue;
    const value = stats.get(row.community_id) ?? { kudos_added: 0, kudos_removed: 0, shares: 0 };
    if (row.event_name === 'kudos_add') value.kudos_added = Number(row.count) || 0;
    else if (row.event_name === 'kudos_remove') value.kudos_removed = Number(row.count) || 0;
    else if (row.event_name === 'content_share') value.shares = Number(row.count) || 0;
    stats.set(row.community_id, value);
  }
  return stats;
}

async function fetchJson(url, init = {}) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

async function fetchManifest(url) {
  const payload = await fetchJson(url, { headers: { Accept: 'application/json' } });
  if (!Array.isArray(payload.pages)) throw new Error('Reporting manifest did not contain a pages array');
  const communityIds = new Set();
  const claimedPaths = new Map();
  return payload.pages.map((page) => {
    if (!UUID_RE.test(page.community_id)) throw new Error(`Invalid community_id in reporting manifest: ${page.community_id}`);
    if (communityIds.has(page.community_id)) throw new Error(`Duplicate community_id in reporting manifest: ${page.community_id}`);
    communityIds.add(page.community_id);
    if (typeof page.pathname !== 'string' || !page.pathname.startsWith('/')) {
      throw new Error(`Invalid pathname for ${page.community_id}`);
    }
    if (page.pathnames !== undefined && !Array.isArray(page.pathnames)) {
      throw new Error(`Invalid pathname list for ${page.community_id}`);
    }
    const pathnames = [...new Set([page.pathname, ...(page.pathnames ?? [])])];
    if (pathnames.some((pathname) => typeof pathname !== 'string' || !pathname.startsWith('/'))) {
      throw new Error(`Invalid pathname list for ${page.community_id}`);
    }
    for (const pathname of pathnames) {
      const previous = claimedPaths.get(pathname);
      if (previous && previous !== page.community_id) {
        throw new Error(`Reporting pathname ${pathname} is claimed by both ${previous} and ${page.community_id}`);
      }
      claimedPaths.set(pathname, page.community_id);
    }
    return { ...page, pathnames };
  });
}

function communityIdFromThreadUrl(value) {
  try {
    const match = new URL(value).pathname.match(/^\/community\/([0-9a-f-]{36})\/?$/i);
    return match && UUID_RE.test(match[1]) ? match[1] : null;
  } catch {
    return null;
  }
}

export function londonBoundaryMs(date) {
  parseIsoDate(date);
  const [year, month, day] = date.split('-').map(Number);
  const utcMidnight = Date.UTC(year, month - 1, day);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMidnight));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const representedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );
  return utcMidnight - (representedAsUtc - utcMidnight);
}

export function countCommentsByCommunity(comments, start, end) {
  const counts = new Map();
  const startMs = londonBoundaryMs(start);
  const endMs = londonBoundaryMs(end);
  for (const comment of comments) {
    const communityId = communityIdFromThreadUrl(comment?.locator?.url);
    const timestamp = Date.parse(comment?.time ?? '');
    if (!communityId || !Number.isFinite(timestamp) || timestamp < startMs || timestamp >= endMs) continue;
    counts.set(communityId, (counts.get(communityId) ?? 0) + 1);
  }
  return counts;
}

async function fetchCommentActivity({ baseUrl, siteId, start, end }) {
  const since = londonBoundaryMs(start);
  const url = new URL(`/api/v1/last/${COMMENT_LIMIT}`, baseUrl);
  url.searchParams.set('site', siteId);
  url.searchParams.set('since', String(since));
  const payload = await fetchJson(url, { headers: { Accept: 'application/json' } });
  const comments = Array.isArray(payload) ? payload : Array.isArray(payload.comments) ? payload.comments : [];
  // ponytail: 10,000 comments per archive window is the ceiling. Raise the limit or switch to Remark42 export processing if VISCERIUM reaches it.
  if (comments.length >= COMMENT_LIMIT) throw new Error(`Remark42 returned ${COMMENT_LIMIT} comments; archive window may be truncated`);
  return countCommentsByCommunity(comments, start, end);
}

async function fetchCommentTotals({ baseUrl, siteId }) {
  const url = new URL('/api/v1/list', baseUrl);
  url.searchParams.set('site', siteId);
  url.searchParams.set('limit', '0');
  const payload = await fetchJson(url, { headers: { Accept: 'application/json' } });
  const rows = Array.isArray(payload) ? payload : [];
  const totals = new Map();
  for (const row of rows) {
    const communityId = communityIdFromThreadUrl(row?.url);
    if (communityId) totals.set(communityId, Number(row.count) || 0);
  }
  return totals;
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

async function fetchKudosTotals({ siteUrl, pages }) {
  const visitorId = crypto.randomUUID();
  const rows = await mapLimit(pages, SNAPSHOT_CONCURRENCY, async (page) => {
    const url = new URL(`/api/kudos/${page.community_id}`, siteUrl);
    const canonicalUrl = new URL(page.pathname, siteUrl).href;
    const state = await fetchJson(url, {
      headers: {
        Accept: 'application/json',
        'X-Viscerium-Visitor': visitorId,
        'X-Viscerium-Page': canonicalUrl,
      },
    });
    return [page.community_id, {
      native: Number(state.native) || 0,
      webmentions: state.webmentionsAvailable ? Number(state.webmentions) || 0 : null,
      total: Number(state.total) || 0,
    }];
  });
  return new Map(rows);
}

export function nullableSum(values) {
  return values.some((value) => value === null)
    ? null
    : values.reduce((sum, value) => sum + value, 0);
}

function toUInt(value) {
  return Math.max(0, Number(value) || 0);
}

function buildRows({ task, pages, pageStats, siteStats, activity, commentsCreated, commentTotals, kudosTotals, snapshots }) {
  const statsByCommunity = new Map(pageStats.map((row) => [row.community_id, row]));
  const collectedAt = new Date().toISOString().replace('T', ' ').replace('Z', '');
  const pageRows = pages.map((page) => {
    const stats = statsByCommunity.get(page.community_id) ?? {};
    const events = activity.get(page.community_id) ?? { kudos_added: 0, kudos_removed: 0, shares: 0 };
    const kudos = snapshots ? kudosTotals.get(page.community_id) : undefined;
    return {
      period_start: task.key,
      period_kind: task.kind,
      community_id: page.community_id,
      entity_id: page.entity_id ?? null,
      pathname: page.pathname,
      title: page.title ?? '',
      era: page.era ?? null,
      content_type: page.content_type ?? 'article',
      pageviews: toUInt(stats.pageviews),
      unique_visitors: toUInt(stats.unique_visitors),
      comments_created: commentsCreated.get(page.community_id) ?? 0,
      comments_total: snapshots ? (commentTotals.get(page.community_id) ?? 0) : null,
      kudos_added: toUInt(events.kudos_added),
      kudos_removed: toUInt(events.kudos_removed),
      kudos_native_total: kudos ? kudos.native : null,
      kudos_webmention_total: kudos ? kudos.webmentions : null,
      kudos_total: kudos ? kudos.total : null,
      shares: toUInt(events.shares),
      collected_at: collectedAt,
    };
  });

  const siteRow = {
    period_start: task.key,
    period_kind: task.kind,
    pageviews: toUInt(siteStats.pageviews),
    unique_visitors: toUInt(siteStats.unique_visitors),
    comments_created: [...commentsCreated.values()].reduce((sum, value) => sum + value, 0),
    comments_total: snapshots ? [...commentTotals.values()].reduce((sum, value) => sum + value, 0) : null,
    kudos_added: pageRows.reduce((sum, row) => sum + row.kudos_added, 0),
    kudos_removed: pageRows.reduce((sum, row) => sum + row.kudos_removed, 0),
    kudos_native_total: snapshots ? nullableSum(pageRows.map((row) => row.kudos_native_total)) : null,
    kudos_webmention_total: snapshots ? nullableSum(pageRows.map((row) => row.kudos_webmention_total)) : null,
    kudos_total: snapshots ? nullableSum(pageRows.map((row) => row.kudos_total)) : null,
    shares: pageRows.reduce((sum, row) => sum + (row.shares ?? 0), 0),
    collected_at: collectedAt,
  };
  return { pageRows, siteRow };
}

function writeRows(task, pageRows, siteRow) {
  const pageTable = 'viscerium_metrics.page_periods';
  const siteTable = 'viscerium_metrics.site_periods';
  const literal = sqlString(task.key);
  const kind = sqlString(task.kind);
  execClickHouse(`
    ALTER TABLE ${pageTable} DELETE WHERE period_start = toDate(${literal}) AND period_kind = ${kind} SETTINGS mutations_sync = 2;
    ALTER TABLE ${siteTable} DELETE WHERE period_start = toDate(${literal}) AND period_kind = ${kind} SETTINGS mutations_sync = 2;
  `);
  insertClickHouse(pageTable, pageRows);
  insertClickHouse(siteTable, [siteRow]);
}

async function archiveTask({ task, config, columns, pages, snapshots, dryRun }) {
  const input = { columns, hostnames: config.rybbitHostnames, start: task.start, end: task.end, pages };
  const [pageStats, siteStats, activity, commentsCreated] = await Promise.all([
    fetchPageStats(input),
    fetchSiteStats(input),
    fetchActivityStats(input),
    fetchCommentActivity({
      baseUrl: config.commentsUrl,
      siteId: config.commentsSiteId,
      start: task.start,
      end: task.end,
    }),
  ]);

  let commentTotals = new Map();
  let kudosTotals = new Map();
  if (snapshots) {
    [commentTotals, kudosTotals] = await Promise.all([
      fetchCommentTotals({ baseUrl: config.commentsUrl, siteId: config.commentsSiteId }),
      fetchKudosTotals({ siteUrl: config.siteUrl, pages }),
    ]);
  }

  const rows = buildRows({
    task,
    pages,
    pageStats,
    siteStats,
    activity,
    commentsCreated,
    commentTotals,
    kudosTotals,
    snapshots,
  });

  if (!dryRun) writeRows(task, rows.pageRows, rows.siteRow);
  console.log(JSON.stringify({
    period: task.kind,
    key: task.key,
    pages: rows.pageRows.length,
    pageviews: rows.siteRow.pageviews,
    unique_visitors: rows.siteRow.unique_visitors,
    comments_created: rows.siteRow.comments_created,
    snapshots,
    dry_run: dryRun,
  }));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const siteUrl = new URL(requiredEnv('VISCERIUM_SITE_URL', 'https://www.viscerium.co.uk'));
  const config = {
    siteUrl,
    manifestUrl: requiredEnv('VISCERIUM_REPORTING_MANIFEST', new URL('/reporting-pages.json', siteUrl).href),
    commentsUrl: requiredEnv('REMARK42_URL', 'https://comments.viscerium.co.uk'),
    commentsSiteId: requiredEnv('REMARK42_SITE_ID', 'viscerium'),
    rybbitHostnames: requiredEnv('RYBBIT_HOSTNAMES', `${siteUrl.hostname},${siteUrl.hostname.replace(/^www\./, '')}`)
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  };

  const [columns, pages] = await Promise.all([
    eventsColumns(),
    fetchManifest(config.manifestUrl),
  ]);
  for (const required of ['session_id', 'user_id', 'hostname', 'pathname', 'type', 'timestamp']) {
    if (!columns.has(required)) throw new Error(`Rybbit analytics.events is missing required column: ${required}`);
  }

  const tasks = args.automatic
    ? dailyCatchupTasks(latestArchivedDailyDate(), args.tasks[0].key)
    : args.tasks;
  for (const [index, task] of tasks.entries()) {
    const snapshots = args.snapshots && (!args.automatic || index === tasks.length - 1);
    await archiveTask({ task, config, columns, pages, snapshots, dryRun: args.dryRun });
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

export { dateRange, londonYesterday, monthRange };
