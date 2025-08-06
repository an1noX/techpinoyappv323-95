
import type { PrinterAssignment } from '@/types/database';

export interface UnassignmentSuggestion {
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  action?: string;
}

export function getUnassignmentSuggestions(assignment: any): UnassignmentSuggestion[] {
  const suggestions: UnassignmentSuggestion[] = [];

  // Check if printer has been deployed recently
  if (assignment.deployment_date) {
    const deploymentDate = new Date(assignment.deployment_date);
    const daysSinceDeployment = Math.floor((Date.now() - deploymentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceDeployment < 30) {
      suggestions.push({
        type: 'warning',
        title: 'Recent Deployment',
        message: `This printer was deployed only ${daysSinceDeployment} days ago. Consider if there are any outstanding setup or training requirements.`,
      });
    }
  }

  // Check printer condition
  if (assignment.condition && assignment.condition !== 'good') {
    suggestions.push({
      type: 'info',
      title: 'Printer Condition',
      message: `This printer is in '${assignment.condition}' condition. Consider scheduling maintenance before reassignment.`,
      action: 'Schedule Maintenance'
    });
  }

  // Check if this is the only printer for the client
  if (assignment.client && assignment.printer_count === 1) {
    suggestions.push({
      type: 'warning',
      title: 'Last Printer',
      message: `This is the only printer assigned to ${assignment.client.name}. Ensure they have alternative printing solutions.`,
    });
  }

  // Success suggestion for location-only unassignment
  if (assignment.departments_location && assignment.departments_location.department) {
    suggestions.push({
      type: 'success',
      title: 'Partial Unassignment Available',
      message: 'You can unassign from just the location while keeping the printer with the department for easier reassignment.',
    });
  }

  return suggestions;
}

export function getReassignmentSuggestions(clientId: string): UnassignmentSuggestion[] {
  // This could be enhanced to check for similar clients, available printers, etc.
  return [
    {
      type: 'info',
      title: 'Quick Reassignment',
      message: 'After unassigning, you can quickly reassign this printer to another location or client from the printer dashboard.',
      action: 'View Available Printers'
    }
  ];
}
