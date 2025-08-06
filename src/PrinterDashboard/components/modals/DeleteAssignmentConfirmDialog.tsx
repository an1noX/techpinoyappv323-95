
import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { assetService } from '@/services/assetService';

interface DeleteAssignmentConfirmDialogProps {
  assignmentId: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
  itemName: string;
}

const DeleteAssignmentConfirmDialog: React.FC<DeleteAssignmentConfirmDialogProps> = ({
  assignmentId,
  isOpen,
  onClose,
  onDeleted,
  itemName
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    if (!assignmentId) return;
    setIsLoading(true);
    try {
      console.log('DeleteAssignmentConfirmDialog: Starting deletion process...');
      console.log('Assignment ID:', assignmentId);
      console.log('Item Name:', itemName);
      
      await assetService.deleteAssignment(assignmentId);
      
      toast({
        title: 'Success',
        description: 'Assignment deleted successfully',
      });
      onDeleted();
    } catch (error: any) {
      console.error('DeleteAssignmentConfirmDialog: Error during deletion:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      
      // Provide more detailed error message
      let errorMessage = 'Failed to delete assignment';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.code) {
        errorMessage = `Database error (${error.code}): ${error.message || 'Unknown error'}`;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 p-2 rounded-full">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Remove Printer Assignment</h2>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-4">Are you sure you want to decommission this printer assignment?</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <p className="text-red-800 font-medium">"{itemName}"</p>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            This action cannot be undone. The assignment will be marked as decommissioned in the system.
          </p>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center disabled:bg-red-400"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Decommission Assignment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteAssignmentConfirmDialog;
