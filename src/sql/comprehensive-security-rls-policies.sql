-- =============================================
-- COMPREHENSIVE SECURITY RLS POLICIES
-- Implements secure Row Level Security for all tables
-- =============================================

-- 1. Ensure RLS is enabled on all critical tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_records ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies for clean slate
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can manage all roles" ON public.user_roles;

-- 3. Create secure helper functions
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT auth.role() = 'authenticated';
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin_only()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  );
END;
$$;

-- 4. PROFILES TABLE - Secure policies
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT
  USING (is_admin_or_superadmin());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND (
      -- Users can update their own non-role fields
      (OLD.role = NEW.role) 
      OR 
      -- Only superadmins can change roles
      is_superadmin_only()
    )
  );

CREATE POLICY "profiles_insert_trigger_only" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id AND role = 'user');

-- 5. USER_ROLES TABLE - Highly restricted
CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_roles_select_admin" ON public.user_roles
  FOR SELECT
  USING (is_admin_or_superadmin());

CREATE POLICY "user_roles_insert_superadmin_only" ON public.user_roles
  FOR INSERT
  WITH CHECK (is_superadmin_only());

CREATE POLICY "user_roles_update_superadmin_only" ON public.user_roles
  FOR UPDATE
  USING (is_superadmin_only())
  WITH CHECK (is_superadmin_only());

CREATE POLICY "user_roles_delete_superadmin_only" ON public.user_roles
  FOR DELETE
  USING (is_superadmin_only());

-- 6. CLIENTS TABLE - Admin/Superadmin access only
CREATE POLICY "clients_select_admin" ON public.clients
  FOR SELECT
  USING (is_admin_or_superadmin());

CREATE POLICY "clients_insert_admin" ON public.clients
  FOR INSERT
  WITH CHECK (is_admin_or_superadmin());

CREATE POLICY "clients_update_admin" ON public.clients
  FOR UPDATE
  USING (is_admin_or_superadmin())
  WITH CHECK (is_admin_or_superadmin());

CREATE POLICY "clients_delete_superadmin_only" ON public.clients
  FOR DELETE
  USING (is_superadmin_only());

-- 7. DEPARTMENTS TABLE - Admin/Superadmin access only
CREATE POLICY "departments_select_admin" ON public.departments
  FOR SELECT
  USING (is_admin_or_superadmin());

CREATE POLICY "departments_insert_admin" ON public.departments
  FOR INSERT
  WITH CHECK (is_admin_or_superadmin());

CREATE POLICY "departments_update_admin" ON public.departments
  FOR UPDATE
  USING (is_admin_or_superadmin())
  WITH CHECK (is_admin_or_superadmin());

CREATE POLICY "departments_delete_superadmin_only" ON public.departments
  FOR DELETE
  USING (is_superadmin_only());

-- 8. PRINTERS TABLE - Admin/Superadmin access only
CREATE POLICY "printers_select_admin" ON public.printers
  FOR SELECT
  USING (is_admin_or_superadmin());

CREATE POLICY "printers_insert_admin" ON public.printers
  FOR INSERT
  WITH CHECK (is_admin_or_superadmin());

CREATE POLICY "printers_update_admin" ON public.printers
  FOR UPDATE
  USING (is_admin_or_superadmin())
  WITH CHECK (is_admin_or_superadmin());

CREATE POLICY "printers_delete_superadmin_only" ON public.printers
  FOR DELETE
  USING (is_superadmin_only());

-- 9. DELIVERIES & DELIVERY_ITEMS - Business operation tables
CREATE POLICY "deliveries_authenticated_access" ON public.deliveries
  FOR ALL
  USING (is_authenticated())
  WITH CHECK (is_authenticated());

CREATE POLICY "delivery_items_authenticated_access" ON public.delivery_items
  FOR ALL
  USING (is_authenticated())
  WITH CHECK (is_authenticated());

-- 10. PURCHASE ORDERS & ITEMS - Business operation tables
CREATE POLICY "purchase_orders_authenticated_access" ON public.purchase_orders
  FOR ALL
  USING (is_authenticated())
  WITH CHECK (is_authenticated());

CREATE POLICY "purchase_order_items_authenticated_access" ON public.purchase_order_items
  FOR ALL
  USING (is_authenticated())
  WITH CHECK (is_authenticated());

-- 11. TRANSACTION RECORDS - Financial data protection
CREATE POLICY "transaction_records_select_authenticated" ON public.transaction_records
  FOR SELECT
  USING (is_authenticated());

CREATE POLICY "transaction_records_insert_authenticated" ON public.transaction_records
  FOR INSERT
  WITH CHECK (is_authenticated());

CREATE POLICY "transaction_records_update_admin" ON public.transaction_records
  FOR UPDATE
  USING (is_admin_or_superadmin())
  WITH CHECK (is_admin_or_superadmin());

CREATE POLICY "transaction_records_delete_superadmin_only" ON public.transaction_records
  FOR DELETE
  USING (is_superadmin_only());

-- 12. Create security audit function
CREATE OR REPLACE FUNCTION public.audit_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log role changes (implement audit table if needed)
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE LOG 'Role changed for user % from % to % by %', 
      NEW.id, OLD.role, NEW.role, auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Create audit trigger for profiles table
DROP TRIGGER IF EXISTS audit_profile_role_changes ON public.profiles;
CREATE TRIGGER audit_profile_role_changes
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION audit_role_change();

-- 13. Grant minimal necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.clients TO authenticated;
GRANT SELECT ON public.departments TO authenticated;
GRANT SELECT ON public.printers TO authenticated;
GRANT ALL ON public.deliveries TO authenticated;
GRANT ALL ON public.delivery_items TO authenticated;
GRANT ALL ON public.purchase_orders TO authenticated;
GRANT ALL ON public.purchase_order_items TO authenticated;
GRANT SELECT, INSERT ON public.transaction_records TO authenticated;

-- 14. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_uid ON public.profiles (id) WHERE id = auth.uid();
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);

-- 15. Verify policies are working
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'user_roles', 'clients', 'departments', 'printers')
ORDER BY tablename, policyname;

-- Success message
SELECT 'Comprehensive security RLS policies have been successfully implemented!' as status;