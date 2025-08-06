-- Migration: Add automatic total calculation fields and triggers to purchase_orders table

-- Step 1: Add the new fields to purchase_orders table
ALTER TABLE public.purchase_orders 
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS after_tax NUMERIC(12,2) DEFAULT 0;

-- Step 2: Add client tax information fields if they don't exist
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5,2) DEFAULT 12.00,
ADD COLUMN IF NOT EXISTS withholding_tax_rate NUMERIC(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS tax_exempt BOOLEAN DEFAULT FALSE;

-- Step 3: Create function to calculate purchase order totals
CREATE OR REPLACE FUNCTION calculate_purchase_order_totals()
RETURNS TRIGGER AS $$
DECLARE
    items_total NUMERIC(12,2) := 0;
    vat_rate NUMERIC(5,2) := 12.00;
    wht_rate NUMERIC(5,2) := 0.00;
    tax_exempt BOOLEAN := FALSE;
    vat_amount NUMERIC(12,2);
    net_of_vat NUMERIC(12,2);
    withholding_tax NUMERIC(12,2);
    final_amount NUMERIC(12,2);
BEGIN
    -- Calculate total from purchase order items
    SELECT COALESCE(SUM(total_price), 0) 
    INTO items_total
    FROM purchase_order_items 
    WHERE purchase_order_id = COALESCE(NEW.id, OLD.id);

    -- Get client tax information if supplier_client_id exists
    IF NEW.supplier_client_id IS NOT NULL THEN
        SELECT 
            COALESCE(c.vat_rate, 12.00),
            COALESCE(c.withholding_tax_rate, 0.00),
            COALESCE(c.tax_exempt, FALSE)
        INTO vat_rate, wht_rate, tax_exempt
        FROM clients c 
        WHERE c.id = NEW.supplier_client_id;
    END IF;

    -- Set total_amount (gross total before tax adjustments)
    NEW.total_amount := items_total;

    -- Calculate after_tax amount
    IF tax_exempt THEN
        -- If tax exempt, after_tax equals total_amount
        NEW.after_tax := items_total;
    ELSE
        -- Calculate VAT-inclusive scenario (items_total includes VAT)
        vat_amount := items_total * (vat_rate / 100.0) / (1 + vat_rate / 100.0);
        net_of_vat := items_total - vat_amount;
        withholding_tax := net_of_vat * (wht_rate / 100.0);
        final_amount := items_total - withholding_tax;
        
        NEW.after_tax := final_amount;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger for purchase_orders table
DROP TRIGGER IF EXISTS trigger_calculate_po_totals ON purchase_orders;
CREATE TRIGGER trigger_calculate_po_totals
    BEFORE INSERT OR UPDATE ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION calculate_purchase_order_totals();

-- Step 5: Create function to recalculate PO totals when items change
CREATE OR REPLACE FUNCTION recalculate_po_totals_on_item_change()
RETURNS TRIGGER AS $$
DECLARE
    po_id UUID;
BEGIN
    -- Get the purchase order ID from the affected row
    po_id := COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);
    
    -- Update the purchase order to trigger recalculation
    UPDATE purchase_orders 
    SET updated_at = NOW()
    WHERE id = po_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger for purchase_order_items table
DROP TRIGGER IF EXISTS trigger_recalc_po_totals_on_items ON purchase_order_items;
CREATE TRIGGER trigger_recalc_po_totals_on_items
    AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_po_totals_on_item_change();

-- Step 7: Update existing purchase orders to calculate totals
UPDATE purchase_orders 
SET updated_at = NOW()
WHERE id IN (
    SELECT DISTINCT purchase_order_id 
    FROM purchase_order_items
);

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchase_orders_total_amount ON purchase_orders(total_amount);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_after_tax ON purchase_orders(after_tax);
CREATE INDEX IF NOT EXISTS idx_clients_tax_rates ON clients(vat_rate, withholding_tax_rate, tax_exempt);

COMMENT ON COLUMN purchase_orders.total_amount IS 'Gross total from sum of all purchase order items (before tax adjustments)';
COMMENT ON COLUMN purchase_orders.after_tax IS 'Net amount due after applying VAT and withholding tax calculations';
COMMENT ON COLUMN clients.vat_rate IS 'VAT rate percentage for this client (default 12%)';
COMMENT ON COLUMN clients.withholding_tax_rate IS 'Withholding tax rate percentage for this client';
COMMENT ON COLUMN clients.tax_exempt IS 'Whether this client is exempt from tax calculations';