import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Printer as PrinterType } from '@/types/database';
import { usePrinters } from '@/hooks/usePrinters';
import { Button } from '@/components/ui/button';

const AdminPrinterDetail: React.FC = () => {
  const { printerId } = useParams<{ printerId: string }>();
  const navigate = useNavigate();
  const { printers, loadPrinters } = usePrinters(false); // get all printers
  const [printer, setPrinter] = useState<PrinterType | null>(null);

  useEffect(() => {
    if (!printers.length) {
      loadPrinters();
    }
  }, []);

  useEffect(() => {
    if (printers.length && printerId) {
      const found = printers.find(p => p.id === printerId);
      setPrinter(found || null);
    }
  }, [printers, printerId]);

  if (!printer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-gray-500">Loading printer details...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full">
        {/* PrinterDetails component was removed, so this will cause a TS2307 error */}
        {/* <PrinterDetails
          printer={printer}
          onPrinterUpdate={loadPrinters}
          onPrinterDeleted={() => navigate(-1)}
        /> */}
      </div>
    </div>
  );
};

export default AdminPrinterDetail; 