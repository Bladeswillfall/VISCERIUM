#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { parseArgs } from './archive.mjs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HOST_RE = /^[a-z0-9.-]+$/i;

function requiredEnv(name, fallback) {
  const value = process.env[name]?.trim() || fallback;
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
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
    { input, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
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

function eventsColumns() {
  return new Set(queryClickHouse(`
    SELECT name
    FROM system.columns
    WHERE database = 'analytics' AND table = 'events'
  `).map((row) => row.name));
}

function hostnameFilter(hostnames) {
  const values = hostnames.map((hostname) => {
    if (!HOST_RE.test(hostname)) throw new Error(`Invalid Rybbit hostname: ${hostname}`);
    return sqlString(hostname);
  });
  return `hostname IN (${values.join(', ')})`;
}

function timeFilter(start, end) {
  return `timestamp >= toDateTime(${sqlString(`${start} 00:00:00`)}, 'Europe/London')\n`
    + `AND timestamp < toDateTime(${sqlString(`${end} 00:00:00`)}, 'Europe/London')`;
}

function sessionUserExpression(columns) {
  return columns.has('identified_user_id')
    ? "COALESCE(NULLIF(anyIf(identified_user_id, identified_user_id != ''), ''), anyLast(user_id))"
    : 'anyLast(user_id)';
}

function normalisePagePaths(page) {
  const paths = Array.isArray(page.pathnames) ? page.pathnames : [page.pathname];
  const unique = [...new Set(paths)];
  if (!UUID_RE.test(page.community_id)) throw new Error(`Invalid community_id in reporting manifest: ${page.community_id}`);
  if (!unique.length || unique.some((pathname) => typeof pathname !== 'string' || !pathname.startsWith('/'))) {
    throw new Error(`Invalid reporting pathname list for ${page.community_id}`);
  }
  return unique;
}

async function fetchAliasPages(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload.pages)) throw new Error('Reporting manifest did not contain a pages array');

  const claimedPaths = new Map();
  const pages = [];
  for (const page of payload.pages) {
    const pathnames = normalisePagePaths(page);
    for (const pathname of pathnames) {
      const previous = claimedPaths.get(pathname);
      if (previous && previous !== page.community_id) {
        throw new Error(`Reporting pathname ${pathname} is claimed by both ${previous} and ${page.community_id}`);
      }
      claimedPaths.set(pathname, page.community_id);
    }
    if (pathnames.length > 1) pages.push({ ...page, pathnames });
  }
  return pages;
}

export function buildAliasStatsQuery({ columns, hostnames, start, end, page }) {
  const paths = normalisePagePaths(page).map(sqlString).join(', ');
  const hosts = hostnameFilter(hostnames);
  const time = timeFilter(start, end);
  const userExpr = sessionUserExpression(columns);
  return `
    WITH SessionUsers AS (
      SELECT
        session_id,
        ${userExpr} AS effective_user_id
      FROM analytics.events
      WHERE ${hosts}
        AND ${time}
      GROUP BY session_id
    )
    SELECT
      toUInt64(count()) AS pageviews,
      toUInt64(uniqExactIf(s.effective_user_id, s.effective_user_id != '')) AS unique_visitors
    FROM analytics.events e
    INNER JOIN SessionUsers s USING (session_id)
    WHERE ${hosts.replaceAll('hostname', 'e.hostname')}
      AND ${time.replaceAll('timestamp', 'e.timestamp')}
      AND e.type = 'pageview'
      AND e.pathname IN (${paths})
  `;
}

function aggregateRowExists(task, communityId) {
  const table = `viscerium_metrics.page_${task.kind}`;
  const key = task.kind === 'monthly' ? 'month' : 'date';
  const result = queryClickHouse(`
    SELECT count() AS count
    FROM ${table}
    WHERE ${key} = toDate(${sqlString(task.key)})
      AND community_id = toUUID(${sqlString(communityId)})
  `)[0];
  return Number(result?.count ?? 0) > 0;
}

function updateAggregateRow(task, communityId, stats) {
  const table = `viscerium_metrics.page_${task.kind}`;
  const key = task.kind === 'monthly' ? 'month' : 'date';
  execClickHouse(`
    ALTER TABLE ${table}
    UPDATE
      pageviews = ${Math.max(0, Number(stats.pageviews) || 0)},
      unique_visitors = ${Math.max(0, Number(stats.unique_visitors) || 0)}
    WHERE ${key} = toDate(${sqlString(task.key)})
      AND community_id = toUUID(${sqlString(communityId)})
    SETTINGS mutations_sync = 2;
  `);
}

async function reconcileTask({ task, pages, columns, hostnames, dryRun }) {
  for (const page of pages) {
    if (!dryRun && !aggregateRowExists(task, page.community_id)) {
      throw new Error(`Missing ${task.kind} aggregate row for ${page.community_id} at ${task.key}`);
    }
    const stats = queryClickHouse(buildAliasStatsQuery({
      columns,
      hostnames,
      start: task.start,
      end: task.end,
      page,
    }))[0] ?? { pageviews: 0, unique_visitors: 0 };
    if (!dryRun) updateAggregateRow(task, page.community_id, stats);
    console.log(JSON.stringify({
      period: task.kind,
      key: task.key,
      community_id: page.community_id,
      pathnames: page.pathnames,
      pageviews: Number(stats.pageviews) || 0,
      unique_visitors: Number(stats.unique_visitors) || 0,
      dry_run: dryRun,
    }));
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const siteUrl = new URL(requiredEnv('VISCERIUM_SITE_URL', 'https://www.viscerium.co.uk'));
  const manifestUrl = requiredEnv(
    'VISCERIUM_REPORTING_MANIFEST',
    new URL('/reporting-pages.json', siteUrl).href,
  );
  const hostnames = requiredEnv(
    'RYBBIT_HOSTNAMES',
    `${siteUrl.hostname},${siteUrl.hostname.replace(/^www\./, '')}`,
  ).split(',').map((value) => value.trim()).filter(Boolean);

  const [columns, pages] = await Promise.all([
    Promise.resolve(eventsColumns()),
    fetchAliasPages(manifestUrl),
  ]);
  for (const required of ['session_id', 'user_id', 'hostname', 'pathname', 'type', 'timestamp']) {
    if (!columns.has(required)) throw new Error(`Rybbit analytics.events is missing required column: ${required}`);
  }

  for (const task of args.tasks) {
    await reconcileTask({ task, pages, columns, hostnames, dryRun: args.dryRun });
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
