-- Track when a user last read a conversation for unread indicators

ALTER TABLE conversation_participants
  ADD COLUMN last_read_at timestamptz DEFAULT now();

-- Allow users to update their own last_read_at
CREATE POLICY "Users can update their own participation"
  ON conversation_participants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
