# Aggregate analytics archive

This directory contains the long-term aggregate reporting job for VISCERIUM. It does not change Rybbit retention.

The archive keeps content statistics and discards visitor-level detail. Individual article rows use `community_id` as the permanent page identity. `entity_id` remains an optional continuity-family dimension because several era editions can share one `entity_id`.

## What the job stores

Per article and period:

- pageviews;
- unique visitors calculated from Rybbit session identity for that whole period;
- comments created during the period;
- a current comment-count snapshot when snapshot collection is enabled;
- successful native Kudos add/remove events;
- current native, Webmention and combined Kudos snapshots when enabled;
- `content_share` events when that event exists.

It does not copy visitor IDs, session IDs, IP addresses, user agents, locations, referrers, query strings, comment bodies or raw event properties into `viscerium_metrics`.

Historical backfills do not invent historical comment or Kudos snapshots. Snapshot columns remain `NULL` unless snapshot collection is explicitly enabled. The `collected_at` column records when a snapshot was taken.

## Inputs

The public site exposes `/reporting-pages.json`. It contains only page metadata needed to map Rybbit pathnames, Remark42 threads and Kudos records to the same permanent `community_id`.

The collector reads Rybbit's local `analytics.events` table through `docker exec clickhouse clickhouse-client`. It uses the same session-level effective-user rule as current Rybbit: prefer a non-empty `identified_user_id`, otherwise use the anonymous `user_id`. Older Rybbit tables without `identified_user_id` automatically fall back to `user_id`.

Remark42 activity comes from its public aggregate/list APIs. The job reads recent comment records only to count creation timestamps by thread and never writes comment text to ClickHouse.

Kudos snapshots come from VISCERIUM's existing `/api/kudos/:community_id` endpoint. No second Kudos store is created.

## Apply the schema

On the VPS that already runs Rybbit:

```bash
cd /path/to/VISCERIUM/Infrastructure/analytics
docker exec -i clickhouse clickhouse-client --multiquery < schema.sql
```

This creates a separate `viscerium_metrics` database. It does not modify Rybbit's `analytics` database.

## Environment

Create `/etc/viscerium/analytics.env` with mode `0600`:

```text
VISCERIUM_SITE_URL=https://www.viscerium.co.uk
VISCERIUM_REPORTING_MANIFEST=https://www.viscerium.co.uk/reporting-pages.json
REMARK42_URL=https://comments.viscerium.co.uk
REMARK42_SITE_ID=viscerium
RYBBIT_HOSTNAMES=www.viscerium.co.uk,viscerium.co.uk
CLICKHOUSE_CONTAINER=clickhouse
```

There are no analytics API keys in this file. The job talks to the local ClickHouse container and public VISCERIUM/Remark42 endpoints.

## First run

Deploy the site change first so `/reporting-pages.json` exists. Then run a dry run for yesterday:

```bash
set -a
. /etc/viscerium/analytics.env
set +a
node archive.mjs --dry-run
```

A normal single-day run collects current comment and Kudos snapshots by default:

```bash
node archive.mjs
```

An explicit historical date does not attach today's snapshots unless you ask for them:

```bash
node archive.mjs --date=2026-09-13
```

## Backfill

The current Rybbit history starts on 26 August 2026. Backfill daily page traffic and event counts with:

```bash
node archive.mjs --from=2026-08-26 --to=2026-09-13
```

Backfill does not fabricate historical snapshot totals. It leaves those columns `NULL`.

After daily validation, create a whole-month aggregate directly from the raw Rybbit period. Do not sum daily unique-visitor values:

```bash
node archive.mjs --month=2026-08
```

Monthly snapshot totals are off by default. Add `--snapshots` only when you deliberately want a current snapshot attached to that month row.

## Validate before retention changes

Compare archived pageviews with the source for the same day:

```sql
SELECT sum(pageviews)
FROM viscerium_metrics.page_daily
WHERE date = '2026-09-13';
```

That total covers Community article pages only. Compare whole-site traffic with:

```sql
SELECT pageviews, unique_visitors
FROM viscerium_metrics.site_daily
WHERE date = '2026-09-13';
```

Also inspect several articles by `community_id` and pathname. Re-run the same date and confirm the archive still contains one row per page for that date.

Do not add or change a TTL on `analytics.events` until the backfill and these comparisons pass.

## Install the daily timer

Copy the collector and units:

```bash
sudo install -d -m 0755 /opt/viscerium-analytics
sudo install -m 0644 archive.mjs /opt/viscerium-analytics/archive.mjs
sudo install -m 0644 systemd/viscerium-analytics-archive.service /etc/systemd/system/
sudo install -m 0644 systemd/viscerium-analytics-archive.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now viscerium-analytics-archive.timer
```

The timer runs at 00:15 Europe/London and uses `Persistent=true`, so a missed run executes after the host comes back.

Check it with:

```bash
systemctl list-timers viscerium-analytics-archive.timer
journalctl -u viscerium-analytics-archive.service -n 100 --no-pager
```

## Idempotence

Before inserting a period, the collector synchronously deletes existing aggregate rows for that same date or month. Re-running a period replaces it instead of double-counting it.

The source Rybbit tables are read-only to this job. The only ClickHouse writes are to `viscerium_metrics`.

## Known ceilings

Remark42's recent-comment fetch is capped at 10,000 comments per archive window. The job fails rather than silently under-count if that limit is reached. If VISCERIUM approaches that volume, replace the recent-comment call with Remark42 export processing or a comment webhook counter.

`content_share` is reserved in the schema and collector, but the current site has no share control that emits that event. Until one exists, `shares` remains zero.
