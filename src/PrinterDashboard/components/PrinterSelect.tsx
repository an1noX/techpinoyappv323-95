import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface PrinterSelectProps {
  productId: string;
  isOpen: boolean;
  onClose: () => void;
  compatiblePrinters: any[];
}

export const PrinterSelect: React.FC<PrinterSelectProps> = ({
  productId,
  isOpen,
  onClose,
  compatiblePrinters,
}) => {
  const [allPrinters, setAllPrinters] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [showNewPrinterModal, setShowNewPrinterModal] = useState(false);
  const [newPrinterLoading, setNewPrinterLoading] = useState(false);
  const [newPrinterError, setNewPrinterError] = useState<string | null>(null);
  const [newPrinter, setNewPrinter] = useState({
    name: '',
    model: '',
    manufacturer: '',
    series: '',
    description: ''
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAvailablePrinters();
      setSearch('');
      setSelectedPrinterId(null);
      setSuggestions([]);
      setAddError(null);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, compatiblePrinters]);

  const fetchAvailablePrinters = async () => {
    setAddError(null);
    try {
      const { data: printers, error } = await supabase
        .from('printers')
        .select('*')
        .order('name');

      if (error) throw error;

      const linkedPrinterIds = compatiblePrinters.map(p => p.id);
      const availablePrinters = printers.filter(p => !linkedPrinterIds.includes(p.id));
      setAllPrinters(availablePrinters);
      setSuggestions(availablePrinters);
    } catch (error) {
      setAddError('Failed to fetch printers.');
      setAllPrinters([]);
      setSuggestions([]);
    }
  };

  useEffect(() => {
    if (!search) {
      setSuggestions(allPrinters);
      return;
    }
    const lower = search.toLowerCase();
    setSuggestions(
      allPrinters.filter(
        p =>
          p.name.toLowerCase().includes(lower) ||
          (p.model && p.model.toLowerCase().includes(lower)) ||
          (p.manufacturer && p.manufacturer.toLowerCase().includes(lower)) ||
          (p.series && p.series.toLowerCase().includes(lower))
      )
    );
  }, [search, allPrinters]);

  const handlePrinterSelect = (printerId: string) => {
    setSelectedPrinterId(printerId);
    const printer = allPrinters.find(p => p.id === printerId);
    if (printer) {
      const displayName = [printer.manufacturer, printer.series, printer.model || printer.name]
        .filter(Boolean)
        .join(' ');
      setSearch(displayName);
    }
  };

  const handleConfirmAddPrinter = async () => {
    if (!selectedPrinterId || !productId) return;
    setAddLoading(true);
    setAddError(null);
    try {
      const { error } = await supabase
        .from('product_printers')
        .insert({ product_id: productId, printer_id: selectedPrinterId });
      if (error) throw error;
      handleClose();
      window.dispatchEvent(new CustomEvent('refresh-compatible-printers', { detail: { productId } }));
    } catch (err: any) {
      setAddError('Failed to link printer.');
    }
    setAddLoading(false);
  };

  const handleNewPrinterSubmit = async () => {
    if (!newPrinter.name.trim()) {
      setNewPrinterError('Name is required.');
      return;
    }

    setNewPrinterLoading(true);
    setNewPrinterError(null);
    
    try {
      const printerData = {
        name: newPrinter.name.trim(),
        model: newPrinter.model.trim() || null,
        manufacturer: newPrinter.manufacturer.trim() || null,
        series: newPrinter.series.trim() || null,
        description: newPrinter.description.trim() || null,
      };

      const { data: createdPrinter, error } = await supabase
        .from('printers')
        .insert(printerData)
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      // Link the new printer to the product
      const { error: linkError } = await supabase
        .from('product_printers')
        .insert({ 
          product_id: productId, 
          printer_id: createdPrinter.id 
        });

      if (linkError) {
        console.error('Link error:', linkError);
        if (linkError.code === '23505') {
          throw new Error('This printer is already linked to this product.');
        } else {
          throw new Error(`Failed to link printer to product: ${linkError.message}`);
        }
      }

      handleCloseNewPrinterModal();
      handleClose();
      window.dispatchEvent(new CustomEvent('refresh-compatible-printers', { detail: { productId } }));
    } catch (err: any) {
      console.error('Printer creation error:', err);
      setNewPrinterError(err.message || 'Failed to create printer.');
    }
    
    setNewPrinterLoading(false);
  };

  const handleCloseNewPrinterModal = () => {
    setShowNewPrinterModal(false);
    setNewPrinter({
      name: '',
      model: '',
      manufacturer: '',
      series: '',
      description: ''
    });
    setNewPrinterError(null);
  };

  const handleClose = () => {
    setSelectedPrinterId(null);
    setAddError(null);
    setSearch('');
    setSuggestions(allPrinters);
    onClose();
  };

  return (
    <>
      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Supported Printer</DialogTitle>
          </DialogHeader>

          {addError && (
            <div className="text-red-500 text-sm mb-4">{addError}</div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <label htmlFor="printer-search" className="block text-sm font-medium mb-1">
                Search Printer
              </label>
              <input
                id="printer-search"
                ref={inputRef}
                type="text"
                className="w-full border rounded-md shadow-sm p-2"
                placeholder="Type printer name, model, or manufacturer..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setSelectedPrinterId(null);
                }}
                autoComplete="off"
              />
              {/* Suggestions dropdown */}
              {suggestions.length > 0 && search !== '' && (
                <div className="border rounded-md shadow-sm mt-1 bg-white max-h-56 overflow-auto z-10 absolute w-full">
                  {suggestions.map(printer => (
                    <div
                      key={printer.id}
                      className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                        selectedPrinterId === printer.id ? 'bg-gray-200' : ''
                      }`}
                      onClick={() => handlePrinterSelect(printer.id)}
                    >
                      <span className="flex flex-col">
                        <span className="font-medium">
                          {[printer.manufacturer, printer.series, printer.model || printer.name]
                            .filter(Boolean)
                            .join(' ')}
                        </span>
                        {printer.description && (
                          <span className="text-xs text-gray-500">{printer.description}</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {/* If no suggestions */}
              {suggestions.length === 0 && search !== '' && (
                <div className="text-sm text-gray-400 mt-2">No matching printers found.</div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowNewPrinterModal(true)}
              >
                Add New Printer
              </Button>
              <Button
                onClick={handleConfirmAddPrinter}
                disabled={!selectedPrinterId || addLoading}
              >
                {addLoading ? 'Linking...' : 'Link Printer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Printer Modal */}
      <Dialog open={showNewPrinterModal} onOpenChange={setShowNewPrinterModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Printer</DialogTitle>
          </DialogHeader>

          {newPrinterError && (
            <div className="text-red-500 text-sm mb-4">{newPrinterError}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Printer Name *
              </label>
              <input
                type="text"
                className="w-full border rounded-md shadow-sm p-2"
                placeholder="Enter printer name"
                value={newPrinter.name}
                onChange={e => setNewPrinter(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Manufacturer
              </label>
              <input
                type="text"
                className="w-full border rounded-md shadow-sm p-2"
                placeholder="Enter manufacturer"
                value={newPrinter.manufacturer}
                onChange={e => setNewPrinter(prev => ({ ...prev, manufacturer: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Series
              </label>
              <input
                type="text"
                className="w-full border rounded-md shadow-sm p-2"
                placeholder="Enter series"
                value={newPrinter.series}
                onChange={e => setNewPrinter(prev => ({ ...prev, series: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Model
              </label>
              <input
                type="text"
                className="w-full border rounded-md shadow-sm p-2"
                placeholder="Enter model"
                value={newPrinter.model}
                onChange={e => setNewPrinter(prev => ({ ...prev, model: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                className="w-full border rounded-md shadow-sm p-2"
                placeholder="Enter description"
                rows={3}
                value={newPrinter.description}
                onChange={e => setNewPrinter(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={handleCloseNewPrinterModal}
              >
                Cancel
              </Button>
              <Button
                onClick={handleNewPrinterSubmit}
                disabled={newPrinterLoading || !newPrinter.name.trim()}
              >
                {newPrinterLoading ? 'Creating...' : 'Create & Link Printer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};