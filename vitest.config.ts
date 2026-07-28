import { defineConfig } from 'vitest/config'

/**
 * Vitest reads `vite.config.ts` when no config of its own exists, and that one
 * is rooted at `src/renderer` for the mobile web build — which quietly narrowed
 * the suite to a directory holding no tests at all, reporting "no test files"
 * rather than a failure. This file exists to keep the runner rooted at the
 * repository, where the engine, i18n, save-format and save-store suites live.
 *
 * The test files import each other by relative path, so no aliases are needed
 * here; adding them would only create a second place for the build and the
 * suite to disagree.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts']
  }
})
