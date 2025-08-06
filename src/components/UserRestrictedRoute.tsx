import React, { useEffect, useState } from 'react';
import { RestrictedAccessModal } from '@/components/RestrictedAccessModal';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Navigate } from 'react-router-dom';

const UserRestrictedRoute: React.FC = () => {
  const [showModal, setShowModal] = useState(true);
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();

  // Allow superadmin access
  if (userProfile?.role === 'superadmin') {
    return <Navigate to="/" replace />;
  }

  const handleModalClose = () => {
    setShowModal(false);
    // Redirect to auth after closing modal
    navigate('/auth', { replace: true });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center">
      <div className="text-center p-8">
        <h2 className="text-lg font-medium text-muted-foreground">Access Restricted</h2>
        <p className="text-sm text-muted-foreground mt-1">User privileges required</p>
      </div>
      <RestrictedAccessModal 
        open={showModal} 
        onOpenChange={handleModalClose}
      />
    </div>
  );
};

export default UserRestrictedRoute;
