import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.unirea.app',
  appName: 'Unirea',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
};

export default config;
