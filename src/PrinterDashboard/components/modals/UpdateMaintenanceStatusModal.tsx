import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AssignmentMaintenanceStatusForm from '../AssignmentMaintenanceStatusForm';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { User, Building2 } from 'lucide-react';

interface UpdateMaintenanceStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  printerId: string;
  onStatusUpdated?: () => void;
}

const UpdateMaintenanceStatusModal: React.FC<UpdateMaintenanceStatusModalProps> = ({
  isOpen,
  onClose,
  printerId,
  onStatusUpdated,
}) => {
  const [step, setStep] = useState(1);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [printerName, setPrinterName] = useState<string>('');
  // Add state for printer details
  const [printerDetails, setPrinterDetails] = useState({ name: '', manufacturer: '', series: '', model: '' });

  useEffect(() => {
    const fetchAssignments = async () => {
      if (isOpen && printerId) {
        setLoading(true);
        try {
          const { data } = await supabase
            .from('printer_assignments')
            .select(`
              id,
              client_id,
              department_location_id,
              department,
              location,
              serial_number,
              status,
              clients!inner (
                id,
                name
              ),
              departments_location (
                id,
                name,
                department:departments (
                  id,
                  name
                )
              )
            `)
            .eq('printer_id', printerId)
            .eq('status', 'active');
          setAssignments(data || []);
          if (data?.length === 1) {
            setSelectedAssignment(data[0]);
            setStep(2);
          } else {
            setStep(1);
          }
        } finally {
          setLoading(false);
        }
      } else {
        setAssignments([]);
        setSelectedAssignment(null);
        setStep(1);
      }
    };
    fetchAssignments();
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

  const handleAssignmentSelect = (assignment: any) => {
    setSelectedAssignment(assignment);
    setStep(2);
  };

  const handleSuccess = () => {
    onStatusUpdated?.();
    // Dispatch custom event for real-time refresh
    window.dispatchEvent(new Event(`refresh-assignments-${printerId}`));
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-lg">
        <DialogHeader>
          <DialogTitle>Update Maintenance Status</DialogTitle>
        </DialogHeader>
        {step === 1 && (
          <div>
            <p className="text-gray-700 mb-4">
              Select an assignment to update maintenance status for printer <b>{[
                printerDetails.manufacturer,
                printerDetails.series,
                printerDetails.model || printerDetails.name
              ].filter(Boolean).join(' ')}</b>:
            </p>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <span className="ml-2">Loading assignments...</span>
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-gray-500 italic">No active assignments found.</div>
            ) : (
              <ul className="space-y-3 mb-4">
                {assignments.map(a => (
                  <li
                    key={a.id}
                    className="border rounded-lg p-3 flex flex-col cursor-pointer hover:bg-orange-50 transition"
                    onClick={() => handleAssignmentSelect(a)}
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">{a.clients?.name || a.client_id}</span>
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
          </div>
        )}
        {step === 2 && selectedAssignment && (
          <>
            <div className="mb-4 p-3 rounded-md bg-gray-50 border flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-orange-500" />
                <span className="font-medium">{selectedAssignment.clients?.name || selectedAssignment.client_id}</span>
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
            <AssignmentMaintenanceStatusForm
              assignment={selectedAssignment}
              printerId={printerId}
              onSuccess={handleSuccess}
              onError={onClose}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UpdateMaintenanceStatusModal; 