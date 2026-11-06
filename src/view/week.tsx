import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import { wpc_categories, wpc_categoryColor, wpc_categoryLabel } from '../lib/copy'
import { wpc_categorySecondsOnDay, wpc_lastDays } from '../lib/time'
import { wpc_dateKey } from '../../shared/pure'
import type { WpcTimeEntry } from '../../shared/types'

/**
 * 近七日的时间堆叠。
 */
export const WpcWeekChart = ({ entries }: { entries: WpcTimeEntry[] }): ReactElement => {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30000)
    return () => window.clearInterval(id)
  }, [])
  const days = wpc_lastDays(7)
  const totals = days.map((day) => wpc_categorySecondsOnDay(entries, wpc_dateKey(day), now))
  const max = Math.max(
    60,
    ...totals.map((item) => Object.values(item).reduce((sum, value) => sum + value, 0)),
  )
  return (
    <div className="week">
      {days.map((day, index) => {
        const parts = totals[index]
        const total = parts ? Object.values(parts).reduce((sum, value) => sum + value, 0) : 0
        return (
          <div className="week-col" key={wpc_dateKey(day)}>
            <div className="week-bar">
              {total > 0 && parts ? (
                <div className="week-stack" style={{ height: `${(total / max) * 100}%` }}>
                  {wpc_categories.map((category) => (
                    <i key={category} title={wpc_categoryLabel[category]} style={{ flexGrow: parts[category], background: wpc_categoryColor[category] }} />
                  ))}
                </div>
              ) : null}
            </div>
            <span>{'一二三四五六日'[(day.getDay() + 6) % 7]}</span>
          </div>
        )
      })}
    </div>
  )
}
