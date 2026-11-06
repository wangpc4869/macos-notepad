import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import type { ReactElement } from 'react'
import { WpcFox } from '../art/scene'
import { wpc_useVault } from '../state/vault'

const wpc_petals = [6, 16, 28, 40, 52, 63, 74, 86, 94]

/**
 * 开屏。灯狐、月色和标题依次出现，可跳过。
 */
export const WpcSplash = ({ onDone }: { onDone: () => void }): ReactElement => {
  const reduce = useReducedMotion()
  const { ready, error, wpc_reload } = wpc_useVault()
  const doneRef = useRef(onDone)
  const closed = useRef(false)
  doneRef.current = onDone

  const wpc_finish = (): void => {
    if (closed.current || !ready || error) return
    closed.current = true
    doneRef.current()
  }

  useEffect(() => {
    if (!ready || error) return
    const delay = reduce ? 500 : 3200
    let timer = 0
    let fallback = 0
    let alive = true
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

  return (
    <motion.div
      className="splash"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0.01 : 0.55 }}
    >
      <div className="splash-frame" />
      <div className="moon" />
      <div className="sky-stars splash-stars" />
      {reduce
        ? null
        : wpc_petals.map((left, index) => (
            <i key={left} className="petal" style={{ left: `${left}%`, animationDelay: `${index * 0.7}s`, animationDuration: `${8 + (index % 3)}s` }} />
          ))}
      <svg className="splash-hills" viewBox="0 0 800 180" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 120C140 70 240 160 380 110C520 60 640 150 800 96V180H0Z" fill="rgba(8,6,18,0.55)" />
      </svg>
      <div className="splash-stage">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: reduce ? 0 : 0.15 }}>
          <WpcFox className="splash-fox" />
        </motion.div>
        <motion.div className="splash-rule" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: reduce ? 0.01 : 0.6, delay: reduce ? 0 : 0.4 }} />
        <motion.h1 className="splash-title" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : 0.55, duration: 0.55 }}>
          星笺
        </motion.h1>
        <motion.p className="splash-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 0.85 }}>
          案头一盏灯，记下工作与人间
        </motion.p>
        {error ? (
          <button type="button" className="enter-btn" onClick={() => void wpc_reload()}>
            再试一次
          </button>
        ) : (
          <motion.button type="button" className="enter-btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 1.15 }} onClick={wpc_finish}>
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
