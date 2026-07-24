/**
 * The save-file contract, shared by the Electron main process (which owns the
 * files on disk) and the renderer (which owns the game state inside them).
 *
 * Deliberately free of engine imports: main must be able to list and validate
 * slots without pulling in the game engine, so the on-disk state is described
 * structurally here and stays opaque to everything but the renderer.
 */

/** Slot rewritten automatically after every successful action. */
export const AUTO_SLOT = 'auto'

/** Slots the player fills in explicitly. */
export const MANUAL_SLOT_IDS = ['1', '2', '3', '4', '5', '6'] as const

export const SAVE_SLOT_IDS = [AUTO_SLOT, ...MANUAL_SLOT_IDS] as const

export type SaveSlotId = (typeof SAVE_SLOT_IDS)[number]

/** Bumped when the envelope — not the game state — changes shape. */
export const SAVE_FORMAT = 2

/**
 * Slot ids arrive over IPC from the renderer, so they are untrusted input and
 * must be checked against the fixed set before they reach a file path.
 */
export function isSaveSlotId(value: unknown): value is SaveSlotId {
  return typeof value === 'string' && (SAVE_SLOT_IDS as readonly string[]).includes(value)
}

/** Summary shown on a slot card, so listing saves never needs the engine. */
export interface SaveMeta {
  commanderName: string
  day: number
  credits: number
  shipType: string
  /** Proper noun, identical in every locale. */
  systemName: string
  /** Epoch milliseconds; 0 when the file predates timestamps. */
  savedAt: number
}

/** What actually sits in a slot file. `state` is a serialized `GameState`. */
export interface SaveFile<TState = unknown> {
  format: number
  meta: SaveMeta
  state: TState
}

export interface SaveSlotInfo {
  slot: SaveSlotId
  /** null when the slot is empty or unreadable. */
  meta: SaveMeta | null
  /** True when a file is there but could not be parsed. */
  corrupt?: boolean
}

/**
 * Read a slot file's contents, accepting both the current envelope and the
 * legacy shape (a lone `savegame.json` holding a bare `GameState`) so a voyage
 * in progress survives the upgrade to slots. Returns null if neither fits.
 */
export function parseSaveFile(raw: string): SaveFile | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null
  const obj = parsed as Record<string, unknown>
  if (obj.state && obj.meta) return obj as unknown as SaveFile
  const meta = legacyMeta(obj)
  return meta ? { format: 1, meta, state: obj } : null
}

/**
 * Derive a summary from a bare pre-slots `GameState`. Only the handful of
 * fields the slot card shows are read, all defensively — the file was written
 * by an older build and nothing about it is guaranteed.
 */
function legacyMeta(state: Record<string, unknown>): SaveMeta | null {
  if (typeof state.day !== 'number' || typeof state.commanderName !== 'string') return null
  const systems = Array.isArray(state.systems) ? state.systems : []
  const here = systems[state.currentSystem as number] as { nameId?: string } | undefined
  const ship = state.ship as { type?: string } | undefined
  return {
    commanderName: state.commanderName,
    day: state.day,
    credits: typeof state.credits === 'number' ? state.credits : 0,
    shipType: typeof ship?.type === 'string' ? ship.type : 'flea',
    systemName: typeof here?.nameId === 'string' ? here.nameId : '',
    savedAt: 0
  }
}
