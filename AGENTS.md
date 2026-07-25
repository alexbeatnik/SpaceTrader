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
   `en.ts` and `uk.ts` with matching key structure. A message param may itself
   carry an i18n key to be localized inline — `renderMessage` auto-translates
   `good`, `ship`, `name` (mercenary), and any `skill`/`status` param whose value
   starts with `skill.`/`status.`. Bounty-pirate and passenger names are proper
   nouns, not dictionary ids: pass them as `bounty`/`passenger` params (verbatim
   interpolation) — **never** as `name`, which is reserved for mercenary ids.
3. **Keep the engine pure.** Everything under `src/game/` must have **no imports
   from React, Electron, the DOM, or the renderer.** The engine takes and mutates
   a plain `GameState` and returns typed `ActionResult`s. This keeps it testable
   and portable (a web build could reuse it verbatim).
4. **Determinism matters.** Galaxy generation and any world logic use the seeded
   `Rng` (`src/game/engine/rng.ts`), never `Math.random` **and never the wall
   clock** — `Date.now()` breaks a seeded replay just as thoroughly. Anything
   needing a unique id counts up in the save instead (see `nextQuestId`, which
   keeps its sequence in `state.flags.questSeq`).
   Per-fight dice come from `Encounter.seed`, drawn once when the encounter is
   built; rounds resolve on `seed ^ round`. Deriving them from the calendar
   instead made two fights on one leg roll an identical sequence.

## Architecture

- `src/game/data/` — static tables (goods, ships, equipment, stations,
  governments, economies, mercenaries, names). Pure data, no logic.
- `src/game/engine/` — types, RNG, galaxy, location, market, travel, combat,
  warp, in-system travel, mining, news, events, quests, reputation, and the
  `game.ts` action layer. `src/game/index.ts` is the public barrel; import engine
  symbols through `@game/index`, not deep paths.
  `advanceDay(state)` (in `game.ts`) is the shared daily tick used by `warp`,
  `mine` and `travelToBody` — reuse it rather than re-implementing
  wages/interest/insurance.
- `src/i18n/` — locale dictionaries and helpers. **English is the primary
  locale**: the default on a fresh install, the first entry in `LOCALES` (which
  is the order the toggle offers), and the fallback for any key a translation
  is missing. `uk.ts` must mirror its key structure exactly.
- `src/renderer/src/store/gameStore.ts` — the **only** bridge between UI and
  engine. Components call store actions; the store calls engine functions,
  `structuredClone`s the mutated `GameState` to trigger React updates, and turns
  `ActionResult`s into toasts via `renderMessage`. `applyResult` **persists to
  the autosave slot on every successful action** — don't add a state-changing
  path that skips it, or the change lives only in memory until the next jump and
  is lost on quit.
- `src/main/` + `src/preload/` — Electron shell, the save-slot IPC
  (`window.api.saveGame/loadGame/listSaves/deleteSave`, all slot-addressed) and
  the self-updater (`src/main/updater.ts`).

- `src/shared/` — code both processes need. Today that is `saves.ts`, the
  on-disk save format. It imports nothing from the engine on purpose: main has
  to list and validate slots without understanding a `GameState`.

### Releases and self-update

`.github/workflows/release.yml` builds on every push to main and publishes a
GitHub Release when `package.json`'s version has no tag yet — so **shipping is
just bumping the version**. `ci.yml` is the typecheck + test gate for everything
else.

`src/main/updater.ts` reads that release through electron-updater: it downloads
in the background and installs on quit, so a jump is never interrupted. Three
things are load-bearing and easy to break:

- **`latest.yml` must be uploaded with the installer.** It is generated from
  `build.publish` in package.json (not by `--publish`, which only controls
  uploading) and is the only thing the updater reads to find a new version.
- **The artifact name must not contain a space.** GitHub rewrites spaces in
  asset names, so `Star Trader-...exe` would never resolve against the name
  recorded in `latest.yml`; hence `StarTrader-${version}-setup.${ext}`. The
  release job asserts the two match before publishing.
- **`allowScripts` in package.json** approves Electron's and esbuild's install
  scripts. npm 11 skips unapproved install scripts, and without them CI never
  downloads the Electron binary.

`setupUpdater` no-ops when `!app.isPackaged` (electron-updater throws rather
than skipping), so a dev run reports `unsupported` instead of failing.

