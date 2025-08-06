
import { useState, useEffect } from 'react';

interface Settings {
  siteName: string;
  theme: string;
}

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>({
    siteName: 'TechPinoy',
    theme: 'light'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Simulate loading settings
    setIsLoading(false);
  }, []);

  return {
    settings,
    isLoading
  };
};
