import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tradinglab.app',
  appName: 'Trading Lab',
  webDir: 'out',
  server: {
    iosScheme: 'https',
    androidScheme: 'https',
  },
};

export default config;
