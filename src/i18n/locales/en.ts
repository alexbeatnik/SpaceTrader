// English locale — the primary one: the default on a fresh install and the
// fallback for any key a translation is missing.
export const en = {
  app: {
    title: 'Star Trader',
    subtitle: 'A modern remake of the classic Space Trader'
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
    system: 'System',
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
      'Star Trader keeps itself up to date from its GitHub releases. A new version downloads quietly in the background and installs the next time you quit — you never have to reinstall anything by hand.',
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
    title: 'About Star Trader',
    lead: 'Buy low, sell high, dodge pirates, and work your way up from a second-hand Flea to a ship worth fearing.',
    inspirationTitle: 'What inspired it',
    inspiration:
      'The original Space Trader was written by Pieter Spronck for Palm OS, and later ported to Windows by Jay French. Their design is what this project set out to honour: an economy driven by tech levels and local shortages, encounters that can ruin a good run, and the slow climb through better and better hulls.',
    ownTitle: 'An independent interpretation',
    own:
      'This is not a port, and it shares no code with the originals — every system here was written from scratch. It also takes its own liberties: crew stations that go wrong when nobody mans them, warp and mining you sit through in real time, a job board on every planet, convoy escort contracts, and a standing the galaxy files you under, somewhere between outlaw and champion of justice.',
    freeTitle: 'Free, and free to inspect',
    free:
      'Star Trader is free. There is nothing to buy, no accounts, and no telemetry — it runs entirely on your own machine, and your saves never leave it. The full source is published under the Apache-2.0 licence, so anyone can read it, build it, or fork it.',
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
    hereNow: 'You are here',
    noSpecialResource: 'Ordinary resources'
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
    engineer: 'Engineer'
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
      ignore: 'The trader goes on its way.'
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
      attack: 'Attack',
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
    autoRefuel: 'Auto-refuelled {parsecs} pc for {cost} cr.',
    wormhole: 'Wormhole jump to {system} (tax {tax} cr).',
    plunderedTrader: 'You plundered a trader ({qty} units).',
    crewLeft: 'You could not pay your crew — they left you.',
    crewLeftBehind: '{count} of your crew had no berth on the new ship and stayed behind.',
    mined: 'Mined 1 {good}.',
    minedFuel: 'Scooped 1 pc of fuel.',
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
    loadFailed: 'Could not load the save file — it may be corrupted.'
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
    fusion: 'Fusion cannon'
  },
  shield: {
    energy: 'Energy shield',
    reflective: 'Reflective shield',
    deflector: 'Deflector shield'
  },
  gadget: {
    cargoBays: 'Extra cargo bays (+5)',
    autoRepair: 'Auto-repair system',
    navigation: 'Navigation system',
    targeting: 'Targeting system',
    fuelCompactor: 'Fuel compactor (+3 pc)',
    hiddenCompartment: 'Hidden compartment',
    cloaking: 'Cloaking device'
  }
} as const
