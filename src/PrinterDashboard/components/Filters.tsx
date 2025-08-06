import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface FiltersProps {
  filterType: 'assigned' | 'all';
  onFilterChange: (value: 'assigned' | 'all') => void;
}

const Filters: React.FC<FiltersProps> = ({
  filterType,
  onFilterChange
}) => {
  return (
    <div className="mb-6">
      <ToggleGroup 
        type="single" 
        value={filterType} 
        onValueChange={(value) => value && onFilterChange(value as 'assigned' | 'all')}
        className="w-full bg-gray-50 rounded-2xl p-1 shadow-sm"
      >
        <ToggleGroupItem 
          value="assigned" 
          className="flex-1 rounded-xl font-semibold text-sm py-3 px-4 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:shadow-md transition-all duration-200 hover:bg-gray-100 data-[state=on]:hover:bg-blue-700"
        >
          Assigned
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="all" 
          className="flex-1 rounded-xl font-semibold text-sm py-3 px-4 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:shadow-md transition-all duration-200 hover:bg-gray-100 data-[state=on]:hover:bg-blue-700"
        >
          All Printers
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default Filters;