
import { supabase } from '@/integrations/supabase/client';
import { sqliteService } from './sqliteService';
import { Printer } from '@/types/database';

export const offlinePrinterService = {
  async getPrinters(): Promise<Printer[]> {
    try {
      // Try online first
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('printers')
          .select('*')
          .order('name');
        
        if (!error && data) {
          return data;
        }
      }
    } catch (err) {
      console.log('Online fetch failed, using offline data');
    }

    // Fallback to offline SQLite data
    if (!sqliteService.isReady) {
      await sqliteService.initialize();
    }
    
    const records = await sqliteService.getRecords('printers');
    return records || [];
  },

  async getAssignedPrinters(): Promise<any[]> {
    try {
      // Try online first with full join
      if (navigator.onLine) {
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
                department:departments(name)
              ),
              clients(id, name)
            )
          `)
          .eq('printer_assignments.status', 'active')
          .order('name');
        
        if (!error && data) {
          return data;
        }
      }
    } catch (err) {
      console.log('Online fetch failed, using offline data');
    }

    // Fallback to offline data with manual joins
    if (!sqliteService.isReady) {
      await sqliteService.initialize();
    }
    
    // Get all printers
    const printers = await sqliteService.getRecords('printers');
    
    // Get active assignments
    const assignments = await sqliteService.getRecords('printer_assignments', { status: 'active' });
    
    // Filter printers that have active assignments
    const assignedPrinters = printers.filter(printer => 
      assignments.some(assignment => assignment.printer_id === printer.id)
    );

    return assignedPrinters || [];
  },

  async getAvailablePrinters(): Promise<Printer[]> {
    try {
      // Try online first
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('printers')
          .select('*')
          .eq('is_available', true)
          .order('name');
        
        if (!error && data) {
          return data;
        }
      }
    } catch (err) {
      console.log('Online fetch failed, using offline data');
    }

    // Fallback to offline data
    if (!sqliteService.isReady) {
      await sqliteService.initialize();
    }
    
    const records = await sqliteService.getRecords('printers', { is_available: 1 });
    return records || [];
  }
};
