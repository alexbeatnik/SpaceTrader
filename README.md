![Space Trader — trade, explore, survive](docs/cover.png)

# Space Trader

A modern remake of the classic **Space Trader** (originally by Pieter Spronck for
Palm OS, later ported to Windows by Jay French). Built with **React +
TypeScript** and shipped to the **desktop** (Electron) and to **Android**
(Capacitor) from one codebase, with a clean sci-fi UI and full localization
(English by default, Ukrainian included).

> This is an *ambitious* remake: it keeps the spirit and economy model of the
> original while adding a modern interface, an interactive star map, and a
> testable, extensible game engine.

## Gameplay

You start alone in a second-hand **Flea**, one pulse laser, and 1000 credits. Trade
goods between solar systems, exploit local shortages and special resources, dodge
(or fight) pirates and police, upgrade your ship, and grow your fortune.

Core systems implemented:

- **Procedural galaxy** — 140 star systems with tech levels, governments, special
  resources, situational events (war, plague, drought…), and wormholes.
- **Systems you fly around inside** — each star has 2–7 places to dock at, drawn
  on their orbits around a coloured sun: the settled **capital planet** with the
  spaceport, the **uninhabited worlds** sharing its star (asteroid belts, gas
  giants, ice moons, lava and dust worlds — some worth mining, some just rock),
  and now and then an **orbital station**, marked in grey. A warp drive is dead
  weight this deep in a gravity well, so crossing the system is done on impulse:
  it costs **days**, not fuel, and out there you can still be intercepted.
- **Orbital stations** — research, naval and fabrication yards that build what no
  planet can: mass-driver railguns and singularity lances, barrier fields,
  nanofolded holds, quantum compactors, helm intelligences and battle computers.
  A fabrication yard also reinforces a hull far past a planetary dry dock and
  repairs at half price. They sell no cargo, no hulls and no berths — for that
  you go back down to the planet.
- **Planetary news** — every world runs its own feed, written from what is
  actually true of it. A drought on an agrarian world under a dictatorship reads
  nothing like one on a hi-tech democracy: the harvest is a write-off, the
  Governor orders every commune to pull together, and the ministry starts buying
  water in bulk from anyone who can haul it in. Refreshed on every arrival.
- **Dynamic market** — prices driven by tech level, **planet economy type**
  (agrarian, mining, industrial, energy, resort, hi-tech — e.g. food is cheap on
  agrarian worlds, machines dear), government preferences, special resources,
  events, and your Trader skill. Fuel price also varies by economy (cheap on
  energy worlds, expensive on resorts), with an optional auto-refuel-on-arrival.
- **Exotic special-resource goods** — each rich resource yields a unique
  commodity (rare gems, spring water, exotic pelts, artwork, war relics, …) that
  can only be bought at its source planet and sells at a premium where it's in
  demand (a complementary resource world, or hi-tech buyers).
- **Mining** — asteroid fields, ice fields, and gas giants can be mined in a
  timed operation (asteroids yield ore + rare gems, ice yields water, gas giants
  scoop fuel straight into the tank) — but raiders may jump an exposed operation.
- **Travel** — fuel-limited warp jumps across an interactive star chart, plus
  wormhole shortcuts. Each jump plays an animated **warp transition** you sit
  through — no skipping — with streaking stars, your ship, the distance and the
  day, so travel is never instantaneous.
- **Unmapped wormholes** — besides the surveyed pairs, some systems hold a hole
  in the floor with no charted far end. It costs no fuel and no tax, and where it
  puts you down is decided the moment you go in: anywhere on the map, next door
  or halfway across the galaxy. There is no way to aim it.
- **Black holes** — a leg can stray into a singularity nobody had charted. There
  is nothing to shoot and nothing to bargain with: the helm either drags the ship
  back over the lip of the well or it does not. Survive and you lose hull plate
  and days to a clock that was not yours; fail, and the escape pod is the only
  thing that comes back — if you bought one.
- **Star chart** — interactive map with a fuel-range ring, wormhole links, and
  **pulsing markers on active quest destinations** (with where each job was taken
  and its reward). A marker glows **dim** while you lack the goods needed for
  that job's hand-in, and bright once your hold has everything required.
