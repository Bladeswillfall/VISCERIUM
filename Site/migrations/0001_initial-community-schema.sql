CREATE TABLE community_pages (
  community_id TEXT PRIMARY KEY,
  current_url TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE community_urls (
  community_id TEXT NOT NULL,
  url TEXT NOT NULL,
  first_seen_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  PRIMARY KEY (community_id, url),
  FOREIGN KEY (community_id)
    REFERENCES community_pages(community_id)
    ON DELETE CASCADE
);

CREATE TABLE kudos (
  community_id TEXT NOT NULL,
  actor_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (community_id, actor_hash),
  FOREIGN KEY (community_id)
    REFERENCES community_pages(community_id)
    ON DELETE CASCADE
);
