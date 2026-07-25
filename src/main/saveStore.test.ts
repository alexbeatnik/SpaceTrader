import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, readFile, writeFile, readdir, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { createSaveStore, type SaveStore } from './saveStore'
import { SAVE_FORMAT, type SaveFile } from '../shared/saves'

let dir: string
let saves: SaveStore

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'star-trader-saves-'))
  saves = createSaveStore(() => dir)
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

/** An envelope of roughly the size a real voyage produces. */
function envelope(commanderName: string, padBytes: number): string {
  const file: SaveFile = {
    format: SAVE_FORMAT,
    meta: {
      commanderName,
      day: 1,
      credits: 0,
      shipType: 'flea',
      systemName: 'Sol',
      savedAt: 1
    },
    state: { who: commanderName, pad: 'x'.repeat(padBytes) }
  }
  return JSON.stringify(file)
}

async function whoIsInSlot(): Promise<string> {
  const raw = await readFile(join(dir, 'slot-auto.json'), 'utf-8')
  return JSON.parse(raw).state.who
}

describe('write ordering', () => {
  it('leaves the newest state on disk when writes overlap', async () => {
    // The renderer fires autosaves without awaiting them. Before these were
    // queued, the *last to finish* won rather than the last requested — and a
    // big save from a played-in galaxy really did land on top of the small one
    // that replaced it.
    for (let round = 0; round < 20; round++) {
      const first = saves.write('auto', envelope('old', 356_000))
      const second = saves.write('auto', envelope('new', 215_000))
      await Promise.all([first, second])
      expect(await whoIsInSlot()).toBe('new')
    }
  })

  it('reports success to every writer, superseded ones included', async () => {
    const results = await Promise.all([
      saves.write('auto', envelope('a', 1000)),
      saves.write('auto', envelope('b', 1000)),
      saves.write('auto', envelope('c', 1000))
    ])
    expect(results).toEqual([true, true, true])
    expect(await whoIsInSlot()).toBe('c')
  })

  it('drops states that never needed to reach the disk', async () => {
    // Ten actions in a burst are one file on disk, not ten: only the write
    // already running and the newest queued state are ever written.
    const writes = Array.from({ length: 10 }, (_, i) => saves.write('auto', envelope(`s${i}`, 5000)))
    await Promise.all(writes)
    expect(await whoIsInSlot()).toBe('s9')
    // The scratch file for each real write is renamed away; none may survive.
    expect((await readdir(dir)).filter((f) => f.endsWith('.tmp'))).toEqual([])
  })

  it('keeps slots independent of one another', async () => {
    await Promise.all([
      saves.write('auto', envelope('auto-game', 1000)),
      saves.write('3', envelope('slot-three', 1000))
    ])
    expect(await whoIsInSlot()).toBe('auto-game')
    const three = JSON.parse(await readFile(join(dir, 'slot-3.json'), 'utf-8'))
    expect(three.state.who).toBe('slot-three')
  })
})

describe('reads and deletes queue behind writes', () => {
  it('reads back a write that has not finished yet', async () => {
    const write = saves.write('auto', envelope('fresh', 200_000))
    const raw = await saves.read('auto')
    await write
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw!).state.who).toBe('fresh')
  })

  it('does not let an in-flight write resurrect a deleted slot', async () => {
    void saves.write('auto', envelope('doomed', 200_000))
    await saves.remove('auto')
    expect(existsSync(join(dir, 'slot-auto.json'))).toBe(false)
    expect(await saves.read('auto')).toBeNull()
  })

  it('lists a slot with the state its own write just put there', async () => {
    const write = saves.write('2', envelope('Jameson', 200_000))
    const slots = await saves.list()
    await write
    expect(slots.find((s) => s.slot === '2')?.meta?.commanderName).toBe('Jameson')
  })
})

describe('list', () => {
  it('tells an empty slot apart from a damaged one', async () => {
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'slot-1.json'), 'not json at all', 'utf-8')
    await saves.write('2', envelope('Solo', 100))

    const slots = await saves.list()
    expect(slots.find((s) => s.slot === '1')).toEqual({ slot: '1', meta: null, corrupt: true })
    expect(slots.find((s) => s.slot === '4')).toEqual({ slot: '4', meta: null })
    expect(slots.find((s) => s.slot === '2')?.meta?.commanderName).toBe('Solo')
  })
})

describe('flush', () => {
  it('has everything on disk once it resolves', async () => {
    void saves.write('auto', envelope('last-action', 300_000))
    expect(saves.hasPending()).toBe(true)
    await saves.flush()
    expect(saves.hasPending()).toBe(false)
    expect(await whoIsInSlot()).toBe('last-action')
  })
})

describe('housekeeping', () => {
  it('sweeps scratch files an earlier run abandoned', async () => {
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'slot-auto.json.1234.7.tmp'), 'half a save', 'utf-8')
    await saves.write('auto', envelope('keep me', 100))

    await saves.sweepScratchFiles()

    expect((await readdir(dir)).filter((f) => f.endsWith('.tmp'))).toEqual([])
    expect(await whoIsInSlot()).toBe('keep me')
  })

  it('moves a pre-slots savegame.json into the autosave slot', async () => {
    await mkdir(dir, { recursive: true })
    const legacy = { commanderName: 'Jameson', day: 9, credits: 12, currentSystem: 0, systems: [] }
    await writeFile(join(dir, 'savegame.json'), JSON.stringify(legacy), 'utf-8')

    await saves.migrateLegacySave()

    expect(existsSync(join(dir, 'savegame.json'))).toBe(false)
    const slots = await saves.list()
    expect(slots.find((s) => s.slot === 'auto')?.meta?.commanderName).toBe('Jameson')
  })

  it('leaves an existing autosave alone when a legacy file is also present', async () => {
    await saves.write('auto', envelope('current voyage', 100))
    await writeFile(join(dir, 'savegame.json'), JSON.stringify({ commanderName: 'Old', day: 1 }), 'utf-8')

    await saves.migrateLegacySave()

    expect(await whoIsInSlot()).toBe('current voyage')
    expect(existsSync(join(dir, 'savegame.json'))).toBe(true)
  })
})
