export interface Client {
  id: string;
  name: string;
  contact_email?: string;
  phone?: string;
  notes?: string;
  department_count?: number;
  location_count?: number;
  printer_count?: number;
  address?: string;
  contact_person?: string;
  client_code?: string;
  tags?: string[];
  status?: string;
  timezone?: string;
  archived_at?: string;
  tax?: string;
  wht?: string;
  created_at: string;
  updated_at: string;
}

export interface Printer {
  id: string;
  name: string;
  model?: string | null;
  sku?: string;
  colors?: string[];
  color?: string | null;
  manufacturer?: string | null;
  series?: string | null;
  is_available?: boolean;
  rental_eligible?: boolean;
  status?: string | null;
  rental_price_per_month?: number | null;
  rental_price_per_print?: number | null;
  rental_price_type?: string | null;
  purchase_price?: number | null;
  printer_type?: string | null;
  release_year?: string | null;
  functions?: string | null;
  description?: string | null;
  aliases?: string | null;
  resolution?: string | null;
  print_speed?: string | null;
  print_resolution?: string | null;
  print_speed_bw?: string | null;
  print_speed_color?: string | null;
  first_page_out_time?: string | null;
  processor?: string | null;
  ram?: string | null;
  dimensions?: string | null;
  weight?: string | null;
  duplex_printing?: boolean | null;
  automatic_duplex?: boolean | null;
  adf?: boolean | null;
  paper_sizes?: string | null;
  paper_types?: string | null;
  input_capacity?: string | null;
  input_tray_capacity?: string | null;
  output_tray_capacity?: string | null;
  supported_paper_sizes?: string | null;
  supported_paper_types?: string | null;
  connectivity_wired?: string | null;
  connectivity_wireless?: string | null;
  connectivity_usb?: boolean | null;
  connectivity_wifi?: boolean | null;
  connectivity_wifi_direct?: boolean | null;
  connectivity_ethernet?: boolean | null;
  connectivity_bluetooth?: boolean | null;
  connectivity_nfc?: boolean | null;
  network_printing?: boolean | null;
  cloud_printing_support?: string | null;
  compatible_cartridges?: string | null;
  page_yield?: string | null;
  drivers_url?: string | null;
  driver_download_url?: string | null;
  software_download_url?: string | null;
  manual_url?: string | null;
  user_manual_url?: string | null;
  setup_guide_url?: string | null;
  troubleshooting_url?: string | null;
  supported_os?: string | null;
  image_url?: string | null;
  rental_status?: string | null;
  rental_start_date?: string | null;
  rental_end_date?: string | null;
  location_count?: number | null;
  printer_assignments?: PrinterAssignment[];
  created_at: string;
  updated_at: string;
}

export interface PrinterAssignment {
  id: string;
  printer_id: string;
  client_id: string | null;
  serial_number: string;
  status: "active" | "inactive" | "returned";
  usage_type: "rental" | "service_unit" | "client_owned";
  deployment_date: string | null;
  department_location_id: string | null;
  monthly_price?: number;
  has_security_deposit?: boolean;
  security_deposit_amount?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  department?: string;
  printer?: Printer;
  client?: Client;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  colors?: string[];
  color?: string;
  category: string;
  alias?: string;
  aliases?: string;
  description?: string;
  printers?: Printer[] | string;
  created_at: string;
  updated_at: string;
}

export interface ProductPrinter {
  id: string;
  product_id: string;
  printer_id: string;
  product?: Product;
  printer?: Printer;
  created_at: string;
  updated_at: string;
}

export interface ProductWithPricing extends Product {
  suppliers?: any;
  clients?: ProductClient[];
}

export interface ProductWithClientPrice extends Product {
  clientPrice?: any;
}

export interface PrinterWithProducts extends Printer {
  products?: Product[];
}

export interface ProductClient {
  id: string;
  product_id: string;
  client_id: string;
  price?: number;
  quoted_price?: number;
  margin_percentage?: number;
  created_at: string;
  updated_at: string;
  product?: Product;
  client?: Client;
}

