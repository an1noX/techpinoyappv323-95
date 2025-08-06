import { supabase } from '@/integrations/supabase/client';

export const databaseSetupService = {
  async fixDeliveryPermissions() {
    console.log('🔧 Attempting to fix delivery table permissions...');
    
    try {
      // Try to temporarily disable RLS and create permissive policies
      // We'll use raw SQL execution if available
      const sqlCommands = [
        'ALTER TABLE public.deliveries DISABLE ROW LEVEL SECURITY;',
        'ALTER TABLE public.delivery_items DISABLE ROW LEVEL SECURITY;',
        'ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;',
        'ALTER TABLE public.delivery_items ENABLE ROW LEVEL SECURITY;',
        'DROP POLICY IF EXISTS "allow_all_deliveries" ON public.deliveries;',
        'DROP POLICY IF EXISTS "allow_all_delivery_items" ON public.delivery_items;',
        'CREATE POLICY "allow_all_deliveries" ON public.deliveries FOR ALL USING (true) WITH CHECK (true);',
        'CREATE POLICY "allow_all_delivery_items" ON public.delivery_items FOR ALL USING (true) WITH CHECK (true);',
      ];

      console.log('Attempting SQL commands to fix permissions...');
      
      // Try each command individually to see which ones work
      for (const command of sqlCommands) {
        try {
          console.log('Executing:', command);
          // Since we can't use rpc('sql'), we'll need to use the admin panel or manual approach
          console.log('⚠️ SQL command logged for manual execution');
        } catch (error) {
          console.warn('Command failed:', command, error);
        }
      }
      
      return { 
        success: false, 
        message: 'Please run the SQL commands manually in Supabase dashboard',
        commands: sqlCommands
      };
    } catch (error) {
      console.error('Database setup failed:', error);
      return { success: false, error };
    }
  },

  // Alternative approach: create a service account or bypass RLS
  async testDirectTableAccess() {
    console.log('🧪 Testing direct table access patterns...');
    
    try {
      // Test if we can create a minimal record
      const testData = {
        delivery_date: new Date().toISOString().split('T')[0],
        delivery_receipt_number: 'TEST-' + Date.now(),
        notes: 'Test delivery record'
      };

      console.log('Attempting direct insert:', testData);
      
      const { data, error } = await supabase
        .from('deliveries')
        .insert(testData)
        .select()
        .single();

      if (error) {
        console.error('Direct insert failed:', error);
        return { success: false, error };
      }

      console.log('Direct insert succeeded:', data);
      
      // Clean up test record
      await supabase.from('deliveries').delete().eq('id', data.id);
      
      return { success: true, data };
    } catch (error) {
      console.error('Direct access test failed:', error);
      return { success: false, error };
    }
  }
};