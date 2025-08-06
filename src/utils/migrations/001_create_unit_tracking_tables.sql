-- Migration: Create unit-level tracking tables for purchase orders and deliveries
-- Purpose: Enable granular tracking of individual units through the order-to-delivery lifecycle

-- Create table for tracking individual purchase order item units
CREATE TABLE purchase_order_item_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_item_id UUID NOT NULL REFERENCES purchase_order_items(id) ON DELETE CASCADE,
    unit_number INTEGER NOT NULL,
    serial_number VARCHAR(255), -- Optional serial number for trackable items
    batch_number VARCHAR(255), -- Optional batch number for batch-tracked items
    unit_status VARCHAR(50) NOT NULL DEFAULT 'ordered',
    -- Possible statuses: 'ordered', 'delivered', 'linked', 'received', 'rejected'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique unit numbers within each purchase order item
    UNIQUE(purchase_order_item_id, unit_number)
);

-- Create table for tracking individual delivery item units
CREATE TABLE delivery_item_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_item_id UUID NOT NULL REFERENCES delivery_items(id) ON DELETE CASCADE,
    unit_number INTEGER NOT NULL,
    serial_number VARCHAR(255), -- Should match PO unit if linked
    batch_number VARCHAR(255), -- Should match PO unit if linked
    unit_status VARCHAR(50) NOT NULL DEFAULT 'delivered',
    -- Possible statuses: 'delivered', 'linked', 'received', 'damaged', 'returned'
    condition_notes TEXT, -- Notes about the physical condition of the unit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique unit numbers within each delivery item
    UNIQUE(delivery_item_id, unit_number)
);

-- Create enhanced linking table for unit-to-unit relationships
CREATE TABLE unit_delivery_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_unit_id UUID NOT NULL REFERENCES purchase_order_item_units(id) ON DELETE CASCADE,
    delivery_unit_id UUID NOT NULL REFERENCES delivery_item_units(id) ON DELETE CASCADE,
    link_status VARCHAR(50) NOT NULL DEFAULT 'linked',
    -- Possible statuses: 'linked', 'confirmed', 'disputed', 'rejected'
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    confirmed_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one-to-one relationship (each unit can only be linked once)
    UNIQUE(purchase_order_unit_id),
    UNIQUE(delivery_unit_id)
);

-- Create indexes for performance
CREATE INDEX idx_po_item_units_po_item_id ON purchase_order_item_units(purchase_order_item_id);
CREATE INDEX idx_po_item_units_status ON purchase_order_item_units(unit_status);
CREATE INDEX idx_po_item_units_serial ON purchase_order_item_units(serial_number) WHERE serial_number IS NOT NULL;
CREATE INDEX idx_po_item_units_batch ON purchase_order_item_units(batch_number) WHERE batch_number IS NOT NULL;

CREATE INDEX idx_delivery_item_units_delivery_item_id ON delivery_item_units(delivery_item_id);
CREATE INDEX idx_delivery_item_units_status ON delivery_item_units(unit_status);
CREATE INDEX idx_delivery_item_units_serial ON delivery_item_units(serial_number) WHERE serial_number IS NOT NULL;
CREATE INDEX idx_delivery_item_units_batch ON delivery_item_units(batch_number) WHERE batch_number IS NOT NULL;

CREATE INDEX idx_unit_delivery_links_po_unit_id ON unit_delivery_links(purchase_order_unit_id);
CREATE INDEX idx_unit_delivery_links_delivery_unit_id ON unit_delivery_links(delivery_unit_id);
CREATE INDEX idx_unit_delivery_links_status ON unit_delivery_links(link_status);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_po_item_units_updated_at 
    BEFORE UPDATE ON purchase_order_item_units 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_item_units_updated_at 
    BEFORE UPDATE ON delivery_item_units 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unit_delivery_links_updated_at 
    BEFORE UPDATE ON unit_delivery_links 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create functions for automatic unit generation

-- Function to automatically create units when purchase order items are created/updated
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
            );
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
                );
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

-- Function to automatically create units when delivery items are created/updated
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
            );
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
                );
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

-- Create triggers for automatic unit generation
CREATE TRIGGER trigger_generate_purchase_order_units
    AFTER INSERT OR UPDATE ON purchase_order_items
    FOR EACH ROW EXECUTE FUNCTION generate_purchase_order_units();

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
CREATE TRIGGER trigger_sync_unit_link_status
    AFTER INSERT OR DELETE ON unit_delivery_links
    FOR EACH ROW EXECUTE FUNCTION sync_unit_link_status();

-- Add comments for documentation
COMMENT ON TABLE purchase_order_item_units IS 'Individual units from purchase order items for granular tracking';
COMMENT ON TABLE delivery_item_units IS 'Individual units from delivery items for granular tracking';
COMMENT ON TABLE unit_delivery_links IS 'Links between individual purchase order units and delivery units';

COMMENT ON COLUMN purchase_order_item_units.unit_number IS 'Sequential number of this unit within the purchase order item (1, 2, 3, etc.)';
COMMENT ON COLUMN delivery_item_units.unit_number IS 'Sequential number of this unit within the delivery item (1, 2, 3, etc.)';
COMMENT ON COLUMN unit_delivery_links.link_status IS 'Status of the link: linked, confirmed, disputed, rejected';