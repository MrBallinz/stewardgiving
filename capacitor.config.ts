import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f46fe20bfd624cf48a609663e7eed2e3',
  appName: 'Steward',
  webDir: 'dist',
  server: {
    url: 'https://f46fe20b-fd62-4cf4-8a60-9663e7eed2e3.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    contentInset: 'always',
  },
};

export default config;
