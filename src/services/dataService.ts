// import { offlineStorage } from './offlineStorageService';
import { supabase } from '@/integrations/supabase/client';

export interface NormalizedPrinter {
  id: string;
  name: string;
  manufacturer?: string;
  model?: string;
  series?: string;
  color?: string;
  image_url?: string;
  rental_eligible?: boolean;
  status?: string;
}

export interface NormalizedAssignment {
  id: string;
  printer_id: string;
  serial_number?: string;
  usage_type?: string;
  status: string;
  client_id?: string;
  department_location_id?: string;
  assignment_effective_date?: string;
  condition?: string;
  reason_for_change?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  is_client_owned?: boolean;
}

export interface NormalizedClient {
  id: string;
  name: string;
}

export interface NormalizedDepartmentLocation {
  id: string;
  name: string;
  department?: {
    id: string;
    name: string;
  };
}

export interface NormalizedData {
  printers: Record<string, NormalizedPrinter>;
  assignments: Record<string, NormalizedAssignment>;
  clients: Record<string, NormalizedClient>;
  departmentLocations: Record<string, NormalizedDepartmentLocation>;
  lastUpdated: number;
}

export class DataService {
  private static instance: DataService;
  private normalizedData: NormalizedData = {
    printers: {},
    assignments: {},
    clients: {},
    departmentLocations: {},
    lastUpdated: 0
  };

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // Normalize raw assignment data from Supabase
  normalizeAssignmentData(rawAssignments: any[]): NormalizedData {
    const normalized: NormalizedData = {
      printers: {},
      assignments: {},
      clients: {},
      departmentLocations: {},
      lastUpdated: Date.now()
    };

    rawAssignments.forEach(assignment => {
      // Normalize printer
      if (assignment.printer) {
        normalized.printers[assignment.printer.id] = {
          id: assignment.printer.id,
          name: assignment.printer.name,
          manufacturer: assignment.printer.manufacturer,
          model: assignment.printer.model,
          series: assignment.printer.series,
          color: assignment.printer.color,
          image_url: assignment.printer.image_url,
          rental_eligible: assignment.printer.rental_eligible,
          status: assignment.printer.status
        };
      }

      // Normalize assignment
      normalized.assignments[assignment.id] = {
        id: assignment.id,
        printer_id: assignment.printer_id,
        serial_number: assignment.serial_number,
        usage_type: assignment.usage_type,
        status: assignment.status,
        client_id: assignment.client_id,
        department_location_id: assignment.department_location_id,
        assignment_effective_date: assignment.assignment_effective_date,
        condition: assignment.condition,
        reason_for_change: assignment.reason_for_change,
        notes: assignment.notes,
        created_at: assignment.created_at,
        updated_at: assignment.updated_at,
        is_client_owned: assignment.is_client_owned,
      };

      // Normalize client
      if (assignment.clients) {
        normalized.clients[assignment.clients.id] = {
          id: assignment.clients.id,
          name: assignment.clients.name
        };
      }

      // Normalize department location
      if (assignment.departments_location) {
        normalized.departmentLocations[assignment.departments_location.id] = {
          id: assignment.departments_location.id,
          name: assignment.departments_location.name,
          department: assignment.departments_location.department
        };
      }
    });

    return normalized;
  }

  // Cache normalized data
  cacheNormalizedData(data: NormalizedData): void {
    this.normalizedData = data;
    // offlineStorage.setItem('normalized_printer_data', data);
  }

  // Get cached normalized data
  getCachedNormalizedData(): NormalizedData | null {
    if (this.normalizedData.lastUpdated > 0) {
      return this.normalizedData;
    }
    
    const cached = null;
    if (false) {
      this.normalizedData = cached;
      return cached;
    }
    
    return null;
  }

