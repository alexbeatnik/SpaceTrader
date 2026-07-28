import type { CapacitorConfig } from '@capacitor/cli'

/**
 * `appId` is the Android package name, and it is permanent: once a build is on
 * Play under this id it can never be changed without shipping a different app
 * that no existing player receives as an update. Spelled out in full here
 * rather than reused from Electron's `build.appId`, which still reads
 * "startrader" from before the game was renamed.
 */
const config: CapacitorConfig = {
  appId: 'com.alexbeatnik.spacetrader',
  appName: 'Space Trader',
  webDir: 'dist-web',
  android: {
    // Matches the renderer's own background, so rotating the device or waiting
    // on a heavy screen never flashes white over a game that is black.
    backgroundColor: '#05060f',
    // Android 15 forces edge-to-edge on anything targeting SDK 35, and
    // Capacitor 7 ships this as "disable" — so the WebView ran under the system
    // bars while env(safe-area-inset-*) still reported 0, and the gesture pill
    // sat on top of the bottom tab labels. "auto" applies the margins only
    // where the platform actually enforces edge-to-edge, and is what Capacitor
    // 8 defaults to.
    adjustMarginsForEdgeToEdge: 'auto'
  },
  plugins: {
    SplashScreen: {
      backgroundColor: '#05060f',
      // The renderer holds its first paint until the platform layer is wired
      // up; hiding on its own after a beat avoids a splash that outlives it.
      launchAutoHide: true,
      launchShowDuration: 500
    }
  }
}

export default config
