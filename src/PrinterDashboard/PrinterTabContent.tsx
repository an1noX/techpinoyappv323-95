
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer } from '@/types/database';
import PrinterDashboardTab from './PrinterDashboardTab';
import AddPrinterModal from '@/components/AddPrinterModal';
import EditPrinterFormModal from '@/components/EditPrinterFormModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { printerService } from '@/services/printerService';
import { useToast } from '@/hooks/use-toast';

interface PrinterTabContentProps {
  isLoading: boolean;
  filteredData: Printer[];
  searchQuery: string;
  onDataRefresh: () => void;
  printerFilter?: 'assigned' | 'catalog' | 'available' | 'inventory';
  debug?: boolean;
  onEditAssignment?: (printer: Printer) => void;
  onShowAssignModal?: () => void; // NEW PROP
  onShowAddToInventoryModal?: () => void; // NEW
}

const PrinterTabContent = React.memo<PrinterTabContentProps>(({
  isLoading,
  filteredData,
  searchQuery,
  onDataRefresh,
  printerFilter,
  debug = false,
  onEditAssignment,
  onShowAssignModal,
  onShowAddToInventoryModal // NEW
}) => {
  const navigate = useNavigate();
  const [showAddPrinter, setShowAddPrinter] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleItemClick = (printer: Printer) => {
    navigate(`/admin-dashboard/printers/${printer.id}`);
  };

  const handleAddNew = () => {
    if (printerFilter === 'assigned' && onShowAssignModal) {
      onShowAssignModal();
    } else if ((printerFilter === 'available' || printerFilter === 'inventory') && onShowAddToInventoryModal) {
      onShowAddToInventoryModal();
    } else {
    setShowAddPrinter(true);
    }
  };

  const handleEdit = (printer: Printer) => {
    setSelectedPrinter(printer);
    if (printerFilter === 'assigned' && onEditAssignment) {
      onEditAssignment(printer);
    } else {
      setShowEditModal(true);
    }
  };

  const handleDelete = (printer: Printer) => {
    setSelectedPrinter(printer);
    setShowDeleteModal(true);
  };

  const handlePrinterUpdated = () => {
    setShowEditModal(false);
    setSelectedPrinter(null);
    onDataRefresh();
  };

  const handleAssignmentUpdated = async (assignmentId, update) => {
    await supabase
      .from('printer_assignments')
      .update(update)
      .eq('id', assignmentId);
    setSelectedPrinter(null);
    onDataRefresh();
  };

  const handleDeleteConfirmed = async () => {
    if (!selectedPrinter || isDeleting) return;
    
    // Set deleting flag to prevent multiple calls
    setIsDeleting(true);
    
    // Capture the printer data before resetting state
    const printerToDelete = selectedPrinter;
    
    // Immediately close the dialog and reset state
    setShowDeleteModal(false);
    setSelectedPrinter(null);
    
    try {
      // Conditional delete logic based on printer filter
      if (printerFilter === 'catalog') {
        await printerService.softDeletePrinter(printerToDelete.id);
        toast({
          title: 'Success',
          description: 'Printer removed from catalog (soft deleted)',
        });
      } else {
        await printerService.deletePrinter(printerToDelete.id);
        toast({
          title: 'Success',
          description: 'Printer deleted successfully',
        });
      }
      onDataRefresh();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: `Failed to ${printerFilter === 'catalog' ? 'remove printer' : 'delete printer'}: ${err?.message || err?.toString()}`,
        variant: 'destructive',
      });
    } finally {
      // Reset deleting flag
      setIsDeleting(false);
    }
  };

  // Generate appropriate dialog props based on printer filter
  const getDeleteDialogProps = () => {
    if (printerFilter === 'catalog') {
      return {
        title: "Remove from Catalog",
        message: "Are you sure you want to remove this printer from the catalog? The printer data and history will be preserved.",
        confirmText: "Remove from Catalog"
      };
    } else {
      return {
        title: "Delete Printer",
        message: "Are you sure you want to permanently delete this printer? This action cannot be undone.",
        confirmText: "Delete"
      };
    }
  };

  const dialogProps = getDeleteDialogProps();

  return (
    <>
      <PrinterDashboardTab
        activeTab="printers"
        isLoading={isLoading}
        filteredData={filteredData}
        searchQuery={searchQuery}
        onItemClick={handleItemClick}
        onAddNew={handleAddNew}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDataRefresh={onDataRefresh}
        printerFilter={printerFilter}
        debug={debug}
      />
      {/* Add Printer Modal */}
      <AddPrinterModal
        isOpen={showAddPrinter}
        onClose={() => setShowAddPrinter(false)}
        onPrinterAdded={onDataRefresh}
      />
      {/* Edit Printer Modal for other tabs */}
      {selectedPrinter && showEditModal && printerFilter !== 'assigned' && (
        <EditPrinterFormModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPrinter(null);
          }}
          printer={selectedPrinter}
          onPrinterUpdated={handlePrinterUpdated}
          isLoading={false}
        />
      )}
      {/* Delete Confirmation Modal with conditional props */}
      {selectedPrinter && showDeleteModal && !isDeleting && (
        <AlertDialog 
          open={showDeleteModal && !!selectedPrinter && !isDeleting} 
          onOpenChange={(open) => {
            if (!open) {
              setShowDeleteModal(false);
              setSelectedPrinter(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dialogProps.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {dialogProps.message}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirmed} className="bg-red-600 hover:bg-red-700">
                {dialogProps.confirmText}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
});

PrinterTabContent.displayName = 'PrinterTabContent';

export default PrinterTabContent;
