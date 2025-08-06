import { supabase } from '@/integrations/supabase/client';
import { Report, CreateReportData } from '@/types/reports';

export const reportService = {
  async createReport(reportData: CreateReportData): Promise<Report> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to submit a report');
    }

    const { data, error } = await supabase
      .from('reports' as any)
      .insert({
        user_id: user.id,
        category: reportData.category,
        title: reportData.title,
        description: reportData.description,
        priority: reportData.priority || 'medium'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating report:', error);
      throw error;
    }

    return data as unknown as Report;
  },

  async getUserReports(): Promise<Report[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to view reports');
    }

    const { data, error } = await supabase
      .from('reports' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }

    return (data || []) as unknown as Report[];
  }
};