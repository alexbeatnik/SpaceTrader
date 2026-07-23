---
name: verify
description: Run the full Star Trader verification suite (typecheck, engine tests, production build) and, when possible, a GUI smoke test. Use before considering any change complete, or whenever asked to "verify", "check", or "make sure it builds/runs".
---

# Verify Star Trader

Run these from the repository root, in order. Stop and fix on the first failure.

## 1. Type-check (always)

```bash
npm run typecheck
```

Covers both TS projects: `tsconfig.node.json` (main/preload/engine) and
`tsconfig.web.json` (renderer). Both use `strict` + `noUnusedLocals` +
`noUnusedParameters` — remove unused imports/vars rather than disabling the rule.

## 2. Engine unit tests (always)

```bash
npm test
```

Headless Vitest over `src/game/**/*.test.ts` — the authoritative check for game
logic, always runnable even without a display. Coverage spans trading & pricing,
planet economies, exotic resource goods, crew, equipment & hull upgrades, quests
(board, manual turn-in, supplies), fleets & encounter kinds, mining, and warp.
When you add or change engine behavior, add/extend a test here.

## 3. Production build (always)

```bash
npm run build
```

Confirms main, preload, and renderer all bundle. The renderer chunk building
means the React tree and all imports resolve.

## 4. GUI smoke test (only where a desktop/display is available)

```bash
env -u ELECTRON_RUN_AS_NODE ELECTRON_ENABLE_LOGGING=1 timeout 10 ./node_modules/.bin/electron .
```

Notes:
- **Must unset `ELECTRON_RUN_AS_NODE`** or Electron runs as plain Node and fails
  with `Cannot read properties of undefined (reading 'handle')`.
- A `Renderer process crashed` / `Network service crashed` message in a headless
  sandbox is environmental, not a code bug — rely on steps 1–3 there.
- Electron main/preload are CommonJS by design; do not add `"type": "module"`.

## 5. Package the installer (optional — when asked to build the exe)

```bash
npm run dist
```

Produces `release/Star Trader-<version>-setup.exe` via electron-builder (NSIS),
using the app icon in `build/icon.ico`. On Windows this can fail extracting the
`winCodeSign` cache with a symlink-privilege error — see the workaround in
`AGENTS.md` (pre-extract the archive excluding the macOS `darwin` folder). Code
signing is skipped (no cert), so the installer is unsigned.

## Reporting

Report exactly what passed and what failed with the real output. Do not claim the
GUI works from a sandbox where the renderer cannot start — say the smoke test was
skipped/environmental and that logic was verified via tests + build.
