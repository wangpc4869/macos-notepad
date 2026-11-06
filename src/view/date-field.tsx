import { useEffect, useId, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { wpc_dateKey } from '../../shared/pure'
import { wpc_formatMonth } from '../lib/format'

/**
 * 把 YYYY-MM-DD 收成当地日期。
 */
const wpc_parseDay = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * 日期键显示成 2026/11/06。
 */
const wpc_showDay = (value: string): string => {
  const date = wpc_parseDay(value)
  if (!date) return ''
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}/${month}/${day}`
}

/**
 * 这个月的六周，从周日排起，前后月的日子也补上。
 */
const wpc_pickerDays = (cursor: Date): Date[] => {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const start = new Date(first)
  start.setDate(1 - first.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return day
  })
}

/**
 * 日历小标。
 */
const WpcDateMark = (): ReactElement => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="4" y="5.5" width="16" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M4 10h16M8 4.5v3M16 4.5v3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

/**
 * 皮肤风格的日期选择。不弹出系统日历。
 */
export const WpcDateField = ({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}): ReactElement => {
  const fieldId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(() => wpc_parseDay(value) ?? new Date())
  const [box, setBox] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const today = wpc_dateKey(new Date())
  const selected = value.slice(0, 10)

  /**
   * 把月历贴在输入框旁边，贴边时改到上方。
   */
  const wpc_place = (): void => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    const width = 300
    const height = 348
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))
    const below = rect.bottom + 8
    const top = below + height > window.innerHeight ? Math.max(12, rect.top - height - 8) : below
    setBox({ top, left })
  }

  useEffect(() => {
    if (!open) return
    wpc_place()
    /**
     * 点到月历外面就收起。
     */
    const wpc_away = (event: MouseEvent): void => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (buttonRef.current?.contains(target) || popRef.current?.contains(target)) return
      setOpen(false)
    }
    /**
     * Esc 收起月历。
     */
    const wpc_key = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('resize', wpc_place)
    window.addEventListener('scroll', wpc_place, true)
    window.addEventListener('mousedown', wpc_away)
    window.addEventListener('keydown', wpc_key)
    return () => {
      window.removeEventListener('resize', wpc_place)
      window.removeEventListener('scroll', wpc_place, true)
      window.removeEventListener('mousedown', wpc_away)
      window.removeEventListener('keydown', wpc_key)
    }
  }, [open])

  /**
   * 打开月历，并翻到已选的那个月。
   */
  const wpc_toggle = (): void => {
    if (open) {
      setOpen(false)
      return
    }
    setCursor(wpc_parseDay(value) ?? new Date())
    setOpen(true)
  }

  const days = wpc_pickerDays(cursor)
  const pop = open ? (
    <div ref={popRef} className="date-pop" role="dialog" aria-label="选择日期" style={{ top: box.top, left: box.left }}>
      <div className="date-pop-head">
        <button type="button" className="date-nav" aria-label="上个月" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M10 3.5 5.5 8 10 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <strong>{wpc_formatMonth(cursor)}</strong>
        <button type="button" className="date-nav" aria-label="下个月" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="date-week">
        {['日', '一', '二', '三', '四', '五', '六'].map((label) => (
          <span key={`${fieldId}-${label}`}>{label}</span>
        ))}
      </div>
      <div className="date-grid">
        {days.map((day) => {
          const key = wpc_dateKey(day)
          const outside = day.getMonth() !== cursor.getMonth()
          const weekend = day.getDay() === 0 || day.getDay() === 6
          const className = ['date-day', outside ? 'is-out' : '', weekend ? 'is-weekend' : '', key === today ? 'is-today' : '', key === selected ? 'is-on' : '']
            .filter(Boolean)
            .join(' ')
          return (
            <button key={key} type="button" className={className} onClick={() => { onChange(key); setOpen(false) }}>
              {day.getDate()}
            </button>
          )
        })}
      </div>
      <div className="date-pop-foot">
        <button type="button" onClick={() => { onChange(''); setOpen(false) }}>
          清除
        </button>
        <button
          type="button"
          onClick={() => {
            onChange(today)
            setOpen(false)
          }}
        >
          今天
        </button>
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={selected ? 'date-field' : 'date-field is-empty'}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={wpc_toggle}
      >
        <span>{wpc_showDay(value) || '选择日期'}</span>
        <WpcDateMark />
      </button>
      {pop ? createPortal(pop, document.body) : null}
    </>
  )
}

/**
 * 补记用的日期和钟点，避开系统的日期时间面板。
 */
export const WpcDateTimeField = ({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}): ReactElement => {
  const day = value.slice(0, 10)
  const clock = /^\d{2}:\d{2}/.test(value.slice(11, 16)) ? value.slice(11, 16) : '09:00'
  const [draft, setDraft] = useState(clock)

  useEffect(() => {
    setDraft(clock)
  }, [clock])

  /**
   * 离开输入框时把钟点收成 HH:mm。
   */
  const wpc_commitClock = (): void => {
    const match = /^(\d{1,2}):(\d{1,2})$/.exec(draft.trim())
    if (!match || !day) {
      setDraft(clock)
      return
    }
    const hour = Math.min(23, Number(match[1]))
    const minute = Math.min(59, Number(match[2]))
    const next = `${`${hour}`.padStart(2, '0')}:${`${minute}`.padStart(2, '0')}`
    setDraft(next)
    onChange(`${day}T${next}`)
  }

  return (
    <span className="when-field">
      <WpcDateField value={day} onChange={(next) => onChange(next ? `${next}T${clock}` : '')} />
      <input
        className="text-input when-clock"
        value={draft}
        inputMode="numeric"
        aria-label="钟点"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={wpc_commitClock}
      />
    </span>
  )
}
