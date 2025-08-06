// Unit-level tracking types for purchase orders and deliveries

export interface PurchaseOrderItemUnit {
  id: string;
  purchase_order_item_id: string;
  unit_number: number;
  serial_number?: string;
  batch_number?: string;
  unit_status: 'ordered' | 'delivered' | 'linked' | 'received' | 'rejected';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryItemUnit {
  id: string;
  delivery_item_id: string;
  unit_number: number;
  serial_number?: string;
  batch_number?: string;
  unit_status: 'delivered' | 'linked' | 'received' | 'damaged' | 'returned';
  condition_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface UnitDeliveryLink {
  id: string;
  purchase_order_unit_id: string;
  delivery_unit_id: string;
  link_status: 'linked' | 'confirmed' | 'disputed' | 'rejected';
  linked_at: string;
  confirmed_at?: string;
  confirmed_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Extended types with relationships
export interface PurchaseOrderItemUnitWithDetails extends PurchaseOrderItemUnit {
  purchase_order_item?: {
    id: string;
    purchase_order_id: string;
    product_id?: string;
    model?: string;
    quantity: number;
    unit_price: number;
  };
  unit_links?: UnitDeliveryLink[];
  delivery_units?: DeliveryItemUnit[];
}

export interface DeliveryItemUnitWithDetails extends DeliveryItemUnit {
  delivery_item?: {
    id: string;
    delivery_id: string;
    product_id?: string;
    quantity_delivered: number;
  };
  unit_links?: UnitDeliveryLink[];
  purchase_order_units?: PurchaseOrderItemUnit[];
}

export interface UnitDeliveryLinkWithDetails extends UnitDeliveryLink {
  purchase_order_unit?: PurchaseOrderItemUnitWithDetails;
  delivery_unit?: DeliveryItemUnitWithDetails;
}

// Create/Update types
export interface CreatePurchaseOrderItemUnitData {
  purchase_order_item_id: string;
  unit_number: number;
  serial_number?: string;
  batch_number?: string;
  unit_status?: PurchaseOrderItemUnit['unit_status'];
  notes?: string;
}

export interface UpdatePurchaseOrderItemUnitData {
  id: string;
  serial_number?: string;
  batch_number?: string;
  unit_status?: PurchaseOrderItemUnit['unit_status'];
  notes?: string;
}

export interface CreateDeliveryItemUnitData {
  delivery_item_id: string;
  unit_number: number;
  serial_number?: string;
  batch_number?: string;
  unit_status?: DeliveryItemUnit['unit_status'];
  condition_notes?: string;
}

export interface UpdateDeliveryItemUnitData {
  id: string;
  serial_number?: string;
  batch_number?: string;
  unit_status?: DeliveryItemUnit['unit_status'];
  condition_notes?: string;
}

export interface CreateUnitDeliveryLinkData {
  purchase_order_unit_id: string;
  delivery_unit_id: string;
  link_status?: UnitDeliveryLink['link_status'];
  notes?: string;
}

export interface UpdateUnitDeliveryLinkData {
  id: string;
  link_status?: UnitDeliveryLink['link_status'];
  confirmed_at?: string;
  confirmed_by?: string;
  notes?: string;
}

// Bulk operations
export interface BulkCreateUnitLinksData {
  links: CreateUnitDeliveryLinkData[];
  notes?: string;
}

// Unit linking validation
export interface UnitLinkingValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  po_unit_available: boolean;
  delivery_unit_available: boolean;
  serial_match: boolean;
  batch_match: boolean;
  product_match: boolean;
}

// Unit tracking statistics
export interface UnitTrackingStats {
  total_po_units: number;
  total_delivery_units: number;
  linked_units: number;
  unlinked_po_units: number;
  unlinked_delivery_units: number;
  confirmed_links: number;
  disputed_links: number;
  units_by_status: Record<string, number>;
}

// Unit search and filter criteria
export interface UnitSearchCriteria {
  purchase_order_id?: string;
  delivery_id?: string;
  product_id?: string;
  serial_number?: string;
  batch_number?: string;
  unit_status?: string[];
  link_status?: string[];
  date_range?: {
    start: string;
    end: string;
  };
}

// Unit reconciliation report
export interface UnitReconciliationReport {
  purchase_order_id: string;
  delivery_id?: string;
  total_ordered: number;
  total_delivered: number;
  total_linked: number;
  unmatched_po_units: PurchaseOrderItemUnitWithDetails[];
  unmatched_delivery_units: DeliveryItemUnitWithDetails[];
  mismatched_serials: UnitDeliveryLinkWithDetails[];
  status_summary: Record<string, number>;
  completion_percentage: number;
}