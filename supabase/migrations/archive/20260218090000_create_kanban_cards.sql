-- Create kanban_cards table for simple Kanban board
CREATE TABLE kanban_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX idx_kanban_cards_status_position ON kanban_cards (status, position);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_kanban_cards_updated_at 
BEFORE UPDATE ON kanban_cards 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security) but allow public access for this simple case
ALTER TABLE kanban_cards ENABLE ROW LEVEL SECURITY;

-- Create policies to allow anyone to read, create, update, and delete cards
-- This is suitable for a simple internal tool without authentication
CREATE POLICY "Allow public read access on kanban_cards" ON kanban_cards
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on kanban_cards" ON kanban_cards
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on kanban_cards" ON kanban_cards
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete access on kanban_cards" ON kanban_cards
  FOR DELETE USING (true);

-- Insert some test data
INSERT INTO kanban_cards (title, description, status, position) VALUES
  ('Set up project structure', 'Initialize the basic project structure with components and routes', 'done', 1),
  ('Create database schema', 'Design and implement the kanban cards table', 'done', 2),
  ('Build Kanban UI', 'Create the React components for the kanban board with columns and cards', 'in_progress', 1),
  ('Add drag and drop', 'Implement drag and drop functionality between columns', 'todo', 1),
  ('Style with Tailwind', 'Apply clean, minimal styling to the kanban board', 'todo', 2),
  ('Add card management', 'Implement create, edit, and delete functionality for cards', 'todo', 3),
  ('Test the board', 'Test all functionality and fix any bugs', 'todo', 4);