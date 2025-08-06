
// Read version from the centralized version.json file
let cachedVersion: string | null = null;

// Import version.json directly - Vite handles this automatically
import versionData from '../../version.json';

export const getAppVersion = (): string => {
  if (cachedVersion) {
    return cachedVersion;
  }
  
  try {
    // Use the imported version data
    cachedVersion = versionData.version;
    return cachedVersion;
  } catch (error) {
    console.warn('Could not load version from version.json, using fallback:', error);
    // Fallback version - this should match the initial version.json
    cachedVersion = "1.0.7";
    return cachedVersion;
  }
};

// Export the version as a constant for easy import
export const APP_VERSION = getAppVersion();








































