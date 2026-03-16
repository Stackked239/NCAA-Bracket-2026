-- NCAA Bracket 2026 Database Schema
-- Run this in your Supabase SQL Editor

-- Family members
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tournament games
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  region TEXT NOT NULL,
  round INTEGER NOT NULL,
  team_a_seed INTEGER,
  team_a_name TEXT,
  team_a_record TEXT,
  team_b_seed INTEGER,
  team_b_name TEXT,
  team_b_record TEXT,
  team_a_score INTEGER,
  team_b_score INTEGER,
  winner TEXT,
  status TEXT DEFAULT 'pregame',
  game_time TIMESTAMPTZ,
  espn_game_id TEXT,
  next_game_id TEXT,
  next_game_slot TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User bracket picks
CREATE TABLE IF NOT EXISTS picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT REFERENCES games(id),
  picked_team TEXT NOT NULL,
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- Enable RLS but allow all operations for now (family app)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;

-- Permissive policies (family-only app, no auth needed)
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on games" ON games FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on picks" ON picks FOR ALL USING (true) WITH CHECK (true);

-- Insert default admin user
INSERT INTO users (name, is_admin) VALUES ('Austin', true) ON CONFLICT (name) DO NOTHING;
