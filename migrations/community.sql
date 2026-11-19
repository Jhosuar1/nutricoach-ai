CREATE TABLE IF NOT EXISTS community_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  handle text UNIQUE NOT NULL CHECK (handle ~ '^[a-z0-9_]{3,24}$'),
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 50),
  bio text NOT NULL DEFAULT '' CHECK (char_length(bio) <= 240)
);

CREATE TABLE IF NOT EXISTS community_friendships (
  user_a uuid REFERENCES community_profiles(user_id) ON DELETE CASCADE,
  user_b uuid REFERENCES community_profiles(user_id) ON DELETE CASCADE,
  requester uuid NOT NULL,
  accepted boolean NOT NULL DEFAULT false,
  PRIMARY KEY (user_a, user_b),
  CHECK (user_a < user_b AND requester IN (user_a, user_b))
);
CREATE INDEX IF NOT EXISTS community_friendships_user_b ON community_friendships (user_b, user_a);

CREATE TABLE IF NOT EXISTS community_blocks (
  blocker uuid REFERENCES community_profiles(user_id) ON DELETE CASCADE,
  blocked uuid REFERENCES community_profiles(user_id) ON DELETE CASCADE,
  PRIMARY KEY (blocker, blocked),
  CHECK (blocker <> blocked)
);

CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author uuid NOT NULL REFERENCES community_profiles(user_id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) <= 1500),
  media_type text CHECK (media_type IN ('image/jpeg', 'image/png', 'image/webp', 'video/mp4')),
  media bytea CHECK (octet_length(media) <= 3000000),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((media IS NULL) = (media_type IS NULL) AND (body <> '' OR media IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS community_posts_author_date ON community_posts (author, created_at DESC);

CREATE TABLE IF NOT EXISTS community_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender uuid NOT NULL REFERENCES community_profiles(user_id) ON DELETE CASCADE,
  recipient uuid NOT NULL REFERENCES community_profiles(user_id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (sender <> recipient)
);
CREATE INDEX IF NOT EXISTS community_messages_pair_date ON community_messages (sender, recipient, created_at DESC);

CREATE TABLE IF NOT EXISTS community_reports (
  reporter uuid REFERENCES community_profiles(user_id) ON DELETE CASCADE,
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (reporter, post_id)
);
