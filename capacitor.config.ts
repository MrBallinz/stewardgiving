import type { CapacitorConfig } from '@capacitor/cli';

// IMPORTANT: This config is for a future native build. The legacy `server.url`
// pointing at the Lovable preview environment was removed because it would have
// caused any installed native app to load a dev URL over the network.
// When ready to ship native apps:
//   1. Update `appId` to a real reverse-DNS bundle ID (e.g. app.steward.giving)
//   2. Run `bun run build` then `npx cap sync` to bundle `dist/` into the app
//   3. Configure signing certs and submit through App Store Connect / Play Console
const config: CapacitorConfig = {
  appId: 'app.steward.giving',
  appName: 'Steward',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
  },
};

export default config;
