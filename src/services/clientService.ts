import { supabase } from '@/integrations/supabase/client';
import { Client, ProductClient, ClientPriceHistory } from '@/types/database';

export const clientService = {
  // Get all clients
  async getClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        printers: printer_assignments (
          *,
          printer:printers (
            *,
            product_printers(product_id)
          )
        )
      `)
      .order('name');
    
    if (error) throw error;
    // The data structure now includes product_ids but not the full product object
    // to keep the query fast and reliable. The full product object will be looked up on the client-side.
    return data || [];
  },

  // Find client by email address
  async findClientByEmail(email: string): Promise<Client | null> {
    if (!email) return null;
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('contact_email', email.toLowerCase().trim())
      .single();
    
    if (error) {
      // If no client found, error.code will be 'PGRST116'
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    
    return data;
  },

  // Get client by ID
  async getClientById(clientId: string): Promise<Client | null> {
    if (!clientId) return null;
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();
    
    if (error) {
      // If no client found, error.code will be 'PGRST116'
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    
    return data;
  },

  // Create a new client
  async createClient(clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update a client
  async updateClient(clientId: string, clientData: Partial<Client>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update(clientData)
      .eq('id', clientId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete a client
  async deleteClient(clientId: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);
    
    if (error) throw error;
  },

  // Add client to product with quoted price
  async addClientToProduct(
    productId: string,
    clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>,
    quotedPrice: number,
    marginPercentage?: number
  ): Promise<ProductClient> {
    // First, check if client already exists
    let client: Client;
    const { data: existingClients } = await supabase
      .from('clients')
      .select('*')
      .eq('name', clientData.name);

    if (existingClients && existingClients.length > 0) {
      client = existingClients[0];
    } else {
      // Create new client
      client = await this.createClient(clientData);
    }

    // Create product-client relationship
    const { data, error } = await supabase
      .from('product_clients')
      .insert({
        product_id: productId,
        client_id: client.id,
        quoted_price: quotedPrice,
        margin_percentage: marginPercentage || 0,
      })
      .select('*, client:clients(*)')
      .single();

    if (error) throw error;
    return data;
  },

  // Update client quote price
  async updateClientQuote(
    productClientId: string,
    quotedPrice: number,
    marginPercentage?: number,
    note?: string
  ): Promise<ProductClient> {
    const { data, error } = await supabase
      .from('product_clients')
      .update({
        quoted_price: quotedPrice,
        margin_percentage: marginPercentage,
      })
      .eq('id', productClientId)
      .select('*, client:clients(*)')
      .single();

    if (error) throw error;
    return data;
  },

  // Remove client from product
  async removeClientFromProduct(productClientId: string): Promise<void> {
    const { error } = await supabase
      .from('product_clients')
      .delete()
      .eq('id', productClientId);

    if (error) throw error;
  },

  // Get clients for a specific product
  async getProductClients(productId: string): Promise<(ProductClient & { client: Client; priceHistory: ClientPriceHistory[] })[]> {
    const { data, error } = await supabase
      .from('product_clients')
      .select(`
        *,
        client:clients(*),
        priceHistory:client_price_history(*)
      `)
      .eq('product_id', productId)
      .order('created_at');

    if (error) throw error;
    return (data || []) as any;
  },

  // Get client price history
  async getClientPriceHistory(productClientId: string): Promise<ClientPriceHistory[]> {
    const { data, error } = await supabase
      .from('client_price_history')
      .select('*')
      .eq('product_client_id', productClientId)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return (data || []) as any;
  },

  // Merge multiple clients into one
  async mergeClients(
    clientIds: string[],
    mergedClientData: {
      name: string;
      contact_email?: string;
      phone?: string;
      notes?: string;
    }
  ): Promise<Client> {
    console.log('Starting client merge process...', { clientIds, mergedClientData });

    if (clientIds.length < 2) {
      throw new Error('At least 2 clients are required for merging');
    }

    // Create the new merged client
    const mergedClient = await this.createClient(mergedClientData);
    console.log('Created merged client:', mergedClient);

    // Get all product-client relationships for the clients being merged
    const { data: productClients, error: productClientsError } = await supabase
      .from('product_clients')
      .select('*')
      .in('client_id', clientIds);

    if (productClientsError) {
      console.error('Error fetching product clients:', productClientsError);
      throw productClientsError;
    }

    console.log('Found product clients to merge:', productClients);

    // Group by product_id to handle duplicates
    const productClientMap = new Map<string, any[]>();
    productClients?.forEach(pc => {
      if (!productClientMap.has(pc.product_id)) {
        productClientMap.set(pc.product_id, []);
      }
      productClientMap.get(pc.product_id)!.push(pc);
    });

    // For each product, merge client relationships
    for (const [productId, clientRelations] of productClientMap) {
      console.log(`Processing product ${productId} with ${clientRelations.length} client relations`);

      if (clientRelations.length === 1) {
        // Only one relation for this product, just update the client_id
        const relation = clientRelations[0];
        const { error: updateError } = await supabase
          .from('product_clients')
          .update({ client_id: mergedClient.id })
          .eq('id', relation.id);

        if (updateError) {
          console.error('Error updating product client relation:', updateError);
          throw updateError;
        }
      } else {
        // Multiple relations for same product, need to merge them
        // Keep the one with the most recent updated_at (or highest price)
        const primaryRelation = clientRelations.reduce((best, current) => {
          if (current.quoted_price > best.quoted_price) return current;
          if (current.quoted_price === best.quoted_price && 
              new Date(current.updated_at) > new Date(best.updated_at)) return current;
          return best;
        });

        // Update the primary relation to use the merged client
        const { error: updateError } = await supabase
          .from('product_clients')
          .update({ client_id: mergedClient.id })
          .eq('id', primaryRelation.id);

        if (updateError) {
          console.error('Error updating primary relation:', updateError);
          throw updateError;
        }

        // Delete the duplicate relations
        const duplicateIds = clientRelations
          .filter(r => r.id !== primaryRelation.id)
          .map(r => r.id);

        if (duplicateIds.length > 0) {
          const { error: deleteError } = await supabase
            .from('product_clients')
            .delete()
            .in('id', duplicateIds);

          if (deleteError) {
            console.error('Error deleting duplicate relations:', deleteError);
            throw deleteError;
          }
        }
      }
    }

    // Delete the original clients
    const { error: deleteError } = await supabase
      .from('clients')
      .delete()
      .in('id', clientIds);

    if (deleteError) {
      console.error('Error deleting original clients:', deleteError);
      throw deleteError;
    }

    console.log('Client merge completed successfully');
    return mergedClient;
  },

  // Get all department locations for a client, combining department and location
  async getDepartmentsByClient(clientId: string): Promise<{ id: string; name: string; location?: string }[]> {
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select(`id, name, locations:departments_location(id, name)`)
      .eq('client_id', clientId)
      .order('name');
    if (deptError) throw deptError;
    if (!departments) return [];
    // Flatten to array of { id, name: 'Department - Location', location }
    const result: { id: string; name: string; location?: string }[] = [];
    for (const dept of departments) {
      for (const loc of dept.locations || []) {
        result.push({
          id: loc.id,
          name: `${dept.name} - ${loc.name}`,
          location: loc.name
        });
      }
    }
    return result;
  },
};
