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

CREATE TABLE IF NOT EXISTS viscerium_metrics.interaction_periods
(
    period_start Date,
    period_kind Enum8('daily' = 1, 'monthly' = 2),
    event_type LowCardinality(String),
    event_name String,
    pathname String,
    properties String,
    tag String,
    datacenter_traffic Enum8('unknown' = 0, 'no' = 1, 'yes' = 2),
    events UInt64,
    unique_visitors UInt64,
    unique_sessions UInt64,
    collected_at DateTime64(3, 'UTC')
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(period_start)
ORDER BY (period_kind, period_start, event_type, event_name, pathname, datacenter_traffic, tag, properties);

CREATE TABLE IF NOT EXISTS viscerium_metrics.acquisition_periods
(
    period_start Date,
    period_kind Enum8('daily' = 1, 'monthly' = 2),
    channel LowCardinality(String),
    referrer String,
    landing_pathname String,
    utm_source String,
    utm_medium String,
    utm_campaign String,
    utm_term String,
    utm_content String,
    datacenter_traffic Enum8('unknown' = 0, 'no' = 1, 'yes' = 2),
    sessions UInt64,
    unique_visitors UInt64,
    collected_at DateTime64(3, 'UTC')
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(period_start)
ORDER BY (
    period_kind,
    period_start,
    channel,
    utm_source,
    utm_medium,
    utm_campaign,
    referrer,
    landing_pathname,
    datacenter_traffic,
    utm_term,
    utm_content
);

CREATE TABLE IF NOT EXISTS viscerium_metrics.traffic_dimension_periods
(
    period_start Date,
    period_kind Enum8('daily' = 1, 'monthly' = 2),
    device_type LowCardinality(String),
    browser LowCardinality(String),
    operating_system LowCardinality(String),
    country LowCardinality(String),
    region LowCardinality(String),
    datacenter_traffic Enum8('unknown' = 0, 'no' = 1, 'yes' = 2),
    pageviews UInt64,
    unique_visitors UInt64,
    unique_sessions UInt64,
    collected_at DateTime64(3, 'UTC')
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(period_start)
ORDER BY (
    period_kind,
    period_start,
    device_type,
    browser,
    operating_system,
    country,
    region,
    datacenter_traffic
);