- **Encounters & combat** — turn-based fights that can be a lone ship or a whole
  group: **pirate ambushes** (up to 5 ships) and **trader caravans** you fight
  through one ship at a time, each dropping loot when destroyed. Police
  inspections (submit / bribe / flee / fight), a **trader marketplace** to buy and
  sell with lone traders, plus **bounty hunters** who come for wanted commanders
  and rare, deadly **alien raiders**. Plunder, escape pods, and opponents that
  scale with your wealth, combat reputation, and criminal record. Blow-by-blow
  combat logs call out **critical hits**, shields soaking a volley, shields
  collapsing, and a hull breached and venting.
- **Hull size matters** — a small ship **outruns** a heavier one, but a pack of
  big hulls can pin it in a **tractor beam**: while the lock holds there is no
  escape and you are an easier target, until you overload the emitters and slip
  free.
- **Surrender terms** — pirates size up your hold and name the cargo they came
  for; give it up and they strip the hold and let you fly on. Bounty hunters want
  *you*: standing down means days in a cell and a fine — but you come out with a
  **clean record**.
- **Standing & bounty hunters** — the galaxy files you somewhere between
  **Outlaw** and **Champion of justice**. Smuggling runs blacken the record;
  relief missions, pirate bounties and clean inspections redeem it. Go notorious
  — *or* leave a bank loan unpaid — and hunters are hired to collect, better
  armed the bigger the payday. Buy the record clean with a **large fine** at the
  bank (the bank calls its own collectors off only when the debt is paid).
- **Crew, stations & incidents** — you start alone in a **Flea**, the only hull
  certified for single-handed flight; everything bigger needs a real crew, up to
  **10 hands on a capital ship**. Four stations must be manned — **helm, guns,
  engineering and power** — and the crew sorts itself onto the posts it is best
  at. Leave one unmanned and somebody works **double duty** at half effect, which
  is when things start going wrong: an **electrical fire** costs a day adrift,
  burnt cargo and hull plate; a loose mounting chews through the hull; a sloppy
  plot wastes fuel; an unattended gun bay fires into your own frame. A
  well-manned engineering watch **patches the hull every day** you fly.
- **Crew & mercenaries** — every planet's **hiring hall** lists several of the
  **26 named mercenaries**, each advertising a trade (pilot, gunner, mechanic,
  electrician, trader or generalist) so you can hire the specialist you are
  missing. Each draws a daily wage.
- **Android crew** — five robot models that cost as much as a good ship and
  never ask to be paid, but whose power cells **burn fuel every day** — run the
  tank dry and they go dormant mid-flight.
- **Quests & job board** — every planet has a **job board** of assignments in
  varied sizes (small runs to bulk freighter contracts) across **seven types**:
  courier deliveries, relief missions, bounty hunts, VIP **passenger** transport,
  high-risk **smuggling** runs, **supply contracts**, and **convoy escort** duty.
  Contract cargo must be **hauled in** — buying it at the delivery point does not
  count. Buy the required goods
  on the spot when accepting (or later, via the **buy-supplies shortcut** on the
  job card — active wherever the goods are actually sold), track coloured
  have/need progress, then **hand jobs in manually** at the destination for a
  reward that always beats plain trading. A **badge on the Quests tab** counts
  the jobs you can hand in right here, and any assignment can be **abandoned**
  at any time.
- **Convoy escort** — sign on as gun cover for a merchant convoy (military hull
  with two weapons and a shield required). It plays as one long haul: convoy
  command decides every engagement — raiders get engaged, patrols waved through,
  traders left alone — while you watch the run unfold leg by leg and collect a
  contract fee plus danger pay for everything you shoot down.
- **Market contract hints** — the commodity table shows what your active
  contracts still need and how much of it you already carry, so you can stock up
  before you leave.
- **Special events** — one-off events on quiet arrivals: derelicts, fuel leaks,
  micrometeorites, ion storms, tolls, lotteries, news tips, veteran instructors,
  friendly convoys, refugees, colony rewards, and ancient alien probes.
