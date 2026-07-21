# Star Trader

A modern remake of the classic **Space Trader** (originally by Pieter Spronck for
Palm OS, later ported to Windows by Jay French). Built as a cross-platform desktop
app with **Electron + React + TypeScript**, a clean sci-fi UI, and full
localization (English by default, Ukrainian included).

> This is an *ambitious* remake: it keeps the spirit and economy model of the
> original while adding a modern interface, an interactive star map, and a
> testable, extensible game engine.

## Gameplay

You start with a second-hand **Gnat**, one pulse laser, and 1000 credits. Trade
goods between solar systems, exploit local shortages and special resources, dodge
(or fight) pirates and police, upgrade your ship, and grow your fortune.

Core systems implemented:

- **Procedural galaxy** — 60 solar systems with tech levels, governments, special
  resources, situational events (war, plague, drought…), and wormholes.
- **Dynamic market** — prices driven by tech level, government preferences,
  special resources, events, and your Trader skill.
- **Travel** — fuel-limited warp jumps across an interactive star chart, plus
  wormhole shortcuts.
- **Encounters & combat** — turn-based fights with pirates, police inspections
  (submit / bribe / flee / fight), traders, plunder, and escape pods. Opponents
  scale with your wealth, combat reputation, and criminal record.
- **Crew & mercenaries** — hire named mercenaries from system personnel rosters;
  they take over duties in their best skill and draw a daily wage.
- **Quests** — special assignments offered on arrival: courier deliveries, relief
  missions to systems in crisis, and bounty hunts for named wanted pirates, with
  a quest log tracking active and completed jobs.
- **Special events** — one-off events on quiet arrivals (derelicts, fuel leaks,
  micrometeorites, tolls, lotteries, news tips, wandering experts).
- **Economy** — bank loans with daily interest, ship insurance with no-claim
  discount.
- **Shipyard & modules** — 10 ship types, five laser tiers, three shield tiers,
  seven gadgets (extra bays, fuel compactor, hidden compartment, cloaking, …),
  refuel/repair, escape pods, and sell-back of installed equipment.
- **Ship art** — every hull has its own hand-built SVG silhouette, shown in the
  ship view, shipyard, and combat.
- **Save/Load** — a single persistent save stored in the app's user-data folder.
- **i18n** — English and Ukrainian, switchable at runtime.

## Tech stack

| Layer      | Choice                                   |
| ---------- | ---------------------------------------- |
| Desktop    | Electron 33                              |
| UI         | React 19 + TypeScript                    |
| Build      | electron-vite (Vite 5)                   |
| State      | Zustand                                  |
| Engine     | Pure TypeScript, no UI dependencies      |
| Tests      | Vitest                                   |

## Project structure

```
src/
  main/        Electron main process (window + save/load IPC)
  preload/     Context-bridge API exposed to the renderer
  game/        Pure game engine (no React/Electron imports)
    data/      Static data: goods, ships, equipment, governments, names
    engine/    Types, RNG, galaxy, market, travel, combat, warp, game actions
  i18n/        Locale dictionaries (en, uk) + translation helpers
  renderer/    React app
    src/
      components/  HUD, nav, toast, modals (combat, amount, game over)
      screens/     Menu, System, Market, Shipyard, Bank, Star Chart, Ship, Log
      store/       Zustand store wiring the engine to the UI
```

The **engine is fully decoupled** from the UI: it takes and mutates a plain
`GameState` object and returns typed results, which makes it unit-testable and
reusable (e.g. for a future web build).

## Development

```bash
npm install        # install dependencies
npm run dev        # launch the app with hot reload
npm run typecheck  # type-check main + renderer
npm test           # run engine unit tests
npm run build      # production build into out/
npm run dist       # package a distributable (electron-builder)
```

Requires Node.js 18+.

## Localization

All user-facing text lives in `src/i18n/locales/{en,uk}.ts`, keyed by stable
identifiers. The engine never hard-codes display strings — it emits ids and
parameters that the UI resolves. Adding a language means adding one locale file.

## Credits

Game design inspired by Pieter Spronck's original *Space Trader* and the
*Space Trader for Windows* port by Jay French. This remake is an independent,
from-scratch reimplementation.

## License

Apache-2.0. See [LICENSE](LICENSE).
