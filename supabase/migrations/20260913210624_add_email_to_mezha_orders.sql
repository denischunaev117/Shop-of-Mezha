/*
  # Add email column to MEZHA orders

  1. Modified Tables
  - `mezha_orders` — adds customer email for order notifications.

  2. Data Safety
  - Existing orders are preserved (column is nullable).

  3. Security
  - Existing RLS policies remain unchanged.
*/

ALTER TABLE public.mezha_orders
  ADD COLUMN IF NOT EXISTS email text;