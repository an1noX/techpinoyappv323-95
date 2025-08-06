
import { useCallback, useEffect } from 'react';

export const useMemoryOptimization = () => {
  const logMemoryUsage = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      const memory = (window as any).performance.memory;
      const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
      // Memory logging removed to clean up console
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(logMemoryUsage, 30000);
    return () => clearInterval(interval);
  }, [logMemoryUsage]);

  return { logMemoryUsage };
};
