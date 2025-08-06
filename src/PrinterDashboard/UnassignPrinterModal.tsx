
import React, { useState, useEffect } from 'react';
import { Loader2, User, MapPin, Building2, AlertCircle, Unlink } from 'lucide-react';
import { printerService } from '@/services/printerService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getAssignmentLevel, getUnassignmentDescription, canUnassignAt, type AssignmentLevel } from '@/utils/assignmentLevelDetector';
import type { Printer } from '@/types/database';
import { CustomLoading } from "@/components/ui/CustomLoading";

interface PrinterAssignment {
  id: string;
  client_id: string;
  client?: {
    id: string;
    name: string;
  };
  departments_location?: {
    id: string;
    name: string;
    department?: {
      id: string;
      name: string;
    };
  };
  department?: string;
  location?: string;
  serial_number?: string;
  status: string;
  deployment_date?: string;
  condition?: string;
  department_location_id?: string;
}

interface UnassignPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  printerId: string;
  onUnassigned: () => void;
}

const UnassignPrinterModal: React.FC<UnassignPrinterModalProps> = ({
  isOpen,
  onClose,
  printerId,
  onUnassigned,
}) => {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedAssignment, setSelectedAssignment] = useState<PrinterAssignment | null>(null);
  const [selectedUnassignLevel, setSelectedUnassignLevel] = useState<AssignmentLevel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<PrinterAssignment[]>([]);
  const [fetchingAssignments, setFetchingAssignments] = useState(false);
  const [printer, setPrinter] = useState<Printer | null>(null);
  const [printerName, setPrinterName] = useState<string>('');
  // Add state for printer details
  const [printerDetails, setPrinterDetails] = useState({ name: '', manufacturer: '', series: '', model: '' });

  // Fetch fresh assignment data when modal opens
  useEffect(() => {
    if (isOpen && printerId) {
      fetchAssignments();
    }
  }, [isOpen, printerId]);

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

  const fetchAssignments = async () => {
    setFetchingAssignments(true);
    try {
      // Fetch printer details
      const { data: printerData, error: printerError } = await supabase
        .from('printers')
        .select('*')
        .eq('id', printerId)
        .single();

      if (printerError) throw printerError;
      setPrinter(printerData);

      // Fetch assignments with proper joins (no status filter, match EditAssignment)
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('printer_assignments')
        .select(`
          id,
          client_id,
          department_location_id,
          department,
          location,
          serial_number,
          printer_id,
          clients!inner(id, name),
          departments_location(
            id,
            name,
            departments(id, name)
          ),
          is_client_owned,
          status
        `)
        .eq('printer_id', printerId);

      if (assignmentError) throw assignmentError;
      // Transform the data to match EditAssignment
      const transformedData = (assignmentData || []).map(assignment => {
        return {
          id: assignment.id,
          client_id: assignment.client_id,
          client: { id: assignment.clients?.id || '', name: assignment.clients?.name || '' },
          departments_location: assignment.departments_location ? {
            id: assignment.departments_location.id || '',
            name: assignment.departments_location.name || '',
            department: assignment.departments_location.departments
              ? {
                  id: assignment.departments_location.departments.id || '',
                  name: assignment.departments_location.departments.name || ''
                }
              : undefined
          } : undefined,
          department: assignment.department || '',
          location: assignment.location || '',
          serial_number: assignment.serial_number || '',
          status: assignment.status || 'N/A',
          department_location_id: assignment.department_location_id,
        };
      });
      setAssignments(transformedData);
      // If only one assignment, skip step 1 and go directly to unassign step
      if (transformedData.length === 1) {
        setSelectedAssignment(transformedData[0]);
        setStep(2);
      } else {
        setStep(1);
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      setError('Failed to load assignment data');
    } finally {
      setFetchingAssignments(false);
    }
  };

  if (!isOpen) return null;

  const handleAssignmentSelect = (assignment: PrinterAssignment) => {
    setSelectedAssignment(assignment);
    setStep(2);
    setError(null);
  };

  const handleUnassignClick = (level: AssignmentLevel) => {
    setSelectedUnassignLevel(level);
    setStep(3);
  };

  const handleConfirmUnassign = async () => {
    if (!selectedAssignment || !selectedUnassignLevel) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let successMessage = '';
      
      switch (selectedUnassignLevel) {
        case 'location':
          await printerService.unassignFromLocation(selectedAssignment.id);
          successMessage = `Printer successfully unassigned from location`;
          break;
        case 'department':
          await printerService.unassignFromDepartment(selectedAssignment.id);
          successMessage = `Printer successfully unassigned from department`;
          break;
        case 'client':
          await printerService.unassignFromClient(selectedAssignment.id);
          successMessage = `Printer successfully unassigned from ${selectedAssignment.client?.name || 'client'}`;
          break;
        default:
          throw new Error('Invalid unassignment level');
      }
      
      toast({
        title: 'Success',
        description: successMessage,
      });
      
      // Trigger manual refresh for AssignedToSection
      window.dispatchEvent(new CustomEvent(`refresh-assignments-${printerId}`));
      
      onUnassigned();
      onClose();
    } catch (e: any) {
      console.error('Unassignment failed:', e);
      setError(e.message || 'Failed to unassign printer.');
      toast({
        title: 'Error',
        description: e.message || 'Failed to unassign printer.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(2);
      setSelectedUnassignLevel(null);
    } else {
      setStep(1);
      setSelectedAssignment(null);
    }
    setError(null);
  };

  const handleClose = () => {
    setStep(1);
    setSelectedAssignment(null);
    setSelectedUnassignLevel(null);
    setError(null);
    onClose();
  };

  const handleRetry = () => {
    setError(null);
    setLoading(false);
  };

  // Helper function to get readable location info
  const getLocationDisplay = (assignment: PrinterAssignment) => {
    if (assignment.departments_location) {
      const dept = assignment.departments_location.department?.name || 'Unknown Department';
      const loc = assignment.departments_location.name || 'Unknown Location';
      return `${dept} - ${loc}`;
    }
    
    if (assignment.department || assignment.location) {
      return [assignment.department, assignment.location].filter(Boolean).join(' - ');
    }
    
    return 'No specific location';
  };

  const getConfirmationMessage = () => {
    if (!selectedAssignment || !selectedUnassignLevel) return '';
    
    const clientName = selectedAssignment.client?.name || 'Unknown Client';
    const departmentName = selectedAssignment.department || 'Unknown Department';
    const locationName = selectedAssignment.departments_location?.name || selectedAssignment.location || 'Unknown Location';
    
    switch (selectedUnassignLevel) {
      case 'location':
        return `Unassign printer from location "${locationName}"? The printer will remain assigned to the ${departmentName} department.`;
      case 'department':
        return `Unassign printer from department "${departmentName}"? The printer will remain assigned to ${clientName} client only.`;
      case 'client':
        return `Unassign printer from client "${clientName}"? The printer will become available but retain reference to the last client for visibility.`;
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-lg w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 1 ? 'Unassign Printer' : step === 2 ? 'Select Assignment Level' : 'Confirm Unassignment'}
            </h2>
          </div>
        </div>
        
        <div className="p-6">
          {step === 1 && (
            <>
              <p className="text-gray-700 mb-4">
                Select an assignment to unassign for printer <b>{[
  printerDetails.manufacturer,
  printerDetails.series,
  printerDetails.model || printerDetails.name
].filter(Boolean).join(' ')}</b>:
              </p>
              {fetchingAssignments ? (
                <CustomLoading message="Loading assignments" />
              ) : assignments.length === 0 ? (
                <div className="text-gray-500 italic">No active assignments found.</div>
              ) : (
                <ul className="space-y-3 mb-4">
                  {assignments.map(assignment => (
                    <li 
                      key={assignment.id} 
                      className="border rounded-lg p-3 flex flex-col cursor-pointer hover:bg-blue-50 transition" 
                      onClick={() => handleAssignmentSelect(assignment)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{assignment.client?.name || 'Unknown Client'}</span>
                        {assignment.serial_number && (
                          <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            SN: {assignment.serial_number}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Building2 className="h-3 w-3" />
                        <span>{getLocationDisplay(assignment)}</span>
                      </div>
                      
                      {assignment.deployment_date && (
                        <div className="text-xs text-gray-500">
                          Deployed: {new Date(assignment.deployment_date).toLocaleDateString()}
                        </div>
                      )}
                      
                      {assignment.condition && (
                        <div className="text-xs text-gray-500">
                          Condition: <span className="capitalize">{assignment.condition}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {step === 2 && selectedAssignment && (
            <>
              <div className="mb-4 p-3 rounded-md bg-gray-50 border flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">{selectedAssignment.client?.name || selectedAssignment.client_id}</span>
                  {selectedAssignment.serial_number && (
                    <span className="ml-2 text-xs text-gray-500">SN: {selectedAssignment.serial_number}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>Printer:</span>
                  <span className="font-semibold">{[
  printerDetails.manufacturer,
  printerDetails.series,
  printerDetails.model || printerDetails.name
].filter(Boolean).join(' ')}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>Status:</span>
                  <span className="font-semibold">{selectedAssignment.status || 'N/A'}</span>
                </div>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">Current Assignment Hierarchy</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Click the unlink icon next to any level to unassign the printer from that level:
                </p>
                
                <div className="bg-gray-50 border rounded-lg p-4">
                  {/* Client Level */}
                  <div className="flex items-center justify-between p-3 border-b border-gray-200 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {selectedAssignment.client?.name || 'Unknown Client'}
                        </div>
                        <div className="text-xs text-gray-500">Client</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnassignClick('client')}
                      disabled={loading}
                      className="flex items-center gap-2 px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Unassign from client (printer becomes available)"
                    >
                      <Unlink className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Department Level */}
                  {selectedAssignment.client?.name && selectedAssignment.department && selectedAssignment.department.trim() !== '' && (
                    <div className="flex items-center justify-between p-3 border-b border-gray-200 last:border-b-0">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {selectedAssignment.department}
                          </div>
                          <div className="text-xs text-gray-500">Department</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnassignClick('department')}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Unassign from department (remains with client)"
                      >
                        <Unlink className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Location Level */}
                  {(selectedAssignment.department_location_id || selectedAssignment.departments_location) && (
                    <div className="flex items-center justify-between p-3 border-b border-gray-200 last:border-b-0">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-purple-500" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {selectedAssignment.departments_location?.name || selectedAssignment.location || 'Unknown Location'}
                          </div>
                          <div className="text-xs text-gray-500">Location</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnassignClick('location')}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Unassign from location (remains with department)"
                      >
                        <Unlink className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {selectedAssignment.serial_number && (
                  <div className="mt-3 text-sm text-gray-600">
                    Serial Number: <span className="font-mono">{selectedAssignment.serial_number}</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Error</span>
                  </div>
                  <div className="text-sm text-red-700 mb-2">{error}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRetry}
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={handleBack}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleBack}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {step === 3 && selectedAssignment && selectedUnassignLevel && (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-yellow-100 p-2 rounded-full">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Confirm Unassignment</h3>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-gray-700">
                    {getConfirmationMessage()}
                  </p>
                </div>

                {selectedAssignment.serial_number && (
                  <div className="text-sm text-gray-600 mb-4">
                    Serial Number: <span className="font-mono">{selectedAssignment.serial_number}</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Error</span>
                  </div>
                  <div className="text-sm text-red-700 mb-2">{error}</div>
                  <button
                    onClick={handleRetry}
                    className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleBack}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmUnassign}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Proceed'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnassignPrinterModal;
