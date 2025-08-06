
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { clientService } from '@/services/clientService';
import { useDepartments } from '../hooks/useDepartments';
import { Move, ArrowRight } from 'lucide-react';

interface PrinterAssignment {
  id: string;
  printer_id: string;
  department: string;
  serial_number: string;
  status: 'active' | 'inactive' | 'returned';
  printer: {
    name: string;
    model?: string;
    manufacturer?: string;
  };
}

interface TransferPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: PrinterAssignment | null;
  currentClientId: string;
  onTransferCompleted: () => void;
  assignments?: PrinterAssignment[];
  onSelectAssignment?: (assignment: PrinterAssignment) => void;
}

const TransferPrinterModal: React.FC<TransferPrinterModalProps> = ({
  isOpen,
  onClose,
  assignment,
  currentClientId,
  onTransferCompleted,
  assignments = [],
  onSelectAssignment
}) => {
  // If assignments are provided, use selected assignment from prop, else use assignment
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const selectedAssignment = assignments.length > 0
    ? assignments.find(a => a.id === selectedAssignmentId) || assignments[0]
    : assignment;

  const [transferData, setTransferData] = useState({
    newDepartment: '',
    newLocation: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Get departments for the current client only
  const { data: departments = [] } = useDepartments(currentClientId);

  // Preselect current department/location on open or assignment change
  useEffect(() => {
    if (isOpen && departments.length > 0 && selectedAssignment) {
      let foundDept = null;
      let foundLoc = null;
      for (const dept of departments) {
        for (const loc of dept.locations) {
          if (`${dept.name} ${loc.name}` === selectedAssignment.department) {
            foundDept = dept.name;
            foundLoc = loc.name;
            break;
          }
        }
        if (foundDept) break;
      }
      setTransferData({
        newDepartment: foundDept || '',
        newLocation: foundLoc || '',
        notes: ''
      });
      if (assignments.length > 0 && !selectedAssignmentId) {
        setSelectedAssignmentId(assignments[0].id);
      }
    }
  }, [isOpen, departments, selectedAssignment, assignments, selectedAssignmentId]);

  const handleTransfer = async () => {
    if (!selectedAssignment || !transferData.newDepartment || !transferData.newLocation) {
      toast({
        title: "Error",
        description: "Please select a printer, department and location for transfer.",
        variant: "destructive",
      });
      return;
    }
    // Find the target department/location id
    const targetDept = departments.find(d => d.name === transferData.newDepartment);
    const targetLoc = targetDept?.locations.find(l => l.name === transferData.newLocation);
    if (!targetLoc) {
      toast({
        title: "Error",
        description: "Could not find the selected location.",
        variant: "destructive",
      });
      return;
    }
    if (`${transferData.newDepartment} ${transferData.newLocation}` === selectedAssignment.department) {
      toast({
        title: "Error",
        description: "Cannot transfer to the same department/location. Use edit to change details.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      // Update the printer assignment
      const { error: updateError } = await supabase
        .from('printer_assignments')
        .update({
          department_location_id: targetLoc.id,
          status: 'active'
        })
        .eq('id', selectedAssignment.id);
      if (updateError) throw updateError;
      // Add history entry for the transfer
      const { error: historyError } = await supabase
        .from('printer_history')
        .insert({
          printer_id: selectedAssignment.printer_id,
          action_type: 'transferred',
          description: `Transferred to department: ${transferData.newDepartment} ${transferData.newLocation}${transferData.notes ? `. Notes: ${transferData.notes}` : ''}`,
          performed_by: 'System User',
          related_assignment_id: selectedAssignment.id
        });
      if (historyError) {
        // Handle history error silently
      }
      toast({
        title: "Success",
        description: "Printer transferred successfully.",
      });
      onTransferCompleted();
      handleClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to transfer printer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTransferData({
      newDepartment: '',
      newLocation: '',
      notes: ''
    });
    setSelectedAssignmentId('');
    onClose();
  };

  // Department options for the current client
  const departmentOptions = departments.map(dept => ({
    value: dept.name,
    label: dept.name
  }));
  // Location options for the selected department
  const selectedDepartment = departments.find(dept => dept.name === transferData.newDepartment);
  const locationOptions = selectedDepartment ? selectedDepartment.locations.map(loc => ({
    value: loc.name,
    label: loc.name,
    abbreviation: loc.abbreviation,
    floor: loc.floor
  })) : [];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Move className="h-5 w-5 text-orange-600" />
            <span>Transfer Printer</span>
          </DialogTitle>
          {assignments.length > 0 && (
            <div className="mt-2">
              <Label>Select Printer *</Label>
              <Select
                value={selectedAssignmentId}
                onValueChange={val => {
                  setSelectedAssignmentId(val);
                  const found = assignments.find(a => a.id === val);
                  if (found && onSelectAssignment) onSelectAssignment(found);
                }}
                disabled={loading}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select a printer to transfer" />
                </SelectTrigger>
                <SelectContent>
                  {assignments.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.printer.name} {a.printer.model && `(${a.printer.model})`} - SN: {a.serial_number || 'N/A'} | {a.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <p className="text-sm text-gray-600 mt-1">
            Transfer {selectedAssignment?.printer.name} to another department or location
          </p>
        </DialogHeader>
        <div className="space-y-4">
          {/* Current Assignment Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-700">Current Assignment</p>
            <p className="text-sm text-gray-600">Department: {selectedAssignment?.department}</p>
            <p className="text-sm text-gray-600">Serial: {selectedAssignment?.serial_number || 'Not provided'}</p>
          </div>
          {/* Transfer To Department */}
          <div>
            <Label>Transfer to Department *</Label>
            <Select
              value={transferData.newDepartment}
              onValueChange={(value) => setTransferData(prev => ({ ...prev, newDepartment: value, newLocation: '' }))}
              disabled={loading}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select target department" />
              </SelectTrigger>
              <SelectContent>
                {departmentOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {departmentOptions.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                No departments found for this client
              </p>
            )}
          </div>
          {/* Transfer To Location (if multiple) */}
          {transferData.newDepartment && locationOptions.length > 0 && (
            <div>
              <Label>Transfer to Location *</Label>
              <Select
                value={transferData.newLocation}
                onValueChange={(value) => setTransferData(prev => ({ ...prev, newLocation: value }))}
                disabled={loading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select target location" />
                </SelectTrigger>
                <SelectContent>
                  {locationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                      {option.abbreviation && ` (${option.abbreviation})`}
                      {option.floor && ` - ${option.floor}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Transfer Notes */}
          <div>
            <Label htmlFor="transfer_notes">Transfer Notes</Label>
            <Textarea
              id="transfer_notes"
              value={transferData.notes}
              onChange={(e) => setTransferData(prev => ({ ...prev, notes: e.target.value }))}
              disabled={loading}
              placeholder="Reason for transfer or additional notes..."
              className="mt-1"
              rows={3}
            />
          </div>
          {/* Transfer Preview */}
          {transferData.newDepartment && transferData.newLocation && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-600">Current: {selectedAssignment?.department}</span>
                <ArrowRight className="h-4 w-4 text-blue-600" />
                <span className="text-blue-700 font-medium">
                  {transferData.newDepartment} {transferData.newLocation}
                </span>
              </div>
            </div>
          )}
          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleTransfer}
              disabled={loading || !selectedAssignment || !transferData.newDepartment || !transferData.newLocation}
              className="flex-1 bg-orange-600 text-white hover:bg-orange-700"
            >
              Transfer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransferPrinterModal;
