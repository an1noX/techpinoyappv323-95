-- Migration: Populate unit data for existing purchase orders and deliveries
-- Purpose: Create individual unit records for all existing items (safe to run multiple times)

-- Populate purchase_order_item_units for existing items (with conflict handling)
DO $$
DECLARE
    po_item RECORD;
    i INTEGER;
    existing_count INTEGER;
BEGIN
    RAISE NOTICE 'Starting population of purchase_order_item_units...';
    
    FOR po_item IN SELECT id, quantity FROM purchase_order_items LOOP
        -- Check how many units already exist for this item
        SELECT COUNT(*) INTO existing_count
        FROM purchase_order_item_units 
        WHERE purchase_order_item_id = po_item.id;
        
        -- Only create units if we don't have enough
        IF existing_count < po_item.quantity THEN
            FOR i IN (existing_count + 1)..po_item.quantity LOOP
                INSERT INTO purchase_order_item_units (
                    purchase_order_item_id,
                    unit_number,
                    unit_status,
                    created_at,
                    updated_at
                ) VALUES (
                    po_item.id,
                    i,
                    'ordered',
                    NOW(),
                    NOW()
                ) ON CONFLICT (purchase_order_item_id, unit_number) DO NOTHING;
            END LOOP;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Completed purchase_order_item_units population. Total units: %', 
        (SELECT COUNT(*) FROM purchase_order_item_units);
END $$;

-- Populate delivery_item_units for existing items (with conflict handling)
DO $$
DECLARE
    delivery_item RECORD;
    i INTEGER;
    existing_count INTEGER;
BEGIN
    RAISE NOTICE 'Starting population of delivery_item_units...';
    
    FOR delivery_item IN SELECT id, quantity_delivered FROM delivery_items LOOP
        -- Check how many units already exist for this item
        SELECT COUNT(*) INTO existing_count
        FROM delivery_item_units 
        WHERE delivery_item_id = delivery_item.id;
        
        -- Only create units if we don't have enough
        IF existing_count < delivery_item.quantity_delivered THEN
            FOR i IN (existing_count + 1)..delivery_item.quantity_delivered LOOP
                INSERT INTO delivery_item_units (
                    delivery_item_id,
                    unit_number,
                    unit_status,
                    created_at,
                    updated_at
                ) VALUES (
                    delivery_item.id,
                    i,
                    'delivered',
                    NOW(),
                    NOW()
                ) ON CONFLICT (delivery_item_id, unit_number) DO NOTHING;
            END LOOP;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Completed delivery_item_units population. Total units: %', 
        (SELECT COUNT(*) FROM delivery_item_units);
END $$;

-- Create unit-level links based on existing bulk delivery_item_links (safe to run multiple times)
DO $$
DECLARE
    bulk_link RECORD;
    po_unit RECORD;
    delivery_unit RECORD;
    linked_count INTEGER := 0;
    remaining_quantity INTEGER;
    units_to_link INTEGER;
BEGIN
    RAISE NOTICE 'Starting conversion of bulk links to unit links...';
    
    -- Only process bulk links that haven't been converted yet
    FOR bulk_link IN 
        SELECT 
            dil.id,
            dil.delivery_item_id,
            dil.purchase_order_item_id,
            dil.linked_quantity,
            dil.created_at
        FROM delivery_item_links dil
        WHERE NOT EXISTS (
            -- Check if this bulk link has already been converted
            SELECT 1 FROM unit_delivery_links udl
            JOIN purchase_order_item_units pou ON udl.purchase_order_unit_id = pou.id
            JOIN delivery_item_units du ON udl.delivery_unit_id = du.id
            WHERE pou.purchase_order_item_id = dil.purchase_order_item_id
            AND du.delivery_item_id = dil.delivery_item_id
            AND udl.notes LIKE '%bulk link #' || dil.id || '%'
        )
        ORDER BY dil.created_at
    LOOP
        remaining_quantity := bulk_link.linked_quantity;
        linked_count := 0;
        
        -- Get available PO units (not yet linked) for this specific purchase order item
        FOR po_unit IN 
            SELECT pou.id, pou.unit_number
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
            -- Get next available delivery unit (not yet linked) for this specific delivery item
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
                ) ON CONFLICT (purchase_order_unit_id) DO NOTHING;
                
                -- Check if the insert was successful (not a conflict)
                GET DIAGNOSTICS units_to_link = ROW_COUNT;
                IF units_to_link > 0 THEN
                    linked_count := linked_count + 1;
                    remaining_quantity := remaining_quantity - 1;
                    
                    -- Exit if we've linked all the required quantity
                    IF remaining_quantity <= 0 THEN
                        EXIT;
                    END IF;
                END IF;
            ELSE
                -- No more available delivery units
                EXIT;
            END IF;
        END LOOP;
        
        RAISE NOTICE 'Processed bulk link % - linked % of % units', 
            bulk_link.id, linked_count, bulk_link.linked_quantity;
    END LOOP;
    
    RAISE NOTICE 'Migration complete. Total unit links: %',
        (SELECT COUNT(*) FROM unit_delivery_links);
