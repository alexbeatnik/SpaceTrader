// Ukrainian locale (default). Keys are stable; values are user-facing text.
export const uk = {
  app: {
    title: 'Зоряний Торговець',
    subtitle: 'Сучасний ремейк класичного Space Trader'
  },
  common: {
    credits: 'кредитів',
    cr: 'кр',
    buy: 'Купити',
    sell: 'Продати',
    cancel: 'Скасувати',
    confirm: 'Підтвердити',
    close: 'Закрити',
    back: 'Назад',
    all: 'Усе',
    max: 'Макс',
    none: 'немає',
    yes: 'Так',
    no: 'Ні',
    day: 'День',
    qty: 'К-сть',
    price: 'Ціна',
    total: 'Разом',
    profit: 'Прибуток',
    parsecs: 'парсеків',
    pc: 'пс'
  },
  nav: {
    system: 'Система',
    market: 'Ринок',
    shipyard: 'Верф',
    bank: 'Банк',
    crew: 'Екіпаж',
    quests: 'Завдання',
    chart: 'Зоряна карта',
    ship: 'Корабель',
    log: 'Журнал'
  },
  quest: {
    title: 'Завдання',
    active: 'Активні',
    done: 'Виконані',
    none: 'У вас немає завдань. Досліджуйте системи, щоб отримати пропозиції.',
    offerTitle: 'Спеціальне доручення',
    accept: 'Прийняти',
    decline: 'Відхилити',
    reward: 'Винагорода',
    type: {
      delivery: 'Кур’єрська доставка',
      relief: 'Гуманітарна місія',
      bounty: 'Полювання за головою',
      passenger: 'Перевезення пасажира',
      smuggle: 'Контрабандний рейс',
      fetch: 'Контракт на постачання'
    },
    desc: {
      delivery: 'Доставити пакунок до системи {system}.',
      relief: 'Доставити {amount} × {good} до системи {system}, що потерпає від кризи.',
      bounty: 'Вистежити та знищити пірата на ім’я {bounty} (прямує до {system}).',
      passenger: 'Безпечно доставити {passenger} до системи {system}.',
      smuggle: 'Провезти {amount} × {good} повз патрулі до {system}.',
      fetch: 'Роздобути {amount} × {good} і привезти назад до {system}.'
    },
    accepted: 'Прийнято доручення — винагорода {reward} кр.',
    completed: 'Доручення виконано — винагорода {reward} кр.',
    completedToast: 'Завдання виконано! +{reward} кр',
    takenAt: 'Отримано в {system}',
    destination: 'Призначення'
  },
  crew: {
    title: 'Екіпаж',
    wages: 'Денна платня',
    quarters: 'Вільні місця',
    hired: 'Найнятий екіпаж',
    noneHired: 'Екіпаж не найнято',
    commanderSkills: 'Ефективні навички (з екіпажем)',
    roster: 'Кадровий реєстр',
    noneAvailable: 'Тут немає вільних найманців',
    hire: 'Найняти',
    fire: 'Звільнити',
    noQuarters: 'Немає вільних місць для екіпажу'
  },
  merc: {
    alyssa: 'Алісса', bran: 'Бран', cyra: 'Сайра', dex: 'Декс', elin: 'Елін',
    ferro: 'Ферро', gwen: 'Ґвен', hoshi: 'Хоші', ivo: 'Іво', juno: 'Джуно',
    kai: 'Кай', lena: 'Лена', mira: 'Міра', nox: 'Нокс', orin: 'Орін', pax: 'Пакс',
    quen: 'Квен', rhea: 'Рея', sol: 'Сол', tavi: 'Таві', ulf: 'Ульф',
    vera: 'Віра', wren: 'Рен', xara: 'Ксара', yuki: 'Юкі', zane: 'Зейн'
  },
  event: {
    derelict: {
      title: 'Покинутий корабель',
      body: 'Ви натрапили на покинутий корабель і забрали {qty} × {good} з його трюмів.',
      log: 'Знайдено покинутий корабель: +{qty} {good}.'
    },
    fuelLeak: {
      title: 'Витік палива',
      body: 'Мікротріщина в баку коштувала вам {lost} пс палива.',
      log: 'Витік палива: -{lost} пс.'
    },
    micrometeorite: {
      title: 'Рій мікрометеоритів',
      body: 'Ваш корпус отримав {dmg} одиниць пошкоджень від мікрометеоритів.',
      log: 'Мікрометеорити: -{dmg} корпусу.'
    },
    lottery: {
      title: 'Несподіваний виграш',
      body: 'Ви виграли {prize} кр у галактичній лотереї!',
      log: 'Виграш у лотерею: +{prize} кр.'
    },
    toll: {
      title: 'Митний збір',
      body: 'Локальна застава стягнула збір {toll} кр за прохід.',
      log: 'Сплачено митний збір: -{toll} кр.'
    },
    newsTip: {
      title: 'Свіжі новини',
      body: 'Газети повідомляють: у системі {system} — {status}. Можлива вигода для торговця.'
    },
    wanderer: {
      title: 'Мандрівний майстер',
      body: 'Досвідчений інженер поділився хитрощами. Ваша навичка інженера зросла на 1.',
      log: 'Мандрівний майстер: +1 до інженерії.'
    },
    ionStorm: {
      title: 'Іонний шторм',
      body: 'Іонний шторм пошкодив корпус на {dmg} одиниць.',
      log: 'Іонний шторм: -{dmg} корпусу.'
    },
    skillTrainer: {
      title: 'Ветеран-інструктор',
      body: 'Відставний ас добряче вас натренував. Навичка «{skill}» зросла на 1.',
      log: 'Тренування у ветерана: +1 до «{skill}».'
    },
    merchantConvoy: {
      title: 'Дружній конвой',
      bodyGoods: 'Зустрічний конвой поділився надлишком: {qty} × {good}.',
      bodyCredits: 'Зустрічний конвой заплатив {gift} кр за ваші навігаційні карти.',
      logGoods: 'Подарунок конвою: +{qty} {good}.',
      logCredits: 'Подарунок конвою: +{gift} кр.'
    },
    refugees: {
      title: 'Біженці',
      body: 'Ви дали біженцям {aid} кр на проїзд. Ваша репутація зросла.',
      log: 'Допомога біженцям: -{aid} кр, +1 репутації.'
    },
    bountyPayout: {
      title: 'Вдячна колонія',
      body: 'Колонія, яку ви колись захистили, винагородила вас {reward} кр.',
      log: 'Винагорода колонії: +{reward} кр.'
    },
    ancientProbe: {
      title: 'Стародавній зонд',
      body: 'Ви підібрали покинутий інопланетний зонд і продали його технології за {value} кр.',
      log: 'Продано інопланетний зонд: +{value} кр.'
    }
  },
  menu: {
    newGame: 'Нова гра',
    continue: 'Продовжити',
    settings: 'Налаштування',
    commanderName: "Ім'я командира",
    startGame: 'Почати подорож',
    language: 'Мова',
    difficulty: 'Складність',
    tagline: 'Торгуй. Дослiджуй. Виживай серед зірок.'
  },
  hud: {
    credits: 'Кредити',
    debt: 'Борг',
    fuel: 'Паливо',
    hull: 'Корпус',
    cargo: 'Трюм',
    day: 'День',
    shields: 'Щити'
  },
  system: {
    techLevel: 'Рівень технологій',
    government: 'Уряд',
    resource: 'Особливий ресурс',
    status: 'Ситуація',
    police: 'Поліція',
    pirates: 'Пірати',
    traders: 'Торговці',
    wormhole: 'Червоточина',
    hereNow: 'Ви тут',
    noSpecialResource: 'Звичайні ресурси'
  },
  market: {
    title: 'Космопорт — Товарний ринок',
    good: 'Товар',
    available: 'Наявно',
    buyPrice: 'Ціна купівлі',
    sellPrice: 'Ціна продажу',
    inHold: 'У трюмі',
    avgPrice: 'Середня ціна',
    notSold: 'не продається',
    notWanted: 'не потрібно',
    illegal: 'заборонений товар',
    emptyHold: 'Ваш трюм порожній',
    buyAmount: 'Скільки купити {good}?',
    sellAmount: 'Скільки продати {good}?'
  },
  shipyard: {
    title: 'Верф',
    fuel: 'Паливо',
    repair: 'Ремонт корпусу',
    refuelFull: 'Заправити повний бак',
    repairFull: 'Полагодити повністю',
    buyFuel: 'Купити паливо',
    weapons: 'Зброя',
    shields: 'Щити',
    gadgets: 'Гаджети',
    escapePod: 'Рятувальна капсула',
    ships: 'Кораблі',
    tradeIn: 'У залік старого',
    netPrice: 'Доплата',
    slotsFull: 'Немає вільних слотів',
    buyEscapePod: 'Купити рятувальну капсулу',
    hasEscapePod: 'Рятувальна капсула встановлена',
    equip: 'Встановити',
    cargoBaysGadget: '+5 вантажних відсіків',
    installed: 'Встановлені модулі'
  },
  bank: {
    title: 'Галактичний банк',
    loan: 'Кредит',
    debt: 'Поточний борг',
    maxLoan: 'Доступно',
    getLoan: 'Взяти кредит',
    payDebt: 'Погасити борг',
    interest: 'Відсоток: 10% на день',
    insurance: 'Страхування',
    insuranceActive: 'Страхування активне',
    insuranceInactive: 'Без страхування',
    noClaim: 'Знижка за безаварійність',
    buyInsurance: 'Оформити страхування',
    cancelInsurance: 'Скасувати страхування',
    needPod: 'Потрібна рятувальна капсула'
  },
  chart: {
    title: 'Зоряна карта',
    range: 'Дальність',
    distance: 'Відстань',
    fuelNeeded: 'Потрібно палива',
    warp: 'Варп-стрибок',
    inRange: 'У межах дальності',
    outOfRange: 'Поза межами дальності',
    selectTarget: 'Оберіть систему призначення',
    viaWormhole: 'Через червоточину',
    wormholeTax: 'Плата за червоточину',
    unvisited: 'Не досліджено',
    questHere: 'Ціль завдання'
  },
  warp: {
    jumping: 'Триває варп-стрибок',
    skip: 'Пропустити'
  },
  ship: {
    title: 'Ваш корабель',
    type: 'Тип',
    hull: 'Міцність корпусу',
    fuelTank: 'Паливний бак',
    cargoBays: 'Вантажні відсіки',
    weapons: 'Зброя',
    shields: 'Щити',
    gadgets: 'Гаджети',
    crew: 'Екіпаж',
    escapePod: 'Рятувальна капсула',
    skills: 'Навички командира',
    empty: 'порожньо'
  },
  skill: {
    pilot: 'Пілот',
    fighter: 'Боєць',
    trader: 'Торговець',
    engineer: 'Інженер'
  },
  good: {
    water: 'Вода',
    furs: 'Хутро',
    food: 'Їжа',
    ore: 'Руда',
    games: 'Ігри',
    firearms: 'Зброя',
    medicine: 'Ліки',
    machines: 'Машини',
    narcotics: 'Наркотики',
    robots: 'Роботи'
  },
  shipType: {
    flea: 'Блоха',
    gnat: 'Комар',
    dragonfly: 'Бабка',
    firefly: 'Світлячок',
    mosquito: 'Москіт',
    locust: 'Сарана',
    bumblebee: 'Джміль',
    beetle: 'Жук',
    mantis: 'Богомол',
    hornet: 'Шершень',
    grasshopper: 'Коник',
    centipede: 'Стоніжка',
    termite: 'Терміт',
    scorpion: 'Скорпіон',
    wasp: 'Оса',
    widow: 'Вдова'
  },
  encounter: {
    title: 'Зустріч у космосі',
    kind: {
      trader: 'Торговець',
      pirate: 'Пірат',
      police: 'Поліція',
      bountyHunter: 'Мисливець за головами',
      alien: 'Прибулець'
    },
    trader: {
      appear: 'Ви зустріли торговця на кораблі {ship}.',
      ignore: 'Торговець прямує своїм курсом.'
    },
    trade: {
      title: 'Торгівля з торговцем',
      onOffer: 'На продаж',
      wants: 'Купить',
      nothing: 'Наразі нічого.'
    },
    pirate: {
      appear: 'Пірат на {ship} атакує!',
      plundered: 'Пірати пограбували ваш трюм ({qty} од.).',
      extort: 'Пірати вимагали викуп: {amount} кр.'
    },
    bountyHunter: {
      appear: 'Мисливець за головами на {ship} прибув по вашу голову!',
      bribed: 'Мисливець бере {amount} кр і відступає.',
      paid: 'Ви платите мисливцю {amount} кр за свою свободу.'
    },
    alien: {
      appear: 'Невідомий інопланетний корабель (клас {ship}) наближається, зброя напоготові!'
    },
    bounty: {
      appear: 'Розшукуваний пірат {name} нападає!',
      done: '{name} знищено! Винагорода {reward} кр.'
    },
    police: {
      appear: 'Поліцейський патруль на {ship} вимагає зупинитися.',
      clean: 'Огляд завершено. Заборонених товарів не знайдено.',
      impound: 'Знайдено контрабанду! Конфісковано та штраф {fine} кр.',
      incorruptible: 'Ці офіцери непідкупні.',
      bribed: 'Хабар прийнято ({amount} кр). Вас пропускають.',
      arrested: 'Вас заарештовано. Штраф {fine} кр.',
      hidden: 'Прихований відсік спрацював — контрабанду не знайшли.'
    },
    action: {
      attack: 'Атакувати',
      flee: 'Тікати',
      submit: 'Дозволити огляд',
      bribe: 'Дати хабар',
      surrender: 'Здатися',
      ignore: 'Проігнорувати',
      leave: 'Полетіти далі',
      continue: 'Продовжити',
      plunder: 'Пограбувати'
    },
    playerHit: 'Ви влучили! Завдано {dmg} шкоди.',
    playerMiss: 'Ви схибили.',
    oppHit: 'Противник влучив! Отримано {dmg} шкоди.',
    oppMiss: 'Противник схибив.',
    noWeapons: 'У вас немає зброї, щоб атакувати!',
    oppDestroyed: 'Ворожий корабель знищено!',
    playerDestroyed: 'Ваш корабель знищено...',
    escapePod: 'Спрацювала рятувальна капсула. Ви врятувалися!',
    oppSurrendered: 'Противник здається!',
    fledSuccess: 'Вам вдалося втекти.',
    fledFail: 'Втекти не вдалося!',
    salvage: 'Ви підібрали контейнер: {good}.'
  },
  log: {
    title: 'Журнал подій',
    empty: 'Поки що нічого не сталося.',
    gameStart: 'Початок подорожі в системі {system}.',
    arrived: 'Прибуття до системи {system} ({distance} пс).',
    wormhole: 'Стрибок через червоточину до {system} (податок {tax} кр).',
    plunderedTrader: 'Ви пограбували торговця ({qty} од.).',
    crewLeft: 'Нічим платити екіпажу — команда покинула вас.'
  },
  info: {
    bought: 'Куплено {qty} × {good} за {cost} кр.',
    sold: 'Продано {qty} × {good} за {revenue} кр.',
    dumped: 'Викинуто {qty} × {good} у космос.',
    refuelled: 'Заправлено {parsecs} пс за {cost} кр.',
    repaired: 'Відремонтовано {units} од. корпусу за {cost} кр.',
    equipmentBought: 'Спорядження придбано.',
    equipmentSold: 'Спорядження продано.',
    escapePodBought: 'Рятувальну капсулу встановлено.',
    shipBought: 'Придбано новий корабель.',
    mercHired: '{name} приєднався до екіпажу.',
    mercFired: '{name} покинув екіпаж.',
    loanTaken: 'Отримано кредит {amount} кр.',
    debtPaid: 'Погашено борг {amount} кр.',
    insuranceBought: 'Страхування оформлено.',
    insuranceCancelled: 'Страхування скасовано.'
  },
  error: {
    notSold: 'Цей товар тут не продається.',
    cannotBuy: 'Неможливо купити (немає кредитів, місця чи запасів).',
    nothingToSell: 'Немає що продавати.',
    notWanted: 'Тут це не купують.',
    nothingToDump: 'Немає що викидати.',
    tankFull: 'Бак уже повний.',
    noCreditsFuel: 'Недостатньо кредитів на паливо.',
    hullFull: 'Корпус у ідеальному стані.',
    noCreditsRepair: 'Недостатньо кредитів на ремонт.',
    noWeaponSlot: 'Немає вільних слотів для зброї.',
    noShieldSlot: 'Немає вільних слотів для щитів.',
    noGadgetSlot: 'Немає вільних слотів для гаджетів.',
    notEnoughCredits: 'Недостатньо кредитів.',
    alreadyOwned: 'Уже придбано.',
    sameShip: 'Це ваш поточний корабель.',
    cargoNotEmpty: 'Спершу спорожніть трюм.',
    noLoanAvailable: 'Кредит недоступний.',
    nothingToPay: 'Немає боргу для погашення.',
    needEscapePod: 'Спершу купіть рятувальну капсулу.',
    alreadyInsured: 'Страхування вже активне.',
    noInsurance: 'Страхування не оформлене.',
    invalidTarget: 'Некоректна ціль.',
    notEnoughFuel: 'Недостатньо палива для стрибка.',
    cannotAffordWormhole: 'Недостатньо кредитів на податок червоточини.',
    nothingToRemove: 'Немає що знімати.',
    mercNotHere: 'Цього найманця тут немає.',
    noQuarters: 'Немає вільних місць для екіпажу.',
    alreadyHired: 'Уже у вашому екіпажі.',
    notInCrew: 'Його немає у вашому екіпажі.'
  },
  tech: {
    preAgricultural: 'Доаграрний',
    agricultural: 'Аграрний',
    medieval: 'Середньовічний',
    renaissance: 'Ренесанс',
    earlyIndustrial: 'Ранньоіндустріальний',
    industrial: 'Індустріальний',
    postIndustrial: 'Постіндустріальний',
    hiTech: 'Високотехнологічний'
  },
  politics: {
    anarchy: 'Анархія',
    capitalist: 'Капіталізм',
    communist: 'Комунізм',
    confederacy: 'Конфедерація',
    corporate: 'Корпоративна держава',
    cybernetic: 'Кібернетична держава',
    democracy: 'Демократія',
    dictatorship: 'Диктатура',
    fascist: 'Фашистська держава',
    feudal: 'Феодалізм',
    military: 'Військова держава',
    monarchy: 'Монархія',
    pacifist: 'Пацифістська держава',
    socialist: 'Соціалізм',
    satori: 'Стан Саторі',
    technocracy: 'Технократія',
    theocracy: 'Теократія'
  },
  status: {
    uneventful: 'Спокійно',
    war: 'Війна',
    plague: 'Епідемія',
    drought: 'Посуха',
    boredom: 'Нудьга',
    cold: 'Похолодання',
    cropFailure: 'Неврожай',
    lackOfWorkers: 'Брак робочих рук'
  },
  resource: {
    none: 'Немає',
    mineralRich: 'Багаті мінерали',
    mineralPoor: 'Бідні мінерали',
    desert: 'Пустеля',
    sweetwater: 'Прісні океани',
    richSoil: 'Родючий ґрунт',
    poorSoil: 'Бідний ґрунт',
    richFauna: 'Багата фауна',
    lifeless: 'Безживна',
    weirdMushrooms: 'Дивні гриби',
    lotsOfHerbs: 'Цілющі трави',
    artistic: 'Мистецька',
    warlike: 'Войовнича'
  },
  weapon: {
    pulse: 'Імпульсний лазер',
    beam: 'Променевий лазер',
    plasma: 'Плазмова гармата',
    military: 'Військовий лазер',
    fusion: 'Термоядерна гармата'
  },
  shield: {
    energy: 'Енергетичний щит',
    reflective: 'Відбивний щит',
    deflector: 'Дефлекторний щит'
  },
  gadget: {
    cargoBays: 'Додаткові відсіки (+5)',
    autoRepair: 'Система авторемонту',
    navigation: 'Навігаційна система',
    targeting: 'Система наведення',
    fuelCompactor: 'Ущільнювач палива (+3 пс)',
    hiddenCompartment: 'Прихований відсік',
    cloaking: 'Маскувальний пристрій'
  }
} as const
