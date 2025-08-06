
import React, { useState, useEffect } from 'react';
import { Loader2, User, MapPin, Building2, ArrowRightLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Printer, Client } from '@/types/database';

interface PrinterAssignment {
  id: string;
  client_id: string;
  department_location_id?: string;
  client?: {
    name: string;
  };
  departments_location?: {
    name: string;
    department?: {
      name: string;
    };
  };
  department?: string;
  location?: string;
  serial_number?: string;
  status: string;
}

interface TransferPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  printerId: string;
  clients: Client[];
  getDepartmentsByClient: (clientId: string) => Promise<{ id: string; name: string; location?: string }[]>;
  onTransfer: (assignment: PrinterAssignment, toClientId: string, toDepartmentId: string) => Promise<void>;
}

const TransferPrinterModal: React.FC<TransferPrinterModalProps> = ({
  isOpen,
  onClose,
  printerId,
  clients,
  getDepartmentsByClient,
  onTransfer,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedAssignment, setSelectedAssignment] = useState<PrinterAssignment | null>(null);
  const [toClientId, setToClientId] = useState<string>('');
  const [departments, setDepartments] = useState<{ id: string; name: string; location?: string }[]>([]);
  const [toDepartmentId, setToDepartmentId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<PrinterAssignment[]>([]);
  const [fetchingAssignments, setFetchingAssignments] = useState(false);
  const [printer, setPrinter] = useState<Printer | null>(null);
  // Add state for printer details
  const [printerDetails, setPrinterDetails] = useState({ name: '', manufacturer: '', series: '', model: '' });

  // Fetch fresh assignment data when modal opens
  useEffect(() => {
    if (isOpen && printerId) {
      fetchAssignments();
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

  useEffect(() => {
    if (step === 2 && toClientId) {
      // Clear department selection when client changes
      setDepartments([]);
      const preservedDepartmentId = toDepartmentId; // Preserve current selection
      
      getDepartmentsByClient(toClientId).then(depts => {
        setDepartments(depts);
        // If we have a preserved department ID and it exists in the new departments, keep it
        if (preservedDepartmentId && depts.some(d => d.id === preservedDepartmentId)) {
          setToDepartmentId(preservedDepartmentId);
        } else {
          // Otherwise, clear department selection
          setToDepartmentId('');
        }
      });
    }
  }, [step, toClientId, getDepartmentsByClient]);

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
        const departmentName = assignment.departments_location?.departments?.name || '';
        const locationName = assignment.departments_location?.name || '';
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
          department: departmentName,
          location: locationName,
          serial_number: assignment.serial_number || '',
          status: assignment.status || 'N/A',
          department_location_id: assignment.department_location_id,
        };
      });
      setAssignments(transformedData);
      // If only one assignment, skip step 1 and go directly to transfer step
      if (transformedData.length === 1) {
        setSelectedAssignment(transformedData[0]);
        setToClientId(transformedData[0].client_id);
        setToDepartmentId(transformedData[0].department_location_id || '');
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
    // Set default transfer destination to current assignment details
    setToClientId(assignment.client_id);
    setToDepartmentId(assignment.department_location_id || '');
    setStep(2);
    setError(null);
  };

  const handleTransfer = async () => {
    if (!selectedAssignment || !toClientId || !toDepartmentId) return;
    setLoading(true);
    setError(null);
    try {
      await onTransfer(selectedAssignment, toClientId, toDepartmentId);
      
      // Trigger manual refresh for AssignedToSection
      window.dispatchEvent(new CustomEvent(`refresh-assignments-${printerId}`));
      
      setLoading(false);
      onClose();
    } catch (e: any) {
      console.error('Transfer failed:', e);
      setError(e.message || 'Failed to transfer printer.');
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep(1);
    setSelectedAssignment(null);
    setError(null);
  };

  const handleClose = () => {
    setStep(1);
    setSelectedAssignment(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-lg w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-full">
              <ArrowRightLeft className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 1 ? 'Transfer Printer' : 'Transfer Options'}
            </h2>
          </div>
        </div>
        <div className="p-6">
          {step === 1 && (
            <>
              <p className="text-gray-700 mb-4">
                Select an assignment to transfer for printer <b>{[
  printerDetails.manufacturer,
  printerDetails.series,
  printerDetails.model || printerDetails.name
].filter(Boolean).join(' ')}</b>:
              </p>
              {fetchingAssignments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                  <span className="ml-2">Loading assignments...</span>
                </div>
              ) : assignments.length === 0 ? (
                <div className="text-gray-500 italic">No active assignments found.</div>
              ) : (
                <ul className="space-y-3 mb-4">
                  {assignments.map(a => (
                    <li key={a.id} className="border rounded-lg p-3 flex flex-col cursor-pointer hover:bg-purple-50 transition" onClick={() => handleAssignmentSelect(a)}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">{a.client?.name || a.client_id}</span>
                        {a.serial_number && <span className="ml-2 text-xs text-gray-500">SN: {a.serial_number}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                        {(a.departments_location?.department?.name || a.department) && (
                          <>
                            <Building2 className="h-3 w-3" />
                            {a.departments_location?.department?.name || a.department}
                            {a.departments_location?.name && ` - ${a.departments_location.name}`}
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          {step === 2 && selectedAssignment && (
            <>
              <div className="mb-4">
                <div className="font-semibold text-gray-800 mb-2">Current Assignment</div>
                <div className="bg-gray-50 border rounded-lg p-3 mb-2">
                  <div className="flex items-center gap-2 mb-1 text-sm">
                    <User className="h-4 w-4 text-purple-500" />
                    <span>{selectedAssignment.client?.name || selectedAssignment.client_id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    {(selectedAssignment.departments_location?.department?.name || selectedAssignment.department) && (
                      <>
                        <Building2 className="h-3 w-3" />
                        {selectedAssignment.departments_location?.department?.name || selectedAssignment.department}
                        {selectedAssignment.departments_location?.name && ` - ${selectedAssignment.departments_location.name}`}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <div className="font-semibold text-gray-800 mb-2">Transfer To</div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Client</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2"
                      value={toClientId}
                      onChange={e => {
                        setToClientId(e.target.value);
                        // Clear department when client changes
                        setToDepartmentId('');
                        setDepartments([]);
                      }}
                      disabled={loading}
                    >
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2"
                      value={toDepartmentId}
                      onChange={e => setToDepartmentId(e.target.value)}
                      disabled={loading || departments.length === 0}
                    >
                      <option value="">Select Department</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}{d.location ? ` - ${d.location}` : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              {error && <div className="text-red-600 mb-2">{error}</div>}
              <div className="flex space-x-3">
                <button
                  onClick={handleBack}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  onClick={handleTransfer}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center disabled:bg-purple-400"
                  disabled={loading || !toClientId || !toDepartmentId}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                  Transfer
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransferPrinterModal;
