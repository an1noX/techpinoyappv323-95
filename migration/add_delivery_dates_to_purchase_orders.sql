-- Add expected delivery date and due date to purchase_orders table
ALTER TABLE public.purchase_orders 
ADD COLUMN expected_delivery_date DATE,
ADD COLUMN due_date DATE;

-- Add indexes for the new columns
CREATE INDEX idx_purchase_orders_expected_delivery_date ON public.purchase_orders USING btree (expected_delivery_date);
CREATE INDEX idx_purchase_orders_due_date ON public.purchase_orders USING btree (due_date);

-- Add comments for the columns
COMMENT ON COLUMN public.purchase_orders.expected_delivery_date IS 'Expected delivery date, defaults to 3 days from PO creation if not specified';
COMMENT ON COLUMN public.purchase_orders.due_date IS 'Payment due date, automatically set to 30 days from expected delivery date';