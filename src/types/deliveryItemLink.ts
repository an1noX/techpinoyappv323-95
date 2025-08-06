export interface DeliveryItemLink {
  id: string;
  delivery_item_id: string;
  purchase_order_item_id: string;
  linked_quantity: number;
  created_at: string;
  updated_at: string;
  delivery_item?: any;
  purchase_order_item?: any;
}

export interface CreateDeliveryItemLinkData {
  delivery_item_id: string;
  purchase_order_item_id: string;
  linked_quantity: number;
}

export interface DeliveryItemWithLinks {
  id: string;
  delivery_id: string;
  product_id?: string;
  quantity_delivered: number;
  created_at: string;
  product?: any;
  links?: DeliveryItemLink[];
  available_quantity?: number; // quantity_delivered - sum of linked quantities
  is_fully_linked?: boolean;
}

export interface PurchaseOrderItemWithLinks {
  id: string;
  purchase_order_id: string;
  product_id?: string;
  model?: string;
  quantity: number;
  unit_price: number;
  total_price?: number;
  created_at: string;
  links?: DeliveryItemLink[];
  linked_quantity?: number; // sum of linked quantities
  remaining_quantity?: number; // quantity - linked_quantity
  is_fully_linked?: boolean;
}