
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getAssignmentLevel, getUnassignmentDescription } from '@/utils/assignmentLevelDetector';
import { Building2, MapPin, AlertTriangle } from 'lucide-react';

interface UnassignConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (unassignLevel: 'location' | 'department') => void;
  assignment: any;
}

export const UnassignConfirmationModal: React.FC<UnassignConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  assignment
}) => {
  const assignmentLevel = getAssignmentLevel(assignment);
  
  // Determine what level of unassignment we're dealing with
  const hasLocation = assignment.department_location_id || assignment.departments_location;
  const hasDepartment = assignment.department || assignment.departments_location?.department;
  
  const getModalContent = () => {
    if (hasLocation && hasDepartment) {
      // Has both department and location - offer location removal
      return {
        title: "Remove from Location?",
        description: "This printer is currently assigned to a location under a department. Do you want to remove it from its current location?",
        action: "Remove from Location",
        level: 'location' as const,
        icon: <MapPin className="w-5 h-5 text-orange-600" />,
        consequence: "The printer will remain assigned to the department but will be marked as inactive with no specific location."
      };
    } else if (hasDepartment) {
      // Has department but no location - offer department removal
      return {
        title: "Undeploy from Department?",
        description: "This printer is currently assigned to a department. Do you want to undeploy it from this department?",
        action: "Undeploy from Department", 
        level: 'department' as const,
        icon: <Building2 className="w-5 h-5 text-red-600" />,
        consequence: "The printer will be completely unassigned and become available for deployment elsewhere."
      };
    } else {
      // Fallback - shouldn't happen
      return {
        title: "Unassign Printer?",
        description: "Are you sure you want to unassign this printer?",
        action: "Unassign",
        level: 'department' as const,
        icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
        consequence: "The printer will be unassigned."
      };
    }
  };

  const content = getModalContent();
  const departmentName = assignment.departments_location?.department?.name || assignment.department || 'Unknown Department';
  const locationName = assignment.departments_location?.name || assignment.location || 'Unknown Location';

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {content.icon}
            {content.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div>{content.description}</div>
            
            {/* Current Assignment Info */}
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm font-medium text-gray-900 mb-2">Current Assignment:</div>
              {hasDepartment && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="w-4 h-4" />
                  <span>Department: {departmentName}</span>
                </div>
              )}
              {hasLocation && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>Location: {locationName}</span>
                </div>
              )}
            </div>

            {/* Consequence */}
            <div className="text-sm text-gray-600">
              <strong>What will happen:</strong> {content.consequence}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => onConfirm(content.level)}
            className="bg-red-600 hover:bg-red-700"
          >
            {content.action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
