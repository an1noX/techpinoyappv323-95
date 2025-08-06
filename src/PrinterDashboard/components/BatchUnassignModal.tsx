
import React, { useState } from 'react';
import { Loader2, AlertCircle, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { printerService } from '@/services/printerService';

interface BatchUnassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPrinters: string[];
  onUnassigned: () => void;
}

const BatchUnassignModal: React.FC<BatchUnassignModalProps> = ({
  isOpen,
  onClose,
  selectedPrinters,
  onUnassigned,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ success: string[], failed: string[] } | null>(null);

  if (!isOpen) return null;

  const handleBatchUnassign = async () => {
    setLoading(true);
    const success: string[] = [];
    const failed: string[] = [];

    for (const printerId of selectedPrinters) {
      try {
        // For batch operations, we'll unassign from client level
        await printerService.unassignFromClient(printerId);
        success.push(printerId);
      } catch (error) {
        failed.push(printerId);
      }
    }

    setResults({ success, failed });
    setLoading(false);

    if (success.length > 0) {
      toast({
        title: 'Batch Unassignment Complete',
        description: `Successfully unassigned ${success.length} printers. ${failed.length} failed.`,
      });
      onUnassigned();
    }
  };

  const handleClose = () => {
    setResults(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 rounded-full">
              <Users className="h-5 w-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Batch Unassign Printers</h2>
          </div>
        </div>

        <div className="p-6">
          {!results ? (
            <>
              <div className="mb-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-800 mb-1">Batch Unassignment Warning</div>
                      <div className="text-sm text-yellow-700">
                        This will unassign all {selectedPrinters.length} selected printers from their current clients.
                        This action cannot be undone.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBatchUnassign}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Unassign All
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Batch Operation Results</h3>
                {results.success.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                    <div className="text-sm text-green-800">
                      Successfully unassigned {results.success.length} printers
                    </div>
                  </div>
                )}
                {results.failed.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="text-sm text-red-800">
                      Failed to unassign {results.failed.length} printers
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleClose}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchUnassignModal;
