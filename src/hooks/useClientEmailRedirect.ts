import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useClientAccessRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Query to find client_access by user's id
  const { data: clientAccessRows, isLoading, error } = useQuery({
    queryKey: ['client-access-redirect', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('client_access' as any)
        .select('client_id')
        .eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const redirectToClientIfMatched = () => {
    if (clientAccessRows && clientAccessRows.length > 0 && !isLoading) {
      // Redirect to the first client_id found
      const clientId = (clientAccessRows[0] as any).client_id;
      console.log('🔄 Redirecting to client page:', `/clients/${clientId}`);
      navigate(`/clients/${clientId}`, { replace: true });
      return true;
    }
    console.log('⏭️ No client_access match found, proceeding with default redirect');
    return false;
  };

  return {
    clientAccessRows,
    isLoading,
    error,
    redirectToClientIfMatched,
  };
};

// Rename export to match usage in ProtectedRoute and Auth
export const useClientEmailRedirect = useClientAccessRedirect;
