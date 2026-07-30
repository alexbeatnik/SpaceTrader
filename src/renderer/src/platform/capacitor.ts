/**
 * The Capacitor host: Android, and the browser during `npm run dev:web`.
 *
 * Saves live as one JSON file per slot under the app's private data directory,
 * exactly as they do on the desktop — same filenames, same envelope — so the
 * two platforms read each other's files if one is ever copied across.
 *
 * The Filesystem plugin ships a web implementation backed by IndexedDB, so this
 * is also what runs in a plain browser tab. That is deliberate: dev in the
 * browser then exercises the same storage code that ships in the APK, instead
 * of a localStorage stand-in that would hide bugs until the device build.
 */

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Capacitor } from '@capacitor/core'
import { SAVE_SLOT_IDS, parseSaveFile, type SaveSlotId, type SaveSlotInfo } from '@shared/saves'
import { createSlotQueue } from '@shared/saveQueue'
import type { Platform } from './types'

const SAVE_DIR = 'saves'
const DIRECTORY = Directory.Data

const slotPath = (slot: SaveSlotId): string => `${SAVE_DIR}/slot-${slot}.json`

let tmpCounter = 0

/**
 * The plugin signals "no such file" by rejecting, with a message that differs
 * between the Android and web implementations. Nothing here needs to know
 * *why* a stat failed — only whether there is a file to read — so any rejection
 * is treated as absence.
 */
async function exists(path: string): Promise<boolean> {
  try {
    await Filesystem.stat({ path, directory: DIRECTORY })
    return true
  } catch {
    return false
  }
}

async function ensureDir(): Promise<void> {
  try {
    await Filesystem.mkdir({ path: SAVE_DIR, directory: DIRECTORY, recursive: true })
  } catch {
    // Already there. The plugin has no "create if missing", and an existing
    // directory is the overwhelmingly common case, so this is not worth a stat.
  }
}

/**
 * Write-then-rename, for the same reason the desktop does it: autosaves fire
 * after every action, and the process can be killed mid-write at any moment —
 * Android does it routinely, whenever the player switches away and the system
 * wants the memory back. A truncated file must never land where a good save
 * used to be.
 */
async function writeSlot(slot: SaveSlotId, data: string): Promise<boolean> {
  const target = slotPath(slot)
  const tmp = `${target}.${++tmpCounter}.tmp`
  try {
    await ensureDir()
    await Filesystem.writeFile({
      path: tmp,
      data,
      directory: DIRECTORY,
      encoding: Encoding.UTF8,
      recursive: true
    })
    // `rename` replaces the target atomically on Android; the web shim swaps the
    // IndexedDB record, which is as atomic as that backend gets.
    await Filesystem.rename({ from: tmp, to: target, directory: DIRECTORY, toDirectory: DIRECTORY })
    return true
  } catch {
    // Storage errors must not reject into the store's fire-and-forget save.
    // Clear the scratch file so a failing device cannot litter the save folder.
    await Filesystem.deleteFile({ path: tmp, directory: DIRECTORY }).catch(() => {})
    return false
  }
}

/**
 * Scratch files survive a kill mid-write. Nothing ever reads them, but left
 * alone they accumulate for good, so they are swept once at startup — never
 * while the game runs, when one could be in use.
 */
export async function sweepScratchFiles(): Promise<void> {
  try {
    const { files } = await Filesystem.readdir({ path: SAVE_DIR, directory: DIRECTORY })
    for (const file of files) {
      if (file.name.endsWith('.tmp')) {
        await Filesystem.deleteFile({
          path: `${SAVE_DIR}/${file.name}`,
          directory: DIRECTORY
        }).catch(() => {})
      }
    }
  } catch {
    // No save folder yet, or one that will not list: not a reason to fail
    // startup.
  }
}

/**
 * The hardware back gesture, as a plain subscribe/unsubscribe.
 *
 * `@capacitor/app` is loaded lazily — the desktop bundle serves the same
 * renderer and must not pay for a plugin it will never call — which makes
 * registering asynchronous while callers want a synchronous unsubscribe. Hence
 * the `cancelled` flag: a component that unmounts before the import resolves
 * still gets its listener removed rather than leaking one.
 */
function subscribeBackButton(handler: () => void): () => void {
  let remove: (() => void) | undefined
  let cancelled = false

  void import('@capacitor/app').then(async ({ App }) => {
    const handle = await App.addListener('backButton', () => handler())
    if (cancelled) void handle.remove()
    else remove = () => void handle.remove()
  })

  return () => {
    cancelled = true
    remove?.()
  }
}

export function createCapacitorPlatform(): Platform {
  // The same ordering guarantees the desktop relies on. The store fires
  // autosaves without awaiting them here too, and every call is an async hop
  // across the Capacitor bridge, so overlapping writes to one slot are if
  // anything more likely than on the desktop.
  const queue = createSlotQueue()

  const platform = Capacitor.getPlatform()
  // Android is the only host here with a back gesture at all: iOS has none, and
  // the App plugin's web shim registers a `backButton` listener that can never
  // fire while `exitApp` throws outright. Both are no-ops instead.
  const isAndroid = platform === 'android'

  return {
    kind: isAndroid ? 'android' : platform === 'ios' ? 'ios' : 'web',
    touch: Capacitor.isNativePlatform(),
    saves: {
      save: (slot, data) => queue.write(slot, data, writeSlot),

      load: (slot) =>
        queue.enqueue(slot, async () => {
          try {
            const path = slotPath(slot)
            if (!(await exists(path))) return null
            const { data } = await Filesystem.readFile({
              path,
              directory: DIRECTORY,
              encoding: Encoding.UTF8
            })
            // With an encoding set the plugin returns a string; the Blob arm of
            // the union is only reachable on the web without one.
            return typeof data === 'string' ? data : null
          } catch {
            return null
          }
        }),

      remove: (slot) =>
        queue.enqueue(slot, async () => {
          try {
            const path = slotPath(slot)
            if (await exists(path)) await Filesystem.deleteFile({ path, directory: DIRECTORY })
            return true
          } catch {
            return false
          }
        }),

      list: () =>
        Promise.all(
          SAVE_SLOT_IDS.map((slot) =>
            queue.enqueue(slot, async (): Promise<SaveSlotInfo> => {
              const path = slotPath(slot)
              if (!(await exists(path))) return { slot, meta: null }
              try {
                const { data } = await Filesystem.readFile({
                  path,
                  directory: DIRECTORY,
                  encoding: Encoding.UTF8
                })
                const parsed = typeof data === 'string' ? parseSaveFile(data) : null
                // A file that exists but will not parse is reported as damaged
                // rather than empty, so the player can tell "nothing here" from
                // "lost".
                return parsed ? { slot, meta: parsed.meta } : { slot, meta: null, corrupt: true }
              } catch {
                return { slot, meta: null, corrupt: true }
              }
            })
          )
        ),

      flush: () => queue.flush()
    },

    // Play Store installs new versions on Android, and a browser tab just
    // reloads. Nothing here to drive, so the About screen drops the panel.
    updates: null,

    onBackButton: isAndroid ? subscribeBackButton : () => () => {},

    exitApp: isAndroid
      ? () => void import('@capacitor/app').then(({ App }) => App.exitApp())
      : () => {}
  }
}