- **Economy** — bank loans with daily interest, ship insurance with no-claim
  discount.
- **Shipyard & modules** — **24 ship types** from the nimble Flea scout to the
  elite Widow flagship, five planet-built laser tiers (plus two station-built),
  three shield tiers (plus the station barrier field), seven gadgets
  (extra bays, fuel compactor, hidden compartment, cloaking, …), refuel/repair,
  **hull-reinforcement upgrades** (+HP), escape pods, and sell-back of installed
  equipment. Every hull mounts at least one weapon, shield and gadget slot, so
  any ship can be outfitted — even the humble Flea.
- **Ship art** — every hull has its own hand-built SVG silhouette, shown in the
  ship view, shipyard, combat, and the warp animation.
- **Save slots** — **six named slots plus an autosave**. The autosave is
  rewritten after every action you take, so closing the game (or crashing) never
  costs more than nothing; the six manual slots are yours to snapshot a run
  before a risky jump, or to keep several commanders going at once. Each slot
  card shows the commander, day, credits, ship, system and the time it was
  written. Save, load and delete from the **Saves** tab in game or from the main
  menu.
- **i18n** — English and Ukrainian, switchable at runtime.

## Screenshots

| | |
| :---: | :---: |
| ![The system map](docs/screenshots/system-map.png) **System map** — the capital planet, its uninhabited neighbours and the odd station, on their orbits around the star | ![The planet dossier](docs/screenshots/planet.png) **Planet** — tech level, government, economy and a news feed written from what is true of the world |
| ![The commodity market](docs/screenshots/market.png) **Market** — buy and sell prices, illegal goods, and what your contracts still need | ![The star chart](docs/screenshots/star-chart.png) **Star chart** — 140 systems, wormhole links and a fuel-range ring |
| ![The shipyard](docs/screenshots/shipyard.png) **Shipyard** — fuel, repairs, hull reinforcement, weapons, shields and gadgets | ![The job board](docs/screenshots/quests.png) **Quests** — a job board on every planet, across seven contract types |
| ![The ship view](docs/screenshots/ship.png) **Ship** — fittings, commander skills, crew and standing, with a hand-built silhouette per hull | ![The main menu](docs/screenshots/menu.png) **Main menu** — name your commander and pick a language |

## Installing & updating (Windows)

