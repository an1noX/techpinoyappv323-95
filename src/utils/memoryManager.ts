export class MemoryManager {
  private static instance: MemoryManager;
  private memoryThreshold = 50 * 1024 * 1024; // 50MB threshold
  private checkInterval: NodeJS.Timeout | null = null;

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  startMonitoring(): void {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000); // Check every 30 seconds
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Check if memory usage is high (over 80% of threshold)
  isMemoryPressure(): boolean {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const usedMemory = memInfo.usedJSHeapSize;
      return usedMemory > (this.memoryThreshold * 0.8);
    }
    return false;
  }

  // Manual check for high memory usage (over threshold)
  isHighMemoryUsage(): boolean {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const usedMemory = memInfo.usedJSHeapSize;
      return usedMemory > this.memoryThreshold;
    }
    return false;
  }

  // Adjustable threshold
  setMemoryThreshold(megabytes: number): void {
    this.memoryThreshold = megabytes * 1024 * 1024;
  }

  private checkMemoryUsage(): void {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const usedMemory = memInfo.usedJSHeapSize;
      
      console.log(`📊 Memory usage: ${(usedMemory / 1024 / 1024).toFixed(2)}MB`);
      
      if (usedMemory > this.memoryThreshold) {
        console.warn('🚨 High memory usage detected, triggering cleanup...');
        this.performMemoryCleanup();
      }
    }
  }

  private performMemoryCleanup(): void {
    // Clear all non-essential localStorage data during memory pressure
    const keysToCheck = [
      'cached_products',
      'cached_printers', 
      'cached_clients',
      'search_cache',
      'normalized_printer_data',
      'temp_data',
      'filter_cache'
    ];

    // More aggressive cleanup during high memory pressure
    const maxAge = this.isHighMemoryUsage() ? 15 * 60 * 1000 : 60 * 60 * 1000; // 15 mins or 1 hour

    keysToCheck.forEach(key => {
      const timestamp = localStorage.getItem(`${key}_timestamp`);
      if (timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age > maxAge) {
          localStorage.removeItem(key);
          localStorage.removeItem(`${key}_timestamp`);
          console.log(`🧹 Cleared cache: ${key}`);
        }
      }
    });

    // Trigger garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }

  // Manual cleanup method
  clearCache(): void {
    this.performMemoryCleanup();
  }

  // Get memory usage info
  getMemoryInfo(): any {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      return {
        used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    return null;
  }
}

export const memoryManager = MemoryManager.getInstance();