### Save slots

Seven files in `userData/saves/` — `slot-auto.json` plus `slot-1..6.json`.
The **autosave** is the one the game writes itself (every `applyResult`, every
`warpTo`, every mine tick); the six **manual** slots are only ever written when
the player asks, which is what makes them snapshots. Loading a manual slot does
*not* redirect the autosave — it keeps going to `auto` — so a loaded snapshot
stays intact while you play on.

Each file is a `SaveFile` envelope: `{ format, meta, state }`, where `state` is
the serialized `GameState` and `meta` is the summary the slot list renders.
The envelope exists so `save:list` can build the menu without the main process
parsing a galaxy into anything meaningful. **Always read a slot through
`parseSaveFile`** — it also accepts the legacy pre-slots shape (a bare
`GameState`, which main migrates from `savegame.json` into the auto slot on
first launch) and returns null instead of throwing on junk.

Slot ids cross the IPC boundary from the renderer, so they are untrusted: main
validates every one with `isSaveSlotId` before it reaches a path. Writes go
through a temp file and a rename, because the autosave fires constantly and a
half-written file must never replace a good save.

### Star systems have insides: bodies, stations, in-system travel

A `SolarSystem` is no longer one place. It carries `bodies: SystemBody[]` —
**index 0 is always the settled capital planet**, and the rest are uninhabited
worlds and the occasional station — plus a `starClass` for the map.
`GameState.currentBody` says which one the ship is docked at (absent = 0, which
is what every pre-bodies save means).

- **`engine/location.ts`** is the "where are we" module. It imports nothing but
  the types and the station catalogue, so `game.ts` can gate its actions on
  location without a cycle. `atCapital`, `hasShipyard`, `currentStation`,
  `currentMineSite`, `maxHullUpgradesHere`, `repairCostMulHere`. `game.ts`
  re-exports the lot, so `@game/index` is unchanged.
- **Only the capital planet has a port.** Market, bank, job board and hiring hall
  all check `atCapital` and fail with `error.noMarketHere` / `noBankHere` /
  `noPortHere` / `noHiringHallHere`. `canTurnIn` checks it too, so the Quests
  badge follows for free. A shipyard is the planet **or** any station
  (`hasShipyard`).
- **`SolarSystem.mineSite` stays the capital's own site**; every other body
  carries its own in `body.mineSite`. Read either through `bodyMineSite(sys,
  body)` / `currentMineSite(state)` — never copy one into the other, or the two
  drift and setting `sys.mineSite` silently stops meaning anything.
- **`engine/system.ts` owns `travelToBody`.** It burns days (`advanceDay` per
  day, so wages, interest and crew incidents all apply), no fuel — an impulse
  drive that charged fuel could strand a dry ship on a dead rock with no way back
  to the only place selling any. It deliberately does **not** call
  `settleArrival`: hopping to a moon and back must not refresh the market,
  repost the board, or clear `sourcedHere` (that last one would launder cargo
  bought at a planet into cargo "hauled in" to it and break every contract).
- **Stations** (`data/stations.ts`) sell equipment marked `stationOnly`, and
  nothing else — `weaponsForSale`/`shieldsForSale`/`gadgetsForSale`/`shipsForSale`
  in `game.ts` are the single source for what a yard stocks; the shipyard screen
  renders whatever they return rather than filtering the tables itself.

### Travel animation (deferred encounters)

`warp()` in the engine is synchronous: it mutates `GameState` (fuel, day,
position, market) and returns a `WarpResult` bundling any encounter/event/quest
offer. To keep a jump from feeling instantaneous, the store splits this into two
phases:

- `warpTo(targetId)` runs `warp()`, stashes the result in a module-level
  `pendingWarp`, and sets a `travel: TravelAnim` descriptor **instead of**
  surfacing the encounter/event/offer.
- `<WarpTransition>` renders while `travel` is set (a timed overlay the player
  cannot skip — a jump takes as long as it takes), then calls `finishTravel()`,
  which moves `pendingWarp` into the reactive `event`/`questOffer` fields and
  clears `travel`.

