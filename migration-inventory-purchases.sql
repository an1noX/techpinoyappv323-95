-- Migration: Create Inventory Purchase Tables
-- Run this SQL in your Supabase SQL Editor

-- 1. Create inventory_purchases table
CREATE TABLE IF NOT EXISTS inventory_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name TEXT NOT NULL,
    purchase_date DATE NOT NULL,
    reference_number TEXT UNIQUE NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    notes TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create inventory_purchase_items table
CREATE TABLE IF NOT EXISTS inventory_purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_purchase_id UUID NOT NULL REFERENCES inventory_purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL, -- Store name in case product is deleted
    product_sku TEXT, -- Store SKU for reference
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_cost DECIMAL(12,2) NOT NULL CHECK (unit_cost >= 0),
    total_cost DECIMAL(12,2) NOT NULL CHECK (total_cost >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_purchases_supplier_id ON inventory_purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_purchases_purchase_date ON inventory_purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_inventory_purchases_reference_number ON inventory_purchases(reference_number);
CREATE INDEX IF NOT EXISTS idx_inventory_purchases_status ON inventory_purchases(status);

CREATE INDEX IF NOT EXISTS idx_inventory_purchase_items_purchase_id ON inventory_purchase_items(inventory_purchase_id);
CREATE INDEX IF NOT EXISTS idx_inventory_purchase_items_product_id ON inventory_purchase_items(product_id);

-- 4. Create updated_at trigger for inventory_purchases
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_purchases_updated_at
    BEFORE UPDATE ON inventory_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Add RLS (Row Level Security) policies if needed
-- Enable RLS
ALTER TABLE inventory_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_purchase_items ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust according to your auth requirements)
-- Allow authenticated users to read all records
CREATE POLICY "Allow authenticated users to read inventory purchases" 
ON inventory_purchases FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to read inventory purchase items" 
ON inventory_purchase_items FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert records
CREATE POLICY "Allow authenticated users to insert inventory purchases" 
ON inventory_purchases FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert inventory purchase items" 
ON inventory_purchase_items FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to update records
CREATE POLICY "Allow authenticated users to update inventory purchases" 
ON inventory_purchases FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to update inventory purchase items" 
ON inventory_purchase_items FOR UPDATE 
TO authenticated 
USING (true);

-- Allow authenticated users to delete records (optional)
CREATE POLICY "Allow authenticated users to delete inventory purchases" 
ON inventory_purchases FOR DELETE 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to delete inventory purchase items" 
ON inventory_purchase_items FOR DELETE 
TO authenticated 
USING (true);

-- 6. Add helpful comments
COMMENT ON TABLE inventory_purchases IS 'Records of inventory stock purchases from suppliers';
COMMENT ON TABLE inventory_purchase_items IS 'Individual items within each inventory purchase';

COMMENT ON COLUMN inventory_purchases.reference_number IS 'Unique reference number for the purchase (e.g., IP-123456)';
COMMENT ON COLUMN inventory_purchases.total_amount IS 'Total amount of the purchase in the system currency';
COMMENT ON COLUMN inventory_purchase_items.product_name IS 'Product name stored for reference even if product is deleted';
COMMENT ON COLUMN inventory_purchase_items.total_cost IS 'Calculated field: quantity * unit_cost';

-- 7. Create a view for easier querying with joined data
CREATE OR REPLACE VIEW inventory_purchases_with_details AS
SELECT 
    ip.id,
    ip.supplier_id,
    ip.supplier_name,
    ip.purchase_date,
    ip.reference_number,
    ip.total_amount,
    ip.notes,
    ip.status,
    ip.created_at,
    ip.updated_at,
    COUNT(ipi.id) as items_count,
    SUM(ipi.quantity) as total_quantity
FROM inventory_purchases ip
LEFT JOIN inventory_purchase_items ipi ON ip.id = ipi.inventory_purchase_id
GROUP BY ip.id, ip.supplier_id, ip.supplier_name, ip.purchase_date, 
         ip.reference_number, ip.total_amount, ip.notes, ip.status, 
         ip.created_at, ip.updated_at;

COMMENT ON VIEW inventory_purchases_with_details IS 'Inventory purchases with item counts and totals';

-- Migration completed successfully!
-- Next: Update your Supabase types by running the type generation command
-- Then update the CreateInventoryPurchaseModal component