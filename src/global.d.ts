import type { WpcAsset, WpcAssetInput, WpcVault } from '../shared/types'

export {}

declare global {
  interface Window {
    hoshisen?: {
      loadVault: () => Promise<{ vault: WpcVault; recovered: boolean }>
      saveVault: (vault: WpcVault) => Promise<{ ok: true } | { ok: false; message: string }>
      saveVaultNow: (vault: WpcVault) => { ok: boolean; message?: string }
      saveAsset: (input: WpcAssetInput) => Promise<WpcAsset>
      deleteAsset: (id: string) => Promise<{ ok: true }>
      backup: () => Promise<{ path: string }>
      reveal: () => Promise<{ path: string }>
      root: () => Promise<{ path: string }>
      exportText: (input: { title: string; content: string }) => Promise<{ path: string }>
      locate: () => Promise<{ ok: true; latitude: number; longitude: number } | { ok: false; reason: 'denied' | 'unavailable' }>
      onOpenSheet: (callback: () => void) => () => void
    }
  }
}
