import React from 'react';
import { Printer, Package } from 'lucide-react';

interface ProductSearchFilterButtonsProps {
  searchType: 'products' | 'printers';
  onChange: (type: 'products' | 'printers') => void;
  className?: string;
}

export const ProductSearchFilterButtons: React.FC<ProductSearchFilterButtonsProps> = ({
  searchType,
  onChange,
  className
}) => (
  <div className={`flex items-center gap-1 ${className || ''}`}>
    <button
      type="button"
      onClick={() => onChange('printers')}
      className={`group flex items-center justify-center px-2 py-2 rounded-lg transition-all duration-200 relative
        ${searchType === 'printers' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
      `}
      aria-pressed={searchType === 'printers'}
    >
      <Printer className="h-5 w-5" />
      <span className={`ml-2 text-xs font-semibold ${searchType === 'printers' ? '' : 'hidden md:inline'}`}>Printers</span>
    </button>
    <button
      type="button"
      onClick={() => onChange('products')}
      className={`group flex items-center justify-center px-2 py-2 rounded-lg transition-all duration-200 relative
        ${searchType === 'products' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
      `}
      aria-pressed={searchType === 'products'}
    >
      <Package className="h-5 w-5" />
      <span className={`ml-2 text-xs font-semibold ${searchType === 'products' ? '' : 'hidden md:inline'}`}>Products</span>
    </button>
  </div>
); 