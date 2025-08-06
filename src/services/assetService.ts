import { supabase } from '@/integrations/supabase/client';
import { Printer, PrinterAssignment as BasePrinterAssignment, Client } from '@/types/database';

export interface CreateAssignmentData {
  printer_id: string;
  client_id: string;
  serial_number: string;
  department: string;
  deployment_date: string;
  usage_type: 'rental' | 'service_unit' | 'client_owned';
  monthly_price?: number;
  has_security_deposit: boolean;
  security_deposit_amount?: number;
  notes?: string;
}

export interface UpdateAssignmentData {
  serial_number?: string;
  department?: string;
  deployment_date?: string;
  usage_type?: 'rental' | 'service_unit' | 'client_owned';
  monthly_price?: number;
  has_security_deposit?: boolean;
  security_deposit_amount?: number;
  notes?: string;
  status?: 'active' | 'inactive' | 'returned' | 'undeployed';
  department_location_id?: string; // <-- Added for transfer
}

export interface PrinterAssignment extends BasePrinterAssignment {
  printer?: Printer;
  client?: Client;
}

export interface MaintenanceSchedule {
  id: string;
  printer_id: string;
  maintenance_type: string;
  scheduled_date: string;
  description?: string;
  status: 'pending' | 'completed' | 'overdue';
  completed_date?: string;
  performed_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceHistory {
  id: string;
  printer_id: string;
  assignment_id?: string;
  maintenance_type: string;
  action_description: string;
  parts_replaced?: string[];
  notes?: string;
  status_before?: string;
  status_after?: string;
  performed_by?: string;
  performed_at: string;
  issue_reported_date?: string;
  completed_date?: string;
  cost?: number;
  created_at: string;
  updated_at: string;
}

export interface PrinterHistory {
  id: string;
  printer_id: string;
  action_type: 'assigned' | 'transferred' | 'repair' | 'maintenance' | 'returned';
  description: string;
  performed_by?: string;
  timestamp: string;
  related_assignment_id?: string;
}

export interface PrinterDocument {
  id: string;
  printer_id: string;
  document_type: 'contract' | 'accountability' | 'manual' | 'warranty' | 'other';
  title: string;
  file_path?: string;
  file_url?: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by?: string;
  uploaded_at: string;
}

export const assetService = {
  async getPrinters(): Promise<Printer[]> {
    const { data, error } = await supabase
      .from('printers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createPrinter(printer: Omit<Printer, 'id' | 'created_at' | 'updated_at'>): Promise<Printer> {
    const { data, error } = await supabase
      .from('printers')
      .insert(printer)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePrinter(id: string, updates: Partial<Printer>): Promise<Printer> {
    const { data, error } = await supabase
      .from('printers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePrinter(id: string): Promise<void> {
    const { error } = await supabase
      .from('printers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async createAssignment(data: CreateAssignmentData): Promise<PrinterAssignment> {
    const { data: assignment, error } = await supabase
      .from('printer_assignments')
      .insert({
        printer_id: data.printer_id,
        client_id: data.client_id,
        serial_number: data.serial_number,
        department: data.department,
        department_location_id: null,
        deployment_date: data.deployment_date,
        usage_type: data.usage_type,
        monthly_price: data.monthly_price,
        has_security_deposit: data.has_security_deposit,
        security_deposit_amount: data.security_deposit_amount,
        notes: data.notes,
        status: 'available'
      })
      .select(`
        *,
        printer:printers(*),
        client:clients(*)
      `)
      .single();

    if (error) throw error;
    return assignment as unknown as PrinterAssignment;
  },

  async updateAssignment(id: string, data: UpdateAssignmentData): Promise<PrinterAssignment> {
    const { data: assignment, error } = await supabase
      .from('printer_assignments')
      .update(data)
      .eq('id', id)
      .select(`
        *,
        printer:printers(*),
        client:clients(*)
      `)
      .single();

    if (error) throw error;
    return assignment as unknown as PrinterAssignment;
  },

  async deleteAssignment(id: string): Promise<void> {
    try {
      console.log(`Attempting to delete assignment: ${id}`);
      
      // Step 1: Check if assignment exists
      const { data: assignment, error: checkError } = await supabase
        .from('printer_assignments')
        .select('id')
        .eq('id', id)
        .single();
        
      if (checkError || !assignment) {
        throw new Error('Assignment not found');
      }
      
      // Step 2: Disable the trigger that's causing the issue
      console.log('Disabling triggers to prevent foreign key constraint violations...');
      const { error: disableError } = await supabase.rpc('disable_printer_assignment_history_trigger');
      if (disableError) {
        console.warn('Could not disable trigger, proceeding anyway:', disableError);
      }
      
      // Step 3: Delete all references to this assignment
      console.log('Deleting all references to assignment...');
      
      const { error: historyError } = await supabase
        .from('printer_assignment_history')
        .delete()
        .eq('printer_assignment_id', id);
      
      if (historyError) {
        console.warn('Could not delete history records:', historyError);
      }
      
      const { error: maintenanceError } = await supabase
        .from('maintenance_history')
        .delete()
        .eq('assignment_id', id);
      
      if (maintenanceError) {
        console.warn('Could not delete maintenance records:', maintenanceError);
      }
      
      const { error: statusError } = await supabase
        .from('printer_status')
        .delete()
        .eq('assignment_id', id);
      
      if (statusError) {
        console.warn('Could not delete status records:', statusError);
      }
      
      const { error: usageError } = await supabase
        .from('usage_logs')
        .delete()
        .eq('assignment_id', id);
      
      if (usageError) {
        console.warn('Could not delete usage records:', usageError);
      }
      
      // Step 4: Now delete the assignment itself
      console.log('Deleting assignment...');
      const { error: deleteError } = await supabase
        .from('printer_assignments')
        .delete()
        .eq('id', id);
          
      if (deleteError) {
        console.error('Final delete failed:', deleteError);
        throw new Error(`Failed to delete assignment: ${deleteError.message}`);
      }
      
      // Step 5: Re-enable the trigger
      console.log('Re-enabling triggers...');
      const { error: enableError } = await supabase.rpc('enable_printer_assignment_history_trigger');
      if (enableError) {
        console.warn('Could not re-enable trigger:', enableError);
      }
      
      console.log('Assignment deletion completed successfully');
      
    } catch (error: any) {
      console.error('Error in deleteAssignment:', error);
      // Re-enable trigger even if deletion fails
      try {
        console.log('Re-enabling triggers after error...');
        await supabase.rpc('enable_printer_assignment_history_trigger');
      } catch (triggerError) {
        console.error('Failed to re-enable trigger:', triggerError);
      }
      throw error;
    }
  },

  async getAllAssignments(): Promise<PrinterAssignment[]> {
    const { data, error } = await supabase
      .from('printer_assignments')
      .select(`
        *,
        printer:printers(*),
        client:clients(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as PrinterAssignment[];
  },

  async getAssignmentById(id: string): Promise<PrinterAssignment> {
    const { data, error } = await supabase
      .from('printer_assignments')
      .select(`
        *,
        printer:printers(*),
        client:clients(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as PrinterAssignment;
  },

  async getAssignmentsByClient(clientId: string): Promise<PrinterAssignment[]> {
    const { data, error } = await supabase
      .from('printer_assignments')
      .select(`
        *,
        printer:printers(*),
        client:clients(*)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as PrinterAssignment[];
  },

  async getClientInactiveAssignments(clientId: string): Promise<PrinterAssignment[]> {
    const { data, error } = await supabase
      .from('printer_assignments')
      .select(`
        *,
        printer:printers(*),
        departments_location(
          id,
          name,
          department:departments(id, name)
        )
      `)
      .eq('client_id', clientId)
      .eq('status', 'inactive');
    if (error) throw error;
    // Cast status to the expected union type
    return (data || []).map((assignment: any) => ({
      ...assignment,
      status: assignment.status as 'active' | 'inactive' | 'returned' | 'undeployed',
    })) as PrinterAssignment[];
  },

  async getClientPrinterPool(clientId: string): Promise<PrinterAssignment[]> {
    const { data, error } = await supabase
      .from('printer_assignments')
      .select(`
        *,
        printer:printers(*),
        client:clients(*)
      `)
      .eq('client_id', clientId)
      .eq('status', 'undeployed')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as PrinterAssignment[];
  },

  async deployPrinterFromPool(assignmentId: string, departmentLocationId: string): Promise<PrinterAssignment> {
    const { data: assignment, error } = await supabase
      .from('printer_assignments')
      .update({
        department_location_id: departmentLocationId,
        status: 'active',
        deployment_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', assignmentId)
      .select(`
        *,
        printer:printers(*),
        client:clients(*)
      `)
      .single();

    if (error) throw error;
    return assignment as unknown as PrinterAssignment;
  },

  async getAvailablePrinters(): Promise<Printer[]> {
    const { data, error } = await supabase
      .from('printers')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async searchAssignments(query: string): Promise<PrinterAssignment[]> {
    const { data, error } = await supabase
      .from('printer_assignments')
      .select(`
        *,
        printer:printers(*),
        client:clients(*)
      `)
      .or(`serial_number.ilike.%${query}%,notes.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as PrinterAssignment[];
  },

  async getMaintenanceSchedule(printerId: string): Promise<MaintenanceSchedule[]> {
    const { data, error } = await supabase
      .from('maintenance_schedules')
      .select('*')
      .eq('printer_id', printerId)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    return (data || []).map(schedule => ({
      ...schedule,
      status: schedule.status as 'pending' | 'completed' | 'overdue'
    } as MaintenanceSchedule));
  },

  async createMaintenanceSchedule(schedule: Omit<MaintenanceSchedule, 'id' | 'created_at' | 'updated_at'>): Promise<MaintenanceSchedule> {
    const { data, error } = await supabase
      .from('maintenance_schedules')
      .insert(schedule)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      status: data.status as 'pending' | 'completed' | 'overdue'
    } as MaintenanceSchedule;
  },

  async updateMaintenanceSchedule(id: string, updates: Partial<MaintenanceSchedule>): Promise<MaintenanceSchedule> {
    const { data, error } = await supabase
      .from('maintenance_schedules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      status: data.status as 'pending' | 'completed' | 'overdue'
    } as MaintenanceSchedule;
  },

  async getMaintenanceHistory(printerId: string): Promise<MaintenanceHistory[]> {
    const { data, error } = await supabase
      .from('maintenance_history')
      .select('*')
      .eq('printer_id', printerId)
      .order('performed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async addMaintenanceHistoryEntry(entry: Omit<MaintenanceHistory, 'id' | 'created_at' | 'updated_at'>): Promise<MaintenanceHistory> {
    const { data, error } = await supabase
      .from('maintenance_history')
      .insert(entry)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateMaintenanceHistoryEntry(id: string, updates: Partial<MaintenanceHistory>): Promise<MaintenanceHistory> {
    const { data, error } = await supabase
      .from('maintenance_history')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPrinterHistory(printerId: string): Promise<PrinterHistory[]> {
    const { data, error } = await supabase
      .from('printer_history')
      .select('*')
      .eq('printer_id', printerId)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return (data || []).map(history => ({
      ...history,
      action_type: history.action_type as 'assigned' | 'transferred' | 'repair' | 'maintenance' | 'returned'
    } as PrinterHistory));
  },

  async addPrinterHistoryEntry(entry: Omit<PrinterHistory, 'id'>): Promise<PrinterHistory> {
    const { data, error } = await supabase
      .from('printer_history')
      .insert(entry)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      action_type: data.action_type as 'assigned' | 'transferred' | 'repair' | 'maintenance' | 'returned'
    } as PrinterHistory;
  },

  async getPrinterDocuments(printerId: string): Promise<PrinterDocument[]> {
    const { data, error } = await supabase
      .from('printer_documents')
      .select('*')
      .eq('printer_id', printerId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(document => ({
      ...document,
      document_type: document.document_type as 'contract' | 'accountability' | 'manual' | 'warranty' | 'other'
    } as PrinterDocument));
  },

  async uploadPrinterDocument(document: Omit<PrinterDocument, 'id' | 'uploaded_at'>): Promise<PrinterDocument> {
    const { data, error } = await supabase
      .from('printer_documents')
      .insert(document)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      document_type: data.document_type as 'contract' | 'accountability' | 'manual' | 'warranty' | 'other'
    } as PrinterDocument;
  },

  async deletePrinterDocument(id: string): Promise<void> {
    const { error } = await supabase
      .from('printer_documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async makePrinterAvailable(assignmentId: string): Promise<void> {
    const { error } = await supabase
      .from('printer_assignments')
      .update({
        status: 'available',
        client_id: null,
        department_location_id: null,
        // Optionally clear other assignment-specific fields
      })
      .eq('id', assignmentId);
    if (error) throw error;
  },

  async deleteDepartment(id: string): Promise<void> {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
