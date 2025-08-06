-- Debug authentication context
SELECT 
    auth.uid() as user_id,
    auth.role() as user_role,
    auth.jwt() as jwt_claims;

-- Drop ALL existing policies for clean slate
DROP POLICY IF EXISTS "Enable all operations for authenticated users on deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Enable all operations for authenticated users on delivery_items" ON public.delivery_items;
DROP POLICY IF EXISTS "deliveries_policy" ON public.deliveries;
DROP POLICY IF EXISTS "delivery_items_policy" ON public.delivery_items;
DROP POLICY IF EXISTS "Allow authenticated users full access to deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Allow authenticated users full access to delivery_items" ON public.delivery_items;
DROP POLICY IF EXISTS "deliveries_authenticated_access" ON public.deliveries;
DROP POLICY IF EXISTS "delivery_items_authenticated_access" ON public.delivery_items;
DROP POLICY IF EXISTS "deliveries_uid_access" ON public.deliveries;
DROP POLICY IF EXISTS "delivery_items_uid_access" ON public.delivery_items;
DROP POLICY IF EXISTS "allow_all_deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "allow_all_delivery_items" ON public.delivery_items;

-- Ensure RLS is enabled
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_items ENABLE ROW LEVEL SECURITY;

-- Create single, simple policy using auth.role() check
CREATE POLICY "deliveries_simple_auth" 
ON public.deliveries 
FOR ALL 
USING (auth.role() = 'authenticated') 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "delivery_items_simple_auth" 
ON public.delivery_items 
FOR ALL 
USING (auth.role() = 'authenticated') 
WITH CHECK (auth.role() = 'authenticated');

-- Grant necessary permissions to authenticated role
GRANT ALL ON public.deliveries TO authenticated;
GRANT ALL ON public.delivery_items TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verify policies are active
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('deliveries', 'delivery_items')
ORDER BY tablename, policyname;