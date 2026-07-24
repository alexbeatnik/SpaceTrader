import { contextBridge, ipcRenderer } from 'electron'
import type { SaveSlotId, SaveSlotInfo } from '../shared/saves'

const api = {
  saveGame: (slot: SaveSlotId, data: string): Promise<boolean> =>
    ipcRenderer.invoke('save:write', slot, data),
  loadGame: (slot: SaveSlotId): Promise<string | null> => ipcRenderer.invoke('save:read', slot),
  deleteSave: (slot: SaveSlotId): Promise<boolean> => ipcRenderer.invoke('save:delete', slot),
  listSaves: (): Promise<SaveSlotInfo[]> => ipcRenderer.invoke('save:list')
}

contextBridge.exposeInMainWorld('api', api)

export type StarTraderApi = typeof api
