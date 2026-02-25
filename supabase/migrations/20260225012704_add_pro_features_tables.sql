/*
  # Add Pro Features Tables
  
  1. New Tables
    - `merchant_mappings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `merchant_name` (text) - normalized merchant name
      - `category` (text) - learned category
      - `confidence` (integer) - learning confidence score
      - `last_used` (timestamptz)
      - `created_at` (timestamptz)
    
    - `spending_forecasts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `forecast_date` (date)
      - `projected_balance` (decimal)
      - `projected_spending` (decimal)
      - `confidence_level` (text)
      - `created_at` (timestamptz)
    
    - `recurring_expenses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `merchant_name` (text)
      - `category` (text)
      - `average_amount` (decimal)
      - `frequency` (text) - daily, weekly, monthly, etc.
      - `next_expected_date` (date)
      - `last_occurrence` (date)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `financial_alerts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `alert_type` (text) - overspending, unusual_activity, goal_progress, etc.
      - `category` (text, nullable)
      - `message` (text)
      - `severity` (text) - info, warning, critical
      - `is_read` (boolean)
      - `metadata` (jsonb) - additional data
      - `created_at` (timestamptz)
    
    - `spending_trends`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `category` (text)
      - `period` (text) - week, month, year
      - `average_amount` (decimal)
      - `trend_direction` (text) - increasing, decreasing, stable
      - `percentage_change` (decimal)
      - `calculated_at` (timestamptz)
  
  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to access their own data only
*/

CREATE TABLE IF NOT EXISTS merchant_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  merchant_name text NOT NULL,
  category text NOT NULL,
  confidence integer DEFAULT 1,
  last_used timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, merchant_name)
);

CREATE TABLE IF NOT EXISTS spending_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  forecast_date date NOT NULL,
  projected_balance decimal(10, 2) NOT NULL,
  projected_spending decimal(10, 2) NOT NULL,
  confidence_level text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recurring_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  merchant_name text NOT NULL,
  category text NOT NULL,
  average_amount decimal(10, 2) NOT NULL,
  frequency text NOT NULL,
  next_expected_date date,
  last_occurrence date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS financial_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  alert_type text NOT NULL,
  category text,
  message text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS spending_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  period text NOT NULL,
  average_amount decimal(10, 2) NOT NULL,
  trend_direction text NOT NULL,
  percentage_change decimal(5, 2),
  calculated_at timestamptz DEFAULT now()
);

ALTER TABLE merchant_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_trends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own merchant mappings"
  ON merchant_mappings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own merchant mappings"
  ON merchant_mappings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own merchant mappings"
  ON merchant_mappings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own merchant mappings"
  ON merchant_mappings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own spending forecasts"
  ON spending_forecasts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spending forecasts"
  ON spending_forecasts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own recurring expenses"
  ON recurring_expenses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring expenses"
  ON recurring_expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring expenses"
  ON recurring_expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring expenses"
  ON recurring_expenses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own financial alerts"
  ON financial_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own financial alerts"
  ON financial_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own financial alerts"
  ON financial_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own financial alerts"
  ON financial_alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own spending trends"
  ON spending_trends FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spending trends"
  ON spending_trends FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_merchant_mappings_user_id ON merchant_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_mappings_merchant ON merchant_mappings(user_id, merchant_name);
CREATE INDEX IF NOT EXISTS idx_spending_forecasts_user_date ON spending_forecasts(user_id, forecast_date);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_user_active ON recurring_expenses(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_financial_alerts_user_unread ON financial_alerts(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_spending_trends_user_period ON spending_trends(user_id, period, category);