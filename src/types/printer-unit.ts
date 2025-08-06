export interface PrinterUnit {
  id: string;
  printer_id: string;
  serial_number: string;
  asset_tag?: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  status: 'available' | 'assigned' | 'maintenance' | 'retired' | 'rented';
  location?: string;
  purchase_date?: string;
  purchase_price?: number;
  warranty_expiry?: string;
  last_maintenance_date?: string;
  next_maintenance_due?: string;
  maintenance_notes?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  printer?: {
    id: string;
    name: string;
    manufacturer?: string;
    model?: string;
    series?: string;
    image_url?: string;
  };
  assignments?: Array<{
    id: string;
    client_id: string;
    department_location_id?: string;
    status: string;
    assignment_effective_date?: string;
    clients?: {
      id: string;
      name: string;
    };
    departments_location?: {
      id: string;
      name: string;
      departments?: {
        id: string;
        name: string;
      };
    };
  }>;
  visibility?: Array<{
    id: string;
    client_id: string;
    clients?: {
      id: string;
      name: string;
    };
  }>;
}

export interface CreatePrinterUnitData {
  printer_id: string;
  serial_number: string;
  asset_tag?: string;
  condition?: PrinterUnit['condition'];
  status?: PrinterUnit['status'];
  location?: string;
  purchase_date?: string;
  purchase_price?: number;
  warranty_expiry?: string;
  notes?: string;
}

export interface UpdatePrinterUnitData {
  condition?: PrinterUnit['condition'];
  status?: PrinterUnit['status'];
  location?: string;
  last_maintenance_date?: string;
  next_maintenance_due?: string;
  maintenance_notes?: string;
  notes?: string;
}