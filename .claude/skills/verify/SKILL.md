---
name: verify
description: Run the full Space Trader verification suite (typecheck, engine tests, desktop and web builds) and, when possible, a GUI smoke test or an Android emulator run. Use before considering any change complete, or whenever asked to "verify", "check", or "make sure it builds/runs".
---

# Verify Space Trader

Run these from the repository root, in order. Stop and fix on the first failure.

Steps 1–3 are always required. Step 4 covers the **web/Android** bundle and is
required for any change under `src/renderer/` or `src/shared/`, since one
renderer ships to two hosts. Steps 5–7 are conditional.

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

Headless Vitest over `src/**/*.test.ts` — the authoritative check for game
logic, always runnable even without a display. Coverage spans trading & pricing,
planet economies, exotic resource goods, crew, equipment & hull upgrades, quests
(board, manual turn-in, supplies), fleets & encounter kinds, mining, and warp,
plus the save format, the shared write queue and locale parity.
When you add or change engine behavior, add/extend a test here.

**Check the run collected 4 test files.** `vitest.config.ts` exists only to stop
the runner adopting the root `vite.config.ts`, which is rooted at `src/renderer`
and holds no tests. Without it the suite reports "no test files" — an exit code
that looks like a config slip, not a red suite.

## 3. Production build (always)

```bash
npm run build
```

Confirms main, preload, and renderer all bundle. The renderer chunk building
means the React tree and all imports resolve.

## 4. Web bundle (required for any renderer or shared change)

```bash
npm run build:web
```

Builds the same renderer into `dist-web/` — the bundle the APK packages. The
desktop build passing does **not** imply this one does: it uses a different Vite
config, a different root and different aliases.

## 5. GUI smoke test (only where a desktop/display is available)

```bash
env -u ELECTRON_RUN_AS_NODE ELECTRON_ENABLE_LOGGING=1 timeout 10 ./node_modules/.bin/electron .
```

Notes:
- **Must unset `ELECTRON_RUN_AS_NODE`** or Electron runs as plain Node and fails
  with `Cannot read properties of undefined (reading 'handle')`.
- A `Renderer process crashed` / `Network service crashed` message in a headless
  sandbox is environmental, not a code bug — rely on steps 1–3 there.
- Electron main/preload are CommonJS by design; do not add `"type": "module"`.

## 6. Android APK (when the change touches layout, storage or the platform layer)

```bash
npm run apk        # build:web + cap sync + gradle assembleDebug
```

Needs `JAVA_HOME` (JDK 17+) and an SDK path in `android/local.properties` — see
"Environment gotchas" in `AGENTS.md`. Output lands at
`android/app/build/outputs/apk/debug/app-debug.apk`.

**A CSS change is not verified by a green build.** The whole responsive layout
is invisible to `tsc` and to every test, and inline styles silently outrank
media queries. Where an emulator is available, install and look:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell settings put system accelerometer_rotation 0
adb shell settings put system user_rotation 0   # 0 portrait, 1 landscape
adb exec-out screencap -p > shot.png
```

Check **both orientations**. Portrait is ~411×914 and landscape ~914×411 on a
Pixel-class phone, which sits either side of every breakpoint in the stylesheet.
Look for the failure this layout keeps producing: an action — Buy, Flee, a
payout button — pushed off an edge that does not scroll.

## 7. Package the installer (optional — when asked to build the exe)

```bash
npm run dist
```

Produces `release/SpaceTrader-<version>-setup.exe` via electron-builder (NSIS),
using the app icon in `build/icon.ico`. On Windows this can fail extracting the
`winCodeSign` cache with a symlink-privilege error — see the workaround in
`AGENTS.md` (pre-extract the archive excluding the macOS `darwin` folder). Code
signing is skipped (no cert), so the installer is unsigned.

## Reporting

Report exactly what passed and what failed with the real output. Do not claim the
GUI works from a sandbox where the renderer cannot start — say the smoke test was
skipped/environmental and that logic was verified via tests + build. The same
honesty applies to the phone: a built APK is not a checked layout. If you did not
put it on a device or an emulator, say the layout is verified by construction
only, and name the orientations you did not see.
