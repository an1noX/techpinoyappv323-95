-- =============================================
-- SUPABASE MIGRATION SCRIPT: FUNCTIONS, RLS POLICIES & TRIGGERS
-- From: mzjcmtltwdcpbdvunmzk.supabase.co
-- To: kong.techpinoy.com
-- =============================================

-- =============================================
-- 1. CUSTOM FUNCTIONS
-- =============================================

-- Authentication Functions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Business Logic Functions
CREATE OR REPLACE FUNCTION public.update_printer_counts()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Handle INSERT and UPDATE operations
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Update printer count for the new location if department_location_id is set
    IF NEW.department_location_id IS NOT NULL THEN
      UPDATE departments_location 
      SET printer_count = (
        SELECT COUNT(*) 
        FROM printer_assignments 
        WHERE department_location_id = NEW.department_location_id 
        AND status = 'active'
      )
      WHERE id = NEW.department_location_id;
    END IF;
    
    -- If this is an UPDATE and the department_location_id changed, update the old location too
    IF TG_OP = 'UPDATE' AND OLD.department_location_id IS DISTINCT FROM NEW.department_location_id AND OLD.department_location_id IS NOT NULL THEN
      UPDATE departments_location 
      SET printer_count = (
        SELECT COUNT(*) 
        FROM printer_assignments 
        WHERE department_location_id = OLD.department_location_id 
        AND status = 'active'
      )
      WHERE id = OLD.department_location_id;
    END IF;
    
    -- Update client printer count
    UPDATE clients 
    SET printer_count = (
      SELECT COUNT(*) 
      FROM printer_assignments 
      WHERE client_id = NEW.client_id 
      AND status = 'active'
    )
    WHERE id = NEW.client_id;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE operations
  IF TG_OP = 'DELETE' THEN
    -- Update printer count for the old location
    IF OLD.department_location_id IS NOT NULL THEN
      UPDATE departments_location 
      SET printer_count = (
        SELECT COUNT(*) 
        FROM printer_assignments 
        WHERE department_location_id = OLD.department_location_id 
        AND status = 'active'
      )
      WHERE id = OLD.department_location_id;
    END IF;
    
    -- Update client printer count
    UPDATE clients 
    SET printer_count = (
      SELECT COUNT(*) 
      FROM printer_assignments 
      WHERE client_id = OLD.client_id 
      AND status = 'active'
    )
    WHERE id = OLD.client_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_client_printer_count()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.clients 
    SET printer_count = (
      SELECT COUNT(*) FROM public.printer_assignments 
      WHERE client_id = NEW.client_id AND status = 'active'
    )
    WHERE id = NEW.client_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.clients 
    SET printer_count = (
      SELECT COUNT(*) FROM public.printer_assignments 
      WHERE client_id = OLD.client_id AND status = 'active'
    )
    WHERE id = OLD.client_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update both old and new client if client_id changed
    IF OLD.client_id != NEW.client_id THEN
      UPDATE public.clients 
      SET printer_count = (
        SELECT COUNT(*) FROM public.printer_assignments 
        WHERE client_id = OLD.client_id AND status = 'active'
      )
      WHERE id = OLD.client_id;
      
      UPDATE public.clients 
      SET printer_count = (
        SELECT COUNT(*) FROM public.printer_assignments 
        WHERE client_id = NEW.client_id AND status = 'active'
      )
      WHERE id = NEW.client_id;
    ELSE
      -- Update printer count when status changes
      UPDATE public.clients 
      SET printer_count = (
        SELECT COUNT(*) FROM public.printer_assignments 
        WHERE client_id = NEW.client_id AND status = 'active'
      )
      WHERE id = NEW.client_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_client_department_count()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.clients 
    SET department_count = (
      SELECT COUNT(*) FROM public.departments 
      WHERE client_id = NEW.client_id
    )
    WHERE id = NEW.client_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.clients 
    SET department_count = (
      SELECT COUNT(*) FROM public.departments 
      WHERE client_id = OLD.client_id
    )
    WHERE id = OLD.client_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Audit and Activity Functions
