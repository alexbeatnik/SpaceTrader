import type { Robot } from '../engine/types'

/**
 * Android crew. A robot costs as much as a decent ship and never draws a wage,
 * but its power cells burn fuel every day it is aboard — and a dry tank leaves
 * it dormant and useless. Each model is a narrow specialist except the utility
 * unit, which is mediocre at everything.
 */
export const ROBOTS: Record<string, Robot> = {
  helm: {
    // Flight-control android: flies the ship, little else.
    id: 'helm',
    profession: 'pilot',
    skills: { pilot: 10, fighter: 3, trader: 1, engineer: 3, electrician: 3 },
    price: 78000,
    minTechLevel: 6
  },
  gunner: {
    // Fire-control android: fast, precise, and utterly single-minded.
    id: 'gunner',
    profession: 'gunner',
    skills: { pilot: 3, fighter: 10, trader: 1, engineer: 3, electrician: 3 },
    price: 84000,
    minTechLevel: 6
  },
  wrench: {
    // Maintenance android: patches hull plate faster than any human crew.
    id: 'wrench',
    profession: 'mechanic',
    skills: { pilot: 2, fighter: 2, trader: 1, engineer: 10, electrician: 6 },
    price: 72000,
    minTechLevel: 6
  },
  spark: {
    // Power-systems android: keeps the wiring from ever catching fire.
    id: 'spark',
    profession: 'electrician',
    skills: { pilot: 2, fighter: 2, trader: 1, engineer: 6, electrician: 10 },
    price: 72000,
    minTechLevel: 6
  },
  utility: {
    // General-purpose unit: covers any station passably, none of them well.
    id: 'utility',
    profession: 'generalist',
    skills: { pilot: 5, fighter: 5, trader: 1, engineer: 5, electrician: 5 },
    price: 55000,
    minTechLevel: 7
  }
}

export const ROBOT_IDS = Object.keys(ROBOTS)
