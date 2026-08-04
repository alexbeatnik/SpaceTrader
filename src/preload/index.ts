import { contextBridge, ipcRenderer } from 'electron'
import type { SaveSlotId, SaveSlotInfo } from '../shared/saves'
// From shared, not from main: every other consumer of this type already reads it
// there, and the one import pointing at main is what would quietly drag the
// updater's module graph back across a bundle boundary the day it stops being a
// type-only import.
import type { UpdateStatus } from '../shared/updates'

const api = {
  saveGame: (slot: SaveSlotId, data: string): Promise<boolean> =>
    ipcRenderer.invoke('save:write', slot, data),
  loadGame: (slot: SaveSlotId): Promise<string | null> => ipcRenderer.invoke('save:read', slot),
  deleteSave: (slot: SaveSlotId): Promise<boolean> => ipcRenderer.invoke('save:delete', slot),
  listSaves: (): Promise<SaveSlotInfo[]> => ipcRenderer.invoke('save:list'),

  // --- Self-update ---
  updateStatus: (): Promise<UpdateStatus> => ipcRenderer.invoke('update:status'),
  checkForUpdate: (): Promise<UpdateStatus> => ipcRenderer.invoke('update:check'),
  installUpdate: (): Promise<boolean> => ipcRenderer.invoke('update:install'),
  /** Subscribe to update progress; returns an unsubscribe function. */
  onUpdateStatus: (cb: (status: UpdateStatus) => void): (() => void) => {
    const listener = (_e: unknown, status: UpdateStatus): void => cb(status)
    ipcRenderer.on('update:status', listener)
    return () => ipcRenderer.removeListener('update:status', listener)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type SpaceTraderApi = typeof api
