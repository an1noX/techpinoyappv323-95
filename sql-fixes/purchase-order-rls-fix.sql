-- =============================================
-- PURCHASE ORDER RLS FIX - SUPABASE SELF-HOSTED
-- Execute this in Supabase SQL Editor
-- =============================================

-- 1. Enable RLS on all purchase order related tables
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_records ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "purchase_orders_select_policy" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_insert_policy" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_update_policy" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_delete_policy" ON public.purchase_orders;

DROP POLICY IF EXISTS "purchase_order_items_select_policy" ON public.purchase_order_items;
DROP POLICY IF EXISTS "purchase_order_items_insert_policy" ON public.purchase_order_items;
DROP POLICY IF EXISTS "purchase_order_items_update_policy" ON public.purchase_order_items;
DROP POLICY IF EXISTS "purchase_order_items_delete_policy" ON public.purchase_order_items;

DROP POLICY IF EXISTS "transaction_records_select_policy" ON public.transaction_records;
DROP POLICY IF EXISTS "transaction_records_insert_policy" ON public.transaction_records;
DROP POLICY IF EXISTS "transaction_records_update_policy" ON public.transaction_records;
DROP POLICY IF EXISTS "transaction_records_delete_policy" ON public.transaction_records;

-- 3. Create new permissive policies for purchase_orders
CREATE POLICY "purchase_orders_select_policy" ON public.purchase_orders
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "purchase_orders_insert_policy" ON public.purchase_orders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "purchase_orders_update_policy" ON public.purchase_orders
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "purchase_orders_delete_policy" ON public.purchase_orders
    FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Create new permissive policies for purchase_order_items
CREATE POLICY "purchase_order_items_select_policy" ON public.purchase_order_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "purchase_order_items_insert_policy" ON public.purchase_order_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "purchase_order_items_update_policy" ON public.purchase_order_items
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "purchase_order_items_delete_policy" ON public.purchase_order_items
    FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Create new permissive policies for transaction_records
CREATE POLICY "transaction_records_select_policy" ON public.transaction_records
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "transaction_records_insert_policy" ON public.transaction_records
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "transaction_records_update_policy" ON public.transaction_records
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "transaction_records_delete_policy" ON public.transaction_records
    FOR DELETE USING (auth.role() = 'authenticated');

-- 6. Grant necessary permissions to authenticated role
GRANT ALL ON public.purchase_orders TO authenticated;
GRANT ALL ON public.purchase_order_items TO authenticated;
GRANT ALL ON public.transaction_records TO authenticated;

-- 7. Grant usage on sequences if they exist
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 8. Verify the setup
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('purchase_orders', 'purchase_order_items', 'transaction_records')
ORDER BY tablename, policyname;

-- Success message
SELECT 'Purchase Order RLS policies have been successfully configured!' as status;