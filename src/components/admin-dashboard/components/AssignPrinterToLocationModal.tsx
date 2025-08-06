import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Printer, Plus, Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { usePrinters } from '@/hooks/usePrinters';
import { productService } from '@/services/productService';
import { clientService } from '@/services/clientService';
import { useDepartments } from '@/components/admin-dashboard/hooks/useDepartments';

interface AssignPrinterToLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: any | null; // Changed from DepartmentLocation to any
  locations?: any[]; // Changed from DepartmentLocation to any
  departmentBaseName: string;
  clientId: string;
  onPrinterAssigned: () => void;
  departments?: any[]; // Changed from Department to any
  initialDepartmentId?: string;
}

const AssignPrinterToLocationModal: React.FC<AssignPrinterToLocationModalProps> = ({
  isOpen,
  onClose,
  location,
  locations,
  departmentBaseName,
  clientId,
  onPrinterAssigned,
  departments = [],
  initialDepartmentId
}) => {
  const [formData, setFormData] = useState({
    printerId: '',
    printerName: '',
    serialNumber: '',
    deploymentDate: '',
    usageType: 'service_unit', // default to 'service_unit'
    monthlyPrice: '',
    hasSecurityDeposit: false,
    securityDepositAmount: '',
    status: 'active' as 'active' | 'inactive' | 'returned',
    notes: '',
    locationName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [printerSearch, setPrinterSearch] = useState('');
  const [showPrinterDropdown, setShowPrinterDropdown] = useState(false);
  const { printers: availablePrinters, loading: loadingPrinters } = usePrinters(false); // only available printers
  const { data: departmentsData = [], isLoading: departmentsLoading, refetch } = useDepartments(clientId);
  const [selectedDepartmentLocationId, setSelectedDepartmentLocationId] = useState('');
  const [compatibleProductsMap, setCompatibleProductsMap] = useState<Record<string, any[]>>({});
  const [clientPricingMap, setClientPricingMap] = useState<Record<string, Record<string, number>>>({});
  const [loadingCompat, setLoadingCompat] = useState<string | null>(null);

  // Create a flat array of all department-location pairs for the client
  const departmentLocationOptions = React.useMemo(() => {
    if (locations && locations.length > 0) {
      // Limit to current department's locations
      return locations.map(loc => ({
        id: loc.id,
        label: `${departmentBaseName} - ${loc.name}`
      }));
    }
    // Fallback to all departments if not limited
    return (departmentsData || []).flatMap(dept =>
      (dept.locations || []).map(loc => ({
        id: loc.id,
        label: `${dept.name} - ${loc.name}`
      }))
    );
  }, [locations, departmentBaseName, departmentsData]);

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDepartmentLocationId('');
      setPrinterSearch('');
      setShowPrinterDropdown(false);
      // Set deployment date to today if not already set
      setFormData(prev => ({
        ...prev,
        deploymentDate: prev.deploymentDate || new Date().toISOString().split('T')[0]
      }));
    }
  }, [isOpen]);

  // Filter printers by search
  const filteredPrinters = printerSearch.trim() === ''
    ? availablePrinters
    : availablePrinters.filter(printer => {
        const term = printerSearch.toLowerCase();
        return (
          printer.name.toLowerCase().includes(term) ||
          (printer.manufacturer && printer.manufacturer.toLowerCase().includes(term)) ||
          (printer.model && printer.model.toLowerCase().includes(term)) ||
          (printer.series && printer.series.toLowerCase().includes(term))
        );
      });

  // Fetch compatible products and client pricing for a printer (with caching)
  const fetchCompatAndPricing = async (printerId: string) => {
    if (compatibleProductsMap[printerId]) return; // already cached
    setLoadingCompat(printerId);
    try {
      const products = await productService.getProductsByPrinter(printerId);
      setCompatibleProductsMap(prev => ({ ...prev, [printerId]: products }));
      // For each product, fetch client pricing (only for this client)
      const pricing: Record<string, number> = {};
      await Promise.all(products.map(async (product: any) => {
        const clients = await clientService.getProductClients(product.id);
        const clientEntry = clients.find((c: any) => c.client_id === clientId);
        if (clientEntry) pricing[product.id] = clientEntry.quoted_price;
      }));
      setClientPricingMap(prev => ({ ...prev, [printerId]: pricing }));
    } catch (e) {
      // ignore errors for now
    } finally {
      setLoadingCompat(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.printerId || !selectedDepartmentLocationId || !formData.deploymentDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Printer, Department/Location, and Deployment Date).",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('printer_assignments')
        .insert({
          printer_id: formData.printerId,
          client_id: clientId,
          department_location_id: selectedDepartmentLocationId,
          serial_number: formData.serialNumber || null,
          deployment_date: formData.deploymentDate,
          usage_type: formData.usageType,
          monthly_price: formData.usageType === 'rental' && formData.monthlyPrice ? parseFloat(formData.monthlyPrice) : null,
          has_security_deposit: formData.hasSecurityDeposit,
          security_deposit_amount: formData.hasSecurityDeposit && formData.securityDepositAmount ? parseFloat(formData.securityDepositAmount) : null,
          notes: formData.notes || null,
          status: formData.status
        });
      if (error) throw error;
      toast({
        title: "Success",
        description: `Printer has been assigned to location successfully!`,
      });
      onPrinterAssigned();
      handleClose();
    } catch (error) {
      console.error('Failed to assign printer:', error);
      toast({
        title: "Error",
        description: "Failed to assign printer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      printerId: '',
      printerName: '',
      serialNumber: '',
      deploymentDate: '',
      usageType: 'service_unit',
      monthlyPrice: '',
      hasSecurityDeposit: false,
      securityDepositAmount: '',
      status: 'active',
      notes: '',
      locationName: ''
    });
    setSelectedDepartmentLocationId('');
    setPrinterSearch('');
    setShowPrinterDropdown(false);
    onClose();
  };

  // Helper function for display name
  const getPrinterDisplayName = (printer: any) => {
    const manufacturer = printer.manufacturer || '';
    const series = printer.series || '';
    const model = printer.model || '';
    const name = printer.name || '';
    if (model) {
      return [manufacturer, series, model].filter(Boolean).join(' ');
    } else {
      return [manufacturer, series, name].filter(Boolean).join(' ');
    }
  };

  // Get the selected department and location names for display
  const selectedDepartmentLocation = departmentLocationOptions.find(opt => opt.id === selectedDepartmentLocationId);
  const departmentLocationDisplay = selectedDepartmentLocation ? selectedDepartmentLocation.label : '';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <div className="bg-green-600 p-2 rounded-lg">
                <Printer className="h-5 w-5 text-white" />
              </div>
              <span>Assign Printer to Location</span>
            </DialogTitle>
            {departmentLocationDisplay && (
              <p className="text-sm text-gray-600 mt-1">
                {departmentLocationDisplay}
              </p>
            )}
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Department / Location Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center">
                Department / Location *
              </Label>
              <Select
                value={selectedDepartmentLocationId || undefined}
                onValueChange={setSelectedDepartmentLocationId}
                disabled={isLoading || departmentsLoading || departmentLocationOptions.length === 0}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select a department and location" />
                </SelectTrigger>
                <SelectContent>
                  {departmentLocationOptions.length === 0 ? (
                    <div className="px-4 py-2 text-gray-500">No departments or locations available</div>
                  ) : (
                    departmentLocationOptions.map(opt => (
                      <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {departmentsLoading && <div className="text-sm text-gray-500 mt-2">Loading departments...</div>}
              {departmentLocationOptions.length === 0 && (
                <div className="text-xs text-red-500 mt-1">No departments or locations available. Please add one first.</div>
              )}
            </div>

            {/* Printer Selection */}
            <div>
              <Label>Printer *</Label>
              <div className="mb-4 relative">
                <input
                  type="text"
                  value={formData.printerName || printerSearch}
                  onChange={e => {
                    setPrinterSearch(e.target.value);
                    setFormData(prev => ({ ...prev, printerName: '', printerId: '' }));
                    setShowPrinterDropdown(true);
                  }}
                  onFocus={() => { setShowPrinterDropdown(true); setPrinterSearch(printerSearch); }}
                  placeholder="Search printers by name, model, or manufacturer..."
                  className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoComplete="off"
                  disabled={isLoading}
                />
                {showPrinterDropdown && printerSearch && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50 min-w-full">
                    {loadingPrinters ? (
                      <div className="p-4 text-center text-gray-500">Loading printers...</div>
                    ) : filteredPrinters.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">No printers found</div>
                    ) : (
                      filteredPrinters.map(printer => {
                        const compatProducts = compatibleProductsMap[printer.id] || [];
                        return (
                          <button
                            key={printer.id}
                            type="button"
                            className="w-full text-left px-2 py-2 bg-white border border-gray-200 rounded-lg shadow-sm mb-2 hover:bg-blue-50 focus:bg-blue-100 transition-colors"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                printerId: printer.id,
                                printerName: getPrinterDisplayName(printer)
                              }));
                              setPrinterSearch(getPrinterDisplayName(printer));
                              setShowPrinterDropdown(false);
                            }}
                            onMouseEnter={() => fetchCompatAndPricing(printer.id)}
                            onFocus={() => { setShowPrinterDropdown(true); setPrinterSearch(printerSearch); }}
                          >
                            <div className="flex items-center">
                              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded border overflow-hidden mr-3">
                                {printer.image_url ? (
                                  <img src={printer.image_url} alt={printer.name} className="object-contain w-full h-full" />
                                ) : (
                                  <Printer className="h-7 w-7 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm truncate" style={{ lineHeight: '1.2' }}>{getPrinterDisplayName(printer)}</div>
                                {/* Toner info and price badge row */}
                                {compatProducts && compatProducts.length > 0 && (
                                  <div className="mt-1 space-y-0.5">
                                    {compatProducts.map(product => {
                                      const clientPrice = clientPricingMap[printer.id] && clientPricingMap[printer.id][product.id] !== undefined
                                        ? clientPricingMap[printer.id][product.id]
                                        : null;
                                      return (
                                        <div key={product.id} className="flex items-center justify-between">
                                          <div className="text-xs text-gray-700 truncate flex items-center" style={{ lineHeight: '1.2' }}>
                                            {product.color && (
                                              <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 border border-gray-300" style={{ background: product.color }}></span>
                                            )}
                                            Toner: {product.name}
                                            {product.sku && <> ({product.sku})</>}
                                          </div>
                                          {clientPrice !== null ? (
                                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium whitespace-nowrap">₱{clientPrice.toLocaleString()}</span>
                                          ) : null}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Serial Number */}
            <div>
              <Label htmlFor="serial_number">Serial Number</Label>
              <Input
                id="serial_number"
                value={formData.serialNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                disabled={isLoading}
                placeholder="Enter serial number"
                className="mt-1"
              />
            </div>

            {/* Deployment Date */}
            <div>
              <Label htmlFor="deployment_date">Deployment Date *</Label>
              <Input
                id="deployment_date"
                type="date"
                value={formData.deploymentDate}
                onChange={(e) => setFormData(prev => ({ ...prev, deploymentDate: e.target.value }))}
                disabled={isLoading}
                className="mt-1"
                required
              />
            </div>

            {/* Usage Type */}
            <div>
              <Label>Usage Type</Label>
              <Select
                value={formData.usageType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, usageType: value }))}
                disabled={isLoading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service_unit">Service Unit</SelectItem>
                  <SelectItem value="client_owned">Client Owned</SelectItem>
                  <SelectItem value="rental">Rental</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Monthly Price (if rental) */}
            {formData.usageType === 'rental' && (
              <div>
                <Label htmlFor="monthly_price">Monthly Rental Price</Label>
                <Input
                  id="monthly_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.monthlyPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthlyPrice: e.target.value }))}
                  disabled={isLoading}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
            )}

            {/* Security Deposit */}
            <div className="flex items-center space-x-2 mt-2">
              <Label>Security Deposit</Label>
              <input
                type="checkbox"
                checked={formData.hasSecurityDeposit}
                onChange={(e) => setFormData(prev => ({ ...prev, hasSecurityDeposit: e.target.checked }))}
                disabled={isLoading}
                className="ml-2"
              />
              <span className="text-xs text-gray-500">Does this assignment require a security deposit?</span>
            </div>

            {formData.hasSecurityDeposit && (
              <div>
                <Label htmlFor="security_deposit_amount">Security Deposit Amount</Label>
                <Input
                  id="security_deposit_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.securityDepositAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, securityDepositAmount: e.target.value }))}
                  disabled={isLoading}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
            )}

            {/* Status */}
            <div>
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'active' | 'inactive' | 'returned' }))}
                disabled={isLoading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                disabled={isLoading}
                placeholder="Assignment notes..."
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !formData.printerId || !selectedDepartmentLocationId}
                className="flex-1"
              >
                {isLoading ? 'Assigning...' : 'Assign Printer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AssignPrinterToLocationModal;
