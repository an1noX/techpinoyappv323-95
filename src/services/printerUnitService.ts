import { supabase } from '@/integrations/supabase/client';
import { PrinterUnit, CreatePrinterUnitData, UpdatePrinterUnitData } from '@/types/printer-unit';

export const printerUnitService = {
  // Get all printer units with comprehensive details
  async getPrinterUnits(): Promise<PrinterUnit[]> {
    const { data, error } = await supabase
      .from('printer_units')
      .select(`
        *,
        printer:printers(
          id,
          name,
          manufacturer,
          model,
          series,
          image_url
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching printer units:', error);
      throw error;
    }
    
    return (data || []) as PrinterUnit[];
  },

  // Get comprehensive printer unit data including assignments and visibility
  async getEnhancedPrinterUnits(): Promise<any[]> {
    // Get printer units with basic info
    const { data: units, error: unitsError } = await supabase
      .from('printer_units')
      .select(`
        *,
        printer:printers(
          id,
          name,
          manufacturer,
          model,
          series,
          image_url
        )
      `)
      .order('created_at', { ascending: false });

    if (unitsError) {
      console.error('Error fetching printer units:', unitsError);
      throw unitsError;
    }

    // Get assignments for these printer units
    const printerIds = units?.map(unit => unit.printer_id) || [];
    const { data: assignments } = await supabase
      .from('printer_assignments')
      .select(`
        *,
        printer_id,
        clients(id, name),
        departments_location(
          id,
          name,
          departments(id, name)
        )
      `)
      .in('printer_id', printerIds);

    // Get visibility for these printers
    const { data: visibility } = await supabase
      .from('printer_visibility')
      .select(`
        *,
        printer_id,
        clients(id, name)
      `)
      .in('printer_id', printerIds);

    // Combine the data
    const enhancedUnits = units?.map(unit => ({
      ...unit,
      assignments: assignments?.filter(a => a.printer_id === unit.printer_id) || [],
      visibility: visibility?.filter(v => v.printer_id === unit.printer_id) || []
    })) || [];

    return enhancedUnits;
  },

  // Get printer units by status with comprehensive details
  async getPrinterUnitsByStatus(status: PrinterUnit['status']): Promise<PrinterUnit[]> {
    const { data, error } = await supabase
      .from('printer_units')
      .select(`
        *,
        printer:printers(
          id,
          name,
          manufacturer,
          model,
          series,
          image_url
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(`Error fetching ${status} printer units:`, error);
      throw error;
    }
    
    return (data || []) as PrinterUnit[];
  },

  // Get printer units by printer model
  async getPrinterUnitsByPrinterId(printerId: string): Promise<PrinterUnit[]> {
    const { data, error } = await supabase
      .from('printer_units')
      .select(`
        *,
        printer:printers(
          id,
          name,
          manufacturer,
          model,
          series,
          image_url
        )
      `)
      .eq('printer_id', printerId)
      .order('serial_number');
    
    if (error) {
      console.error('Error fetching printer units by printer ID:', error);
      throw error;
    }
    
    return (data || []) as PrinterUnit[];
  },

  // Create new printer unit
  async createPrinterUnit(unitData: CreatePrinterUnitData): Promise<PrinterUnit> {
    const { data, error } = await supabase
      .from('printer_units')
      .insert(unitData)
      .select(`
        *,
        printer:printers(
          id,
          name,
          manufacturer,
          model,
          series,
          image_url
        )
      `)
      .single();
    
    if (error) {
      console.error('Error creating printer unit:', error);
      throw error;
    }
    
    return data as PrinterUnit;
  },

  // Update printer unit
  async updatePrinterUnit(unitId: string, updateData: UpdatePrinterUnitData): Promise<PrinterUnit> {
    const { data, error } = await supabase
      .from('printer_units')
      .update(updateData)
      .eq('id', unitId)
      .select(`
        *,
        printer:printers(
          id,
          name,
          manufacturer,
          model,
          series,
          image_url
        )
      `)
      .single();
    
    if (error) {
      console.error('Error updating printer unit:', error);
      throw error;
    }
    
    return data as PrinterUnit;
  },

  // Delete printer unit
  async deletePrinterUnit(unitId: string): Promise<void> {
    const { error } = await supabase
      .from('printer_units')
      .delete()
      .eq('id', unitId);
    
    if (error) {
      console.error('Error deleting printer unit:', error);
      throw error;
    }
  },

  // Search printer units
  async searchPrinterUnits(searchTerm: string): Promise<PrinterUnit[]> {
    const { data, error } = await supabase
      .from('printer_units')
      .select(`
        *,
        printer:printers(
          id,
          name,
          manufacturer,
          model,
          series,
          image_url
        )
      `)
      .or(`
        serial_number.ilike.%${searchTerm}%,
        asset_tag.ilike.%${searchTerm}%,
        location.ilike.%${searchTerm}%,
        printer.name.ilike.%${searchTerm}%
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error searching printer units:', error);
      throw error;
    }
    
    return (data || []) as PrinterUnit[];
  },

  // Get inventory summary
  async getInventorySummary(): Promise<{
    total: number;
    available: number;
    assigned: number;
    maintenance: number;
    retired: number;
    rented: number;
  }> {
    const { data, error } = await supabase
      .from('printer_units')
      .select('status');
    
    if (error) {
      console.error('Error fetching inventory summary:', error);
      throw error;
    }
    
    const summary = {
      total: data.length,
      available: 0,
      assigned: 0,
      maintenance: 0,
      retired: 0,
      rented: 0,
    };
    
    data.forEach(unit => {
      summary[unit.status as keyof typeof summary]++;
    });
    
    return summary;
  },

  // Get all clients for assignment/visibility management
  async getClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name')
      .eq('status', 'active')
      .order('name');
    
    if (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
    
    return data || [];
  },

  // Get all printers for adding units
  async getPrinters() {
    const { data, error } = await supabase
      .from('printers')
      .select('id, name, manufacturer, model, series')
      .eq('status', 'active')
      .order('name');
    
    if (error) {
      console.error('Error fetching printers:', error);
      throw error;
    }
    
    return data || [];
  },

  // Manage printer visibility
  async updatePrinterVisibility(printerId: string, clientIds: string[]): Promise<void> {
    // First, remove existing visibility entries for this printer
    await supabase
      .from('printer_visibility')
      .delete()
      .eq('printer_id', printerId);

    // Then add new visibility entries
    if (clientIds.length > 0) {
      const visibilityEntries = clientIds.map(clientId => ({
        printer_id: printerId,
        client_id: clientId
      }));

      const { error } = await supabase
        .from('printer_visibility')
        .insert(visibilityEntries);

      if (error) {
        console.error('Error updating printer visibility:', error);
        throw error;
      }
    }
  },
};