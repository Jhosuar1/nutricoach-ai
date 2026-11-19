CREATE TABLE IF NOT EXISTS community_reactions (
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES community_profiles(user_id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('like', 'save')),
  PRIMARY KEY (post_id, user_id, kind)
);
CREATE INDEX IF NOT EXISTS community_reactions_user_kind ON community_reactions (user_id, kind, post_id);

CREATE TABLE IF NOT EXISTS community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author uuid NOT NULL REFERENCES community_profiles(user_id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS community_comments_post ON community_comments (post_id, created_at DESC, id);

CREATE TABLE IF NOT EXISTS community_message_reads (
  reader uuid REFERENCES community_profiles(user_id) ON DELETE CASCADE,
  peer uuid REFERENCES community_profiles(user_id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL,
  PRIMARY KEY (reader, peer),
  CHECK (reader <> peer)
);

CREATE TABLE IF NOT EXISTS community_post_photos (
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  position smallint NOT NULL CHECK (position BETWEEN 1 AND 3),
  media_type text NOT NULL CHECK (media_type IN ('image/jpeg', 'image/png', 'image/webp')),
  media bytea NOT NULL CHECK (octet_length(media) <= 3000000),
  PRIMARY KEY (post_id, position)
);
