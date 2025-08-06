
interface PrinterAssignment {
  id: string;
  client_id: string;
  department_location_id?: string;
  department?: string;
  location?: string;
  is_unassigned?: boolean;
  status: string;
  departments_location?: {
    id: string;
    name: string;
    department?: {
      id: string;
      name: string;
    };
  };
  client?: {
    id: string;
    name: string;
  };
}

export type AssignmentLevel = 'available' | 'client' | 'department' | 'location';

export interface AssignmentLevelInfo {
  level: AssignmentLevel;
  description: string;
  canUnassignFrom: AssignmentLevel[];
  nextLevel?: AssignmentLevel;
}

/**
 * Detects the current assignment level of a printer
 * @param assignment - The printer assignment to analyze
 * @returns AssignmentLevelInfo with current level and available actions
 */
export function getAssignmentLevel(assignment: PrinterAssignment): AssignmentLevelInfo {
  // Check if printer is available/unassigned
  if (assignment.is_unassigned || assignment.status === 'available') {
    return {
      level: 'available',
      description: 'Printer is available (not assigned to any client)',
      canUnassignFrom: [],
    };
  }

  // Check if assigned to specific location (highest level of assignment)
  if (assignment.department_location_id || assignment.departments_location) {
    return {
      level: 'location',
      description: 'Printer is assigned to a specific location within a department',
      canUnassignFrom: ['location', 'department', 'client'],
      nextLevel: 'department',
    };
  }

  // Check if assigned to department but no specific location
  if (assignment.department || (assignment.departments_location?.department)) {
    return {
      level: 'department',
      description: 'Printer is assigned to a department (no specific location)',
      canUnassignFrom: ['department', 'client'],
      nextLevel: 'client',
    };
  }

  // Only assigned to client (no department or location)
  if (assignment.client_id) {
    return {
      level: 'client',
      description: 'Printer is assigned to a client (no specific department)',
      canUnassignFrom: ['client'],
      nextLevel: 'available',
    };
  }

  // Fallback - shouldn't happen with valid data
  return {
    level: 'available',
    description: 'Printer assignment status unclear',
    canUnassignFrom: [],
  };
}

/**
 * Gets a user-friendly description of what happens when unassigning at a specific level
 * @param level - The level to unassign from
 * @param assignment - The current assignment
 * @returns Description of the unassignment action
 */
export function getUnassignmentDescription(level: AssignmentLevel, assignment: PrinterAssignment): string {
  const clientName = assignment.client?.name || 'Unknown Client';
  const departmentName = assignment.departments_location?.department?.name || assignment.department || 'Unknown Department';
  const locationName = assignment.departments_location?.name || assignment.location || 'Unknown Location';

  switch (level) {
    case 'location':
      return `Remove from location "${locationName}" (will remain assigned to ${departmentName} department)`;
    case 'department':
      return `Remove from department "${departmentName}" (will remain assigned to ${clientName} client)`;
    case 'client':
      return `Remove from client "${clientName}" (printer will become available)`;
    default:
      return 'Unknown unassignment action';
  }
}

/**
 * Checks if an assignment can be unassigned at a specific level
 * @param assignment - The printer assignment
 * @param level - The level to check
 * @returns Whether unassignment is possible at this level
 */
export function canUnassignAt(assignment: PrinterAssignment, level: AssignmentLevel): boolean {
  const levelInfo = getAssignmentLevel(assignment);
  
  // Always allow client-level unassignment if there's a client
  if (level === 'client' && assignment.client_id) {
    return true;
  }
  
  // Allow department unassignment if there's department info
  if (level === 'department' && (assignment.department || assignment.departments_location?.department)) {
    return true;
  }
  
  // Allow location unassignment if there's location info
  if (level === 'location' && (assignment.department_location_id || assignment.departments_location)) {
    return true;
  }
  
  return false;
}

/**
 * Gets the display name for a location
 * @param assignment - The printer assignment
 * @returns Formatted location display string
 */
export function getLocationDisplay(assignment: PrinterAssignment): string {
  if (assignment.departments_location) {
    const dept = assignment.departments_location.department?.name || 'Unknown Department';
    const loc = assignment.departments_location.name || 'Unknown Location';
    return `${dept} - ${loc}`;
  }
  
  if (assignment.department || assignment.location) {
    return [assignment.department, assignment.location].filter(Boolean).join(' - ');
  }
  
  return 'No specific location';
}
