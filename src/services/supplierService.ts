
import { supabase } from '@/integrations/supabase/client';
import { Supplier } from '@/types/database';

export const supplierService = {
  async createSupplier(supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    const { error } = await supabase
      .from('suppliers')
      .insert(supplierData);
    return !error;
  },

  async updateSupplier(id: string, supplierData: Partial<Supplier>): Promise<boolean> {
    const { error } = await supabase
      .from('suppliers')
      .update(supplierData)
      .eq('id', id);
    return !error;
  },

  async deleteSupplier(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);
    return !error;
  },

  async getSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');
    return !error && data ? data : [];
  }
};
