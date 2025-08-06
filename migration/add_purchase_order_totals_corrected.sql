-- Updated Migration: Use existing tax and wht columns from clients table

-- Step 1: Add the new fields to purchase_orders table (if not already added)
ALTER TABLE public.purchase_orders 
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS after_tax NUMERIC(12,2) DEFAULT 0;

-- Step 2: Create function to calculate purchase order totals using existing tax columns
CREATE OR REPLACE FUNCTION calculate_purchase_order_totals()
RETURNS TRIGGER AS $$
DECLARE
    items_total NUMERIC(12,2) := 0;
    vat_rate NUMERIC(5,2) := 12.00;
    wht_rate NUMERIC(5,2) := 0.00;
    vat_amount NUMERIC(12,2);
    net_of_vat NUMERIC(12,2);
    withholding_tax NUMERIC(12,2);
    final_amount NUMERIC(12,2);
    tax_string TEXT;
    wht_string TEXT;
BEGIN
    -- Calculate total from purchase order items
    SELECT COALESCE(SUM(total_price), 0) 
    INTO items_total
    FROM purchase_order_items 
    WHERE purchase_order_id = COALESCE(NEW.id, OLD.id);

    -- Get client tax information using existing tax and wht columns
    IF NEW.supplier_client_id IS NOT NULL THEN
        SELECT c.tax, c.wht
        INTO tax_string, wht_string
        FROM clients c 
        WHERE c.id = NEW.supplier_client_id;

        -- Parse VAT rate from tax column (extract numeric value)
        IF tax_string IS NOT NULL AND tax_string != '' THEN
            -- Extract number from strings like "12%", "VAT 12%", "12", etc.
            vat_rate := COALESCE(
                (regexp_match(tax_string, '(\d+(?:\.\d+)?)'))[1]::NUMERIC, 
                12.00
            );
        END IF;

        -- Parse withholding tax rate from wht column
        IF wht_string IS NOT NULL AND wht_string != '' THEN
            -- Extract number from strings like "2%", "2", etc.
            wht_rate := COALESCE(
                (regexp_match(wht_string, '(\d+(?:\.\d+)?)'))[1]::NUMERIC, 
                0.00
            );
        END IF;
    END IF;

    -- Set total_amount (gross total before tax adjustments)
    NEW.total_amount := items_total;

    -- Calculate after_tax amount following the taxCalculation.ts logic
    -- Assuming subtotal is VAT-inclusive (Philippine standard)
    vat_amount := items_total * (vat_rate / (100.0 + vat_rate));
    net_of_vat := items_total - vat_amount;
    withholding_tax := net_of_vat * (wht_rate / 100.0);
    final_amount := net_of_vat + vat_amount - withholding_tax;
    
    NEW.after_tax := final_amount;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger for purchase_orders table
DROP TRIGGER IF EXISTS trigger_calculate_po_totals ON purchase_orders;
CREATE TRIGGER trigger_calculate_po_totals
    BEFORE INSERT OR UPDATE ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION calculate_purchase_order_totals();

-- Step 4: Create function to recalculate PO totals when items change
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

-- Step 5: Create trigger for purchase_order_items table
DROP TRIGGER IF EXISTS trigger_recalc_po_totals_on_items ON purchase_order_items;
CREATE TRIGGER trigger_recalc_po_totals_on_items
    AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_po_totals_on_item_change();

-- Step 6: Update existing purchase orders to calculate totals
UPDATE purchase_orders 
SET updated_at = NOW()
WHERE id IN (
    SELECT DISTINCT purchase_order_id 
    FROM purchase_order_items
);

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchase_orders_total_amount ON purchase_orders(total_amount);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_after_tax ON purchase_orders(after_tax);

COMMENT ON COLUMN purchase_orders.total_amount IS 'Gross total from sum of all purchase order items (before tax adjustments)';
COMMENT ON COLUMN purchase_orders.after_tax IS 'Net amount due after applying VAT and withholding tax calculations based on client tax and wht columns';