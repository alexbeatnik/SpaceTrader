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
    backgroundColor: '#05060f'
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
