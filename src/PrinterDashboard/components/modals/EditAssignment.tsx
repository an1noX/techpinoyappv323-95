
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit3, Loader2, User, Building2 } from 'lucide-react';
import { clientService } from '@/services/clientService';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import ClientDepartmentSelectionModal from './ClientDepartmentSelectionModal';

interface Assignment {
  id: string;
  client_id: string;
  client_name: string;
  department_location_id?: string;
  department_name: string;
  location_name?: string;
  serial_number: string;
  printer_id: string;
  is_client_owned?: boolean;
  status: string;
}

interface EditAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  printerId: string;
  onAssignmentUpdated: () => void;
  isLoading?: boolean;
}

const EditAssignmentModal: React.FC<EditAssignmentModalProps> = ({
  isOpen,
  onClose,
  printerId,
  onAssignmentUpdated,
  isLoading = false,
}) => {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const selectedAssignment = assignments.find(a => a.id === selectedAssignmentId);
  const [fetchingData, setFetchingData] = useState(false);
  const [printerName, setPrinterName] = useState<string>('');

  // Editable fields
  const [clientId, setClientId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [originalSerialNumber, setOriginalSerialNumber] = useState('');
  const [isSerialNumberEditable, setIsSerialNumberEditable] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Add state for client owned
  const [isClientOwned, setIsClientOwned] = useState(false);

  // Store original values for comparison
  const [originalClientId, setOriginalClientId] = useState('');
  const [originalDepartmentId, setOriginalDepartmentId] = useState('');

  // Add state for client/department selection modal
  const [showClientDeptModal, setShowClientDeptModal] = useState(false);

  // Add state for selected department name
  const [selectedDepartmentName, setSelectedDepartmentName] = useState<string>('');

  // Add state for printer details
  const [printerDetails, setPrinterDetails] = useState({ name: '', manufacturer: '', series: '', model: '' });

  // Fetch printer details when modal opens
  useEffect(() => {
    if (isOpen && printerId) {
      (async () => {
        const { data, error } = await supabase
          .from('printers')
          .select('name, manufacturer, series, model')
          .eq('id', printerId)
          .single();
        if (!error && data) setPrinterDetails(data);
      })();
    }
  }, [isOpen, printerId]);

  // Fetch latest assignment data when modal opens
  useEffect(() => {
    if (isOpen && printerId) {
      fetchLatestAssignmentData();
    }
  }, [isOpen, printerId]);

  // Fetch printer name when modal opens
  useEffect(() => {
    if (isOpen && printerId) {
      (async () => {
        const { data, error } = await supabase
          .from('printers')
          .select('name')
          .eq('id', printerId)
          .single();
        if (!error && data?.name) setPrinterName(data.name);
      })();
    }
  }, [isOpen, printerId]);

  const fetchLatestAssignmentData = async () => {
    setFetchingData(true);
    
    try {
      // Fetch assignments with related data
      const { data: assignmentData, error } = await supabase
        .from('printer_assignments')
        .select(`
          id,
          client_id,
          department_location_id,
          serial_number,
          printer_id,
          clients!inner(name),
          departments_location(
            name,
            departments(name)
          ),
          is_client_owned,
          status
        `)
        .eq('printer_id', printerId);

      if (error) {
        console.error('❌ Error fetching assignments:', error);
        throw error;
      }

      // Transform the data
      const transformedAssignments: Assignment[] = (assignmentData || []).map(assignment => {
        const departmentName = assignment.departments_location?.departments?.name || '';
        const locationName = assignment.departments_location?.name || '';
        
        return {
          id: assignment.id,
          client_id: assignment.client_id,
          client_name: assignment.clients?.name || '',
          department_location_id: assignment.department_location_id,
          department_name: departmentName,
          location_name: locationName,
          serial_number: assignment.serial_number || '',
          printer_id: assignment.printer_id,
          is_client_owned: assignment.is_client_owned,
          status: assignment.status || 'N/A',
        };
      });

      setAssignments(transformedAssignments);
      
      // Auto-select first assignment if available
      if (transformedAssignments.length > 0) {
        setSelectedAssignmentId(transformedAssignments[0].id);
      }
      // If only one assignment, skip step 1 and go directly to edit step
      if (transformedAssignments.length === 1) {
        setStep(2);
      } else {
        setStep(1);
      }
      
    } catch (error) {
      console.error('❌ Error fetching assignment data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assignment data',
        variant: 'destructive'
      });
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    clientService.getClients().then(clients => {
      setClients(clients.map(c => ({ id: c.id, name: c.name })));
    });
  }, []);

  useEffect(() => {
    if (clientId) {
      // Clear department selection when client changes
      setDepartmentId('');
      setDepartments([]);
      clientService.getDepartmentsByClient(clientId).then(depts => {
        let deptList = depts.map(d => ({ id: d.id, name: d.name }));
        // Ensure the current assignment's department/location is included
        if (
          selectedAssignment &&
          selectedAssignment.department_location_id &&
          !deptList.some(d => d.id === selectedAssignment.department_location_id)
        ) {
          deptList = [
            ...deptList,
            {
              id: selectedAssignment.department_location_id,
              name: [selectedAssignment.department_name, selectedAssignment.location_name].filter(Boolean).join(' - ') || 'Unknown Department/Location',
            },
          ];
        }
        setDepartments(deptList);
      });
    } else {
      setDepartments([]);
      setDepartmentId('');
    }
  }, [clientId, selectedAssignment]);

  useEffect(() => {
    if (selectedAssignment) {
      const newClientId = selectedAssignment.client_id;
      const newDepartmentId = selectedAssignment.department_location_id || '';
      const newSerialNumber = selectedAssignment.serial_number || '';
      setIsClientOwned(!!selectedAssignment.is_client_owned);
      
      // Set client first
      setClientId(newClientId);
      setSerialNumber(newSerialNumber);
      setOriginalSerialNumber(newSerialNumber);
      setOriginalClientId(newClientId);
      setOriginalDepartmentId(newDepartmentId);
      setIsSerialNumberEditable(false);
      
      // Set department after a short delay to ensure departments are loaded
      setTimeout(() => {
        setDepartmentId(newDepartmentId);
      }, 100);
    }
  }, [selectedAssignment]);

  const handleAssignmentSelect = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
    setStep(2);
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || '';
  };

  const getDepartmentName = (departmentId: string) => {
    const department = departments.find(d => d.id === departmentId);
    return department?.name || '';
  };

  const getCurrentDepartmentLocationDisplay = () => {
    if (selectedAssignment) {
      const parts = [selectedAssignment.department_name, selectedAssignment.location_name].filter(Boolean);
      const display = parts.join(' - ') || 'No Department/Location';
      return display;
    }
    return 'Select Department + Location';
  };

  const handleSave = async () => {

    try {
      setLoading(true);
      
      // Prepare update object - only include fields that have actual values and changed
      const updateData: any = {};
      
      if (clientId && clientId !== originalClientId) {
        updateData.client_id = clientId;
      }
      
      // Only include department_location_id if it has a valid value and changed
      if (departmentId && departmentId !== originalDepartmentId) {
        updateData.department_location_id = departmentId;
      }
      
      if (serialNumber !== originalSerialNumber) {
        updateData.serial_number = serialNumber;
      }

      // Add is_client_owned to updateData if it has changed
      if (isClientOwned !== selectedAssignment.is_client_owned) {
        updateData.is_client_owned = isClientOwned;
      }

      if ((clientId && clientId !== originalClientId) || (departmentId && departmentId !== originalDepartmentId)) {
        updateData.status = 'active';
      }

      if (Object.keys(updateData).length === 0) {
        toast({
          title: 'No Changes',
          description: 'No changes were made to save.',
        });
        return;
      }

      // Update assignment in Supabase
      const { error: updateError } = await supabase
        .from('printer_assignments')
        .update(updateData)
        .eq('id', selectedAssignmentId);

      if (updateError) {
        console.error('❌ Update error:', updateError);
        throw updateError;
      }

      // Trigger parent refresh
      await onAssignmentUpdated();
      
      // Trigger manual refresh for AssignedToSection
      window.dispatchEvent(new CustomEvent(`refresh-assignments-${printerId}`));

      // Show detailed success toast based on what changed
      const originalClientName = getClientName(originalClientId);
      const newClientName = getClientName(clientId);
      const originalDeptName = getDepartmentName(originalDepartmentId);
      const newDeptName = getDepartmentName(departmentId);
      
      if (serialNumber !== originalSerialNumber && (clientId !== originalClientId || departmentId !== originalDepartmentId)) {
        // Both serial number and assignment details changed
        toast({
          title: 'Assignment Updated Successfully',
          description: `Client: ${originalClientName} → ${newClientName}\nDepartment: ${originalDeptName} → ${newDeptName}\nSerial: "${originalSerialNumber}" → "${serialNumber}"`,
        });
      } else if (serialNumber !== originalSerialNumber) {
        // Only serial number changed
        toast({
          title: 'Serial Number Updated Successfully',
          description: `Serial number changed from "${originalSerialNumber}" to "${serialNumber}"`,
        });
      } else if (clientId !== originalClientId || departmentId !== originalDepartmentId) {
        // Only assignment details changed
        toast({
          title: 'Assignment Updated Successfully',
          description: `Old:\nClient: ${originalClientName}\nDepartment: ${originalDeptName}\n\nNew:\nClient: ${newClientName}\nDepartment: ${newDeptName}\n\nSuccessfully Updated`,
        });
      }
      
      onClose();
    } catch (error) {
      console.error('❌ Save operation failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to update assignment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = () => {
    const changes = clientId !== originalClientId ||
      departmentId !== originalDepartmentId ||
      serialNumber !== originalSerialNumber ||
      isClientOwned !== !!selectedAssignment?.is_client_owned;
    return changes;
  };

  // Add handler for saving client/department from modal
  const handleClientDeptSave = async (newClientId: string, newDepartmentId: string) => {
    setClientId(newClientId);
    setDepartmentId(newDepartmentId);
    setShowClientDeptModal(false);
    setLoading(true);
    try {
      let depts = await clientService.getDepartmentsByClient(newClientId);
      let deptName = '';
      const found = depts.find(d => d.id === newDepartmentId);
      if (found) {
        deptName = found.name;
      } else if (selectedAssignment) {
        deptName = [selectedAssignment.department_name, selectedAssignment.location_name].filter(Boolean).join(' - ') || 'Unknown Department/Location';
      }
      setSelectedDepartmentName(deptName);
      // Ensure the selected department/location is included
      if (
        newDepartmentId &&
        !depts.some(d => d.id === newDepartmentId)
      ) {
        depts = [
          ...depts,
          {
            id: newDepartmentId,
            name: deptName,
          },
        ];
      }
      setDepartments(depts.map(d => ({ id: d.id, name: d.name })));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (fetchingData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit3 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading latest assignment data...</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading latest assignment data...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit3 className="h-4 w-4 text-blue-600" />
            <span className="text-base font-semibold">Edit Assignment</span>
            {/* Service Unit / Client Owned Switch removed from header */}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {step === 1 && (
            <div>
              {/* Printer details header, matching TransferPrinterModal */}
              <p className="text-gray-700 mb-4">
                Select an assignment to edit for printer <b>{[
  printerDetails.manufacturer,
  printerDetails.series,
  printerDetails.model || printerDetails.name
].filter(Boolean).join(' ')}</b>:
              </p>
              {fetchingData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                  <span className="ml-2">Loading assignments...</span>
                </div>
              ) : assignments.length === 0 ? (
                <div className="text-gray-500 italic">No active assignments found.</div>
              ) : (
                <ul className="space-y-3 mb-4">
                  {assignments.map(a => (
                    <li
                      key={a.id}
                      className={`border rounded-lg p-3 flex flex-col cursor-pointer hover:bg-purple-50 transition ${selectedAssignmentId === a.id ? 'ring-2 ring-purple-400' : ''}`}
                      onClick={() => handleAssignmentSelect(a.id)}
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">{a.client_name || a.client_id}</span>
                        {a.serial_number && <span className="ml-2 text-xs text-gray-500">SN: {a.serial_number}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                        {a.department_name && (
                          <>
                            <Building2 className="h-3 w-3" />
                            {a.department_name}
                            {a.location_name && ` - ${a.location_name}`}
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {/* Removed Cancel and navigation buttons from step 1 */}
            </div>
          )}
          {step === 2 && selectedAssignment && (
            <>
              <div className="mb-4 p-3 rounded-md bg-gray-50 border flex flex-col gap-1 relative">
                {/* Service Unit / Client Owned Switch inside info box */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs">Service Unit</span>
                  <Switch
                    id="isClientOwned"
                    checked={isClientOwned}
                    onCheckedChange={setIsClientOwned}
                    disabled={loading}
                    className="h-5 w-9"
                  />
                  <span className="text-xs">Client Owned</span>
                </div>
                {/* Placeholder Change button, right side, vertically centered */}
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 text-xs rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                  style={{ minWidth: '60px' }}
                  onClick={() => setShowClientDeptModal(true)}
                >
                  Change
                </button>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-orange-500" />
                  {/* Show selected client name in real time */}
                  <span className="font-medium">{getClientName(clientId) || clientId}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>Department/Location:</span>
                  <span className="font-semibold">
                    {selectedDepartmentName || getDepartmentName(departmentId) || selectedAssignment.department_name || getCurrentDepartmentLocationDisplay()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>Printer:</span>
                  <span className="font-semibold">{printerName || printerId}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>Status:</span>
                  <span className="font-semibold">{selectedAssignment.status || 'N/A'}</span>
                </div>
              </div>
              <div className="mb-2 text-sm text-gray-700">Edit assignment details:</div>
              <div className="space-y-3">
                {/* Client and Department + Location fields have been completely removed */}
                {/* Serial Number (simple display with edit icon) */}
                <div>
                  <Label>Serial Number:</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {isSerialNumberEditable ? (
                      <Input
                        value={serialNumber}
                        onChange={e => setSerialNumber(e.target.value)}
                        disabled={loading}
                        className="flex-1"
                        placeholder="Enter serial number..."
                        autoFocus
                      />
                    ) : (
                      <span className="text-base text-gray-900 font-mono">{serialNumber || '—'}</span>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsSerialNumberEditable(!isSerialNumberEditable)}
                      disabled={loading}
                      title="Edit Serial Number"
                    >
                      <Edit3 className="h-4 w-4 text-blue-500" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading || !hasChanges()}
                  className="flex-1"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                  Save
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
      {/* Client/Department Selection Modal */}
      <ClientDepartmentSelectionModal
        isOpen={showClientDeptModal}
        onClose={() => setShowClientDeptModal(false)}
        currentClientId={clientId}
        currentDepartmentId={departmentId}
        onSave={handleClientDeptSave}
      />
    </Dialog>
  );
};

export default EditAssignmentModal;
