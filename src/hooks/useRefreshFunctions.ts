import { useQueryClient } from '@tanstack/react-query';
import { useClients } from '@/hooks/useClients';
import { useSuppliers } from '@/hooks/useSuppliers';
import { usePrinters } from '@/hooks/usePrinters';
import { useToast } from '@/hooks/use-toast';

export const useRefreshFunctions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get refetch functions from existing hooks
  const { loadClients } = useClients();
  const { loadSuppliers } = useSuppliers();
  const { loadPrinters: loadAssignedPrinters } = usePrinters(true);
  const { loadPrinters: loadAllPrinters } = usePrinters(false);

  const refreshAllData = async () => {
    try {
      // Invalidate all queries to force refetch
      await queryClient.invalidateQueries();
      
      // Manually trigger refetch for hooks that don't use react-query
      await Promise.all([
        loadClients(),
        loadSuppliers(),
        loadAssignedPrinters(),
        loadAllPrinters(),
      ]);

      toast({
        title: "Data Refreshed",
        description: "All data has been updated successfully.",
      });
    } catch (error) {
      console.error('Refresh failed:', error);
      toast({
        title: "Refresh Failed",
        description: "Some data may not have been updated. Please try again.",
        variant: "destructive"
      });
    }
  };

  const refreshClients = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      await loadClients();
      toast({
        title: "Clients Refreshed",
        description: "Client data has been updated.",
      });
    } catch (error) {
      console.error('Client refresh failed:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh client data.",
        variant: "destructive"
      });
    }
  };

  const refreshSuppliers = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      await loadSuppliers();
      toast({
        title: "Suppliers Refreshed",
        description: "Supplier data has been updated.",
      });
    } catch (error) {
      console.error('Supplier refresh failed:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh supplier data.",
        variant: "destructive"
      });
    }
  };

  const refreshPrinters = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['printers'] });
      await Promise.all([
        loadAssignedPrinters(),
        loadAllPrinters()
      ]);
      toast({
        title: "Printers Refreshed",
        description: "Printer data has been updated.",
      });
    } catch (error) {
      console.error('Printer refresh failed:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh printer data.",
        variant: "destructive"
      });
    }
  };

  const refreshProducts = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Products Refreshed",
        description: "Product data has been updated.",
      });
    } catch (error) {
      console.error('Product refresh failed:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh product data.",
        variant: "destructive"
      });
    }
  };

  const refreshDashboardStats = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Dashboard Refreshed",
        description: "Dashboard statistics have been updated.",
      });
    } catch (error) {
      console.error('Dashboard refresh failed:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh dashboard data.",
        variant: "destructive"
      });
    }
  };

  const refreshClientData = async (clientId: string) => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      await queryClient.invalidateQueries({ queryKey: ['assignments', clientId] });
      await queryClient.invalidateQueries({ queryKey: ['departments', clientId] });
      toast({
        title: "Client Data Refreshed",
        description: "Client information has been updated.",
      });
    } catch (error) {
      console.error('Client data refresh failed:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh client data.",
        variant: "destructive"
      });
    }
  };

  const refreshSupplierData = async (supplierId: string) => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['supplier', supplierId] });
      await queryClient.invalidateQueries({ queryKey: ['supplier-products', supplierId] });
      toast({
        title: "Supplier Data Refreshed",
        description: "Supplier information has been updated.",
      });
    } catch (error) {
      console.error('Supplier data refresh failed:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh supplier data.",
        variant: "destructive"
      });
    }
  };

  return {
    refreshAllData,
    refreshClients,
    refreshSuppliers,
    refreshPrinters,
    refreshProducts,
    refreshDashboardStats,
    refreshClientData,
    refreshSupplierData,
  };
}; 