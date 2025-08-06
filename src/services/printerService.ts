import { supabase } from '@/integrations/supabase/client';
import { Printer } from '@/types/database';

export const printerService = {
  // Get all printers (only active ones)
  async getPrinters(): Promise<Printer[]> {
    const { data, error } = await supabase
      .from('printers')
      .select('*')
      .eq('status', 'active')
      .order('name');
    if (error) throw error;
    return data || [];
  },

  // Get only assigned printers (printers that have assignments to clients)
  async getAssignedPrinters(): Promise<any[]> {
    const { data, error } = await supabase
      .from('printers')
      .select(`
        *,
        printer_assignments!inner(
          id,
          client_id,
          status,
          serial_number,
          department_location:departments_location(
            name,
            department:departments (
                name
            )
          ),
          clients (
            id,
            name
          )
        )
      `)
      .eq('status', 'active')
      .eq('printer_assignments.status', 'active')
      .order('name');
    
    if (error) {
      console.error('Error fetching assigned printers:', error);
      throw error;
    }
    
    return data || [];
  },

  // Search printers by name (only active ones)
  async searchPrinters(searchTerm: string): Promise<Printer[]> {
    const { data, error } = await supabase
      .from('printers')
      .select('*')
      .eq('status', 'active')
      .ilike('name', `%${searchTerm}%`)
      .order('name');
    if (error) throw error;
    return data || [];
  },

  // Search only assigned printers by name
  async searchAssignedPrinters(searchTerm: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('printers')
      .select(`
        *,
        printer_assignments!inner(
          id,
          client_id,
          status,
          serial_number,
          clients(id, name)
        )
      `)
      .eq('status', 'active')
      .eq('printer_assignments.status', 'active')
      .ilike('name', `%${searchTerm}%`)
      .order('name');
    
    if (error) {
      console.error('Error searching assigned printers:', error);
      throw error;
    }
    
    return data || [];
  },

  async createPrinter(printerData: Omit<Printer, 'id' | 'created_at' | 'updated_at'>): Promise<Printer> {
    const { data, error } = await supabase
      .from('printers')
      .insert(printerData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating printer:', error);
      throw error;
    }
    
    return data;
  },

  async updatePrinter(printerId: string, printerData: Partial<Omit<Printer, 'id' | 'created_at' | 'updated_at'>>): Promise<Printer> {
    const { data, error } = await supabase
      .from('printers')
      .update(printerData)
      .eq('id', printerId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating printer:', error);
      throw error;
    }
    
    return data;
  },

  async findOrCreatePrinter(name: string): Promise<Printer> {
    // First, try to find existing active printer
    const { data: existingPrinter } = await supabase
      .from('printers')
      .select('*')
      .eq('name', name.trim())
      .eq('status', 'active')
      .single();
    
    if (existingPrinter) {
      return existingPrinter;
    }
    
    // If not found, create new printer
    return this.createPrinter({ name: name.trim() });
  },

  async addPrintersToProduct(productId: string, printerNames: string[]): Promise<void> {
    // Remove existing printer associations
    await supabase
      .from('product_printers')
      .delete()
      .eq('product_id', productId);

    if (printerNames.length === 0) return;

    // Find or create printers and get their IDs
    const printerIds: string[] = [];
    for (const name of printerNames) {
      const printer = await this.findOrCreatePrinter(name);
      printerIds.push(printer.id);
    }

    // Create product-printer associations
    const productPrinters = printerIds.map(printerId => ({
      product_id: productId,
      printer_id: printerId
    }));

    const { error } = await supabase
      .from('product_printers')
      .insert(productPrinters);

    if (error) {
      console.error('Error adding printers to product:', error);
      throw error;
    }
  },

  async updatePrinterProducts(printerId: string, productIds: string[]): Promise<void> {
    // Remove existing product associations for this printer
    await supabase
      .from('product_printers')
      .delete()
      .eq('printer_id', printerId);

    if (productIds.length === 0) return;

    // Create new printer-product associations
    const printerProducts = productIds.map(productId => ({
      printer_id: printerId,
      product_id: productId
    }));

    const { error } = await supabase
      .from('product_printers')
      .insert(printerProducts);

    if (error) {
      console.error('Error updating printer products:', error);
      throw error;
    }
  },

  async getProductPrinters(productId: string): Promise<Printer[]> {
    const { data, error } = await supabase
      .from('product_printers')
      .select(`
        printer:printers(*)
      `)
      .eq('product_id', productId);

    if (error) {
      console.error('Error fetching product printers:', error);
      throw error;
    }

    return data?.map(pp => pp.printer).filter(Boolean) || [];
  },

  async deletePrinter(printerId: string, deletedBy?: string, reason?: string): Promise<void> {
    try {
      // Soft delete: only update status to 'deleted'
      const { error: updateError } = await supabase
        .from('printers')
        .update({ 
          status: 'deleted',
          is_available: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', printerId);
      
      if (updateError) {
        console.error('Error updating printer status:', updateError);
        throw updateError;
      }
      
      console.log(`Printer ${printerId} soft deleted successfully`);
    } catch (error) {
      console.error('Error in soft delete printer:', error);
      throw error;
    }
  },

  // Soft delete printer: set is_available to false
  async softDeletePrinter(printerId: string, deletedBy?: string, reason?: string): Promise<void> {
    const { error } = await supabase
      .from('printers')
      .update({ is_available: false })
      .eq('id', printerId);
    if (error) {
      console.error('Error soft deleting printer:', error);
      throw error;
    }
  },

  // Get all available printers (is_available = true and active status)
  async getAvailablePrinters(): Promise<Printer[]> {
    const { data, error } = await supabase
      .from('printers')
      .select('*')
      .eq('is_available', true)
      .eq('status', 'active')
      .order('name');
    if (error) {
      console.error('Error fetching available printers:', error);
      throw error;
    }
    return data || [];
  },

  // Merge multiple printers into a primary printer
  async mergePrinters(primaryId: string, mergeIds: string[]): Promise<void> {
    if (mergeIds.length === 0) return;
    // 1. Fetch all printers
    const { data: allPrinters, error: fetchError } = await supabase
      .from('printers')
      .select('*')
      .in('id', [primaryId, ...mergeIds]);
    if (fetchError) throw fetchError;
    const primary = allPrinters.find((p: any) => p.id === primaryId);
    const toMerge = allPrinters.filter((p: any) => mergeIds.includes(p.id));
    // 2. Collect aliases
    const aliasSet = new Set<string>();
    for (const p of toMerge) {
      if (p.name) aliasSet.add(p.name);
      if (p.model) aliasSet.add(p.model);
      if (p.aliases) p.aliases.split(',').forEach((a: string) => aliasSet.add(a.trim()));
    }
    if (primary.aliases) primary.aliases.split(',').forEach((a: string) => aliasSet.add(a.trim()));
    // Remove primary's own name/model from aliases
    aliasSet.delete(primary.name);
    if (primary.model) aliasSet.delete(primary.model);
    // 3. Update primary printer's aliases
    await supabase
      .from('printers')
      .update({ aliases: Array.from(aliasSet).join(', ') })
      .eq('id', primaryId);
    // 4. Update references in assignments/products/etc.
    // Printer assignments
    await supabase
      .from('printer_assignments')
      .update({ printer_id: primaryId })
      .in('printer_id', mergeIds);
    // Product printers
    await supabase
      .from('product_printers')
      .update({ printer_id: primaryId })
      .in('printer_id', mergeIds);
    // 5. Delete merged printers
    await supabase
      .from('printers')
      .delete()
      .in('id', mergeIds);
  },

  // Get products associated with a printer by printer name
  async getProductsByPrinterName(printerName: string): Promise<any[]> {
    try {
      // First, find the printer by name (including aliases)
      const { data: printers, error: printerError } = await supabase
        .from('printers')
        .select('id')
        .or(`name.ilike.%${printerName}%,aliases.ilike.%${printerName}%`);

      if (printerError) {
        console.error('Error finding printer:', printerError);
        throw printerError;
      }

      if (!printers || printers.length === 0) {
        return [];
      }

      // Get all printer IDs that match
      const printerIds = printers.map(p => p.id);

      // Find products linked to these printers
      const { data: productPrinters, error: linkError } = await supabase
        .from('product_printers')
        .select(`
          product:products(
            id,
            name,
            sku,
            category,
            description,
            color,
            alias,
            created_at,
            updated_at
          )
        `)
        .in('printer_id', printerIds);

      if (linkError) {
        console.error('Error finding linked products:', linkError);
        throw linkError;
      }

      // Extract products from the nested structure
      const products = productPrinters
        ?.map(pp => pp.product)
        .filter(Boolean) || [];

      return products;
    } catch (error) {
      console.error('Error getting products by printer name:', error);
      throw error;
    }
  },

  // Get printers assigned to a department location
  async getPrintersByDepartmentLocation(departmentLocationId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('printer_assignments')
      .select(`*, printer:printers(*)`)
      .eq('department_location_id', departmentLocationId)
      .eq('status', 'active');
    if (error) {
      console.error('Error fetching printers for department location:', error);
      throw error;
    }
    // Each row: { ...assignment, printer: { ...printer fields } }
    return data || [];
  },

  // Get all printers assigned to a client, with assignment and location info
  async getPrintersByClient(clientId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('printer_assignments')
      .select(`*, printer:printers(*), location:departments_location(*)`)
      .eq('client_id', clientId)
      .eq('status', 'active');
    if (error) {
      console.error('Error fetching printers for client:', error);
      throw error;
    }
    // Each row: { ...assignment, printer: { ...printer fields }, location: { ...location fields } }
    return data || [];
  },

  // Get all products linked to a client, with product details and printers that use each product
  async getProductsByClient(clientId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('product_clients')
      .select(`*, product:products(*, product_printers(printer:printers(*)))`)
      .eq('client_id', clientId);
    if (error) {
      console.error('Error fetching products for client:', error);
      throw error;
    }
    // Each row: { ...product_client, product: { ...product fields, product_printers: [{ printer: {...} }] } }
    return data || [];
  },

  // Unassign a printer by assignment ID - Phase 1: Basic client unassignment
  async unassignPrinter(assignmentId: string): Promise<boolean> {
    try {
      // For complete unassignment from client, set all assignment fields to null and status to 'available'
      const { error: updateError } = await supabase
        .from('printer_assignments')
        .update({ 
          status: 'available',
          client_id: null,
          department_location_id: null,
          department: null,
          location: null,
          is_unassigned: true,
          reason_for_change: 'Unassigned from client - made available',
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (updateError) {
        console.error('Error updating assignment status:', updateError);
        throw new Error(updateError.message);
      }

      console.log('Printer successfully unassigned and made available');
      return true;
    } catch (error) {
      console.error('Error in unassignPrinter:', error);
      throw error;
    }
  },

  // Phase 2: Multi-level unassignment methods
  async unassignFromLocation(assignmentId: string): Promise<boolean> {
    try {
      // Fetch the assignment to get the department name from the joined departments_location
      const { data: assignment, error: fetchError } = await supabase
        .from('printer_assignments')
        .select('departments_location(department_id), id')
        .eq('id', assignmentId)
        .single();

      if (fetchError) throw fetchError;

      let departmentName: string | null = null;

      if (assignment?.departments_location?.department_id) {
        // Fetch the department name using the department_id
        const { data: department, error: deptError } = await supabase
          .from('departments')
          .select('name')
          .eq('id', assignment.departments_location.department_id)
          .single();
        if (deptError) throw deptError;
        departmentName = department?.name || null;
      }

      // Update the assignment: clear location, preserve department
      const { error: updateError } = await supabase
        .from('printer_assignments')
        .update({ 
          department_location_id: null,
          location: null,
          department: departmentName, // <-- preserve department for fallback
          reason_for_change: 'Unassigned from location - remains with department',
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (updateError) {
        console.error('Error unassigning from location:', updateError);
        throw new Error(updateError.message);
      }

      console.log('Printer successfully unassigned from location');
      return true;
    } catch (error) {
      console.error('Error in unassignFromLocation:', error);
      throw error;
    }
  },

  async unassignFromDepartment(assignmentId: string): Promise<boolean> {
    try {
      // Remove department and location assignment but keep client
      const { error: updateError } = await supabase
        .from('printer_assignments')
        .update({ 
          department_location_id: null,
          department: null,
          location: null,
          reason_for_change: 'Unassigned from department - remains with client',
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (updateError) {
        console.error('Error unassigning from department:', updateError);
        throw new Error(updateError.message);
      }

      console.log('Printer successfully unassigned from department');
      return true;
    } catch (error) {
      console.error('Error in unassignFromDepartment:', error);
      throw error;
    }
  },

  async unassignFromClient(assignmentId: string): Promise<boolean> {
    // For complete client unassignment, use the updated unassignPrinter method
    return this.unassignPrinter(assignmentId);
  },

  // Create a printer assignment (for inventory)
  async createPrinterAssignment(assignmentData: any): Promise<any> {
    const { data, error } = await supabase
      .from('printer_assignments')
      .insert(assignmentData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating printer assignment:', error);
      throw error;
    }
    
    return data;
  },

  // Get unique series values
  async getUniqueSeries(manufacturer?: string): Promise<string[]> {
    try {
      let query = supabase
        .from('printers')
        .select('series')
        .not('series', 'is', null)
        .neq('series', '');

      // Filter by manufacturer if provided
      if (manufacturer && manufacturer.trim() !== '') {
        query = query.eq('manufacturer', manufacturer);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Extract unique series values
      const uniqueSeries = [...new Set(data.map(item => item.series).filter(series => series && series.trim() !== ''))];
      
      // Sort alphabetically
      return uniqueSeries.sort();
    } catch (error) {
      console.error('Error fetching unique series:', error);
      throw error;
    }
  },
};
