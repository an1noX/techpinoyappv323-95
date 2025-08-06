import React from 'react';
import { Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';

interface InventoryEmptyStateProps {
  searchQuery: string;
  statusFilter: string;
  conditionFilter: string;
  onAddUnit: () => void;
}

export default function InventoryEmptyState({
  searchQuery,
  statusFilter,
  conditionFilter,
  onAddUnit
}: InventoryEmptyStateProps) {
  const hasFilters = searchQuery || statusFilter !== 'all' || conditionFilter !== 'all';

  return (
    <div className="text-center py-8">
      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No printer units found</h3>
      <p className="text-gray-600 mb-4">
        {hasFilters
          ? 'Try adjusting your filters or search terms.'
          : 'Get started by adding your first printer unit to inventory.'}
      </p>
      <Button onClick={onAddUnit} className="bg-blue-600 hover:bg-blue-700 text-white">
        <Plus className="h-4 w-4 mr-2" />
        Add Printer Unit
      </Button>
    </div>
  );
} 