// English locale. Mirrors the structure of the Ukrainian locale.
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
    log: 'Log'
  },
  quest: {
    title: 'Quests',
    active: 'Active',
    done: 'Completed',
    none: 'You have no assignments. Explore systems to be offered some.',
    offerTitle: 'Special Assignment',
    accept: 'Accept',
    decline: 'Decline',
    reward: 'Reward',
    type: {
      delivery: 'Courier delivery',
      relief: 'Relief mission',
      bounty: 'Bounty hunt'
    },
    desc: {
      delivery: 'Deliver a package to the {system} system.',
      relief: 'Deliver {amount} × {good} to {system}, a system in crisis.',
      bounty: 'Track down and destroy the pirate {bounty} (headed for {system}).'
    },
    accepted: 'Assignment accepted — reward {reward} cr.',
    completed: 'Assignment completed — reward {reward} cr.',
    completedToast: 'Assignment complete! +{reward} cr'
  },
  crew: {
    title: 'Crew',
    wages: 'Daily wages',
    quarters: 'Free quarters',
    hired: 'Hired crew',
    noneHired: 'No crew hired',
    commanderSkills: 'Effective skills (with crew)',
    roster: 'Personnel roster',
    noneAvailable: 'No mercenaries available here',
    hire: 'Hire',
    fire: 'Dismiss',
    noQuarters: 'No free crew quarters'
  },
  merc: {
    alyssa: 'Alyssa', bran: 'Bran', cyra: 'Cyra', dex: 'Dex', elin: 'Elin',
    ferro: 'Ferro', gwen: 'Gwen', hoshi: 'Hoshi', ivo: 'Ivo', juno: 'Juno',
    kai: 'Kai', lena: 'Lena', mira: 'Mira', nox: 'Nox', orin: 'Orin', pax: 'Pax'
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
    notWanted: 'not wanted',
    illegal: 'illegal good',
    emptyHold: 'Your cargo hold is empty',
    buyAmount: 'How much {good} to buy?',
    sellAmount: 'How much {good} to sell?'
  },
  shipyard: {
    title: 'Shipyard',
    fuel: 'Fuel',
    repair: 'Hull repair',
    refuelFull: 'Fill the tank',
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
    unvisited: 'Unexplored'
  },
  ship: {
    title: 'Your ship',
    type: 'Type',
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
    robots: 'Robots'
  },
  shipType: {
    flea: 'Flea',
    gnat: 'Gnat',
    firefly: 'Firefly',
    mosquito: 'Mosquito',
    bumblebee: 'Bumblebee',
    beetle: 'Beetle',
    hornet: 'Hornet',
    grasshopper: 'Grasshopper',
    termite: 'Termite',
    wasp: 'Wasp'
  },
  encounter: {
    title: 'Encounter in space',
    trader: {
      appear: 'You meet a trader flying a {ship}.',
      ignore: 'The trader goes on its way.'
    },
    pirate: {
      appear: 'A pirate in a {ship} attacks!',
      plundered: 'Pirates plundered your hold ({qty} units).',
      extort: 'Pirates extorted a ransom: {amount} cr.'
    },
    bounty: {
      appear: 'The wanted pirate {name} attacks!',
      done: '{name} eliminated! Reward {reward} cr.'
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
      submit: 'Submit to inspection',
      bribe: 'Offer a bribe',
      surrender: 'Surrender',
      ignore: 'Ignore',
      continue: 'Continue',
      plunder: 'Plunder'
    },
    playerHit: 'You hit! Dealt {dmg} damage.',
    playerMiss: 'You missed.',
    oppHit: 'The enemy hit you! Took {dmg} damage.',
    oppMiss: 'The enemy missed.',
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
    wormhole: 'Wormhole jump to {system} (tax {tax} cr).',
    plunderedTrader: 'You plundered a trader ({qty} units).',
    crewLeft: 'You could not pay your crew — they left you.'
  },
  info: {
    bought: 'Bought {qty} × {good} for {cost} cr.',
    sold: 'Sold {qty} × {good} for {revenue} cr.',
    dumped: 'Dumped {qty} × {good} into space.',
    refuelled: 'Refuelled {parsecs} pc for {cost} cr.',
    repaired: 'Repaired {units} hull for {cost} cr.',
    equipmentBought: 'Equipment purchased.',
    equipmentSold: 'Equipment sold.',
    escapePodBought: 'Escape pod installed.',
    shipBought: 'New ship purchased.',
    mercHired: '{name} joined your crew.',
    mercFired: '{name} left your crew.',
    loanTaken: 'Loan of {amount} cr received.',
    debtPaid: 'Paid off {amount} cr of debt.',
    insuranceBought: 'Insurance purchased.',
    insuranceCancelled: 'Insurance cancelled.'
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
    notInCrew: 'Not in your crew.'
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
