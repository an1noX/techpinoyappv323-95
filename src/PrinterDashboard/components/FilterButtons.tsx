import { Monitor, Package } from 'lucide-react';

interface FilterButtonsProps {
  printerFilter: 'assigned' | 'catalog' | 'available' | 'inventory' | 'all';
  setPrinterFilter: (filter: 'assigned' | 'catalog' | 'available' | 'inventory' | 'all') => void;
}

const FILTERS = [
  { key: 'assigned', label: 'Assigned', icon: Monitor },
  { key: 'available', label: 'Available', icon: Package },
];

export const FilterButtons = ({ printerFilter, setPrinterFilter }: FilterButtonsProps) => {
  return (
    <div className="flex gap-1 w-full min-w-0 items-stretch">
      {FILTERS.map(({ key, label, icon: Icon }) => {
        const isActive = printerFilter === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setPrinterFilter(key as any)}
            className={`transition-all duration-200 min-w-0 rounded-lg h-full flex items-center justify-center
              ${isActive 
                ? 'flex-[2] bg-blue-600 text-white shadow-md gap-3 px-4 py-3'
                : 'flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 px-0 py-3'
              }
            `}
            aria-pressed={isActive}
            style={{ minWidth: 0 }}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {isActive && (
              <span className="text-base font-semibold truncate text-center leading-tight ml-2">
                {label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
