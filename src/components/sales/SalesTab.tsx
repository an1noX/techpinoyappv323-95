
import React from 'react';
import { PurchaseOrdersTabEnhanced } from './PurchaseOrdersTabEnhanced';
import { DeliveriesTabEnhanced } from './DeliveriesTabEnhanced';
import { TransactionRecordsList } from './TransactionRecordsList';
import { Sale } from '@/types/sales';
import TransactionRecord from '@/transactions/pages/TransactionRecord';

interface SalesTabProps {
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  activeTab: string;
}

export const SalesTab: React.FC<SalesTabProps> = ({ sales, setSales, activeTab }) => {
  switch (activeTab) {
    case 'transactions':
      return <TransactionRecordsList />;
    case 'purchase-orders':
      return <PurchaseOrdersTabEnhanced />;
    case 'deliveries':
      return <DeliveriesTabEnhanced />;
    case 'transactionsv2':
      return <TransactionRecord editMode={false} toggleEditMode={() => {}} />;
    default:
      return <TransactionRecordsList />;
  }
};
