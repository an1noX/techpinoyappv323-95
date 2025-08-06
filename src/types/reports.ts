export interface Report {
  id: string;
  user_id: string;
  category: 'bugs' | 'feature_request';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface CreateReportData {
  category: 'bugs' | 'feature_request';
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
}