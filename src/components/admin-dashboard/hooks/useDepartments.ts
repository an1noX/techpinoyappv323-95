
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDepartments = (clientId: string) => {
  return useQuery({
    queryKey: ['departments', clientId],
    queryFn: async (): Promise<any[]> => {
      if (!clientId) return [];

      // Get all departments for the client with their locations
      const { data: departments, error: deptError } = await supabase
        .from('departments')
        .select(`
          *,
          locations:departments_location(*)
        `)
        .eq('client_id', clientId)
        .order('name');

      if (deptError) throw deptError;

      if (!departments || departments.length === 0) return [];

      // Get printer assignments for this client using department_location_id
      const { data: assignments, error: assignError } = await supabase
        .from('printer_assignments')
        .select(`
          id,
          printer_id,
          department_location_id,
          serial_number,
          status,
          deployment_date,
          monthly_price,
          usage_type,
          printer:printers(name, model, manufacturer, image_url, series)
        `)
        .eq('client_id', clientId)
        .eq('status', 'active');

      if (assignError) throw assignError;

      // Transform departments to include locations with printers
      const result: any[] = departments.map(dept => {
        const departmentLocations: any[] = (dept.locations || []).map(location => {
          // Get printer assignments for this location
          const locationPrinters = (assignments || [])
            .filter(assignment => assignment.department_location_id === location.id)
            .map(assignment => ({
              id: assignment.id,
              printer_id: assignment.printer_id,
              serial_number: assignment.serial_number,
              status: assignment.status as 'active' | 'inactive' | 'returned',
              deployment_date: assignment.deployment_date,
              usage_type: assignment.usage_type as 'rental' | 'service_unit' | 'client_owned',
              monthly_price: assignment.monthly_price,
              image_url: assignment.printer?.image_url,
              printer: assignment.printer,
              compatible_products: []
            }));

          return {
            id: location.id,
            name: location.name,
            office_name: location.office_name,
            description: location.description,
            floor: location.floor,
            contact_person: location.contact_person,
            contact_number: location.contact_number,
            abbreviation: location.abbreviation,
            printer_count: locationPrinters.length,
            department_id: location.department_id,
            client_id: location.client_id,
            printers: locationPrinters,
            created_at: location.created_at,
            updated_at: location.updated_at
          };
        });

        const totalPrinterCount = departmentLocations.reduce(
          (sum, location) => sum + location.printer_count,
          0
        );

        return {
          id: dept.id,
          name: dept.name,
          description: dept.description,
          client_id: dept.client_id,
          total_printer_count: totalPrinterCount,
          locations: departmentLocations,
          created_at: dept.created_at,
          updated_at: dept.updated_at
        };
      });

      return result.sort((a, b) => a.name.localeCompare(b.name));
    },
    enabled: !!clientId
  });
};
