/*
  # Create Finance Tracking Tables

  ## Summary
  Creates the core database schema for Patrick's Finance Sorter application, enabling data persistence, budget tracking, and historical analysis.

  ## New Tables
  
  ### 1. `transactions`
  Stores all bank transactions with categorization
  - `id` (uuid, primary key) - Unique transaction identifier
  - `date` (date) - Transaction date
  - `description` (text) - Transaction description from bank
  - `amount` (decimal) - Transaction amount (negative for expenses, positive for income)
  - `category` (text) - Assigned category (Food, Rent, etc.)
  - `month` (text) - Month in YYYY-MM format for easy filtering
  - `created_at` (timestamptz) - Record creation timestamp
  
  ### 2. `budgets`
  Stores monthly budget goals per category
  - `id` (uuid, primary key) - Unique budget identifier
  - `category` (text) - Budget category name
  - `amount` (decimal) - Monthly budget limit
  - `month` (text) - Month in YYYY-MM format
  - `created_at` (timestamptz) - Record creation timestamp
  - Unique constraint on (category, month) to prevent duplicates

  ### 3. `insights`
  Stores generated financial insights and recommendations
  - `id` (uuid, primary key) - Unique insight identifier
  - `month` (text) - Month in YYYY-MM format
  - `insight_type` (text) - Type of insight (trend, warning, tip, recurring)
  - `category` (text) - Related category (nullable)
  - `message` (text) - Insight message content
  - `amount` (decimal) - Associated amount (nullable)
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable RLS on all tables
  - Currently set to public access for demo purposes
  - In production, policies should be restricted to authenticated users

  ## Indexes
  - Index on transactions(month) for fast month-based queries
  - Index on transactions(category) for category aggregations
  - Index on budgets(month) for budget lookups
*/

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  description text NOT NULL,
  amount decimal(10, 2) NOT NULL,
  category text NOT NULL DEFAULT 'Uncategorized',
  month text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  amount decimal(10, 2) NOT NULL,
  month text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(category, month)
);

-- Create insights table
CREATE TABLE IF NOT EXISTS insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text NOT NULL,
  insight_type text NOT NULL,
  category text,
  message text NOT NULL,
  amount decimal(10, 2),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_month ON transactions(month);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
CREATE INDEX IF NOT EXISTS idx_insights_month ON insights(month);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- Create policies (public access for demo)
CREATE POLICY "Enable read access for all users"
  ON transactions FOR SELECT
  USING (true);

CREATE POLICY "Enable insert access for all users"
  ON transactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
  ON transactions FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for all users"
  ON transactions FOR DELETE
  USING (true);

CREATE POLICY "Enable read access for all users"
  ON budgets FOR SELECT
  USING (true);

CREATE POLICY "Enable insert access for all users"
  ON budgets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
  ON budgets FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for all users"
  ON budgets FOR DELETE
  USING (true);

CREATE POLICY "Enable read access for all users"
  ON insights FOR SELECT
  USING (true);

CREATE POLICY "Enable insert access for all users"
  ON insights FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
  ON insights FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for all users"
  ON insights FOR DELETE
  USING (true);
