
interface VersionInfo {
  version: string;
  buildNumber: number;
  releaseDate: string;
  downloadUrl: string;
  fileSize?: number;
  whatsNew: string[];
  updateType: 'critical' | 'feature' | 'beta';
  isRequired: boolean;
}

interface APKInfo {
  filename: string;
  version: string;
  downloadUrl: string;
  fileSize?: number;
  lastModified?: Date;
  isNewer: boolean;
  isLatest: boolean;
  updateType: 'critical' | 'feature' | 'beta';
  versionInfo?: VersionInfo;
}

interface UpdateCheckResult {
  hasUpdates: boolean;
  latestVersion: string;
  currentVersion: string;
  availableUpdates: APKInfo[];
  lastChecked: Date;
  latestVersionInfo?: VersionInfo;
  error?: string;
}

class UpdateService {
  private static instance: UpdateService;
  private readonly APK_BASE_URL = 'https://app.techpinoy.com/apk/';
  private readonly CACHE_KEY = 'update_check_cache';
  private readonly LAST_CHECK_KEY = 'last_update_check';
  private readonly VERSION_SHOWN_KEY = 'version_info_shown';
  private readonly ERROR_CACHE_KEY = 'update_check_error';
  
  static getInstance(): UpdateService {
    if (!UpdateService.instance) {
      UpdateService.instance = new UpdateService();
    }
    return UpdateService.instance;
  }

  // Parse version from filename (e.g., "app-v1.2.3.apk" -> "1.2.3")
  private parseVersionFromFilename(filename: string): string {
    const versionMatch = filename.match(/v?(\d+\.\d+\.\d+)/);
    return versionMatch ? versionMatch[1] : '0.0.0';
  }

  // Compare version strings (returns 1 if a > b, -1 if a < b, 0 if equal)
  private compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || 0;
      const bPart = bParts[i] || 0;
      