**A leg can hold several encounters, and they interrupt the jump rather than
waiting at the far end.** `warp()` rolls `encounterRolls(distance)` times (1–3,
longer hauls get more) and returns `WarpResult.encounters` — always a list, so
never reach for a singular `encounter`. `warpTo` gives each one a random point
along the leg (`TravelAnim.interceptPoints`, anywhere in 0…1, sorted). When the
animation reaches the next point the overlay calls `interceptTravel()`, which
shifts one encounter off `pendingWarp` and surfaces it; the flight loop tears
down, and once that fight is dismissed it picks the leg back up from
`progressRef` and flies on to the next point. `interceptTravel` returns false
when the queue is empty and the loop keeps flying on false — without that, a
mismatch between points and encounters would freeze the jump forever.
`<CombatModal>` is therefore the one modal App renders **without** a `!travel`
guard, and `.overlay` sits above `.warp-overlay` so it shows over the streaks.

Everything else (events, quest offers, the ready-to-hand-in toast) still waits
for `finishTravel`. When adding flow that runs on arrival, thread it through
`WarpResult` → `pendingWarp` → `finishTravel`, not directly out of `warpTo`.
Note: `pendingWarp` lives outside reactive state and is not persisted, so a hard
close mid-animation drops that one pending encounter (acceptable).

**Three journeys, one overlay.** `TravelAnim.mode` is `warp | wormhole |
impulse`, and `warpTo`, `enterWormhole` and `flyToBody` all funnel through the
store's `startTravel` helper. Read the destination from `WarpResult.arrivedAt`,
never from the id you asked for — an unmapped wormhole picks its own.

### Deep-space hazards: unmapped wormholes and black holes

`enterUnstableWormhole` (warp.ts) is the second kind of wormhole: no fuel, no
tax, and a destination drawn from the seeded rng at the moment of entry. It
shares `flyTo` with `warp`, so arrival is settled identically.

A black hole is rolled inside `flyTo` (`blackHoleChance(distance)`, capped) and
resolved by `resolveBlackHole`, which burns days and — on a failed
`blackHoleEscapeChance` roll — leaves the ship at **zero hull and returns
`survived: false`**. It does *not* look at the escape pod: that is the store's
job in `finishTravel`, resolved exactly as a combat kill is
(`handleDestruction` + `gameOver`), so there is one death path, not two.
`blackHoleEvent(bh, escapedByPod)` turns it into a `GameEvent` the modal (or the
game-over screen, via `gameOverCause`) can show.

### Timed overlays (warp, mining)

Long real-time activities are driven by a `requestAnimationFrame` loop in an
overlay component, not by the engine. `<WarpTransition>` runs once per jump
(~10–30 s, not skippable). `<MiningOverlay>` loops: every ~30 s it calls
`mineTick()`, which extracts one unit via the pure `mineOnce(state, rng)` and may
surface a pirate `Encounter` (which clears `mining` and mounts `<CombatModal>`).
Keep the extraction/economy logic in the engine (`mining.ts`); the overlay only
owns the timer, progress bar, and stop button.

### Crew: stations, manning and incidents

`crew.ts` owns everything about who is aboard. Four stations (`CREW_ROLES`:
helm, guns, engineering, power) map to skills via `ROLE_SKILL`; `Skills` gained
an `electrician` field for the fourth. `assignRoles` greedily seats the best
hand at each station and any station left over is worked **double duty** by the
best qualified person at a penalty that eases the closer the ship is to its
`minCrew` — which is why a solo Flea pilot loses nothing (the hull's minimum is
1) while a solo Atlas pilot is crippled. `effectiveSkills` now reads straight
off those station ratings, so combat and repairs reflect the watch bill; only
`trader` is still a plain best-of-crew.

`crewLoad` (= `minCrew / crewCount`) drives `roleRisk`, and `rollCrewIncident`
turns a neglected station into a mishap — the electrical fire that costs a day,
some cargo and hull plate is the electrician's. `advanceDay(state, rng)` rolls
for one **only when given an rng**: pass it for days spent underway (warp,
mining), omit it for time that merely passes (`serveSentence`). It also applies
`crewRepairPerDay` (the engineering watch patching hull) and robot fuel draw.

Robots (`data/robots.ts`) are crew that cost like a ship, draw no wage, and
burn `ROBOT_FUEL_PER_DAY` each; on a dry tank `robotsPowered` is false and they
drop out of `crewHands` entirely while still holding their berth. Mercenaries
and robots both advertise a `profession`, and each planet's hiring hall
(`SolarSystem.mercenaryIds`, refreshed in `settleArrival` like the job board)
lists several candidates so a captain can hire the trade they are missing.

### Convoy escort contracts

`escort.ts` is the odd one out: the player makes **no** decisions during the
run. `runEscort` resolves the whole contract in one call — days, contacts,
auto-fought engagements (driving `resolveRound` with `'attack'`), arrival via
`settleArrival`, and payout via `completeEscort` — and returns an `EscortRun`
whose `legs[]` the `<EscortOverlay>` merely *replays* on a timer. Resolving
atomically (rather than per tick like mining) means a mid-run quit can never
strand the player between systems. Ship requirements live in `game.ts`
(`escortShipProblem`, military hull + `ESCORT_MIN_WEAPONS`/`ESCORT_MIN_SHIELDS`)
so `acceptBoardQuest` can gate on them without importing `escort.ts` — that
direction would be a cycle, since `escort.ts` imports `quests.ts`.

### Quests: job board + manual turn-in

Each `SolarSystem` carries a `questBoard: Quest[]`, regenerated on arrival
(`generateQuestBoard`) and seeded lazily for the start system in the store's
`ensureBoard`. The player accepts postings from the board (`acceptBoardQuest`)
and **hands quests in manually** at the destination — `warp` no longer completes
them. Use `canTurnIn(state, quest)` / `turnInQuest(state, id)` (bounties still
resolve via combat). Cargo-quest rewards go through `cargoReward`, which anchors
the payout to the goods' acquisition cost so a contract always beats trading.

**Contract cargo must be hauled in.** `state.sourcedHere` counts goods obtained
at the current planet — bought at its market (`buyGood`, `buyQuestSupplies`) or
mined at its site — and `clearLocalSourcing` wipes it on every arrival.
`deliverableUnits(state, good)` is `cargo − sourcedHere`, and `canTurnIn` uses it
so a contract can never be settled by shopping at its own delivery point (which
otherwise made `fetch` quests, whose target *is* the giver, free money). The
field is optional for save compatibility — always read it through
`deliverableUnits`.

**A planet awaiting a delivery has none to sell.** While an *active* contract's
`questSupply().good` is due at the current system, `isContractEmbargoed` reports
it and the market refuses to sell it (`marketBuyPrice` → 0, `buyGood` →
`error.contractEmbargo`, the row shows "needed here"). It is the story the
contract tells — the planet is short of the stuff — and it closes a trap the
ledger alone created: buying the goods at the delivery point spent real money on
cargo that could never settle the job. The ledger still matters, because a
player can buy *before* accepting the contract; the embargo only covers what is
already signed.

The ledger lives in **`engine/sourcing.ts`**, not `game.ts`: `crew.ts` has to
keep it straight too (its electrical fire burns cargo) and `game.ts` imports
`crew.ts`, so the helpers sit below both. `game.ts` re-exports them, so
`@game/index` is unchanged. Any code that **moves cargo** must pick a side:

- obtained here (market, mine) → `noteLocalSourcing`
- taken in space (salvage, plunder, loot, in-flight trade) → nothing
- **leaving the hold at this planet** (sold, dumped, seized, burnt) →
  `releaseLocalSourcing`, which retires the local units first. Skip it and
  selling back what you just bought silently strands cargo you really did haul
  in. `turnInQuest` is the exception: it consumes *deliverable* units, so the
  local ones legitimately stay on the books.

Related quest UX wired to the same engine helpers:

- `abandonQuest(state, id)` drops an active quest from the journal (no reward;
  goods already bought stay in the hold).
- The Quests nav tab shows a badge with `questsReadyToTurnIn(state).length`.
- On the star chart, quest-target markers render **dimmed** while
  `questSupplyMissing(state, quest) > 0` (supplies not yet in the hold) and
  bright once the player carries everything needed.
- The quest card's "buy supplies" shortcut buys the missing amount straight
  from the local market (`buyGood`) and is enabled only where the good is
  actually sold (`buyPrice > 0 && qty > 0`) with free cargo space.

### Planetary news

