
import React, { useState } from 'react';
import AssignedPrinterCard from '@/PrinterDashboard/PrinterDashboardCard';
import AvailablePrinterCard from '@/PrinterDashboard/PrinterDashboardAvailable';
import PrinterDashboardCard from './PrinterDashboardCard';
import PrinterCatalogCard from './PrinterCatalogCard';
import AdminEmptyState from '@/PrinterDashboard/AdminEmptyState';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ADMIN_DASHBOARD_TABS } from '@/constants/adminDashboard';
import AllPrintersCard from './components/AllPrintersCard';
import { CustomLoading } from "@/components/ui/CustomLoading";

type TabType = typeof ADMIN_DASHBOARD_TABS[keyof typeof ADMIN_DASHBOARD_TABS];

interface PrinterDashboardTabProps {
  activeTab: TabType;
  isLoading: boolean;
  filteredData: any[];
  searchQuery: string;
  onItemClick: (item: any) => void;
  onAddNew?: () => void;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onDataRefresh?: () => void;
  printerFilter?: 'assigned' | 'catalog' | 'available' | 'inventory';
  debug?: boolean;
}

const PrinterDashboardTab: React.FC<PrinterDashboardTabProps> = ({
  activeTab,
  isLoading,
  filteredData,
  searchQuery,
  onItemClick,
  onAddNew,
  onEdit,
  onDelete,
  onDataRefresh,
  printerFilter,
  debug = false
}) => {
  if (isLoading) {
    return (
      <CustomLoading />
    );
  }
  
  if (filteredData.length === 0) {
    return <AdminEmptyState activeTab={activeTab} searchQuery={searchQuery} onAddNew={onAddNew} printerFilter={printerFilter} />;
  }
  
  return (
    <div className={`space-y-3 w-full px-1 max-w-full${['assigned','available','inventory','catalog'].includes(printerFilter ?? '') ? ' pb-[60px]' : ''}`}>
      {/* Mobile-First Grid - Single column layout */}
      <div className="grid grid-cols-1 gap-3 w-full max-w-full">
        {filteredData.map((item, idx) => {
          if (printerFilter === 'assigned') {
            return (
              <AssignedPrinterCard
                key={item.id || idx}
                printer={item}
                onEdit={onEdit}
                onDelete={onDelete}
                onTransfer={() => {}}
                debug={debug}
              />
            );
          }
          if (printerFilter === 'available') {
            return (
              <AvailablePrinterCard
                key={item.id || idx}
                printer={item}
                onEditVisibility={() => {}}
                onDelete={onDelete}
              />
            );
          }
          if (printerFilter === 'catalog') {
            return (
              <PrinterCatalogCard
                key={item.id || idx}
                printer={item}
                onEdit={onEdit}
                onDelete={onDelete}
                debug={debug}
              />
            );
          }
          if (printerFilter === 'inventory') {
            // For 'inventory', show all assignments (not just one per printer)
            // Assume item is an assignment object with printer info
            return (
              <AllPrintersCard
                key={item.id || idx}
                assignment={item}
                onEdit={onEdit}
                onDelete={onDelete}
                onDataRefresh={onDataRefresh}
                debug={debug}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default PrinterDashboardTab;
