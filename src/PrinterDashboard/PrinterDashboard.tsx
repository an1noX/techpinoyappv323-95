import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

import ErrorBoundary from '@/components/common/ErrorBoundary';
import PrinterTabContent from '@/PrinterDashboard/PrinterTabContent';
import { PrinterDashboardNav } from './PrinterDashboardNav';

// Optimized components
import TopMobileHeader from '@/includes/TopMobileHeader';
import PrinterDashboardHelpBanner from './components/PrinterDashboardHelpBanner';
import PrinterDashboardModals from './components/PrinterDashboardModals';
import DatabaseSummary from '@/components/DatabaseSummary';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';

// Custom hooks
import { 
  useAssignedPrinters, 
  useAllPrinters, 
  useCatalogPrinters, 
  useAvailablePrinters 
} from './hooks/usePrinterQueries';
import { useRealtimeSubscription } from './hooks/useRealtimeSubscription';
import { useBackgroundDataSync } from './hooks/useOptimizedPrinterData';
import { memoryManager } from '@/utils/memoryManager';
import { dataService } from '@/services/dataService';
import { AssignModal } from './AssignModal';
import { AddToInventoryModal } from './components/AddToInventoryModal';
import AddPrinterModal from '@/components/AddPrinterModal';

const PrinterDashboard: React.FC = () => {
  const { user, userProfile, loading, userProfileLoading } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [printerFilter, setPrinterFilter] = useState<'assigned' | 'available' | 'catalog' | 'inventory'>(() => {
    // Get from URL on initial load
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab') as 'assigned' | 'available' | 'catalog' | 'inventory';
    return tab || 'assigned';
  });
  const [showAddPrinter, setShowAddPrinter] = useState(false);
  const [showPrinterSelection, setShowPrinterSelection] = useState(false);
  const [showAssignToClient, setShowAssignToClient] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<{ id: string; name: string; } | null>(null);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [debugMode, setDebugMode] = useState(false);
  const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false);
  const [selectedPrinterForAssignment, setSelectedPrinterForAssignment] = useState<any>(null);
  const [showAll, setShowAll] = useState(false);
  const [showAvailable, setShowAvailable] = useState(false);
  const [showAssigned, setShowAssigned] = useState(false);
  const [showClientOwned, setShowClientOwned] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAddToInventoryModal, setShowAddToInventoryModal] = useState(false);
  const [showCatalogAddPrinterModal, setShowCatalogAddPrinterModal] = useState(false);

  // Query to fetch client access for the current user
  const { data: clientAccess } = useQuery({
    queryKey: ['client-access', user?.id, userProfile?.role],
    queryFn: async () => {
      if (!user?.id || userProfile?.role !== 'client') return null;
      
      const { data, error } = await supabase
        .from('client_access' as any)
        .select('client_id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data.map((access: any) => access.client_id);
    },
    enabled: !!user?.id && userProfile?.role === 'client',
  });

  // Set up background data synchronization and memory management
  useBackgroundDataSync();
  
  useEffect(() => {
    memoryManager.startMonitoring();
    return () => memoryManager.stopMonitoring();
  }, []);

  // Custom setter for printerFilter that updates URL
  const setPrinterFilterWithURL = useCallback((filter: 'assigned' | 'available' | 'catalog' | 'inventory') => {
    setPrinterFilter(filter);
    // Update URL immediately
    const url = new URL(window.location.href);
    url.searchParams.set('tab', filter);
    window.history.replaceState({}, '', url.toString());
  }, []);

  // Update URL when printerFilter changes (fallback)
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', printerFilter);
    window.history.replaceState({}, '', url.toString());
  }, [printerFilter]);

  // Listen for browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab') as 'assigned' | 'available' | 'catalog' | 'inventory';
      if (tab && tab !== printerFilter) {
        setPrinterFilter(tab);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [printerFilter]);

  // Optimized queries - Catalog and Available always run, Assigned remains conditional
  const { data: assignedAssignments = [], isLoading: assignedLoading } = useAssignedPrinters(printerFilter === 'assigned');
  const { data: inventoryAssignments = [], isLoading: inventoryLoading } = useAllPrinters(true);
  const { data: catalogPrinters = [], isLoading: catalogLoading } = useCatalogPrinters(true);
  const { data: availableAssignments = [], isLoading: availableLoading } = useAvailablePrinters(true);

  const printersLoading = assignedLoading || inventoryLoading || availableLoading || catalogLoading;

  const refreshPrinters = useCallback(async () => {
    console.log('🔄 Refreshing printer data...');
    // Clear dataService cache first
    dataService.clearCache();
    // Invalidate all printer-related queries to trigger refetch
    await queryClient.invalidateQueries({ queryKey: ['assigned-assignments'] });
    await queryClient.invalidateQueries({ queryKey: ['available-assignments'] });
    await queryClient.invalidateQueries({ queryKey: ['all-assignments'] });
    await queryClient.invalidateQueries({ queryKey: ['catalog-printers'] });
    await queryClient.invalidateQueries({ queryKey: ['optimized-printer-data'] });
    console.log('✅ Printer data refreshed');
  }, [queryClient]);

  // Set up real-time subscription
  useRealtimeSubscription({ printerFilter, onRefresh: refreshPrinters });

  // Force refresh when switching to Catalog, Available, or Inventory tabs
  useEffect(() => {
    if (printerFilter === 'catalog' || printerFilter === 'available' || printerFilter === 'inventory') {
      console.log(`🔄 Switching to ${printerFilter} tab, refreshing data...`);
      refreshPrinters();
    }
  }, [printerFilter, refreshPrinters]);

  // Helper function to filter printers based on client access
  const filterPrintersByClientAccess = useCallback((printers: any[]) => {
    // If user is not a client, return all printers
    if (userProfile?.role !== 'client' || !clientAccess) {
      return printers;
    }

    // Filter based on printer filter type
    switch (printerFilter) {
      case 'assigned':
        return printers.filter(printer => {
          return printer.printer_assignments?.some((assignment: any) => 
            assignment.client_id && clientAccess.includes(assignment.client_id)
          );
        });

      case 'available':
        return printers.filter(printer => {
          if (!printer.printer_assignments || printer.printer_assignments.length === 0) {
            return true; // Show unassigned printers
          }
          return printer.printer_assignments.some((assignment: any) => 
            !assignment.client_id || clientAccess.includes(assignment.client_id)
          );
        });

      case 'inventory':
        return printers.filter(assignment => {
          if (!assignment.client_id) {
            return true; // Show unassigned inventory
          }
          return clientAccess.includes(assignment.client_id);
        });

      case 'catalog':
        return printers; // Show all catalog items

      default:
        return printers;
    }
  }, [userProfile?.role, clientAccess, printerFilter]);

  // Get printers based on filter - MODIFIED to include client access filtering
  const printers = useMemo(() => {
    let rawPrinters;
    switch (printerFilter) {
      case 'assigned':
        rawPrinters = assignedAssignments;
        break;
      case 'available':
        rawPrinters = availableAssignments;
        break;
      case 'inventory':
        rawPrinters = inventoryAssignments;
        break;
      case 'catalog':
        rawPrinters = catalogPrinters;
        break;
      default:
        rawPrinters = [];
    }

    // Apply client access filtering
    return filterPrintersByClientAccess(rawPrinters);
  }, [printerFilter, assignedAssignments, availableAssignments, inventoryAssignments, catalogPrinters, filterPrintersByClientAccess]);
  
  // Memoized filtered printers to prevent unnecessary recalculations
  const displayPrinters = useMemo(() => {
    return filteredData.length > 0 ? filteredData : printers;
  }, [filteredData, printers]);

  // Filter logic for Inventory tab
  const filteredInventoryAssignments = useMemo(() => {
    if (printerFilter !== 'inventory') return inventoryAssignments;
    
    return inventoryAssignments.filter(a => {
      // If "All" is checked, show everything
      if (showAll) return true;
      // If "Available" is checked, show available printers
      if (showAvailable && a.status === 'available') return true;
      // If "Assigned" is checked, show assigned printers
      if (showAssigned && ['active', 'inactive', 'undeployed'].includes(a.status) && a.client_id != null && a.client_id !== '') return true;
      // If "Client Owned" is checked, show client-owned printers
      if (showClientOwned && a.is_client_owned) return true;
      // If none are checked, show only inventory with no client assignment and not available
      if (!showAll && !showAvailable && !showAssigned && !showClientOwned) {
        return a.client_id == null && a.status !== 'available';
      }
      return false;
    });
  }, [inventoryAssignments, showAll, showAvailable, showAssigned, showClientOwned, printerFilter]);

  // Optimized handlers with useCallback
  const handlePrinterSelected = useCallback((printerId: string, printerName: string) => {
    setSelectedPrinter({ id: printerId, name: printerName });
    setShowPrinterSelection(false);
    setShowAssignToClient(true);
  }, []);

  const handleAssignmentComplete = useCallback(() => {
    setShowAssignToClient(false);
    setSelectedPrinter(null);
    refreshPrinters();
  }, [refreshPrinters]);

  const handlePrinterAdded = useCallback(() => {
    setShowAddPrinter(false);
    refreshPrinters();
  }, [refreshPrinters]);

  const handleFilteredDataChange = useCallback((data: any[]) => {
    setFilteredData(data);
  }, []);

  const handleEditAssignment = useCallback((printer: any) => {
    setSelectedPrinterForAssignment(printer);
    setShowEditAssignmentModal(true);
  }, []);

  const handleAssignmentUpdated = useCallback(async () => {
    console.log('🔄 Assignment updated, refreshing data...');
    try {
      await refreshPrinters();
      setShowEditAssignmentModal(false);
      setSelectedPrinterForAssignment(null);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, [refreshPrinters]);

  const handleOpenAssignModal = () => setShowAssignModal(true);
  const handleCloseAddToInventoryModal = () => setShowAddToInventoryModal(false);
  const handleOpenAddToInventoryModal = () => setShowAddToInventoryModal(true);
  const handleOpenCatalogAddPrinterModal = () => setShowCatalogAddPrinterModal(true);
  const handleCloseCatalogAddPrinterModal = () => setShowCatalogAddPrinterModal(false);

  // Clear filteredData when printerFilter changes or when searchQuery is cleared
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredData([]);
    }
  }, [printerFilter, searchQuery]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50 safe-area-inset-top">
        {/* Mobile-First Header - Fixed and compact */}
        <header className="sticky top-0 z-20 bg-blue-100/95 backdrop-blur-sm border-b border-blue-200 shadow-sm safe-area-inset-top">
          <div className="flex items-center justify-between px-3 py-2 min-h-[44px]">
            <div className="flex items-center gap-2 flex-1">
              <Printer className="w-5 h-5 text-blue-500 flex-shrink-0" />
            </div>
            {/* Catalog Button on the right - Only show if user is NOT a client */}
            {userProfile?.role !== 'client' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-20 flex-shrink-0 min-touch-target"
                onClick={() => setPrinterFilter('catalog')}
                aria-label="Catalog"
              >
                Catalog
              </Button>
            )}
          </div>
        </header>

        {/* Main Content - Mobile optimized scrolling */}
        <div className="flex-1 overflow-y-auto overscroll-contain pb-safe">
          <div className="py-2 space-y-3 w-full max-w-full p-0 m-0">
            {/* Compact Database Summary */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-blue-100 p-3">
              <DatabaseSummary />
            </div>

            {/* Help Banner - Collapsible on mobile */}
            <PrinterDashboardHelpBanner printerFilter={printerFilter} />

            {/* Main Content */}
            <main className="pb-4">
              {printerFilter === 'inventory' && (
                <div
                  className="w-full z-10 sticky top-[44px] sm:static mb-3"
                  style={{
                    // top offset matches the header height (44px)
                    // z-index ensures it stays above content but below modals
                  }}
                >
                  <div
                    className="
                      bg-white/90 border border-blue-100 rounded-xl p-3
                      flex flex-col gap-2
                      sm:flex-row sm:gap-4 sm:items-center
                      shadow-sm
                    "
                    aria-label="Inventory Filters"
                  >
                    <span className="text-xs font-semibold text-blue-700 mb-1 sm:mb-0">Filters</span>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={showAll}
                        onChange={e => setShowAll(e.target.checked)}
                        className="w-5 h-5 accent-blue-500"
                      />
                      All
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={showAvailable}
                        onChange={e => setShowAvailable(e.target.checked)}
                        className="w-5 h-5 accent-blue-500"
                      />
                      Available
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={showAssigned}
                        onChange={e => setShowAssigned(e.target.checked)}
                        className="w-5 h-5 accent-blue-500"
                      />
                      Assigned
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={showClientOwned}
                        onChange={e => setShowClientOwned(e.target.checked)}
                        className="w-5 h-5 accent-blue-500"
                      />
                      Client Owned
                    </label>
                  </div>
                </div>
              )}
              <PrinterTabContent 
                debug={debugMode} 
                isLoading={printersLoading} 
                filteredData={printerFilter === 'inventory' ? filteredInventoryAssignments : displayPrinters} 
                searchQuery={searchQuery} 
                onDataRefresh={refreshPrinters} 
                printerFilter={printerFilter} 
                onEditAssignment={handleEditAssignment} 
                onShowAssignModal={handleOpenAssignModal}
                onShowAddToInventoryModal={handleOpenAddToInventoryModal}
              />
            </main>
          </div>
        </div>

        {/* Fixed Bottom Navigation */}
        <div className="sticky bottom-0 z-30 w-full safe-area-inset-bottom">
          <PrinterDashboardNav
            printerFilter={printerFilter}
            setPrinterFilter={setPrinterFilterWithURL}
            onFilteredDataChange={handleFilteredDataChange}
            editAssignmentModal={showEditAssignmentModal && selectedPrinterForAssignment ? (
              <div />
            ) : null}
          />
        </div>

        {/* Modals */}
        <PrinterDashboardModals
          showPrinterSelection={showPrinterSelection}
          onClosePrinterSelection={() => setShowPrinterSelection(false)}
          onPrinterSelected={handlePrinterSelected}
          showAssignToClient={showAssignToClient}
          onCloseAssignToClient={() => setShowAssignToClient(false)}
          selectedPrinter={selectedPrinter}
          onAssignmentComplete={handleAssignmentComplete}
          showAddPrinter={showAddPrinter}
          onCloseAddPrinter={() => setShowAddPrinter(false)}
          onPrinterAdded={handlePrinterAdded}
          showEditAssignmentModal={showEditAssignmentModal}
          onCloseEditAssignmentModal={() => {
            setShowEditAssignmentModal(false);
            setSelectedPrinterForAssignment(null);
          }}
          selectedPrinterForAssignment={selectedPrinterForAssignment}
          onAssignmentUpdated={handleAssignmentUpdated}
        />
        {showAssignModal && (
          <AssignModal
            isOpen={showAssignModal}
            onClose={() => setShowAssignModal(false)}
            onAssigned={() => setShowAssignModal(false)}
          />
        )}
        {showAddToInventoryModal && (
          <AddToInventoryModal
            isOpen={showAddToInventoryModal}
            onClose={handleCloseAddToInventoryModal}
            onAdded={handleCloseAddToInventoryModal}
          />
        )}
        {/* Only show floating + button if user is NOT a client */}
        {userProfile?.role !== 'client' && 
          (printerFilter === 'inventory' || printerFilter === 'available' || printerFilter === 'assigned' || printerFilter === 'catalog') &&
          !(showAssignModal || showAddToInventoryModal || showCatalogAddPrinterModal) && (
            <button
              className="fixed bottom-[80px] right-6 z-50 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-2xl flex items-center justify-center text-3xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ pointerEvents: 'auto' }}
              aria-label={
                printerFilter === 'assigned' ? 'Assign Printer' :
                printerFilter === 'catalog' ? 'Add Printer to Catalog' :
                'Add Printer'
              }
              onClick={
                printerFilter === 'assigned' ? handleOpenAssignModal :
                printerFilter === 'catalog' ? handleOpenCatalogAddPrinterModal :
                handleOpenAddToInventoryModal
              }
            >
              <span className="sr-only">
                {printerFilter === 'assigned' ? 'Assign Printer' :
                  printerFilter === 'catalog' ? 'Add Printer to Catalog' :
                  'Add Printer'}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
        )}
        {showCatalogAddPrinterModal && (
          <AddPrinterModal
            isOpen={showCatalogAddPrinterModal}
            onClose={handleCloseCatalogAddPrinterModal}
            onPrinterAdded={handleCloseCatalogAddPrinterModal}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default PrinterDashboard;
