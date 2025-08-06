import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

const HISTORY_TYPES = [
  { key: 'all', label: 'All Events' },
  { key: 'maintenance', label: 'Maintenance History' },
  { key: 'assignment', label: 'Assignment History' },
  { key: 'general', label: 'General Printer History' },
  { key: 'last_maintenance', label: 'Last Maintenance Date' },
];

export default function PrinterHistoryModal({ open, onClose, printerId }) {
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    // Fetch all assignment IDs for this printer
    supabase.from('printer_assignments').select('id,last_service_date').eq('printer_id', printerId).then(async ({ data: assignments }) => {
      const assignmentIds = (assignments || []).map(a => a.id);
      const lastServiceDates = (assignments || []).map(a => a.last_service_date).filter(Boolean);
      // Fetch all types in parallel
      const [maint, assign, general] = await Promise.all([
        supabase.from('maintenance_history').select('*').eq('printer_id', printerId),
        assignmentIds.length > 0
          ? supabase.from('printer_assignment_history').select(`
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
            `).in('printer_assignment_id', assignmentIds)
          : Promise.resolve({ data: [] }),
        supabase.from('printer_history').select('*').eq('printer_id', printerId),
      ]);
      // Normalize and merge
      const events = [
        ...(maint.data || []).map(e => ({ ...e, type: 'maintenance', date: e.performed_at })),
        ...(assign.data || []).map(e => ({ ...e, type: 'assignment', date: e.performed_at })),
        ...(general.data || []).map(e => ({ ...e, type: 'general', date: e.timestamp })),
        ...lastServiceDates.map(date => ({ type: 'last_maintenance', date, label: 'Last Service Performed' })),
      ];
      // Sort by date descending
      events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTimeline(events);
      setLoading(false);
    });
  }, [open, printerId]);

  // Filtered view
  const filtered = selectedType === 'all'
    ? timeline
    : timeline.filter(e => e.type === selectedType);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full rounded-t-lg sm:rounded-lg p-0">
        <DialogHeader>
          <DialogTitle>Printer History</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue placeholder="Select history type" />
            </SelectTrigger>
            <SelectContent>
              {HISTORY_TYPES.map(type => (
                <SelectItem key={type.key} value={type.key}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="text-center text-gray-500 py-8">Loading...</div>
            ) : (
              <ul className="space-y-3">
                {filtered.map((rec, idx) => (
                  <li key={rec.id || rec.date || idx} className="bg-gray-50 rounded p-3 text-xs">
                    {/* Render fields based on type */}
                    {rec.type === 'maintenance' && (
                      <>
                        <div><b>Type:</b> {rec.maintenance_type}</div>
                        <div><b>Action:</b> {rec.action_description}</div>
                        <div><b>Notes:</b> {rec.notes}</div>
                        <div><b>Date:</b> {rec.performed_at}</div>
                      </>
                    )}
                    {rec.type === 'assignment' && (
                      <>
                        <div><b>Action:</b> {rec.action_type}</div>
                        {rec.action_type === 'transferred' && (
                          <div>
                            <b>From:</b> {rec.previous_client?.name || 'N/A'}
                            {rec.previous_department_location && (
                              <span> ({rec.previous_department_location.department?.name || ''} - {rec.previous_department_location.name || ''})</span>
                            )}
                            <br />
                            <b>To:</b> {rec.new_client?.name || 'N/A'}
                            {rec.new_department_location && (
                              <span> ({rec.new_department_location.department?.name || ''} - {rec.new_department_location.name || ''})</span>
                            )}
                          </div>
                        )}
                        {rec.action_type === 'assigned' && rec.new_client && (
                          <div>
                            <b>Assigned to:</b> {rec.new_client.name}
                            {rec.new_department_location && (
                              <span> ({rec.new_department_location.department?.name || ''} - {rec.new_department_location.name || ''})</span>
                            )}
                          </div>
                        )}
                        {rec.action_type === 'unassigned' && rec.previous_client && (
                          <div>
                            <b>Unassigned from:</b> {rec.previous_client.name}
                            {rec.previous_department_location && (
                              <span> ({rec.previous_department_location.department?.name || ''} - {rec.previous_department_location.name || ''})</span>
                            )}
                          </div>
                        )}
                        {rec.reason && (
                          <div><b>Reason:</b> {rec.reason}</div>
                        )}
                        <div><b>Date:</b> {rec.performed_at}</div>
                      </>
                    )}
                    {rec.type === 'general' && (
                      <>
                        <div><b>Action:</b> {rec.action_type}</div>
                        <div><b>Description:</b> {rec.description}</div>
                        <div><b>Date:</b> {rec.timestamp}</div>
                      </>
                    )}
                    {rec.type === 'last_maintenance' && (
                      <>
                        <div><b>{rec.label}</b></div>
                        <div><b>Date:</b> {rec.date}</div>
                      </>
                    )}
                  </li>
                ))}
                {!loading && filtered.length === 0 && (
                  <div className="text-center text-gray-400 py-8">No history found.</div>
                )}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 