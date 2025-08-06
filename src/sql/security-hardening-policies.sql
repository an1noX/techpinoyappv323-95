-- =============================================
-- SECURITY HARDENING POLICIES
-- Additional security measures and policy refinements
-- =============================================

-- 1. Drop any overly permissive policies that might exist
DROP POLICY IF EXISTS "Allow all authenticated users" ON public.deliveries;
DROP POLICY IF EXISTS "Allow all authenticated users" ON public.delivery_items;
DROP POLICY IF EXISTS "Allow all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.user_roles;

-- 2. Create stricter profile access policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;

CREATE POLICY "profiles_select_strict" ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- 3. Enhance user_roles security with additional checks
DROP POLICY IF EXISTS "user_roles_insert_superadmin_only" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_superadmin_only" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_superadmin_only" ON public.user_roles;

CREATE POLICY "user_roles_insert_verified_superadmin" ON public.user_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
      AND id != NEW.user_id -- Prevent self-modification
    )
  );

CREATE POLICY "user_roles_update_verified_superadmin" ON public.user_roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
      AND id != user_id -- Prevent self-modification
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
      AND id != user_id -- Prevent self-modification
    )
  );

CREATE POLICY "user_roles_delete_verified_superadmin" ON public.user_roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
      AND id != user_id -- Prevent self-modification
    )
  );

-- 4. Add client data isolation by user role
DROP POLICY IF EXISTS "clients_select_admin" ON public.clients;
CREATE POLICY "clients_select_role_based" ON public.clients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin', 'sales_admin')
    )
  );

-- 5. Strengthen delivery access controls
DROP POLICY IF EXISTS "deliveries_simple_auth" ON public.deliveries;
DROP POLICY IF EXISTS "delivery_items_simple_auth" ON public.delivery_items;

CREATE POLICY "deliveries_role_based_access" ON public.deliveries
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin', 'user', 'technician')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin', 'user', 'technician')
    )
  );

CREATE POLICY "delivery_items_role_based_access" ON public.delivery_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin', 'user', 'technician')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin', 'user', 'technician')
    )
  );

-- 6. Create security logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- In a production environment, this would log to a dedicated audit table
  RAISE LOG 'SECURITY_EVENT: % by user % - %', 
    event_type, 
    COALESCE(auth.uid()::text, 'anonymous'), 
    details;
END;
$$;

-- 7. Enhanced audit trigger for role changes
CREATE OR REPLACE FUNCTION public.audit_role_change_enhanced()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
BEGIN
  -- Get current user's role
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE id = auth.uid();

  -- Log role changes with detailed information
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    PERFORM public.log_security_event(
      'ROLE_CHANGE',
      jsonb_build_object(
        'target_user', NEW.id,
        'old_role', OLD.role,
        'new_role', NEW.role,
        'changed_by', auth.uid(),
        'changed_by_role', current_user_role,
        'timestamp', now()
      )
    );
    
    -- Additional security check for superadmin changes
    IF NEW.role = 'superadmin' AND current_user_role != 'superadmin' THEN
      RAISE EXCEPTION 'Unauthorized superadmin role assignment attempt by user %', auth.uid();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Replace the existing audit trigger
DROP TRIGGER IF EXISTS audit_profile_role_changes ON public.profiles;
CREATE TRIGGER audit_profile_role_changes
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION audit_role_change_enhanced();

-- 8. Create function to validate user permissions
CREATE OR REPLACE FUNCTION public.has_role_permission(required_role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get user role from profiles table
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- Check if user has required role or higher privileges
  RETURN CASE 
    WHEN required_role = 'user' THEN user_role IN ('user', 'technician', 'sales_admin', 'admin', 'superadmin')
    WHEN required_role = 'technician' THEN user_role IN ('technician', 'sales_admin', 'admin', 'superadmin')
    WHEN required_role = 'sales_admin' THEN user_role IN ('sales_admin', 'admin', 'superadmin')
    WHEN required_role = 'admin' THEN user_role IN ('admin', 'superadmin')
    WHEN required_role = 'superadmin' THEN user_role = 'superadmin'
    ELSE false
  END;
END;
$$;

-- 9. Add indexes for security-related queries
CREATE INDEX IF NOT EXISTS idx_profiles_role_security ON public.profiles (role, id);
CREATE INDEX IF NOT EXISTS idx_user_roles_security ON public.user_roles (user_id, role);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_lookup ON public.profiles (id) WHERE id IS NOT NULL;

-- 10. Grant minimal permissions and revoke unnecessary ones
REVOKE ALL ON public.profiles FROM authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

REVOKE ALL ON public.user_roles FROM authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

-- 11. Final security validation
DO $$
DECLARE
  policy_count int;
BEGIN
  -- Check that we have the right number of security policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'user_roles', 'clients', 'deliveries', 'delivery_items');
  
  IF policy_count < 10 THEN
    RAISE WARNING 'Security warning: Expected more RLS policies. Found: %', policy_count;
  END IF;
  
  RAISE NOTICE 'Security hardening policies applied successfully. Active policies: %', policy_count;
END;
$$;

-- Success message
SELECT 'Security hardening policies have been successfully implemented!' as status;