import { uk } from './locales/uk'
import { en } from './locales/en'

export type Locale = 'uk' | 'en'
export type Dict = Record<string, unknown>

const DICTS: Record<Locale, Dict> = { uk, en }
export const LOCALES: Locale[] = ['uk', 'en']
const STORAGE_KEY = 'star-trader:locale'

const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
let current: Locale = LOCALES.includes(stored as Locale) ? (stored as Locale) : 'en'

const listeners = new Set<() => void>()

export function getLocale(): Locale {
  return current
}

export function setLocale(locale: Locale): void {
  if (locale === current) return
  current = locale
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, locale)
  listeners.forEach((l) => l())
}

export function subscribeLocale(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function resolve(dict: Dict, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object') return (acc as Dict)[part]
    return undefined
  }, dict)
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in params ? String(params[k]) : `{${k}}`
  )
}

/** Translate a dot-path key with optional {param} interpolation. */
export function t(key: string, params?: Record<string, string | number>): string {
  const value = resolve(DICTS[current], key) ?? resolve(DICTS.en, key)
  if (typeof value === 'string') return interpolate(value, params)
  return key
}

// Domain name helpers -------------------------------------------------------
export const goodName = (id: string): string => t(`good.${id}`)
export const shipName = (id: string): string => t(`shipType.${id}`)
export const shipClassName = (id: string): string => t(`shipClass.${id}`)
export const politicsName = (id: string): string => t(`politics.${id}`)
export const techLevelName = (id: string): string => t(`tech.${id}`)
export const statusName = (id: string): string => t(`status.${id}`)
export const resourceName = (id: string): string => t(`resource.${id}`)
export const economyName = (id: string): string => t(`economy.${id}`)
export const weaponName = (id: string): string => t(`weapon.${id}`)
export const shieldName = (id: string): string => t(`shield.${id}`)
export const gadgetName = (id: string): string => t(`gadget.${id}`)
export const mercName = (id: string): string => t(`merc.${id}`)

/**
 * Translate a log/encounter message, auto-localising known id params
 * (good, ship) into their display names before interpolation.
 */
export function renderMessage(
  key: string,
  params?: Record<string, string | number>
): string {
  if (!params) return t(key)
  const mapped: Record<string, string | number> = { ...params }
  // Empty-string params (e.g. a quest without a good) are left untouched so
  // they never resolve to a bogus key like "good.".
  if (typeof mapped.good === 'string' && mapped.good) mapped.good = goodName(mapped.good)
  if (typeof mapped.ship === 'string' && mapped.ship) mapped.ship = shipName(mapped.ship)
  if (typeof mapped.name === 'string' && mapped.name) mapped.name = mercName(mapped.name)
  // Some params carry an i18n key (e.g. a skill, status or standing) to be
  // localised inline.
  if (typeof mapped.skill === 'string' && mapped.skill.startsWith('skill.')) mapped.skill = t(mapped.skill)
  if (typeof mapped.status === 'string' && mapped.status.startsWith('status.')) mapped.status = t(mapped.status)
  if (typeof mapped.standing === 'string' && mapped.standing.startsWith('standing.')) {
    mapped.standing = t(mapped.standing)
  }
  if (typeof mapped.kind === 'string' && mapped.kind.startsWith('encounter.kind.')) {
    mapped.kind = t(mapped.kind)
  }
  return t(key, mapped)
}
