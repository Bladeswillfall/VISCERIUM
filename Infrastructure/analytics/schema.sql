CREATE DATABASE IF NOT EXISTS viscerium_metrics;

CREATE TABLE IF NOT EXISTS viscerium_metrics.page_periods
(
    period_start Date,
    period_kind Enum8('daily' = 1, 'monthly' = 2),
    community_id UUID,
    entity_id Nullable(String),
    pathname String,
    title String,
    era Nullable(String),
    content_type String,
    pageviews UInt64,
    unique_visitors UInt64,
    comments_created Nullable(UInt64),
    comments_total Nullable(UInt64),
    kudos_added UInt64,
    kudos_removed UInt64,
    kudos_native_total Nullable(UInt64),
    kudos_webmention_total Nullable(UInt64),
    kudos_total Nullable(UInt64),
    shares Nullable(UInt64),
    collected_at DateTime64(3, 'UTC')
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(period_start)
ORDER BY (period_kind, period_start, community_id);

CREATE TABLE IF NOT EXISTS viscerium_metrics.site_periods
(
    period_start Date,
    period_kind Enum8('daily' = 1, 'monthly' = 2),
    pageviews UInt64,
    unique_visitors UInt64,
    comments_created Nullable(UInt64),
    comments_total Nullable(UInt64),
    kudos_added UInt64,
    kudos_removed UInt64,
    kudos_native_total Nullable(UInt64),
    kudos_webmention_total Nullable(UInt64),
    kudos_total Nullable(UInt64),
    shares Nullable(UInt64),
    collected_at DateTime64(3, 'UTC')
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(period_start)
ORDER BY (period_kind, period_start);
