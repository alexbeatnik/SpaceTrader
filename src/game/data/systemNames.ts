// Pool of solar-system names. These are proper nouns and stay identical across
// locales (transliteration happens in the i18n layer only if desired).
//
// The pool must stay comfortably larger than `SYSTEM_COUNT`: galaxy generation
// hands out one name per system and a short pool would start repeating them.
export const SYSTEM_NAMES: string[] = [
  'Acamar', 'Adahn', 'Aldea', 'Andevian', 'Antedi', 'Balosnee', 'Baratas',
  'Brax', 'Bretel', 'Calondia', 'Campor', 'Capelle', 'Carzon', 'Castor',
  'Cestus', 'Cheron', 'Courteney', 'Daled', 'Damast', 'Davlos', 'Deneb',
  'Deneva', 'Devidia', 'Draylon', 'Drema', 'Endor', 'Esmee', 'Exo',
  'Ferris', 'Festen', 'Fourmi', 'Frolix', 'Gemulon', 'Guinifer', 'Hades',
  'Hamlet', 'Helena', 'Hulst', 'Iodine', 'Iralius', 'Janus', 'Japori',
  'Jarada', 'Jason', 'Kaylon', 'Khefka', 'Kira', 'Klaatu', 'Klaestron',
  'Korma', 'Kravat', 'Krios', 'Laertes', 'Largo', 'Lave', 'Ligon', 'Lowry',
  'Magrat', 'Malcoria', 'Melina', 'Mentar', 'Merik', 'Mintaka', 'Montor',
  'Mordan', 'Myrthe', 'Nelvana', 'Nix', 'Nyle', 'Odet', 'Og', 'Omega',
  'Omphalos', 'Orias', 'Othello', 'Parade', 'Penthara', 'Picard', 'Pollux',
  'Quator', 'Rakhar', 'Ran', 'Regulas', 'Relva', 'Rhymus', 'Rochani',
  'Rubicum', 'Rutia', 'Sarpeidon', 'Sefalla', 'Seltrice', 'Sigma', 'Sol',
  'Somari', 'Stakoron', 'Styris', 'Talani', 'Tarchannen', 'Terosa',
  'Thera', 'Titan', 'Torin', 'Triacus', 'Turkana', 'Tyrus', 'Umberlee',
  'Utopia', 'Vadera', 'Vagra', 'Vandor', 'Ventax', 'Xenon', 'Xerxes',
  'Yew', 'Yojimbo', 'Zalkon', 'Zuul',
  // Second wave, added when the galaxy grew past a hundred systems.
  'Abraxas', 'Aegis', 'Ahriman', 'Alcor', 'Amaranth', 'Anshar', 'Aquila',
  'Arcturus', 'Ashkelon', 'Avalon', 'Bellatrix', 'Beshara', 'Caldera',
  'Callisto', 'Carinae', 'Cyrene', 'Dagon', 'Delvaux', 'Dionne', 'Elara',
  'Elysia', 'Enkidu', 'Erebus', 'Fomalhaut', 'Gallia', 'Ganymede', 'Halcyon',
  'Hesperia', 'Ilion', 'Inari', 'Ishtar', 'Kalima', 'Karnak', 'Kestrel',
  'Kobol', 'Lacerta', 'Lorien', 'Lumen', 'Marisol', 'Meridian', 'Mycenae',
  'Nadira', 'Nautilus', 'Nemain', 'Nokomis', 'Obsidia', 'Onyx', 'Ophira',
  'Palatine', 'Perdita', 'Phaeton', 'Quillon', 'Rhadamant', 'Sabik', 'Salara',
  'Sanctus', 'Selene', 'Serafim', 'Solveig', 'Tanager', 'Tashkent', 'Thalassa',
  'Tindalos', 'Ursa', 'Valdris', 'Verity', 'Vespera', 'Wexford', 'Yarrow',
  'Zephyra'
]
