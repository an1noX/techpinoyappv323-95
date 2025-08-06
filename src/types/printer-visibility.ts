
import { Printer as PrinterType } from '@/types/database';

export interface PrinterVisibility {
  id: string;
  printer_id: string;
  client_id: string;
  created_at: string;
  updated_at: string;
}

export interface PrinterWithVisibility extends PrinterType {
  visible_to_clients?: Array<{
    id: string;
    name: string;
  }>;
}
