import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { wpc_withoutAsset } from '../../shared/pure'
import type { WpcAsset, WpcVault } from '../../shared/types'
import {
  wpc_deleteAssetFile,
  wpc_fetchRoot,
  wpc_loadVault,
  wpc_saveVault,
  wpc_saveVaultNow,
  wpc_uploadAsset,
} from '../lib/api'
import { wpc_compressImage } from '../lib/image'

interface WpcVaultApi {
  vault: WpcVault | null
  ready: boolean
  error: string
  notice: string
  dataPath: string
  wpc_mutate: (recipe: (vault: WpcVault) => WpcVault, immediate?: boolean) => void
  wpc_notify: (text: string) => void
  wpc_reload: () => Promise<void>
  wpc_addImages: (files: File[]) => Promise<WpcAsset[]>
  wpc_removeAsset: (id: string) => Promise<void>
}

const WpcVaultContext = createContext<WpcVaultApi | null>(null)

/**
 * 读取手帐上下文。
 */
export const wpc_useVault = (): WpcVaultApi => {
  const value = useContext(WpcVaultContext)
  if (!value) throw new Error('手稿还没有准备好')
  return value
}

/**
 * 把手稿放进内存，改动后写回项目里的 data 目录。
 */
export const WpcVaultProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const [vault, setVault] = useState<WpcVault | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [dataPath, setDataPath] = useState('data')
  const latestRef = useRef<WpcVault | null>(null)
  const savedRef = useRef('')
  const timerRef = useRef<number | null>(null)
  const noticeRef = useRef<number | null>(null)
  const writingRef = useRef(false)

  const wpc_notify = useCallback((text: string): void => {
    setNotice(text)
    if (noticeRef.current) window.clearTimeout(noticeRef.current)
    noticeRef.current = window.setTimeout(() => setNotice(''), 3200)
  }, [])

  const wpc_persistNow = useCallback((): void => {
    const current = latestRef.current
    if (!current) return
    const json = JSON.stringify(current)
    if (json === savedRef.current) return
    const result = wpc_saveVaultNow(current)
    if (result.ok) savedRef.current = json
  }, [])

  /**
   * 把内存里最新的手稿写下去。上一笔还在写时先让开，写完再补最新的一笔。
   */
  const wpc_flush = useCallback(async (): Promise<void> => {
    if (writingRef.current) return
    const current = latestRef.current
    if (!current) return
    const json = JSON.stringify(current)
    if (json === savedRef.current) return
    writingRef.current = true
    try {
      await wpc_saveVault(current)
      if (JSON.stringify(latestRef.current) === json) savedRef.current = json
    } catch (saveError) {
      wpc_notify(saveError instanceof Error ? saveError.message : '保存失败')
    } finally {
      writingRef.current = false
      const latest = latestRef.current
      if (latest && JSON.stringify(latest) !== json) void wpc_flush()
    }
  }, [wpc_notify])

  const wpc_schedule = useCallback((): void => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      void wpc_flush()
    }, 280)
  }, [wpc_flush])

  const wpc_mutate = useCallback(
    (recipe: (vault: WpcVault) => WpcVault, immediate = false): void => {
      const current = latestRef.current
      if (!current) return
      const next = recipe(current)
      latestRef.current = next
      setVault(next)
      if (immediate) {
        if (timerRef.current) window.clearTimeout(timerRef.current)
        wpc_persistNow()
        return
      }
      wpc_schedule()
    },
    [wpc_persistNow, wpc_schedule],
  )

  const wpc_reload = useCallback(async (): Promise<void> => {
    setError('')
    setReady(false)
    const opened = await wpc_loadVault()
    latestRef.current = opened.vault
    savedRef.current = JSON.stringify(opened.vault)
    setVault(opened.vault)
    setReady(true)
  }, [])

  const wpc_addImages = useCallback(
    async (files: File[]): Promise<WpcAsset[]> => {
      const saved: WpcAsset[] = []
      let failed = ''
      for (const file of files.slice(0, 8)) {
        try {
          saved.push(await wpc_uploadAsset(await wpc_compressImage(file)))
        } catch (uploadError) {
          failed = uploadError instanceof Error ? uploadError.message : '图片没有放进来'
        }
      }
      if (saved.length > 0) {
        wpc_mutate((current) => ({ ...current, assets: [...saved, ...current.assets] }), true)
      }
      if (failed && saved.length === 0) throw new Error(failed)
      if (failed) wpc_notify(failed)
      return saved
    },
    [wpc_mutate, wpc_notify],
  )

  const wpc_removeAsset = useCallback(
    async (id: string): Promise<void> => {
      const current = latestRef.current
      if (!current) return
      const next = wpc_withoutAsset(current, id)
      latestRef.current = next
      setVault(next)
      wpc_persistNow()
      await wpc_deleteAssetFile(id)
    },
    [wpc_persistNow],
  )

  useEffect(() => {
    let alive = true
    const wpc_boot = async (): Promise<void> => {
      try {
        const [opened, root] = await Promise.all([
          wpc_loadVault(),
          wpc_fetchRoot().catch(() => ({ path: 'data' })),
        ])
        if (!alive) return
        latestRef.current = opened.vault
        savedRef.current = JSON.stringify(opened.vault)
        setVault(opened.vault)
        setDataPath(root.path)
        setReady(true)
        if (opened.recovered) wpc_notify('原来的手稿读不了，已另存到 data/backups，并为你新开了一册。')
      } catch (bootError) {
        if (!alive) return
        setError(bootError instanceof Error ? bootError.message : '手稿没有打开')
        setReady(true)
      }
    }
    void wpc_boot()
    const wpc_leave = (): void => wpc_persistNow()
    const wpc_hide = (): void => {
      if (document.visibilityState === 'hidden') wpc_persistNow()
    }
    window.addEventListener('beforeunload', wpc_leave)
    document.addEventListener('visibilitychange', wpc_hide)
    return () => {
      alive = false
      window.removeEventListener('beforeunload', wpc_leave)
      document.removeEventListener('visibilitychange', wpc_hide)
    }
  }, [wpc_notify, wpc_persistNow])

  const value = useMemo(
    () => ({ vault, ready, error, notice, dataPath, wpc_mutate, wpc_notify, wpc_reload, wpc_addImages, wpc_removeAsset }),
    [vault, ready, error, notice, dataPath, wpc_mutate, wpc_notify, wpc_reload, wpc_addImages, wpc_removeAsset],
  )

  return (
    <WpcVaultContext.Provider value={value}>
      {children}
      {notice ? <div className="toast">{notice}</div> : null}
    </WpcVaultContext.Provider>
  )
}
