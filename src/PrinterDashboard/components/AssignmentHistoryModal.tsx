
import React, { useState, useEffect } from 'react';
import { Clock, User, Building2, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AssignmentHistoryEntry {
  id: string;
  action_type: string;
  performed_at: string;
  performed_by?: string;
  reason?: string;
  previous_client?: { name: string };
  new_client?: { name: string };
  previous_department_location?: { name: string; department?: { name: string } };
  new_department_location?: { name: string; department?: { name: string } };
}

interface AssignmentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  printerId: string;
}

const AssignmentHistoryModal: React.FC<AssignmentHistoryModalProps> = ({
  isOpen,
  onClose,
  printerId,
}) => {
  const [history, setHistory] = useState<AssignmentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && printerId) {
      fetchHistory();
    }
  }, [isOpen, printerId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('printer_assignment_history')
        .select(`
          *,
          previous_client:clients!printer_assignment_history_previous_client_id_fkey(name),
          new_client:clients!printer_assignment_history_new_client_id_fkey(name),
          previous_department_location:departments_location!printer_assignment_history_previous_department_location_id_fkey(
            name,
            department:departments(name)
          ),
          new_department_location:departments_location!printer_assignment_history_new_department_location_id_fkey(
            name,
            department:departments(name)
          )
        `)
        .eq('printer_assignment_id', printerId)
        .order('performed_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface with proper error handling
      const transformedData = (data || []).map(item => ({
        id: item.id,
        action_type: item.action_type,
        performed_at: item.performed_at,
        performed_by: item.performed_by,
        reason: item.reason,
        previous_client: item.previous_client,
        new_client: item.new_client,
        previous_department_location: item.previous_department_location,
        new_department_location: item.new_department_location
      })) as unknown as AssignmentHistoryEntry[];
      
      setHistory(transformedData);
    } catch (error) {
      console.error('Failed to fetch assignment history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'assigned':
        return <User className="h-4 w-4 text-green-500" />;
      case 'transferred':
        return <Building2 className="h-4 w-4 text-blue-500" />;
      case 'unassigned':
        return <MapPin className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Assignment History</h2>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading history...</div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No assignment history found for this printer.
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    {getActionIcon(entry.action_type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium capitalize">{entry.action_type}</span>
                        <span className="text-sm text-gray-500">
                          {formatDate(entry.performed_at)}
                        </span>
                      </div>
                      
                      {entry.action_type === 'assigned' && entry.new_client && (
                        <div className="text-sm text-gray-700">
                          Assigned to {entry.new_client.name}
                          {entry.new_department_location && (
                            <span className="ml-1">
                              ({entry.new_department_location.department?.name} - {entry.new_department_location.name})
                            </span>
                          )}
                        </div>
                      )}
                      
                      {entry.action_type === 'transferred' && (
                        <div className="text-sm text-gray-700">
                          Transferred from {entry.previous_client?.name || 'Unknown'} to {entry.new_client?.name || 'Unknown'}
                        </div>
                      )}
                      
                      {entry.action_type === 'unassigned' && entry.previous_client && (
                        <div className="text-sm text-gray-700">
                          Unassigned from {entry.previous_client.name}
                        </div>
                      )}
                      
                      {entry.reason && (
                        <div className="text-sm text-gray-600 mt-1">
                          Reason: {entry.reason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentHistoryModal;
