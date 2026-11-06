import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import { wpc_runningEntry } from '../../shared/pure'
import type { WpcCategory, WpcTimeEntry } from '../../shared/types'
import { WpcCategoryMark } from '../art/marks'
import { wpc_categories, wpc_categoryLabel } from '../lib/copy'
import { wpc_formatHms, wpc_formatMinutes, wpc_formatSmartDay, wpc_formatStamp, wpc_toLocalInput } from '../lib/format'
import { wpc_dateKey } from '../../shared/pure'
import { wpc_entrySeconds, wpc_manualEntry, wpc_withStartedTimer, wpc_withoutRunningTimer, wpc_withStoppedTimer } from '../lib/time'
import { wpc_useVault } from '../state/vault'
import { WpcConfirm, WpcPageHead } from './bits'
import { WpcDateTimeField } from './date-field'
import { WpcWeekChart } from './week'

/**
 * 时光：专注计时、补记和近七日。
 */
export const WpcTime = (): ReactElement => {
  const { vault, wpc_mutate, wpc_notify } = wpc_useVault()
  const [title, setTitle] = useState('专注')
  const [category, setCategory] = useState<WpcCategory>('work')
  const [detail, setDetail] = useState('')
  const [target, setTarget] = useState<number | null>(25)
  const [manual, setManual] = useState(false)
  const [start, setStart] = useState(() => wpc_toLocalInput(new Date(Date.now() - 60 * 60 * 1000)))
  const [end, setEnd] = useState(() => wpc_toLocalInput(new Date()))
  const [manualTitle, setManualTitle] = useState('')
  const [manualDetail, setManualDetail] = useState('')
  const [pending, setPending] = useState<WpcTimeEntry | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const wpc_onNew = (): void => {
      if (!vault) return
      if (wpc_runningEntry(vault.times)) {
        wpc_notify('先把正在进行的一段收尾')
        return
      }
      wpc_mutate((current) => wpc_withStartedTimer(current, { title, category, targetMin: target }).vault)
    }
    window.addEventListener('hoshisen:new', wpc_onNew)
    return () => window.removeEventListener('hoshisen:new', wpc_onNew)
  })

  if (!vault) return <div />
  const running = wpc_runningEntry(vault.times)
  const elapsed = running ? Math.max(0, Math.round((now - new Date(running.startedAt).getTime()) / 1000)) : 0
  const progress = running?.targetMin ? Math.min(1, elapsed / (running.targetMin * 60)) : 0
  const groups = new Map<string, WpcTimeEntry[]>()
  for (const entry of [...vault.times].sort((left, right) => right.startedAt.localeCompare(left.startedAt))) {
    const key = wpc_dateKey(new Date(entry.startedAt))
    groups.set(key, [...(groups.get(key) ?? []), entry])
  }

  const wpc_begin = (minutes: number | null): void => {
    let ok = false
    wpc_mutate((current) => {
      const result = wpc_withStartedTimer(current, { title, category, targetMin: minutes })
      ok = result.ok
      if (!result.ok) return current
      return {
        ...result.vault,
        times: result.vault.times.map((entry) => (entry.endedAt === null ? { ...entry, detail } : entry)),
      }
    })
    if (!ok) wpc_notify('先把正在进行的一段收尾')
  }

  return (
    <section className="page">
      <WpcPageHead kicker="HOURS" title="时光" extra={<span className="quiet">工作、学习、生活，都算数</span>} />
      <div className="page-scroll">
        <div className="timer-layout">
          <article className="card timer-card">
            <div className="timer-face">
              <WpcRing progress={running ? progress : 0} live={Boolean(running && !running.targetMin)} done={Boolean(running?.targetMin && progress >= 1)} />
              <div className="timer-readout">
                <strong>{running ? wpc_formatHms(elapsed) : '00:00:00'}</strong>
                <span>{running?.targetMin ? `目标 ${running.targetMin} 分钟` : running ? '不设限' : '尚未开始'}</span>
              </div>
            </div>
            {running ? (
              <>
                <input className="text-input" value={running.title} onChange={(event) => wpc_mutate((current) => ({ ...current, times: current.times.map((entry) => (entry.id === running.id ? { ...entry, title: event.target.value } : entry)) }))} />
                <div className="cat-row">
                  {wpc_categories.map((item) => (
                    <button key={item} type="button" className={running.category === item ? 'cat-btn is-on' : 'cat-btn'} onClick={() => wpc_mutate((current) => ({ ...current, times: current.times.map((entry) => (entry.id === running.id ? { ...entry, category: item } : entry)) }))}>
                      <WpcCategoryMark category={item} />
                      {wpc_categoryLabel[item]}
                    </button>
                  ))}
                </div>
                <textarea className="text-input area" value={running.detail} placeholder="这段在做什么" onChange={(event) => wpc_mutate((current) => ({ ...current, times: current.times.map((entry) => (entry.id === running.id ? { ...entry, detail: event.target.value } : entry)) }))} />
                {running.targetMin && progress >= 1 ? <p className="done-line">这一阵已经够了，可以收笔。</p> : null}
                <div className="tool-row">
                  <button type="button" className="gold-btn" onClick={() => wpc_mutate(wpc_withStoppedTimer)}>
                    结束
                  </button>
                  <button type="button" className="danger-btn" onClick={() => wpc_mutate(wpc_withoutRunningTimer)}>
                    作废
                  </button>
                </div>
              </>
            ) : (
              <>
                <input className="text-input" value={title} placeholder="这段叫什么" onChange={(event) => setTitle(event.target.value)} />
                <div className="cat-row">
                  {wpc_categories.map((item) => (
                    <button key={item} type="button" className={category === item ? 'cat-btn is-on' : 'cat-btn'} onClick={() => setCategory(item)}>
                      <WpcCategoryMark category={item} />
                      {wpc_categoryLabel[item]}
                    </button>
                  ))}
                </div>
                <textarea className="text-input area" value={detail} placeholder="可留一句，开始后也能改" onChange={(event) => setDetail(event.target.value)} />
                <div className="tool-row">
                  <button type="button" className={target === 25 ? 'chip is-on' : 'chip'} onClick={() => setTarget(25)}>
                    25 分
                  </button>
                  <button type="button" className={target === 50 ? 'chip is-on' : 'chip'} onClick={() => setTarget(50)}>
                    50 分
                  </button>
                  <button type="button" className={target === null ? 'chip is-on' : 'chip'} onClick={() => setTarget(null)}>
                    不设限
                  </button>
                </div>
                <button type="button" className="gold-btn" onClick={() => wpc_begin(target)}>
                  开始
                </button>
              </>
            )}
          </article>
          <article className="card">
            <div className="card-title">
              <h3>近七日</h3>
              <button type="button" className="text-link" onClick={() => setManual((value) => !value)}>
                {manual ? '收起补记' : '补记一段'}
              </button>
            </div>
            <WpcWeekChart entries={vault.times} />
            {manual ? (
              <form
                className="manual"
                onSubmit={(event) => {
                  event.preventDefault()
                  const result = wpc_manualEntry({ title: manualTitle, category, start, end, detail: manualDetail })
                  if ('error' in result) {
                    wpc_notify(result.error)
                    return
                  }
                  wpc_mutate((current) => ({ ...current, times: [result.entry, ...current.times] }))
                  setManualTitle('')
                  setManualDetail('')
                  wpc_notify('已补记')
                }}
              >
                <input className="text-input" value={manualTitle} placeholder="那段在做什么" onChange={(event) => setManualTitle(event.target.value)} />
                <label className="quiet">
                  开始
                  <WpcDateTimeField value={start} onChange={setStart} />
                </label>
                <label className="quiet">
                  结束
                  <WpcDateTimeField value={end} onChange={setEnd} />
                </label>
                <textarea className="text-input area" value={manualDetail} placeholder="补一句也行" onChange={(event) => setManualDetail(event.target.value)} />
                <button type="submit" className="gold-btn">
                  记入
                </button>
              </form>
            ) : null}
          </article>
        </div>
        <article className="card">
          <h3>记录</h3>
          {[...groups.entries()].map(([day, entries]) => (
            <div key={day} className="day-group">
              <p className="quiet">{wpc_formatSmartDay(day)}</p>
              {entries.map((entry) => (
                <div key={entry.id} className="row-item static">
                  <i style={{ background: 'var(--gold)' }} />
                  <span>{entry.title}</span>
                  <em>{wpc_categoryLabel[entry.category]}</em>
                  <small>{entry.endedAt ? wpc_formatMinutes(wpc_entrySeconds(entry, now) / 60) : '进行中'}</small>
                  <small>{wpc_formatStamp(entry.startedAt)}</small>
                  <button type="button" className="text-link" onClick={() => setPending(entry)}>
                    删除
                  </button>
                </div>
              ))}
            </div>
          ))}
          {vault.times.length === 0 ? <p className="quiet">还没有时段。先开始一阵，或把刚才补记下来。</p> : null}
        </article>
      </div>
      {pending ? (
        <WpcConfirm
          title="删除这段时光？"
          text="只是从手帐里拿掉这一段，不会影响别的记录。"
          confirmLabel="删除"
          onClose={() => setPending(null)}
          onConfirm={() => {
            wpc_mutate((current) => ({ ...current, times: current.times.filter((entry) => entry.id !== pending.id) }))
            setPending(null)
          }}
        />
      ) : null}
    </section>
  )
}

/**
 * 计时环。有目标时显示进度，没有目标时缓慢转动。
 */
const WpcRing = ({ progress, live, done }: { progress: number; live: boolean; done: boolean }): ReactElement => {
  const radius = 78
  const circ = 2 * Math.PI * radius
  const offset = circ * (1 - Math.min(1, Math.max(0, progress)))
  const className = ['ring', live ? 'is-live' : '', done ? 'is-done' : ''].filter(Boolean).join(' ')
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="100" r={radius} className="ring-track" />
      <circle cx="100" cy="100" r={radius} className="ring-value" strokeDasharray={circ} strokeDashoffset={live ? circ * 0.72 : offset} transform="rotate(-90 100 100)" />
    </svg>
  )
}