CREATE OR REPLACE FUNCTION public.log_client_activity(p_client_id uuid, p_activity_type text, p_description text, p_metadata jsonb DEFAULT NULL::jsonb, p_performed_by uuid DEFAULT auth.uid())
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO client_activity_log (client_id, activity_type, description, metadata, performed_by)
  VALUES (p_client_id, p_activity_type, p_description, p_metadata, p_performed_by)
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_client_audit_change(p_client_id uuid, p_field_changed text, p_old_value text, p_new_value text, p_change_reason text DEFAULT NULL::text, p_changed_by uuid DEFAULT auth.uid())
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO client_audit_timeline (client_id, field_changed, old_value, new_value, change_reason, changed_by)
  VALUES (p_client_id, p_field_changed, p_old_value, p_new_value, p_change_reason, p_changed_by)
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_client_audit_log()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_client_activity(NEW.id, 'client_created', 'Client created: ' || NEW.name);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log specific field changes
    IF OLD.name != NEW.name THEN
      PERFORM log_client_audit_change(NEW.id, 'name', OLD.name, NEW.name);
    END IF;
    IF OLD.status != NEW.status THEN
      PERFORM log_client_audit_change(NEW.id, 'status', OLD.status, NEW.status);
      INSERT INTO client_status_history (client_id, previous_status, new_status, changed_by)
      VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    END IF;
    IF OLD.contact_person IS DISTINCT FROM NEW.contact_person THEN
      PERFORM log_client_audit_change(NEW.id, 'contact_person', OLD.contact_person, NEW.contact_person);
    END IF;
    IF OLD.phone IS DISTINCT FROM NEW.phone THEN
      PERFORM log_client_audit_change(NEW.id, 'phone', OLD.phone, NEW.phone);
    END IF;
    IF OLD.contact_email IS DISTINCT FROM NEW.contact_email THEN
      PERFORM log_client_audit_change(NEW.id, 'contact_email', OLD.contact_email, NEW.contact_email);
    END IF;
    
    PERFORM log_client_activity(NEW.id, 'client_updated', 'Client information updated');
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

