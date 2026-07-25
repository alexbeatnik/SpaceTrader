import { describe, it, expect } from 'vitest'
import {
  SAVE_FORMAT,
  SAVE_SLOT_IDS,
  isSaveSlotId,
  isSupportedFormat,
  parseSaveFile,
  type SaveFile
} from './saves'

const meta = {
  commanderName: 'Jameson',
  day: 12,
  credits: 4200,
  shipType: 'gnat',
  systemName: 'Acamar',
  savedAt: 1_700_000_000_000
}

describe('save slot ids', () => {
  it('accepts every published slot', () => {
    for (const slot of SAVE_SLOT_IDS) expect(isSaveSlotId(slot)).toBe(true)
  })

  it('rejects anything that could escape the saves directory', () => {
    for (const bad of ['../../etc/passwd', 'auto/../x', '7', '', 'AUTO', null, 1]) {
      expect(isSaveSlotId(bad)).toBe(false)
    }
  })
})

describe('parseSaveFile', () => {
  it('reads back an envelope it wrote', () => {
    const file: SaveFile = { format: SAVE_FORMAT, meta, state: { day: 12 } }
    expect(parseSaveFile(JSON.stringify(file))).toEqual(file)
  })

  it('derives a summary from a legacy bare GameState', () => {
    const legacy = {
      commanderName: 'Solo',
      day: 5,
      credits: 999,
      currentSystem: 1,
      ship: { type: 'flea' },
      systems: [{ nameId: 'Sol' }, { nameId: 'Deneb' }]
    }
    const parsed = parseSaveFile(JSON.stringify(legacy))
    expect(parsed?.format).toBe(1)
    expect(parsed?.state).toEqual(legacy)
    expect(parsed?.meta).toEqual({
      commanderName: 'Solo',
      day: 5,
      credits: 999,
      shipType: 'flea',
      systemName: 'Deneb',
      // Legacy files carry no timestamp; the UI shows this as unknown.
      savedAt: 0
    })
  })

  it('survives a legacy state missing the fields the card shows', () => {
    const parsed = parseSaveFile(JSON.stringify({ commanderName: 'Ghost', day: 1 }))
    expect(parsed?.meta.shipType).toBe('flea')
    expect(parsed?.meta.systemName).toBe('')
    expect(parsed?.meta.credits).toBe(0)
  })

  it('returns null for junk rather than throwing', () => {
    expect(parseSaveFile('not json')).toBeNull()
    expect(parseSaveFile('null')).toBeNull()
    expect(parseSaveFile('[]')).toBeNull()
    expect(parseSaveFile('{"nothing":"useful"}')).toBeNull()
  })

  it('rejects an envelope whose state could not be a GameState', () => {
    // Reported as damaged rather than loaded into a crash further downstream.
    expect(parseSaveFile(JSON.stringify({ format: 2, meta, state: 'a string' }))).toBeNull()
    expect(parseSaveFile(JSON.stringify({ format: 2, meta, state: 42 }))).toBeNull()
  })

  it('rejects an envelope with no usable summary', () => {
    // A slot card built from this used to render "undefined" at the player.
    const state = { day: 12 }
    expect(parseSaveFile(JSON.stringify({ format: 2, meta: 'nonsense', state }))).toBeNull()
    expect(parseSaveFile(JSON.stringify({ format: 2, meta: { day: 3 }, state }))).toBeNull()
  })

  it('defaults summary fields a older build never wrote', () => {
    const state = { day: 12 }
    const parsed = parseSaveFile(
      JSON.stringify({ format: 2, meta: { commanderName: 'Ghost', day: 4 }, state })
    )
    expect(parsed?.meta).toEqual({
      commanderName: 'Ghost',
      day: 4,
      credits: 0,
      shipType: 'flea',
      systemName: '',
      savedAt: 0
    })
  })
})

describe('isSupportedFormat', () => {
  it('accepts this build\'s format and everything older', () => {
    expect(isSupportedFormat(SAVE_FORMAT)).toBe(true)
    expect(isSupportedFormat(1)).toBe(true)
  })

  it('refuses a save from a newer build', () => {
    // Its state may hold shapes this build has no idea how to read, so it is
    // turned away with an explanation instead of loaded into a crash.
    expect(isSupportedFormat(SAVE_FORMAT + 1)).toBe(false)
    expect(isSupportedFormat(Number.NaN)).toBe(false)
  })
})
