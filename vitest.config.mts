import { defineConfig } from 'vitest/config'

/**
 * Vitest reads `vite.config.mts` when no config of its own exists, and that one
 * is rooted at `src/renderer` for the mobile web build — which quietly narrowed
 * the suite to a directory holding no tests at all, reporting "no test files"
 * rather than a failure. This file exists to keep the runner rooted at the
 * repository, where the engine, i18n, save-format and save-store suites live.
 *
 * The test files import each other by relative path, so no aliases are needed
 * here; adding them would only create a second place for the build and the
 * suite to disagree.
 *
 * **The `.mts` extension is load-bearing.** `package.json` has no
 * `"type": "module"` and must not get one (Electron's main and preload are
 * CommonJS by design), so a `.ts` config here is loaded through Vite's CJS
 * Node API and every `npm test` run opens with its deprecation warning. The
 * explicit ESM extension takes that path out of the picture without touching
 * the package type. If you rename it back, also fix the `include` list in
 * `tsconfig.node.json` — a stale name there is dropped silently, and the
 * config simply stops being type-checked.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts']
  }
})