-- Printer Assignment Functions
CREATE OR REPLACE FUNCTION public.trigger_printer_assignment_history()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO printer_assignment_history (
      printer_assignment_id, action_type, new_client_id, new_department_location_id, 
      new_status, new_condition, effective_date, performed_by
    ) VALUES (
      NEW.id, 'assigned', NEW.client_id, NEW.department_location_id,
      NEW.status, NEW.condition, NEW.assignment_effective_date, auth.uid()
    );
    
    PERFORM log_client_activity(NEW.client_id, 'printer_assigned', 
      'Printer assigned (Serial: ' || COALESCE(NEW.serial_number, 'N/A') || ')');
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log transfers and status changes
    IF OLD.client_id != NEW.client_id OR OLD.department_location_id IS DISTINCT FROM NEW.department_location_id THEN
      INSERT INTO printer_assignment_history (
        printer_assignment_id, action_type, previous_client_id, new_client_id,
        previous_department_location_id, new_department_location_id,
        reason, effective_date, performed_by
      ) VALUES (
        NEW.id, 'transferred', OLD.client_id, NEW.client_id,
        OLD.department_location_id, NEW.department_location_id,
        NEW.reason_for_change, NEW.assignment_effective_date, auth.uid()
      );
      
      PERFORM log_client_activity(NEW.client_id, 'printer_transferred', 
        'Printer transferred (Serial: ' || COALESCE(NEW.serial_number, 'N/A') || ')');
    END IF;
    
    IF OLD.status != NEW.status THEN
      INSERT INTO printer_assignment_history (
        printer_assignment_id, action_type, previous_status, new_status,
        reason, performed_by
      ) VALUES (
        NEW.id, 'status_changed', OLD.status, NEW.status,
        NEW.reason_for_change, auth.uid()
      );
    END IF;
    
    IF OLD.condition != NEW.condition THEN
      INSERT INTO printer_assignment_history (
        printer_assignment_id, action_type, previous_condition, new_condition,
        reason, performed_by
      ) VALUES (
        NEW.id, 'condition_changed', OLD.condition, NEW.condition,
        NEW.reason_for_change, auth.uid()
      );
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO printer_assignment_history (
      printer_assignment_id, action_type, previous_client_id, 
      previous_department_location_id, performed_by
    ) VALUES (
      OLD.id, 'unassigned', OLD.client_id, OLD.department_location_id, auth.uid()
    );
    
    PERFORM log_client_activity(OLD.client_id, 'printer_unassigned', 
      'Printer unassigned (Serial: ' || COALESCE(OLD.serial_number, 'N/A') || ')');
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Utility Functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Product and Pricing Functions  
CREATE OR REPLACE FUNCTION public.handle_price_history()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Insert into price history when price changes
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.current_price != NEW.current_price) THEN
    INSERT INTO public.price_history (product_supplier_id, price, note)
    VALUES (NEW.id, NEW.current_price, 
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'Initial price'
        ELSE 'Price updated'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_client_price_history()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Insert into client price history when price changes
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.quoted_price != NEW.quoted_price) THEN
    INSERT INTO public.client_price_history (product_client_id, price, margin_percentage, note)
    VALUES (NEW.id, NEW.quoted_price, NEW.margin_percentage,
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'Initial quote'
        ELSE 'Quote updated'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Page Tracking Functions
CREATE OR REPLACE FUNCTION public.increment_page_view(path text, is_bot boolean DEFAULT false, client_ip text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
  result JSONB;
  last_tracked TIMESTAMP WITH TIME ZONE;
  should_track BOOLEAN := true;
BEGIN
  -- Only track HomePage
  IF path != '/' AND path != '/home' THEN
    RETURN jsonb_build_object(
      'total_views', 0,
      'organic_views', 0,
      'bot_views', 0,
      'page_path', path,
      'tracked', false,
      'reason', 'not_homepage'
    );
  END IF;

  -- Check if we've tracked this IP in the last 5 minutes for this path
  IF client_ip IS NOT NULL THEN
    SELECT last_tracked_at INTO last_tracked
    FROM public.page_views
    WHERE page_path = path AND ip_address = client_ip
    AND last_tracked_at > now() - interval '5 minutes';
    
    IF last_tracked IS NOT NULL THEN
      should_track := false;
    END IF;
  END IF;

  -- If we shouldn't track, return current counts without incrementing
  IF NOT should_track THEN
    SELECT jsonb_build_object(
      'total_views', COALESCE(view_count, 0),
      'organic_views', COALESCE(organic_views, 0),
      'bot_views', COALESCE(bot_views, 0),
      'page_path', page_path,
      'tracked', false,
      'reason', 'rate_limited'
    ) INTO result
    FROM public.page_views
    WHERE page_path = path
    LIMIT 1;
    
    RETURN COALESCE(result, jsonb_build_object(
      'total_views', 0,
      'organic_views', 0,
      'bot_views', 0,
      'page_path', path,
      'tracked', false,
      'reason', 'rate_limited'
    ));
  END IF;

  -- Insert or update the page view count
  INSERT INTO public.page_views (page_path, view_count, organic_views, bot_views, ip_address, last_tracked_at)
  VALUES (path, 1, CASE WHEN is_bot THEN 0 ELSE 1 END, CASE WHEN is_bot THEN 1 ELSE 0 END, client_ip, now())
  ON CONFLICT (page_path)
  DO UPDATE SET 
    view_count = page_views.view_count + 1,
    organic_views = page_views.organic_views + CASE WHEN is_bot THEN 0 ELSE 1 END,
    bot_views = page_views.bot_views + CASE WHEN is_bot THEN 1 ELSE 0 END,
    ip_address = client_ip,
    last_tracked_at = now(),
    updated_at = now();
  
  -- Return the updated counts
  SELECT jsonb_build_object(
    'total_views', view_count,
    'organic_views', organic_views,
    'bot_views', bot_views,
    'page_path', page_path,
    'tracked', true,
    'reason', 'success'
  ) INTO result
  FROM public.page_views
  WHERE page_path = path;
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_total_page_views()
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_views', COALESCE(SUM(view_count), 0),
    'organic_views', COALESCE(SUM(organic_views), 0),
    'bot_views', COALESCE(SUM(bot_views), 0)
  ) INTO result
  FROM public.page_views;
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_page_views_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- User Profile Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    CASE 
      WHEN new.email = 'admin@techpinoy.com' THEN 'admin'
      ELSE 'user'
    END
  );
  RETURN new;
