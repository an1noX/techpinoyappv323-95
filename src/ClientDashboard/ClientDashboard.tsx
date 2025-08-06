import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, Users, Building, Printer, Package, ArrowLeft, Settings, Edit, FileText, KeyRound, Wrench, ClipboardList, AlertTriangle, CheckCircle, MoreHorizontal, LifeBuoy, ShoppingCart, Monitor, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import AdminDashboardClientDepartments from '@/components/admin-dashboard/AdminDashboardClientDepartments';
import ClientPrinters from '@/components/admin-dashboard/ClientPrinters';
import AdminDashboardClientProducts from '@/components/admin-dashboard/AdminDashboardClientProducts';
import EditClientModal from '@/components/EditClientModal';
import TopMobileHeader from '@/includes/TopMobileHeader';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useClientDetail } from '@/components/admin-dashboard/hooks/useClientDetail';
import { LOADING_MESSAGES, ERROR_MESSAGES } from '@/constants/adminDashboard';
import { useDepartments } from '@/components/admin-dashboard/hooks/useDepartments';
import { getClientCounts } from '@/utils/priceAnalysis';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { assetService } from '@/services/assetService';
import { clientService } from '@/services/clientService';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AssignPrinterToClientModal from '@/PrinterDashboard/AssignPrinterToClientModal';
import TransferPrinterModal from '@/components/admin-dashboard/components/TransferPrinterModal';
import PriceCheckModal from '@/components/admin-dashboard/components/PriceCheckModal';
import { ProductPrinter } from '@/types/database';
import { ServicePrinters } from './ServicePrinters';
import { ClientSupport } from './ClientSupport';
import { ClientDashboardSearch } from './ClientDashboardSearch';
import { useEffect } from 'react';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useRefreshFunctions } from '@/hooks/useRefreshFunctions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRoleBasedNavigation } from '@/hooks/useRoleBasedNavigation';
import { RestrictedAccessModal } from '@/components/RestrictedAccessModal';
import { CustomLoading } from "@/components/ui/CustomLoading";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Define a discriminated union type for activities
type ActivityItem =
  | {
      id: string;
      type: 'history';
      timestamp: string;
      description: string;
      printerName: string;
      actionType: string;
      performedBy: string;
    }
  | {
      id: string;
      type: 'maintenance';
      timestamp: string;
      description: string;
      printerName: string;
      maintenanceType: string;
      performedBy: string;
    };

