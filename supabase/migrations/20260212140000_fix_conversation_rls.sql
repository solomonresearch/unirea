-- Fix self-referencing RLS on conversation_participants that causes infinite recursion.
-- Use a SECURITY DEFINER function to look up user's conversations without triggering RLS.

CREATE OR REPLACE FUNCTION user_conversation_ids(uid uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT conversation_id FROM conversation_participants WHERE user_id = uid;
$$;

-- Drop the recursive policy
DROP POLICY "Users can view participants of their conversations" ON conversation_participants;

-- Replace with a policy that uses the security definer function
CREATE POLICY "Users can view participants of their conversations"
  ON conversation_participants FOR SELECT
  USING (
    conversation_id IN (SELECT user_conversation_ids(auth.uid()))
  );

-- Also fix the conversations SELECT policy which has the same issue
DROP POLICY "Users can view their conversations" ON conversations;

CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (
    id IN (SELECT user_conversation_ids(auth.uid()))
  );

-- Also fix messages SELECT policy
DROP POLICY "Users can view messages in their conversations" ON messages;

CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (SELECT user_conversation_ids(auth.uid()))
  );

-- Also fix messages INSERT policy
DROP POLICY "Users can send messages in their conversations" ON messages;

CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND conversation_id IN (SELECT user_conversation_ids(auth.uid()))
  );
