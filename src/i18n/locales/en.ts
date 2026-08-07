// English locale — the primary one: the default on a fresh install and the
// fallback for any key a translation is missing.
export const en = {
  app: {
    title: 'Space Trader',
    subtitle: 'A modern remake of Pieter Spronck\'s Palm OS classic'
  },
  common: {
    credits: 'credits',
    cr: 'cr',
    buy: 'Buy',
    sell: 'Sell',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    back: 'Back',
    all: 'All',
    max: 'Max',
    none: 'none',
    yes: 'Yes',
    no: 'No',
    day: 'Day',
    qty: 'Qty',
    price: 'Price',
    total: 'Total',
    profit: 'Profit',
    parsecs: 'parsecs',
    pc: 'pc'
  },
  nav: {
    system: 'Planet',
    systemMap: 'System',
    market: 'Market',
    shipyard: 'Shipyard',
    bank: 'Bank',
    crew: 'Crew',
    quests: 'Quests',
    chart: 'Star Chart',
    ship: 'Ship',
    log: 'Log',
    saves: 'Saves',
    about: 'About'
  },
  update: {
    title: 'Updates',
    blurb:
      'Space Trader keeps itself up to date from its GitHub releases. A new version downloads quietly in the background and installs the next time you quit — you never have to reinstall anything by hand.',
    idle: 'Not checked yet.',
    checking: 'Checking for updates…',
    current: 'You are on the latest version.',
    available: 'Version {version} found — downloading…',
    downloading: 'Downloading… {percent}%',
    ready: 'Version {version} is ready. It installs when you quit, or restart now.',
    error: 'Could not check for updates. Check your connection and try again.',
    unsupported: 'Updates only apply to an installed copy — this build runs from source.',
    check: 'Check for updates',
    restart: 'Restart and install'
  },
  about: {
    title: 'About Space Trader',
    lead: 'Buy low, sell high, dodge pirates, and work your way up from a second-hand Flea to a ship worth fearing.',
    inspirationTitle: 'What inspired it',
    inspiration:
      'The original Space Trader was written by Pieter Spronck for Palm OS, and later ported to Windows by Jay French. Their design is what this project set out to honour: an economy driven by tech levels and local shortages, encounters that can ruin a good run, and the slow climb through better and better hulls.',
    ownTitle: 'An independent interpretation',
    own:
      'This is not a port, and it shares no code with the originals — every system here was written from scratch. It also takes its own liberties: crew stations that go wrong when nobody mans them, warp and mining you sit through in real time, a job board on every planet, convoy escort contracts, and a standing the galaxy files you under, somewhere between outlaw and champion of justice.',
    freeTitle: 'Free, and free to inspect',
    free:
      'Space Trader is free. There is nothing to buy, no accounts, and no telemetry — it runs entirely on your own machine, and your saves never leave it. The full source is published under the Apache-2.0 licence, so anyone can read it, build it, or fork it.',
    repoTitle: 'Source code',
    repo: 'Bug reports, ideas and pull requests are all welcome on GitHub.',
    openRepo: 'Open the repository on GitHub',
    authorLabel: 'Author',
    licenseLabel: 'Licence',
    disclaimer:
      'A fan project, made for love of the original. Not affiliated with, nor endorsed by, the authors of the games that inspired it.'
  },
  saves: {
    title: 'Saved games',
    subtitle: 'Six slots of your own, plus the autosave the game keeps for you.',
    loadGame: 'Load game',
    autoSlot: 'Autosave',
    autoHint: 'Kept up to date automatically as you play.',
    slot: 'Slot {n}',
    empty: 'Empty',
    corrupt: 'Damaged save file',
    loading: 'Reading saves…',
    save: 'Save',
    load: 'Load',
    delete: 'Delete',
    saved: 'Game saved to slot {slot}.',
    saveFailed: 'Could not write the save file.',
    autosaveFailed: 'Autosave failed — your progress is not being written to disk.',
    autosaveRecovered: 'Autosave is working again.',
    unknownTime: 'date unknown',
    confirm: {
      save: 'Overwrite?',
      load: 'Load this save?',
      delete: 'Delete this save?'
    }
  },
  quest: {
    title: 'Quests',
    active: 'Active',
    done: 'Completed',
    none: 'You have no assignments. Explore systems to be offered some.',
    offerTitle: 'Special Assignment',
    accept: 'Accept',
    decline: 'Decline',
    acceptAndBuy: 'Accept & buy supplies',
    supplies: 'Supplies needed',
    reward: 'Reward',
    board: 'Job board',
    boardEmpty: 'No postings here right now.',
    turnIn: 'Hand in',
    abandon: 'Abandon',
    buySupplies: 'Buy supplies',
    rewardTitle: 'Assignment complete!',
    readyToast: 'You can hand in {count} assignment(s) here — open Quests.',
    viaCombat: 'destroy in combat',
    sourceElsewhere:
      'Contract cargo must be hauled in — goods bought on this planet do not count towards the delivery.',
    beginEscort: 'Take up escort station',
    escortRequirements: 'Military hull, {weapons} weapons and {shields} shield fitted.',
    escortHint: 'Convoy command runs the engagements — you fly the guns.',
    type: {
      delivery: 'Courier delivery',
      relief: 'Relief mission',
      bounty: 'Bounty hunt',
      passenger: 'Passenger transport',
      smuggle: 'Smuggling run',
      fetch: 'Supply contract',
      escort: 'Convoy escort'
    },
    desc: {
      delivery: 'Deliver a package to the {system} system.',
      relief: 'Deliver {amount} × {good} to {system}, a system in crisis.',
      bounty: 'Track down and destroy the pirate {bounty} (headed for {system}).',
      passenger: 'Transport {passenger} safely to the {system} system.',
      smuggle: 'Smuggle {amount} × {good} past the patrols to {system}.',
      fetch: 'Source {amount} × {good} and bring it back to {system}.',
      escort: 'Fly gun cover for a convoy bound for {system}.'
    },
    accepted: 'Assignment accepted — reward {reward} cr.',
    abandoned: 'Assignment abandoned.',
    completed: 'Assignment completed — reward {reward} cr.',
    completedToast: 'Assignment complete! +{reward} cr',
    takenAt: 'Taken at {system}',
    destination: 'Destination'
  },
  crew: {
    title: 'Crew',
    wages: 'Daily wages',
    quarters: 'Free berths',
    hired: 'Aboard',
    noneHired: 'Nobody aboard but you',
    commanderSkills: 'Effective skills (with crew)',
    roster: 'Hiring hall',
    noneAvailable: 'Nobody is looking for a berth here',
    hire: 'Hire',
    fire: 'Dismiss',
    noQuarters: 'No free berths',
    aboard: 'Hands aboard',
    minimum: 'minimum',
    recommended: 'recommended',
    stations: 'Watch bill',
    station: 'Station',
    manning: 'Manned by',
    strength: 'Rating',
    commander: 'You',
    unmanned: 'Nobody',
    doubleDuty: 'double duty',
    dormant: 'dormant',
    noWage: 'no wage',
    repair: 'Running repairs',
    repairRate: 'Running repairs: {hp} hull/day',
    hpPerDay: 'hull/day',
    wellManned: 'Every station is manned. The crew keeps the ship patched up as you fly.',
    undercrewed:
      'Short-handed: each hand is carrying {load}× a normal watch. Expect things to go wrong.',
    robotDealer: 'Android crew',
    noRobots: 'No androids sold at this tech level',
    robotHint:
      'Androids never draw a wage, but their cells burn {fuel} fuel a day each — and a dry tank leaves them dormant.',
    risk: {
      title: 'Risk',
      low: 'low',
      medium: 'watch it',
      high: 'high'
    },
    incident: {
      blame: 'Cause: the {role} station was not properly manned.',
      fire: {
        title: 'Electrical fire',
        body: 'A power conduit went up. You spent a day adrift fighting the fire: {qty} × {good} burned and the hull took {dmg} damage.',
        bodyNoCargo: 'A power conduit went up. You spent a day adrift fighting the fire; the hull took {dmg} damage.'
      },
      breakdown: {
        title: 'Mechanical failure',
        body: 'A mounting worked loose and chewed through {dmg} points of hull before anyone noticed.'
      },
      misjump: {
        title: 'Sloppy plot',
        body: 'A botched course correction wasted {lost} pc of fuel.'
      },
      misfire: {
        title: 'Weapon misfire',
        body: 'An unattended weapon bay discharged into your own frame: {dmg} hull damage and the shields are flat.'
      }
    }
  },
  role: {
    pilot: 'Helm',
    gunner: 'Guns',
    mechanic: 'Engineering',
    electrician: 'Power'
  },
  profession: {
    pilot: 'Pilot',
    gunner: 'Gunner',
    mechanic: 'Mechanic',
    electrician: 'Electrician',
    trader: 'Trader',
    generalist: 'Generalist'
  },
  robot: {
    helm: 'Helm android',
    gunner: 'Gunnery android',
    wrench: 'Maintenance android',
    spark: 'Power-systems android',
    utility: 'Utility android'
  },
  merc: {
    alyssa: 'Alyssa', bran: 'Bran', cyra: 'Cyra', dex: 'Dex', elin: 'Elin',
    ferro: 'Ferro', gwen: 'Gwen', hoshi: 'Hoshi', ivo: 'Ivo', juno: 'Juno',
    kai: 'Kai', lena: 'Lena', mira: 'Mira', nox: 'Nox', orin: 'Orin', pax: 'Pax',
    quen: 'Quen', rhea: 'Rhea', sol: 'Sol', tavi: 'Tavi', ulf: 'Ulf',
    vera: 'Vera', wren: 'Wren', xara: 'Xara', yuki: 'Yuki', zane: 'Zane'
  },
  event: {
    derelict: {
      title: 'Derelict ship',
      body: 'You board a drifting derelict and salvage {qty} × {good} from its holds.',
      log: 'Salvaged a derelict: +{qty} {good}.'
    },
    fuelLeak: {
      title: 'Fuel leak',
      body: 'A hairline crack in the tank cost you {lost} pc of fuel.',
      log: 'Fuel leak: -{lost} pc.'
    },
    micrometeorite: {
      title: 'Micrometeorite swarm',
      body: 'Your hull took {dmg} damage from a micrometeorite swarm.',
      log: 'Micrometeorites: -{dmg} hull.'
    },
    lottery: {
      title: 'Unexpected windfall',
      body: 'You won {prize} cr in the galactic lottery!',
      log: 'Lottery win: +{prize} cr.'
    },
    toll: {
      title: 'Toll gate',
      body: 'A local checkpoint charged a {toll} cr passage toll.',
      log: 'Paid a toll: -{toll} cr.'
    },
    newsTip: {
      title: 'Fresh news',
      body: 'The papers report: {system} is experiencing {status}. A trading opportunity may await.'
    },
    wanderer: {
      title: 'Wandering expert',
      body: 'A seasoned engineer shared some tricks. Your Engineer skill rose by 1.',
      log: 'Wandering expert: +1 Engineer.'
    },
    ionStorm: {
      title: 'Ion storm',
      body: 'An ion storm battered your hull for {dmg} damage.',
      log: 'Ion storm: -{dmg} hull.'
    },
    skillTrainer: {
      title: 'Veteran instructor',
      body: 'A retired ace drilled you hard. Your {skill} skill rose by 1.',
      log: 'Trained by a veteran: +1 {skill}.'
    },
    merchantConvoy: {
      title: 'Friendly convoy',
      bodyGoods: 'A passing convoy shared surplus stock: {qty} × {good}.',
      bodyCredits: 'A passing convoy paid {gift} cr for your navigation charts.',
      logGoods: 'Convoy gift: +{qty} {good}.',
      logCredits: 'Convoy gift: +{gift} cr.'
    },
    refugees: {
      title: 'Refugees',
      body: 'You gave stranded refugees {aid} cr for passage. Your reputation grew.',
      log: 'Helped refugees: -{aid} cr, +1 reputation.'
    },
    bountyPayout: {
      title: 'Grateful colony',
      body: 'A colony you once protected rewarded you with {reward} cr.',
      log: 'Colony reward: +{reward} cr.'
    },
    ancientProbe: {
      title: 'Ancient probe',
      body: 'You recovered a derelict alien probe and sold its tech for {value} cr.',
      log: 'Alien probe sold: +{value} cr.'
    },
    blackHole: {
      title: 'Singularity',
      warning: 'Nothing on the charts. The instruments simply stop reporting a direction.',
      bodySurvived:
        'A black hole nobody had charted takes hold of the ship. The helm burns everything the drives have and drags you back over the lip of the well — {dmg} hull gone to tidal stress, {days} day(s) lost to a clock that was not yours. The odds were {chance}%.',
      bodyLost:
        'A black hole nobody had charted takes hold of the ship. There is no angle left to run at. The last of the hull goes as the horizon closes over you, and the stars behind smear into a ring and go out.',
      bodyPod:
        'A black hole nobody had charted takes hold of the ship. There is no angle left to run at — and no time to argue with it. The pod fires clear a heartbeat before the hull goes, and you watch your ship stretch into a thread of light and vanish.',
      logSurvived: 'Pulled clear of a singularity: -{dmg} hull, {days} day(s) lost.',
      logLost: 'The ship crossed the horizon of an uncharted singularity.'
    }
  },
  menu: {
    newGame: 'New Game',
    continue: 'Continue',
    settings: 'Settings',
    commanderName: 'Commander name',
    startGame: 'Start the journey',
    language: 'Language',
    difficulty: 'Difficulty',
    tagline: 'Trade. Explore. Survive among the stars.'
  },
  hud: {
    credits: 'Credits',
    debt: 'Debt',
    fuel: 'Fuel',
    hull: 'Hull',
    cargo: 'Cargo',
    day: 'Day',
    shields: 'Shields'
  },
  system: {
    techLevel: 'Tech level',
    government: 'Government',
    economy: 'Economy',
    resource: 'Special resource',
    status: 'Situation',
    police: 'Police',
    pirates: 'Pirates',
    traders: 'Traders',
    wormhole: 'Wormhole',
    unstableWormhole: 'Unmapped wormhole',
    unstableWormholeHint:
      'It goes somewhere. Nobody has ever established where until they were already there.',
    enterWormhole: 'Fall into it',
    hereNow: 'You are here',
    noSpecialResource: 'Ordinary resources',
    news: 'Planetary news',
    noNews: 'The feeds are quiet today.',
    openSystemMap: 'System map'
  },
  body: {
    kind: {
      planet: 'Settled world',
      barren: 'Uninhabited',
      station: 'Station'
    },
    terrain: {
      asteroidBelt: 'Asteroid belt',
      gasGiant: 'Gas giant',
      iceMoon: 'Ice moon',
      rockyMoon: 'Rocky moon',
      lavaWorld: 'Volcanic world',
      dustWorld: 'Dust world'
    },
    capital: 'Capital planet',
    barrenBlurb: 'No port, no market, nobody. Whatever is here has to be dug out.',
    noMine: 'Nothing here is worth the fuel to extract.',
    numeral: {
      1: 'I',
      2: 'II',
      3: 'III',
      4: 'IV',
      5: 'V',
      6: 'VI',
      7: 'VII',
      8: 'VIII'
    }
  },
  station: {
    science: 'Research Station',
    military: 'Naval Yard',
    engineering: 'Fabrication Yard',
    short: {
      science: 'Research',
      military: 'Naval',
      engineering: 'Fabrication'
    },
    blurb: {
      science:
        'Deep-space physics, sensors and navigation. Everything here was built by people who do not have to explain themselves to a planetary licensing board.',
      military:
        'Weapons research, run at a distance from anything inhabited. The guns fitted here are not sold on any world.',
      engineering:
        'Heavy fabrication in free fall: holds, drives and hull plate, made to tolerances no ground-side dry dock can hold.'
    },
    catalog: 'Station catalogue',
    nothing: 'This yard builds nothing of that kind.',
    grade: 'Station grade',
    onlyHere: 'Sold at stations only',
    hullUpgrades: 'Fits hull reinforcement up to {max}',
    repairDiscount: 'Hull repairs at {percent}% of a planetary yard',
    noMarket: 'No market, bank or hiring hall — that is what the planet is for.'
  },
  systemMap: {
    title: 'System map',
    bodies: '{count} bodies',
    star: '{class} star',
    orbit: 'Orbit {n}',
    dockedHere: 'Docked here',
    select: 'Pick somewhere in this system',
    setCourse: 'Set course',
    transit: '{days} day(s) under impulse',
    noWarp:
      'A warp drive is dead weight this deep in a gravity well. Crossing the system is done on impulse, and impulse takes days.',
    toChart: 'Leave the system',
    services: 'What is here',
    service: {
      market: 'Commodity market',
      shipyard: 'Shipyard',
      bank: 'Bank',
      hall: 'Hiring hall',
      board: 'Job board',
      mine: 'Mineable: {resource}',
      stationCatalog: 'Station catalogue',
      none: 'Nothing but the view'
    },
    arrived: 'Docked after {days} day(s).',
    awayFromPort: 'You are away from the spaceport — {place}.',
    returnToPort: 'Return to the planet'
  },
  market: {
    title: 'Spaceport — Commodity Market',
    good: 'Commodity',
    available: 'Available',
    buyPrice: 'Buy price',
    sellPrice: 'Sell price',
    inHold: 'In hold',
    avgPrice: 'Avg price',
    notSold: 'not sold',
    embargo: 'needed here',
    embargoHint: 'This planet is waiting on your delivery of it — there is none to buy. Bring it in from elsewhere.',
    notWanted: 'not wanted',
    illegal: 'illegal good',
    emptyHold: 'Your cargo hold is empty',
    buyAmount: 'How much {good} to buy?',
    sellAmount: 'How much {good} to sell?',
    questNeed: 'Contracts',
    questNeedHint: 'Units your active contracts call for, and how many you already carry.',
    questNeedFor: 'Wanted at: {systems}'
  },
  shipyard: {
    title: 'Shipyard',
    fuel: 'Fuel',
    fuelPrice: 'Fuel price',
    repair: 'Hull repair',
    refuelFull: 'Fill the tank',
    autoRefuel: 'Auto-refuel on arrival',
    hullUpgrade: 'Hull reinforcement',
    buyHullUpgrade: 'Reinforce hull (+{amount} HP)',
    hullUpgradeMax: 'Hull fully reinforced',
    repairFull: 'Full repair',
    buyFuel: 'Buy fuel',
    weapons: 'Weapons',
    shields: 'Shields',
    gadgets: 'Gadgets',
    escapePod: 'Escape pod',
    ships: 'Ships',
    tradeIn: 'Trade-in',
    netPrice: 'Net price',
    slotsFull: 'No free slots',
    buyEscapePod: 'Buy escape pod',
    hasEscapePod: 'Escape pod installed',
    equip: 'Install',
    cargoBaysGadget: '+5 cargo bays',
    installed: 'Installed modules'
  },
  bank: {
    title: 'Galactic Bank',
    loan: 'Loan',
    debt: 'Current debt',
    maxLoan: 'Available',
    getLoan: 'Take loan',
    payDebt: 'Pay debt',
    interest: 'Interest: 10% per day',
    insurance: 'Insurance',
    insuranceActive: 'Insurance active',
    insuranceInactive: 'No insurance',
    noClaim: 'No-claim discount',
    buyInsurance: 'Buy insurance',
    cancelInsurance: 'Cancel insurance',
    needPod: 'Requires an escape pod'
  },
  record: {
    title: 'Standing & record',
    standing: 'Known as',
    notoriety: 'Notoriety',
    reputation: 'Combat reputation',
    clean: 'Your record is clean. No one is hunting you.',
    wantedLaw: '⚠ Wanted: the law has hunters on your trail.',
    wantedBank: '⚠ The bank has hired collectors over your unpaid loan of {debt} cr.',
    payFine: 'Buy your record clean ({amount} cr)',
    fineHint:
      'Paying the fine wipes your criminal record and calls off the hunters the law sent. The bank calls off its own only when the debt is paid.',
    sentenceHint: 'If a hunter takes you in instead: {days} days in a cell.'
  },
  standing: {
    outlaw: 'Outlaw',
    criminal: 'Criminal',
    rogue: 'Rogue',
    citizen: 'Citizen',
    trusted: 'Trusted trader',
    defender: 'Defender',
    champion: 'Champion of justice'
  },
  chart: {
    title: 'Star Chart',
    range: 'Range',
    distance: 'Distance',
    fuelNeeded: 'Fuel needed',
    warp: 'Warp jump',
    inRange: 'In range',
    outOfRange: 'Out of range',
    selectTarget: 'Select a destination system',
    viaWormhole: 'Via wormhole',
    wormholeTax: 'Wormhole tax',
    unvisited: 'Unexplored',
    questHere: 'Assignment target',
    priceTable: 'Prices & profit per unit',
    buyCol: 'Buy',
    sellCol: 'Sell',
    margin: 'Profit/u',
    marginHint: 'Profit per unit: buy at your current system, sell here.'
  },
  warp: {
    jumping: 'Warp jump in progress',
    impulse: 'Crossing the system on impulse',
    wormhole: 'Falling through the wormhole',
    skip: 'Skip'
  },
  escort: {
    title: 'Convoy escort',
    leg: 'Leg {leg}/{total}',
    legs: '{legs} legs',
    kills: 'Attackers destroyed',
    damage: 'Hull damage taken',
    legQuiet: 'Leg {leg}: empty space. The convoy holds formation.',
    contact: 'Leg {leg}: contact — {kind}.',
    order: {
      engage: 'Convoy command: "Escort, break and engage!"',
      holdFire: 'Convoy command: "Hold fire — they are just traders."',
      standDown: 'Convoy command: "Patrol check. Stand down, the convoy has clearance."'
    },
    shieldsRecharged: 'The convoy tender tops your shields back up.',
    arrived: 'The convoy docks at {system}. Contract fulfilled.',
    dangerPay: 'Danger pay: {amount} cr.',
    lost: 'Your ship is gone. The convoy scatters without its escort.',
    failed: 'The convoy escort to {system} ended in disaster.'
  },
  mining: {
    start: 'Mine',
    stop: 'Stop mining',
    yields: 'Yields {resource}',
    extracting: 'Extracting {resource}',
    session: 'Extracted',
    raid: 'Raiders jumped your mining operation!',
    kind: {
      asteroidField: 'Asteroid field',
      gasGiant: 'Gas giant',
      iceField: 'Ice field'
    }
  },
  ship: {
    title: 'Your ship',
    type: 'Type',
    class: 'Class',
    hull: 'Hull strength',
    fuelTank: 'Fuel tank',
    cargoBays: 'Cargo bays',
    weapons: 'Weapons',
    shields: 'Shields',
    gadgets: 'Gadgets',
    crew: 'Crew',
    escapePod: 'Escape pod',
    skills: 'Commander skills',
    empty: 'empty'
  },
  skill: {
    pilot: 'Pilot',
    fighter: 'Fighter',
    trader: 'Trader',
    engineer: 'Engineer',
    electrician: 'Electrician'
  },
  good: {
    water: 'Water',
    furs: 'Furs',
    food: 'Food',
    ore: 'Ore',
    games: 'Games',
    firearms: 'Firearms',
    medicine: 'Medicine',
    machines: 'Machines',
    narcotics: 'Narcotics',
    robots: 'Robots',
    gems: 'Rare gems',
    springWater: 'Spring water',
    delicacies: 'Delicacies',
    pelts: 'Exotic pelts',
    mushrooms: 'Exotic mushrooms',
    herbs: 'Medicinal herbs',
    artwork: 'Artwork',
    relics: 'War relics'
  },
  shipType: {
    flea: 'Flea',
    gnat: 'Gnat',
    ant: 'Ant',
    dragonfly: 'Dragonfly',
    ladybird: 'Ladybird',
    firefly: 'Firefly',
    mosquito: 'Mosquito',
    weevil: 'Weevil',
    locust: 'Locust',
    moth: 'Moth',
    bumblebee: 'Bumblebee',
    beetle: 'Beetle',
    mantis: 'Mantis',
    hornet: 'Hornet',
    cicada: 'Cicada',
    grasshopper: 'Grasshopper',
    centipede: 'Centipede',
    termite: 'Termite',
    scorpion: 'Scorpion',
    wasp: 'Wasp',
    goliath: 'Goliath',
    atlas: 'Atlas',
    monarch: 'Monarch',
    widow: 'Widow'
  },
  shipClass: {
    military: 'Military',
    trade: 'Trade',
    civilian: 'Civilian',
    explorer: 'Explorer',
    industrial: 'Industrial'
  },
  encounter: {
    title: 'Encounter in space',
    kind: {
      trader: 'Trader',
      pirate: 'Pirate',
      police: 'Police',
      bountyHunter: 'Bounty hunter',
      alien: 'Alien'
    },
    you: 'You',
    trader: {
      appear: 'You meet a trader flying a {ship}.',
      caravan: 'A trader caravan of {count} ships crosses your path.',
      ignore: 'The trader goes on its way.',
      distress: 'The hauler broadcasts a distress call on the open channel — your registry, your heading, and the word piracy. There is no talking your way out of this one.'
    },
    fleetNext: 'Another ship closes in — {remaining} still in the fight!',
    lootDropped: 'You scooped {qty} units of loot from the wreck.',
    trade: {
      title: 'Trade with the trader',
      onOffer: 'For sale',
      wants: 'Will buy',
      nothing: 'Nothing right now.'
    },
    pirate: {
      appear: 'A pirate in a {ship} attacks!',
      ambush: 'A pirate ambush — {count} ships swarm you!',
      plundered: 'Pirates plundered your hold ({qty} units).',
      extort: 'Pirates extorted a ransom: {amount} cr.',
      demandCargo: '"That {good} in your hold looks interesting. Hand it over and fly on."',
      demandRich: '"A fat hold — {good} and more besides. Surrender the cargo and you keep the ship."',
      demandEmpty: '"Holds empty? Then we take the ship. Surrender or burn."',
      pressSurrender: '"You are venting air, captain. Give up the cargo and we stop shooting."',
      released: 'The pirates cut you loose and melt back into the dark.'
    },
    bountyHunter: {
      appear: 'A bounty hunter in a {ship} has come to collect on your head!',
      appearBank: 'A collector in a {ship}, hired by the bank, moves to intercept you!',
      bribed: 'The hunter pockets {amount} cr and stands down.',
      paid: 'You pay the hunter {amount} cr to buy your freedom.',
      demandLaw: '"There is a warrant out on you — {standing}. Stand down and serve your time."',
      demandBank: '"The bank wants the {debt} cr you owe. Stand down, or we take it out of your hull."',
      pressSurrender: '"Stand down, captain. A cell beats a coffin."',
      arrested:
        'You stand down. {days} days in a station cell and a {fine} cr fine — but your record comes out clean.',
      confiscated: 'Contraband seized on booking: {qty} units.'
    },
    tractor: {
      locked: 'A tractor beam clamps onto your hull — you cannot break away!',
      held: 'The tractor beam holds you fast. No escape this round.',
      broke: 'You overload the beam emitters and slip the tractor lock!',
      badge: 'Tractor lock'
    },
    range: {
      label: 'Range',
      unit: 'km',
      closed: 'You burn in to {distance} km.',
      opened: 'You pull back to {distance} km.',
      atPointBlank: 'Any closer and you would be trading paint — {distance} km.',
      atMax: 'Open any further and they are out of the fight — {distance} km.'
    },
    targetSwitched: 'Guns re-laid on the {ship}.',
    yourShot: 'Your shot',
    theirShot: 'Their shot',
    actionsLeft: 'Actions',
    stations: {
      gunners: '{count} on the guns',
      helm: 'helm manned',
      helmEmpty: 'nobody spare to fly'
    },
    fleet: {
      engaged: 'Engaged',
      waiting: 'Holding off',
      wreck: 'Wreck',
      pickTarget: 'Tap a ship to lay the guns on it'
    },
    alien: {
      appear: 'An unknown alien vessel ({ship}-class) closes in, weapons hot!'
    },
    bounty: {
      appear: 'The wanted pirate {bounty} attacks!',
      done: '{bounty} eliminated! Reward {reward} cr.'
    },
    police: {
      appear: 'A police patrol in a {ship} orders you to stop.',
      clean: 'Inspection complete. No illegal goods found.',
      impound: 'Contraband found! Confiscated and fined {fine} cr.',
      incorruptible: 'These officers are incorruptible.',
      bribed: 'Bribe accepted ({amount} cr). You are waved through.',
      arrested: 'You are arrested. Fine of {fine} cr.',
      hidden: 'The hidden compartment held — the contraband went unnoticed.'
    },
    action: {
      attack: 'Fire',
      closeIn: 'Close in',
      openRange: 'Open range',
      endTurn: 'End turn',
      flee: 'Flee',
      breakFree: 'Break the tractor lock',
      surrenderCargo: 'Surrender the cargo',
      surrenderCargoHint: 'The pirates take your hold and let you fly on.',
      standDown: 'Stand down',
      standDownHint: 'You are taken in: days in a cell and a fine, but a clean record afterwards.',
      submit: 'Submit to inspection',
      bribe: 'Offer a bribe',
      surrender: 'Surrender',
      ignore: 'Ignore',
      leave: 'Leave',
      leaveHint: 'Nothing has happened here. You go your way, they go theirs.',
      attackTraderHint: 'Firing on a hauler is piracy. The distress call goes out on the first shot and the law will be looking for you.',
      continue: 'Continue',
      plunder: 'Plunder'
    },
    playerHit: 'You hit! Dealt {dmg} damage.',
    playerCrit: 'Critical hit! You punch clean through for {dmg} damage.',
    playerMiss: 'You missed.',
    oppHit: 'The enemy hit you! Took {dmg} damage.',
    oppCrit: 'A critical hit rocks your ship — {dmg} damage!',
    oppMiss: 'The enemy missed.',
    oppShieldsHeld: 'Enemy shields soak up {absorbed} damage.',
    oppShieldDown: "The enemy's shields collapse!",
    oppCrippled: 'The enemy hull is breached and venting.',
    playerShieldsHeld: 'Your shields absorb {absorbed} damage.',
    playerShieldDown: 'Your shields are down!',
    playerCrippled: 'Hull integrity critical — another hit could finish you.',
    noWeapons: 'You have no weapons to attack with!',
    oppDestroyed: 'Enemy ship destroyed!',
    playerDestroyed: 'Your ship was destroyed...',
    escapePod: 'The escape pod activated. You survived!',
    oppSurrendered: 'The enemy surrenders!',
    fledSuccess: 'You managed to flee.',
    fledFail: 'You failed to escape!',
    salvage: 'You salvaged a canister: {good}.'
  },
  log: {
    title: 'Event log',
    empty: 'Nothing has happened yet.',
    gameStart: 'Journey begins in the {system} system.',
    arrived: 'Arrived at {system} ({distance} pc).',
    arrivedBody: 'Crossed the system on impulse: {days} day(s).',
    autoRefuel: 'Auto-refuelled {parsecs} pc for {cost} cr.',
    wormhole: 'Wormhole jump to {system} (tax {tax} cr).',
    unstableWormhole: 'Fell through an unmapped wormhole and came out at {system}.',
    plunderedTrader: 'You plundered a trader ({qty} units).',
    crewLeft: 'You could not pay your crew — they left you.',
    crewLeftBehind: '{count} of your crew had no berth on the new ship and stayed behind.',
    mined: 'Mined {amount} {good}.',
    minedFuel: 'Scooped {amount} pc of fuel.',
    minedBonus: 'Struck a rare find: {good}!',
    insurancePaid: 'Insurance paid out {amount} cr for the ship you lost.',
    standingChanged: 'Word spreads — you are now known as: {standing}.',
    finePaid: 'Paid a {amount} cr fine. Your record is clean.',
    servedSentence: 'Served {days} days and a {fine} cr fine. Released with a clean record.'
  },
  info: {
    bought: 'Bought {qty} × {good} for {cost} cr.',
    sold: 'Sold {qty} × {good} for {revenue} cr.',
    dumped: 'Dumped {qty} × {good} into space.',
    refuelled: 'Refuelled {parsecs} pc for {cost} cr.',
    repaired: 'Repaired {units} hull for {cost} cr.',
    hullUpgraded: 'Hull reinforced: +{amount} max HP for {cost} cr.',
    equipmentBought: 'Equipment purchased.',
    equipmentSold: 'Equipment sold.',
    escapePodBought: 'Escape pod installed.',
    shipBought: 'New ship purchased.',
    mercHired: '{name} joined your crew.',
    mercFired: '{name} left your crew.',
    robotBought: 'An android was brought aboard for {cost} cr.',
    robotSold: 'The android was sold on.',
    loanTaken: 'Loan of {amount} cr received.',
    debtPaid: 'Paid off {amount} cr of debt.',
    insuranceBought: 'Insurance purchased.',
    insuranceCancelled: 'Insurance cancelled.',
    finePaid: 'Record cleared for {amount} cr.'
  },
  error: {
    notSold: 'This good is not sold here.',
    cannotBuy: 'Cannot buy (no credits, space, or stock).',
    nothingToSell: 'Nothing to sell.',
    notWanted: 'Not wanted here.',
    nothingToDump: 'Nothing to dump.',
    tankFull: 'The tank is already full.',
    noCreditsFuel: 'Not enough credits for fuel.',
    hullFull: 'The hull is in perfect condition.',
    noCreditsRepair: 'Not enough credits for repairs.',
    maxHullUpgrades: 'The hull is already fully reinforced.',
    noWeaponSlot: 'No free weapon slots.',
    noShieldSlot: 'No free shield slots.',
    noGadgetSlot: 'No free gadget slots.',
    notEnoughCredits: 'Not enough credits.',
    alreadyOwned: 'Already owned.',
    sameShip: 'This is your current ship.',
    cargoNotEmpty: 'Empty your cargo hold first.',
    noLoanAvailable: 'No loan available.',
    nothingToPay: 'No debt to pay.',
    needEscapePod: 'Buy an escape pod first.',
    alreadyInsured: 'Insurance is already active.',
    noInsurance: 'No insurance in place.',
    invalidTarget: 'Invalid target.',
    notEnoughFuel: 'Not enough fuel for the jump.',
    cannotAffordWormhole: 'Cannot afford the wormhole tax.',
    nothingToRemove: 'Nothing to remove.',
    mercNotHere: 'That mercenary is not here.',
    noQuarters: 'No free crew quarters.',
    alreadyHired: 'Already in your crew.',
    notInCrew: 'Not in your crew.',
    cannotTurnIn: 'This assignment cannot be handed in here.',
    tooManyQuests: 'You are juggling too many assignments already.',
    questGone: 'That posting is no longer available.',
    recordClean: 'Your record is already clean.',
    escortNeedsMilitary: 'Escort work needs a military-class hull.',
    escortNeedsWeapons: 'Escort work needs at least two weapons fitted.',
    escortNeedsShield: 'Escort work needs at least one shield fitted.',
    robotNotHere: 'No such android is sold here.',
    escortNotHere: 'The convoy forms up at the system that posted the contract.',
    noMineSite: 'There is nothing to mine here.',
    holdFull: 'The cargo hold is full.',
    holdTooSmall: 'Your hold is too small for this contract.',
    contractEmbargo: 'This planet is short of it — that is why you were hired to bring it. Buy it elsewhere.',
    loadFailed: 'Could not load the save file — it may be corrupted.',
    saveTooNew: 'This save was written by a newer version of Space Trader. Update the game to open it.',
    noMarketHere: 'There is no market here. Trading is done at the planet\'s spaceport.',
    noShipyardHere: 'Nothing here will work on a ship. Try the planet, or a station.',
    noBankHere: 'The bank is planet-side.',
    noHiringHallHere: 'Nobody is looking for a berth out here.',
    noPortHere: 'The port office is down on the planet.',
    notStockedHere: 'This yard does not stock that.',
    noWormholeHere: 'There is no wormhole in this system.',
    alreadyHere: 'You are already docked there.'
  },
  tech: {
    preAgricultural: 'Pre-agricultural',
    agricultural: 'Agricultural',
    medieval: 'Medieval',
    renaissance: 'Renaissance',
    earlyIndustrial: 'Early Industrial',
    industrial: 'Industrial',
    postIndustrial: 'Post-industrial',
    hiTech: 'Hi-tech'
  },
  politics: {
    anarchy: 'Anarchy',
    capitalist: 'Capitalist State',
    communist: 'Communist State',
    confederacy: 'Confederacy',
    corporate: 'Corporate State',
    cybernetic: 'Cybernetic State',
    democracy: 'Democracy',
    dictatorship: 'Dictatorship',
    fascist: 'Fascist State',
    feudal: 'Feudal State',
    military: 'Military State',
    monarchy: 'Monarchy',
    pacifist: 'Pacifist State',
    socialist: 'Socialist State',
    satori: 'State of Satori',
    technocracy: 'Technocracy',
    theocracy: 'Theocracy'
  },
  status: {
    uneventful: 'Uneventful',
    war: 'War',
    plague: 'Plague',
    drought: 'Drought',
    boredom: 'Boredom',
    cold: 'Cold spell',
    cropFailure: 'Crop failure',
    lackOfWorkers: 'Lack of workers'
  },
  starClass: {
    blue: 'blue',
    white: 'white',
    yellow: 'yellow',
    orange: 'orange',
    red: 'red'
  },
  resource: {
    none: 'None',
    mineralRich: 'Mineral rich',
    mineralPoor: 'Mineral poor',
    desert: 'Desert',
    sweetwater: 'Sweetwater oceans',
    richSoil: 'Rich soil',
    poorSoil: 'Poor soil',
    richFauna: 'Rich fauna',
    lifeless: 'Lifeless',
    weirdMushrooms: 'Weird mushrooms',
    lotsOfHerbs: 'Lots of herbs',
    artistic: 'Artistic',
    warlike: 'Warlike'
  },
  economy: {
    agricultural: 'Agrarian',
    mining: 'Mining',
    industrial: 'Industrial',
    refinery: 'Energy',
    resort: 'Resort',
    hiTech: 'High-tech'
  },
  weapon: {
    pulse: 'Pulse laser',
    beam: 'Beam laser',
    plasma: 'Plasma cannon',
    military: 'Military laser',
    fusion: 'Fusion cannon',
    railgun: 'Mass-driver railgun',
    singularity: 'Singularity lance'
  },
  shield: {
    energy: 'Energy shield',
    reflective: 'Reflective shield',
    deflector: 'Deflector shield',
    barrier: 'Barrier field'
  },
  gadget: {
    cargoBays: 'Extra cargo bays (+5)',
    autoRepair: 'Auto-repair system',
    navigation: 'Navigation system',
    targeting: 'Targeting system',
    fuelCompactor: 'Fuel compactor (+3 pc)',
    hiddenCompartment: 'Hidden compartment',
    cloaking: 'Cloaking device',
    nanoHold: 'Nanofolded hold (+20 bays)',
    quantumCompactor: 'Quantum compactor (+12 pc)',
    aiHelm: 'Helm intelligence',
    battleComputer: 'Battle computer',
    nanoForge: 'Nanoforge repair rig'
  },
  news: {
    droughtDecree: {
      headline: 'Governor declares a Water Emergency',
      body: 'The harvest is a write-off and the reservoirs are down to mud. The Governor has ordered every commune to pull together for the duration, and the ministry has begun buying water in bulk from any hauler who can bring it in.'
    },
    droughtRation: {
      headline: 'Third week of water rationing',
      body: 'Standpipes open two hours a day. Anything wet sells the moment it is off the ramp, and nobody is asking where it came from.'
    },
    cropFailureGranary: {
      headline: 'State granaries stand empty',
      body: 'The strategic reserve is gone. Port authority has posted a standing call for food shipments and is paying for speed rather than haggling.'
    },
    cropFailureFarmhands: {
      headline: 'A season with nothing to bring in',
      body: 'Farmhands are being laid off across the growing belt. The co-operatives are selling their equipment to buy the food they used to grow.'
    },
    plagueQuarantine: {
      headline: 'Hospitals overrun as the outbreak spreads',
      body: 'Wards are full and the medicine ran out days ago. Ships carrying any are being waved straight through customs.'
    },
    plagueBorder: {
      headline: 'Borders sealed by emergency decree',
      body: 'The Ministry of Health has closed the surface to all but licensed traffic and requisitioned every dose on the planet. Enforcement has not been gentle.'
    },
    warLevy: {
      headline: 'Mobilisation order posted',
      body: 'Reservists are being called up and the armouries are buying. Anything that shoots fetches a wartime price, and nobody is asking where it came from.'
    },
    warBlackMarket: {
      headline: 'Rationing drives trade underground',
      body: 'With the port on a war footing, half the planet\'s business now happens in cargo bays after dark.'
    },
    coldSnap: {
      headline: 'Deep freeze grips the settlements',
      body: 'The grid is failing under the load. Furs, heaters and anything that burns are selling faster than they can be landed.'
    },
    boredomFestival: {
      headline: 'A planet with nothing whatsoever to do',
      body: 'The entertainment board has approved anything anyone cares to import. Games are fetching frankly silly money.'
    },
    workerShortage: {
      headline: 'Nobody left to work the lines',
      body: 'Half the shifts are unfilled. Managers are bidding against each other for android crews and paying freight to have them shipped in.'
    },
    electionSeason: {
      headline: 'Campaign season opens',
      body: 'Three candidates, one debate a night, and a promise of lower docking fees from every one of them.'
    },
    partyQuota: {
      headline: 'Quota met ahead of schedule, ministry says',
      body: 'The figures are impressive. So are the queues outside the state stores.'
    },
    corporateMerger: {
      headline: 'Merger clears the board',
      body: 'Two of the system\'s four holding companies are now one. Analysts expect layoffs; the analysts work for the company.'
    },
    piracyRife: {
      headline: 'Another convoy lost in the outer approaches',
      body: 'There is no authority here to complain to. Captains who dock armed tend to dock again.'
    },
    templeFast: {
      headline: 'The Great Fast begins at dusk',
      body: 'Markets close one day in seven, and the temple takes its tithe on everything landed.'
    },
    royalTour: {
      headline: 'The Crown tours the provinces',
      body: 'Streets have been scrubbed, prices fixed for the week, and the honour guard is inspecting cargo manifests personally.'
    },
    cyberNet: {
      headline: 'Net upgrade goes live planet-side',
      body: 'Every citizen\'s implant was patched overnight. Most of them consented.'
    },
    satoriSilence: {
      headline: 'The Year of Silence continues',
      body: 'Business is conducted in writing. Trade is slow, courteous and remarkably honest.'
    },
    technocratPaper: {
      headline: 'Institute publishes, and the price of everything shifts',
      body: 'A new refining process has been released into the public domain. The industrial worlds are already retooling.'
    },
    juntaParade: {
      headline: 'Victory parade closes the capital',
      body: 'Curfew at dusk, papers on demand, and a very good view of the fleet.'
    },
    pacifistRally: {
      headline: 'Disarmament rally fills the plaza',
      body: 'Weapon imports have been taxed into the sky. The crowd is friendly and the police are unarmed.'
    },
    oreStrike: {
      headline: 'New seam opens at the deep workings',
      body: 'The assay came back rich. Every hauler in the system is being offered a contract.'
    },
    refineryFlare: {
      headline: 'Stack flare lights the night side',
      body: 'A cracking tower vented and burned for six hours. Nobody was hurt, and fuel is cheap this week.'
    },
    resortSeason: {
      headline: 'The season opens',
      body: 'The orbital hotels are full, the beaches are crowded, and a bottle of water costs what a bottle of wine costs anywhere else.'
    },
    factoryQuota: {
      headline: 'Line record broken on the night shift',
      body: 'The heavy works are running flat out. Machine tools are leaving the planet faster than they can be crated.'
    },
    harvestBumper: {
      headline: 'Best harvest in a decade',
      body: 'Silos are overflowing and the co-operatives are selling grain at giveaway prices just to clear the space.'
    },
    hiTechLaunch: {
      headline: 'New model unveiled at the exchange',
      body: 'The fabs retooled overnight. Last year\'s robots are being cleared out at a discount.'
    },
    gemRush: {
      headline: 'Gem rush at the eastern claims',
      body: 'A prospector hit colour and half the settlement followed. The assay office has a queue around the block.'
    },
    mushroomBloom: {
      headline: 'The bloom is early this year',
      body: 'The caves are thick with it. The xenobiologists are worried; the exporters are delighted.'
    },
    herbHarvest: {
      headline: 'Herb harvest comes in strong',
      body: 'The medicinal crop is the best in years, and the off-world buyers have already landed.'
    },
    artFestival: {
      headline: 'The festival takes over the capital',
      body: 'Every hall is hung with new work, and collectors are arriving by the hour.'
    },
    warGames: {
      headline: 'War games open on the northern plain',
      body: 'The clans are fighting their annual mock war. Relic dealers follow the armies like gulls.'
    },
    springBottling: {
      headline: 'Bottling plants running double shifts',
      body: 'The springs are famous for good reason, and off-world demand has never been higher.'
    },
    dustStorm: {
      headline: 'Dust storm buries the outer settlements',
      body: 'Visibility is nil, filters are failing, and water is being trucked in from the poles.'
    },
    pirateSighting: {
      headline: 'Raiders sighted near the jump point',
      body: 'Two freighters have gone missing this month. Port authority advises an armed escort.'
    },
    patrolCrackdown: {
      headline: 'Customs crackdown at the port',
      body: 'Every hold is being opened. The officers are being watched by their own inspectorate, so a bribe is a poor bet this week.'
    },
    traderInflux: {
      headline: 'Traffic at record levels',
      body: 'Berths are booked out three days deep. Whatever you are carrying, somebody here wants it.'
    },
    stationTraffic: {
      headline: 'Yard traffic heavy in the outer system',
      body: 'The station is running at capacity. Captains report the wait is worth it for what can be fitted out there.'
    },
    dockStrike: {
      headline: 'Dockers vote to work to rule',
      body: 'Loading has slowed to a crawl. The union says it is about safety; the port authority says it is about money.'
    },
    quietWeek: {
      headline: 'A quiet week, and the papers say so',
      body: 'No crisis, no scandal, no shortage. The lead story is a lost cat.'
    },
    droughtWaterTrain: {
      headline: 'Water trains arrive under guard',
      body: 'The first tankers made orbit before dawn. Armed escorts now patrol the route from the docks to the ration depots.'
    },
    cropFailureSeedVault: {
      headline: 'Seed vault opened in emergency session',
      body: 'Agronomists are counting every viable grain. The next planting will depend on shipments from worlds that still have a harvest.'
    },
    plagueClinicShip: {
      headline: 'Hospital ship converted from a freighter',
      body: 'A cargo hauler has been fitted with isolation wards overnight. Its crew is asking for medicine, filters and hazard pay.'
    },
    warRefugeeCorridor: {
      headline: 'Civilian corridor opens through the war zone',
      body: 'The port is processing evacuees around the clock. Captains with spare berths are being asked to volunteer.'
    },
    thermalShelters: {
      headline: 'Thermal shelters open in the capital',
      body: 'The cold has driven thousands indoors. Public halls are running on emergency power while crews repair the failing grid.'
    },
    workerAutomation: {
      headline: 'Factories promise a robotic solution',
      body: 'With too few hands for the shifts, local firms are importing robots in bulk. The union says the shortage is being used as an excuse.'
    },
    pollingDay: {
      headline: 'Polling stations open across the planet',
      body: 'Turnout is high and docking lanes are full of campaign shuttles. Traders are betting on who will control the next budget.'
    },
    shareholderPanic: {
      headline: 'Share prices tumble after leaked forecast',
      body: 'The exchange halted trading twice before noon. Executives blame rumours; brokers blame executives.'
    },
    mineAutomation: {
      headline: 'Autonomous drills reach the lower galleries',
      body: 'New machines are cutting through rock without a shift change. Ore output is rising, though the miners are not celebrating.'
    },
    refineryCatalyst: {
      headline: 'Refinery announces a cleaner catalyst',
      body: 'A new catalyst promises more fuel from every barrel. The plant is buying specialist equipment before rivals can copy it.'
    },
    resortCelebrity: {
      headline: 'Celebrity liner docks for the season',
      body: 'Fans have filled the orbital hotels and emptied the boutiques. Security teams are hiring fast ships to keep up with the schedule.'
    },
    factoryRobots: {
      headline: 'Robot production hits a new record',
      body: 'The assembly lines are turning out workers faster than the employment office can register them. Export orders are already queued.'
    },
    patentAuction: {
      headline: 'Patent auction draws bidders from six systems',
      body: 'The winning design could change the cost of a jump. Every major manufacturer has sent a representative and a very large cheque.'
    },
    mineralSurvey: {
      headline: 'Survey crews map a promising belt',
      body: 'Remote probes have marked dozens of targets beyond the old claims. Prospectors are arriving before the maps are even public.'
    },
    mushroomCuisine: {
      headline: 'Mushroom cuisine becomes the latest craze',
      body: 'Chefs are charging fortunes for the rarest caps. Xenobiologists advise visitors not to eat anything that glows.'
    },
    herbClinic: {
      headline: 'Herbal clinics report a medical breakthrough',
      body: 'A local extract is showing promise against several common ailments. Pharmaceutical buyers are circling the growers.'
    },
    hologramAuction: {
      headline: 'Lost artist catalogue appears at auction',
      body: 'A private archive has surfaced after a century in storage. Collectors are arriving with empty holds and discreet security.'
    },
    waterExport: {
      headline: 'Spring consortium signs an export deal',
      body: 'The first long-term contract will send bottled water to three dry worlds. Local bottlers are expanding before the next launch window.'
    },
    workerRecruiters: {
      headline: 'Recruiters comb the outer settlements',
      body: 'Agents are offering passage and a signing bonus to anyone who can hold a tool. The berths are being filled by ships that ask no questions.'
    },
    droughtWellRiot: {
      headline: 'Crowd storms the western well',
      body: 'Militia cleared the pumping station after a night of it. Ration cards are being reissued, and this time they will be checked at gunpoint.'
    },
    plagueVolunteers: {
      headline: 'Volunteer medics land from three systems',
      body: 'Off-world crews walked into the wards without being asked. The port has waived its fees for anything with medicine aboard.'
    },
    warCeasefireTalks: {
      headline: 'Envoys meet under a flag of truce',
      body: 'The guns have been quiet for two days. Nobody is unloading a hold until they see whether it holds.'
    },
    coldFuelQueues: {
      headline: 'Fuel queues stretch around the depot',
      body: 'The cold has doubled demand and the tankers are late. Anything that burns is being sold by the litre at the gate.'
    },
    boredomTalentShow: {
      headline: 'Talent contest grips a planet with nothing else on',
      body: 'Eleven weeks, four hundred acts, and viewing figures the broadcasters cannot quite believe. First prize is passage off-world.'
    },
    boredomRacing: {
      headline: 'Canyon racing season opens',
      body: 'Half the planet has turned out to watch modified skiffs take the gorge at full burn. The other half is betting on it.'
    },
    democracyScandal: {
      headline: 'Minister resigns over the docking contracts',
      body: 'The tender went to a company nobody had heard of and everybody now has. The inquiry opens next week; the ships are already berthed.'
    },
    communeBrigade: {
      headline: 'Volunteer brigade sent to the northern works',
      body: 'Ten thousand citizens have pledged a season of labour. The posters went up before the volunteers did.'
    },
    anarchyNoLaw: {
      headline: 'Third harbourmaster this year steps down',
      body: 'There is no law here, only arrangements. The berths still get allocated, one way or another.'
    },
    theocracyPilgrimage: {
      headline: 'Pilgrim season fills the orbital lanes',
      body: 'Tens of thousands are coming for the procession. Every berth, bunk and bowl of soup on the planet is spoken for.'
    },
    militaryDraft: {
      headline: 'Draft notices posted district by district',
      body: 'Two years, no appeal, and the recruiters are working the spaceport as well as the streets. Crews are advised to keep their papers close.'
    },
    cyberneticGlitch: {
      headline: 'Implant fault leaves thousands offline',
      body: 'A bad patch dropped a whole district out of the net for six hours. The Assembly calls it an incident; the district calls it silence.'
    },
    miningCollapse: {
      headline: 'Gallery collapse halts the deep workings',
      body: 'Rescue crews are still cutting through. Output has stopped; the price of ore has not.'
    },
    industrialSmog: {
      headline: 'Smog alert closes the works for a day',
      body: 'An inversion layer has trapped a week of output over the city. Filters and medicine are selling as fast as they can be landed.'
    },
    resortOffSeason: {
      headline: 'The season closes and the hotels empty',
      body: 'Rates have collapsed, the beaches are deserted, and the staff are looking for a berth to anywhere that is hiring.'
    },
    agriMarketDay: {
      headline: 'Market day brings the whole belt to town',
      body: 'Every co-operative is selling off the tailgate. What does not go today goes to the silo tomorrow, at half the price.'
    },
    refineryTankerQueue: {
      headline: 'Tankers stack up over the cracking plant',
      body: 'The queue for a loading slot is four days deep. Fuel is cheap on the ground and dear everywhere else.'
    },
    desertSolarFarm: {
      headline: 'Solar array switches on across the flats',
      body: 'A thousand square kilometres of mirrors, and power to spare for the first time in a generation. The dust remains a problem.'
    },
    warlikeArmourers: {
      headline: 'Armourers open the season with a duel',
      body: 'The clans settle their disputes in the ring and their business afterwards. Smiths are taking orders from every captain who lands.'
    },
    faunaSafari: {
      headline: 'Safari charters booked out for the season',
      body: 'The herds are moving through the southern range and the galaxy has come to watch. Wardens are hiring ships to keep pace with them.'
    },
    faunaPoachers: {
      headline: 'Poaching ring broken at the eastern preserve',
      body: 'Six ships impounded, holds full of things that should still be breathing. Customs is opening every departure this week.'
    },
    lifelessDome: {
      headline: 'Third dome sealed on schedule',
      body: 'Nothing lives out there and nothing ever did. Everything under the glass — the soil, the air, the water in the pipes — came off a ship.'
    },
    richSoilFair: {
      headline: 'Growers fair draws buyers from four systems',
      body: 'The soil here does the work a laboratory does anywhere else. Contracts are signed on a handshake and a taste.'
    },
    poorSoilHydroponics: {
      headline: 'Hydroponics towers pass their first harvest',
      body: 'Nothing takes root in the ground here, so the farms were built upwards. The trays are producing; the nutrient feed is imported.'
    },
    mineralPoorImports: {
      headline: 'Foundries idle waiting on ore',
      body: 'There is nothing worth digging for under this crust. Every furnace on the planet runs on what the freighters bring in.'
    },
    portFeeRise: {
      headline: 'Port authority raises the berthing fee',
      body: 'Effective this rotation, and the notice went up the same morning. The captains committee has lodged a protest nobody will read.'
    },
    salvageAuction: {
      headline: 'Salvage auction clears the impound yard',
      body: 'Three hulls, a scorched cargo pod, and whatever was still bolted to them. Bidding opens at whatever the yard is owed.'
    },
    beaconOffline: {
      headline: 'Navigation beacon down at the jump point',
      body: 'Engineers are working on it. Until it is back, approaches are being flown on instruments and nerve.'
    },
    insuranceRates: {
      headline: 'Underwriters raise premiums on this run',
      body: 'Losses in the approach lanes have been heavy this quarter. The brokers have priced it in, as brokers do.'
    },
    harbourFestival: {
      headline: 'Harbour festival closes the main lock',
      body: 'Lanterns on the gantries, a procession down the loading ramp, and no cargo moving until the morning after.'
    }
  }
} as const
