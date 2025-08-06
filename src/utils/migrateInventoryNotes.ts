import { supabase } from '@/integrations/supabase/client';

export const migrateInventoryPurchaseNotes = async () => {
  try {
    console.log('Starting migration of inventory purchase notes...');
    
    // Find all inventory purchases with the old text
    const { data: purchases, error: fetchError } = await supabase
      .from('inventory_purchases')
      .select('id, notes')
      .like('notes', '%Inventory purchase created from budget optimization%');
    
    if (fetchError) {
      console.error('Error fetching inventory purchases:', fetchError);
      return { success: false, error: fetchError.message };
    }
    
    if (!purchases || purchases.length === 0) {
      console.log('No records found with old text');
      return { success: true, updated: 0 };
    }
    
    console.log(`Found ${purchases.length} records to update`);
    
    // Update each record
    const updates = purchases.map(async (purchase) => {
      if (!purchase.notes) return null;
      
      const updatedNotes = purchase.notes.replace(
        /Inventory purchase created from budget optimization for PO #/g,
        'Inventory purchase budget for PO #'
      );
      
      const { error: updateError } = await supabase
        .from('inventory_purchases')
        .update({ notes: updatedNotes })
        .eq('id', purchase.id);
      
      if (updateError) {
        console.error(`Error updating purchase ${purchase.id}:`, updateError);
        return { id: purchase.id, error: updateError.message };
      }
      
      return { id: purchase.id, success: true };
    });
    
    const results = await Promise.all(updates);
    const successful = results.filter(r => r?.success).length;
    const failed = results.filter(r => r?.error).length;
    
    console.log(`Migration completed: ${successful} updated, ${failed} failed`);
    
    return {
      success: true,
      updated: successful,
      failed: failed,
      results: results.filter(Boolean)
    };
    
  } catch (error) {
    console.error('Migration error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};