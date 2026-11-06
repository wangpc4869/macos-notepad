import { contextBridge, ipcRenderer } from 'electron'
import type { WpcAsset, WpcAssetInput, WpcVault } from '../shared/types'

/**
 * 把主进程的本地读写能力交给页面，页面本身碰不到文件系统。
 */
contextBridge.exposeInMainWorld('hoshisen', {
  loadVault: (): Promise<{ vault: WpcVault; recovered: boolean }> => ipcRenderer.invoke('vault:load'),
  saveVault: (vault: WpcVault): Promise<{ ok: true } | { ok: false; message: string }> => ipcRenderer.invoke('vault:save', vault),
  saveVaultNow: (vault: WpcVault): { ok: boolean; message?: string } => ipcRenderer.sendSync('vault:save-now', vault) as { ok: boolean; message?: string },
  saveAsset: (input: WpcAssetInput): Promise<WpcAsset> => ipcRenderer.invoke('asset:save', input),
  deleteAsset: (id: string): Promise<{ ok: true }> => ipcRenderer.invoke('asset:delete', id),
  backup: (): Promise<{ path: string }> => ipcRenderer.invoke('vault:backup'),
  reveal: (): Promise<{ path: string }> => ipcRenderer.invoke('vault:reveal'),
  root: (): Promise<{ path: string }> => ipcRenderer.invoke('vault:root'),
  exportText: (input: { title: string; content: string }): Promise<{ path: string }> => ipcRenderer.invoke('vault:export', input),
  locate: (): Promise<{ ok: true; latitude: number; longitude: number } | { ok: false; reason: 'denied' | 'unavailable' }> =>
    ipcRenderer.invoke('location:get'),
  onOpenSheet: (callback: () => void): (() => void) => {
    const listener = (): void => callback()
    ipcRenderer.on('menu:sheet', listener)
    return () => ipcRenderer.removeListener('menu:sheet', listener)
  },
})
