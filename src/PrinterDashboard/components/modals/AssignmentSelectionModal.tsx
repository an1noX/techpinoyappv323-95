
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer as PrinterType } from '@/types/database';

interface AssignmentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  printer: PrinterType | null;
  onAssignmentSelected: (assignmentId: string) => void;
  title: string;
  description: string;
}

const AssignmentSelectionModal: React.FC<AssignmentSelectionModalProps> = ({
  isOpen,
  onClose,
  printer,
  onAssignmentSelected,
  title,
  description
}) => {
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

  if (!printer || !printer.printer_assignments) return null;

  const handleContinue = () => {
    if (selectedAssignmentId) {
      onAssignmentSelected(selectedAssignmentId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-gray-600">{description}</p>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Printer Model</h3>
            <p className="text-sm font-medium">
              {[printer.manufacturer, printer.series, printer.model || printer.name].filter(Boolean).join(' ')}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Select Assignment:</h4>
            {printer.printer_assignments.map((assignment) => (
              <div
                key={assignment.id}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedAssignmentId === assignment.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedAssignmentId(assignment.id)}
              >
                <div className="flex items-start gap-3">
                  {/* Printer Image */}
                  <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-xl border-2 border-gray-200 overflow-hidden">
                    {assignment.printer?.image_url ? (
                      <img
                        src={assignment.printer.image_url}
                        alt={assignment.printer.name}
                        className="object-contain w-full h-full"
                      />
                    ) : (
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="6" y="9" width="12" height="7" rx="2"/><path d="M6 18h12M9 18v1a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-1"/><path d="M6 14v-4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"/></svg>
                    )}
                  </div>
                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="text-sm text-gray-600 font-medium">Serial: {assignment.serial_number || 'Not set'}</div>
                    {assignment.client && (
                      <div className="text-sm text-gray-600">Client: {assignment.client.name}</div>
                    )}
                    {assignment.department_location_id && (
                      <div className="text-sm text-gray-600">Location: {assignment.department_location_id}</div>
                    )}
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {assignment.status}
                      </Badge>
                      {assignment.usage_type && (
                        <Badge variant="outline" className="text-xs">
                          {assignment.usage_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {/* Radio Button */}
                  <div className="flex items-center pl-2">
                    <input
                      type="radio"
                      checked={selectedAssignmentId === assignment.id}
                      onChange={() => setSelectedAssignmentId(assignment.id)}
                      className="h-4 w-4 text-blue-600"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleContinue} 
            disabled={!selectedAssignmentId}
            className="flex-1"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentSelectionModal;
