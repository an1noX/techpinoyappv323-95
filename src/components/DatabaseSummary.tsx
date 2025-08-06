import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Monitor, Package, Wrench, Archive, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { CustomLoading } from "@/components/ui/CustomLoading";

interface StatusCount {
  status: string;
  count: number;
  color: string;
  icon: React.ReactNode;
}

const DatabaseSummary: React.FC = () => {
  const { userProfile, userProfileLoading } = useAuth();
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
  const [totalAssignments, setTotalAssignments] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(true); // Collapsed by default

  // Fetch printer assignments status counts
  const { data: assignments, isLoading, error } = useQuery({
    queryKey: ['printer-assignments-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('printer_assignments')
        .select('status')
        .neq('status', 'deleted');

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  useEffect(() => {
    if (assignments) {
      // Filter out decommissioned assignments
      const filteredAssignments = assignments.filter(a => a.status !== 'decommissioned');

      // Count assignments by status
      const statusMap = new Map<string, number>();
      filteredAssignments.forEach(assignment => {
        const status = assignment.status || 'unknown';
        statusMap.set(status, (statusMap.get(status) || 0) + 1);
      });

      // Define status configurations for the 4 main statuses
      const statusConfigs: Record<string, { color: string; icon: React.ReactNode }> = {
        'active': {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <Monitor className="h-4 w-4" />
        },
        'inactive': {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Archive className="h-4 w-4" />
        },
        'available': {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <Package className="h-4 w-4" />
        },
        'delisted': {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Archive className="h-4 w-4" />
        },
        'unknown': {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Clock className="h-4 w-4" />
        }
      };

      // Convert to array and sort by count (descending)
      const counts: StatusCount[] = Array.from(statusMap.entries())
        .map(([status, count]) => ({
          status,
          count,
          ...statusConfigs[status] || statusConfigs['unknown']
        }))
        .sort((a, b) => b.count - a.count);

      setStatusCounts(counts);
      setTotalAssignments(filteredAssignments.length);
    }
  }, [assignments]);

  // Admin-only visibility
  if (userProfileLoading) return null;
  if (userProfile?.role !== 'admin') return null;

  if (isLoading) {
    return (
      <div className="bg-white border-b border-gray-200 p-4">
        <CustomLoading message="Loading database summary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-900">Printers Total: {totalAssignments}</h3>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {!isCollapsed && (
          <div className="text-center text-sm text-red-600 mt-2">
            Error loading database summary
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Database className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-medium text-gray-900">Printers Total: {totalAssignments}</h3>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
          {statusCounts.map((statusCount) => (
            <Card key={statusCount.status} className="border-0 shadow-none">
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {statusCount.icon}
                    <span className="text-xs font-medium capitalize">
                      {statusCount.status}
                    </span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${statusCount.color}`}
                  >
                    {statusCount.count}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DatabaseSummary; 