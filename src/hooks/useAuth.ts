
import { useAuth as useSupabaseAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SecurityUtils } from '@/utils/securityUtils';

export const useAuth = () => {
  const auth = useSupabaseAuth();
  
  // User profile query
  const { data: userProfile, isLoading: userProfileLoading } = useQuery({
    queryKey: ['userProfile', auth.user?.id],
    queryFn: async () => {
      if (!auth.user?.id) return null;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', auth.user.id)
          .single();
        
        if (error) {
          console.error('Error fetching user profile:', error);
          return null;
        }
        
        return data;
      } catch (err) {
        console.error('Network error fetching profile:', err);
        return null;
      }
    },
    enabled: !!auth.user?.id,
    retry: 3,
    retryDelay: 1000,
  });

  // Check if user is superadmin with enhanced security
  const { data: isSuperadmin, isLoading: isSuperadminLoading } = useQuery({
    queryKey: ['isSuperadmin', auth.user?.id],
    queryFn: async () => {
      if (!auth.user?.id) return false;
      
      try {
        // Validate session first
        const sessionValidation = await SecurityUtils.validateSession();
        if (!sessionValidation.valid) {
          SecurityUtils.logSecurityEvent('INVALID_SESSION_SUPERADMIN_CHECK', {
            error: sessionValidation.error
          });
          return false;
        }

        // Check profiles table for superadmin role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', auth.user.id)
          .single();
        
        if (profileError) {
          SecurityUtils.logSecurityEvent('SUPERADMIN_CHECK_ERROR', {
            error: profileError.message,
            userId: auth.user.id
          });
          return false;
        }
        
        const isSuperadmin = (profileData?.role as string) === 'superadmin';
        
        // Log superadmin access for audit purposes
        if (isSuperadmin) {
          SecurityUtils.logSecurityEvent('SUPERADMIN_ACCESS', {
            userId: auth.user.id
          });
        }
        
        return isSuperadmin;
      } catch (err) {
        SecurityUtils.logSecurityEvent('SUPERADMIN_CHECK_EXCEPTION', {
          error: err instanceof Error ? err.message : 'Unknown error',
          userId: auth.user?.id
        });
        return false;
      }
    },
    enabled: !!auth.user?.id,
    retry: 1, // Reduced retry attempts for security
    retryDelay: 2000,
  });

  // Check user roles from user_roles table
  const { data: userRoles, isLoading: userRolesLoading } = useQuery({
    queryKey: ['userRoles', auth.user?.id],
    queryFn: async () => {
      if (!auth.user?.id) return [];
      
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', auth.user.id);
        
        if (error) {
          console.error('Error fetching user roles:', error);
          return [];
        }
        
        return data?.map(r => r.role) || [];
      } catch (err) {
        console.error('Network error fetching roles:', err);
        return [];
      }
    },
    enabled: !!auth.user?.id,
    retry: 3,
    retryDelay: 1000,
  });
  
  return { 
    ...auth, 
    userProfile, 
    userProfileLoading: userProfileLoading || isSuperadminLoading || userRolesLoading,
    isSuperadmin: isSuperadmin || false,
    userRoles: userRoles || []
  };
};