END;
$function$;

-- Transaction Management Functions
CREATE OR REPLACE FUNCTION public.link_transactions_to_purchase_order()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- When a purchase order is created with client_po, link existing transaction records
  IF NEW.client_po IS NOT NULL THEN
    UPDATE transaction_records 
    SET purchase_order_id = NEW.id
    WHERE purchase_order_number = NEW.client_po
      AND purchase_order_id IS NULL;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.link_transactions_to_delivery()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- When a delivery is created with delivery_receipt_number, link existing transaction records
  IF NEW.delivery_receipt_number IS NOT NULL THEN
    UPDATE transaction_records 
    SET delivery_id = NEW.id
    WHERE delivery_receipt_number = NEW.delivery_receipt_number
      AND delivery_id IS NULL;
  END IF;
  RETURN NEW;
END;
$function$;

-- Search Functions
CREATE OR REPLACE FUNCTION public.search_products_with_alias(search_term text)
RETURNS TABLE(id uuid, name text, sku text, category text, description text, color text, alias text, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.sku,
    p.category,
    p.description,
    p.color,
    p.alias,
    p.created_at,
    p.updated_at
  FROM products p
  WHERE 
    p.name ILIKE '%' || search_term || '%' OR
    p.sku ILIKE '%' || search_term || '%' OR
    p.category ILIKE '%' || search_term || '%' OR
    p.description ILIKE '%' || search_term || '%' OR
    p.alias ILIKE '%' || search_term || '%'
  ORDER BY 
    CASE 
      WHEN p.name ILIKE search_term || '%' THEN 1
      WHEN p.sku ILIKE search_term || '%' THEN 2
      WHEN p.alias ILIKE search_term || '%' THEN 3
      ELSE 4
    END,
    p.name;
END;
$function$;

-- =============================================
-- 2. ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables that need it
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments_location ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printer_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
CREATE POLICY "Enable insert for authenticated users only" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Clients Policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.clients;
CREATE POLICY "Enable read access for all users" ON public.clients
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON public.clients;
CREATE POLICY "Enable insert access for all users" ON public.clients
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all users" ON public.clients;
CREATE POLICY "Enable update access for all users" ON public.clients
FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete access for all users" ON public.clients;
CREATE POLICY "Enable delete access for all users" ON public.clients
FOR DELETE USING (true);

-- Departments Policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.departments;
CREATE POLICY "Enable read access for all users" ON public.departments
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON public.departments;
CREATE POLICY "Enable insert for all users" ON public.departments
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON public.departments;
CREATE POLICY "Enable update for all users" ON public.departments
FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON public.departments;
CREATE POLICY "Enable delete for all users" ON public.departments
FOR DELETE USING (true);

-- Transaction Records Policies
DROP POLICY IF EXISTS "Users can view all transaction records" ON public.transaction_records;
CREATE POLICY "Users can view all transaction records" ON public.transaction_records
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert transaction records" ON public.transaction_records;
CREATE POLICY "Authenticated users can insert transaction records" ON public.transaction_records
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update transaction records" ON public.transaction_records;
CREATE POLICY "Authenticated users can update transaction records" ON public.transaction_records
FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete transaction records" ON public.transaction_records;
CREATE POLICY "Authenticated users can delete transaction records" ON public.transaction_records
FOR DELETE USING (auth.uid() IS NOT NULL);

-- Contact Submissions Policies
DROP POLICY IF EXISTS "Allow insert contact submissions" ON public.contact_submissions;
CREATE POLICY "Allow insert contact submissions" ON public.contact_submissions
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select contact submissions" ON public.contact_submissions;
CREATE POLICY "Allow select contact submissions" ON public.contact_submissions
FOR SELECT USING (true);

-- Support Tickets Policies
DROP POLICY IF EXISTS "Clients can view their own support tickets" ON public.support_tickets;
CREATE POLICY "Clients can view their own support tickets" ON public.support_tickets
FOR SELECT USING (
  client_id IN (
    SELECT clients.id FROM clients 
    WHERE clients.contact_email = (
      SELECT users.email FROM auth.users 
      WHERE users.id = auth.uid()
    )::text
  )
);

DROP POLICY IF EXISTS "Clients can create their own support tickets" ON public.support_tickets;
CREATE POLICY "Clients can create their own support tickets" ON public.support_tickets
FOR INSERT WITH CHECK (
  client_id IN (
    SELECT clients.id FROM clients 
    WHERE clients.contact_email = (
      SELECT users.email FROM auth.users 
      WHERE users.id = auth.uid()
    )::text
  )
);

-- =============================================
-- 3. TRIGGERS
-- =============================================

-- User profile creation trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Client management triggers
DROP TRIGGER IF EXISTS trigger_client_audit_log ON public.clients;
CREATE TRIGGER trigger_client_audit_log
  AFTER INSERT OR UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.trigger_client_audit_log();

-- Printer assignment triggers
DROP TRIGGER IF EXISTS trigger_printer_assignment_history ON public.printer_assignments;
CREATE TRIGGER trigger_printer_assignment_history
  AFTER INSERT OR UPDATE OR DELETE ON public.printer_assignments
  FOR EACH ROW EXECUTE FUNCTION public.trigger_printer_assignment_history();

DROP TRIGGER IF EXISTS update_printer_counts_trigger ON public.printer_assignments;
CREATE TRIGGER update_printer_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.printer_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_printer_counts();

-- Client count triggers  
DROP TRIGGER IF EXISTS update_client_printer_count_trigger ON public.printer_assignments;
CREATE TRIGGER update_client_printer_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.printer_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_client_printer_count();

DROP TRIGGER IF EXISTS update_client_department_count_trigger ON public.departments;
CREATE TRIGGER update_client_department_count_trigger
  AFTER INSERT OR DELETE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.update_client_department_count();

-- Updated at triggers
DROP TRIGGER IF EXISTS handle_updated_at ON public.clients;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.departments;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.departments  
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.products;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.suppliers;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Price history triggers
DROP TRIGGER IF EXISTS handle_price_history_trigger ON public.product_suppliers;
CREATE TRIGGER handle_price_history_trigger
  AFTER INSERT OR UPDATE ON public.product_suppliers
  FOR EACH ROW EXECUTE FUNCTION public.handle_price_history();

DROP TRIGGER IF EXISTS handle_client_price_history_trigger ON public.product_clients;
CREATE TRIGGER handle_client_price_history_trigger
  AFTER INSERT OR UPDATE ON public.product_clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_client_price_history();

-- Transaction linking triggers
DROP TRIGGER IF EXISTS link_transactions_to_purchase_order_trigger ON public.purchase_orders;
CREATE TRIGGER link_transactions_to_purchase_order_trigger
  AFTER INSERT ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.link_transactions_to_purchase_order();

DROP TRIGGER IF EXISTS link_transactions_to_delivery_trigger ON public.deliveries;
CREATE TRIGGER link_transactions_to_delivery_trigger
  AFTER INSERT ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.link_transactions_to_delivery();

-- Page views trigger
DROP TRIGGER IF EXISTS handle_page_views_updated_at_trigger ON public.page_views;
CREATE TRIGGER handle_page_views_updated_at_trigger
  BEFORE UPDATE ON public.page_views
  FOR EACH ROW EXECUTE FUNCTION public.handle_page_views_updated_at();

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

SELECT 'Migration script completed successfully!' as status;