  // Transform normalized data back to display format
  denormalizePrinterData(filter: 'assigned' | 'available' | 'inventory' | 'catalog'): any[] {
    const cached = this.getCachedNormalizedData();
    if (!cached) return [];

    const { printers, assignments, clients, departmentLocations } = cached;

    switch (filter) {
      case 'assigned':
        const assignedAssignments = Object.values(assignments)
          .filter(assignment => 
            (assignment.status === 'active' || assignment.status === 'inactive' || assignment.status === 'undeployed') && 
            assignment.client_id !== null && 
            assignment.client_id !== undefined
          );

        // Group by printer_id and count assigned units
        const groupedAssigned = assignedAssignments.reduce((acc, assignment) => {
          const printer = printers[assignment.printer_id];
          if (!printer) return acc;

          if (!acc[printer.id]) {
            acc[printer.id] = {
              printer,
              assignments: [],
              count: 0
            };
          }
          
          acc[printer.id].assignments.push({
            ...assignment,
            clients: assignment.client_id ? clients[assignment.client_id] : null,
            departments_location: assignment.department_location_id ? departmentLocations[assignment.department_location_id] : null
          });
          acc[printer.id].count++;
          
          return acc;
        }, {} as Record<string, any>);

        return Object.values(groupedAssigned).map(group => ({
          ...group.printer,
          printer_assignments: group.assignments,
          assigned_count: group.count
        }));
      case 'available':
        const availableAssignments = Object.values(assignments)
          .filter(assignment => assignment.client_id == null || assignment.client_id === '');

        // Group by printer_id and count available units
        const groupedAvailable = availableAssignments.reduce((acc, assignment) => {
          const printer = printers[assignment.printer_id];
          if (!printer) return acc;

          if (!acc[printer.id]) {
            acc[printer.id] = {
              printer,
              assignments: [],
              count: 0
            };
          }
          
          acc[printer.id].assignments.push({
            ...assignment,
            clients: assignment.client_id ? clients[assignment.client_id] : null,
            departments_location: assignment.department_location_id ? departmentLocations[assignment.department_location_id] : null
          });
          acc[printer.id].count++;
          
          return acc;
        }, {} as Record<string, any>);

        return Object.values(groupedAvailable).map(group => ({
          ...group.printer,
          printer_assignments: group.assignments,
          available_count: group.count
        }));
      case 'inventory':
        // No additional filters for inventory, return all assignments
        return Object.values(assignments).map(assignment => ({
          ...assignment,
          printer: printers[assignment.printer_id],
          clients: assignment.client_id ? clients[assignment.client_id] : null,
          departments_location: assignment.department_location_id ? departmentLocations[assignment.department_location_id] : null
        }));
      case 'catalog':
        return Object.values(printers);

      default:
        return [];
    }
  }

  // Preload data for predicted tab switches
  async preloadTabData(currentTab: string): Promise<void> {
    const preloadOrder = this.getPredictedTabs(currentTab);
    
    for (const tab of preloadOrder) {
      try {
        await this.prefetchTabData(tab);
      } catch (error) {
        console.warn(`Failed to preload data for tab ${tab}:`, error);
      }
    }
  }

  private getPredictedTabs(currentTab: string): string[] {
    // Define likely tab navigation patterns
    const navigationPatterns: Record<string, string[]> = {
      'assigned': ['available', 'all'],
      'available': ['assigned', 'catalog'],
      'catalog': ['available', 'assigned'],
      'all': ['assigned', 'available']
    };

    return navigationPatterns[currentTab] || [];
  }

  async prefetchTabData(tab: string): Promise<void> {
    // Only prefetch if not already cached
    const cached = this.getCachedNormalizedData();
    if (false) {
      return;
    }

    // Prefetch data based on tab requirements
    switch (tab) {
      case 'assigned':
      case 'available':
      case 'all':
        await this.prefetchAssignmentData();
        break;
      case 'catalog':
        await this.prefetchCatalogData();
        break;
    }
  }

  private async prefetchAssignmentData(): Promise<void> {
    const { data } = await supabase
      .from('printer_assignments')
      .select(`
        id,
        printer_id,
        serial_number,
        usage_type,
        status,
        client_id,
        department_location_id,
        assignment_effective_date,
        condition,
        reason_for_change,
        notes,
        created_at,
        updated_at,
        is_client_owned,
        printer:printers(
          id,
          name,
          manufacturer,
          model,
          series,
          color,
          image_url,
          rental_eligible,
          status
        ),
        clients(id, name),
        departments_location(
          id,
          name,
          department:departments(id, name)
        )
      `)
      .neq('printer.status', 'deleted')
      .order('printer(name)');

    if (data) {
      const normalized = this.normalizeAssignmentData(data);
      this.cacheNormalizedData(normalized);
    }
  }

  private async prefetchCatalogData(): Promise<void> {
    const { data } = await supabase
      .from('printers')
      .select(`
        id,
        name,
        manufacturer,
        model,
        series,
        color,
        image_url,
        rental_eligible,
        status
      `)
      .neq('status', 'deleted')
      .order('name');

    if (data) {
      // Update only printers in normalized data
      const cached = this.getCachedNormalizedData() || {
        printers: {},
        assignments: {},
        clients: {},
        departmentLocations: {},
        lastUpdated: 0
      };

      data.forEach(printer => {
        cached.printers[printer.id] = printer;
      });

      cached.lastUpdated = Date.now();
      this.cacheNormalizedData(cached);
    }
  }

  // Clear all cached data
  clearCache(): void {
    this.normalizedData = {
      printers: {},
      assignments: {},
      clients: {},
      departmentLocations: {},
      lastUpdated: 0
    };
    // offlineStorage.clearCache();
  }
}

export const dataService = DataService.getInstance();
