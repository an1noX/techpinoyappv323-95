
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HeaderSetting {
  id: string;
  setting_name: string;
  setting_value: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useHeaderSettings = () => {
  const [settings, setSettings] = useState<HeaderSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('header_settings')
        .select('*')
        .eq('is_active', true)
        .order('setting_name', { ascending: true });

      if (error) throw error;
      
      console.log('Header settings fetched:', data);
      setSettings(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching header settings:', err);
      setError('Failed to load header settings');
    } finally {
      setIsLoading(false);
    }
  };

  const getSetting = (settingName: string) => {
    const setting = settings.find(s => s.setting_name === settingName);
    const value = setting?.setting_value || {};
    console.log(`Header getSetting for ${settingName}:`, value);
    return value;
  };

  const updateSetting = async (settingName: string, newValue: any) => {
    try {
      console.log(`Updating header setting ${settingName} with:`, newValue);
      
      // First, try to update existing setting
      const { error: updateError } = await supabase
        .from('header_settings')
        .update({ 
          setting_value: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('setting_name', settingName);

      // If update fails (no rows updated), insert new setting
      if (updateError || settings.find(s => s.setting_name === settingName) === undefined) {
        console.log(`Setting ${settingName} doesn't exist, creating new one`);
        const { error: insertError } = await supabase
          .from('header_settings')
          .insert({
            setting_name: settingName,
            setting_value: newValue,
            is_active: true
          });
        
        if (insertError) throw insertError;
      }
      
      // Update local state immediately to reflect the change in UI
      setSettings(prev => {
        const existingIndex = prev.findIndex(setting => setting.setting_name === settingName);
        if (existingIndex >= 0) {
          // Update existing
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], setting_value: newValue };
          return updated;
        } else {
          // Add new
          return [...prev, {
            id: crypto.randomUUID(),
            setting_name: settingName,
            setting_value: newValue,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }];
        }
      });
      
      console.log(`Header setting ${settingName} updated successfully in local state`);
      return { success: true };
    } catch (err) {
      console.error('Error updating header setting:', err);
      return { success: false, error: err };
    }
  };

  return {
    settings,
    isLoading,
    error,
    getSetting,
    updateSetting,
    refetch: fetchSettings
  };
};