export interface ClientPriceHistory {
  id: string;
  client_id: string;
  product_id: string;
  price: number;
  effective_date: string;
  created_at: string;
  updated_at: string;
}

export interface ProductWithSuppliers extends Product {
  suppliers?: any;
  printers?: Printer[];
}

export interface ProductSupplier {
  id: string;
  product_id: string;
  supplier_id: string;
  current_price: number;
  created_at: string;
  updated_at: string;
  product?: Product;
  supplier?: Supplier;
}

export interface Supplier {
  id: string;
  name: string;
  contact_email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DepartmentLocation {
  id: string;
  name: string;
  client_id: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  table_name: string;
  operation: string;
  old_data?: any;
  new_data?: any;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  alert_type: string;
  title: string;
  description: string;
  severity: string;
  client_id?: string;
  printer_id?: string;
  acknowledged_at?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface AssetBarcode {
  id: string;
  printer_assignment_id: string;
  barcode: string;
  created_at: string;
  updated_at: string;
}

// Additional types for consistency
export interface ClientCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  position?: string;
  created_at: string;
  updated_at: string;
}

// Legacy type aliases for backward compatibility
export interface PriceHistory {
  id: string;
  price: number;
  effective_date: string;
  created_at: string;
  updated_at: string;
}

export interface ProductWithClients extends Product {
  clients?: ProductClient[];
}

export interface DeletedPrinter {
  id: string;
  printer_id: string;
  deleted_by?: string;
  reason?: string;
  created_at: string;
  printer?: Printer;
}

export interface ClientAccess {
  id: string;
  user_id: string;
  client_id: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  client?: Client;
}

export interface DeliveryItemLink {
  id: string;
  delivery_item_id: string;
  purchase_order_item_id: string;
  linked_quantity: number;
  created_at: string;
  updated_at: string;
  delivery_item?: DeliveryItem;
  purchase_order_item?: PurchaseOrderItem;
}

// Sales page related tables from schema
export interface Delivery {
  id: string;
  purchase_order_id?: string;
  client_id?: string;
  delivery_date: string;
  delivery_receipt_number?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  purchase_order?: PurchaseOrder;
  client?: Client;
  delivery_items?: DeliveryItem[];
}

export interface DeliveryItem {
  id: string;
  delivery_id: string;
  product_id?: string;
  quantity_delivered: number;
  created_at: string;
  updated_at?: string;
  delivery?: Delivery;
  product?: Product;
}

export interface PaymentTerms {
  id: string;
  name: string;
  description?: string;
  days_due: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  supplier_client_id?: string;
  client_id?: string;
  supplier_name?: string;
  status?: string;
  payment_status?: string;
  notes?: string;
  purchase_order_number?: string;
  client_po?: string;
  sale_invoice_number?: string;
  payment_terms_id?: string;
  created_at: string;
  updated_at: string;
  client?: Client;
  supplier_client?: Client;
  purchase_order_items?: PurchaseOrderItem[];
  purchase_order_payments?: PurchaseOrderPayment[];
  deliveries?: Delivery[];
  payment_terms?: PaymentTerms;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id?: string;
  model?: string;
  quantity: number;
  unit_price: number;
  total_price?: number;
  created_at: string;
  updated_at?: string;
  purchase_order?: PurchaseOrder;
  product?: Product;
}

export interface PurchaseOrderPayment {
  id: string;
  purchase_order_id?: string;
  payment_reference?: string;
  payment_date: string;
  total_amount: number;
  method?: string;
  notes?: any;
  created_at: string;
  updated_at: string;
  purchase_order?: PurchaseOrder;
}

export interface ProductSet {
  id: string;
  name: string;
  description?: string;
  sku: string;
  created_at: string;
  updated_at: string;
}

export interface ProductSetItem {
  id: string;
  product_set_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: Product;
}
