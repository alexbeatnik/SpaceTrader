import type { Mercenary } from '../engine/types'

// Hireable crew. Each mercenary specialises in one or two skills. Their names
// are proper nouns kept identical across locales. Wages scale with total skill.
export const MERCENARIES: Record<string, Mercenary> = {
  alyssa: { id: 'alyssa', profession: 'pilot', skills: { pilot: 9, fighter: 4, trader: 3, engineer: 5, electrician: 4 }, wage: 55 },
  bran: { id: 'bran', profession: 'gunner', skills: { pilot: 3, fighter: 9, trader: 2, engineer: 4, electrician: 3 }, wage: 55 },
  cyra: { id: 'cyra', profession: 'trader', skills: { pilot: 5, fighter: 3, trader: 9, engineer: 4, electrician: 4 }, wage: 55 },
  dex: { id: 'dex', profession: 'mechanic', skills: { pilot: 4, fighter: 4, trader: 3, engineer: 9, electrician: 6 }, wage: 60 },
  elin: { id: 'elin', profession: 'pilot', skills: { pilot: 7, fighter: 7, trader: 4, engineer: 5, electrician: 5 }, wage: 70 },
  ferro: { id: 'ferro', profession: 'gunner', skills: { pilot: 5, fighter: 8, trader: 3, engineer: 7, electrician: 5 }, wage: 70 },
  gwen: { id: 'gwen', profession: 'electrician', skills: { pilot: 6, fighter: 3, trader: 7, engineer: 6, electrician: 8 }, wage: 70 },
  hoshi: { id: 'hoshi', profession: 'pilot', skills: { pilot: 8, fighter: 5, trader: 5, engineer: 6, electrician: 5 }, wage: 75 },
  ivo: { id: 'ivo', profession: 'electrician', skills: { pilot: 2, fighter: 6, trader: 6, engineer: 6, electrician: 9 }, wage: 65 },
  juno: { id: 'juno', profession: 'generalist', skills: { pilot: 6, fighter: 6, trader: 6, engineer: 6, electrician: 6 }, wage: 85 },
  kai: { id: 'kai', profession: 'trader', skills: { pilot: 4, fighter: 5, trader: 8, engineer: 5, electrician: 3 }, wage: 65 },
  lena: { id: 'lena', profession: 'mechanic', skills: { pilot: 7, fighter: 4, trader: 4, engineer: 8, electrician: 7 }, wage: 75 },
  mira: { id: 'mira', profession: 'generalist', skills: { pilot: 3, fighter: 3, trader: 5, engineer: 4, electrician: 4 }, wage: 40 },
  nox: { id: 'nox', profession: 'gunner', skills: { pilot: 5, fighter: 10, trader: 2, engineer: 5, electrician: 2 }, wage: 90 },
  orin: { id: 'orin', profession: 'pilot', skills: { pilot: 10, fighter: 6, trader: 4, engineer: 7, electrician: 5 }, wage: 95 },
  pax: { id: 'pax', profession: 'generalist', skills: { pilot: 4, fighter: 4, trader: 4, engineer: 4, electrician: 4 }, wage: 35 },
  quen: { id: 'quen', profession: 'electrician', skills: { pilot: 6, fighter: 6, trader: 5, engineer: 5, electrician: 8 }, wage: 75 },
  rhea: { id: 'rhea', profession: 'pilot', skills: { pilot: 8, fighter: 4, trader: 6, engineer: 5, electrician: 4 }, wage: 70 },
  sol: { id: 'sol', profession: 'mechanic', skills: { pilot: 5, fighter: 5, trader: 5, engineer: 9, electrician: 8 }, wage: 85 },
  tavi: { id: 'tavi', profession: 'pilot', skills: { pilot: 9, fighter: 5, trader: 3, engineer: 6, electrician: 3 }, wage: 80 },
  ulf: { id: 'ulf', profession: 'gunner', skills: { pilot: 3, fighter: 9, trader: 4, engineer: 6, electrician: 4 }, wage: 75 },
  vera: { id: 'vera', profession: 'trader', skills: { pilot: 6, fighter: 6, trader: 9, engineer: 4, electrician: 5 }, wage: 80 },
  wren: { id: 'wren', profession: 'electrician', skills: { pilot: 7, fighter: 3, trader: 6, engineer: 7, electrician: 9 }, wage: 80 },
  xara: { id: 'xara', profession: 'mechanic', skills: { pilot: 5, fighter: 8, trader: 5, engineer: 8, electrician: 6 }, wage: 95 },
  yuki: { id: 'yuki', profession: 'gunner', skills: { pilot: 8, fighter: 8, trader: 5, engineer: 7, electrician: 7 }, wage: 110 },
  zane: { id: 'zane', profession: 'pilot', skills: { pilot: 10, fighter: 9, trader: 6, engineer: 8, electrician: 7 }, wage: 140 }
}

export const MERCENARY_IDS = Object.keys(MERCENARIES)

export function mercenaryWorth(m: Mercenary): number {
  return (
    m.skills.pilot +
    m.skills.fighter +
    m.skills.trader +
    m.skills.engineer +
    m.skills.electrician
  )
}
