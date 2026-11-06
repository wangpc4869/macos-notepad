import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { wpc_runningEntry } from '../../shared/pure'
import type { WpcPage, WpcSkin } from '../../shared/types'
import { WpcMascot } from '../art/scene'
import { WpcNavIcon } from '../art/marks'
import { wpc_pageMeta, type WpcJump } from '../lib/copy'
import { wpc_applySkin, wpc_skinMeta, wpc_storedSkin } from '../lib/skins'
import { wpc_useVault } from '../state/vault'
import { WpcClock, WpcElapsed } from './bits'
import { WpcDiary } from './diary'
import { WpcJourney } from './journey'
import { WpcLibrary } from './library'
import { WpcNotes } from './notes'
import { WpcSearch } from './search'
import { WpcSheet } from './sheet'
import { WpcAtmosphere, WpcSkinCenter, WpcSkinPicker, WpcWhisper } from './skins'
import { WpcSplash } from './splash'
import { WpcTime } from './time'
import { WpcToday } from './today'

/**
 * 应用骨架：开屏、侧栏和各页。
 */
export const WpcShell = (): ReactElement => {
  const { vault, ready, error, dataPath, wpc_mutate, wpc_notify } = wpc_useVault()
  const [entered, setEntered] = useState(false)
  const [page, setPage] = useState<WpcPage>('today')
  const [target, setTarget] = useState<WpcJump | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [skinOpen, setSkinOpen] = useState(false)
  const [centerOpen, setCenterOpen] = useState(false)
  const [skin, setSkin] = useState<WpcSkin>(() => wpc_storedSkin())
  const [wash, setWash] = useState(0)
  const skinReady = useRef(false)
  const [calm, setCalm] = useState(false)
  const desktop = typeof window !== 'undefined' && Boolean(window.hoshisen)
  const running = vault ? wpc_runningEntry(vault.times) : null
  const showSplash = !entered || !ready || Boolean(error)

  /**
   * 换皮肤。以这一次点击为准，不被上一笔还没写完的手稿盖回去。
   */
  const wpc_pickSkin = (next: WpcSkin): void => {
    wpc_applySkin(next)
    setSkin(next)
    setWash((value) => value + 1)
    wpc_mutate((current) => (current.profile.skin === next ? current : { ...current, profile: { ...current.profile, skin: next } }))
    wpc_notify(wpc_skinMeta(next).hello)
  }

  const wpc_open = (next: WpcPage, id?: string): void => {
    setCalm(false)
    setPage(next)
    if (id) setTarget({ page: next, id, nonce: Date.now() })
    setSearchOpen(false)
  }

  useEffect(() => {
    const wpc_onKey = (event: KeyboardEvent): void => {
      const meta = event.metaKey || event.ctrlKey
      if (meta && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setSheetOpen(false)
        setSkinOpen(false)
        setCenterOpen(false)
        setCalm(false)
      }
      if (meta && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        window.dispatchEvent(new Event('hoshisen:new'))
      }
      if (meta && ['1', '2', '3', '4', '5', '6'].includes(event.key)) {
        event.preventDefault()
        const next = wpc_pageMeta[Number(event.key) - 1]
        if (!next) return
        setCalm(false)
        setPage(next.id)
      }
    }
    window.addEventListener('keydown', wpc_onKey)
    return () => window.removeEventListener('keydown', wpc_onKey)
  }, [])

  useEffect(() => {
    if (!window.hoshisen) return
    return window.hoshisen.onOpenSheet(() => setSheetOpen(true))
  }, [])

  useEffect(() => {
    if (!vault || skinReady.current) return
    skinReady.current = true
    setSkin(vault.profile.skin)
    wpc_applySkin(vault.profile.skin)
  }, [vault])

  const frameClass = ['frame', desktop ? 'is-desktop' : '', calm ? 'is-calm' : ''].filter(Boolean).join(' ')

  return (
    <>
      <WpcAtmosphere skin={skin} />
      {wash > 0 ? <div key={wash} className="skin-wash" /> : null}
      <AnimatePresence>{showSplash ? <WpcSplash key="splash" onDone={() => setEntered(true)} /> : null}</AnimatePresence>
      {ready && vault ? (
        <div className={frameClass}>
          <header className="titlebar">
            <div className="brand">
              <span className="brand-seal" aria-hidden="true">
                <i className="brand-star" />
                <b>笺</b>
              </span>
              <div className="brand-title">
                <strong>
                  <em>星</em>笺
                </strong>
                <small>案头手帐</small>
              </div>
            </div>
            <div className="title-actions">
              <button type="button" className="ghost-btn" onClick={() => setSearchOpen(true)}>
                <WpcNavIcon name="search" />
                搜索
              </button>
              <button type="button" className={skinOpen ? 'ghost-btn is-on' : 'ghost-btn'} onClick={() => setSkinOpen((value) => !value)}>
                皮肤
              </button>
              {skinOpen ? (
                <>
                  <button type="button" className="skin-catch" aria-label="关闭皮肤" onClick={() => setSkinOpen(false)} />
                  <div className="skin-pop">
                    <p className="quiet">换一种心情</p>
                    <WpcSkinPicker
                      skin={skin}
                      onPick={wpc_pickSkin}
                      onMore={() => {
                        setSkinOpen(false)
                        setCenterOpen(true)
                      }}
                    />
                  </div>
                </>
              ) : null}
              <button type="button" className="ghost-btn" onClick={() => setSheetOpen(true)}>
                案头
              </button>
              <WpcClock />
            </div>
          </header>
          <div className="body">
            <aside className="sidebar">
              <nav className="nav">
                {wpc_pageMeta.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={page === item.id ? 'nav-btn is-on' : 'nav-btn'}
                    onClick={() => {
                      setCalm(false)
                      setPage(item.id)
                    }}
                  >
                    <span className="nav-ico">
                      <WpcNavIcon name={item.id} />
                    </span>
                    <span className="nav-copy">
                      <strong>{item.label}</strong>
                      <small>{item.hint}</small>
                    </span>
                  </button>
                ))}
              </nav>
              <div className="side-foot">
                {running ? (
                  <button type="button" className="live-pill" onClick={() => wpc_open('time')}>
                    <i className="pulse" />
                    <WpcElapsed start={running.startedAt} />
                    <em>{running.title}</em>
                  </button>
                ) : (
                  <WpcWhisper skin={skin} />
                )}
                <WpcMascot skin={skin} className="fox-mini" />
              </div>
            </aside>
            <main className="content">
              <AnimatePresence mode="wait">
                <motion.div
                  key={page}
                  className="page-wrap"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                >
                  {page === 'today' ? <WpcToday onOpen={wpc_open} /> : null}
                  {page === 'notes' ? <WpcNotes target={target} calm={calm} onCalm={setCalm} /> : null}
                  {page === 'diary' ? <WpcDiary target={target} calm={calm} onCalm={setCalm} /> : null}
                  {page === 'time' ? <WpcTime /> : null}
                  {page === 'journey' ? <WpcJourney target={target} /> : null}
                  {page === 'library' ? <WpcLibrary /> : null}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      ) : null}
      <WpcSearch open={searchOpen} onClose={() => setSearchOpen(false)} onOpen={wpc_open} />
      <WpcSheet
        open={sheetOpen}
        dataPath={dataPath}
        skin={skin}
        onOpenCenter={() => {
          setSheetOpen(false)
          setCenterOpen(true)
        }}
        onClose={() => setSheetOpen(false)}
      />
      <WpcSkinCenter open={centerOpen} skin={skin} onPick={wpc_pickSkin} onClose={() => setCenterOpen(false)} />
    </>
  )
}
