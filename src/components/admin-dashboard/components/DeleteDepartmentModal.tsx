import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: any | null; // Changed from Department to any as Department type is removed
  onDepartmentDeleted: () => void;
}

interface PrinterAssignmentRow {
  id: string;
  printer_id: string;
  client_id: string;
  department_location_id: string | null;
  serial_number: string | null;
  deployment_date: string | null;
  usage_type: 'rental' | 'service_unit' | 'client_owned';
  monthly_price: number | null;
  has_security_deposit: boolean;
  security_deposit_amount: number | null;
  notes: string | null;
  status: string;
  is_unassigned: boolean;
  created_at: string;
  updated_at: string;
  maintenance_notes: string | null;
  location: string | null;
  maintenance_issue_reported_date: string | null;
  department?: string; // This might be a computed field from joins
}

const DeleteDepartmentModal: React.FC<DeleteDepartmentModalProps> = ({
  isOpen,
  onClose,
  department,
  onDepartmentDeleted
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Utility to check if a string is a valid UUID
  const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

  const handleDelete = async () => {
    if (!department) {
      toast({
        title: "Error",
        description: "No department selected for deletion.",
        variant: "destructive",
      });
      return;
    }
    if (!department.client_id) {
      toast({
        title: "Error",
        description: "Department data is incomplete. Cannot proceed with deletion.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Deleting department:', department);
      let assignmentNames: string[] = [];
      let realDepartmentIds: string[] = [];
      if (department.locations && department.locations.length === 1 && department.locations[0].name === 'Main') {
        // Legacy department
        assignmentNames = [department.name];
        if (isUUID(department.id)) {
          realDepartmentIds = [department.id];
        }
      } else if (department.locations && department.locations.length > 0) {
        assignmentNames = department.locations.map(loc => `${department.name} ${loc.name}`);
        // Find all real department rows for these names
        // Fetch from DB to get their real UUIDs
        const { data: realDepts, error: fetchDeptsError } = await supabase
          .from('departments')
          .select('id, name')
          .eq('client_id', department.client_id)
          .in('name', assignmentNames);
        if (fetchDeptsError) {
          console.error('Failed to fetch real department rows:', fetchDeptsError);
          toast({
            title: "Error",
            description: `Failed to fetch real department rows: ${fetchDeptsError.message}`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        realDepartmentIds = (realDepts || []).map(d => d.id);
      } else {
        assignmentNames = [department.name];
        if (isUUID(department.id)) {
          realDepartmentIds = [department.id];
        }
      }
      console.log('Assignment names to unassign:', assignmentNames);
      console.log('Real department IDs to delete:', realDepartmentIds);

      // 1. Find all printers assigned to these departments
      const { data: assignments, error: fetchError } = await supabase
        .from('printer_assignments')
        .select('*')
        .eq('client_id', department.client_id);

      if (fetchError) {
        console.error('Failed to fetch printer assignments:', fetchError);
        toast({
          title: "Error",
          description: `Failed to fetch printer assignments: ${fetchError.message}`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      console.log('Assignments found:', assignments);

      // 2. For each printer, set department to 'Unassigned' and add history
      if (assignments && assignments.length > 0) {
        for (const assignment of assignments as PrinterAssignmentRow[]) {
          // Check if this assignment matches any of our department names
          const assignmentDepartment = assignment.department || 'Unassigned';
          const shouldUnassign = assignmentNames.some(name => 
            assignmentDepartment === name || 
            assignmentDepartment?.startsWith(name + ' ')
          );

          if (shouldUnassign) {
            // Update assignment to mark as unassigned
            const { error: updateError } = await supabase
              .from('printer_assignments')
              .update({ 
                is_unassigned: true,
                department_location_id: null
              })
              .eq('id', assignment.id);
            if (updateError) {
              console.error('Failed to unassign printer:', updateError, assignment);
              toast({
                title: "Error",
                description: `Failed to unassign printer ${assignment.printer_id}: ${updateError.message}`,
                variant: "destructive",
              });
              setIsLoading(false);
              return;
            }

            // Add history record
            const { error: historyError } = await supabase
              .from('printer_history')
              .insert({
                printer_id: assignment.printer_id,
                action_type: 'transferred',
                description: `Printer unassigned due to department deletion (${department.name}).`,
                performed_by: 'System User',
                related_assignment_id: assignment.id
              });
            if (historyError) {
              console.error('Failed to add printer history:', historyError, assignment);
              toast({
                title: "Error",
                description: `Failed to save history for printer ${assignment.printer_id}: ${historyError.message}`,
                variant: "destructive",
              });
              setIsLoading(false);
              return;
            }
          }
        }
      }

      // 3. Delete the real department row(s)
      if (realDepartmentIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('departments')
          .delete()
          .in('id', realDepartmentIds);
        if (deleteError) {
          console.error('Failed to delete department(s):', deleteError);
          toast({
            title: "Error",
            description: `Failed to delete department(s): ${deleteError.message}`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      } else {
        toast({
          title: "Error",
          description: "No real department rows found to delete.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: "Success",
        description: "Department has been deleted. All printers have been unassigned and history saved.",
      });
      onDepartmentDeleted();
      onClose();
    } catch (error: any) {
      console.error('Unexpected error during department deletion:', error);
      toast({
        title: "Error",
        description: error.message || "Unexpected error during department deletion.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get locations safely
  const getLocations = () => {
    if (!department) return [];
    
    // If department has the new locations array structure
    if (department.locations && Array.isArray(department.locations)) {
      return department.locations;
    }
    
    // Return empty array for legacy departments or when locations is undefined
    return [];
  };

  // Helper function to get printer count safely
  const getPrinterCount = () => {
    if (!department) return 0;
    return department.total_printer_count || 0;
  };

  const locations = getLocations();
  const printerCount = getPrinterCount();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="bg-red-600 p-2 rounded-lg">
              <Trash2 className="h-5 w-5 text-white" />
            </div>
            <span>Delete Department</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">
                This action cannot be undone
              </p>
              <p className="text-sm text-red-600">
                All printers assigned to this department will need to be reassigned.
              </p>
            </div>
          </div>

          {department && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                You are about to delete:
              </p>
              <p className="font-medium text-gray-900 mt-1">
                {department.name}
              </p>
              {locations.length > 0 && (
                <div className="text-sm text-gray-600 mt-1">
                  <p>Locations: {locations.map(loc => loc.name).join(', ')}</p>
                </div>
              )}
              <p className="text-sm text-gray-600 mt-2">
                {printerCount} printer{printerCount !== 1 ? 's' : ''} currently assigned
              </p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              variant="destructive"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete Department'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteDepartmentModal;
