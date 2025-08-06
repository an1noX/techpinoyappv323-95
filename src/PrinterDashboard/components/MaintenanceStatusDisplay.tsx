import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function MaintenanceStatusDisplay({ printerId }: { printerId: string }) {
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [lastDate, setLastDate] = useState<string | undefined>(undefined);

  // Fetch the latest assignment for the printer
  const fetchLatestAssignment = useCallback(async () => {
    if (!printerId) return;
    const { data, error } = await supabase
      .from('printer_assignments')
      .select('maintenance_status, last_maintenance_date')
      .eq('printer_id', printerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error && data) {
      const assignment = data as any;
      setStatus(assignment.maintenance_status);
      setLastDate(assignment.last_maintenance_date);
    } else {
      setStatus(undefined);
      setLastDate(undefined);
    }
  }, [printerId]);

  useEffect(() => {
    fetchLatestAssignment();
    if (!printerId) return;
    const handler = () => fetchLatestAssignment();
    window.addEventListener(`refresh-assignments-${printerId}`, handler);
    return () => {
      window.removeEventListener(`refresh-assignments-${printerId}`, handler);
    };
  }, [printerId, fetchLatestAssignment]);

  return (
    <div className="mt-2">
      <span className="text-xs text-gray-500">Maintenance Status:</span>{' '}
      <span className="font-semibold text-sm">
        {status || 'N/A'}
      </span>
      {status === 'Done' && lastDate && (
        <div className="text-xs text-gray-500 mt-1">
          Last Maintenance: {new Date(lastDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );
} 