import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Package, Printer, Building, UserCheck } from 'lucide-react';
import { ADMIN_DASHBOARD_TABS } from '@/constants/adminDashboard';

type TabType = typeof ADMIN_DASHBOARD_TABS[keyof typeof ADMIN_DASHBOARD_TABS];

interface AdminEmptyStateProps {
  activeTab: TabType;
  searchQuery?: string;
  onAddNew?: () => void;
  printerFilter?: 'assigned' | 'catalog' | 'available' | 'inventory';
}

const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({
  activeTab,
  searchQuery,
  onAddNew,
  printerFilter
}) => {
  const getEmptyStateConfig = () => {
    if (activeTab === ADMIN_DASHBOARD_TABS.PRINTERS && printerFilter === 'assigned') {
      return {
        icon: Printer,
        title: searchQuery ? 'No printers found' : 'No printers yet',
        description: searchQuery 
          ? `No printers match "${searchQuery}". Try adjusting your search.`
          : 'Assign printers to your clients for deployment and management.',
        buttonText: 'Assign Printer',
        color: 'text-purple-600'
      };
    }
    switch (activeTab) {
      case ADMIN_DASHBOARD_TABS.CLIENT:
        return {
          icon: Users,
          title: searchQuery ? 'No clients found' : 'No clients yet',
          description: searchQuery 
            ? `No clients match "${searchQuery}". Try adjusting your search.`
            : 'Start by adding your first client to manage their departments and printers.',
          buttonText: 'Add Client',
          color: 'text-blue-600'
        };

      case ADMIN_DASHBOARD_TABS.SUPPLIERS:
        return {
          icon: Building,
          title: searchQuery ? 'No suppliers found' : 'No suppliers yet',
          description: searchQuery 
            ? `No suppliers match "${searchQuery}". Try adjusting your search.`
            : 'Add suppliers to manage product sourcing and pricing.',
          buttonText: 'Add Supplier',
          color: 'text-green-600'
        };

      case ADMIN_DASHBOARD_TABS.PRINTERS:
        return {
          icon: Printer,
          title: searchQuery ? 'No printers found' : 'No printers yet',
          description: searchQuery 
            ? `No printers match "${searchQuery}". Try adjusting your search.`
            : 'Add printers to your inventory for assignment and rental management.',
          buttonText: 'Add Printer',
          color: 'text-purple-600'
        };

      case ADMIN_DASHBOARD_TABS.PRODUCT:
        return {
          icon: Package,
          title: searchQuery ? 'No products found' : 'No products yet',
          description: searchQuery 
            ? `No products match "${searchQuery}". Try adjusting your search.`
            : 'Start adding products to manage inventory and pricing.',
          buttonText: 'Add Product',
          color: 'text-orange-600'
        };

      default:
        return {
          icon: Package,
          title: 'No data found',
          description: 'No items to display.',
          buttonText: 'Add Item',
          color: 'text-gray-600'
        };
    }
  };

  const config = getEmptyStateConfig();
  const Icon = config.icon;

  return (
    <Card>
      <CardContent className="p-8 text-center">
        <Icon className={`h-16 w-16 mx-auto mb-4 ${config.color} opacity-50`} />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{config.title}</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">{config.description}</p>
        
        {!searchQuery && onAddNew && (
          <Button onClick={onAddNew} className="inline-flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            {config.buttonText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminEmptyState; 