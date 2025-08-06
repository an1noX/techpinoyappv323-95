import React, { useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { printerService } from '@/services/printerService';
import { useToast } from '@/hooks/use-toast';

interface DeletePrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  printer: any;
  onSuccess?: () => void;
}

const DeletePrinterModal: React.FC<DeletePrinterModalProps> = ({
  isOpen,
  onClose,
  printer,
  onSuccess
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDeleteConfirm = async () => {
    if (!printer?.id) return;

    setIsDeleting(true);
    try {
      await printerService.deletePrinter(
        printer.id,
        'System', // deletedBy - could be enhanced with actual user info
        'Deleted from printer catalog via dashboard'
      );
      
      toast({
        title: 'Success',
        description: 'Printer deleted successfully',
      });

      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const printerName = `${printer?.manufacturer || ''} ${printer?.series || ''} ${printer?.model || printer?.name || ''}`.trim();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 p-2 rounded-full">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Delete Printer</h2>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Are you sure you want to permanently delete this printer? This action cannot be undone.
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <Trash2 className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">{printerName}</p>
                <p className="text-red-600 text-sm">
                  ID: {printer?.id}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
            <p className="text-yellow-800 text-sm">
              <strong>Warning:</strong> This will permanently remove the printer from the catalog. 
              All associated data and product compatibility information will be lost.
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              variant="destructive"
              className="flex-1"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Printer
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeletePrinterModal;