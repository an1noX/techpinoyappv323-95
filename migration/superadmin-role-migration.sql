-- =============================================
-- SUPABASE MIGRATION SCRIPT: SUPERADMIN ROLE
-- =============================================

-- Create enum type for all roles if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('client', 'admin', 'technician', 'superadmin');
    ELSE
        -- Add superadmin to existing enum if it doesn't exist
        ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'superadmin';
    END IF;
END $$;

-- Update user_roles table to ensure it can handle superadmin
ALTER TABLE IF EXISTS public.user_roles
    DROP CONSTRAINT IF EXISTS user_roles_role_check,
    ALTER COLUMN role TYPE app_role USING role::app_role;

-- Create or replace superadmin check function
CREATE OR REPLACE FUNCTION public.is_superadmin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = $1 AND role = 'superadmin'::app_role
    );
END;
$function$;

-- Update existing RLS policies to check for superadmin role
-- Printers table
DROP POLICY IF EXISTS "Allow full access for admins and superadmins" ON public.printers;
CREATE POLICY "Allow full access for admins and superadmins" ON public.printers
    USING (is_admin() OR is_superadmin())
    WITH CHECK (is_admin() OR is_superadmin());

-- Printer assignments table
DROP POLICY IF EXISTS "Allow full access for admins and superadmins" ON public.printer_assignments;
CREATE POLICY "Allow full access for admins and superadmins" ON public.printer_assignments
    USING (is_admin() OR is_superadmin())
    WITH CHECK (is_admin() OR is_superadmin());

-- Clients table
DROP POLICY IF EXISTS "Allow full access for admins and superadmins" ON public.clients;
CREATE POLICY "Allow full access for admins and superadmins" ON public.clients
    USING (is_admin() OR is_superadmin())
    WITH CHECK (is_admin() OR is_superadmin());

-- Departments table
DROP POLICY IF EXISTS "Allow full access for admins and superadmins" ON public.departments;
CREATE POLICY "Allow full access for admins and superadmins" ON public.departments
    USING (is_admin() OR is_superadmin())
    WITH CHECK (is_admin() OR is_superadmin());

-- Add other tables similarly...

-- Protected tables (audit logs, etc)
DROP POLICY IF EXISTS "Restrict delete to superadmin only" ON public.client_activity_log;
CREATE POLICY "Restrict delete to superadmin only" ON public.client_activity_log
    FOR DELETE
    USING (is_superadmin());

DROP POLICY IF EXISTS "Restrict delete to superadmin only" ON public.client_audit_timeline;
CREATE POLICY "Restrict delete to superadmin only" ON public.client_audit_timeline
    FOR DELETE
    USING (is_superadmin());

-- Function to promote user to superadmin (restricted to superadmins only)
CREATE OR REPLACE FUNCTION public.promote_to_superadmin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    IF NOT is_superadmin() THEN
        RAISE EXCEPTION 'Only superadmins can promote users to superadmin role';
    END IF;

    -- Insert or update the role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'superadmin'::app_role)
    ON CONFLICT (user_id) 
    DO UPDATE SET role = 'superadmin'::app_role;
END;
$function$;

-- Function to validate superadmin actions
CREATE OR REPLACE FUNCTION public.validate_superadmin_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    IF NOT is_superadmin() THEN
        RAISE EXCEPTION 'This action requires superadmin privileges';
    END IF;
    RETURN NEW;
END;
$function$;

-- Add triggers for protected operations
CREATE TRIGGER ensure_superadmin_for_delete
    BEFORE DELETE ON public.client_activity_log
    FOR EACH ROW
    EXECUTE FUNCTION validate_superadmin_action();

CREATE TRIGGER ensure_superadmin_for_delete
    BEFORE DELETE ON public.client_audit_timeline
    FOR EACH ROW
    EXECUTE FUNCTION validate_superadmin_action();

-- Grant necessary permissions to superadmin role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create indexes to optimize role checks
CREATE INDEX IF NOT EXISTS idx_user_roles_superadmin 
    ON public.user_roles (user_id) 
    WHERE role = 'superadmin'::app_role;

-- Comments for documentation
COMMENT ON FUNCTION public.is_superadmin IS 'Checks if the specified user (or current user if not specified) has superadmin role';
COMMENT ON FUNCTION public.promote_to_superadmin IS 'Promotes a user to superadmin role. Can only be executed by existing superadmins';
