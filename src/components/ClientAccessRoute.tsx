import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { RestrictedAccessModal } from '@/components/RestrictedAccessModal';
import { Loader2 } from 'lucide-react';
import { CustomLoading } from '@/components/ui/CustomLoading';
import { supabase } from '@/integrations/supabase/client';

interface ClientAccessRouteProps {
  children: React.ReactNode;
}

const ClientAccessRoute = ({ children }: ClientAccessRouteProps) => {
  const { clientId } = useParams<{ clientId: string }>();
  const { user, userProfile, userProfileLoading } = useAuth();
  const [showRestrictedModal, setShowRestrictedModal] = useState(false);

  // Show loading while checking auth
  if (userProfileLoading) {
    return <CustomLoading />;
  }

  // Not authenticated - should not happen due to ProtectedRoute wrapper
  if (!user) {
    return <RestrictedAccessModal open={true} onOpenChange={() => {}} />;
  }

  // Admin, sales_admin, and superadmin users have full access
  if (userProfile?.role === 'admin' || userProfile?.role === 'sales_admin' || userProfile?.role === 'superadmin') {
    console.log('✅ Admin/Sales Admin/Superadmin access granted to client:', clientId);
    return <>{children}</>;
  }

  // client_access table
  // id = unique id
  // user_id = fk to profiles.id
  // client_id = fk to clients.id

  // Check client_access for user_id and client_id
  const { data: accessRows, isLoading: accessLoading } = useQuery({
    queryKey: ['client-access', user?.id, clientId],
    queryFn: async () => {
      if (!user?.id || !clientId) return [];
      const { data } = await supabase
        .from('client_access' as any)
        .select('id, user_id, client_id') // user_id is FK to profiles.id, client_id is FK to clients.id
        .eq('user_id', user.id)
        .eq('client_id', clientId);
      return data;
    },
    enabled: !!user?.id && !!clientId,
  });

  if (accessLoading) return <CustomLoading />;

  // If user has access, allow route
  if (accessRows && accessRows.length > 0) {
    return <>{children}</>;
  }

  // Access denied
  console.log('❌ Access denied to client:', clientId, 'for user:', user.email, 'role:', userProfile?.role);
  return <RestrictedAccessModal open={true} onOpenChange={() => {}} />;
};

export default ClientAccessRoute;
