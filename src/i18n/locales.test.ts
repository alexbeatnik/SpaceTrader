import { describe, it, expect } from 'vitest'
import { en } from './locales/en'
import { uk } from './locales/uk'
import { NEWS_IDS } from '../game/engine/news'

/** Every leaf key path in a locale dictionary, e.g. "encounter.tractor.held". */
function keyPaths(dict: unknown, prefix = ''): string[] {
  if (typeof dict !== 'object' || dict === null) return [prefix]
  return Object.entries(dict).flatMap(([k, v]) =>
    keyPaths(v, prefix ? `${prefix}.${k}` : k)
  )
}

/** Interpolation placeholders a string uses, e.g. {dmg} -> "dmg". */
function params(value: string): string[] {
  return [...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
}

function leafStrings(dict: unknown, prefix = ''): Map<string, string> {
  const out = new Map<string, string>()
  if (typeof dict === 'string') {
    out.set(prefix, dict)
    return out
  }
  if (typeof dict !== 'object' || dict === null) return out
  for (const [k, v] of Object.entries(dict)) {
    for (const [key, str] of leafStrings(v, prefix ? `${prefix}.${k}` : k)) out.set(key, str)
  }
  return out
}

describe('locale dictionaries', () => {
  it('define exactly the same key structure', () => {
    const enKeys = keyPaths(en).sort()
    const ukKeys = keyPaths(uk).sort()
    expect(ukKeys.filter((k) => !enKeys.includes(k))).toEqual([]) // extra in uk
    expect(enKeys.filter((k) => !ukKeys.includes(k))).toEqual([]) // missing from uk
  })

  it('use the same interpolation params on both sides', () => {
    const enStrings = leafStrings(en)
    const ukStrings = leafStrings(uk)
    const mismatched: string[] = []
    for (const [key, enValue] of enStrings) {
      const ukValue = ukStrings.get(key)
      if (ukValue === undefined) continue
      if (params(enValue).join(',') !== params(ukValue).join(',')) mismatched.push(key)
    }
    expect(mismatched).toEqual([])
  })

  it('carry a headline and a body for every news story the engine can run', () => {
    // A template whose id has no prose reaches the player as a raw key like
    // "news.faunaSafari.headline". Parity between the two dictionaries cannot
    // catch it — both would be missing it — so the story list is the check.
    const enStrings = leafStrings(en)
    const ukStrings = leafStrings(uk)
    const missing: string[] = []
    for (const id of NEWS_IDS) {
      for (const part of ['headline', 'body']) {
        const key = `news.${id}.${part}`
        if (!enStrings.has(key)) missing.push(`en:${key}`)
        if (!ukStrings.has(key)) missing.push(`uk:${key}`)
      }
    }
    expect(missing).toEqual([])
  })

  it('run no story twice under two ids', () => {
    expect(new Set(NEWS_IDS).size).toBe(NEWS_IDS.length)
  })
})