      if (aPart > bPart) return 1;
      if (aPart < bPart) return -1;
    }
    return 0;
  }

  // Determine update type based on filename patterns
  private getUpdateType(filename: string): 'critical' | 'feature' | 'beta' {
    const lowerFilename = filename.toLowerCase();
    if (lowerFilename.includes('critical') || lowerFilename.includes('hotfix')) {
      return 'critical';
    }
    if (lowerFilename.includes('beta') || lowerFilename.includes('alpha')) {
      return 'beta';
    }
    return 'feature';
  }

  // Fetch version info JSON for a specific version
  private async fetchVersionInfo(version: string): Promise<VersionInfo | null> {
    try {
      const response = await fetch(`${this.APK_BASE_URL}version-info-v${version}.json`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error(`Failed to fetch version info for v${version}:`, error);
    }
    return null;
  }

  // Check if we should skip cache (force refresh)
  private shouldSkipCache(forceRefresh: boolean = false): boolean {
    if (forceRefresh) return true;
    
    const lastCheck = localStorage.getItem(this.LAST_CHECK_KEY);
    if (!lastCheck) return true;
    
    const lastCheckTime = new Date(lastCheck);
    const now = new Date();
    const hoursSinceLastCheck = (now.getTime() - lastCheckTime.getTime()) / (1000 * 60 * 60);
    
    // Check every 6 hours
    return hoursSinceLastCheck >= 6;
  }

  // Check if version info has been shown to user
  hasVersionBeenShown(version: string): boolean {
    const shownVersions = JSON.parse(localStorage.getItem(this.VERSION_SHOWN_KEY) || '[]');
    return shownVersions.includes(version);
  }

  // Mark version info as shown
  markVersionAsShown(version: string): void {
    const shownVersions = JSON.parse(localStorage.getItem(this.VERSION_SHOWN_KEY) || '[]');
    if (!shownVersions.includes(version)) {
      shownVersions.push(version);
      localStorage.setItem(this.VERSION_SHOWN_KEY, JSON.stringify(shownVersions));
    }
  }

  // Check if error is CORS or network related
  private isNetworkError(error: Error): boolean {
    return error.message.includes('Failed to fetch') || 
           error.message.includes('CORS') ||
           error.message.includes('network') ||
           error.name === 'TypeError';
  }

  // Fetch and parse APK files from server
  async checkForUpdates(currentVersion: string, forceRefresh: boolean = false): Promise<UpdateCheckResult> {
    // Return cached result if available and not expired
    if (!this.shouldSkipCache(forceRefresh)) {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        try {
          const cachedResult = JSON.parse(cached);
          console.log('📦 Using cached update check result');
          return cachedResult;
        } catch (error) {
          console.error('Failed to parse cached update data:', error);
        }
      }
    }

    // Check if we recently had a network error
    const lastError = localStorage.getItem(this.ERROR_CACHE_KEY);
    if (lastError && !forceRefresh) {
      const errorData = JSON.parse(lastError);
      const timeSinceError = Date.now() - errorData.timestamp;
      // Don't retry network requests for 30 minutes after a CORS/network error
      if (timeSinceError < 30 * 60 * 1000) {
        console.log('🚫 Skipping update check due to recent network error');
        return {
          hasUpdates: false,
          latestVersion: currentVersion,
          currentVersion,
          availableUpdates: [],
          lastChecked: new Date(),
          error: 'Network unavailable - using offline mode'
        };
      }
    }

    try {
      console.log('🔍 Checking for updates from server...');
      
      // Add timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(this.APK_BASE_URL, {
        signal: controller.signal,
        mode: 'cors',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      let apkFiles: string[] = [];
      
      // Parse HTML to extract APK files
      if (typeof window !== 'undefined' && 'DOMParser' in window) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = Array.from(doc.querySelectorAll('a'));
        apkFiles = links
          .map(link => link.getAttribute('href'))
          .filter(href => href && href.endsWith('.apk')) as string[];
      } else {
        // Fallback parsing for non-browser environments
        apkFiles = html.split('\n')
          .map(line => {
            const match = line.match(/href=["']([^"']+\.apk)["']/);
            return match ? match[1] : null;
          })
          .filter(Boolean) as string[];
      }

      // Process APK files
      const availableUpdates: APKInfo[] = [];
      
      for (const filename of apkFiles) {
        const version = this.parseVersionFromFilename(filename);
        const isNewer = this.compareVersions(version, currentVersion) > 0;
        
        if (isNewer) {
          // Try to fetch version info for this version
          const versionInfo = await this.fetchVersionInfo(version);
          
          availableUpdates.push({
            filename,
            version,
            downloadUrl: `${this.APK_BASE_URL}${filename}`,
            isNewer,
            isLatest: false, // Will be set below
            updateType: versionInfo?.updateType || this.getUpdateType(filename),
            versionInfo
          });
        }
      }

      // Sort by version (latest first)
      availableUpdates.sort((a, b) => this.compareVersions(b.version, a.version));

      // Mark the latest version
      if (availableUpdates.length > 0) {
        availableUpdates[0].isLatest = true;
      }

      const result: UpdateCheckResult = {
        hasUpdates: availableUpdates.length > 0,
        latestVersion: availableUpdates[0]?.version || currentVersion,
        currentVersion,
        availableUpdates,
        lastChecked: new Date(),
        latestVersionInfo: availableUpdates[0]?.versionInfo
      };

      // Cache the result and clear any error cache
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(result));
      localStorage.setItem(this.LAST_CHECK_KEY, new Date().toISOString());
      localStorage.removeItem(this.ERROR_CACHE_KEY);

      console.log('✅ Update check completed successfully');
      return result;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      
      // Cache network errors to avoid repeated failures
      if (this.isNetworkError(error as Error)) {
        console.log('🌐 Network error detected, caching error state');
        localStorage.setItem(this.ERROR_CACHE_KEY, JSON.stringify({
          timestamp: Date.now(),
          error: error.message
        }));
      }

      // Return a graceful fallback result instead of throwing
      return {
        hasUpdates: false,
        latestVersion: currentVersion,
        currentVersion,
        availableUpdates: [],
        lastChecked: new Date(),
        error: this.isNetworkError(error as Error) ? 
          'Unable to check for updates (network unavailable)' : 
          'Update check failed'
      };
    }
  }

  // Get cached update info without making network request
  getCachedUpdateInfo(): UpdateCheckResult | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get cached update info:', error);
      return null;
    }
  }

  // Clear update cache
  clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
    localStorage.removeItem(this.LAST_CHECK_KEY);
    localStorage.removeItem(this.ERROR_CACHE_KEY);
  }

  // Clear version shown history
  clearVersionHistory(): void {
    localStorage.removeItem(this.VERSION_SHOWN_KEY);
  }
}

export const updateService = UpdateService.getInstance();
export type { APKInfo, UpdateCheckResult, VersionInfo };