END $$;

-- Update unit statuses based on the new links
UPDATE purchase_order_item_units 
SET unit_status = 'linked', updated_at = NOW()
WHERE id IN (
    SELECT purchase_order_unit_id 
    FROM unit_delivery_links
    WHERE purchase_order_unit_id IS NOT NULL
);

UPDATE delivery_item_units 
SET unit_status = 'linked', updated_at = NOW()
WHERE id IN (
    SELECT delivery_unit_id 
    FROM unit_delivery_links
    WHERE delivery_unit_id IS NOT NULL
);

-- Final verification and summary
DO $$
DECLARE
    po_units_count INTEGER;
    delivery_units_count INTEGER;
    unit_links_count INTEGER;
    bulk_links_count INTEGER;
    total_po_quantity INTEGER;
    total_delivery_quantity INTEGER;
    po_coverage DECIMAL;
    delivery_coverage DECIMAL;
BEGIN
    SELECT COUNT(*) INTO po_units_count FROM purchase_order_item_units;
    SELECT COUNT(*) INTO delivery_units_count FROM delivery_item_units;
    SELECT COUNT(*) INTO unit_links_count FROM unit_delivery_links;
    SELECT COUNT(*) INTO bulk_links_count FROM delivery_item_links;
    SELECT COALESCE(SUM(quantity), 0) INTO total_po_quantity FROM purchase_order_items;
    SELECT COALESCE(SUM(quantity_delivered), 0) INTO total_delivery_quantity FROM delivery_items;
    
    -- Calculate coverage percentages
    IF total_po_quantity > 0 THEN
        po_coverage := (po_units_count::DECIMAL / total_po_quantity::DECIMAL) * 100;
    ELSE
        po_coverage := 100;
    END IF;
    
    IF total_delivery_quantity > 0 THEN
        delivery_coverage := (delivery_units_count::DECIMAL / total_delivery_quantity::DECIMAL) * 100;
    ELSE
        delivery_coverage := 100;
    END IF;
    
    RAISE NOTICE '=== MIGRATION SUMMARY ===';
    RAISE NOTICE 'Purchase Order Units: % (%.1f%% coverage)', po_units_count, po_coverage;
    RAISE NOTICE 'Delivery Units: % (%.1f%% coverage)', delivery_units_count, delivery_coverage;
    RAISE NOTICE 'Unit-to-Unit Links: %', unit_links_count;
    RAISE NOTICE 'Original Bulk Links: %', bulk_links_count;
    
    -- Health checks
    IF po_coverage < 100 THEN
        RAISE WARNING 'Incomplete PO unit coverage! Expected %, got %', total_po_quantity, po_units_count;
    END IF;
    
    IF delivery_coverage < 100 THEN
        RAISE WARNING 'Incomplete delivery unit coverage! Expected %, got %', total_delivery_quantity, delivery_units_count;
    END IF;
    
    RAISE NOTICE 'Unit tracking data population completed successfully!';
END $$;