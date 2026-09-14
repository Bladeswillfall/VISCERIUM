CREATE DATABASE IF NOT EXISTS viscerium_metrics;

CREATE TABLE IF NOT EXISTS viscerium_metrics.page_daily
(
    date Date,
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
PARTITION BY toYYYYMM(date)
ORDER BY (date, community_id);

CREATE TABLE IF NOT EXISTS viscerium_metrics.site_daily
(
    date Date,
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
PARTITION BY toYYYYMM(date)
ORDER BY date;

CREATE TABLE IF NOT EXISTS viscerium_metrics.page_monthly
(
    month Date,
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
PARTITION BY toYYYYMM(month)
ORDER BY (month, community_id);

CREATE TABLE IF NOT EXISTS viscerium_metrics.site_monthly
(
    month Date,
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
PARTITION BY toYYYYMM(month)
ORDER BY month;
