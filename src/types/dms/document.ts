export interface DocumentData {
  id: string;
  type: string;
  clientName: string;
  clientAddress: string;
  clientPhone: string;
  clientEmail: string;
  date: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  notes: string;
  total: number;
  createdAt: string;
  // --- Service Report v1 fields ---
  deliveryNo?: string;
  department?: string;
  deviceType?: string;
  make?: string;
  model?: string;
  serial?: string;
  technician?: string;
  problem?: string;
  diagnosis?: string;
  actionsTaken?: string[];
  recommendations?: string[];
  parts?: Array<{
    name: string;
    quantity: string;
    rate: string;
  }>;
  serviceFee?: string;
  totalFee?: string;
}

export const documentTitles: { [key: string]: string } = {
  'price-quotation': 'Price Quotation',
  'service-report': 'Service Report',
  'maintenance-report': 'Maintenance Report',
  'purchase-order': 'Purchase Order',
  'delivery-receipt': 'Delivery Receipt',
  'accountability-form': 'Accountability Form',
  'contract-agreement': 'Contract Agreement',
};
