-- Fix missing unit generation triggers
-- This script recreates the triggers that should automatically generate individual unit records

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

-- Drop existing triggers if they exist and recreate them
DROP TRIGGER IF EXISTS trigger_generate_purchase_order_units ON purchase_order_items;
CREATE TRIGGER trigger_generate_purchase_order_units
    AFTER INSERT OR UPDATE ON purchase_order_items
    FOR EACH ROW EXECUTE FUNCTION generate_purchase_order_units();

DROP TRIGGER IF EXISTS trigger_generate_delivery_units ON delivery_items;
CREATE TRIGGER trigger_generate_delivery_units
    AFTER INSERT OR UPDATE ON delivery_items  
    FOR EACH ROW EXECUTE FUNCTION generate_delivery_units();

-- Now populate existing records that don't have units
-- Generate units for existing purchase order items
INSERT INTO purchase_order_item_units (purchase_order_item_id, unit_number, unit_status)
SELECT 
    poi.id,
    generate_series(1, poi.quantity) as unit_number,
    'ordered' as unit_status
FROM purchase_order_items poi
WHERE poi.id NOT IN (
    SELECT DISTINCT purchase_order_item_id 
    FROM purchase_order_item_units 
    WHERE purchase_order_item_id IS NOT NULL
);

-- Generate units for existing delivery items  
INSERT INTO delivery_item_units (delivery_item_id, unit_number, unit_status)
SELECT 
    di.id,
    generate_series(1, di.quantity_delivered) as unit_number,
    'delivered' as unit_status
FROM delivery_items di
WHERE di.id NOT IN (
    SELECT DISTINCT delivery_item_id
    FROM delivery_item_units
    WHERE delivery_item_id IS NOT NULL
);

-- Verification queries
SELECT 'Verification - PO Items vs Units' as info;
SELECT 
    poi.id,
    poi.quantity as expected_units,
    COUNT(pou.id) as actual_units,
    CASE WHEN poi.quantity = COUNT(pou.id) THEN 'OK' ELSE 'MISMATCH' END as status
FROM purchase_order_items poi
LEFT JOIN purchase_order_item_units pou ON poi.id = pou.purchase_order_item_id
GROUP BY poi.id, poi.quantity
ORDER BY poi.id
LIMIT 10;

SELECT 'Verification - Delivery Items vs Units' as info;
SELECT 
    di.id,
    di.quantity_delivered as expected_units,
    COUNT(diu.id) as actual_units,
    CASE WHEN di.quantity_delivered = COUNT(diu.id) THEN 'OK' ELSE 'MISMATCH' END as status
FROM delivery_items di
LEFT JOIN delivery_item_units diu ON di.id = diu.delivery_item_id
GROUP BY di.id, di.quantity_delivered
ORDER BY di.id
LIMIT 10;