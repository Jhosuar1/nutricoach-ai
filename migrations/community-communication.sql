ALTER TABLE community_comments ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES community_comments(id) ON DELETE SET NULL;
ALTER TABLE community_friendships ADD COLUMN IF NOT EXISTS requested_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE community_friendships ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
ALTER TABLE community_reactions ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS community_reposts (
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES community_profiles(user_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS community_activity_reads (
  user_id uuid PRIMARY KEY REFERENCES community_profiles(user_id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS community_chat_files (
  message_id uuid PRIMARY KEY REFERENCES community_messages(id) ON DELETE CASCADE,
  sender uuid NOT NULL REFERENCES community_profiles(user_id) ON DELETE CASCADE,
  filename text NOT NULL CHECK (char_length(filename) BETWEEN 1 AND 120),
  mime text NOT NULL,
  bytes bytea NOT NULL CHECK (octet_length(bytes) BETWEEN 1 AND 3000000)
);
CREATE INDEX IF NOT EXISTS community_chat_files_sender ON community_chat_files (sender);
ALTER TABLE community_messages DROP CONSTRAINT IF EXISTS community_messages_body_check;
ALTER TABLE community_messages ADD CONSTRAINT community_messages_body_check CHECK (char_length(body) <= 1000) NOT VALID;

CREATE TABLE IF NOT EXISTS community_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caller uuid NOT NULL REFERENCES community_profiles(user_id) ON DELETE CASCADE,
  callee uuid NOT NULL REFERENCES community_profiles(user_id) ON DELETE CASCADE,
  offer jsonb NOT NULL,
  answer jsonb,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (caller <> callee)
);
CREATE INDEX IF NOT EXISTS community_calls_callee_at ON community_calls (callee, created_at DESC);
