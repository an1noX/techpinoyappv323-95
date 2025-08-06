-- =============================================
-- SECURE SUPERADMIN SETUP
-- Replaces hardcoded admin email with secure setup process
-- =============================================

-- 1. Remove hardcoded admin email logic from trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
BEGIN
    -- Default role is 'user' - no special cases
    user_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'user');
    
    -- Validate role against allowed values
    IF user_role NOT IN ('user', 'admin', 'sales_admin', 'technician', 'client') THEN
        user_role := 'user';
    END IF;
    
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
        updated_at = now();
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Log error but don't prevent user creation
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- 2. Create secure superadmin initialization function
CREATE OR REPLACE FUNCTION public.initialize_superadmin(
    superadmin_user_id uuid,
    verification_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
    current_superadmin_count int;
    expected_code text;
BEGIN
    -- Check if superadmin already exists
    SELECT COUNT(*) INTO current_superadmin_count 
    FROM public.profiles 
    WHERE role = 'superadmin';
    
    -- Only allow if no superadmin exists
    IF current_superadmin_count > 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Superadmin already exists'
        );
    END IF;
    
    -- Generate expected verification code based on user ID
    expected_code := encode(
        digest(superadmin_user_id::text || 'secure_superadmin_init', 'sha256'),
        'hex'
    );
    
    -- Verify the code
    IF verification_code != expected_code THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid verification code'
        );
    END IF;
    
    -- Verify user exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = superadmin_user_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Update to superadmin
    UPDATE public.profiles 
    SET role = 'superadmin', updated_at = now()
    WHERE id = superadmin_user_id;
    
    -- Add to user_roles table
    INSERT INTO public.user_roles (user_id, role)
    VALUES (superadmin_user_id, 'superadmin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Log security event
    PERFORM public.log_security_event(
        'SUPERADMIN_INITIALIZED',
        jsonb_build_object(
            'user_id', superadmin_user_id,
            'timestamp', now()
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Superadmin initialized successfully'
    );
END;
$$;

-- 3. Create function to generate verification code
CREATE OR REPLACE FUNCTION public.generate_superadmin_verification_code(user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only allow if no superadmin exists and user exists
    IF EXISTS (SELECT 1 FROM public.profiles WHERE role = 'superadmin') THEN
        RAISE EXCEPTION 'Superadmin already exists';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    RETURN encode(
        digest(user_id::text || 'secure_superadmin_init', 'sha256'),
        'hex'
    );
END;
$$;

-- 4. Create audit function for superadmin operations
CREATE OR REPLACE FUNCTION public.audit_superadmin_operations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Log any changes to superadmin role
    IF OLD.role != NEW.role AND (OLD.role = 'superadmin' OR NEW.role = 'superadmin') THEN
        PERFORM public.log_security_event(
            'SUPERADMIN_ROLE_CHANGE',
            jsonb_build_object(
                'target_user', NEW.id,
                'old_role', OLD.role,
                'new_role', NEW.role,
                'changed_by', auth.uid(),
                'timestamp', now()
            )
        );
        
        -- Prevent unauthorized superadmin promotion
        IF NEW.role = 'superadmin' AND NOT public.is_superadmin() THEN
            RAISE EXCEPTION 'Unauthorized superadmin promotion attempt';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 5. Create the audit trigger
DROP TRIGGER IF EXISTS audit_superadmin_changes ON public.profiles;
CREATE TRIGGER audit_superadmin_changes
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION audit_superadmin_operations();

-- 6. Recreate the user creation trigger without hardcoded email
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Success message
SELECT 'Secure superadmin setup completed - no hardcoded admin emails!' as status;