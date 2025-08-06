-- Create sales_invoice table to manage sales invoices and payment tracking
-- Migration: create_sales_invoice_table.sql

-- Create ENUM for invoice status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'cancelled', 'overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create ENUM for payment status if it doesn't exist  
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('unpaid', 'partial', 'paid', 'overpaid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create sales_invoice table
CREATE TABLE IF NOT EXISTS sales_invoice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Invoice identification
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    
    -- Relationships
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    
    -- Invoice details
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    
    -- Financial amounts (all in decimal for precision)
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    vat_rate DECIMAL(5,4) NOT NULL DEFAULT 0.12, -- 12% default VAT
    vat_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    net_of_vat DECIMAL(15,2) NOT NULL DEFAULT 0,
    wht_rate DECIMAL(5,4) NOT NULL DEFAULT 0, -- Withholding tax rate
    withholding_tax DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    
    -- Payment tracking
    amount_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
    amount_due DECIMAL(15,2) NOT NULL DEFAULT 0,
    payment_status payment_status NOT NULL DEFAULT 'unpaid',
    
    -- Status and metadata
    status invoice_status NOT NULL DEFAULT 'draft',
    notes TEXT,
    
    -- Payment history (JSON for flexibility)
    payment_history JSONB DEFAULT '[]'::jsonb,
    
    -- Tax information from client
    client_tax_info JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_amounts CHECK (
        subtotal >= 0 AND 
        vat_amount >= 0 AND 
        net_of_vat >= 0 AND 
        withholding_tax >= 0 AND 
        total_amount >= 0 AND 
        amount_paid >= 0 AND 
        amount_due >= 0
    ),
    CONSTRAINT valid_rates CHECK (
        vat_rate >= 0 AND vat_rate <= 1 AND
        wht_rate >= 0 AND wht_rate <= 1
    )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_invoice_invoice_number ON sales_invoice(invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_purchase_order_id ON sales_invoice(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_client_id ON sales_invoice(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_invoice_date ON sales_invoice(invoice_date);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_status ON sales_invoice(status);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_payment_status ON sales_invoice(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_due_date ON sales_invoice(due_date);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_sales_invoice_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sales_invoice_updated_at
    BEFORE UPDATE ON sales_invoice
    FOR EACH ROW
    EXECUTE FUNCTION update_sales_invoice_updated_at();

-- Create trigger to automatically calculate amount_due
CREATE OR REPLACE FUNCTION calculate_sales_invoice_amounts()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate amount due
    NEW.amount_due = NEW.total_amount - NEW.amount_paid;
    
    -- Update payment status based on amounts
    IF NEW.amount_paid <= 0 THEN
        NEW.payment_status = 'unpaid';
    ELSIF NEW.amount_paid >= NEW.total_amount THEN
        IF NEW.amount_paid > NEW.total_amount THEN
            NEW.payment_status = 'overpaid';
        ELSE
            NEW.payment_status = 'paid';
        END IF;
    ELSE
        NEW.payment_status = 'partial';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_sales_invoice_amounts
    BEFORE INSERT OR UPDATE ON sales_invoice
    FOR EACH ROW
    EXECUTE FUNCTION calculate_sales_invoice_amounts();

-- Add comments for documentation
COMMENT ON TABLE sales_invoice IS 'Sales invoices with tax calculations and payment tracking';
COMMENT ON COLUMN sales_invoice.invoice_number IS 'Unique sales invoice number (e.g., INV-2024-001)';
COMMENT ON COLUMN sales_invoice.vat_rate IS 'VAT rate as decimal (0.12 = 12%)';
COMMENT ON COLUMN sales_invoice.wht_rate IS 'Withholding tax rate as decimal (0.02 = 2%)';
COMMENT ON COLUMN sales_invoice.payment_history IS 'JSON array of payment records with dates and amounts';
COMMENT ON COLUMN sales_invoice.client_tax_info IS 'Client-specific tax configuration (VAT, WHT rates)';