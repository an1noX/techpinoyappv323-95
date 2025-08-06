import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type UserProfile = Database['public']['Tables']['profiles']['Row'];

export const userService = {
  async getUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async updateUserEmail(userId: string, email: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ email })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
}; 