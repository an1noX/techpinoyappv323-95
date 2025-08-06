
import React, { createContext, useContext, useState, useCallback } from 'react';

interface NavigationState {
  currentPage: string;
  previousPage: string | null;
  navigationHistory: string[];
  sidebarCollapsed: boolean;
}

interface NavigationContextType {
  navigationState: NavigationState;
  setCurrentPage: (page: string) => void;
  goBack: () => string | null;
  toggleSidebar: () => void;
  clearHistory: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentPage: '/dashboard',
    previousPage: null,
    navigationHistory: ['/dashboard'],
    sidebarCollapsed: false,
  });

  const setCurrentPage = useCallback((page: string) => {
    setNavigationState(prev => ({
      ...prev,
      previousPage: prev.currentPage,
      currentPage: page,
      navigationHistory: [...prev.navigationHistory.slice(-9), page], // Keep last 10 pages
    }));
  }, []);

  const goBack = useCallback((): string | null => {
    const { navigationHistory } = navigationState;
    if (navigationHistory.length > 1) {
      const previousPage = navigationHistory[navigationHistory.length - 2];
      setNavigationState(prev => ({
        ...prev,
        currentPage: previousPage,
        previousPage: prev.currentPage,
        navigationHistory: prev.navigationHistory.slice(0, -1),
      }));
      return previousPage;
    }
    return null;
  }, [navigationState]);

  const toggleSidebar = useCallback(() => {
    setNavigationState(prev => ({
      ...prev,
      sidebarCollapsed: !prev.sidebarCollapsed,
    }));
  }, []);

  const clearHistory = useCallback(() => {
    setNavigationState(prev => ({
      ...prev,
      navigationHistory: [prev.currentPage],
      previousPage: null,
    }));
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        navigationState,
        setCurrentPage,
        goBack,
        toggleSidebar,
        clearHistory,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
