import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { transactionService, CreateTransactionRecord } from '@/services/transactionService';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { parseCSVText, parseExcelFile, downloadTemplate, validateFileType } from '@/lib/csvExcelImportUtils';

interface TransactionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const TransactionImportModal: React.FC<TransactionImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && validateFileType(selectedFile)) {
      setFile(selectedFile);
      setShowPreview(false);
      setPreviewData([]);
      const reader = new FileReader();
      if (selectedFile.name.endsWith('.csv')) {
        reader.onload = (e) => {
          try {
            const parsed = parseCSVText(e.target?.result as string);
            setPreviewData(parsed.filter(item => item.model));
            setShowPreview(true);
          } catch (error) {
            toast.error('Error processing CSV file. Please check the format.');
          }
        };
        reader.readAsText(selectedFile);
      } else {
        reader.onload = (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            const parsed = parseExcelFile(jsonData);
            setPreviewData(parsed.filter(item => item.model));
            setShowPreview(true);
          } catch (error) {
            toast.error('Error processing Excel file. Please check the format.');
          }
        };
        reader.readAsArrayBuffer(selectedFile);
      }
    } else {
      toast.error('Please select a valid CSV or Excel file');
    }
  };

  const handleImport = async () => {
    if (!previewData.length) {
      toast.error('No data to import');
      return;
    }

    setIsUploading(true);
    try {
      await transactionService.importFromExcel(previewData as CreateTransactionRecord[]);
      toast.success(`Successfully imported ${previewData.length} transaction records`);
      onImportComplete();
      onClose();
      setFile(null);
      setPreviewData([]);
      setShowPreview(false);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import transaction records');
    } finally {
      setIsUploading(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setPreviewData([]);
    setShowPreview(false);
    setIsUploading(false);
  };

  const handleDownloadTemplate = () => {
    const headers = ['Status', 'Date', 'Type', 'Supplier/Client', 'Model', 'QTY', 'Price', 'Total', 'S.I', 'DR', 'P.O', 'Notes'];
    const sampleData = [
      ['PENDING', '2024-01-01', 'IN', 'Supplier A', 'Model X', '10', '100', '1000', 'SI-001', 'DR-001', 'PO-001', 'Initial stock'],
      ['COMPLETED', '2024-01-02', 'OUT', 'Client B', 'Model Y', '5', '200', '1000', 'SI-002', 'DR-002', 'PO-002', 'Sold to client'],
    ];
    
    const csvContent = [headers.join(','), ...sampleData.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transaction-template.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('CSV template downloaded successfully!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Transaction Records from Excel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!showPreview ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-2">
                  <Label htmlFor="excel-file" className="cursor-pointer">
                    <span className="text-sm font-medium">Click to upload Excel file</span>
                    <Input
                      id="excel-file"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </Label>
                  <p className="text-xs text-gray-500">
                    Expected columns: Status, Date, Type, Supplier/Client, Model, QTY, Price, Total, S.I, DR, P.O
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">File processed successfully</span>
                <span className="text-sm">({previewData.length} records found)</span>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h4 className="font-medium">Preview (First 5 records)</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-left">Type</th>
                        <th className="px-3 py-2 text-left">Supplier</th>
                        <th className="px-3 py-2 text-left">Model</th>
                        <th className="px-3 py-2 text-left">Qty</th>
                        <th className="px-3 py-2 text-left">Price</th>
                        <th className="px-3 py-2 text-left">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 5).map((record, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">{record.status}</td>
                          <td className="px-3 py-2">{record.date}</td>
                          <td className="px-3 py-2">{record.type}</td>
                          <td className="px-3 py-2">{record.supplier_name}</td>
                          <td className="px-3 py-2">{record.model}</td>
                          <td className="px-3 py-2">{record.quantity}</td>
                          <td className="px-3 py-2">₱{record.unit_price.toFixed(2)}</td>
                          <td className="px-3 py-2">₱{record.total_price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={resetModal} variant="outline">
                  Choose Different File
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={isUploading}
                  className="flex-1"
                >
                  {isUploading ? 'Importing...' : `Import ${previewData.length} Records`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
