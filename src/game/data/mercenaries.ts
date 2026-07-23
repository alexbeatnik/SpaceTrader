import type { Mercenary } from '../engine/types'

// Hireable crew. Each mercenary specialises in one or two skills. Their names
// are proper nouns kept identical across locales. Wages scale with total skill.
export const MERCENARIES: Record<string, Mercenary> = {
  alyssa: { id: 'alyssa', skills: { pilot: 9, fighter: 4, trader: 3, engineer: 5 }, wage: 55 },
  bran: { id: 'bran', skills: { pilot: 3, fighter: 9, trader: 2, engineer: 4 }, wage: 55 },
  cyra: { id: 'cyra', skills: { pilot: 5, fighter: 3, trader: 9, engineer: 4 }, wage: 55 },
  dex: { id: 'dex', skills: { pilot: 4, fighter: 4, trader: 3, engineer: 9 }, wage: 55 },
  elin: { id: 'elin', skills: { pilot: 7, fighter: 7, trader: 4, engineer: 5 }, wage: 70 },
  ferro: { id: 'ferro', skills: { pilot: 5, fighter: 8, trader: 3, engineer: 7 }, wage: 70 },
  gwen: { id: 'gwen', skills: { pilot: 6, fighter: 3, trader: 7, engineer: 6 }, wage: 65 },
  hoshi: { id: 'hoshi', skills: { pilot: 8, fighter: 5, trader: 5, engineer: 6 }, wage: 75 },
  ivo: { id: 'ivo', skills: { pilot: 2, fighter: 6, trader: 6, engineer: 6 }, wage: 55 },
  juno: { id: 'juno', skills: { pilot: 6, fighter: 6, trader: 6, engineer: 6 }, wage: 80 },
  kai: { id: 'kai', skills: { pilot: 4, fighter: 5, trader: 8, engineer: 5 }, wage: 65 },
  lena: { id: 'lena', skills: { pilot: 7, fighter: 4, trader: 4, engineer: 8 }, wage: 70 },
  mira: { id: 'mira', skills: { pilot: 3, fighter: 3, trader: 5, engineer: 4 }, wage: 40 },
  nox: { id: 'nox', skills: { pilot: 5, fighter: 10, trader: 2, engineer: 5 }, wage: 90 },
  orin: { id: 'orin', skills: { pilot: 10, fighter: 6, trader: 4, engineer: 7 }, wage: 95 },
  pax: { id: 'pax', skills: { pilot: 4, fighter: 4, trader: 4, engineer: 4 }, wage: 35 },
  quen: { id: 'quen', skills: { pilot: 6, fighter: 7, trader: 5, engineer: 5 }, wage: 70 },
  rhea: { id: 'rhea', skills: { pilot: 8, fighter: 4, trader: 6, engineer: 5 }, wage: 70 },
  sol: { id: 'sol', skills: { pilot: 5, fighter: 5, trader: 5, engineer: 9 }, wage: 75 },
  tavi: { id: 'tavi', skills: { pilot: 9, fighter: 5, trader: 3, engineer: 6 }, wage: 80 },
  ulf: { id: 'ulf', skills: { pilot: 3, fighter: 9, trader: 4, engineer: 6 }, wage: 75 },
  vera: { id: 'vera', skills: { pilot: 6, fighter: 6, trader: 9, engineer: 4 }, wage: 80 },
  wren: { id: 'wren', skills: { pilot: 7, fighter: 3, trader: 6, engineer: 7 }, wage: 70 },
  xara: { id: 'xara', skills: { pilot: 5, fighter: 8, trader: 5, engineer: 8 }, wage: 90 },
  yuki: { id: 'yuki', skills: { pilot: 8, fighter: 8, trader: 5, engineer: 7 }, wage: 100 },
  zane: { id: 'zane', skills: { pilot: 10, fighter: 9, trader: 6, engineer: 8 }, wage: 125 }
}

export const MERCENARY_IDS = Object.keys(MERCENARIES)

export function mercenaryWorth(m: Mercenary): number {
  return m.skills.pilot + m.skills.fighter + m.skills.trader + m.skills.engineer
}
