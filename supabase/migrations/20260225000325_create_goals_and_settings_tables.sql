/*
  # Create Goals and Settings Tables

  1. New Tables
    - `goals`
      - `id` (uuid, primary key)
      - `name` (text, goal name)
      - `target_amount` (numeric, target amount to save)
      - `current_amount` (numeric, current progress)
      - `target_date` (date, optional target completion date)
      - `category` (text, type of goal: emergency, savings, debt, etc.)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `settings`
      - `id` (uuid, primary key)
      - `key` (text, unique setting key)
      - `value` (jsonb, setting value)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated access (preparing for future auth)
*/

CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  target_amount numeric NOT NULL DEFAULT 0,
  current_amount numeric NOT NULL DEFAULT 0,
  target_date date,
  category text NOT NULL DEFAULT 'savings',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access to goals"
  ON goals
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public access to settings"
  ON settings
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);