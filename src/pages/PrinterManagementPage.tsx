
import React, { useState } from 'react';
import { Printer, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePrinters } from '@/hooks/usePrinters';
import { printerService } from '@/services/printerService';

import { ADMIN_DASHBOARD_TABS, SEARCH_PLACEHOLDERS } from '@/constants/adminDashboard';
import PrinterSelectionModal from '@/components/admin-dashboard/components/PrinterSelectionModal';
import AssignPrinterToClientModal from '@/PrinterDashboard/AssignPrinterToClientModal';
import AddPrinterModal from '@/components/AddPrinterModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from '@/hooks/use-mobile';
import ErrorBoundary from '@/components/common/ErrorBoundary';

const PrinterManagementPage: React.FC = () => {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [printerFilter, setPrinterFilter] = useState<'assigned' | 'all'>('assigned');
  
  const [showAddPrinter, setShowAddPrinter] = useState(false);
  const [showPrinterSelection, setShowPrinterSelection] = useState(false);
  const [showAssignToClient, setShowAssignToClient] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<{ id: string, name: string } | null>(null);

  // Fetch both assigned and all printers based on filter
  const { printers: assignedPrinters, loading: assignedPrintersLoading, loadPrinters: loadAssignedPrinters } = usePrinters(true);
  const { printers: allPrinters, loading: allPrintersLoading, loadPrinters: loadAllPrinters } = usePrinters(false);

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

  const filterBySearch = (items: any[], searchField: string) => {
    if (!searchQuery.trim()) return items;
    return items?.filter(item => 
      item[searchField]?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];
  };

  const printersToUse = printerFilter === 'assigned' ? assignedPrinters : allPrinters;
  const isLoading = printerFilter === 'assigned' ? assignedPrintersLoading : allPrintersLoading;
  const filteredData = filterBySearch(printersToUse || [], 'name');

  const handleDataRefresh = () => {
    if (printerFilter === 'assigned') {
      loadAssignedPrinters();
    } else {
      loadAllPrinters();
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {isMobile ? (
          // Mobile Layout
          <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl flex flex-col relative">
            {/* Main Content - Scrollable */}
            <div className="flex-1 p-6 pb-24 overflow-y-auto">
              {/* Content */}
              <div className="mt-6">
                <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-8 shadow-lg h-full overflow-y-auto animate-scale-in">
                  {/* AdminTabContent was removed, so this section is now empty */}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Desktop Layout
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
            {/* Desktop Header */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg mx-6 mt-6 rounded-2xl px-8 py-6 animate-scale-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Printer className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      Printer Fleet Management
                    </h1>
                    <p className="text-gray-500 mt-1">
                      Monitor printer assignments and status
                    </p>
                  </div>
                </div>
                
                {/* Desktop Action Buttons */}
                <div className="flex items-center gap-3">
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
                </div>
              </div>
              

              
              {/* Desktop Content Area */}
              <div className="mt-6">
                <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-8 shadow-lg h-full overflow-y-auto animate-scale-in">
                  {/* AdminTabContent was removed, so this section is now empty */}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddPrinterModal
        isOpen={showAddPrinter}
        onClose={() => setShowAddPrinter(false)}
        onPrinterAdded={handlePrinterAdded}
      />

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

export default PrinterManagementPage;