Download `SpaceTrader-<version>-setup.exe` from the
[Releases](https://github.com/alexbeatnik/SpaceTrader/releases) page and run it.

**The game updates itself.** It checks its GitHub releases on start-up,
downloads a newer version quietly in the background, and installs it the next
time you quit — nothing to download or reinstall by hand. The **About** tab
shows what it is doing and can apply a ready update straight away.

If you would rather update manually, just run the new installer:

- **Do not uninstall the old version first.** The installer finds the previous
  install and replaces it in place. Uninstalling first only costs you time.
- **Your saves are kept.** They live in
  `%APPDATA%\space-trader\saves\` — your user profile, not the program folder —
  so updating never touches them. Uninstalling leaves them alone too, which
  means reinstalling later picks your commander back up. Coming from a build
  that still called itself *Star Trader*? The first launch copies your saves
  over from `%APPDATA%\star-trader\saves\` and leaves the originals there.
- The installer is **per-user** and needs no administrator rights. It installs
  to `%LOCALAPPDATA%\Programs` by default; you can point it elsewhere.
- The build is **unsigned** (no code-signing certificate), so Windows
  SmartScreen may warn on first run — *More info → Run anyway*.

To remove the game, use *Settings → Apps → Space Trader*. If you also want the
saves gone, delete `%APPDATA%\space-trader\` by hand.

## Installing (Android)

Download `SpaceTrader-<version>-debug.apk` from the
[Releases](https://github.com/alexbeatnik/SpaceTrader/releases) page, copy it to
your phone and open it. Android will ask you to allow installs from your browser
or file manager the first time.

**This is a debug-signed build**, not a Play Store one: it carries the standard
Android debug key and is marked debuggable, so treat it as a sideload for
yourself rather than something to hand around. There is no Play listing yet.

The game runs in both orientations and lays itself out for each: upright the
navigation sits along the bottom under your thumb, on its side it moves to a
two-column rail so all twelve destinations stay visible at once. The hardware
back button steps back one screen at a time and will not interrupt a fight, a
jump or a contract offer.

**Saves live in the app's private storage** and use the same format as the
desktop, so a file copied across is readable by either. Uninstalling deletes
them — there is no cloud sync. The app does not update itself on Android; that
is the store's job, and there is no store listing yet, so new versions mean a
new APK.

## Tech stack

| Layer      | Choice                                   |
| ---------- | ---------------------------------------- |
| Desktop    | Electron 33                              |
| Mobile     | Capacitor 7 (Android)                    |
| UI         | React 19 + TypeScript                    |
| Build      | electron-vite (desktop) + Vite 5 (mobile)|
| State      | Zustand                                  |
| Engine     | Pure TypeScript, no UI dependencies      |
| Tests      | Vitest                                   |

## Project structure

```
src/
  main/        Electron main process (window + save-slot IPC)
  preload/     Context-bridge API exposed to the renderer
  shared/      Save format, write-ordering queue and update states, shared by
               every host
  game/        Pure game engine (no React/Electron imports)
    data/      Static data: goods, ships, equipment, stations, governments,
               economies, names
    engine/    Types, RNG, galaxy, location, system travel, market, travel,
               combat, warp, mining, news, events, quests, game actions
  i18n/        Locale dictionaries (en, uk) + translation helpers
  renderer/    React app
    src/
      components/  HUD, nav, toast, ship art, warp transition, mining overlay,
                   modals (combat, event, quest offer/complete, amount, game over)
      screens/     Menu, System Map, Planet, Market, Shipyard, Bank, Crew,
                   Quests, Star Chart, Ship, Log, Saves
      store/       Zustand store wiring the engine to the UI
      platform/    Host abstraction: saves and updates, per platform
android/       Capacitor's native Android project
assets/        Source art for the generated launcher icons and splashes
build/         App icon (icon.png / icon.ico) for packaging
```

The **engine is fully decoupled** from the UI: it takes and mutates a plain
`GameState` object and returns typed results, which makes it unit-testable and
portable.

The **renderer is decoupled from its host** the same way. Everything that
differs between Electron and Android — where saves are written, whether the app
can update itself — is named in `renderer/src/platform/` and answered once per
platform; no screen or store action knows which shell it is running in.

## Development

```bash
npm install        # install dependencies
npm run dev        # launch the desktop app with hot reload
npm run typecheck  # type-check main + renderer
npm test           # run engine unit tests
npm run build      # production desktop build into out/
npm run dist       # package a distributable (electron-builder)
```

Requires Node.js 18+.

`npm run dist` produces `release/SpaceTrader-<version>-setup.exe`. The installer's
welcome page — the one that tells a returning player not to uninstall the old
version first — lives in [build/installer.nsh](build/installer.nsh); everything
else about the installer is the `build.nsis` block of `package.json`.

### Android

```bash
npm run dev:web    # the renderer in a browser, on Capacitor's web shims
npm run build:web  # static bundle into dist-web/
npm run apk        # build:web + cap sync + assembleDebug
```

`npm run apk` needs a **JDK 17+** on `JAVA_HOME` and an Android SDK — put its
path in `android/local.properties` as `sdk.dir=...` (gitignored, so it is
per-machine). Android Studio provides both; command-line tools alone are enough.
The APK lands in `android/app/build/outputs/apk/debug/`.

Neither is needed to contribute: `.github/workflows/android.yml` builds the APK
on branch pushes and pull requests and attaches it to the run (`release.yml`
builds it again for the release itself), and `npm run dev:web` gives you the
mobile layout in a browser with no toolchain at all — narrow the window under
860px for the portrait layout, or make it shorter than 560px and wider than it
is tall for the landscape one.

The version comes from `package.json` in both directions: Gradle reads it for
`versionName`, and derives `versionCode` as `major*10000 + minor*100 + patch`.

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
