import { supabase } from '@/integrations/supabase/client';

export const migrationService = {
  async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .limit(1);
      
      return !error || error.code !== '42P01';
    } catch (error) {
      return false;
    }
  },

  async runUnitTrackingMigration(): Promise<{ success: boolean; message: string }> {
    try {
      // Check if tables exist
      const tablesExist = await Promise.all([
        this.checkTableExists('purchase_order_item_units'),
        this.checkTableExists('delivery_item_units'),
        this.checkTableExists('unit_delivery_links')
      ]);

      if (!tablesExist.every(exists => exists)) {
        return {
          success: false,
          message: 'Unit tracking tables do not exist. Please run the SQL migration scripts manually.'
        };
      }

      // Check if data has been populated
      const { data: poUnits } = await supabase
        .from('purchase_order_item_units' as any)
        .select('id')
        .limit(1);

      const { data: deliveryUnits } = await supabase
        .from('delivery_item_units' as any)
        .select('id')
        .limit(1);

      if (!poUnits?.length || !deliveryUnits?.length) {
        return {
          success: false,
          message: 'Unit tracking tables exist but are not populated. Please run the data population script.'
        };
      }

      return {
        success: true,
        message: 'Unit tracking system is properly deployed and populated.'
      };
    } catch (error) {
      return {
        success: false,
        message: `Migration check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};