const AdminClientDetail: React.FC = () => {
  const isMobile = useIsMobile();
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    client,
    isLoading: clientLoading,
    error: clientError,
    activeTab,
    setActiveTab,
    isDepartmentDetailsView,
    setIsDepartmentDetailsView,
    showEditModal,
    setShowEditModal,
    handleClientUpdated,
  } = useClientDetail({ clientId: clientId! });

  const {
    userRole,
    handleBackButtonClick,
    showClientSettingsModal,
    setShowClientSettingsModal,
    showRestrictedModal,
    setShowRestrictedModal,
    handleClientSettings,
    handleClientLogout,
    handleRestrictedModalClose,
  } = useRoleBasedNavigation();

  // Strongly type activeTab and setActiveTab for ClientDashboardSearch
  type TabKey = 'departments' | 'products' | 'printers' | 'available-printers' | 'support';
  const typedActiveTab = activeTab as TabKey;
  const typedSetActiveTab = setActiveTab as (tab: TabKey) => void;

  const { data: departments = [], isLoading: departmentsLoading } = useDepartments(clientId!);
  const { departmentCount, locationCount, printerCount } = getClientCounts(departments);

  // Fetch printer assignments for this client
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['assignments', clientId],
    queryFn: () => assetService.getAssignmentsByClient(clientId!),
    enabled: !!clientId,
  });

  // Active assignments
  const activeAssignments = assignments.filter((a: any) => a.status === 'active');
  // Inactive/Repair assignments
  const inactiveAssignments = assignments.filter((a: any) => a.status === 'inactive' || a.status === 'repair');
  // Rental assignments
  const rentalAssignments = assignments.filter((a: any) => a.usage_type === 'rental');

  // Maintenance events (sum for all assigned printers)
  const { data: maintenanceCounts = 0, isLoading: maintenanceLoading } = useQuery({
    queryKey: ['maintenance', clientId, assignments],
    queryFn: async () => {
      if (!assignments.length) return 0;
      let total = 0;
      for (const a of assignments) {
        const history = await assetService.getMaintenanceHistory(a.printer_id);
        total += history.length;
      }
      return total;
    },
    enabled: !!clientId && assignments.length > 0,
  });

  // Recent documents (ClientDocument)
  const { data: documentCount = 0, isLoading: documentsLoading } = useQuery({
    queryKey: ['client-documents', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_documents')
        .select('id')
        .eq('client_id', clientId!);
      if (error) return 0;
      return data.length;
    },
    enabled: !!clientId,
  });

  // Product summary: count unique products compatible with all assigned printers
  const { data: productCount = 0, isLoading: productsLoading } = useQuery({
    queryKey: ['client-compatible-products', clientId, assignments],
    queryFn: async () => {
      if (!assignments.length) return 0;
      const productIds = new Set<string>();
      for (const assignment of assignments) {
        // Get compatible products for this printer
        const { data, error } = await supabase
          .from('product_printers')
          .select('product_id')
          .eq('printer_id', assignment.printer_id);
        if (error) continue;
        (data as ProductPrinter[]).forEach(pp => productIds.add(pp.product_id));
      }
      return productIds.size;
    },
    enabled: !!clientId && assignments.length > 0,
  });

  // Quick Actions modal state
  const [showAssignPrinter, setShowAssignPrinter] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showPriceCheck, setShowPriceCheck] = useState(false);
  // For maintenance/transfer, select the first assignment by default
  const firstAssignment = assignments[0] || null;

  // Activity Feed Tabs state
  const [activityTab, setActivityTab] = useState('transfer');

  // Fetch activity data for tabs (reuse RecentPrinterActivities logic)
  const { data: activities = [], isLoading: activitiesLoading } = useQuery<ActivityItem[]>({
    queryKey: ['recent-printer-activities', clientId],
    queryFn: async () => {
      const { data: printerHistory } = await supabase
        .from('printer_history')
        .select(`id, action_type, description, performed_by, timestamp, printer:printers (name, printer_assignments!inner (client_id))`)
        .eq('printer.printer_assignments.client_id', clientId)
        .order('timestamp', { ascending: false })
        .limit(30);
      const { data: maintenanceHistory } = await supabase
        .from('maintenance_history')
        .select(`id, maintenance_type, action_description, performed_by, performed_at, printer:printers (name, printer_assignments!inner (client_id))`)
        .eq('printer.printer_assignments.client_id', clientId)
        .order('performed_at', { ascending: false })
        .limit(30);
      const allActivities = [
        ...(printerHistory || []).map(item => ({
          id: item.id,
          type: 'history' as const,
          timestamp: item.timestamp,
          description: item.description,
          printerName: item.printer?.name || 'Unknown Printer',
          actionType: item.action_type,
          performedBy: item.performed_by,
        })),
        ...(maintenanceHistory || []).map(item => ({
          id: item.id,
          type: 'maintenance' as const,
          timestamp: item.performed_at,
          description: item.action_description,
          printerName: item.printer?.name || 'Unknown Printer',
          maintenanceType: item.maintenance_type,
          performedBy: item.performed_by,
        }))
      ];
      return allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
    enabled: !!clientId,
  });

  // Fetch available printers for badge (from printer_visibility)
  const { data: availablePrintersCount = 0 } = useQuery({
    queryKey: ['available-printers-count', clientId],
    queryFn: async () => {
      if (!clientId) return 0;
      const { count, error } = await supabase
        .from('printer_visibility')
        .select('printer_id', { count: 'exact' })
        .eq('client_id', clientId);
      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!clientId,
  });

  console.log('🔢 availablePrintersCount:', availablePrintersCount);

  // State for showing ServicePrinters overlay/modal
  const [showServicePrinters, setShowServicePrinters] = useState(false);
  // State for filtered search results
  const [filteredPrinters, setFilteredPrinters] = useState<any[]>([]);
  const [showPlaceholderModal, setShowPlaceholderModal] = useState(false);
  // Add missing state for delete logic
  const [deleting, setDeleting] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState('');
  const { toast } = useToast();

  // Get refresh functions
  const { refreshClientData } = useRefreshFunctions();

  // Create refresh function for this specific client
  const handleRefresh = async () => {
    if (clientId) {
      await refreshClientData(clientId);
    }
  };

  useEffect(() => {
    const handleRefreshEvent = () => {
      handleRefresh();
    };
    window.addEventListener('refresh-printer-data', handleRefreshEvent);
    return () => {
      window.removeEventListener('refresh-printer-data', handleRefreshEvent);
    };
  }, [clientId]);

  // Delete client handler
  const handleDeleteClient = async () => {
    if (!clientId) return;
    setDeleting(true);

    // Check for active departments
    const { data: departmentsData, error: departmentsError } = await supabase
      .from('departments')
      .select('id')
      .eq('client_id', clientId);

    if (departmentsError) {
      setDeleting(false);
      setDeleteErrorMsg('Error checking departments.');
      setShowDeleteWarning(true);
      return;
    }

    if (departmentsData && departmentsData.length > 0) {
      setDeleting(false);
      setDeleteErrorMsg("Client with active departments can't be deleted. Please delete all departments first.");
      setShowDeleteWarning(true);
      return;
    }

    // No departments, show confirmation dialog
    setDeleting(false);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    const { error: deleteError } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);

    setDeleting(false);
    setShowDeleteConfirm(false);

    if (deleteError) {
      setDeleteErrorMsg('Error deleting client.');
      setShowDeleteWarning(true);
      return;
    }

    toast({
      title: 'Client has been fully removed from the database.',
      description: 'Success'
    });

    navigate('/'); // Redirect to home or Dashboard.tsx
  };

  if (clientLoading) {
    return (
      <CustomLoading message="Loading client details" fullscreen />
    );
  }

  if (clientError || !client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 text-sm mb-4">{ERROR_MESSAGES.CLIENT_NOT_FOUND}</p>
          <Button onClick={() => navigate('/admin-dashboard')} size="sm">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const clientTabs = [
    { id: 'departments', label: 'Departments', icon: Users },
    { id: 'printers', label: 'Printers', icon: Printer },
    { id: 'products', label: 'Products', icon: ShoppingCart },
    { id: 'available-printers', label: 'Available Printers', icon: Monitor },
    { id: 'support', label: 'Support', icon: LifeBuoy },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'departments':
        return (
          <div className="space-y-3">
            <AdminDashboardClientDepartments 
              clientId={clientId!} 
              onDepartmentDetailsView={setIsDepartmentDetailsView}
              filteredPrinters={filteredPrinters}
            />
          </div>
        );
      case 'printers':
        return (
          <div className="space-y-3">
            <ClientPrinters clientId={clientId!} />
          </div>
        );
      case 'products':
        return <AdminDashboardClientProducts clientId={clientId!} />;
      case 'support':
        return <ClientSupport />;
      case 'available-printers':
        return <ServicePrinters />;
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <div 
        className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50"
        style={{ 
          paddingTop: 'env(safe-area-inset-top)', 
          paddingBottom: 'env(safe-area-inset-bottom)' 
        }}
      >
        {/* Mobile-first sticky header */}
        <div className="sticky top-0 z-20 bg-blue-100/95 backdrop-blur-sm border-b border-blue-200 px-4 py-3">
          <div className="flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-semibold text-gray-900 truncate">Client Dashboard</h1>
                {client && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-xs text-gray-600 truncate">{client.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Total Printers ({activeAssignments.length + inactiveAssignments.length})</span>
                      <span>|</span>
                      <span>Active ({activeAssignments.length})</span>
                      <span>|</span>
                      <span>Inactive ({inactiveAssignments.length})</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right side - Settings and Delete buttons */}
            <div className="flex items-center gap-2">
              {(userRole === 'admin' || userRole === 'superadmin') && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/clients/${clientId}/manage`)}
                    className="ml-auto"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                  {userRole === 'superadmin' && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-red-600 border-red-300"
                      onClick={handleDeleteClient}
                      disabled={deleting}
                      title="Delete Client"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        {/* Error Dialog */}
        <Dialog open={showDeleteWarning} onOpenChange={setShowDeleteWarning}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cannot Delete Client</DialogTitle>
            </DialogHeader>
            <div className="py-2 text-center text-gray-700">
              {deleteErrorMsg}
            </div>
            <Button variant="default" onClick={() => setShowDeleteWarning(false)}>
              OK
            </Button>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Client Deletion</DialogTitle>
            </DialogHeader>
            <div className="py-2 text-center text-gray-700">
              Deleting this client will permanently remove its record from the database. Proceed with caution.
            </div>
            <div className="flex justify-center gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                Confirm Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Main content with mobile optimization */}
        <div className="flex-1 overflow-y-auto px-1 py-3 space-y-4">
          <PullToRefresh onRefresh={handleRefresh}>
            {renderTabContent()}
          </PullToRefresh>
        </div>

        {/* Mobile-first bottom navigation */}
        {!isDepartmentDetailsView && (
          <footer className="sticky bottom-0 z-30 w-full bg-white/95 backdrop-blur-sm border-t border-gray-200">
            <ClientDashboardSearch 
              activeTab={typedActiveTab}
              setActiveTab={typedSetActiveTab}
              onFilteredDataChange={setFilteredPrinters}
              client={client}
              onClientUpdated={handleClientUpdated}
            />
          </footer>
        )}

        {/* Mobile-optimized ServicePrinters Modal */}
        {showServicePrinters && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
            <div className="relative w-full max-h-[85vh] rounded-t-2xl shadow-2xl bg-white border-t border-gray-200 animate-in slide-in-from-bottom-4 duration-300">
              {/* Compact header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Monitor className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Available Printers</h2>
                    <p className="text-xs text-white/80">Special deals for you!</p>
                  </div>
                </div>
                <button
                  className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white/10 transition-colors touch-target"
                  onClick={() => setShowServicePrinters(false)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              
              {/* Content */}
              <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
                <ServicePrinters />
              </div>
            </div>
          </div>
        )}

        {/* Mobile-optimized role-based modals */}
        {showClientSettingsModal && (
          <Dialog open={showClientSettingsModal} onOpenChange={setShowClientSettingsModal}>
            <DialogContent className="w-[95vw] max-w-md rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-base">Client Menu</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <Button 
                  variant="outline" 
                  className="w-full h-12 justify-start text-sm touch-target"
                  onClick={handleClientSettings}
                >
                  <Settings className="mr-3 h-4 w-4" />
                  Settings
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full h-12 justify-start text-sm touch-target"
                  onClick={handleClientLogout}
                >
                  <KeyRound className="mr-3 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <RestrictedAccessModal 
          open={showRestrictedModal} 
          onOpenChange={handleRestrictedModalClose}
        />

        {/* Other modals with mobile optimization */}
        <EditClientModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          client={client}
          onClientUpdated={handleClientUpdated}
        />
        
        <Dialog open={showPlaceholderModal} onOpenChange={setShowPlaceholderModal}>
          <DialogContent className="w-[95vw] max-w-md rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-base">Navigation</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-center text-gray-600 text-sm">
              This is a placeholder modal for navigation actions.
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
};

export default AdminClientDetail;
