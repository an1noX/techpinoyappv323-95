-- =============================================
-- CRITICAL SECURITY FIXES
-- Immediate fixes for identified vulnerabilities
-- =============================================

-- 1. DISABLE ALL OVERLY PERMISSIVE POLICIES
DROP POLICY IF EXISTS "Allow all authenticated users" ON public.deliveries;
DROP POLICY IF EXISTS "Allow all authenticated users" ON public.delivery_items;
DROP POLICY IF EXISTS "Allow all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.user_roles;
DROP POLICY IF EXISTS "Allow insert for service role only" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read-only access" ON public.clients;

-- 2. SECURE PROFILE ACCESS - CRITICAL FIX
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_trigger_only" ON public.profiles;

-- Only allow users to see their own profile OR admins to see all
CREATE POLICY "profiles_select_secure" ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Users can only update their own non-role fields
CREATE POLICY "profiles_update_secure" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND OLD.role = NEW.role -- Prevent role self-modification
  );

-- Only allow profile creation for the authenticated user
CREATE POLICY "profiles_insert_secure" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id AND role = 'user');

-- 3. LOCK DOWN USER_ROLES TABLE - PREVENT PRIVILEGE ESCALATION
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_superadmin_only" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_superadmin_only" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_superadmin_only" ON public.user_roles;

-- Users can only see their own roles
CREATE POLICY "user_roles_select_own_only" ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- Only superadmins can modify roles, with additional security checks
CREATE POLICY "user_roles_insert_superadmin_verified" ON public.user_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
      AND id != NEW.user_id -- Prevent self-modification
    )
  );

CREATE POLICY "user_roles_update_superadmin_verified" ON public.user_roles
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

CREATE POLICY "user_roles_delete_superadmin_verified" ON public.user_roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
      AND id != user_id -- Prevent self-modification
    )
  );

-- 4. SECURE CLIENT DATA ACCESS
DROP POLICY IF EXISTS "clients_select_admin" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_admin" ON public.clients;
DROP POLICY IF EXISTS "clients_update_admin" ON public.clients;
DROP POLICY IF EXISTS "clients_delete_superadmin_only" ON public.clients;

-- Only authenticated admin/superadmin users can access client data
CREATE POLICY "clients_select_authenticated_admin" ON public.clients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin', 'sales_admin')
    )
  );

CREATE POLICY "clients_modify_admin_only" ON public.clients
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- 5. SECURE ROLE CHANGE AUDITING
CREATE OR REPLACE FUNCTION public.secure_audit_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
  performing_user_id uuid;
BEGIN
  performing_user_id := auth.uid();
  
  -- Get current user's role
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE id = performing_user_id;

  -- Log role changes with enhanced security checks
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Security check: prevent unauthorized role escalation
    IF NEW.role = 'superadmin' AND current_user_role != 'superadmin' THEN
      RAISE EXCEPTION 'SECURITY_VIOLATION: Unauthorized superadmin role assignment attempt by user % with role %', 
        performing_user_id, current_user_role;
    END IF;
    
    -- Security check: prevent self-modification of roles
    IF NEW.id = performing_user_id THEN
      RAISE EXCEPTION 'SECURITY_VIOLATION: Self-role modification attempt by user %', performing_user_id;
    END IF;
    
    -- Log the change
    RAISE LOG 'SECURITY_AUDIT: Role changed for user % from % to % by % (role: %)', 
      NEW.id, OLD.role, NEW.role, performing_user_id, current_user_role;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Replace the existing audit trigger with secure version
DROP TRIGGER IF EXISTS audit_profile_role_changes ON public.profiles;
CREATE TRIGGER secure_audit_profile_role_changes
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION secure_audit_role_change();

-- 6. ENHANCED SECURITY VALIDATION FUNCTION
CREATE OR REPLACE FUNCTION public.validate_user_security_context(required_role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  user_role text;
  user_id uuid;
BEGIN
  user_id := auth.uid();
  
  -- Check if user is authenticated
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get user role from profiles table
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE id = user_id;
  
  -- If no profile found, deny access
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Role hierarchy validation
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

-- 7. REVOKE DANGEROUS PERMISSIONS
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.user_roles FROM anon;
REVOKE ALL ON public.clients FROM anon;

-- Grant minimal necessary permissions
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.clients TO authenticated;

-- 8. CREATE SECURITY MONITORING
CREATE OR REPLACE FUNCTION public.log_security_violation(
  violation_type text,
  details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RAISE WARNING 'SECURITY_VIOLATION: % by user % - %', 
    violation_type, 
    COALESCE(auth.uid()::text, 'anonymous'), 
    details;
  
  -- In production, this would also send to monitoring system
END;
$$;

-- 9. FINAL SECURITY VALIDATION
DO $$
DECLARE
  dangerous_policies int;
BEGIN
  -- Check for any remaining dangerous policies
  SELECT COUNT(*) INTO dangerous_policies
  FROM pg_policies 
  WHERE schemaname = 'public' 
  AND (
    qual LIKE '%true%' OR 
    with_check LIKE '%true%' OR
    policyname LIKE '%all%' OR
    policyname LIKE '%public%'
  );
  
  IF dangerous_policies > 0 THEN
    RAISE WARNING 'SECURITY_ALERT: Found % potentially dangerous policies', dangerous_policies;
  END IF;
  
  RAISE NOTICE 'Security fixes applied successfully. Review any warnings above.';
END;
$$;

-- Success message
SELECT 'Critical security fixes have been successfully applied!' as status;