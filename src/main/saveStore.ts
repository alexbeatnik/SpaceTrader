/**
 * The save folder, and the only code allowed to touch it.
 *
 * Kept free of Electron so the ordering guarantees below can be tested for real
 * rather than reasoned about: the app supplies the userData path, tests supply a
 * temp one.
 */

import { join } from 'path'
import { readFile, writeFile, mkdir, rename, unlink, readdir, copyFile } from 'fs/promises'
import { existsSync } from 'fs'
import { AUTO_SLOT, SAVE_SLOT_IDS, parseSaveFile, type SaveSlotId, type SaveSlotInfo } from '../shared/saves'

const delay = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/** Codes Windows returns when something else holds the file for an instant. */
const RETRYABLE = ['EPERM', 'EBUSY', 'EACCES']

export interface SaveStore {
  write(slot: SaveSlotId, data: string): Promise<boolean>
  read(slot: SaveSlotId): Promise<string | null>
  remove(slot: SaveSlotId): Promise<boolean>
  list(): Promise<SaveSlotInfo[]>
  /** Move a pre-slots `savegame.json` into the autosave slot. */
  migrateLegacySave(): Promise<void>
  /** Take over the save folder the app used under its previous name. */
  adoptSavesFrom(oldDir: string): Promise<void>
  /** Delete scratch files abandoned by an earlier run. */
  sweepScratchFiles(): Promise<void>
  /** Wait for every queued write to reach the disk. */
  flush(): Promise<void>
  /** Whether anything is still on its way to disk. */
  hasPending(): boolean
}

