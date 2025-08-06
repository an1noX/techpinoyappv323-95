import { supabase } from '@/integrations/supabase/client';
import { 
  ProductSet, 
  ProductSetWithItems, 
  ProductSetItem, 
  CreateProductSetData, 
  UpdateProductSetData 
} from '@/types/productSets';

class ProductSetsService {
  async getProductSets(): Promise<ProductSetWithItems[]> {
    const { data, error } = await supabase
      .from('product_sets')
      .select(`
        *,
        items:product_set_items(
          *,
          product:products(id, name, sku, color, category)
        )
      `)
      .order('name');

    if (error) {
      console.error('Error fetching product sets:', error);
      throw error;
    }

    return data || [];
  }

  async getProductSetById(id: string): Promise<ProductSetWithItems | null> {
    const { data, error } = await supabase
      .from('product_sets')
      .select(`
        *,
        items:product_set_items(
          *,
          product:products(id, name, sku, color, category)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product set:', error);
      throw error;
    }

    return data;
  }

  async createProductSet(data: CreateProductSetData): Promise<ProductSet> {
    // Create the product set
    const { data: productSet, error: setError } = await supabase
      .from('product_sets')
      .insert({
        name: data.name,
        description: data.description,
        sku: data.sku
      })
      .select()
      .single();

    if (setError) {
      console.error('Error creating product set:', setError);
      throw setError;
    }

    // Add items to the set
    if (data.productIds.length > 0) {
      const items = data.productIds.map(item => ({
        product_set_id: productSet.id,
        product_id: item.productId,
        quantity: item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('product_set_items')
        .insert(items);

      if (itemsError) {
        console.error('Error adding items to product set:', itemsError);
        // Clean up the created set
        await supabase.from('product_sets').delete().eq('id', productSet.id);
        throw itemsError;
      }
    }

    return productSet;
  }

  async updateProductSet(id: string, data: UpdateProductSetData): Promise<ProductSet> {
    // Update the product set
    const { data: productSet, error: setError } = await supabase
      .from('product_sets')
      .update({
        name: data.name,
        description: data.description,
        sku: data.sku
      })
      .eq('id', id)
      .select()
      .single();

    if (setError) {
      console.error('Error updating product set:', setError);
      throw setError;
    }

    // Update items if provided
    if (data.productIds) {
      // Remove existing items
      await supabase
        .from('product_set_items')
        .delete()
        .eq('product_set_id', id);

      // Add new items
      if (data.productIds.length > 0) {
        const items = data.productIds.map(item => ({
          product_set_id: id,
          product_id: item.productId,
          quantity: item.quantity
        }));

        const { error: itemsError } = await supabase
          .from('product_set_items')
          .insert(items);

        if (itemsError) {
          console.error('Error updating items in product set:', itemsError);
          throw itemsError;
        }
      }
    }

    return productSet;
  }

  async deleteProductSet(id: string): Promise<void> {
    const { error } = await supabase
      .from('product_sets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product set:', error);
      throw error;
    }
  }

  async addProductToSet(productSetId: string, productId: string, quantity: number = 1): Promise<ProductSetItem> {
    const { data, error } = await supabase
      .from('product_set_items')
      .insert({
        product_set_id: productSetId,
        product_id: productId,
        quantity
      })
      .select(`
        *,
        product:products(id, name, sku, color, category)
      `)
      .single();

    if (error) {
      console.error('Error adding product to set:', error);
      throw error;
    }

    return data;
  }

  async removeProductFromSet(productSetId: string, productId: string): Promise<void> {
    const { error } = await supabase
      .from('product_set_items')
      .delete()
      .eq('product_set_id', productSetId)
      .eq('product_id', productId);

    if (error) {
      console.error('Error removing product from set:', error);
      throw error;
    }
  }

  async updateProductQuantityInSet(
    productSetId: string, 
    productId: string, 
    quantity: number
  ): Promise<ProductSetItem> {
    const { data, error } = await supabase
      .from('product_set_items')
      .update({ quantity })
      .eq('product_set_id', productSetId)
      .eq('product_id', productId)
      .select(`
        *,
        product:products(id, name, sku, color, category)
      `)
      .single();

    if (error) {
      console.error('Error updating product quantity in set:', error);
      throw error;
    }

    return data;
  }

  // Group products by similar SKU for creating sets
  async getProductsGroupedBySimilarSku(): Promise<Record<string, any[]>> {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('sku', { ascending: true });

    if (error) {
      console.error('Error fetching products for grouping:', error);
      throw error;
    }

    // Group products by base SKU (without color variants)
    const groups: Record<string, any[]> = {};
    
    products?.forEach(product => {
      // Extract base SKU by removing common color suffixes
      let baseSku = product.sku;
      
      // Remove common color patterns
      const colorPatterns = [
        /[_-](BK|BLACK|K)$/i,
        /[_-](C|CYAN)$/i,
        /[_-](M|MAGENTA)$/i,
        /[_-](Y|YELLOW)$/i,
        /[_-](R|RED)$/i,
        /[_-](B|BLUE)$/i,
        /[_-](G|GREEN)$/i,
        /[A-Z]$/
      ];
      
      colorPatterns.forEach(pattern => {
        const temp = baseSku.replace(pattern, '');
        if (temp.length > 0) {
          baseSku = temp;
        }
      });

      if (!groups[baseSku]) {
        groups[baseSku] = [];
      }
      groups[baseSku].push(product);
    });

    // Filter groups to only show those with multiple color variants
    const filteredGroups: Record<string, any[]> = {};
    Object.keys(groups).forEach(baseSku => {
      if (groups[baseSku].length > 1) {
        filteredGroups[baseSku] = groups[baseSku];
      }
    });

    return filteredGroups;
  }
}

export const productSetsService = new ProductSetsService();