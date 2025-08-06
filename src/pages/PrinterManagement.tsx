import React, { useState } from 'react';
import { Printer, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Printer as PrinterType } from '@/types/database';
import AddPrinterModal from '@/components/AddPrinterModal';
import { usePrinters } from '@/hooks/usePrinters';
import { Switch } from '@/components/ui/switch';
import { printerService } from '@/services/printerService';

const PrinterManagement = () => {
  const { printers, loading, loadPrinters } = usePrinters();
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterType | null>(null);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllPrinters, setShowAllPrinters] = useState(false);
  const { printers: allPrinters, loadPrinters: reloadAllPrinters } = usePrinters();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handlePrinterSelect = (printer: PrinterType) => {
    setSelectedPrinter(printer);
    setSearchTerm(printer.name);
  };

  const handlePrinterUpdate = () => {
    loadPrinters();
    if (selectedPrinter) {
      // Refresh the selected printer data
      const updatedPrinter = printers.find(p => p.id === selectedPrinter.id);
      if (updatedPrinter) {
        setSelectedPrinter(updatedPrinter);
      }
    }
  };

  const handlePrinterDeleted = () => {
    setSelectedPrinter(null);
    setSearchTerm('');
    loadPrinters();
  };

  const handlePrinterAdded = () => {
    loadPrinters();
    setShowAddModal(false);
    setShowInventoryModal(false);
    setShowSelectionModal(false);
  };

  const handleAddToInventoryOnly = () => {
    setShowSelectionModal(false);
    setShowInventoryModal(true);
  };

  const handleAddWithInventoryTab = () => {
    setShowSelectionModal(false);
    setShowAddModal(true);
  };

  const handleToggleAvailable = async (printerId: string, current: boolean) => {
    setUpdatingId(printerId);
    try {
      await printerService.updatePrinter(printerId, { is_available: !current });
      await reloadAllPrinters();
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading printers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Panel */}
          <div className="lg:col-span-1">
            {/* PrinterSearchPanel component was removed, so this section is now empty */}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {selectedPrinter ? (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="text-center py-12">
                  <Printer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No printer selected</h3>
                  <p className="text-gray-600 mb-4">Search and select a printer to view details</p>
                  {printers.length === 0 && (
                    <p className="text-sm text-gray-500">
                      No printers found. Add your first printer to get started.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="text-center py-12">
                  <Printer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No printer selected</h3>
                  <p className="text-gray-600 mb-4">Search and select a printer to view details</p>
                  {printers.length === 0 && (
                    <p className="text-sm text-gray-500">
                      No printers found. Add your first printer to get started.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AddPrinterSelectionModal component was removed, so this section is now empty */}

      <AddPrinterModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onPrinterAdded={handlePrinterAdded}
      />

      {/* AddToInventoryModal component was removed, so this section is now empty */}

      {/* All Printers Modal */}
      {showAllPrinters && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">All Printers</h2>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowAllPrinters(false)}>Close</button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {allPrinters.map(printer => (
                <div key={printer.id} className="flex items-center justify-between border rounded-lg p-4">
                  <div>
                    <div className="font-medium text-gray-900">{printer.name}</div>
                    <div className="text-sm text-gray-500">{printer.model || ''} {printer.series || ''}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${printer.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>{printer.is_available ? 'Available' : 'Not Available'}</span>
                    <Switch checked={printer.is_available} onCheckedChange={() => handleToggleAvailable(printer.id, printer.is_available)} disabled={updatingId === printer.id} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrinterManagement;
