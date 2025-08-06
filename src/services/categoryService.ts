
import { supabase } from '@/integrations/supabase/client';

export const categoryService = {
  // Fetch all unique categories from products
  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .order('category');
    
    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
    
    // Extract unique categories
    const uniqueCategories = [...new Set(data.map(item => item.category))];
    return uniqueCategories.filter(category => category && category.trim() !== '');
  }
};
