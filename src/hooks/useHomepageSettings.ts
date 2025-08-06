
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HomepageSection {
  id: string;
  section_name: string;
  is_visible: boolean;
  display_order: number;
  section_config: any;
}

export const useHomepageSettings = () => {
  const [settings, setSettings] = useState<HomepageSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('homepage_settings')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      console.log('Homepage settings fetched:', data); // Debug log
      setSettings(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching homepage settings:', err);
      setError('Failed to load homepage settings');
    } finally {
      setIsLoading(false);
    }
  };

  const getSectionConfig = (sectionName: string) => {
    const section = settings.find(s => s.section_name === sectionName);
    console.log(`Getting config for ${sectionName}:`, section?.section_config); // Debug log
    return section?.section_config || {};
  };

  const isSectionVisible = (sectionName: string) => {
    const section = settings.find(s => s.section_name === sectionName);
    const isVisible = section?.is_visible ?? true;
    console.log(`Section ${sectionName} visibility:`, isVisible); // Debug log
    return isVisible;
  };

  return {
    settings,
    isLoading,
    error,
    getSectionConfig,
    isSectionVisible,
    refetch: fetchSettings
  };
};
