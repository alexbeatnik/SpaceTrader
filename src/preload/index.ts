import { contextBridge, ipcRenderer } from 'electron'

const api = {
  saveGame: (data: string): Promise<boolean> => ipcRenderer.invoke('save:write', data),
  loadGame: (): Promise<string | null> => ipcRenderer.invoke('save:read'),
  hasSave: (): Promise<boolean> => ipcRenderer.invoke('save:exists')
}

contextBridge.exposeInMainWorld('api', api)

export type StarTraderApi = typeof api
