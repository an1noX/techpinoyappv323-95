
-- =============================================
-- SELF-HOSTED SUPABASE FIXES
-- Address issues with superadmin migration and user creation
-- =============================================

-- 1. Fix any missing enum values
DO $$ BEGIN
    -- Ensure all role values exist in app_role enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('client', 'user', 'admin', 'sales_admin', 'technician', 'superadmin');
    ELSE
        -- Add missing values if they don't exist
        BEGIN
            ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'user';
            ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'sales_admin';
            ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'superadmin';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- 2. Ensure user_roles table exists and is properly configured
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policy for user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Superadmins can manage all roles" ON public.user_roles;
CREATE POLICY "Superadmins can manage all roles" ON public.user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'superadmin'
        )
    );

-- 3. Fix profiles table constraints and triggers
ALTER TABLE public.profiles 
    ALTER COLUMN role TYPE text,
    ALTER COLUMN role SET DEFAULT 'user';

-- Update profiles trigger to handle new users properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        CASE 
            WHEN NEW.email = 'admin@techpinoy.com' THEN 'admin'
            WHEN NEW.raw_user_meta_data ->> 'role' IS NOT NULL THEN NEW.raw_user_meta_data ->> 'role'
            ELSE 'user'
        END
    );
    
    -- If user has superadmin role, add to user_roles table
    IF COALESCE(NEW.raw_user_meta_data ->> 'role', 'user') = 'superadmin' THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'superadmin'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Update superadmin functions to work with self-hosted setup
CREATE OR REPLACE FUNCTION public.is_superadmin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    -- Check both profiles table and user_roles table
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = COALESCE(user_id, auth.uid()) 
        AND role = 'superadmin'
    ) OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = COALESCE(user_id, auth.uid()) 
        AND role = 'superadmin'::app_role
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.promote_to_superadmin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    -- Check if current user is superadmin
    IF NOT public.is_superadmin() THEN
        RAISE EXCEPTION 'Only superadmins can promote users to superadmin role';
    END IF;

    -- Update profiles table
    UPDATE public.profiles 
    SET role = 'superadmin'
    WHERE id = target_user_id;

    -- Insert or update user_roles table
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'superadmin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
END;
$function$;

-- 5. Clean up any orphaned profiles
DELETE FROM public.profiles 
WHERE id NOT IN (SELECT id FROM auth.users);

-- 6. Update RLS policies to work with self-hosted setup
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
CREATE POLICY "Enable read access for authenticated users" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
CREATE POLICY "Enable insert for authenticated users only" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 7. Create a function to test the setup
CREATE OR REPLACE FUNCTION public.test_superadmin_setup()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    result jsonb;
    profile_count int;
    superadmin_count int;
    current_user_role text;
BEGIN
    -- Get counts
    SELECT COUNT(*) INTO profile_count FROM public.profiles;
    SELECT COUNT(*) INTO superadmin_count FROM public.user_roles WHERE role = 'superadmin';
    
    -- Get current user role
    SELECT role INTO current_user_role FROM public.profiles WHERE id = auth.uid();
    
    result := jsonb_build_object(
        'profile_count', profile_count,
        'superadmin_count', superadmin_count,
        'current_user_role', COALESCE(current_user_role, 'none'),
        'is_superadmin', public.is_superadmin(),
        'user_id', auth.uid(),
        'timestamp', now()
    );
    
    RETURN result;
END;
$function$;

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);

-- Final status
SELECT 'Self-hosted Supabase fixes applied successfully!' as status;
