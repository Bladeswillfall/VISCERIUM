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

The public site exposes `/reporting-pages.json`. It contains only page metadata needed to map Rybbit pathnames, Remark42 threads and Kudos records to the same permanent `community_id`. Each page includes its current pathname plus any recorded historical pathnames.

The collector reads Rybbit's local `analytics.events` table through `docker exec clickhouse clickhouse-client`. It uses the same session-level effective-user rule as current Rybbit: prefer a non-empty `identified_user_id`, otherwise use the anonymous `user_id`. Older Rybbit tables without `identified_user_id` automatically fall back to `user_id`.

Remark42 activity comes from its public aggregate/list APIs. The job reads recent comment records only to count creation timestamps by thread and never writes comment text to ClickHouse.

Kudos snapshots come from VISCERIUM's existing `/api/kudos/:community_id` endpoint. No second Kudos store is created.

## Route history

`community_id` is permanent but Rybbit pageviews are recorded against the URL that existed at the time of the visit. Historical routes therefore live in:

```text
Site/src/data/reporting-route-aliases.json
```

When a Community page moves, add its old route to that file in the same change that moves the page. Do not reuse one historical pathname for two different `community_id` values.

The collector calculates pageviews and unique visitors from all known paths for an article before inserting its aggregate row. Unique visitors are calculated once across the combined raw events, not summed from per-path counts.

The September 2026 rename of the human-authorship commentary is already recorded, so the initial backfill includes traffic from both its original filename-derived route and `/statements/human-authorship-and-ai/`.

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

Deploy the site change first so `/reporting-pages.json` exists. Then run dry reads for yesterday:

```bash
set -a
. /etc/viscerium/analytics.env
set +a
node archive.mjs --dry-run
```

A normal single-day run collects current comment and Kudos snapshots. Historical URL aliases are included in the page query:

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

Monthly snapshot totals are off by default. Add `--snapshots` to `archive.mjs` only when you deliberately want a current snapshot attached to that month row.

## Validate before retention changes

Compare archived pageviews with the source for the same day:

```sql
SELECT sum(pageviews)
FROM viscerium_metrics.page_periods
WHERE period_start = '2026-09-13' AND period_kind = 'daily';
```

That total covers Community article pages only. Compare whole-site traffic with:

```sql
SELECT pageviews, unique_visitors
FROM viscerium_metrics.site_periods
WHERE period_start = '2026-09-13' AND period_kind = 'daily';
```

Also inspect several articles by `community_id` and pathname, including `11e8b074-d296-478b-8d90-29b11cf24e4b` around 8 September 2026 to verify its renamed route. Re-run the same date and confirm the archive still contains one row per page for that date.

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

Each normal timer run also fills any missing completed monthly periods through the previous London calendar month. Monthly rows are calculated directly from raw events, so monthly unique visitors are not summed from daily values. Automatic monthly catch-up leaves snapshot totals `NULL`.

Check it with:

```bash
systemctl list-timers viscerium-analytics-archive.timer
journalctl -u viscerium-analytics-archive.service -n 100 --no-pager
```

## Idempotence

Before inserting a period, the collector synchronously deletes existing aggregate rows for that period start and kind. Re-running a period replaces it instead of double-counting it.

The source Rybbit tables are read-only to these jobs. The only ClickHouse writes are to `viscerium_metrics`.

## Known ceilings

Remark42's recent-comment fetch is capped at 10,000 comments per archive window. The job fails rather than silently under-count if that limit is reached. If VISCERIUM approaches that volume, replace the recent-comment call with Remark42 export processing or a comment webhook counter.

`content_share` is reserved in the schema and collector, but the current site has no share control that emits that event. Until one exists, `shares` remains zero.
