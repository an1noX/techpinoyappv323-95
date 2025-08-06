
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export const useRoleBasedNavigation = () => {
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [showClientSettingsModal, setShowClientSettingsModal] = useState(false);
  const [showRestrictedModal, setShowRestrictedModal] = useState(false);

  const userRole = userProfile?.role;

  const handleBackButtonClick = () => {
    console.log('🔄 Role-based back button clicked, user role:', userRole);
    
    switch (userRole) {
      case 'admin':
      case 'sales_admin':
        // Admin users get normal back button behavior
        navigate(-1);
        break;
      case 'client':
        // Client users get modal instead of navigation
        setShowClientSettingsModal(true);
        break;
      default:
        // User or unknown role gets restricted access modal
        setShowRestrictedModal(true);
        break;
    }
  };

  const handleClientSettings = () => {
    console.log('⚙️ Client settings clicked');
    setShowClientSettingsModal(false);
    // Settings logic would go here
  };

  const handleClientLogout = async () => {
    console.log('🚪 Client logout clicked');
    setShowClientSettingsModal(false);
    await signOut();
    navigate('/auth');
  };

  const handleRestrictedModalClose = () => {
    setShowRestrictedModal(false);
  };

  return {
    userRole,
    handleBackButtonClick,
    showClientSettingsModal,
    setShowClientSettingsModal,
    showRestrictedModal,
    setShowRestrictedModal,
    handleClientSettings,
    handleClientLogout,
    handleRestrictedModalClose,
  };
};
