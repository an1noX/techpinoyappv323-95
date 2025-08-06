// Database type overrides for self-hosted Supabase instance
// These override the auto-generated types to match actual database schema

import { Database } from '../integrations/supabase/types';

// Override the deliveries table to include client_id
export interface DeliveryTableOverride {
  Row: Database['public']['Tables']['deliveries']['Row'] & {
    client_id?: string;
  };
  Insert: Database['public']['Tables']['deliveries']['Insert'] & {
    client_id?: string;
  };
  Update: Database['public']['Tables']['deliveries']['Update'] & {
    client_id?: string;
  };
}

// Extended Database type with overrides
export interface DatabaseWithOverrides extends Omit<Database, 'public'> {
  public: Omit<Database['public'], 'Tables'> & {
    Tables: Omit<Database['public']['Tables'], 'deliveries'> & {
      deliveries: DeliveryTableOverride;
    };
  };
}