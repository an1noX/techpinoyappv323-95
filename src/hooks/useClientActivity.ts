
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClientActivity {
  id: string;
  activity_type: string;
  description: string;
  metadata?: any;
  performed_at: string;
  performed_by?: string;
}

export interface ClientComment {
  id: string;
  comment: string;
  is_internal: boolean;
  priority: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const useClientActivity = (clientId: string) => {
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [comments, setComments] = useState<ClientComment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActivities = async () => {
    if (!clientId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_activity_log')
        .select('*')
        .eq('client_id', clientId)
        .order('performed_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!clientId) return;
    
    try {
      const { data, error } = await supabase
        .from('client_comments')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const addComment = async (comment: string, priority: string = 'normal', isInternal: boolean = true) => {
    try {
      const { error } = await supabase
        .from('client_comments')
        .insert([{
          client_id: clientId,
          comment,
          priority,
          is_internal: isInternal
        }]);
      
      if (error) throw error;
      await fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchActivities();
      fetchComments();
    }
  }, [clientId]);

  return {
    activities,
    comments,
    loading,
    addComment,
    refetchActivities: fetchActivities,
    refetchComments: fetchComments
  };
};
