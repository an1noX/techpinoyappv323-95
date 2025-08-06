
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PageViewCounts {
  total_views: number;
  organic_views: number;
  bot_views: number;
  tracked?: boolean;
  reason?: string;
}

export const usePageViews = () => {
  const [totalViews, setTotalViews] = useState<number>(0);
  const [organicViews, setOrganicViews] = useState<number>(0);
  const [botViews, setBotViews] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  // Use useRef to persist timeout reference across renders
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Simple bot detection function
  const detectBot = (): boolean => {
    if (typeof window === 'undefined') return true;
    
    const userAgent = navigator.userAgent.toLowerCase();
    const botPatterns = [
      'bot', 'crawler', 'spider', 'crawling', 'facebook', 'google',
      'baidu', 'bing', 'msn', 'duckduckgo', 'yandex', 'yahoo',
      'slurp', 'whatsapp', 'telegram', 'twitter', 'linkedin'
    ];
    
    return botPatterns.some(pattern => userAgent.includes(pattern));
  };

  // Get client IP address
  const getClientIP = async (): Promise<string | null> => {
    try {
      // Try to get IP from a public service
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || null;
    } catch (error) {
      console.warn('Could not fetch IP address:', error);
      return null;
    }
  };

  // Properly debounced function to increment page view
  const incrementPageView = useCallback(
    async (pagePath: string) => {
      // Clear existing timeout to prevent multiple rapid calls
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout for debouncing
      timeoutRef.current = setTimeout(async () => {
        try {
          const isBot = detectBot();
          const clientIP = await getClientIP();
          
          const { data, error } = await supabase.rpc('increment_page_view', {
            path: pagePath,
            is_bot: isBot,
            client_ip: clientIP
          });

          if (error) {
            console.error('Error incrementing page view:', error);
            return null;
          }
          
          // Update local state with new counts - safely cast the data
          if (data && typeof data === 'object' && data !== null && !Array.isArray(data)) {
            const counts = data as unknown as PageViewCounts;
            
            // Only update counts if tracking was successful
            if (counts.tracked !== false) {
              setTotalViews(counts.total_views || 0);
              setOrganicViews(counts.organic_views || 0);
              setBotViews(counts.bot_views || 0);
            }
            
            // Log tracking status for debugging
            console.log('Page view tracking:', {
              path: pagePath,
              tracked: counts.tracked,
              reason: counts.reason,
              counts: {
                total: counts.total_views,
                organic: counts.organic_views,
                bot: counts.bot_views
              }
            });
          }
          
          return data;
        } catch (error) {
          console.error('Error in incrementPageView:', error);
          return null;
        }
      }, 1000); // Increased debounce delay to 1 second
    },
    []
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Function to get total page views across all pages
  const getTotalPageViews = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_total_page_views');

      if (error) {
        console.error('Error fetching total page views:', error);
        return { total_views: 0, organic_views: 0, bot_views: 0 };
      }
      
      // Update local state with new counts - safely cast the data
      if (data && typeof data === 'object' && data !== null && !Array.isArray(data)) {
        const counts = data as unknown as PageViewCounts;
        setTotalViews(counts.total_views || 0);
        setOrganicViews(counts.organic_views || 0);
        setBotViews(counts.bot_views || 0);
      }
      
      return data || { total_views: 0, organic_views: 0, bot_views: 0 };
    } catch (error) {
      console.error('Error in getTotalPageViews:', error);
      return { total_views: 0, organic_views: 0, bot_views: 0 };
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch total views on hook initialization
  useEffect(() => {
    getTotalPageViews();
  }, []);

  return {
    totalViews,
    organicViews,
    botViews,
    loading,
    incrementPageView,
    getTotalPageViews,
    refreshTotalViews: getTotalPageViews
  };
};
