import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { RestrictedAccessModal } from '@/components/RestrictedAccessModal';
import { useClientEmailRedirect } from '@/hooks/useClientEmailRedirect';
import { CustomLoading } from '@/components/ui/CustomLoading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSuperadmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false, requireSuperadmin = false }: ProtectedRouteProps) => {
  const { user, userProfile, userProfileLoading } = useAuth();
  const location = useLocation();
  const [showRestrictedModal, setShowRestrictedModal] = useState(false);
  const { isLoading: clientLoading } = useClientEmailRedirect();

  if (userProfileLoading || clientLoading) {
    return <CustomLoading />;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  // Client role users are handled by ClientAccessRoute wrapper
  // This component doesn't need to handle client redirects

  // If admin access is required, check the user's role
  if (requireAdmin) {
    const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'sales_admin' || userProfile?.role === 'superadmin';
    
    if (!isAdmin) {
      // Show restricted access modal instead of redirecting
      return (
        <>
          <RestrictedAccessModal 
            open={true} 
            onOpenChange={setShowRestrictedModal}
          />
          <div className="min-h-screen bg-muted/20 flex items-center justify-center">
            <div className="text-center p-8">
              <h2 className="text-lg font-medium text-muted-foreground">Access Restricted</h2>
              <p className="text-sm text-muted-foreground mt-1">Administrator privileges required</p>
            </div>
          </div>
        </>
      );
    }
  }

  // If superadmin access is required, check the user's role
  if (requireSuperadmin) {
    if (userProfile?.role !== 'superadmin') {
      return (
        <>
          <RestrictedAccessModal 
            open={true} 
            onOpenChange={setShowRestrictedModal}
          />
          <div className="min-h-screen bg-muted/20 flex items-center justify-center">
            <div className="text-center p-8">
              <h2 className="text-lg font-medium text-muted-foreground">Access Restricted</h2>
              <p className="text-sm text-muted-foreground mt-1">Superadmin privileges required</p>
            </div>
          </div>
        </>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
