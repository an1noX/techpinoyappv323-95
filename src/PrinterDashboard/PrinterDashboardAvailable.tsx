import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, UserPlus } from 'lucide-react';
import { Printer as PrinterType } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { productService } from '@/services/productService';
import { assetService } from '@/services/assetService';
import { useAuth } from '@/hooks/useAuth'; // Change this import
import { CompatibleProducts } from './components/CompatibleProducts';
import EditPrinterFormModal from '@/components/EditPrinterFormModal';
import { usePrinterActions } from '@/hooks/usePrinterActions';
import DeleteAssignmentConfirmDialog from './components/modals/DeleteAssignmentConfirmDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AssignPrinterModal from '@/PrinterDashboard/components/modals/AssignPrinter';
import EditAssignmentModal from './components/modals/EditAssignment';
import EditAssignmentSerialModal from './components/modals/EditAssignmentSerialModal';
import AssignmentSelectionModal from './components/modals/AssignmentSelectionModal';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';

interface Client {
  id: string;
  name: string;
}

interface AvailablePrinterCardProps {
  printer: PrinterType & { available_count?: number };
  onEditVisibility?: (printer: PrinterType) => void;
  onDelete?: (printer: PrinterType) => void;
  onPrinterUpdated?: () => void;
}

const AvailablePrinterCard: React.FC<AvailablePrinterCardProps> = ({
  printer,
  onEditVisibility,
  onDelete,
  onPrinterUpdated
}) => {
  const { user, userProfile } = useAuth(); // Get userProfile from useAuth
  const [visibleToClients, setVisibleToClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAssignmentDialog, setShowDeleteAssignmentDialog] = useState(false);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false);
  const [showEditAssignmentSerialModal, setShowEditAssignmentSerialModal] = useState(false);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [assignmentIdToDelete, setAssignmentIdToDelete] = useState<string | null>(null);

  // New state for assignment selection modals
  const [showAssignmentSelectionModal, setShowAssignmentSelectionModal] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'assign' | 'decommission' | 'edit_serial'>('assign');

  const { updatePrinter, deletePrinter, isLoading } = usePrinterActions();
  const { toast } = useToast();

  const [firstCompatibleProduct, setFirstCompatibleProduct] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [selectedAssignmentToDelete, setSelectedAssignmentToDelete] = useState<any>(null);

  useEffect(() => {
    loadVisibleClients();
    loadAllClients();
    if (!printer.sku || !printer.color) {
      (async () => {
        try {
          const products = await productService.getProductsByPrinter(printer.id);
          if (products && products.length > 0) {
            setFirstCompatibleProduct(products[0]);
          }
        } catch (e) {
          setFirstCompatibleProduct(null);
        }
      })();
    }
  }, [printer.id, printer.sku, printer.color]);

  // Set up real-time subscription for this specific printer
  useEffect(() => {
    const channel = supabase
      .channel(`printer-available-${printer.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'printer_assignments',
          filter: `printer_id=eq.${printer.id}`
        },
        (payload) => {
          // Notify parent component to refresh data
          if (onPrinterUpdated) {
            onPrinterUpdated();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'printers',
          filter: `id=eq.${printer.id}`
        },
        (payload) => {
          if (onPrinterUpdated) {
            onPrinterUpdated();
          }
        }
      )
      .subscribe((status) => {
        // Subscription status handled silently
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [printer.id, onPrinterUpdated]);

  const loadVisibleClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('printer_visibility')
        .select(`
          client_id,
          clients:client_id (
            id,
            name
          )
        `)
        .eq('printer_id', printer.id);

      if (error) throw error;
      
      const clients = data?.map(v => v.clients).filter(Boolean) || [];
      setVisibleToClients(clients as Client[]);
    } catch (error) {
      console.error('Error loading visible clients:', error);
      setVisibleToClients([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setAllClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const success = await updatePrinter(printer.id, { 
        is_available: newStatus === 'available',
      });
      if (success && onPrinterUpdated) {
        onPrinterUpdated();
      }
    } catch (error) {
      console.error('Failed to update printer status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleEditPrinter = () => {
    setShowEditModal(true);
  };

  const handleDeleteRecord = async () => {
    setDeleting(true);
    try {
      await assetService.deleteAssignment(selectedAssignmentToDelete.id);
      toast({
        title: 'Success',
        description: 'Assignment permanently deleted.',
      });
      setShowDeleteConfirmDialog(false);
      if (onPrinterUpdated) {
        onPrinterUpdated();
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: `Failed to delete assignment ${selectedAssignmentToDelete.id}: ${err?.message || JSON.stringify(err)}`,
        variant: 'destructive',
      });
      console.error('Delete error details:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeletePrinter = async () => {
    try {
      setLoading(true);
      // Get the available assignment for this printer
      const { data: assignment, error } = await supabase
        .from('printer_assignments')
        .select('id, serial_number, printer_id')
        .eq('printer_id', printer.id)
        .eq('status', 'available')
        .maybeSingle();

      if (error) throw error;
      
      if (assignment) {
        setSelectedAssignmentToDelete(assignment);
        setShowDeleteConfirmDialog(true);
      } else {
        toast({
          title: 'Error',
          description: 'No available assignment found for this printer.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error loading assignment:', err);
      toast({
        title: 'Error',
        description: 'Failed to load printer assignment.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrinterUpdated = async (printerData: Partial<PrinterType>) => {
    const success = await updatePrinter(printer.id, printerData);
    if (success) {
      setShowEditModal(false);
      if (onPrinterUpdated) {
        onPrinterUpdated();
      }
    }
  };

  const handleVisibilityClick = () => {
    if (onEditVisibility) {
      onEditVisibility(printer);
    } else {
      setShowVisibilityModal(true);
    }
  };

  const handleAssignPrinter = () => {
    // Show assignment selection modal for assign
    setSelectionMode('assign');
    setShowAssignmentSelectionModal(true);
  };

  const handleAssignmentComplete = () => {
    setShowAssignModal(false);
    toast({
      title: 'Success',
      description: 'Printer assigned successfully',
    });
    if (onPrinterUpdated) {
      onPrinterUpdated();
    }
  };

  const handleEditAssignment = () => {
    // Show assignment selection modal for edit serial
    setSelectionMode('edit_serial');
    setShowAssignmentSelectionModal(true);
  };

  const handleDeleteAssignment = () => {
    // Show assignment selection modal for decommission
    setSelectionMode('decommission');
    setShowAssignmentSelectionModal(true);
  };

  const handleDeleteAssignmentSuccess = () => {
    setShowDeleteAssignmentDialog(false);
    toast({
      title: 'Success',
      description: 'Assignment decommissioned successfully',
    });
    if (onPrinterUpdated) {
      onPrinterUpdated();
    }
  };

  const handleSerialUpdated = () => {
    setShowEditAssignmentSerialModal(false);
    toast({
      title: 'Success',
      description: 'Serial number updated successfully',
    });
    if (onPrinterUpdated) {
      onPrinterUpdated();
    }
  };



  // Handle assignment selection
  const handleAssignmentSelected = (assignmentId: string) => {
    setAssignmentId(assignmentId);
    setShowAssignmentSelectionModal(false);

    switch (selectionMode) {
      case 'assign':
        setShowAssignModal(true);
        break;
      case 'decommission':
        setSelectedAssignmentToDelete({ id: assignmentId });
        setShowDeleteConfirmDialog(true);
        break;
      case 'edit_serial':
        setShowEditAssignmentSerialModal(true);
        break;
    }
  };

  const getSelectionModalProps = () => {
    switch (selectionMode) {
      case 'assign':
        return {
          title: 'Select Assignment to Assign',
          description: 'Choose which available unit you want to assign to a client.'
        };
      case 'decommission':
        return {
          title: 'Select Assignment to Decommission',
          description: 'Choose which assignment you want to decommission.'
        };
      case 'edit_serial':
        return {
          title: 'Select Assignment to Edit',
          description: 'Choose which assignment\'s serial number you want to edit.'
        };
      default:
        return {
          title: 'Select Assignment',
          description: 'Choose an assignment to continue.'
        };
    }
  };

  return (
    <>
      <div className="bg-green-50/80 border border-green-200/80 rounded-lg shadow-sm w-full hover:shadow-md transition-shadow touch-manipulation">
        <div className="p-3 w-full max-w-full flex flex-col">
          {/* Printer name (top row) */}
          <div className="mb-1">
            <span className="font-bold text-base text-gray-900 truncate">
              {[printer.manufacturer, printer.series, printer.model || printer.name].filter(Boolean).join(' ')}
            </span>
          </div>
          {/* Second row: image (left), right: action buttons (top), product info (below) */}
          <div className="flex items-start gap-3 mb-1">
            {/* Printer image */}
            <div className="relative flex-shrink-0">
              <img
                src={printer.image_url || '/placeholder.svg'}
                alt={printer.name}
                className="w-24 h-24 object-cover rounded-md"
              />
              {printer.available_count && printer.available_count > 1 && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-blue-500 text-white"
                >
                  {printer.available_count}
                </Badge>
              )}
            </div>
            {/* Right side: action buttons (top), product info (below, left-aligned under buttons) */}
            <div className="flex-1 min-w-0 flex flex-col justify-start h-16">
              {/* Action buttons - Only show if user is NOT a client */}
              {userProfile?.role !== 'client' && (
                <div className="flex gap-2 mb-1 justify-start">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={handleAssignPrinter} 
                    title="Assign"
                  >
                    <UserPlus className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={handleEditAssignment} 
                    title="Edit"
                  >
                    <Edit className="h-4 w-4 text-green-600" />
                  </Button>
                  {userProfile?.role === 'superadmin' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8"
                      onClick={handleDeletePrinter}
                      disabled={deleting}
                      title="Delete Record"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              )}
              {/* Compatible Products: product name, sku, color dot */}
              <CompatibleProducts 
                printerId={printer.id} 
                className="text-xs flex flex-row flex-wrap gap-2 mt-1" 
              />
            </div>
          </div>
          {/* Section Divider */}
          <hr className="my-2 border-t border-green-200/50" />
          {/* Client Visibility Section - Compact */}
          <div className="mb-3 pb-3 border-b border-green-200/50">
            <h5 className="text-xs font-medium text-gray-700 mb-1">Visible to Clients:</h5>
            {loading ? (
              <p className="text-xs text-gray-500 italic">Loading...</p>
            ) : visibleToClients.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {visibleToClients.slice(0, 3).map(client => (
                  <Badge key={client.id} variant="outline" className="text-xs bg-gray-50">
                    {client.name}
                  </Badge>
                ))}
                {visibleToClients.length > 3 && (
                  <Badge variant="outline" className="text-xs bg-gray-50">
                    +{visibleToClients.length - 3} more
                  </Badge>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No visibility set</p>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Selection Modal */}
      <AssignmentSelectionModal
        isOpen={showAssignmentSelectionModal}
        onClose={() => setShowAssignmentSelectionModal(false)}
        printer={printer}
        onAssignmentSelected={handleAssignmentSelected}
        {...getSelectionModalProps()}
      />

      {/* Edit Printer Modal */}
      <EditPrinterFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        printer={printer}
        onPrinterUpdated={handlePrinterUpdated}
        isLoading={isLoading}
      />

      {/* Delete Assignment Confirm Dialog */}
      <DeleteAssignmentConfirmDialog
        assignmentId={assignmentIdToDelete || ''}
        isOpen={showDeleteAssignmentDialog}
        onClose={() => setShowDeleteAssignmentDialog(false)}
        onDeleted={handleDeleteAssignmentSuccess}
        itemName={printer.name}
      />

      {/* Assign Printer Modal */}
      <AssignPrinterModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        printerId={printer.id}
        printerName={[printer.manufacturer, printer.series, printer.model || printer.name].filter(Boolean).join(' ')}
        onAssignmentComplete={handleAssignmentComplete}
        assignmentId={assignmentId}
      />

      {/* Edit Assignment Modal */}
      <EditAssignmentModal
        isOpen={showEditAssignmentModal}
        onClose={() => setShowEditAssignmentModal(false)}
        printerId={printer.id}
        onAssignmentUpdated={() => {
          setShowEditAssignmentModal(false);
          if (onPrinterUpdated) onPrinterUpdated();
        }}
      />

      {/* Edit Assignment Serial Number Modal */}
      <EditAssignmentSerialModal
        assignmentId={assignmentId || ''}
        isOpen={showEditAssignmentSerialModal}
        onClose={() => setShowEditAssignmentSerialModal(false)}
        onSerialUpdated={handleSerialUpdated}
      />

      {/* Delete Record Dialog */}
      <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <DialogContent>
          <DialogTitle>Delete Record</DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete this record? This action cannot be undone.<br />
            <b>Assignment ID:</b> {selectedAssignmentToDelete?.id}
          </DialogDescription>
          <div className="flex gap-2 justify-end mt-4">
            <DialogClose asChild>
              <Button variant="outline" disabled={deleting}>Cancel</Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (selectedAssignmentToDelete?.id) {
                  console.log('Attempting to delete assignment with ID:', selectedAssignmentToDelete.id);
                  handleDeleteRecord();
                }
              }}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Record'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AvailablePrinterCard;
