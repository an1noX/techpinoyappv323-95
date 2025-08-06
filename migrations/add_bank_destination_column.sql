-- Add bank_destination column to income_entries table
ALTER TABLE income_entries 
ADD COLUMN bank_destination TEXT CHECK (bank_destination IN ('TECHPINOY', 'MYTCH'));

-- Add comment for documentation
COMMENT ON COLUMN income_entries.bank_destination IS 'Specific bank destination when destination is Bank';