import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.techpinoy.client',
  appName: 'TechPinoy Client',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffffff',
      androidSplashResourceName: 'splash',
      androidSplashGravity: 'center',
      androidSplashFullScreen: true,
      androidSplashNeverFade: false,
      showSpinner: false,
      androidSpinnerStyle: 'large',
      spinnerColor: '#999999',
      androidIcon: 'icon',
      androidAdaptiveIcon: {
        foregroundImage: 'icon',
        backgroundColor: '#000000'
      }
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: 'icon',
      backgroundColor: '#000000'
    }
  }
};

export default config;
