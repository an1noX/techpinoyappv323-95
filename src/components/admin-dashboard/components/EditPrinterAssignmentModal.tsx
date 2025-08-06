import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { assetService } from '@/services/assetService';

interface PrinterAssignment {
  id: string;
  printer_id: string;
  department_location_id: string | null; // use exactly as in your schema
  serial_number: string | null;
  status: 'active' | 'inactive' | 'returned' | 'undeployed';
  usage_type: 'rental' | 'service_unit' | 'client_owned';
  printer: {
    name: string;
  };
}

interface Department {
  id: string;
  name: string;
  locations: Array<{
    id: string;
    name: string;
    departments_id: string; // use exactly as in your schema
  }>;
}

interface EditPrinterAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: PrinterAssignment | null;
  departments: Department[];
  currentDepartmentName?: string;
  currentLocationName?: string;
  onAssignmentUpdated?: () => void;
}

const EditPrinterAssignmentModal: React.FC<EditPrinterAssignmentModalProps> = ({
  isOpen,
  onClose,
  assignment,
  departments,
  currentDepartmentName = '',
  currentLocationName = '',
  onAssignmentUpdated,
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState(assignment?.department_location_id || '');
  const [status, setStatus] = useState<'active' | 'inactive' | 'returned' | 'undeployed'>(assignment?.status || 'active');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();

  const locationOptions = departments.flatMap(dept =>
    dept.locations.map(location => ({
      id: location.id,
      label: `${dept.name} - ${location.name}`,
      departmentName: dept.name,
      locationName: location.name,
    }))
  );

  const targetLocationObj = departments
    .flatMap(dept => dept.locations)
    .find(loc => loc.id === selectedLocationId);
  const targetDeptName = departments.find(dept =>
    dept.locations.some(loc => loc.id === selectedLocationId)
  )?.name || '';
  const targetLocationName = targetLocationObj?.name || '';

  React.useEffect(() => {
    if (assignment) {
      setSelectedLocationId(assignment.department_location_id || '');
      setStatus(assignment.status || 'active');
    }
  }, [assignment]);

  const handleTransferClick = () => {
    setShowConfirmDialog(true);
  };

  // Add transfer logic
  const handleConfirmTransfer = async () => {
    try {
      // Debug: log values before API call
      console.log('Transfer assignmentId:', assignment?.id);
      console.log('Transfer newDepartmentLocationId:', selectedLocationId);
      // Actual update logic (make sure this method exists and works)
      await assetService.updateAssignment(
        assignment?.id!,
        { department_location_id: selectedLocationId }
      );
      setShowConfirmDialog(false);
      onClose();
      toast({
        title: 'Printer Transferred',
        description: 'The printer assignment has been successfully transferred.',
        variant: 'default',
      });
    } catch (error: any) {
      setShowConfirmDialog(false);
      toast({
        title: 'Transfer Failed',
        description: `Error: ${error?.message || error?.toString()}`,
        variant: 'destructive',
      });
      // Debug: log error
      console.error('Transfer error:', error);
    }
  };

  if (!assignment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {assignment?.printer?.name || 'Product'}
            {assignment.serial_number && (
              <span className="text-xs text-gray-500 font-normal ml-2 align-middle">- {assignment.serial_number}</span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {status !== 'undeployed' && (
            <div className="space-y-2">
              <div className="text-sm font-medium mb-1">
                Transfer to {status === 'active' && <span className="text-red-500">*</span>}
              </div>
              <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department location" />
                </SelectTrigger>
                <SelectContent>
                  {locationOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransferClick}
              className="flex-1 sm:flex-none"
            >
              Transfer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg font-semibold mb-2">
              Confirm Printer Transfer
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="text-sm mb-4">
            <div className="mb-3">
              <span className="block mb-1 font-medium">You're about to transfer printer assignment:</span>
              <div className="rounded-lg bg-gray-50 p-3 flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="font-semibold text-gray-700">Printer:</span>
                  <span className="text-gray-900">{assignment?.printer?.name || ''}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="font-semibold text-gray-700">From:</span>
                  <span className="text-gray-900">
                    {currentDepartmentName && currentLocationName
                      ? `${currentDepartmentName} - ${currentLocationName}`
                      : currentDepartmentName
                        ? currentDepartmentName
                        : currentLocationName
                          ? currentLocationName
                          : <span className="italic text-gray-400">Unassigned</span>}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="font-semibold text-gray-700">To:</span>
                  <span className="text-gray-900">
                    {targetDeptName && targetLocationName
                      ? `${targetDeptName} - ${targetLocationName}`
                      : <span className="italic text-gray-400">Select a location</span>}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-2 mb-1 text-gray-700">
              Are you sure you want to continue?
            </div>
            <div className="text-xs text-gray-500">
              Click <span className="font-semibold text-blue-600">Continue</span> to confirm the transfer or <span className="font-semibold">Cancel</span> to go back.
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="w-full sm:w-auto" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white" onClick={handleConfirmTransfer}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default EditPrinterAssignmentModal;
