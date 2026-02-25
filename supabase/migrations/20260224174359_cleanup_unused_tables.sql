/*
  # Cleanup Unused Database Tables

  ## Summary
  Removes all unused database tables and policies since the application now uses in-memory storage.
  This eliminates security warnings and unused resources.

  ## Changes
  1. Drop all RLS policies from transactions, budgets, and insights tables
  2. Drop all unused indexes
  3. Drop all tables (transactions, budgets, insights)

  ## Rationale
  - Application switched to in-memory storage for simplicity
  - Database tables are not being used
  - Removes security warnings about insecure RLS policies
  - Cleans up unused indexes
*/

-- Drop policies first (if they exist)
DROP POLICY IF EXISTS "Enable read access for all users" ON transactions;
DROP POLICY IF EXISTS "Enable insert access for all users" ON transactions;
DROP POLICY IF EXISTS "Enable update access for all users" ON transactions;
DROP POLICY IF EXISTS "Enable delete access for all users" ON transactions;

DROP POLICY IF EXISTS "Enable read access for all users" ON budgets;
DROP POLICY IF EXISTS "Enable insert access for all users" ON budgets;
DROP POLICY IF EXISTS "Enable update access for all users" ON budgets;
DROP POLICY IF EXISTS "Enable delete access for all users" ON budgets;

DROP POLICY IF EXISTS "Enable read access for all users" ON insights;
DROP POLICY IF EXISTS "Enable insert access for all users" ON insights;
DROP POLICY IF EXISTS "Enable update access for all users" ON insights;
DROP POLICY IF EXISTS "Enable delete access for all users" ON insights;

-- Drop indexes
DROP INDEX IF EXISTS idx_transactions_month;
DROP INDEX IF EXISTS idx_transactions_category;
DROP INDEX IF EXISTS idx_budgets_month;
DROP INDEX IF EXISTS idx_insights_month;

-- Drop tables
DROP TABLE IF EXISTS insights;
DROP TABLE IF EXISTS budgets;
DROP TABLE IF EXISTS transactions;
