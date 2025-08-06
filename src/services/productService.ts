import { supabase } from '@/integrations/supabase/client';
import { Product, ProductWithSuppliers, ProductSupplier, Supplier, PriceHistory, ProductWithClients, ProductClient, Client, ClientPriceHistory, Printer } from '@/types/database';

export interface CreateProductData {
  name: string;
  sku: string;
  category: string;
  description?: string;
  color?: string;
  alias?: string;
}

export interface UpdateProductData {
  name?: string;
  sku?: string;
  category?: string;
  description?: string;
  color?: string;
  alias?: string;
}

class ProductService {
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    return data || [];
  }

  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      throw error;
    }

    return data;
  }

  async getProductsByPrinter(printerId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('product_printers')
      .select(`
        product:products(*)
      `)
      .eq('printer_id', printerId)
      .order('product(name)', { ascending: true })
      .order('product(color)', { ascending: true });

    if (error) {
      console.error('Error fetching products by printer:', error);
      throw error;
    }

    return data?.map(pp => pp.product).filter(Boolean) || [];
  }

  async getProductWithSuppliers(productId: string): Promise<ProductWithSuppliers | null> {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError) {
      console.error('Error fetching product:', productError);
      throw productError;
    }

    if (!product) return null;

    const { data: suppliers, error: suppliersError } = await supabase
      .from('product_suppliers')
      .select(`
        *,
        supplier:suppliers(*),
        priceHistory:price_history(*)
      `)
      .eq('product_id', productId);

    if (suppliersError) {
      console.error('Error fetching product suppliers:', suppliersError);
      throw suppliersError;
    }

    const { data: printers, error: printersError } = await supabase
      .from('product_printers')
      .select(`
        *,
        printer:printers(*)
      `)
      .eq('product_id', productId);

    if (printersError) {
      console.error('Error fetching product printers:', printersError);
      throw printersError;
    }

    return {
      ...product,
      suppliers: suppliers || [],
      printers: ((printers || []) as any[]).map(pp => pp.printer).filter(Boolean) as Printer[]
    };
  }

  async getProductWithClients(productId: string): Promise<ProductWithClients | null> {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError) {
      console.error('Error fetching product:', productError);
      throw productError;
    }

    if (!product) return null;

    const { data: clients, error: clientsError } = await supabase
      .from('product_clients')
      .select(`
        *,
        client:clients(*),
        priceHistory:client_price_history(*)
      `)
      .eq('product_id', productId);

    if (clientsError) {
      console.error('Error fetching product clients:', clientsError);
      throw clientsError;
    }

    const { data: printers, error: printersError } = await supabase
      .from('product_printers')
      .select(`
        *,
        printer:printers(*)
      `)
      .eq('product_id', productId);

    if (printersError) {
      console.error('Error fetching product printers:', printersError);
      throw printersError;
    }

    return {
      ...product,
      clients: clients || [],
      printers: ((printers || []) as any[]).map(pp => pp.printer).filter(Boolean) as Printer[]
    };
  }

  async createProduct(productData: CreateProductData): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      throw error;
    }

    return data;
  }

  async updateProduct(id: string, productData: UpdateProductData): Promise<Product> {
    console.log('productService.updateProduct called with:', { id, productData });
    
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single();

    console.log('Supabase response:', { data, error });

    if (error) {
      console.error('Error updating product:', error);
      throw error;
    }

    return data;
  }

  async deleteProduct(id: string, replacementProductId?: string): Promise<void> {
    // Check for transaction_records referencing this product
    const { data: transactions, error: fetchError } = await supabase
      .from('transaction_records')
      .select('id')
      .eq('product_id', id);
    if (fetchError) {
      console.error('Error checking related transaction records:', fetchError);
      throw fetchError;
    }
    if (transactions && transactions.length > 0) {
      if (!replacementProductId) {
        throw new Error('Product is still referenced by transaction_records. Please reassign or provide a replacementProductId.');
      }
      // Reassign all transaction_records to the replacement product
      const { error: updateError } = await supabase
        .from('transaction_records')
        .update({ product_id: replacementProductId })
        .eq('product_id', id);
      if (updateError) {
        console.error('Error reassigning transaction records:', updateError);
        throw updateError;
      }
    }
    // Now delete the product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  async mergeProducts(primaryProductId: string, otherProductIds: string[], newAlias: string): Promise<void> {
    const primaryProduct = await this.getProductById(primaryProductId);
    if (!primaryProduct) {
        console.error('Could not fetch primary product');
        throw new Error('Could not fetch primary product');
    }

    let mergedData: UpdateProductData = {
        alias: newAlias,
        color: primaryProduct.color,
        description: primaryProduct.description
    };
    
    for (const otherId of otherProductIds) {
        const otherProduct = await this.getProductById(otherId);
        if (!otherProduct) {
            console.warn(`Could not fetch product ${otherId}, skipping.`);
            continue;
        }

        if (!mergedData.color && otherProduct.color) {
            mergedData.color = otherProduct.color;
        }
        if (!mergedData.description && otherProduct.description) {
            mergedData.description = otherProduct.description;
        }
    }

    await this.updateProduct(primaryProductId, mergedData);

    for (const otherId of otherProductIds) {
      const { error: transactionError } = await supabase
        .from('transaction_records')
        .update({ product_id: primaryProductId })
        .eq('product_id', otherId);

      if (transactionError) {
        console.error(`Error re-assigning transaction records from ${otherId}:`, transactionError);
      }
      
      const linkingTables = [
        { name: 'product_printers', conflictColumn: 'printer_id' },
        { name: 'product_suppliers', conflictColumn: 'supplier_id' },
        { name: 'product_clients', conflictColumn: 'client_id' }
      ];

      for (const tableInfo of linkingTables) {
        const { data: relatedItems, error: fetchError } = await supabase
          .from(tableInfo.name as any)
          .select('*')
          .eq('product_id', otherId);
        
        if (fetchError) {
          console.error(`Error fetching related items from ${tableInfo.name} for product ${otherId}:`, fetchError);
          continue;
        }

        if (relatedItems && relatedItems.length > 0) {
          const itemsToUpsert = relatedItems.map((item: any) => {
            const { id, product_id, ...rest } = item;
            return { ...rest, product_id: primaryProductId };
          });
          
          const { error: upsertError } = await supabase
            .from(tableInfo.name as any)
            .upsert(itemsToUpsert, { onConflict: `product_id, ${tableInfo.conflictColumn}` });

          if (upsertError) {
            console.error(`Error upserting relations into ${tableInfo.name}:`, upsertError);
          }
        }
      }
    }

    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .in('id', otherProductIds);

    if (deleteError) {
      console.error('Error deleting merged products:', deleteError);
      throw deleteError;
    }
  }

  // Fixed addSupplierToProduct to properly handle both existing and new suppliers
  async addSupplierToProduct(
    productId: string, 
    supplierData: { name: string; contact_email?: string; phone?: string; notes?: string }, 
    price: number
  ): Promise<ProductSupplier> {
    // First, check if supplier exists or create new one
    let supplierId: string;
    
    const { data: existingSupplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('name', supplierData.name)
      .single();

    if (existingSupplier) {
      supplierId = existingSupplier.id;
    } else {
      // Create new supplier
      const { data: newSupplier, error: supplierError } = await supabase
        .from('suppliers')
        .insert([supplierData])
        .select()
        .single();

      if (supplierError) {
        console.error('Error creating supplier:', supplierError);
        throw supplierError;
      }

      supplierId = newSupplier.id;
    }

    // Debug: Log authentication context
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Current user context:', user);
    console.log('User error:', userError);
    console.log('User role:', user?.role);
    console.log('User metadata:', user?.user_metadata);
    
    // Debug: Check the session and headers
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Current session:', session);
    console.log('Session error:', sessionError);
    console.log('Access token:', session?.access_token);
    
    // Debug: Check what we're trying to insert
    const insertData = {
      product_id: productId,
      supplier_id: supplierId,
      current_price: price
    };
    console.log('Attempting to insert:', insertData);

    // Debug: Test a simple SELECT first to see if basic API access works
    const { data: testData, error: testError } = await supabase
      .from('product_suppliers')
      .select('*')
      .limit(1);
    
    console.log('Test SELECT result:', testData);
    console.log('Test SELECT error:', testError);

    // Now create the product-supplier relationship
    console.log('Making INSERT request...');
    const { data, error } = await supabase
      .from('product_suppliers')
      .insert([insertData])
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .single();

    if (error) {
      console.error('Error adding supplier to product:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      
      // Additional debug: Try to understand the specific error
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      
      throw error;
    }

    return data;
  }

  async updateSupplierPrice(productSupplierId: string, newPrice: number, note?: string): Promise<ProductSupplier> {
    const { data, error } = await supabase
      .from('product_suppliers')
      .update({ current_price: newPrice })
      .eq('id', productSupplierId)
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .single();

    if (error) {
      console.error('Error updating supplier price:', error);
      throw error;
    }

    // Add price history entry if note is provided
    if (note) {
      await supabase
        .from('price_history')
        .insert([{
          product_supplier_id: productSupplierId,
          price: newPrice,
          note
        }]);
    }

    return data;
  }

  async removeSupplierFromProduct(productSupplierId: string): Promise<void> {
    const { error } = await supabase
      .from('product_suppliers')
      .delete()
      .eq('id', productSupplierId);

    if (error) {
      console.error('Error removing supplier from product:', error);
      throw error;
    }
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .order('name');

    if (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }

    return data || [];
  }

  async searchProducts(searchTerm: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('name');

    if (error) {
      console.error('Error searching products:', error);
      throw error;
    }

    return data || [];
  }

  async getSupplierPriceHistory(productSupplierId: string): Promise<PriceHistory[]> {
    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .eq('product_supplier_id', productSupplierId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching price history:', error);
      throw error;
    }

    return (data || []) as any;
  }

  async addClientToProduct(
    productId: string, 
    clientData: { name: string; contact_email?: string; phone?: string; notes?: string }, 
    quotedPrice: number,
    marginPercentage?: number
  ): Promise<any> {
    // First, check if client exists or create new one
    let clientId: string;
    
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('name', clientData.name)
      .single();

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      // Create new client
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();

      if (clientError) {
        console.error('Error creating client:', clientError);
        throw clientError;
      }

      clientId = newClient.id;
    }

    // Now create the product-client relationship
    const { data, error } = await supabase
      .from('product_clients')
      .insert([{
        product_id: productId,
        client_id: clientId,
        quoted_price: quotedPrice,
        margin_percentage: marginPercentage
      }])
      .select(`
        *,
        client:clients(*)
      `)
      .single();

    if (error) {
      console.error('Error adding client to product:', error);
      throw error;
    }

    return data;
  }
}

export const productService = new ProductService();
