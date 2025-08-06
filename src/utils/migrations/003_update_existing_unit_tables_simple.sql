-- Migration: Update existing unit tracking tables (SIMPLIFIED VERSION)
-- Purpose: Handle existing tables and complete the unit tracking system setup

-- Add missing columns to purchase_order_item_units if they don't exist
ALTER TABLE purchase_order_item_units 
ADD COLUMN IF NOT EXISTS serial_number VARCHAR(255),
ADD COLUMN IF NOT EXISTS batch_number VARCHAR(255),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add missing columns to delivery_item_units if they don't exist  
ALTER TABLE delivery_item_units 
ADD COLUMN IF NOT EXISTS serial_number VARCHAR(255),
ADD COLUMN IF NOT EXISTS batch_number VARCHAR(255),
ADD COLUMN IF NOT EXISTS condition_notes TEXT;

-- Create unit_delivery_links table if it doesn't exist
CREATE TABLE IF NOT EXISTS unit_delivery_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_unit_id UUID NOT NULL REFERENCES purchase_order_item_units(id) ON DELETE CASCADE,
    delivery_unit_id UUID NOT NULL REFERENCES delivery_item_units(id) ON DELETE CASCADE,
    link_status VARCHAR(50) NOT NULL DEFAULT 'linked',
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    confirmed_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unit_delivery_links_purchase_order_unit_id_key UNIQUE(purchase_order_unit_id),
    CONSTRAINT unit_delivery_links_delivery_unit_id_key UNIQUE(delivery_unit_id)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_po_item_units_po_item_id ON purchase_order_item_units(purchase_order_item_id);
CREATE INDEX IF NOT EXISTS idx_po_item_units_status ON purchase_order_item_units(unit_status);
CREATE INDEX IF NOT EXISTS idx_delivery_item_units_delivery_item_id ON delivery_item_units(delivery_item_id);
CREATE INDEX IF NOT EXISTS idx_delivery_item_units_status ON delivery_item_units(unit_status);
CREATE INDEX IF NOT EXISTS idx_unit_delivery_links_po_unit_id ON unit_delivery_links(purchase_order_unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_delivery_links_delivery_unit_id ON unit_delivery_links(delivery_unit_id);

-- Create or replace functions for automatic unit generation
CREATE OR REPLACE FUNCTION generate_purchase_order_units()
RETURNS TRIGGER AS $$
DECLARE
    i INTEGER;
    current_count INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN
        FOR i IN 1..NEW.quantity LOOP
            INSERT INTO purchase_order_item_units (
                purchase_order_item_id, unit_number, unit_status
            ) VALUES (NEW.id, i, 'ordered')
            ON CONFLICT (purchase_order_item_id, unit_number) DO NOTHING;
        END LOOP;
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'UPDATE' AND OLD.quantity != NEW.quantity THEN
        SELECT COUNT(*) INTO current_count FROM purchase_order_item_units WHERE purchase_order_item_id = NEW.id;
        
        IF NEW.quantity > current_count THEN
            FOR i IN (current_count + 1)..NEW.quantity LOOP
                INSERT INTO purchase_order_item_units (
                    purchase_order_item_id, unit_number, unit_status
                ) VALUES (NEW.id, i, 'ordered')
                ON CONFLICT (purchase_order_item_id, unit_number) DO NOTHING;
            END LOOP;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_delivery_units()
RETURNS TRIGGER AS $$
DECLARE
    i INTEGER;
    current_count INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN
        FOR i IN 1..NEW.quantity_delivered LOOP
            INSERT INTO delivery_item_units (
                delivery_item_id, unit_number, unit_status
            ) VALUES (NEW.id, i, 'delivered')
            ON CONFLICT (delivery_item_id, unit_number) DO NOTHING;
        END LOOP;
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'UPDATE' AND OLD.quantity_delivered != NEW.quantity_delivered THEN
        SELECT COUNT(*) INTO current_count FROM delivery_item_units WHERE delivery_item_id = NEW.id;
        
        IF NEW.quantity_delivered > current_count THEN
            FOR i IN (current_count + 1)..NEW.quantity_delivered LOOP
                INSERT INTO delivery_item_units (
                    delivery_item_id, unit_number, unit_status
                ) VALUES (NEW.id, i, 'delivered')
                ON CONFLICT (delivery_item_id, unit_number) DO NOTHING;
            END LOOP;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_generate_purchase_order_units ON purchase_order_items;
CREATE TRIGGER trigger_generate_purchase_order_units
    AFTER INSERT OR UPDATE ON purchase_order_items
    FOR EACH ROW EXECUTE FUNCTION generate_purchase_order_units();

DROP TRIGGER IF EXISTS trigger_generate_delivery_units ON delivery_items;
CREATE TRIGGER trigger_generate_delivery_units
    AFTER INSERT OR UPDATE ON delivery_items
    FOR EACH ROW EXECUTE FUNCTION generate_delivery_units();

-- Function to sync unit status with linking status
CREATE OR REPLACE FUNCTION sync_unit_link_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE purchase_order_item_units SET unit_status = 'linked' WHERE id = NEW.purchase_order_unit_id;
        UPDATE delivery_item_units SET unit_status = 'linked' WHERE id = NEW.delivery_unit_id;
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        UPDATE purchase_order_item_units SET unit_status = 'ordered' WHERE id = OLD.purchase_order_unit_id;
        UPDATE delivery_item_units SET unit_status = 'delivered' WHERE id = OLD.delivery_unit_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status synchronization
DROP TRIGGER IF EXISTS trigger_sync_unit_link_status ON unit_delivery_links;
CREATE TRIGGER trigger_sync_unit_link_status
    AFTER INSERT OR DELETE ON unit_delivery_links
    FOR EACH ROW EXECUTE FUNCTION sync_unit_link_status();