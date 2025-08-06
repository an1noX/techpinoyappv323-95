import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

const MAINTENANCE_STATUSES = [
  'For Repair',
  'For Pullout',
  'Need Drumkit Replacement',
  'Need Cleaning',
  'Done',
];

export default function AssignmentMaintenanceStatusForm({
  assignment,
  printerId,
  onSuccess,
  onError,
}) {
  const [status, setStatus] = useState(assignment.maintenance_status || '');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Update the maintenance_status in printer_assignments
      const { error: updateError } = await supabase
        .from('printer_assignments')
        .update({ maintenance_status: status } as any)
        .eq('id', assignment.id);

      if (updateError) throw updateError;

      // 2. If status is 'Done', log a maintenance event
      if (status === 'Done') {
        const { error: insertError } = await supabase
          .from('maintenance_history')
          .insert([{
            printer_id: printerId,
            assignment_id: assignment.id,
            maintenance_type: 'General',
            action_description: details || 'Maintenance completed',
            status_before: assignment.maintenance_status || null,
            status_after: 'Done',
            performed_by: 'Technician', // Replace with current user if available
            performed_at: new Date().toISOString(),
            completed_date: new Date().toISOString().split('T')[0],
          }]);
        if (insertError) throw insertError;
      }

      if (onSuccess) onSuccess();
      alert('Maintenance status updated!');
    } catch (err) {
      if (onError) onError(err);
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Maintenance Status</label>
        <select
          className="border rounded px-2 py-1 w-full"
          value={status}
          onChange={e => setStatus(e.target.value)}
          required
        >
          <option value="" disabled>Select status</option>
          {MAINTENANCE_STATUSES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      {status === 'Done' && (
        <div>
          <label className="block text-sm font-medium mb-1">Maintenance Details</label>
          <textarea
            className="border rounded px-2 py-1 w-full"
            value={details}
            onChange={e => setDetails(e.target.value)}
            placeholder="Describe what was done (optional)"
            rows={3}
          />
        </div>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? 'Updating...' : 'Update Maintenance Status'}
      </Button>
    </form>
  );
} 