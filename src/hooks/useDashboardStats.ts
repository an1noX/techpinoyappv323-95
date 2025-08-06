
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  totalClients: number;
  totalPrinters: number;
  activePrinters: number;
  totalDepartments: number;
  supportTickets: number;
  pendingMaintenance: number;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalPrinters: 0,
    activePrinters: 0,
    totalDepartments: 0,
    supportTickets: 0,
    pendingMaintenance: 0
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch all required data in parallel
      const [
        clientsResponse,
        printersResponse,
        printerAssignmentsResponse,
        departmentsResponse,
        supportTicketsResponse,
        maintenanceResponse
      ] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact' }),
        supabase.from('printers').select('id', { count: 'exact' }),
        supabase.from('printer_assignments').select('id').eq('status', 'active'),
        supabase.from('departments').select('id', { count: 'exact' }),
        supabase.from('support_tickets').select('id').eq('status', 'pending'),
        supabase.from('maintenance_schedules').select('id').eq('status', 'pending')
      ]);

      return {
        totalClients: clientsResponse.count || 0,
        totalPrinters: printersResponse.count || 0,
        activePrinters: printerAssignmentsResponse.data?.length || 0,
        totalDepartments: departmentsResponse.count || 0,
        supportTickets: supportTicketsResponse.data?.length || 0,
        pendingMaintenance: maintenanceResponse.data?.length || 0
      };
    }
  });

  useEffect(() => {
    if (data) {
      setStats(data);
    }
  }, [data]);

  return {
    stats,
    isLoading,
    error
  };
};
