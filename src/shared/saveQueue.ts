/**
 * Ordering guarantees for slot writes, independent of where the bytes land.
 *
 * Extracted from the Electron save store because Android needs exactly the same
 * promises: the renderer fires autosaves without awaiting them on every
 * platform, so two writes to a slot genuinely overlap there too, and whichever
 * backend is underneath — fs, or a Capacitor plugin hop across the JS bridge —
 * the last write to *finish* is not the last one *requested*. Holding that
 * logic in one place keeps the two platforms from drifting apart on the one
 * behaviour a player would notice as "the game ate my run".
 *
 * Deliberately free of any I/O: the caller supplies the commit step, so this
 * stays pure and testable on its own.
 */

import type { SaveSlotId } from './saves'

export interface SlotQueue {
  /**
   * Run `task` once every operation already queued for `slot` has finished.
   * Reads and deletes go through here so a slot is never observed or removed
   * while its own write is still in the air.
   */
  enqueue<T>(slot: SaveSlotId, task: () => Promise<T>): Promise<T>
  /**
   * Queue a write, collapsing it with any state for the same slot that has not
   * started yet. `commit` does the actual writing and must never reject.
   */
  write(
    slot: SaveSlotId,
    data: string,
    commit: (slot: SaveSlotId, data: string) => Promise<boolean>
  ): Promise<boolean>
  /** Wait for every queued operation to finish. */
  flush(): Promise<void>
  /** Whether anything is still on its way to storage. */
  hasPending(): boolean
}

export function createSlotQueue(): SlotQueue {
  /** The tail of each slot's chain, so the next operation can queue behind it. */
  const chain = new Map<SaveSlotId, Promise<void>>()
  /** Every chain still outstanding, so a quit can wait for them. */
  const active = new Set<Promise<void>>()
  /** The newest state waiting its turn per slot, and everyone awaiting its fate. */
  const queued = new Map<SaveSlotId, { data: string; waiters: ((ok: boolean) => void)[] }>()

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

  return {
    enqueue,

    write(slot, data, commit) {
      const pending = queued.get(slot)
      if (pending) {
        // A newer state supersedes one that has not reached storage yet: the
        // stale bytes are dropped rather than written and instantly
        // overwritten. Autosaves fire after every action, so this also spares
        // the device a great deal of pointless work during mining and combat.
        pending.data = data
        return new Promise<boolean>((resolve) => pending.waiters.push(resolve))
      }

      const job: { data: string; waiters: ((ok: boolean) => void)[] } = { data, waiters: [] }
      queued.set(slot, job)
      return enqueue(slot, async () => {
        // Read the data at the last moment: anything that arrived while this
        // job sat in the queue has already folded itself into `job.data`.
        queued.delete(slot)
        const ok = await commit(slot, job.data)
        for (const waiter of job.waiters) waiter(ok)
        return ok
      })
    },

    async flush() {
      // Awaiting the tail can let a queued write start a fresh one behind it,
      // so this drains rather than waits once. Bounded: nothing new is queued
      // once the window is gone, and stuck storage must not hold a quit open
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
