import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { Loader2, Users, Building, Printer, Package, ArrowLeft, Edit, FileText, KeyRound, Wrench, ClipboardList, AlertTriangle, CheckCircle, MoreHorizontal } from 'lucide-react';
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
  const { user, userProfile, loading } = useAuth();
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();

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

  if (loading || clientLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{LOADING_MESSAGES.CLIENT_DETAILS}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user has admin/owner role OR if their email matches the client's contact_email
  const hasAdminRole = userProfile?.role === 'admin';
  const emailMatchesClient = client && user.email && client.contact_email && 
    user.email.toLowerCase().trim() === client.contact_email.toLowerCase().trim();
  
  console.log('🔐 Access Control Check:', {
    userEmail: user.email,
    clientContactEmail: client?.contact_email,
    hasAdminRole,
    emailMatchesClient,
    userProfile: userProfile?.role
  });
  
  if (!hasAdminRole && !emailMatchesClient) {
    console.log('❌ Access denied - redirecting to dashboard');
    return <Navigate to="/" replace />;
  }
  
  console.log('✅ Access granted to client page');

  if (clientError || !client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{ERROR_MESSAGES.CLIENT_NOT_FOUND}</p>
          <Button onClick={() => navigate('/admin-dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'departments':
        return (
          <div className="space-y-6">
            <AdminDashboardClientDepartments 
              clientId={clientId!} 
              onDepartmentDetailsView={setIsDepartmentDetailsView}
            />
          </div>
        );
      case 'printers':
        return (
          <div className="space-y-6">
            <ClientPrinters clientId={clientId!} />
          </div>
        );
      case 'products':
        return <AdminDashboardClientProducts clientId={clientId!} />;
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        {isMobile ? (
          // Mobile Layout - Keep exact original design
          <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
            <TopMobileHeader
              client={{
                ...client,
                department_count: departmentCount,
                location_count: locationCount,
                printer_count: printerCount,
              }}
              onBack={() => navigate('/')}
              onEdit={() => setShowEditModal(true)}
              onSettings={() => alert('Open admin CRUD operations modal')}
              appVersion="1.0.0"
            />
            
            {/* Main Content */}
            <div className="p-4"> 
              {renderTabContent()}
            </div>
          </div>
        ) : (
          // Desktop Layout - Modern design
          <div className="flex h-screen overflow-hidden">
            <TopMobileHeader
              client={{
                ...client,
                department_count: departmentCount,
                location_count: locationCount,
                printer_count: printerCount,
              }}
              onBack={() => navigate('/')}
              onEdit={() => setShowEditModal(true)}
              onSettings={() => alert('Open admin CRUD operations modal')}
              appVersion="1.0.0"
            />

            {/* Desktop Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Desktop Header */}
              <div className="bg-white/80 backdrop-blur-xl shadow-lg mx-6 mt-6 rounded-2xl px-8 py-6 animate-scale-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {activeTab === 'departments' && 'Department Management'}
                      {activeTab === 'printers' && 'Printer Fleet'}
                      {activeTab === 'products' && 'Product Catalog'}
                    </h2>
                    <p className="text-gray-500 mt-1">
                      {activeTab === 'departments' && 'Manage departments and locations'}
                      {activeTab === 'printers' && 'Monitor assigned printers and supplies'}
                      {activeTab === 'products' && 'View compatible products and pricing'}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => alert('Settings')}
                      className="h-12 w-12 p-0 rounded-xl hover:bg-gray-50 hover:scale-110 transition-all duration-300 border-2"
                    >
                      <Wrench className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Desktop Content Area */}
              <div className="flex-1 px-6 pb-6 overflow-y-auto">
                <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-8 shadow-lg h-full overflow-y-auto animate-scale-in">
                  {renderTabContent()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        <EditClientModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          client={client}
          onClientUpdated={handleClientUpdated}
        />
      </div>
    </ErrorBoundary>
  );
};

export default AdminClientDetail;
