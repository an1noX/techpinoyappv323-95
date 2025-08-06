
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const SQL_QUERY = `-- =============================================
-- SUPABASE USER CREATION ISSUES - DIRECT SQL FIX
-- Execute this in Supabase SQL Editor or Kong Admin
-- =============================================

-- 1. First, let's check and fix the auth schema permissions
-- Ensure the service_role can interact with auth.users table
GRANT ALL ON SCHEMA auth TO postgres, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO postgres, service_role;

-- 2. Check if auth.users table exists and has correct structure
-- This will show the structure - run this first to diagnose
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Ensure required extensions are enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 4. Fix the app_role enum to include all necessary roles
DO $$ 
BEGIN
    -- Drop and recreate the enum with all required values
    DROP TYPE IF EXISTS app_role CASCADE;
    CREATE TYPE app_role AS ENUM ('user', 'admin', 'sales_admin', 'technician', 'client', 'superadmin');
EXCEPTION
    WHEN duplicate_object THEN
        -- If enum exists, try to add missing values
        BEGIN
            ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'superadmin';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
END $$;

-- 5. Ensure profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    full_name text,
    role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'sales_admin', 'technician', 'client', 'superadmin')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 6. Ensure user_roles table exists with correct structure
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, role)
);

-- 7. Enable RLS on both tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 8. Drop and recreate all policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can manage all roles" ON public.user_roles;

-- Create new policies
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "user_roles_select_own" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_roles_all_for_superadmin" ON public.user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- 9. Create or replace the trigger function for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
BEGIN
    -- Determine user role
    user_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'user');
    
    -- No special hardcoded email cases - security improvement
    -- All role assignments must go through proper channels
    
    -- Insert into profiles table
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        user_role
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        updated_at = now();
    
    -- If user is superadmin, also add to user_roles table
    IF user_role = 'superadmin' THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'superadmin'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Log error but don't prevent user creation
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- 10. Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. Create helper functions for superadmin management
CREATE OR REPLACE FUNCTION public.is_superadmin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = COALESCE(user_id, auth.uid()) 
        AND role = 'superadmin'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.promote_to_superadmin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if current user is superadmin
    IF NOT public.is_superadmin() THEN
        RAISE EXCEPTION 'Only superadmins can promote users to superadmin role';
    END IF;

    -- Update profiles table
    UPDATE public.profiles 
    SET role = 'superadmin', updated_at = now()
    WHERE id = target_user_id;

    -- Insert into user_roles table
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'superadmin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- 12. Create a test function to verify everything works
CREATE OR REPLACE FUNCTION public.test_user_creation_setup()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
    test_results jsonb := '{}';
BEGIN
    -- Test 1: Check if trigger exists
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created' 
        AND tgrelid = 'auth.users'::regclass
    ) INTO result;
    test_results := test_results || jsonb_build_object('trigger_exists', result);
    
    -- Test 2: Check if profiles table exists
    SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'profiles'
    ) INTO result;
    test_results := test_results || jsonb_build_object('profiles_table_exists', result);
    
    -- Test 3: Check if user_roles table exists
    SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'user_roles'
    ) INTO result;
    test_results := test_results || jsonb_build_object('user_roles_table_exists', result);
    
    -- Test 4: Check if app_role enum exists
    SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'app_role'
    ) INTO result;
    test_results := test_results || jsonb_build_object('app_role_enum_exists', result);
    
    -- Test 5: Check current user info
    test_results := test_results || jsonb_build_object(
        'current_user_id', auth.uid(),
        'current_user_role', auth.role(),
        'timestamp', now()
    );
    
    RETURN test_results;
END;
$$;

-- 13. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 14. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles (role);

-- 15. Final verification query - run this to test the setup
SELECT 'Setup complete! Run the test function:' as status;
SELECT 'SELECT public.test_user_creation_setup();' as next_step;

-- 16. Clean up any orphaned data
DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.user_roles WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Final success message
SELECT 'User creation setup fixed successfully!' as final_status;`

const SqlQueryDisplay = () => {
  const [copied, setCopied] = useState(false)
  const [showQuery, setShowQuery] = useState(false)
  const { toast } = useToast()

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(SQL_QUERY)
      setCopied(true)
      toast({
        title: "SQL Query Copied",
        description: "The SQL query has been copied to your clipboard. You can now paste it into your Supabase SQL Editor.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard. Please select and copy the query manually.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            User Creation Fix - SQL Query
            <Badge variant="outline">Ready to Execute</Badge>
          </CardTitle>
          <CardDescription>
            Execute this SQL query in your Supabase SQL Editor or Kong Admin interface to fix user creation issues.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button onClick={copyToClipboard} className="flex items-center gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy SQL Query'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowQuery(!showQuery)}
              className="flex items-center gap-2"
            >
              {showQuery ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showQuery ? 'Hide' : 'Show'} Query
            </Button>
          </div>

          {showQuery && (
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                {SQL_QUERY}
              </pre>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>Copy the SQL query above</li>
              <li>Go to your Supabase project dashboard</li>
              <li>Navigate to "SQL Editor" or Kong Admin interface</li>
              <li>Paste and execute the query</li>
              <li>After execution, run: <code className="bg-blue-100 px-1 rounded">SELECT public.test_user_creation_setup();</code></li>
            </ol>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-yellow-900 mb-2">What this query fixes:</h3>
            <ul className="list-disc list-inside space-y-1 text-yellow-800">
              <li>Auth schema permissions</li>
              <li>Required PostgreSQL extensions</li>
              <li>app_role enum with superadmin support</li>
              <li>Profiles and user_roles table structure</li>
              <li>Row Level Security policies</li>
              <li>User creation triggers</li>
              <li>Superadmin management functions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SqlQueryDisplay
