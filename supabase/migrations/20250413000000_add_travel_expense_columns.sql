-- Add travel mode related columns to expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS is_travel_expense BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS travel_currency TEXT,
ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,4);