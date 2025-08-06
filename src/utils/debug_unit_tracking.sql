-- Debug script to check current database state and unit generation
-- Run this to see what's actually happening with your data

-- Check current table structures
SELECT 'purchase_order_item_units structure' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'purchase_order_item_units';

SELECT 'delivery_item_units structure' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'delivery_item_units';

-- Check if triggers exist
SELECT 'Checking triggers' as info;
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%unit%';

-- Sample the actual data to see the problem
SELECT 'Sample purchase_order_items (bulk records)' as info;
SELECT poi.id, poi.quantity, COUNT(pou.id) as unit_count
FROM purchase_order_items poi
LEFT JOIN purchase_order_item_units pou ON poi.id = pou.purchase_order_item_id
GROUP BY poi.id, poi.quantity
LIMIT 5;

SELECT 'Sample delivery_items (bulk records)' as info;
SELECT di.id, di.quantity_delivered, COUNT(diu.id) as unit_count
FROM delivery_items di
LEFT JOIN delivery_item_units diu ON di.id = diu.delivery_item_id
GROUP BY di.id, di.quantity_delivered
LIMIT 5;

-- Check if any unit records exist at all
SELECT 'Unit record counts' as info;
SELECT 
  (SELECT COUNT(*) FROM purchase_order_item_units) as po_units,
  (SELECT COUNT(*) FROM delivery_item_units) as delivery_units,
  (SELECT COUNT(*) FROM unit_delivery_links) as unit_links;

-- Check for mismatched data (this is likely the problem)
SELECT 'Mismatched quantities (bulk vs units)' as info;
SELECT 
  poi.id,
  poi.quantity as bulk_quantity,
  COUNT(pou.id) as unit_count,
  CASE 
    WHEN poi.quantity != COUNT(pou.id) THEN 'MISMATCH' 
    ELSE 'OK' 
  END as status
FROM purchase_order_items poi
LEFT JOIN purchase_order_item_units pou ON poi.id = pou.purchase_order_item_id
GROUP BY poi.id, poi.quantity
HAVING poi.quantity != COUNT(pou.id)
LIMIT 10;