`engine/news.ts` builds each planet's feed from a weighted template pool whose
`when(sys)` predicates read the world's status, government, economy and special
resource — so the stories are *about* the planet, never generic filler. A world
in crisis always leads with the crisis. Ids only: a template's copy lives at
`news.<id>.headline` / `news.<id>.body` in both locales. The set is regenerated
in `settleArrival` and stored on `SolarSystem.news`.

### Standing (karma) and hired hunters

`reputation.ts` owns the whole karma model. `record.policeRecord` is the single
signed axis — negative is criminal notoriety, positive a defender's name — and
**every change to it goes through `applyKarma`**, which logs when the player
crosses into a new `standing()` tier. Never write `record.policeRecord` directly
outside that module. Quest hand-ins award `QUEST_KARMA[type]` (smuggling costs
karma, relief and bounty work earn it). `hunterChance` drives bounty-hunter
spawns in `rollEncounter` and covers **both** triggers — notoriety and a bank
loan past `BANK_BOUNTY_DEBT` — with `hunterEmployer` deciding whether the law or
the bank is paying (it changes the encounter's opening lines). The two ways out
are `payFine` (fast, expensive) and `serveSentence` (surrendering to a hunter:
days on the calendar plus a fine, contraband seized, record wiped).

### Combat: hull size, tractor beams, criticals

Combat compares `sizeRank` (from `data/ships.ts`) on both sides. `fleeChance`
gives smaller hulls an escape edge over heavier ones; `tractorChance` lets a
group of *bigger* hulls (or one that dwarfs the player) lock the player down —
while `enc.tractorLocked` is set, flee attempts only roll to break the lock and
attackers get `TRACTOR_ACCURACY_BONUS`. Hits roll separately for a critical
(`CRIT_MULTIPLIER`), and `applyDamage` returns a `DamageReport` so the log can
narrate shields absorbing, shields collapsing, and a crippled hull as distinct
messages. Pirates and hunters also push a demand line (`enc.demand`) that the
combat modal uses to label the surrender button.

### Exotic (resource-gated) goods

Goods whose `TradeGood.producedByResource` is set are bought only on the matching
special-resource planet and sold where wanted (complementary resource or hi-tech)
— see `standardPrice`/`sellablePrice` in `market.ts` and `isSpecialGood`. UI lists
filter them so they only show where tradeable. Any code that builds a goods
record must iterate `GOOD_IDS`, never hard-code the good keys.

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

`npm test` also runs `src/i18n/locales.test.ts`, which fails if `en.ts` and
`uk.ts` drift apart — either a missing key or a `{param}` that exists on only one
side. That is the enforcement behind golden rule 2.

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
- **Store changes need a dev restart.** Vite HMR does not re-run the Zustand
  `create()` closure, so edits to `gameStore.ts` actions (e.g. `warpTo`) may keep
  running the old implementation until `npm run dev` is restarted. If new UI
  behavior "doesn't take", restart dev before assuming a bug.
- **Packaging on Windows (`npm run dist`)** can fail while extracting
  electron-builder's `winCodeSign` cache with `Cannot create symbolic link: A
  required privilege is not held by the client` — that archive contains macOS
  symlinks Windows can't create without Developer Mode/admin. Workaround: manually
  extract the cached archive into `winCodeSign-2.6.0`, excluding the macOS folder,
  e.g. `7za x <cache>/winCodeSign/<hash>.7z -o<cache>/winCodeSign/winCodeSign-2.6.0
  -xr!darwin`, then re-run `npm run dist`. Code signing is skipped (no cert), so
  the produced installer is unsigned.

## Conventions

- Money is integer credits; format for display with `src/renderer/src/util/format.ts`.
- Prefer the `@game`, `@i18n`, `@shared`, and `@` path aliases over long
  relative imports — in the renderer. `main`/`preload` are bundled without alias
  config, so they reach `src/shared/` by relative path.
- Ship/good/government identifiers are lowercase camelCase string literal unions;
  keep new ids consistent and add matching locale keys.
- Every ship hull mounts at least one weapon, shield and gadget slot (a
  data-integrity test enforces this) — keep it that way when adding hulls.
- Prices that the UI must quote live in the engine as exported constants (e.g.
  `ESCAPE_POD_PRICE`), never hard-coded in components.
- Fuel capacity displays always use `maxFuel(ship)` (includes fuelCompactor
  gadgets), not raw `SHIP_TYPES[type].fuelTanks`.
