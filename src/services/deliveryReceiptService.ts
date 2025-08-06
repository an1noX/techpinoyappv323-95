import { supabase } from '@/integrations/supabase/client';

export const deliveryReceiptService = {
  async generateNextDRNumber(): Promise<string> {
    try {
      // Get the latest delivery receipt number
      const { data, error } = await supabase
        .from('deliveries')
        .select('delivery_receipt_number')
        .not('delivery_receipt_number', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching latest DR number:', error);
        return 'DR-001';
      }

      if (!data || data.length === 0) {
        return 'DR-001';
      }

      const latestDR = data[0].delivery_receipt_number;
      
      // Extract number from DR format (e.g., "DR-001" -> 1)
      const match = latestDR?.match(/DR-(\d+)/);
      if (match) {
        const nextNumber = parseInt(match[1]) + 1;
        return `DR-${nextNumber.toString().padStart(3, '0')}`;
      }

      // If format doesn't match, check for any numeric patterns
      const numericMatch = latestDR?.match(/(\d+)/);
      if (numericMatch) {
        const nextNumber = parseInt(numericMatch[1]) + 1;
        return `DR-${nextNumber.toString().padStart(3, '0')}`;
      }

      // Fallback if no pattern is found
      return 'DR-001';
    } catch (error) {
      console.error('Error generating DR number:', error);
      return 'DR-001';
    }
  },

  async isDRNumberExists(drNumber: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select('id')
        .eq('delivery_receipt_number', drNumber)
        .limit(1);

      if (error) {
        console.error('Error checking DR number existence:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking DR number existence:', error);
      return false;
    }
  }
};