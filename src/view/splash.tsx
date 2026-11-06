import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import type { ReactElement } from 'react'
import splashDuo from '../assets/splash-duo.jpg'
import { wpc_useVault } from '../state/vault'

/**
 * 开屏。男女侦探从两侧走到画面里，标题再落下来。可跳过。
 */
export const WpcSplash = ({ onDone }: { onDone: () => void }): ReactElement => {
  const reduce = useReducedMotion()
  const { ready, error, wpc_reload } = wpc_useVault()
  const doneRef = useRef(onDone)
  const closed = useRef(false)
  doneRef.current = onDone

  /**
   * 手稿就绪后收起开屏。
   */
  const wpc_finish = (): void => {
    if (closed.current || !ready || error) return
    closed.current = true
    doneRef.current()
  }

  useEffect(() => {
    if (!ready || error) return
    const delay = reduce ? 500 : 3600
    let timer = 0
    let fallback = 0
    let alive = true
    /**
     * 等字体就绪后再计时，避免标题还没画出来就收场。
     */
    const wpc_arm = (): void => {
      if (!alive || closed.current) return
      timer = window.setTimeout(() => {
        if (!closed.current) {
          closed.current = true
          doneRef.current()
        }
      }, delay)
    }
    void document.fonts.ready.then(wpc_arm)
    fallback = window.setTimeout(wpc_arm, 1200)
    return () => {
      alive = false
      window.clearTimeout(timer)
      window.clearTimeout(fallback)
    }
  }, [ready, error, reduce])

  const ease = [0.22, 1, 0.36, 1] as const

  return (
    <motion.div className="splash" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0.01 : 0.6 }}>
      <div className="splash-duo" aria-hidden="true">
        <div className="splash-half">
          <motion.img src={splashDuo} alt="" draggable={false} initial={reduce ? false : { x: '-16%', opacity: 0 }} animate={{ x: '0%', opacity: 1 }} transition={{ duration: reduce ? 0.01 : 1.15, ease }} />
        </div>
        <div className="splash-half">
          <motion.img src={splashDuo} alt="" draggable={false} initial={reduce ? false : { x: '16%', opacity: 0 }} animate={{ x: '0%', opacity: 1 }} transition={{ duration: reduce ? 0.01 : 1.15, ease }} />
        </div>
      </div>
      <motion.i className="splash-seam" initial={{ scaleY: 0, opacity: 0 }} animate={{ scaleY: 1, opacity: reduce ? 0 : [0, 0.85, 0] }} transition={{ duration: reduce ? 0.01 : 1.4, delay: reduce ? 0 : 0.35, times: [0, 0.45, 1] }} />
      <div className="splash-shade" />
      <div className="splash-stage">
        <motion.h1 className="splash-title" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : 0.85, duration: 0.6 }}>
          星笺
        </motion.h1>
        <motion.p className="splash-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 1.15 }}>
          先别说破，把今天记下
        </motion.p>
        {error ? (
          <button type="button" className="enter-btn" onClick={() => void wpc_reload()}>
            再试一次
          </button>
        ) : (
          <motion.button type="button" className="enter-btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 1.4 }} onClick={wpc_finish}>
            推门而入
          </motion.button>
        )}
        {error ? <p className="splash-error">{error}</p> : null}
      </div>
      {!error ? (
        <button type="button" className="skip-btn" onClick={wpc_finish}>
          跳过
        </button>
      ) : null}
    </motion.div>
  )
}
