-- Migration: Update existing unit tracking tables and ensure proper setup
-- Purpose: Handle existing tables and complete the unit tracking system setup

-- Add missing columns to existing tables if they don't exist
DO $$
BEGIN
    -- Check and add missing columns to purchase_order_item_units
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchase_order_item_units' 
        AND column_name = 'serial_number'
    ) THEN
        ALTER TABLE purchase_order_item_units ADD COLUMN serial_number VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchase_order_item_units' 
        AND column_name = 'batch_number'
    ) THEN
        ALTER TABLE purchase_order_item_units ADD COLUMN batch_number VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchase_order_item_units' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE purchase_order_item_units ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Add missing columns to delivery_item_units if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_item_units' 
        AND column_name = 'serial_number'
    ) THEN
        ALTER TABLE delivery_item_units ADD COLUMN serial_number VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_item_units' 
        AND column_name = 'batch_number'
    ) THEN
        ALTER TABLE delivery_item_units ADD COLUMN batch_number VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_item_units' 
        AND column_name = 'condition_notes'
    ) THEN
        ALTER TABLE delivery_item_units ADD COLUMN condition_notes TEXT;
    END IF;
END $$;

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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraints if they don't exist
DO $$
BEGIN
    -- Add unique constraint for purchase_order_item_units if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'purchase_order_item_units' 
        AND constraint_name = 'purchase_order_item_units_purchase_order_item_id_unit_number_key'
    ) THEN
        ALTER TABLE purchase_order_item_units 
        ADD CONSTRAINT purchase_order_item_units_purchase_order_item_id_unit_number_key 
        UNIQUE(purchase_order_item_id, unit_number);
    END IF;

    -- Add unique constraint for delivery_item_units if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'delivery_item_units' 
        AND constraint_name = 'delivery_item_units_delivery_item_id_unit_number_key'
    ) THEN
        ALTER TABLE delivery_item_units 
        ADD CONSTRAINT delivery_item_units_delivery_item_id_unit_number_key 
        UNIQUE(delivery_item_id, unit_number);
    END IF;

    -- Add unique constraints for unit_delivery_links if not exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'unit_delivery_links' 
        AND constraint_name = 'unit_delivery_links_purchase_order_unit_id_key'
    ) THEN
        ALTER TABLE unit_delivery_links 
        ADD CONSTRAINT unit_delivery_links_purchase_order_unit_id_key 
        UNIQUE(purchase_order_unit_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'unit_delivery_links' 
        AND constraint_name = 'unit_delivery_links_delivery_unit_id_key'
    ) THEN
        ALTER TABLE unit_delivery_links 
        ADD CONSTRAINT unit_delivery_links_delivery_unit_id_key 
        UNIQUE(delivery_unit_id);
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_po_item_units_po_item_id ON purchase_order_item_units(purchase_order_item_id);
CREATE INDEX IF NOT EXISTS idx_po_item_units_status ON purchase_order_item_units(unit_status);
CREATE INDEX IF NOT EXISTS idx_po_item_units_serial ON purchase_order_item_units(serial_number) WHERE serial_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_po_item_units_batch ON purchase_order_item_units(batch_number) WHERE batch_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_delivery_item_units_delivery_item_id ON delivery_item_units(delivery_item_id);
CREATE INDEX IF NOT EXISTS idx_delivery_item_units_status ON delivery_item_units(unit_status);
CREATE INDEX IF NOT EXISTS idx_delivery_item_units_serial ON delivery_item_units(serial_number) WHERE serial_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_delivery_item_units_batch ON delivery_item_units(batch_number) WHERE batch_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_unit_delivery_links_po_unit_id ON unit_delivery_links(purchase_order_unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_delivery_links_delivery_unit_id ON unit_delivery_links(delivery_unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_delivery_links_status ON unit_delivery_links(link_status);

-- Create or replace functions for automatic unit generation
CREATE OR REPLACE FUNCTION generate_purchase_order_units()
RETURNS TRIGGER AS $$
DECLARE
    i INTEGER;
    current_count INTEGER;
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        -- Create individual units for the new quantity
        FOR i IN 1..NEW.quantity LOOP
            INSERT INTO purchase_order_item_units (
                purchase_order_item_id,
                unit_number,
                unit_status
            ) VALUES (
                NEW.id,
                i,
                'ordered'
            ) ON CONFLICT (purchase_order_item_id, unit_number) DO NOTHING;
        END LOOP;
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE
    IF TG_OP = 'UPDATE' AND OLD.quantity != NEW.quantity THEN
        -- Get current count of units
        SELECT COUNT(*) INTO current_count
        FROM purchase_order_item_units
        WHERE purchase_order_item_id = NEW.id;
        
        IF NEW.quantity > current_count THEN
            -- Add new units
            FOR i IN (current_count + 1)..NEW.quantity LOOP
                INSERT INTO purchase_order_item_units (
                    purchase_order_item_id,
                    unit_number,
                    unit_status
                ) VALUES (
                    NEW.id,
                    i,
                    'ordered'
                ) ON CONFLICT (purchase_order_item_id, unit_number) DO NOTHING;
            END LOOP;
        ELSIF NEW.quantity < current_count THEN
            -- Remove units (only if they're not linked)
            DELETE FROM purchase_order_item_units
            WHERE purchase_order_item_id = NEW.id
            AND unit_number > NEW.quantity
            AND id NOT IN (
                SELECT purchase_order_unit_id 
                FROM unit_delivery_links
                WHERE purchase_order_unit_id IS NOT NULL
            );
        END IF;
        RETURN NEW;
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
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        -- Create individual units for the new quantity
        FOR i IN 1..NEW.quantity_delivered LOOP
            INSERT INTO delivery_item_units (
                delivery_item_id,
                unit_number,
                unit_status
            ) VALUES (
                NEW.id,
                i,
                'delivered'
            ) ON CONFLICT (delivery_item_id, unit_number) DO NOTHING;
        END LOOP;
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE
    IF TG_OP = 'UPDATE' AND OLD.quantity_delivered != NEW.quantity_delivered THEN
        -- Get current count of units
        SELECT COUNT(*) INTO current_count
        FROM delivery_item_units
        WHERE delivery_item_id = NEW.id;
        
        IF NEW.quantity_delivered > current_count THEN
            -- Add new units
            FOR i IN (current_count + 1)..NEW.quantity_delivered LOOP
                INSERT INTO delivery_item_units (
                    delivery_item_id,
                    unit_number,
                    unit_status
                ) VALUES (
                    NEW.id,
                    i,
                    'delivered'
                ) ON CONFLICT (delivery_item_id, unit_number) DO NOTHING;
            END LOOP;
        ELSIF NEW.quantity_delivered < current_count THEN
            -- Remove units (only if they're not linked)
            DELETE FROM delivery_item_units
            WHERE delivery_item_id = NEW.id
            AND unit_number > NEW.quantity_delivered
            AND id NOT IN (
                SELECT delivery_unit_id 
                FROM unit_delivery_links
                WHERE delivery_unit_id IS NOT NULL
            );
        END IF;
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers if they don't exist
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
        -- Update both units to linked status
        UPDATE purchase_order_item_units 
        SET unit_status = 'linked', updated_at = NOW()
        WHERE id = NEW.purchase_order_unit_id;
        
        UPDATE delivery_item_units 
        SET unit_status = 'linked', updated_at = NOW()
        WHERE id = NEW.delivery_unit_id;
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        -- Reset units to their previous status
        UPDATE purchase_order_item_units 
        SET unit_status = 'ordered', updated_at = NOW()
        WHERE id = OLD.purchase_order_unit_id;
        
        UPDATE delivery_item_units 
        SET unit_status = 'delivered', updated_at = NOW()
        WHERE id = OLD.delivery_unit_id;
        
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

-- Add updated_at triggers if they don't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_po_item_units_updated_at ON purchase_order_item_units;
CREATE TRIGGER update_po_item_units_updated_at 
    BEFORE UPDATE ON purchase_order_item_units 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_delivery_item_units_updated_at ON delivery_item_units;
CREATE TRIGGER update_delivery_item_units_updated_at 
    BEFORE UPDATE ON delivery_item_units 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_unit_delivery_links_updated_at ON unit_delivery_links;
CREATE TRIGGER update_unit_delivery_links_updated_at 
    BEFORE UPDATE ON unit_delivery_links 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migration completed successfully
DO $$
BEGIN
    RAISE NOTICE 'Unit tracking table updates completed successfully!';
END $$;