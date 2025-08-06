
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Plus, Users, Building2, Printer, Package, FileText } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClients } from '@/hooks/useClients';
import { useSuppliers } from '@/hooks/useSuppliers';
import { usePrinters } from '@/hooks/usePrinters';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/productService';
import AdminHeader from '@/PrinterDashboard/AdminHeader';
import AdminBottomNav from '@/PrinterDashboard/AdminBottomNav';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { ADMIN_DASHBOARD_TABS, SEARCH_PLACEHOLDERS, LOADING_MESSAGES } from '@/constants/adminDashboard';
import PrinterSelectionModal from '@/components/admin-dashboard/components/PrinterSelectionModal';
import AssignPrinterToClientModal from '@/PrinterDashboard/AssignPrinterToClientModal';
import { useSupplierActions } from '@/hooks/useSupplierActions';
import { Supplier } from '@/types/database';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';
import AddPrinterModal from '@/components/AddPrinterModal';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useRefreshFunctions } from '@/hooks/useRefreshFunctions';
import { CustomLoading } from '@/components/ui/CustomLoading';

type TabType = typeof ADMIN_DASHBOARD_TABS[keyof typeof ADMIN_DASHBOARD_TABS];

const AdminDashboard: React.FC = () => {
  const { user, userProfile, loading } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  // Helper to get tab from query param
  function getTabFromQuery() {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === ADMIN_DASHBOARD_TABS.SUPPLIERS || tab === ADMIN_DASHBOARD_TABS.PRINTERS || tab === ADMIN_DASHBOARD_TABS.PRODUCT || tab === ADMIN_DASHBOARD_TABS.CLIENT) {
      return tab;
    }
    return ADMIN_DASHBOARD_TABS.SUPPLIERS;
  }

  const [activeTab, setActiveTab] = React.useState<TabType>(getTabFromQuery());

  // Update activeTab if query param changes
  React.useEffect(() => {
    const tab = getTabFromQuery();
    setActiveTab(tab as TabType);
  }, [location.search]);

  const [searchQuery, setSearchQuery] = useState('');
  const [printerFilter, setPrinterFilter] = useState<'assigned' | 'all'>('assigned');

  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddPrinter, setShowAddPrinter] = useState(false);
  const [showPrinterSelection, setShowPrinterSelection] = useState(false);
  const [showAssignToClient, setShowAssignToClient] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<{ id: string, name: string } | null>(null);

  // Fetch data using existing hooks and services
  const { clients, loading: clientsLoading, loadClients } = useClients();
  const { suppliers, loading: suppliersLoading, loadSuppliers } = useSuppliers();
  const { handleAddSupplier: createSupplier, isLoading: isCreatingSupplier } = useSupplierActions();
  // Fetch both assigned and all printers based on filter
  const { printers: assignedPrinters, loading: assignedPrintersLoading, loadPrinters: loadAssignedPrinters } = usePrinters(true);
  const { printers: allPrinters, loading: allPrintersLoading, loadPrinters: loadAllPrinters } = usePrinters(false);
  
  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getProducts(),
  });

  // Get refresh functions
  const { refreshClients, refreshSuppliers, refreshPrinters, refreshProducts } = useRefreshFunctions();

  // Determine which refresh function to use based on active tab
  const getRefreshFunction = () => {
    switch (activeTab) {
      case ADMIN_DASHBOARD_TABS.CLIENT:
        return refreshClients;
      case ADMIN_DASHBOARD_TABS.SUPPLIERS:
        return refreshSuppliers;
      case ADMIN_DASHBOARD_TABS.PRINTERS:
        return refreshPrinters;
      case ADMIN_DASHBOARD_TABS.PRODUCT:
        return refreshProducts;
      default:
        return refreshClients;
    }
  };

  const handlePrinterSelected = (printerId: string, printerName: string) => {
    setSelectedPrinter({ id: printerId, name: printerName });
    setShowPrinterSelection(false);
    setShowAssignToClient(true);
  };

  const handleAssignmentComplete = () => {
    setShowAssignToClient(false);
    setSelectedPrinter(null);
    // Refresh relevant data
    if (printerFilter === 'assigned') {
      loadAssignedPrinters();
    } else {
      loadAllPrinters();
    }
  };

  const handlePrinterAdded = () => {
    setShowAddPrinter(false);
    loadAllPrinters(); // Refresh the list of all printers
  };

  const handleSupplierAdded = async (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
    const success = await createSupplier(supplier);
    if (success) {
      setShowAddSupplier(false);
      loadSuppliers();
    }
  };

  if (loading) {
    return (
      <CustomLoading />
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!userProfile || userProfile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const filterClientsBySearch = (clients: any[], products: any[], query: string) => {
    if (!query.trim()) return clients;
    const lowercasedQuery = query.toLowerCase();

    // Create a lookup map for products for efficient searching
    const productMap = new Map(products?.map(p => [p.id, p]));

    return clients?.filter(client => {
      // 1. Check client's name
      if (client.name?.toLowerCase().includes(lowercasedQuery)) {
        return true;
      }

      // 2. Check assigned printers and their compatible products
      if (client.printers && client.printers.length > 0) {
        for (const assignment of client.printers) {
          const printer = assignment.printer;
          if (printer) {
            // Check printer details
            if (
              printer.name?.toLowerCase().includes(lowercasedQuery) ||
              printer.model?.toLowerCase().includes(lowercasedQuery) ||
              printer.manufacturer?.toLowerCase().includes(lowercasedQuery)
            ) {
              return true;
            }

            // Check compatible products for this printer using the product map
            if (printer.product_printers && printer.product_printers.length > 0) {
              for (const pp of printer.product_printers) {
                const product = productMap.get(pp.product_id);
                if (product) {
                  if (
                    product.name?.toLowerCase().includes(lowercasedQuery) ||
                    product.sku?.toLowerCase().includes(lowercasedQuery) ||
                    product.sku_alias?.toLowerCase().includes(lowercasedQuery)
                  ) {
                    return true;
                  }
                }
              }
            }
          }
        }
      }
      
      return false;
    }) || [];
  };

  const filterBySearch = (items: any[], searchField: string) => {
    if (!searchQuery.trim()) return items;
    return items?.filter(item => 
      item[searchField]?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];
  };

  const getFilteredData = () => {
    switch (activeTab) {
      case ADMIN_DASHBOARD_TABS.SUPPLIERS:
        return filterBySearch(suppliers || [], 'name');
      case ADMIN_DASHBOARD_TABS.PRINTERS:
        const printersToUse = printerFilter === 'assigned' ? assignedPrinters : allPrinters;
        return filterBySearch(printersToUse || [], 'name');
      case ADMIN_DASHBOARD_TABS.PRODUCT:
        return filterBySearch(products || [], 'name');
      case ADMIN_DASHBOARD_TABS.CLIENT:
        return filterClientsBySearch(clients || [], products || [], searchQuery);
      default:
        return [];
    }
  };

  const getTabLoading = () => {
    switch (activeTab) {
      case ADMIN_DASHBOARD_TABS.SUPPLIERS:
        return suppliersLoading;
      case ADMIN_DASHBOARD_TABS.PRINTERS:
        return printerFilter === 'assigned' ? assignedPrintersLoading : allPrintersLoading;
      case ADMIN_DASHBOARD_TABS.PRODUCT:
        return productsLoading;
      default:
        return false;
    }
  };

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case ADMIN_DASHBOARD_TABS.SUPPLIERS:
        return SEARCH_PLACEHOLDERS.SUPPLIERS;
      case ADMIN_DASHBOARD_TABS.PRINTERS:
        return SEARCH_PLACEHOLDERS.PRINTERS_ALL;
      case ADMIN_DASHBOARD_TABS.PRODUCT:
        return SEARCH_PLACEHOLDERS.PRODUCT;
      default:
        return SEARCH_PLACEHOLDERS.CLIENT;
    }
  };

  const handleDataRefresh = () => {
    switch (activeTab) {
      case ADMIN_DASHBOARD_TABS.SUPPLIERS:
        loadSuppliers();
        break;
      case ADMIN_DASHBOARD_TABS.PRINTERS:
        if (printerFilter === 'assigned') {
          loadAssignedPrinters();
        } else {
          loadAllPrinters();
        }
        break;
      case ADMIN_DASHBOARD_TABS.PRODUCT:
        refetchProducts();
        break;
    }
  };

  const filteredData = getFilteredData();
  const isLoading = getTabLoading();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        {isMobile ? (
          // Mobile Layout - Keep existing design exactly as is
          <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl flex flex-col relative">
            {/* Header */}
            <AdminHeader />
            {/* Main Content - Scrollable */}
            <div className="flex-1 p-6 pb-24 overflow-y-auto">

              {/* Content based on active tab */}
              <PullToRefresh onRefresh={getRefreshFunction()}>
                <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-8 shadow-lg h-full overflow-y-auto animate-scale-in">
                  {/* AdminTabContent removed. Insert new content here if needed. */}
                </div>
              </PullToRefresh>
            </div>
            {/* Bottom Navigation - Fixed */}
            <AdminBottomNav
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        ) : (
          // Desktop Layout - Modern fluid design
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
            {/* Desktop Header - Floating Glass Effect */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg mx-6 mt-6 rounded-2xl px-8 py-6 animate-scale-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    {activeTab === ADMIN_DASHBOARD_TABS.SUPPLIERS && <Building2 className="h-6 w-6 text-white" />}
                    {activeTab === ADMIN_DASHBOARD_TABS.PRINTERS && <Printer className="h-6 w-6 text-white" />}
                    {activeTab === ADMIN_DASHBOARD_TABS.PRODUCT && <Package className="h-6 w-6 text-white" />}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {activeTab === ADMIN_DASHBOARD_TABS.SUPPLIERS && 'Suppliers Network'}
                      {activeTab === ADMIN_DASHBOARD_TABS.PRINTERS && 'Printer Fleet'}
                      {activeTab === ADMIN_DASHBOARD_TABS.PRODUCT && 'Product Catalog'}
                    </h1>
                    <p className="text-gray-500 mt-1">
                      {activeTab === ADMIN_DASHBOARD_TABS.SUPPLIERS && 'Oversee supplier relationships'}
                      {activeTab === ADMIN_DASHBOARD_TABS.PRINTERS && 'Monitor printer assignments and status'}
                      {activeTab === ADMIN_DASHBOARD_TABS.PRODUCT && 'Browse and manage products'}
                    </p>
                  </div>
                </div>
                {/* Desktop Action Buttons */}
                <div className="flex items-center gap-3">
                  {activeTab === ADMIN_DASHBOARD_TABS.SUPPLIERS && (
                    <Button 
                      onClick={() => setShowAddSupplier(true)}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl px-6 py-3"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Supplier
                    </Button>
                  )}
                  {activeTab === ADMIN_DASHBOARD_TABS.PRINTERS && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl px-6 py-3">
                          <Plus className="h-5 w-5 mr-2" />
                          Printer Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 bg-white/90 backdrop-blur-xl shadow-xl rounded-xl border-0">
                        <DropdownMenuItem 
                          onClick={() => setShowPrinterSelection(true)}
                          className="rounded-lg m-1 hover:bg-blue-50 transition-colors duration-200"
                        >
                          Assign Printer
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setShowAddPrinter(true)}
                          className="rounded-lg m-1 hover:bg-blue-50 transition-colors duration-200"
                        >
                          Add New Printer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              {/* Desktop Content Area - Floating Content */}
              <div className="flex-1 px-6 pb-6 overflow-y-auto">
                <PullToRefresh onRefresh={getRefreshFunction()}>
                  <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-8 shadow-lg h-full overflow-y-auto animate-scale-in">
                    {/* AdminTabContent removed. Insert new content here if needed. */}
                  </div>
                </PullToRefresh>
              </div>
            </div>
          </div>
        )}
      </div>



      <AddPrinterModal
        isOpen={showAddPrinter}
        onClose={() => setShowAddPrinter(false)}
        onPrinterAdded={handlePrinterAdded}
      />

      {/* Printer Assignment Modals */}
      <PrinterSelectionModal
        isOpen={showPrinterSelection}
        onClose={() => setShowPrinterSelection(false)}
        onPrinterSelected={handlePrinterSelected}
      />

      {selectedPrinter && (
        <AssignPrinterToClientModal
          isOpen={showAssignToClient}
          onClose={() => setShowAssignToClient(false)}
          printerId={selectedPrinter.id}
          printerName={selectedPrinter.name}
          onAssignmentCreated={handleAssignmentComplete}
        />
      )}
    </ErrorBoundary>
  );
};

export default AdminDashboard;
