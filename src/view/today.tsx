import { useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { wpc_createId, wpc_dateKey } from '../../shared/pure'
import type { WpcPage } from '../../shared/types'
import { WpcSky } from '../art/scene'
import { WpcWeatherScene } from '../art/weather'
import { wpc_categoryLabel } from '../lib/copy'
import { wpc_excerpt, wpc_listExcerpt } from '../lib/copy'
import { wpc_formatFullDate, wpc_formatMinutes } from '../lib/format'
import { wpc_greeting } from '../lib/greeting'
import { wpc_fallbackSky, wpc_skyKind, wpc_watchLiveWeather, type WpcLiveWeather } from '../lib/weather'
import { wpc_diaryStreak, wpc_secondsOnDay, wpc_withStartedTimer } from '../lib/time'
import { wpc_useVault } from '../state/vault'
import { WpcPageHead } from './bits'
import { WpcWeekChart } from './week'

/**
 * 今日：问候、随手记、正在发生的时间和近七日。
 */
export const WpcToday = ({ onOpen }: { onOpen: (page: WpcPage, id?: string) => void }): ReactElement => {
  const { vault, wpc_mutate, wpc_notify } = wpc_useVault()
  const [draft, setDraft] = useState('')
  const [now, setNow] = useState(() => new Date())
  const [live, setLive] = useState<WpcLiveWeather | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(id)
  }, [])
  useEffect(() => wpc_watchLiveWeather((next) => setLive(next)), [])
  useEffect(() => {
    const wpc_onNew = (): void => inputRef.current?.focus()
    window.addEventListener('hoshisen:new', wpc_onNew)
    return () => window.removeEventListener('hoshisen:new', wpc_onNew)
  }, [])
  if (!vault) return <div />
  const greet = wpc_greeting(vault.profile.displayName, now)
  const todayKey = wpc_dateKey(now)
  const seconds = wpc_secondsOnDay(vault.times, todayKey, now.getTime())
  const todayDiary = vault.diaries.find((item) => item.date === todayKey)
  const streak = wpc_diaryStreak(vault.diaries.map((item) => item.date), now)
  const recent = [...vault.notes].sort((left, right) => Number(right.pinned) - Number(left.pinned) || right.updatedAt.localeCompare(left.updatedAt)).slice(0, 4)
  const todayTimes = vault.times.filter((entry) => wpc_dateKey(new Date(entry.startedAt)) === todayKey).slice(0, 5)

  const wpc_quick = (): void => {
    const text = draft.trim()
    if (!text) return
    const stamp = new Date().toISOString()
    const id = wpc_createId()
    wpc_mutate((current) => ({
      ...current,
      notes: [
        {
          id,
          title: text.slice(0, 28),
          content: text,
          folderId: 'folder-inbox',
          tags: ['碎片'],
          imageIds: [],
          pinned: false,
          createdAt: stamp,
          updatedAt: stamp,
        },
        ...current.notes,
      ],
    }))
    setDraft('')
    wpc_notify('已放进收集箱')
  }

  const wpc_focus = (): void => {
    let started = false
    wpc_mutate((current) => {
      const result = wpc_withStartedTimer(current, { title: draft.trim() || '专注', category: 'work', targetMin: 25 })
      started = result.ok
      return result.vault
    })
    if (!started) wpc_notify('先把正在进行的一段收尾')
    setDraft('')
    onOpen('time')
  }

  return (
    <section className="page">
      <WpcPageHead kicker="TODAY" title="今日" extra={<span className="date-pill">{wpc_formatFullDate(now)}</span>} />
      <div className="page-scroll">
        <WpcSky phase={greet.phase} scene={<WpcWeatherScene kind={live?.ready ? wpc_skyKind(live.code, now.getHours()) : wpc_fallbackSky(now)} />}>
          <p className="weather-chip">
            <b>{live?.ready ? live.label : live ? '定位' : '天色'}</b>
            <span>{live?.ready && live.temp != null ? `${live.temp}°` : live?.ready ? '' : '还在看'}</span>
            {live?.ready ? <small>{live.place}</small> : live ? <small>未开启</small> : null}
          </p>
          <h3>{greet.title}</h3>
          <p>{greet.line}</p>
        </WpcSky>
        <form
          className="quick"
          onSubmit={(event) => {
            event.preventDefault()
            wpc_quick()
          }}
        >
          <input
            ref={inputRef}
            className="text-input"
            value={draft}
            placeholder="记一笔，回车放进收集箱"
            onChange={(event) => setDraft(event.target.value)}
          />
          <button type="submit" className="gold-btn">
            记下
          </button>
          <button type="button" className="ghost-btn" onClick={wpc_focus}>
            专注 25 分
          </button>
        </form>
        <div className="stat-row">
          <article className="stat">
            <span>今日时光</span>
            <strong>{wpc_formatMinutes(seconds / 60)}</strong>
          </article>
          <article className="stat">
            <span>日记</span>
            <strong>{streak > 0 ? `连续 ${streak} 天` : '未写'}</strong>
          </article>
          <article className="stat">
            <span>手稿</span>
            <strong>{vault.notes.length} 篇</strong>
          </article>
        </div>
        <div className="today-grid">
          <article className="card">
            <div className="card-title">
              <h3>今天的时段</h3>
              <button type="button" className="text-link" onClick={() => onOpen('time')}>
                去时光
              </button>
            </div>
            {todayTimes.length === 0 ? <p className="quiet">还没有记录。可以开始一阵专注，或稍后补记。</p> : null}
            <div className="row-list">
              {todayTimes.map((entry) => (
                <button key={entry.id} type="button" className="row-item" onClick={() => onOpen('time', entry.id)}>
                  <i style={{ background: 'var(--gold)' }} />
                  <span>{entry.title}</span>
                  <em>{wpc_categoryLabel[entry.category]}</em>
                  <small>{entry.endedAt ? '已收' : '进行中'}</small>
                </button>
              ))}
            </div>
          </article>
          <article className="card">
            <div className="card-title">
              <h3>今日日记</h3>
              <button type="button" className="text-link" onClick={() => onOpen('diary', todayDiary?.id)}>
                {todayDiary ? '打开' : '写下今天'}
              </button>
            </div>
            <p>{todayDiary ? wpc_excerpt(todayDiary.content, 80) : '这一天还留着空白。晚上回来，也可以补上。'}</p>
          </article>
        </div>
        <article className="card">
          <div className="card-title">
            <h3>最近手稿</h3>
            <button type="button" className="text-link" onClick={() => onOpen('notes')}>
              全部笔记
            </button>
          </div>
          <div className="row-list">
            {recent.map((note) => {
              const excerpt = wpc_listExcerpt(note.title, note.content, 28)
              return (
                <button key={note.id} type="button" className="row-item" onClick={() => onOpen('notes', note.id)}>
                  <span>{note.title.trim() || '无题'}</span>
                  {excerpt ? <small>{excerpt}</small> : null}
                </button>
              )
            })}
          </div>
        </article>
        <article className="card">
          <div className="card-title">
            <h3>近七日</h3>
          </div>
          <WpcWeekChart entries={vault.times} />
        </article>
      </div>
    </section>
  )
}