export function createSaveStore(getDir: () => string): SaveStore {
  const slotFile = (slot: SaveSlotId): string => join(getDir(), `slot-${slot}.json`)
  /** The single save file used before slots existed. */
  const legacyFile = (): string => join(getDir(), 'savegame.json')

  let tmpCounter = 0

  async function ensureDir(): Promise<void> {
    const dir = getDir()
    if (!existsSync(dir)) await mkdir(dir, { recursive: true })
  }

  /**
   * Windows hands out EPERM/EBUSY when anything else — an indexer, an antivirus
   * scanner, the player's own backup tool — holds the target open for the
   * instant of the rename. Backing off costs a few milliseconds and turns a
   * silently lost save into a successful one.
   */
  async function renameWithRetry(from: string, to: string): Promise<void> {
    for (let attempt = 0; ; attempt++) {
      try {
        await rename(from, to)
        return
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code ?? ''
        if (attempt >= 4 || !RETRYABLE.includes(code)) throw err
        await delay(20 * (attempt + 1))
      }
    }
  }

  async function writeSlot(slot: SaveSlotId, data: string): Promise<boolean> {
    const target = slotFile(slot)
    const tmp = `${target}.${process.pid}.${++tmpCounter}.tmp`
    try {
      await ensureDir()
      // Write-then-rename: autosaves fire after every action, and a crash or a
      // full disk mid-write must never leave a truncated file where a good save
      // used to be.
      await writeFile(tmp, data, 'utf-8')
      await renameWithRetry(tmp, target)
      return true
    } catch {
      // Disk errors must not reject into the renderer's fire-and-forget save.
      // Clear the scratch file so a failing disk cannot litter the save folder.
      await unlink(tmp).catch(() => {})
      return false
    }
  }

  // --- Ordering ------------------------------------------------------------
  /**
   * Every operation on a slot runs strictly one at a time, in the order it was
   * asked for.
   *
   * The renderer fires autosaves without awaiting them, so two writes to a slot
   * genuinely overlap — and because they finish on the libuv thread pool, the
   * last one to *finish* is not the last one *requested*. A 350 KB save from a
   * played-in galaxy really does land after the smaller one meant to replace
   * it, which silently rolled the player back an action, or dropped a finished
   * voyage back over a brand-new game. Reads and deletes join the same queue,
   * so a slot is never listed or removed while its own write is still in the
   * air.
   */
  const chain = new Map<SaveSlotId, Promise<void>>()
  /** Every chain still outstanding, so a quit can wait for them. */
  const active = new Set<Promise<void>>()

  function enqueue<T>(slot: SaveSlotId, task: () => Promise<T>): Promise<T> {
    // Both arms run `task`: one operation failing must not strand the queue.
    const result = (chain.get(slot) ?? Promise.resolve()).then(task, task)
    const done = result.then(
      () => {},
      () => {}
    )
    chain.set(slot, done)
    active.add(done)
    void done.then(() => {
      active.delete(done)
      if (chain.get(slot) === done) chain.delete(slot)
    })
    return result
  }

  /** The newest state waiting its turn per slot, and everyone awaiting its fate. */
  const queued = new Map<SaveSlotId, { data: string; waiters: ((ok: boolean) => void)[] }>()

  return {
    write(slot, data) {
      const pending = queued.get(slot)
      if (pending) {
        // A newer state supersedes one that has not reached the disk yet: the
        // stale bytes are dropped rather than written and instantly
        // overwritten. Autosaves fire after every action, so this also spares
        // the disk a great deal of pointless work during mining and combat.
        pending.data = data
        return new Promise<boolean>((resolve) => pending.waiters.push(resolve))
      }

      const job: { data: string; waiters: ((ok: boolean) => void)[] } = { data, waiters: [] }
      queued.set(slot, job)
      return enqueue(slot, async () => {
        // Read the data at the last moment: anything that arrived while this
        // job sat in the queue has already folded itself into `job.data`.
        queued.delete(slot)
        const ok = await writeSlot(slot, job.data)
        for (const waiter of job.waiters) waiter(ok)
        return ok
      })
    },

    read(slot) {
      return enqueue(slot, async () => {
        try {
          const file = slotFile(slot)
          if (!existsSync(file)) return null
          return await readFile(file, 'utf-8')
        } catch {
          return null
        }
      })
    },

    remove(slot) {
      return enqueue(slot, async () => {
        try {
          const file = slotFile(slot)
          if (existsSync(file)) await unlink(file)
          return true
        } catch {
          return false
        }
      })
    },

    list() {
      return Promise.all(
        SAVE_SLOT_IDS.map((slot) =>
          enqueue(slot, async (): Promise<SaveSlotInfo> => {
            const file = slotFile(slot)
            if (!existsSync(file)) return { slot, meta: null }
            try {
              const parsed = parseSaveFile(await readFile(file, 'utf-8'))
              // A file that exists but will not parse is reported as damaged
              // rather than empty, so the player can tell "nothing here" from
              // "lost".
              return parsed ? { slot, meta: parsed.meta } : { slot, meta: null, corrupt: true }
            } catch {
              return { slot, meta: null, corrupt: true }
            }
          })
        )
      )
    },

    /**
     * Move a pre-slots `savegame.json` into the autosave slot so an in-progress
     * voyage survives the upgrade. Runs once — after the move the file is gone.
     */
    async migrateLegacySave() {
      try {
        if (!existsSync(legacyFile()) || existsSync(slotFile(AUTO_SLOT))) return
        await ensureDir()
        await rename(legacyFile(), slotFile(AUTO_SLOT))
      } catch {
        // A failed migration must never keep the app from starting; the legacy
        // file is left untouched and the player simply starts a new voyage.
      }
    },

    /**
     * Take over the save folder the app used under its previous name.
     *
     * Electron derives userData from package.json's `name`, so renaming the
     * game from "star-trader" to "space-trader" moved the whole folder and left
     * the player's voyages behind in the old one. They are copied, not moved:
     * anyone who rolls back to an older build still finds their commander where
     * they left them, and a copy that fails halfway cannot destroy the only
     * surviving save.
     */
    async adoptSavesFrom(oldDir) {
      try {
        if (oldDir === getDir() || !existsSync(oldDir)) return
        // Anything already written under the new name wins outright: this must
        // never land on top of a voyage started since the rename.
        if (SAVE_SLOT_IDS.some((slot) => existsSync(slotFile(slot)))) return
        if (existsSync(legacyFile())) return

        const legacySource = join(oldDir, 'savegame.json')
        const sources = SAVE_SLOT_IDS.map(
          (slot) => [join(oldDir, `slot-${slot}.json`), slotFile(slot)] as const
        )
        // A pre-slots save left in the old folder comes across as-is;
        // migrateLegacySave promotes it to the autosave slot right after.
        if (existsSync(legacySource)) sources.push([legacySource, legacyFile()] as const)
        if (!sources.some(([from]) => existsSync(from))) return

        await ensureDir()
        for (const [from, to] of sources) {
          if (existsSync(from)) await copyFile(from, to)
        }
      } catch {
        // Saves that will not copy are not a reason to fail startup — the old
        // folder is untouched, so nothing is lost that was not already there.
      }
    },

    /**
     * Scratch files survive a crash or a kill mid-write. Nothing ever reads
     * them, but left alone they pile up in the save folder for good, so they
     * are swept once at startup — never while the app runs, when one could be
     * in use.
     */
    async sweepScratchFiles() {
      try {
        const dir = getDir()
        if (!existsSync(dir)) return
        for (const name of await readdir(dir)) {
          if (name.endsWith('.tmp')) await unlink(join(dir, name)).catch(() => {})
        }
      } catch {
        // A save folder that will not list is not a reason to fail startup.
      }
    },

    async flush() {
      // Awaiting the tail can let a queued write start a fresh one behind it,
      // so this drains rather than waits once. Bounded: nothing new is queued
      // once the window is gone, and a stuck disk must not hold a quit open
      // forever.
      for (let pass = 0; pass < 10 && active.size > 0; pass++) {
        await Promise.allSettled([...active])
      }
    },

    hasPending() {
      return active.size > 0
    }
  }
}
