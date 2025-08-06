-- Migration: Populate unit tracking tables with existing data
-- Purpose: Create individual units for all existing purchase order items and delivery items

-- Populate purchase_order_item_units for existing purchase order items
DO $$
DECLARE
    po_item RECORD;
    i INTEGER;
BEGIN
    -- Loop through all existing purchase order items
    FOR po_item IN SELECT id, quantity FROM purchase_order_items LOOP
        -- Create individual units for each quantity
        FOR i IN 1..po_item.quantity LOOP
            INSERT INTO purchase_order_item_units (
                purchase_order_item_id,
                unit_number,
                unit_status,
                created_at,
                updated_at
            ) VALUES (
                po_item.id,
                i,
                'ordered', -- Default status for existing items
                NOW(),
                NOW()
            );
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Populated purchase_order_item_units with % total units', 
        (SELECT SUM(quantity) FROM purchase_order_items);
END $$;

-- Populate delivery_item_units for existing delivery items
DO $$
DECLARE
    delivery_item RECORD;
    i INTEGER;
BEGIN
    -- Loop through all existing delivery items
    FOR delivery_item IN SELECT id, quantity_delivered FROM delivery_items LOOP
        -- Create individual units for each quantity delivered
        FOR i IN 1..delivery_item.quantity_delivered LOOP
            INSERT INTO delivery_item_units (
                delivery_item_id,
                unit_number,
                unit_status,
                created_at,
                updated_at
            ) VALUES (
                delivery_item.id,
                i,
                'delivered', -- Default status for existing items
                NOW(),
                NOW()
            );
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Populated delivery_item_units with % total units', 
        (SELECT SUM(quantity_delivered) FROM delivery_items);
END $$;

-- Create unit-level links based on existing bulk delivery_item_links
-- This migration attempts to map existing bulk links to individual units
DO $$
DECLARE
    bulk_link RECORD;
    po_unit RECORD;
    delivery_unit RECORD;
    linked_count INTEGER := 0;
    remaining_quantity INTEGER;
BEGIN
    -- Loop through all existing bulk delivery item links
    FOR bulk_link IN 
        SELECT 
            dil.id,
            dil.delivery_item_id,
            dil.purchase_order_item_id,
            dil.linked_quantity,
            dil.created_at
        FROM delivery_item_links dil
        ORDER BY dil.created_at
    LOOP
        remaining_quantity := bulk_link.linked_quantity;
        linked_count := 0;
        
        -- Get available PO units (not yet linked)
        FOR po_unit IN 
            SELECT pou.id
            FROM purchase_order_item_units pou
            WHERE pou.purchase_order_item_id = bulk_link.purchase_order_item_id
            AND pou.unit_status = 'ordered'
            AND pou.id NOT IN (
                SELECT purchase_order_unit_id 
                FROM unit_delivery_links 
                WHERE purchase_order_unit_id IS NOT NULL
            )
            ORDER BY pou.unit_number
            LIMIT remaining_quantity
        LOOP
            -- Get next available delivery unit (not yet linked)
            SELECT du.id INTO delivery_unit
            FROM delivery_item_units du
            WHERE du.delivery_item_id = bulk_link.delivery_item_id
            AND du.unit_status = 'delivered'
            AND du.id NOT IN (
                SELECT delivery_unit_id 
                FROM unit_delivery_links 
                WHERE delivery_unit_id IS NOT NULL
            )
            ORDER BY du.unit_number
            LIMIT 1;
            
            -- Create the unit-to-unit link if we found both units
            IF delivery_unit.id IS NOT NULL THEN
                INSERT INTO unit_delivery_links (
                    purchase_order_unit_id,
                    delivery_unit_id,
                    link_status,
                    linked_at,
                    notes,
                    created_at,
                    updated_at
                ) VALUES (
                    po_unit.id,
                    delivery_unit.id,
                    'linked',
                    bulk_link.created_at,
                    'Migrated from bulk link #' || bulk_link.id,
                    bulk_link.created_at,
                    NOW()
                );
                
                linked_count := linked_count + 1;
                remaining_quantity := remaining_quantity - 1;
                
                -- Exit if we've linked all the required quantity
                IF remaining_quantity <= 0 THEN
                    EXIT;
                END IF;
            END IF;
        END LOOP;
        
        RAISE NOTICE 'Migrated bulk link % - linked % of % units', 
            bulk_link.id, linked_count, bulk_link.linked_quantity;
    END LOOP;
    
    RAISE NOTICE 'Migration complete. Created % individual unit links from % bulk links',
        (SELECT COUNT(*) FROM unit_delivery_links),
        (SELECT COUNT(*) FROM delivery_item_links);
END $$;

-- Update unit statuses based on the new links (this will be handled by triggers going forward)
UPDATE purchase_order_item_units 
SET unit_status = 'linked', updated_at = NOW()
WHERE id IN (
    SELECT purchase_order_unit_id 
    FROM unit_delivery_links
);

UPDATE delivery_item_units 
SET unit_status = 'linked', updated_at = NOW()
WHERE id IN (
    SELECT delivery_unit_id 
    FROM unit_delivery_links
);

-- Add verification queries
DO $$
DECLARE
    po_units_count INTEGER;
    delivery_units_count INTEGER;
    unit_links_count INTEGER;
    bulk_links_count INTEGER;
    total_po_quantity INTEGER;
    total_delivery_quantity INTEGER;
BEGIN
    SELECT COUNT(*) INTO po_units_count FROM purchase_order_item_units;
    SELECT COUNT(*) INTO delivery_units_count FROM delivery_item_units;
    SELECT COUNT(*) INTO unit_links_count FROM unit_delivery_links;
    SELECT COUNT(*) INTO bulk_links_count FROM delivery_item_links;
    SELECT SUM(quantity) INTO total_po_quantity FROM purchase_order_items;
    SELECT SUM(quantity_delivered) INTO total_delivery_quantity FROM delivery_items;
    
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '  Purchase Order Units: % (should equal total PO quantity: %)', 
        po_units_count, total_po_quantity;
    RAISE NOTICE '  Delivery Units: % (should equal total delivery quantity: %)', 
        delivery_units_count, total_delivery_quantity;
    RAISE NOTICE '  Unit-to-Unit Links: %', unit_links_count;
    RAISE NOTICE '  Original Bulk Links: %', bulk_links_count;
    
    -- Verify no orphaned links
    IF po_units_count != total_po_quantity THEN
        RAISE WARNING 'Mismatch in PO units count!';
    END IF;
    
    IF delivery_units_count != total_delivery_quantity THEN
        RAISE WARNING 'Mismatch in delivery units count!';
    END IF;
END $$;