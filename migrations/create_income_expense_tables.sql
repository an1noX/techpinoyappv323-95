-- Create income and expense tracking tables
-- Migration: create_income_expense_tables.sql

-- Create income_entries table
CREATE TABLE IF NOT EXISTS income_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Income details
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    source VARCHAR(255) NOT NULL,
    destination VARCHAR(50) NOT NULL CHECK (destination IN ('Bank', 'GCash', 'Cash on Hand')),
    description TEXT,
    
    -- Optional relationship to sales invoice
    sales_invoice_id UUID REFERENCES sales_invoice(id) ON DELETE SET NULL,
    sales_invoice_number VARCHAR(100),
    
    -- Metadata
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create expense_entries table
CREATE TABLE IF NOT EXISTS expense_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Expense details
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    purpose VARCHAR(255) NOT NULL,
    source VARCHAR(50) NOT NULL CHECK (source IN ('Bank', 'GCash', 'Cash on Hand')),
    description TEXT,
    
    -- Optional relationship to purchase order
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
    purchase_order_number VARCHAR(100),
    
    -- Metadata
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_income_entries_entry_date ON income_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_income_entries_destination ON income_entries(destination);
CREATE INDEX IF NOT EXISTS idx_income_entries_sales_invoice_id ON income_entries(sales_invoice_id);

CREATE INDEX IF NOT EXISTS idx_expense_entries_entry_date ON expense_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_expense_entries_source ON expense_entries(source);
CREATE INDEX IF NOT EXISTS idx_expense_entries_purchase_order_id ON expense_entries(purchase_order_id);

-- Create triggers for updated_at timestamp
CREATE OR REPLACE FUNCTION update_income_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_income_entries_updated_at
    BEFORE UPDATE ON income_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_income_entries_updated_at();

CREATE OR REPLACE FUNCTION update_expense_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_expense_entries_updated_at
    BEFORE UPDATE ON expense_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_expense_entries_updated_at();

-- Add comments for documentation
COMMENT ON TABLE income_entries IS 'Income tracking entries with fund destination tracking';
COMMENT ON TABLE expense_entries IS 'Expense tracking entries with fund source tracking';
COMMENT ON COLUMN income_entries.destination IS 'Fund destination: Bank, GCash, or Cash on Hand';
COMMENT ON COLUMN expense_entries.source IS 'Fund source: Bank, GCash, or Cash on Hand';