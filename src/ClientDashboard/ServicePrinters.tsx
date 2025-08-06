
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ClientServiceCard from '@/components/admin-dashboard/components/ClientServiceCard';

interface Printer {
  id: string;
  name: string;
  manufacturer?: string;
  model?: string;
  series?: string;
  image_url?: string;
  color?: string;
  status?: string;
}

export function ServicePrinters() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const clientId = 'c716cb3b-0765-4271-b88f-e1ecff73ec24';

  useEffect(() => {
    async function fetchPrinters() {
      setLoading(true);
      setError(null);

      // Step 1: Get printer_ids for this client
      const { data: visRows, error: visError } = await supabase
        .from('printer_visibility')
        .select('printer_id')
        .eq('client_id', clientId);

      if (visError) {
        setError('Failed to load printer visibility data.');
        setLoading(false);
        return;
      }

      const printerIds = (visRows || []).map((row: any) => row.printer_id);
      if (printerIds.length === 0) {
        setPrinters([]);
        setLoading(false);
        return;
      }

      // Step 2: Get printer details for those IDs
      const { data: printers, error: printersError } = await supabase
        .from('printers')
        .select('id, name, manufacturer, model, series, image_url, color, status')
        .in('id', printerIds);

      if (printersError) {
        setError('Failed to load printer details.');
        setLoading(false);
        return;
      }

      setPrinters(printers || []);
      setLoading(false);
    }

    fetchPrinters();
  }, [clientId]);

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Loading printers...</div>;
  }
  if (error) {
    return <div className="py-12 text-center text-red-500">{error}</div>;
  }
  if (printers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Printers Found</h3>
          <p className="text-gray-600 mb-4">
            There are currently no printers visible to your account.<br />
            Please contact support if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Printers Visible to You</h3>
      <div className="space-y-4">
        {printers.map((printer) => (
          <ClientServiceCard
            key={printer.id}
            printer={{
              printer: printer,
              printer_id: printer.id,
              serial_number: undefined, // If you have this, pass it here
              status: printer.status
            }}
            clientId={clientId}
          />
        ))}
      </div>
    </div>
  );
} 
