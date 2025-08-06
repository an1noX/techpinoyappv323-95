import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AssignmentData {
  id: string;
  client_id: string;
  clients?: {
    name: string;
  };
  client_name?: string;
  departments_location?: {
    name: string;
    department?: {
      name: string;
    };
  };
  department?: string;
  location?: string;
  status: string;
  is_unassigned?: boolean;
  maintenance_status?: string;
  is_client_owned?: boolean;
  last_maintenance_date?: string;
}

interface AssignedToSectionProps {
  printerId: string;
}

function getStatusIconAndColor(status?: string, lastMaintenanceDate?: string) {
  if (status === 'Done') {
    if (lastMaintenanceDate) {
      const lastDate = new Date(lastMaintenanceDate);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 61) {
        return { icon: <CheckCircle className="h-[13px] w-[13px] text-red-600" /> };
      } else if (diffDays >= 31) {
        return { icon: <CheckCircle className="h-[13px] w-[13px] text-orange-500" /> };
      } else {
        return { icon: <CheckCircle className="h-[13px] w-[13px] text-green-600" /> };
      }
    } else {
      return { icon: <CheckCircle className="h-[13px] w-[13px] text-green-600" /> };
    }
  }
  switch (status) {
    case 'For Repair':
    case 'For Pullout':
      return { icon: <AlertCircle className="h-[13px] w-[13px] text-red-600" /> };
    case 'Need Drumkit Replacement':
    case 'Need Cleaning':
      return { icon: <AlertCircle className="h-[13px] w-[13px] text-orange-500" /> };
    default:
      return { icon: <Clock className="h-[13px] w-[13px] text-gray-400" /> };
  }
}

const AssignedToSection: React.FC<AssignedToSectionProps> = ({ printerId }) => {
  const { user, userProfile } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [allowedClientIds, setAllowedClientIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch allowed client IDs for client users only
  useEffect(() => {
    if (userProfile?.role === 'client' && user?.id) {
      supabase
        .from('client_access' as any)
        .select('client_id')
        .eq('user_id', user.id)
        .then(({ data }) => {
          setAllowedClientIds(data ? data.map((row: any) => row.client_id) : []);
        });
    }
  }, [user, userProfile]);

  const fetchAssignments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('printer_assignments')
        .select(`
          *,
          clients (
            name
          ),
          departments_location (
            name,
            department:departments (
              name
            )
          )
        `)
        .eq('printer_id', printerId)
        .in('status', ['active', 'inactive', 'undeployed']);

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [printerId]);

  // Create a manual refresh function that can be called externally
  const refreshAssignments = useCallback(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Expose refresh function to parent components via a custom event
  useEffect(() => {
    const handleRefresh = () => {
      refreshAssignments();
    };
    
    window.addEventListener(`refresh-assignments-${printerId}`, handleRefresh);
    
    return () => {
      window.removeEventListener(`refresh-assignments-${printerId}`, handleRefresh);
    };
  }, [printerId, refreshAssignments]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Set up real-time subscription for assignment changes
  useEffect(() => {
    const channel = supabase
      .channel(`printer-assignments-${printerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'printer_assignments',
          filter: `printer_id=eq.${printerId}`
        },
        (payload) => {
          // Small delay to ensure database consistency
          setTimeout(() => {
            fetchAssignments();
          }, 200);
        }
      )
      .subscribe((status) => {
        // Subscription status handled silently
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [printerId]);

  if (loading) {
    return (
      <div className="mt-3 pt-3 border-t border-orange-200/50">
        <h5 className="text-sm font-medium text-gray-700 mb-2">Assigned To:</h5>
        <p className="text-xs text-gray-500 italic">Loading...</p>
      </div>
    );
  }

  // Only filter assignments for client users
  const filteredAssignments =
    userProfile?.role === 'client'
      ? assignments.filter(a => a.client_id && allowedClientIds.includes(a.client_id))
      : assignments;

  return (
    <div className="mt-3 border-t border-orange-200/50">
      <h5 className="text-sm font-medium text-gray-700 mb-2">Assigned To:</h5>
      {filteredAssignments.length > 0 ? (
        <div>
          {filteredAssignments.map((assignment) => {
            const clientName = assignment.clients?.name || assignment.client_name || 'Unknown Client';
            let deptLocation = '';
            if (assignment.departments_location) {
              const dept = assignment.departments_location.department?.name || assignment.department || '';
              const loc = assignment.departments_location.name || assignment.location || '';
              deptLocation = [dept, loc].filter(Boolean).join(' - ');
            } else if (assignment.department || assignment.location) {
              deptLocation = [assignment.department, assignment.location].filter(Boolean).join(' - ');
            }
            const { icon } = getStatusIconAndColor(assignment.maintenance_status, assignment.last_maintenance_date);

            // Determine status label and badge style
            let statusLabel = '';
            let badgeClass = '';
            let textClass = '';
            if (assignment.status === 'inactive') {
              statusLabel = 'Inactive';
              badgeClass = 'bg-gray-200 text-gray-700 border-gray-300';
              textClass = 'text-gray-500 italic';
            } else if (assignment.status === 'undeployed') {
              statusLabel = 'For Assignment';
              badgeClass = 'bg-orange-100 text-orange-700 border-orange-200';
              textClass = 'text-orange-700';
            } else if (assignment.status === 'active') {
              statusLabel = 'Active';
              badgeClass = 'bg-green-100 text-green-700 border-green-300';
              textClass = 'text-green-700';
            } else {
              badgeClass = 'bg-gray-100 text-gray-700 border-gray-200';
              textClass = 'text-gray-700';
            }

            let displayString = clientName;
            if (deptLocation) {
              displayString += ` (${deptLocation})`;
            }

            return (
              <div key={assignment.id} className={`flex items-center gap-2 text-sm ${textClass}`}>
                <span
                  aria-label={`Maintenance Status: ${assignment.maintenance_status || 'No Status'}`}
                  title={`Maintenance Status: ${assignment.maintenance_status || 'No Status'}`}
                  className={`flex items-center justify-center mr-1`}
                >
                  {icon}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${badgeClass} mr-2`}>
                  {statusLabel}
                </span>
                <span className={assignment.is_client_owned ? 'text-blue-600' : undefined}>
                  {displayString}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-500 italic">Not currently assigned to any clients.</p>
      )}
    </div>
  );
};

export default AssignedToSection;
