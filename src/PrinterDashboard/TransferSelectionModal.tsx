
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

interface TransferSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrinterSelected: (printerId: string, printerName: string) => void;
  currentPrinterId?: string; // Added to identify the current printer
}

interface Assignment {
  id: string;
  client_id: string;
  client_name: string;
  department_id: string;
  department_name: string;
  serial_number: string;
  location?: string;
}

const TransferSelectionModal: React.FC<TransferSelectionModalProps> = ({
  isOpen,
  onClose,
  onPrinterSelected,
  currentPrinterId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrinterId, setSelectedPrinterId] = useState('');
  const [compatibleProducts, setCompatibleProducts] = useState<Record<string, any[]>>({});

  // Fetch the current printer's model information
  const { data: currentPrinter } = useQuery({
    queryKey: ['current-printer', currentPrinterId],
    queryFn: async () => {
      if (!currentPrinterId) return null;
      
      const { data, error } = await supabase
        .from('printers')
        .select('id, name, model, manufacturer, series')
        .eq('id', currentPrinterId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!currentPrinterId && isOpen
  });

  // Fetch assignments that have the same printer model as the current printer
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['same-model-assignments', currentPrinter?.model, currentPrinter?.manufacturer],
    queryFn: async () => {
      if (!currentPrinter?.model) return [];

      const { data, error } = await supabase
        .from('printer_assignments')
        .select(`
          id,
          status,
          serial_number,
          clients(id, name),
          departments_location(
            id, 
            name, 
            departments(id, name)
          ),
          printer:printers!inner(
            id,
            name,
            manufacturer,
            model,
            series,
            color,
            image_url
          )
        `)
        .eq('status', 'active')
        .eq('printer.model', currentPrinter.model)
        .eq('printer.manufacturer', currentPrinter.manufacturer)
        .neq('printer.id', currentPrinterId); // Exclude the current printer

      if (error) throw error;

      return data?.map((assignment: any) => ({
        id: assignment.id,
        client_id: assignment.clients?.id || '',
        client_name: assignment.clients?.name || '',
        department_id: assignment.departments_location?.departments?.id || '',
        department_name: assignment.departments_location?.departments?.name || '',
        serial_number: assignment.serial_number || '',
        location: assignment.departments_location?.name || '',
        printer: assignment.printer
      })) || [];
    },
    enabled: !!currentPrinter?.model && isOpen
  });

  // Get unique printers from assignments
  const printers = assignments.reduce((acc: any[], assignment: any) => {
    const existingIndex = acc.findIndex(p => p.id === assignment.printer.id);
    if (existingIndex === -1) {
      acc.push({
        ...assignment.printer,
        printer_assignments: [assignment]
      });
    } else {
      acc[existingIndex].printer_assignments.push(assignment);
    }
    return acc;
  }, []);

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
            <span>Select Printer for Transfer</span>
          </DialogTitle>
          {currentPrinter && (
            <p className="text-sm text-gray-600 mt-1">
              Showing printers with same model: {currentPrinter.manufacturer} {currentPrinter.model}
            </p>
          )}
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
              <p className="text-gray-500">
                {currentPrinter 
                  ? `No other printers found with model: ${currentPrinter.manufacturer} ${currentPrinter.model}`
                  : 'No printers found'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredPrinters.map((printer) => {
                const assignment = Array.isArray(printer.printer_assignments) && printer.printer_assignments.length > 0 ? printer.printer_assignments[0] : null;
                const clientName = assignment?.clients?.name || assignment?.client_name || 'Client Name';
                const department = assignment?.departments_location?.departments?.name || assignment?.department_name || 'Department';
                const location = assignment?.departments_location?.name || assignment?.location || 'Location';
                const serialNumber = assignment?.serial_number || 'Serial No';
                const color = printer.color || 'Monochrome';
                const tonerList = compatibleProducts[printer.id] && compatibleProducts[printer.id].length > 0
                  ? compatibleProducts[printer.id].map((product: any) => `${product.name}${product.sku ? ` (${product.sku})` : ''}`)
                  : [];
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
                            <h4 className="font-medium text-sm">{clientName}</h4>
                            {isSelected && (
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-gray-600">
                              {department} - {location}
                            </p>
                            <p className="text-xs text-gray-600">
                              {serialNumber}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {color}
                            </Badge>
                            {tonerList.length > 0 && (
                              <div className="text-xs text-gray-500">
                                Toner: {tonerList.slice(0, 2).join(', ')}
                                {tonerList.length > 2 && ` +${tonerList.length - 2} more`}
                              </div>
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
          <div className="flex space-x-2 pt-4">
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

export default TransferSelectionModal;
