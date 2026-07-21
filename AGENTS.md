# AGENTS.md

Guidance for AI coding agents working in the **Star Trader** repository.

## What this project is

A modern desktop remake of the classic *Space Trader* game, built with
**Electron + React + TypeScript** and bundled with **electron-vite**. See
`README.md` for the feature overview and `src/` layout.

## Golden rules

1. **All code comments and documentation are written in English.** UI text is
   the only exception — it is localized and lives exclusively in
   `src/i18n/locales/`.
2. **Never hard-code user-facing strings in the engine or components.** The
   engine emits stable ids + params; the UI resolves them via `@i18n/index`
   (`t`, `renderMessage`, and the `*Name` helpers). Add new strings to **both**
   `en.ts` and `uk.ts` with matching key structure.
3. **Keep the engine pure.** Everything under `src/game/` must have **no imports
   from React, Electron, the DOM, or the renderer.** The engine takes and mutates
   a plain `GameState` and returns typed `ActionResult`s. This keeps it testable
   and portable (a web build could reuse it verbatim).
4. **Determinism matters.** Galaxy generation and any world logic use the seeded
   `Rng` (`src/game/engine/rng.ts`), never `Math.random`, so games are
   reproducible and tests are stable.

## Architecture

- `src/game/data/` — static tables (goods, ships, equipment, governments, names).
  Pure data, no logic.
- `src/game/engine/` — types, RNG, galaxy, market, travel, combat, warp, and the
  `game.ts` action layer. `src/game/index.ts` is the public barrel; import engine
  symbols through `@game/index`, not deep paths.
- `src/i18n/` — locale dictionaries and helpers. `en` is the default locale.
- `src/renderer/src/store/gameStore.ts` — the **only** bridge between UI and
  engine. Components call store actions; the store calls engine functions,
  `structuredClone`s the mutated `GameState` to trigger React updates, and turns
  `ActionResult`s into toasts via `renderMessage`.
- `src/main/` + `src/preload/` — Electron shell and the save/load IPC
  (`window.api.saveGame/loadGame/hasSave`).

### Adding a game mechanic (typical flow)

1. Add/extend types in `src/game/engine/types.ts`.
2. Implement pure logic in the relevant `engine/*.ts` file; export it from
   `src/game/index.ts`.
3. Add a unit test in `src/game/engine/*.test.ts`.
4. Add a store action in `gameStore.ts`.
5. Build the UI in a screen/component; add any new strings to both locales.

## Commands

```bash
npm run dev        # dev with hot reload (opens an Electron window)
npm run typecheck  # tsc for both the node (main/preload/engine) and web projects
npm test           # Vitest engine tests (headless, always runnable)
npm run build      # production build into out/
```

Always run `npm run typecheck` and `npm test` before considering a change done.
`tsconfig.node.json` covers `main`/`preload`/`game`; `tsconfig.web.json` covers
the renderer. Both use `strict` + `noUnusedLocals`/`noUnusedParameters`, so keep
imports tidy.

## Environment gotchas

- This repo builds and runs on Node 18+. `electron`, `esbuild`, `vite`, and
  `tsc` binaries live in `node_modules/.bin/`.
- **`ELECTRON_RUN_AS_NODE`**: some sandboxes export this, which makes the
  `electron` binary run as plain Node (so `require('electron')` yields no app
  APIs and `electron --version` reports a Node version). To actually launch the
  GUI, unset it: `env -u ELECTRON_RUN_AS_NODE npm run dev`.
- Headless/CI sandboxes may not be able to spawn a Chromium renderer at all
  ("Renderer process crashed"). This is environmental — verify logic with
  `npm test` and correctness with `npm run typecheck`/`npm run build` instead of
  relying on the GUI there.
- Electron main/preload are built as **CommonJS** (no `"type": "module"` in
  `package.json`). Don't add it back — ESM main triggered a CJS-interop crash on
  startup with this Electron version.

## Conventions

- Money is integer credits; format for display with `src/renderer/src/util/format.ts`.
- Prefer the `@game`, `@i18n`, and `@` path aliases over long relative imports.
- Ship/good/government identifiers are lowercase camelCase string literal unions;
  keep new ids consistent and add matching locale keys.
