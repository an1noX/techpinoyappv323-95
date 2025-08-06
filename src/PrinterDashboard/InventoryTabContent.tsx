
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { usePrinterUnits, useInventorySummary } from '@/hooks/usePrinterUnits';
import { PrinterUnit } from '@/types/printer-unit';
import { printerUnitService } from '@/services/printerUnitService';
import { useToast } from '@/hooks/use-toast';
import EnhancedPrinterUnitCard from './inventory/EnhancedPrinterUnitCard';
import InventorySummaryCards from './inventory/InventorySummaryCards';
import InventoryFilters from './inventory/InventoryFilters';
import QuickStatusFilters from './inventory/QuickStatusFilters';
import AddUnitDialog from './inventory/AddUnitDialog';
import EditUnitDialog from './inventory/EditUnitDialog';
import InventoryEmptyState from './inventory/InventoryEmptyState';
import VisibilityManagementDialog from './inventory/VisibilityManagementDialog';
import { CustomLoading } from "@/components/ui/CustomLoading";

interface InventoryTabContentProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  debug?: boolean;
}

export default function InventoryTabContent({ 
  searchQuery = '', 
  onSearchChange,
  debug = false
}: InventoryTabContentProps) {
  const [statusFilter, setStatusFilter] = useState<PrinterUnit['status'] | 'all'>('all');
  const [conditionFilter, setConditionFilter] = useState<PrinterUnit['condition'] | 'all'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isVisibilityDialogOpen, setIsVisibilityDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<PrinterUnit | null>(null);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [newUnit, setNewUnit] = useState({
    printer_id: '',
    serial_number: '',
    asset_tag: '',
    condition: 'good' as PrinterUnit['condition'],
    status: 'available' as PrinterUnit['status'],
    location: '',
    purchase_date: '',
    purchase_price: '',
    warranty_expiry: '',
    notes: ''
  });
  
  const { printerUnits, loading, loadPrinterUnits } = usePrinterUnits(
    statusFilter === 'all' ? undefined : statusFilter
  );
  const { summary, loading: summaryLoading } = useInventorySummary();
  const { toast } = useToast();

  // Load clients for visibility management
  React.useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const clientData = await printerUnitService.getClients();
      setClients(clientData);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  // Filter units based on search and condition with null safety
  const filteredUnits = React.useMemo(() => {
    if (!Array.isArray(printerUnits)) {
      return [];
    }

    return printerUnits.filter(unit => {
      // Null safety checks
      if (!unit) return false;

      const matchesSearch = !searchQuery || 
        unit.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.asset_tag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.printer?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCondition = conditionFilter === 'all' || unit.condition === conditionFilter;
      
      return matchesSearch && matchesCondition;
    });
  }, [printerUnits, searchQuery, conditionFilter]);

  const handleAddUnit = async () => {
    try {
      const unitData = {
        ...newUnit,
        purchase_price: newUnit.purchase_price ? parseFloat(newUnit.purchase_price) : undefined,
        purchase_date: newUnit.purchase_date || undefined,
        warranty_expiry: newUnit.warranty_expiry || undefined,
      };
      
      await printerUnitService.createPrinterUnit(unitData);
      await loadPrinterUnits();
      setIsAddDialogOpen(false);
      setNewUnit({
        printer_id: '',
        serial_number: '',
        asset_tag: '',
        condition: 'good',
        status: 'available',
        location: '',
        purchase_date: '',
        purchase_price: '',
        warranty_expiry: '',
        notes: ''
      });
      
      toast({
        title: "Success",
        description: "Printer unit added successfully",
      });
    } catch (error) {
      console.error('Error adding unit:', error);
      toast({
        title: "Error",
        description: "Failed to add printer unit. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditUnit = (unit: PrinterUnit) => {
    setSelectedUnit(unit);
    setIsEditDialogOpen(true);
  };

  const handleUpdateUnit = async () => {
    if (!selectedUnit) return;
    
    try {
      await printerUnitService.updatePrinterUnit(selectedUnit.id, {
        condition: selectedUnit.condition,
        status: selectedUnit.status,
        location: selectedUnit.location,
        notes: selectedUnit.notes,
      });
      
      await loadPrinterUnits();
      setIsEditDialogOpen(false);
      setSelectedUnit(null);
      
      toast({
        title: "Success",
        description: "Printer unit updated successfully",
      });
    } catch (error) {
      console.error('Error updating unit:', error);
      toast({
        title: "Error",
        description: "Failed to update printer unit. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMaintenanceAction = async (unit: PrinterUnit) => {
    try {
      await printerUnitService.updatePrinterUnit(unit.id, {
        status: 'maintenance',
        last_maintenance_date: new Date().toISOString().split('T')[0],
        maintenance_notes: 'Scheduled maintenance initiated',
      });
      
      await loadPrinterUnits();
      toast({
        title: "Success",
        description: "Unit marked for maintenance",
      });
    } catch (error) {
      console.error('Error setting maintenance:', error);
      toast({
        title: "Error",
        description: "Failed to schedule maintenance. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (unit: PrinterUnit, newStatus: PrinterUnit['status']) => {
    try {
      await printerUnitService.updatePrinterUnit(unit.id, {
        status: newStatus,
      });
      
      await loadPrinterUnits();
      toast({
        title: "Success",
        description: `Unit status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error changing status:', error);
      toast({
        title: "Error",
        description: "Failed to change unit status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleVisibilityChange = (unit: any) => {
    setSelectedUnit(unit);
    setIsVisibilityDialogOpen(true);
  };

  if (loading && summaryLoading) {
    return (
      <CustomLoading message="Loading inventory" fullscreen />
    );
  }

  // Handle error state gracefully
  if (!Array.isArray(printerUnits) && !loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Failed to load inventory data</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <InventorySummaryCards summary={summary} />
      
      <InventoryFilters
        searchQuery={searchQuery}
        onSearchChange={onSearchChange || (() => {})}
        statusFilter={statusFilter}
        onStatusFilterChange={(status) => setStatusFilter(status as PrinterUnit['status'] | 'all')}
        conditionFilter={conditionFilter}
        onConditionFilterChange={(condition) => setConditionFilter(condition as PrinterUnit['condition'] | 'all')}
        onAddUnit={() => setIsAddDialogOpen(true)}
      />

      <QuickStatusFilters
        statusFilter={statusFilter}
        onStatusFilterChange={(status) => setStatusFilter(status as PrinterUnit['status'] | 'all')}
        summary={summary}
      />

      <AddUnitDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        newUnit={newUnit}
        onUnitChange={setNewUnit}
        onAddUnit={handleAddUnit}
      />

      <EditUnitDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        selectedUnit={selectedUnit}
        onUnitChange={setSelectedUnit}
        onUpdateUnit={handleUpdateUnit}
      />

      <VisibilityManagementDialog
        isOpen={isVisibilityDialogOpen}
        onOpenChange={setIsVisibilityDialogOpen}
        unit={selectedUnit}
        onUpdate={loadPrinterUnits}
      />

      <div className="space-y-4">
        {loading ? (
          <CustomLoading />
        ) : filteredUnits.length === 0 ? (
          <InventoryEmptyState
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            conditionFilter={conditionFilter}
            onAddUnit={() => setIsAddDialogOpen(true)}
          />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {filteredUnits.length} of {printerUnits?.length || 0} units
              </p>
            </div>
            
            <div className="space-y-4">
              {filteredUnits.map((unit) => (
                <EnhancedPrinterUnitCard
                  key={unit.id}
                  unit={unit}
                  onEdit={handleEditUnit}
                  onMaintenance={handleMaintenanceAction}
                  onStatusChange={handleStatusChange}
                  onVisibilityChange={handleVisibilityChange}
                  clients={clients}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
