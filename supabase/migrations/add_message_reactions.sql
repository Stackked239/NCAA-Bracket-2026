-- Message reactions (iMessage-style)
CREATE TABLE message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

-- Fast lookups by message
CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);

-- RLS
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions"
  ON message_reactions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert reactions"
  ON message_reactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can delete own reactions"
  ON message_reactions FOR DELETE
  USING (true);
