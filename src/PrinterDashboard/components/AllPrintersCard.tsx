import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MaintenanceStatusDisplay from './MaintenanceStatusDisplay';
import { useToast } from '@/hooks/use-toast';
import { History, Edit, Trash2, CheckCircle, UserPlus } from 'lucide-react';
import PrinterHistoryModal from './PrinterHistoryModal';
import PrinterDetailsModal from '@/components/PrinterDetailsModal';
import { assetService } from '@/services/assetService';
import { CompatibleProducts } from './CompatibleProducts';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import AssignmentSelectionModal from './modals/AssignmentSelectionModal';
import EditPrinterFormModal from '@/components/EditPrinterFormModal';
import DeleteAssignmentConfirmDialog from './modals/DeleteAssignmentConfirmDialog';
import { supabase } from '@/integrations/supabase/client';

function getStatusLabel(status: string) {
  switch (status) {
    case 'active':
      return 'Assigned to Client';
    case 'inactive':
      return 'Assigned to Client (not in use)';
    case 'decommissioned':
      return 'Decommissioned';
    case 'available':
      return 'Not Assigned (available)';
    default:
      return status;
  }
}

const AllPrintersCard = ({ assignment, onEdit, onDelete, onDataRefresh, debug = false }) => {
  const { printer } = assignment;
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPrinterDetails, setShowPrinterDetails] = useState(false);
  const [showDeleteRecordDialog, setShowDeleteRecordDialog] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showAssignmentSelectionModal, setShowAssignmentSelectionModal] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'assign' | 'decommission' | 'edit_serial'>('assign');
  const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false);
  const [showDeleteAssignmentDialog, setShowDeleteAssignmentDialog] = useState(false);
  const [enrichedPrinter, setEnrichedPrinter] = useState(printer);

  useEffect(() => {
    let isMounted = true;
    const fetchAssignments = async () => {
      if (!printer?.printer_assignments) {
        const { data, error } = await supabase
          .from('printers')
          .select('*, printer_assignments(*)')
          .eq('id', printer.id)
          .single();
        if (data && isMounted) {
          setEnrichedPrinter(data);
        }
      } else {
        setEnrichedPrinter(printer);
      }
    };
    fetchAssignments();
    return () => { isMounted = false; };
  }, [printer]);

  const handleDeleteRecord = async () => {
    setDeleting(true);
    try {
      await assetService.deleteAssignment(assignment.id);
      toast({
        title: 'Success',
        description: 'Assignment permanently deleted.',
      });
      setShowDeleteRecordDialog(false);
      // Trigger data refresh to update the UI
      if (onDataRefresh) {
        onDataRefresh();
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: `Failed to delete assignment ${assignment.id}: ${err?.message || JSON.stringify(err)}`,
        variant: 'destructive',
      });
      console.error('Delete error details:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleMakeAvailable = async () => {
    setUpdatingStatus(true);
    try {
      await assetService.makePrinterAvailable(assignment.id);
      toast({
        title: 'Success',
        description: 'Printer is now available for assignment.',
      });
      // Trigger data refresh to update the UI
      if (onDataRefresh) {
        onDataRefresh();
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: `Failed to make printer available: ${err?.message || JSON.stringify(err)}`,
        variant: 'destructive',
      });
      console.error('Make available error details:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignPrinter = () => {
    setSelectionMode('assign');
    setShowAssignmentSelectionModal(true);
  };
  const handleEditAssignment = () => {
    setSelectionMode('edit_serial');
    setShowAssignmentSelectionModal(true);
  };
  const handleDeleteAssignment = () => {
    setSelectionMode('decommission');
    setShowAssignmentSelectionModal(true);
  };

  return (
    <div className="bg-orange-50/80 border border-orange-200/80 rounded-lg shadow-sm w-full hover:shadow-md transition-shadow touch-manipulation">
      {/* Mobile Debug Info - Collapsible */}
      {debug && (
        <details className="m-2">
          <summary className="text-xs font-medium text-yellow-800 cursor-pointer p-2 bg-yellow-100 rounded">
            Debug Info (tap to expand)
          </summary>
          <pre className="mt-1 text-xs text-yellow-900 bg-yellow-50 border border-yellow-200 rounded p-2 max-h-32 overflow-y-auto">
            {JSON.stringify(assignment, null, 2)}
          </pre>
        </details>
      )}

      {/* Modern Card Layout */}
      <div className="p-3 w-full max-w-full flex flex-col">
        {/* Printer name (top row) */}
        <div className="mb-1">
          <span className="font-bold text-base text-gray-900 truncate">
            {[printer?.manufacturer, printer?.series, printer?.model || printer?.name].filter(Boolean).join(' ')}
          </span>
        </div>
        {/* Second row: image (left), right: all info/details stacked */}
        <div className="flex items-start gap-3 mb-1">
          {/* Printer image */}
          <div className="relative flex-shrink-0">
            <img
              src={printer?.image_url || '/placeholder.svg'}
              alt={printer?.name || 'Printer'}
              className="w-24 h-24 object-cover rounded-md"
              onError={e => { e.currentTarget.src = '/placeholder.svg'; }}
            />
          </div>
          {/* Right side: all info/details stacked, fully contained */}
          <div className="flex-1 min-w-0 flex flex-col justify-start h-auto space-y-1">
            {/* Action buttons row */}
            <div className="flex gap-2 mb-1 justify-start">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title="Assign"
                onClick={handleAssignPrinter}
              >
                <UserPlus className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title="Edit Assignment"
                onClick={handleEditAssignment}
              >
                <Edit className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title="Delete Assignment"
                onClick={handleDeleteAssignment}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
              {/* Existing buttons: Edit, History, Make Available, Delete Record */}
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8" 
                title="Edit" 
                onClick={() => setShowPrinterDetails(true)}
              >
                <Edit className="h-4 w-4 text-green-600" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8" 
                title="History" 
                onClick={() => setShowHistoryModal(true)}
              >
                <History className="h-4 w-4 text-blue-500" />
              </Button>
              {assignment.status !== 'available' && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8" 
                  title="Make Available" 
                  onClick={handleMakeAvailable}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  ) : (
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  )}
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title="Delete Record"
                onClick={() => setShowDeleteRecordDialog(true)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
            {/* All info/details stacked, fully contained */}
            <div className="text-xs text-gray-600">
              <div><span className="font-medium">Serial:</span> {assignment.serial_number || 'N/A'}</div>
              <div><span className="font-medium">Client:</span> {assignment.clients?.name || 'N/A'}</div>
              <div><span className="font-medium">Location:</span> {assignment.departments_location?.name || 'N/A'}</div>
              <div><span className="font-medium">Created:</span> {assignment.created_at ? new Date(assignment.created_at).toLocaleDateString() : 'N/A'}</div>
            </div>
            {/* Status Badge and badges row */}
            <div className="flex flex-wrap gap-2 mb-1">
              <Badge
                variant="secondary"
                className={`text-xs ${
                  assignment.status === 'active'
                    ? 'bg-orange-100 text-orange-700'
                    : assignment.status === 'available'
                    ? 'bg-green-100 text-green-700'
                    : assignment.status === 'decommissioned'
                    ? 'bg-gray-200 text-gray-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {getStatusLabel(assignment.status)}
              </Badge>
              {assignment.usage_type && (
                <Badge variant="outline" className="text-xs">
                  {assignment.usage_type}
                </Badge>
              )}
              {printer?.color && (
                <Badge variant="outline" className="text-xs">
                  {printer.color}
                </Badge>
              )}
            </div>
          </div>
        </div>
        {/* Section Divider */}
        <hr className="my-2 border-t border-orange-200/50" />
        {/* Move Compatible Products here, remove Maintenance Status label */}
        <CompatibleProducts 
          printerId={printer?.id} 
          className="text-xs flex flex-row flex-wrap gap-2 mt-1" 
        />
        {/* Assignment Details - Compact */}
        {/* (already included above) */}
        {/* Action Buttons (unchanged) */}
        {/* The full-width Make Available and Delete Record buttons are removed from here */}
      </div>

      {/* Delete Record Modal */}
      <Dialog open={showDeleteRecordDialog} onOpenChange={setShowDeleteRecordDialog}>
        <DialogContent>
          <DialogTitle>Delete Record</DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete this record? This action cannot be undone.<br />
            <b>Assignment ID:</b> {assignment.id}
          </DialogDescription>
          <div className="flex gap-2 justify-end mt-4">
            <DialogClose asChild>
              <Button variant="outline" disabled={deleting}>Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={() => { console.log('Attempting to delete assignment with ID:', assignment.id); handleDeleteRecord(); }} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete Record'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PrinterHistoryModal 
        open={showHistoryModal} 
        onClose={() => setShowHistoryModal(false)} 
        printerId={printer?.id} 
      />
      <PrinterDetailsModal
        isOpen={showPrinterDetails}
        onClose={() => setShowPrinterDetails(false)}
        printer={printer}
        assignment={assignment}
      />
      <AssignmentSelectionModal
        isOpen={showAssignmentSelectionModal}
        onClose={() => setShowAssignmentSelectionModal(false)}
        printer={enrichedPrinter}
        onAssignmentSelected={() => setShowAssignmentSelectionModal(false)}
        title={selectionMode === 'assign' ? 'Assign Printer' : selectionMode === 'edit_serial' ? 'Edit Assignment Serial' : 'Decommission Assignment'}
        description={selectionMode === 'assign' ? 'Select an assignment to assign this printer.' : selectionMode === 'edit_serial' ? 'Select an assignment to edit its serial number.' : 'Select an assignment to decommission.'}
      />
      <EditPrinterFormModal
        isOpen={showEditAssignmentModal}
        onClose={() => setShowEditAssignmentModal(false)}
        printer={printer}
        onPrinterUpdated={() => setShowEditAssignmentModal(false)}
      />
      <DeleteAssignmentConfirmDialog
        isOpen={showDeleteAssignmentDialog}
        onClose={() => setShowDeleteAssignmentDialog(false)}
        assignmentId={assignment.id}
        itemName={printer?.name || 'Printer'}
        onDeleted={() => setShowDeleteAssignmentDialog(false)}
      />
    </div>
  );
};

export default AllPrintersCard;
