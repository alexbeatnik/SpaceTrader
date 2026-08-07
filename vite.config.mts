import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * The web target: the same renderer, built to plain static files for Capacitor
 * to package into the APK. `electron.vite.config.ts` still owns the desktop
 * build — this exists alongside it rather than replacing it, and the two share
 * the renderer source and the aliases below verbatim.
 */
export default defineConfig({
  root: 'src/renderer',
  // Relative asset URLs. The Android WebView serves the bundle from an origin
  // of its own, and a root-absolute `/assets/...` is one config change away
  // from resolving to nothing at all.
  base: './',
  resolve: {
    alias: {
      '@': resolve('src/renderer/src'),
      '@game': resolve('src/game'),
      '@i18n': resolve('src/i18n'),
      '@shared': resolve('src/shared')
    }
  },
  plugins: [react()],
  build: {
    outDir: resolve('dist-web'),
    emptyOutDir: true,
    rollupOptions: {
      input: { index: resolve('src/renderer/index.html') }
    }
  }
})
