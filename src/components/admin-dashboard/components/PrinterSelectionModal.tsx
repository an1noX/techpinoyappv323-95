import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Printer, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { productService } from '@/services/productService';
import { CustomLoading } from "@/components/ui/CustomLoading";

interface PrinterSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrinterSelected: (printerId: string, printerName: string) => void;
}

const PrinterSelectionModal: React.FC<PrinterSelectionModalProps> = ({
  isOpen,
  onClose,
  onPrinterSelected
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrinterId, setSelectedPrinterId] = useState('');
  const [compatibleProducts, setCompatibleProducts] = useState<Record<string, any[]>>({});

  // Fetch available printers (not currently assigned or available for reassignment)
  const { data: printers = [], isLoading } = useQuery({
    queryKey: ['available-printers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('printers')
        .select(`
          id,
          name,
          manufacturer,
          model,
          series,
          color,
          printer_assignments!left(id, status),
          image_url
        `)
        .order('name');

      if (error) throw error;

      // Filter to show all printers (both assigned and unassigned)
      // This allows reassigning printers between locations/departments
      return data || [];
    },
    enabled: isOpen
  });

  const filteredPrinters = printers.filter(printer => {
    const matchesPrinter =
      printer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (printer.model && printer.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (printer.manufacturer && printer.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()));

    const compatible = compatibleProducts[printer.id] || [];
    const matchesToner = compatible.some(product =>
      (product.name && product.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return matchesPrinter || matchesToner;
  });

  useEffect(() => {
    if (!isOpen) return;
    // Fetch compatible products for all filtered printers
    const fetchAll = async () => {
      const result: Record<string, any[]> = {};
      for (const printer of printers) {
        try {
          const products = await productService.getProductsByPrinter(printer.id);
          result[printer.id] = products;
        } catch {
          result[printer.id] = [];
        }
      }
      setCompatibleProducts(result);
    };
    fetchAll();
  }, [printers, isOpen]);

  const handleSelect = () => {
    const selectedPrinter = printers.find(p => p.id === selectedPrinterId);
    if (selectedPrinter) {
      onPrinterSelected(selectedPrinter.id, selectedPrinter.name);
      handleClose();
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedPrinterId('');
    onClose();
  };

  const getAssignmentStatus = (printer: any) => {
    const activeAssignments = printer.printer_assignments?.filter((a: any) => a.status === 'active') || [];
    if (activeAssignments.length === 0) {
      return { status: 'available', label: 'Available', color: 'bg-green-100 text-green-700' };
    } else {
      return { status: 'assigned', label: 'Currently Assigned', color: 'bg-blue-100 text-blue-700' };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Printer className="h-5 w-5 text-white" />
            </div>
            <span>Select Printer</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search printers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Printer List */}
          {isLoading ? (
            <CustomLoading message="Loading printers" />
          ) : filteredPrinters.length === 0 ? (
            <div className="text-center py-8">
              <Printer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No printers found</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredPrinters.map((printer) => {
                const assignmentStatus = getAssignmentStatus(printer);
                const isSelected = selectedPrinterId === printer.id;
                
                return (
                  <Card
                    key={printer.id}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPrinterId(printer.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        {/* Thumbnail */}
                        <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded border overflow-hidden mr-3">
                          {printer.image_url ? (
                            <img src={printer.image_url} alt={printer.name} className="object-contain w-full h-full" />
                          ) : (
                            <Printer className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-sm">{printer.name}</h4>
                            {isSelected && (
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <div className="space-y-1">
                            {printer.model && (
                              <p className="text-xs text-gray-600">
                                Model: {printer.model}
                              </p>
                            )}
                            {printer.manufacturer && (
                              <p className="text-xs text-gray-600">
                                Manufacturer: {printer.manufacturer}
                              </p>
                            )}
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className={`text-xs ${assignmentStatus.color}`}>
                                {assignmentStatus.label}
                              </Badge>
                              {printer.color && (
                                <Badge variant="outline" className="text-xs">
                                  {printer.color}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {/* Toner Section */}
                          <div className="text-xs text-gray-500 mt-1">
                            <span className="font-semibold">Toner:</span>{' '}
                            {compatibleProducts[printer.id] && compatibleProducts[printer.id].length > 0 ? (
                              compatibleProducts[printer.id].map((product, idx) => (
                                <span key={product.id || idx} className="inline-block mr-2">
                                  {product.name}{product.sku ? ` (${product.sku})` : ''}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 ml-1">None</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSelect}
              disabled={!selectedPrinterId}
              className="flex-1"
            >
              Select Printer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrinterSelectionModal;
