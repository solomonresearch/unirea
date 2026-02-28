-- Add group conversation support to existing conversations table

ALTER TABLE conversations
  ADD COLUMN name text,
  ADD COLUMN is_group boolean NOT NULL DEFAULT false,
  ADD COLUMN invite_code text UNIQUE,
  ADD COLUMN created_by uuid REFERENCES profiles(id);

-- Unique partial index on invite_code (only non-null values)
CREATE UNIQUE INDEX idx_conversations_invite_code
  ON conversations(invite_code) WHERE invite_code IS NOT NULL;

-- Allow group members to update conversation (e.g. rename group)
CREATE POLICY "Group members can update conversations"
  ON conversations FOR UPDATE
  USING (id IN (SELECT user_conversation_ids(auth.uid())))
  WITH CHECK (id IN (SELECT user_conversation_ids(auth.uid())));

-- Allow users to leave conversations (delete their participant row)
CREATE POLICY "Users can leave conversations"
  ON conversation_participants FOR DELETE
  USING (user_id = auth.uid());
