import { supabase } from '@/integrations/supabase/client';

export const purchaseOrderNumberService = {
  async generateNextPONumber(): Promise<string> {
    try {
      // Get ALL purchase orders with client_po values to find the highest number
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('client_po')
        .not('client_po', 'is', null)
        .order('created_at', { ascending: false }); // Get all, we'll sort by number ourselves

      if (error) {
        console.error('Error fetching PO numbers:', error);
        return 'PO-001';
      }

      if (!data || data.length === 0) {
        return 'PO-001';
      }

      console.log('🔍 Found existing PO numbers:', data.map(po => po.client_po));

      // Extract all numeric parts and find the highest
      let highestNumber = 0;
      
      for (const po of data) {
        if (po.client_po) {
          // Try PO-XXX format first
          const match = po.client_po.match(/PO-(\d+)/);
          if (match) {
            const number = parseInt(match[1]);
            if (number > highestNumber) {
              highestNumber = number;
            }
          } else {
            // Try any numeric pattern
            const numericMatch = po.client_po.match(/(\d+)/);
            if (numericMatch) {
              const number = parseInt(numericMatch[1]);
              if (number > highestNumber) {
                highestNumber = number;
              }
            }
          }
        }
      }

      const nextNumber = highestNumber + 1;
      const nextPONumber = `PO-${nextNumber.toString().padStart(3, '0')}`;
      
      console.log(`📊 Highest existing PO number: ${highestNumber}, Next PO: ${nextPONumber}`);
      
      return nextPONumber;
    } catch (error) {
      console.error('Error generating PO number:', error);
      return 'PO-001';
    }
  },

  async isPONumberExists(poNumber: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('id')
        .eq('client_po', poNumber)
        .limit(1);

      if (error) {
        console.error('Error checking PO number existence:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking PO number existence:', error);
      return false;
    }
  }
};