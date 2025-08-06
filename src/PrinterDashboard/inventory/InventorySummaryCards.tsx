import React from 'react';
import { Package, Monitor, Wrench, Archive } from 'lucide-react';

interface InventorySummaryCardsProps {
  summary: {
    total: number;
    available: number;
    assigned: number;
    maintenance: number;
    retired: number;
    rented: number;
  };
}

export default function InventorySummaryCards({ summary }: InventorySummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
      <div className="bg-gray-50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
        <div className="text-sm text-gray-600">Total Units</div>
      </div>
      
      <div className="bg-green-50 rounded-lg p-3 text-center">
        <div className="flex items-center justify-center mb-1">
          <Package className="h-4 w-4 text-green-600 mr-1" />
          <span className="text-2xl font-bold text-green-900">{summary.available}</span>
        </div>
        <div className="text-sm text-green-700">Available</div>
      </div>
      
      <div className="bg-blue-50 rounded-lg p-3 text-center">
        <div className="flex items-center justify-center mb-1">
          <Monitor className="h-4 w-4 text-blue-600 mr-1" />
          <span className="text-2xl font-bold text-blue-900">{summary.assigned}</span>
        </div>
        <div className="text-sm text-blue-700">Assigned</div>
      </div>
      
      <div className="bg-yellow-50 rounded-lg p-3 text-center">
        <div className="flex items-center justify-center mb-1">
          <Wrench className="h-4 w-4 text-yellow-600 mr-1" />
          <span className="text-2xl font-bold text-yellow-900">{summary.maintenance}</span>
        </div>
        <div className="text-sm text-yellow-700">Maintenance</div>
      </div>
      
      <div className="bg-purple-50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-purple-900">{summary.rented}</div>
        <div className="text-sm text-purple-700">Rented</div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-3 text-center">
        <div className="flex items-center justify-center mb-1">
          <Archive className="h-4 w-4 text-gray-600 mr-1" />
          <span className="text-2xl font-bold text-gray-900">{summary.retired}</span>
        </div>
        <div className="text-sm text-gray-700">Retired</div>
      </div>
    </div>
  );
} 