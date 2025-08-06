-- Add position field to profiles table for displaying user's position
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS position text;

-- Add default position for existing users
UPDATE public.profiles 
SET position = 'Sales Manager' 
WHERE position IS NULL;

-- Create payment_terms table to store available payment terms
CREATE TABLE IF NOT EXISTS public.payment_terms (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    description text,
    days_due integer DEFAULT 0, -- 0 for "Due upon Receipt", other values for NET terms
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Insert default payment terms
INSERT INTO public.payment_terms (name, description, days_due, is_default) 
VALUES 
    ('Due upon Receipt', 'Payment due immediately upon receipt', 0, true),
    ('NET 15', 'Payment due within 15 days', 15, false),
    ('NET 30', 'Payment due within 30 days', 30, false)
ON CONFLICT DO NOTHING;

-- Add payment_terms_id to purchase_orders table
ALTER TABLE public.purchase_orders 
ADD COLUMN IF NOT EXISTS payment_terms_id uuid REFERENCES public.payment_terms(id);

-- Set default payment terms for existing purchase orders
UPDATE public.purchase_orders 
SET payment_terms_id = (
    SELECT id FROM public.payment_terms WHERE is_default = true LIMIT 1
)
WHERE payment_terms_id IS NULL;

-- Enable RLS on payment_terms table
ALTER TABLE public.payment_terms ENABLE ROW LEVEL SECURITY;

-- Create policies for payment_terms table
CREATE POLICY "Enable read access for all users" ON public.payment_terms
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON public.payment_terms
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON public.payment_terms
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON public.payment_terms
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for payment_terms table
CREATE TRIGGER set_payment_terms_updated_at
    BEFORE UPDATE ON public.payment_terms
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();