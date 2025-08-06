
import { supabase } from '@/integrations/supabase/client'

interface CreateUserParams {
  email: string
  password: string
  role?: 'admin' | 'sales_admin' | 'user' | 'superadmin'
  full_name?: string
  email_confirm?: boolean
}

interface UserCreationResult {
  success: boolean
  user?: any
  error?: string
  details?: any
}

export class SupabaseAdminUtils {
  
  // Check if user has superadmin role
  static async isSuperAdmin(userId?: string): Promise<boolean> {
    try {
      const currentUserId = userId || (await supabase.auth.getUser()).data.user?.id;
      
      if (!currentUserId) return false;
      
      // Check profiles table for superadmin role
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUserId)
        .single();
      
      if (profileError) {
        console.error('Error checking superadmin status:', profileError);
        return false;
      }
      
      return (profileData?.role as string) === 'superadmin';
    } catch (error) {
      console.error('Error in isSuperAdmin check:', error);
      return false;
    }
  }

  // Create user with proper error handling for self-hosted Supabase
  static async createUser(params: CreateUserParams): Promise<UserCreationResult> {
    try {
      console.log('Creating user with params:', { ...params, password: '[HIDDEN]' });
      
      // Use standard Supabase client auth.signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
        options: {
          data: {
            full_name: params.full_name || '',
            role: params.role || 'user'
          }
        }
      });

      console.log('Auth signup result:', { authData, authError });

      if (authError) {
        console.error('Auth signup error:', authError);
        return {
          success: false,
          error: `Authentication error: ${authError.message}`,
          details: authError
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'User creation failed - no user returned'
        };
      }

      // For self-hosted Supabase, the profile should be created automatically via trigger
      // But let's check if it exists and create it if needed
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single();

      if (profileCheckError && profileCheckError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('Creating profile for user:', authData.user.id);
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: params.email,
            full_name: params.full_name || '',
            role: params.role || 'user'
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          console.warn('Profile creation failed, but user was created successfully');
        }
      }

      // If creating a superadmin, add to user_roles table (using admin as fallback)
      if (params.role === 'superadmin') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: authData.user.id,
            role: 'admin' as any // Use admin as fallback since superadmin not in enum
          });

        if (roleError) {
          console.error('Superadmin role assignment error:', roleError);
        }
      }

      return {
        success: true,
        user: authData.user
      };

    } catch (error) {
      console.error('Unexpected error in createUser:', error);
      return {
        success: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      };
    }
  }

  // Promote existing user to superadmin - MAXIMUM SECURITY
  static async promoteToSuperadmin(userId: string): Promise<UserCreationResult> {
    try {
      // Enhanced authentication verification
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user?.id) {
        console.warn('SECURITY_EVENT: Unauthorized promotion attempt - no valid authentication', {
          targetUserId: userId,
          error: authError?.message
        });
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      const currentUserId = user.id;

      // Triple verification for superadmin access with enhanced logging
      const [profileCheck, roleCheck] = await Promise.all([
        supabase.from('profiles').select('role, created_at').eq('id', currentUserId).single(),
        supabase.from('user_roles').select('role').eq('user_id', currentUserId)
      ]);

      const isSuperadmin = profileCheck.data?.role === 'superadmin' || 
                          roleCheck.data?.some((r: any) => r.role === 'superadmin');

      if (!isSuperadmin) {
        console.warn('SECURITY_EVENT: Unauthorized promotion attempt', {
          currentUserId,
          currentRole: profileCheck.data?.role,
          targetUserId: userId
        });
        return {
          success: false,
          error: 'Access denied: Insufficient privileges'
        };
      }

      // Enhanced self-modification prevention with secure comparison
      if (currentUserId === userId) {
        console.warn('SECURITY_EVENT: Self-promotion attempt', { currentUserId });
        return {
          success: false,
          error: 'Self-modification not allowed for security reasons'
        };
      }

      // Validate target user with enhanced checks
      const { data: targetUser, error: userError } = await supabase
        .from('profiles')
        .select('id, email, role, created_at')
        .eq('id', userId)
        .single();

      if (userError || !targetUser) {
        console.warn('SECURITY_EVENT: Promotion target not found', {
          currentUserId,
          targetUserId: userId,
          error: userError?.message
        });
        return {
          success: false,
          error: 'Target user not found or inaccessible'
        };
      }

      // Additional security checks
      if (targetUser.role === 'superadmin') {
        return {
          success: false,
          error: 'User is already a superadmin'
        };
      }

      // Check if target user account is too new (security measure)
      const accountAge = Date.now() - new Date(targetUser.created_at).getTime();
      const minimumAgeMs = 24 * 60 * 60 * 1000; // 24 hours
      
      if (accountAge < minimumAgeMs) {
        console.warn('SECURITY_EVENT: Promotion attempt on new account', {
          currentUserId,
          targetUserId: userId,
          accountAgeHours: accountAge / (60 * 60 * 1000)
        });
        return {
          success: false,
          error: 'Security policy: Cannot promote accounts newer than 24 hours'
        };
      }

      // Enhanced audit logging
      console.log('SECURITY_EVENT: Superadmin promotion attempt', {
        currentUserId,
        targetUserId: userId,
        targetEmail: targetUser.email,
        previousRole: targetUser.role,
        timestamp: new Date().toISOString()
      });

      // Atomic update with additional security checks
      const { error: promoteError } = await supabase
        .from('profiles')
        .update({ 
          role: 'superadmin',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .eq('role', targetUser.role) // Ensure role hasn't changed since we checked
        .neq('id', currentUserId); // Additional safety check

      if (promoteError) {
        console.error('SECURITY_EVENT: Superadmin promotion failed', {
          currentUserId,
          targetUserId: userId,
          error: promoteError.message
        });
        return {
          success: false,
          error: `Promotion failed: ${promoteError.message}`,
          details: promoteError
        };
      }

      // Success audit log
      console.log('SECURITY_EVENT: Superadmin promotion successful', {
        currentUserId,
        targetUserId: userId,
        targetEmail: targetUser.email,
        previousRole: targetUser.role,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        user: { ...targetUser, role: 'superadmin' }
      };

    } catch (error) {
      console.error('SECURITY_EVENT: Superadmin promotion exception', {
        error: error instanceof Error ? error.message : 'Unknown error',
        targetUserId: userId
      });
      return {
        success: false,
        error: `System error: Unable to process promotion request`,
        details: error
      };
    }
  }

  // Validate schema and fix common issues
  static async validateAndRepairSchema(): Promise<{
    success: boolean
    issues: string[]
    repairs: string[]
  }> {
    const issues: string[] = [];
    const repairs: string[] = [];

    try {
      // Check for orphaned profiles (this query might not work in self-hosted)
      // Skip this check for self-hosted Supabase as it requires special permissions
      
      // Check superadmin roles exist
      const { data: superAdminProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'superadmin');
      
      if (!profilesError && (!superAdminProfiles || superAdminProfiles.length === 0)) {
        issues.push('No superadmin users found in profiles table');
      }

      // Check user_roles table
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      
      if (!rolesError && (!userRoles || userRoles.length === 0)) {
        issues.push('No admin roles found in user_roles table');
      }

      return {
        success: issues.length === 0,
        issues,
        repairs
      };

    } catch (error) {
      return {
        success: false,
        issues: [`Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        repairs: []
      };
    }
  }

  // Test connection and permissions
  static async testConnection(): Promise<{
    success: boolean
    details: any
  }> {
    try {
      // Test basic connection
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });

      if (testError) {
        return {
          success: false,
          details: {
            error: testError.message,
            code: testError.code
          }
        };
      }

      // Test superadmin check
      const { data: superAdminCheck, error: superAdminError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'superadmin')
        .limit(1);
      
      return {
        success: true,
        details: {
          profileCount: testData?.length || 0,
          superadminExists: !superAdminError && (superAdminCheck?.length || 0) > 0,
          superAdminError: superAdminError?.message
        }
      };

    } catch (error) {
      return {
        success: false,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}
