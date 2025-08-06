import React, { useState } from 'react';
import { CompatibleProducts } from './CompatibleProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Printer, ArrowLeft, ArrowRight, Package, Settings, Check } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CustomLoading } from "@/components/ui/CustomLoading";
import { dataService } from '@/services/dataService';
import ClientListModal from '@/ClientDashboard/ClientListModal';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface AddToInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
}

interface PrinterCatalog {
  id: string;
  name: string;
  manufacturer?: string;
  model?: string;
  series?: string;
  image_url?: string;
}

export const AddToInventoryModal: React.FC<AddToInventoryModalProps> = ({
  isOpen,
  onClose,
  onAdded
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterCatalog | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [ownerType, setOwnerType] = useState<'client' | 'service_unit'>('service_unit');
  const [makeAvailable, setMakeAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isClientOwned, setIsClientOwned] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showSerialPrompt, setShowSerialPrompt] = useState(false);

  // Fetch all active printers from catalog
  const { data: printers = [], isLoading } = useQuery({
    queryKey: ['catalog-printers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('printers')
        .select('id, name, manufacturer, model, series, image_url')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      return data as PrinterCatalog[];
    },
    enabled: isOpen && step === 1
  });

  const filteredPrinters = printers.filter(printer =>
    printer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (printer.model && printer.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (printer.manufacturer && printer.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handlePrinterSelect = (printer: PrinterCatalog) => {
    setSelectedPrinter(printer);
    setStep(2);
  };

  const handleClientOwnedToggle = (checked: boolean) => {
    setIsClientOwned(checked);
    if (checked) {
      setShowClientModal(true);
    } else {
      setSelectedClient(null);
    }
  };

  const handleClientSelected = (client) => {
    setSelectedClient(client);
    setShowClientModal(false);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('printer_assignments')
        .insert({
          printer_id: selectedPrinter.id,
          client_id: isClientOwned && selectedClient ? selectedClient.id : null,
          serial_number: serialNumber.trim() || null,
          usage_type: isClientOwned ? 'client_owned' : 'service_unit',
          status: isClientOwned ? 'undeployed' : 'available',
          is_client_owned: isClientOwned,
        });
      if (error) throw error;
      toast({
        title: 'Success',
        description: 'Printer added to inventory successfully.',
      });
      dataService.clearCache();
      await queryClient.invalidateQueries({ queryKey: ['all-assignments'] });
      await queryClient.invalidateQueries({ queryKey: ['available-assignments'] });
      await queryClient.invalidateQueries({ queryKey: ['optimized-printer-data'] });
      await queryClient.invalidateQueries({ queryKey: ['catalog-printers'] });
      window.dispatchEvent(new CustomEvent('refresh-printer-data'));
      onAdded();
      handleClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add printer to inventory.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrinter) return;
    handleConfirm();
  };

  const handleClose = () => {
    setStep(1);
    setSelectedPrinter(null);
    setSearchQuery('');
    setSerialNumber('');
    setOwnerType('service_unit');
    setMakeAvailable(false);
    onClose();
  };

  const handleBack = () => {
    setStep(1);
    setSelectedPrinter(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      {/* Mobile-first modal container */}
      <div className="relative flex flex-col h-screen w-screen sm:h-auto sm:w-full sm:max-w-lg sm:rounded-2xl sm:shadow-2xl bg-white animate-in fade-in-0 slide-in-from-bottom-8">
        
        {/* Mobile Header - Sticky */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 sm:rounded-t-2xl">
          <div className="flex items-center justify-between p-4 sm:p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2.5 rounded-xl">
                <Printer className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {step === 1 ? 'Select Printer' : 'Add to Inventory'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  {step === 1 ? 'Choose a printer from catalog' : 'Configure inventory details'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-6">
            
            {step === 1 && (
              <>
                {/* Search Section */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Search className="h-4 w-4 mr-2 text-green-600" />
                    Search Printers
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search printers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-12 text-base"
                    />
                  </div>
                </div>

                {/* Printer List Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <Package className="h-4 w-4 mr-2 text-gray-600" />
                    Available Printers
                  </h3>
                  
                  {isLoading ? (
                    <CustomLoading />
                  ) : filteredPrinters.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                      <Printer className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No printers found</p>
                      <p className="text-sm text-gray-400 mt-1">Try adjusting your search criteria</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredPrinters.map((printer) => (
                        <Card
                          key={printer.id}
                          className="cursor-pointer border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
                          onClick={() => handlePrinterSelect(printer)}
                        >
                          <CardContent className="p-4">
                            <div className="flex flex-col">
                              {/* Printer Name at the top */}
                              <div className="font-bold text-base text-gray-900 mb-2 truncate">
                                {[
                                  printer.manufacturer,
                                  printer.series,
                                  printer.model || printer.name
                                ].filter(Boolean).join(' ')}
                              </div>
                              <div className="flex items-start gap-3">
                                {/* Printer Image */}
                                <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-xl border-2 border-gray-200 overflow-hidden">
                                  {printer.image_url ? (
                                    <img
                                      src={printer.image_url}
                                      alt={printer.name}
                                      className="object-contain w-full h-full"
                                    />
                                  ) : (
                                    <Printer className="h-8 w-8 text-gray-400" />
                                  )}
                                </div>
                                {/* Details */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                  <CompatibleProducts 
                                    printerId={printer.id} 
                                    className="mt-2 flex flex-row flex-wrap gap-2" 
                                  />
                                </div>
                                <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {step === 2 && selectedPrinter && (
              <>
                {/* Form Section */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-100">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Settings className="h-4 w-4 mr-2 text-purple-600" />
                      Inventory Details
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="serialNumber" className="text-sm font-semibold text-gray-700">
                          Serial Number
                        </Label>
                        <Input
                          id="serialNumber"
                          type="text"
                          value={serialNumber}
                          onChange={(e) => setSerialNumber(e.target.value)}
                          placeholder="Enter serial number (optional)"
                          className="h-12 text-base"
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200">
                        <div>
                          <Label htmlFor="client_owned_toggle" className="text-sm font-semibold text-gray-700">
                            Service Unit / Client Owned
                          </Label>
                          <p className="text-xs text-gray-500 mt-1">Switch to Client Owned to assign to a client</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowClientModal(true)}
                          className="mr-2"
                          disabled={!isClientOwned}
                        >
                          {selectedClient ? `Client: ${selectedClient.name}` : 'Select Client'}
                        </Button>
                        <input
                          type="checkbox"
                          id="client_owned_toggle"
                          checked={isClientOwned}
                          onChange={e => handleClientOwnedToggle(e.target.checked)}
                          className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                      </div>
                      {isClientOwned && selectedClient && (
                        <div className="ml-4 text-xs text-gray-600 mb-2">Selected: {selectedClient.name}</div>
                      )}
                    </div>
                  </div>
                </form>
                <ClientListModal
                  isOpen={showClientModal}
                  onClose={() => setShowClientModal(false)}
                  onClientSelected={handleClientSelected}
                  title="Select Client Owner"
                  description="Choose a client to own this printer."
                />
                <Dialog open={showSerialPrompt} onOpenChange={setShowSerialPrompt}>
                  <DialogContent>
                    <DialogTitle>No serial number has been added</DialogTitle>
                    <DialogDescription>
                      You can go back to enter it now, or click 'Done' to skip and update it later.
                    </DialogDescription>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowSerialPrompt(false)}>
                        Go Back
                      </Button>
                      <Button
                        onClick={() => {
                          setShowSerialPrompt(false);
                          handleConfirm();
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Done
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        {/* Mobile Footer - Sticky */}
        <div className="sticky bottom-0 z-10 bg-white border-t border-gray-200 sm:rounded-b-2xl">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              {step === 1 ? (
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="w-full sm:w-auto h-12 text-base font-medium"
                >
                  Cancel
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="w-full sm:w-auto h-12 text-base font-medium"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full sm:w-auto h-12 text-base font-medium bg-green-600 hover:bg-green-700 text-white"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Check className="h-4 w-4 mr-2" />
                        Add to Inventory
                      </div>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
