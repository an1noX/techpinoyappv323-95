
// OfflineStorageService and offlineStorage are now unused and can be removed or commented out.
// export class OfflineStorageService {
//   private static instance: OfflineStorageService;
//
//   static getInstance(): OfflineStorageService {
//     if (!OfflineStorageService.instance) {
//       OfflineStorageService.instance = new OfflineStorageService();
//     }
//     return OfflineStorageService.instance;
//   }
//
//   getItem<T>(key: string): T | null {
//     try {
//       const data = localStorage.getItem(key);
//       return data ? JSON.parse(data) : null;
//     } catch (error) {
//       console.error('Failed to read from localStorage:', error);
//       return null;
//     }
//   }
//
//   setItem<T>(key: string, value: T): void {
//     try {
//       localStorage.setItem(key, JSON.stringify(value));
//     } catch (error) {
//       console.error('Failed to save to localStorage:', error);
//     }
//   }
//
//   isDataFresh(key: string, maxAgeMs: number): boolean {
//     // Implement freshness check if needed
//     return true;
//   }
//
//   clearCache(): void {
//     // Implement cache clearing if needed
//   }
//
//   isOnline(): boolean {
//     return navigator.onLine;
//   }
// }
//
// export const offlineStorage = OfflineStorageService.getInstance();
