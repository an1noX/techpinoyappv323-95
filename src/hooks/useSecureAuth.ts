import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SecurityUtils } from '@/utils/securityUtils';

interface SecureAuthState {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: string | null;
  sessionValid: boolean;
  lastValidation: Date | null;
}

interface SecureAuthActions {
  validateSession: () => Promise<boolean>;
  logout: () => Promise<void>;
  checkPermission: (requiredRole: string) => boolean;
}

export function useSecureAuth(): SecureAuthState & SecureAuthActions {
  const [state, setState] = useState<SecureAuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    role: null,
    sessionValid: false,
    lastValidation: null
  });

  // Enhanced session validation with security checks
  const validateSession = async (): Promise<boolean> => {
    try {
      const validation = await SecurityUtils.validateSession();
      
      if (!validation.valid) {
        setState(prev => ({
          ...prev,
          user: null,
          isAuthenticated: false,
          role: null,
          sessionValid: false,
          lastValidation: new Date()
        }));
        return false;
      }

      // Get user profile for role information
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', validation.user.id)
        .single();

      if (profileError) {
        SecurityUtils.logSecurityEvent('PROFILE_FETCH_ERROR', {
          userId: validation.user.id,
          error: profileError.message
        });
      }

      setState(prev => ({
        ...prev,
        user: validation.user,
        isAuthenticated: true,
        role: profile?.role || null,
        sessionValid: true,
        lastValidation: new Date(),
        isLoading: false
      }));

      return true;
    } catch (error) {
      SecurityUtils.logSecurityEvent('SESSION_VALIDATION_EXCEPTION', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        role: null,
        sessionValid: false,
        lastValidation: new Date(),
        isLoading: false
      }));
      
      return false;
    }
  };

  // Secure logout with cleanup
  const logout = async (): Promise<void> => {
    try {
      // Clear any cached data
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        role: null,
        sessionValid: false,
        lastValidation: new Date()
      });

      SecurityUtils.logSecurityEvent('USER_LOGOUT', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      SecurityUtils.logSecurityEvent('LOGOUT_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Check if user has required permission level
  const checkPermission = (requiredRole: string): boolean => {
    if (!state.isAuthenticated || !state.role) {
      return false;
    }

    const roleHierarchy: Record<string, number> = {
      'user': 1,
      'technician': 2,
      'sales_admin': 3,
      'admin': 4,
      'superadmin': 5
    };

    const userLevel = roleHierarchy[state.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 999;

    return userLevel >= requiredLevel;
  };

  // Initialize auth state and set up listeners
  useEffect(() => {
    let mounted = true;

    // Initial session check
    validateSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            role: null,
            sessionValid: false,
            lastValidation: new Date()
          });
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await validateSession();
        }
      }
    );

    // Periodic session validation (every 5 minutes)
    const validationInterval = setInterval(() => {
      if (state.isAuthenticated) {
        validateSession();
      }
    }, 5 * 60 * 1000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearInterval(validationInterval);
    };
  }, []);

  return {
    ...state,
    validateSession,
    logout,
    checkPermission
  };
}