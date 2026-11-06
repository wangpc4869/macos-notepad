import { useEffect, useState } from 'react'
import type { CSSProperties, MouseEvent, ReactElement, ReactNode } from 'react'
import { WpcMascot } from '../art/scene'
import { wpc_formatHms } from '../lib/format'
import { wpc_mediaUrl } from '../lib/api'
import { wpc_readSkin } from '../../shared/pure'

/**
 * 页眉：英文眉题加中文标题。
 */
export const WpcPageHead = ({
  kicker,
  title,
  extra,
}: {
  kicker: string
  title: string
  extra?: ReactNode
}): ReactElement => (
  <header className="page-head">
    <div>
      <p className="kicker">{kicker}</p>
      <h2>{title}</h2>
    </div>
    {extra ? <div className="page-extra">{extra}</div> : null}
  </header>
)

/**
 * 空状态。
 */
export const WpcEmpty = ({
  title,
  text,
  action,
  onAction,
}: {
  title: string
  text: string
  action?: string
  onAction?: () => void
}): ReactElement => (
  <div className="empty">
    <WpcMascot skin={wpc_readSkin(document.documentElement.dataset.skin)} className="empty-fox" />
    <h3>{title}</h3>
    <p>{text}</p>
    {action && onAction ? (
      <button type="button" className="gold-btn" onClick={onAction}>
        {action}
      </button>
    ) : null}
  </div>
)

/**
 * 确认框。
 */
export const WpcConfirm = ({
  title,
  text,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string
  text: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
}): ReactElement => (
  <div className="modal-back" onMouseDown={onClose} role="presentation">
    <div className="modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
      <h3>{title}</h3>
      <p>{text}</p>
      <div className="modal-actions">
        <button type="button" className="ghost-btn" onClick={onClose}>
          取消
        </button>
        <button type="button" className="danger-btn" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
)

/**
 * 看大图。
 */
export const WpcLightbox = ({ id, onClose }: { id: string; onClose: () => void }): ReactElement => {
  useEffect(() => {
    const wpc_onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', wpc_onKey)
    return () => window.removeEventListener('keydown', wpc_onKey)
  }, [onClose])
  return (
    <div className="lightbox" onClick={onClose} role="presentation">
      <img src={wpc_mediaUrl(id)} alt="查看图片" />
    </div>
  )
}

/**
 * 点文字也能关掉。鼠标按下就关，避免只点到字时被挡住。
 */
export const WpcCloseButton = ({ onClose, label = '关闭' }: { onClose: () => void; label?: string }): ReactElement => {
  /**
   * 按下就关。随后这一下点击不再落到关掉之后露出来的页面上。
   */
  const wpc_press = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault()
    event.stopPropagation()
    const wpc_swallow = (next: Event): void => {
      next.preventDefault()
      next.stopPropagation()
    }
    window.addEventListener('mouseup', wpc_swallow, true)
    window.addEventListener('click', wpc_swallow, true)
    window.setTimeout(() => {
      window.removeEventListener('mouseup', wpc_swallow, true)
      window.removeEventListener('click', wpc_swallow, true)
    }, 400)
    onClose()
  }
  return (
    <button type="button" className="ghost-btn close-btn" onMouseDown={wpc_press}>
      {label}
    </button>
  )
}

/**
 * 标题栏时钟。外圈跟着秒针走。
 */
export const WpcClock = (): ReactElement => {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])
  /**
   * 把时、分、秒补成两位。
   */
  const wpc_pad = (value: number): string => `${value}`.padStart(2, '0')
  const style = { '--sec': `${(now.getSeconds() / 60) * 360}deg` } as CSSProperties
  return (
    <time className="clock-jewel" dateTime={now.toISOString()} style={style}>
      <span className="clock-ring" aria-hidden="true">
        <em>{wpc_pad(now.getSeconds())}</em>
      </span>
      <span className="clock-read">
        <b>
          {wpc_pad(now.getHours())}:{wpc_pad(now.getMinutes())}
        </b>
      </span>
    </time>
  )
}

/**
 * 进行中的时段读数。
 */
export const WpcElapsed = ({ start }: { start: string }): ReactElement => {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  const seconds = Math.max(0, Math.round((now - new Date(start).getTime()) / 1000))
  return <span>{wpc_formatHms(Number.isFinite(seconds) ? seconds : 0)}</span>
}
