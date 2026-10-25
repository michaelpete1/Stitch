CREATE TABLE IF NOT EXISTS stitch_chat_conversations (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'New chat' CHECK (length(title) <= 120),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS conversations_session_updated
  ON stitch_chat_conversations(session_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS stitch_chat_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES stitch_chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  context TEXT,
  client_message_id TEXT,
  reply_to TEXT REFERENCES stitch_chat_messages(id) ON DELETE CASCADE,
  tokens INTEGER NOT NULL DEFAULT 0 CHECK (tokens >= 0),
  feedback TEXT CHECK (feedback IN ('up', 'down') OR feedback IS NULL),
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS messages_conversation_created
  ON stitch_chat_messages(conversation_id, created_at DESC, id DESC);
CREATE UNIQUE INDEX IF NOT EXISTS messages_client_id_unique
  ON stitch_chat_messages(conversation_id, client_message_id) WHERE client_message_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS messages_reply_unique
  ON stitch_chat_messages(conversation_id, reply_to) WHERE reply_to IS NOT NULL;

CREATE TABLE IF NOT EXISTS chat_rate_limits (
  id TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS chat_rate_limits_expiry ON chat_rate_limits(expires_at);
