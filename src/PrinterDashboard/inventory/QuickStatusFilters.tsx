import React from 'react';
import { Button } from '@/components/ui/button';
import { Package, Monitor, Wrench, Archive } from 'lucide-react';
import { PrinterUnit } from '@/types/printer-unit';

interface QuickStatusFiltersProps {
  statusFilter: PrinterUnit['status'] | 'all';
  onStatusFilterChange: (status: string) => void;
  summary: {
    total: number;
    available: number;
    assigned: number;
    maintenance: number;
    retired: number;
    rented: number;
  };
}

export default function QuickStatusFilters({ 
  statusFilter, 
  onStatusFilterChange, 
  summary 
}: QuickStatusFiltersProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <Package className="h-4 w-4" />;
      case 'assigned':
        return <Monitor className="h-4 w-4" />;
      case 'maintenance':
        return <Wrench className="h-4 w-4" />;
      case 'retired':
        return <Archive className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700';
      case 'assigned':
        return 'bg-blue-100 text-blue-700';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-700';
      case 'retired':
        return 'bg-gray-100 text-gray-700';
      case 'rented':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={statusFilter === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onStatusFilterChange('all')}
        className="text-xs"
      >
        All ({summary.total})
      </Button>
      {(['available', 'assigned', 'maintenance', 'rented', 'retired'] as const).map((status) => (
        <Button
          key={status}
          variant={statusFilter === status ? 'default' : 'outline'}
          size="sm"
          onClick={() => onStatusFilterChange(status)}
          className={`text-xs ${statusFilter === status ? '' : getStatusColor(status)}`}
        >
          {getStatusIcon(status)}
          <span className="ml-1 capitalize">{status} ({summary[status]})</span>
        </Button>
      ))}
    </div>
  );
} 