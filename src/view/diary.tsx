import { useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { wpc_createId, wpc_dateKey, wpc_guessWeather } from '../../shared/pure'
import type { WpcDiary as WpcDiaryEntry, WpcMood, WpcWeather } from '../../shared/types'
import { WpcMoodMark, WpcWeatherMark } from '../art/marks'
import { wpc_mediaUrl } from '../lib/api'
import { wpc_moodLabel, wpc_moods, wpc_weatherLabel, wpc_weathers, type WpcJump } from '../lib/copy'
import { wpc_festivalOn } from '../lib/festival'
import { wpc_formatMonth, wpc_formatStamp } from '../lib/format'
import { wpc_monthMatrix, wpc_todayKey } from '../lib/greeting'
import { wpc_useVault } from '../state/vault'
import { WpcConfirm, WpcEmpty, WpcPageHead } from './bits'

/**
 * 日记贴纸上的两个字。有题目就取题目开头。
 */
const wpc_diaryMark = (title: string): string => {
  const text = title.trim()
  return text ? text.slice(0, 2) : '写了'
}

/**
 * 日记：月历、心情和当天的照片。
 */
export const WpcDiary = ({
  target,
  calm,
  onCalm,
}: {
  target: WpcJump | null
  calm: boolean
  onCalm: (value: boolean) => void
}): ReactElement => {
  const { vault, wpc_mutate, wpc_notify, wpc_addImages } = wpc_useVault()
  const [cursor, setCursor] = useState(() => new Date())
  const [selected, setSelected] = useState(() => wpc_todayKey())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [pending, setPending] = useState<WpcDiaryEntry | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const wpc_create = (date = selected): void => {
    const stamp = new Date().toISOString()
    const diary: WpcDiaryEntry = {
      id: wpc_createId(),
      date,
      title: '',
      content: '',
      place: '',
      mood: 'clear',
      weather: wpc_guessWeather(new Date()),
      imageIds: [],
      createdAt: stamp,
      updatedAt: stamp,
    }
    wpc_mutate((current) => ({ ...current, diaries: [diary, ...current.diaries] }))
    setSelected(date)
    setActiveId(diary.id)
  }

  useEffect(() => {
    if (target?.page !== 'diary' || !vault) return
    const found = vault.diaries.find((item) => item.id === target.id)
    if (!found) return
    setActiveId(found.id)
    setSelected(found.date)
    const [year, month] = found.date.split('-')
    if (year && month) setCursor(new Date(Number(year), Number(month) - 1, 1))
  }, [target])

  useEffect(() => {
    const wpc_onNew = (): void => wpc_create()
    window.addEventListener('hoshisen:new', wpc_onNew)
    return () => window.removeEventListener('hoshisen:new', wpc_onNew)
  })

  if (!vault) return <div />
  const cells = wpc_monthMatrix(cursor)
  const marks = new Map<string, string>()
  vault.diaries.forEach((item) => {
    if (!marks.has(item.date)) marks.set(item.date, wpc_diaryMark(item.title))
  })
  const dayItems = vault.diaries.filter((item) => item.date === selected).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  const active = dayItems.find((item) => item.id === activeId) ?? dayItems[0] ?? null
  const today = wpc_todayKey()

  const wpc_commit = (next: WpcDiaryEntry): void => {
    wpc_mutate((current) => ({
      ...current,
      diaries: current.diaries.map((item) => (item.id === next.id ? { ...next, updatedAt: new Date().toISOString() } : item)),
    }))
  }

  return (
    <section className="page is-fill">
      <WpcPageHead
        kicker="DIARY"
        title="日记"
        extra={
          <button type="button" className="gold-btn" onClick={() => wpc_create(selected)}>
            写这一天
          </button>
        }
      />
      <div className="split diary-split">
        <div className="pane">
          <div className="cal-board">
            <div className="cal-head">
              <button type="button" className="ghost-btn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
                上月
              </button>
              <strong>{wpc_formatMonth(cursor)}</strong>
              <button type="button" className="ghost-btn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
                下月
              </button>
            </div>
            <div className="cal-week">
              {['一', '二', '三', '四', '五', '六', '日'].map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <div className="cal-grid">
              {cells.map((day, index) => {
                if (!day) return <span key={`empty-${index}`} />
                const key = wpc_dateKey(day)
                const festival = wpc_festivalOn(day)
                const written = marks.get(key)
                const weekend = day.getDay() === 0 || day.getDay() === 6
                const className = ['cal-cell', key === selected ? 'is-picked' : '', key === today ? 'is-today' : '', weekend ? 'is-weekend' : '']
                  .filter(Boolean)
                  .join(' ')
                return (
                  <button
                    key={key}
                    type="button"
                    className={className}
                    aria-label={`${day.getDate()}日${festival ? ` ${festival.label}` : ''}${written ? ` 日记${written}` : ''}`}
                    onClick={() => {
                      setSelected(key)
                      setActiveId(null)
                    }}
                  >
                    <span className="cal-num">{day.getDate()}</span>
                    <span className="cal-marks">
                      {festival ? <i className={festival.label === '春节' || festival.label === '国庆' ? `doodle is-${festival.tone} is-major` : `doodle is-${festival.tone}`}>{festival.label}</i> : null}
                      {written ? <i className="doodle is-note">{written}</i> : null}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="row-list">
            {dayItems.map((item) => (
              <button key={item.id} type="button" className={active?.id === item.id ? 'note-row is-on' : 'note-row'} onClick={() => setActiveId(item.id)}>
                <span>{item.title.trim() || '无题日记'}</span>
                <small>
                  {wpc_moodLabel[item.mood]} · {wpc_formatStamp(item.updatedAt)}
                </small>
              </button>
            ))}
          </div>
        </div>
        <div className="pane">
          {active ? (
            <article className="paper">
              <div className="seal" aria-hidden="true">
                记
              </div>
              <div className="paper-top">
                <p className="kicker ink">{selected}</p>
                <input className="paper-title" value={active.title} placeholder="今天的题目" onChange={(event) => wpc_commit({ ...active, title: event.target.value })} />
              </div>
              <input className="plain-input" value={active.place} placeholder="今天在哪里" onChange={(event) => wpc_commit({ ...active, place: event.target.value })} />
              <div className="stamp-row">
                {wpc_moods.map((mood) => (
                  <button key={mood} type="button" className={active.mood === mood ? 'stamp is-on' : 'stamp'} onClick={() => wpc_commit({ ...active, mood })}>
                    <WpcMoodMark mood={mood as WpcMood} />
                    <small>{wpc_moodLabel[mood]}</small>
                  </button>
                ))}
              </div>
              <div className="stamp-row">
                {wpc_weathers.map((weather) => (
                  <button key={weather} type="button" className={active.weather === weather ? 'stamp is-on' : 'stamp'} onClick={() => wpc_commit({ ...active, weather })}>
                    <WpcWeatherMark weather={weather as WpcWeather} />
                    <small>{wpc_weatherLabel[weather]}</small>
                  </button>
                ))}
              </div>
              <textarea className="paper-body" value={active.content} placeholder="今天过得怎样？" onChange={(event) => wpc_commit({ ...active, content: event.target.value })} />
              <div className="tool-row on-paper">
                <button type="button" className="ghost-btn" onClick={() => fileRef.current?.click()}>
                  加照片
                </button>
                <button type="button" className="ghost-btn" onClick={() => onCalm(!calm)}>
                  {calm ? '退出沉浸' : '沉浸'}
                </button>
                <button type="button" className="danger-btn" onClick={() => setPending(active)}>
                  删除
                </button>
                <input
                  ref={fileRef}
                  hidden
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={(event) => {
                    const files = [...(event.target.files ?? [])]
                    event.target.value = ''
                    const diaryId = active.id
                    void wpc_addImages(files)
                      .then((assets) => {
                        if (!assets.length) return
                        const ids = assets.map((asset) => asset.id)
                        wpc_mutate((current) => ({
                          ...current,
                          diaries: current.diaries.map((item) =>
                            item.id === diaryId
                              ? {
                                  ...item,
                                  imageIds: [...ids, ...item.imageIds.filter((id) => !ids.includes(id))],
                                  updatedAt: new Date().toISOString(),
                                }
                              : item,
                          ),
                        }))
                      })
                      .catch((error: unknown) => wpc_notify(error instanceof Error ? error.message : '图片没有放进来'))
                  }}
                />
              </div>
              {active.imageIds.length > 0 ? (
                <div className="photo-strip">
                  {active.imageIds.map((id) => (
                    <figure key={id}>
                      <img src={wpc_mediaUrl(id)} alt="" />
                      <button type="button" onClick={() => wpc_commit({ ...active, imageIds: active.imageIds.filter((item) => item !== id) })}>
                        拿下
                      </button>
                    </figure>
                  ))}
                </div>
              ) : null}
            </article>
          ) : (
            <WpcEmpty title="这一天还是空白" text="旅行、加班、平常的晚饭，都值得留下一两句。" action="写这一天" onAction={() => wpc_create(selected)} />
          )}
        </div>
      </div>
      {pending ? (
        <WpcConfirm
          title="删除这篇日记？"
          text="这一天的这篇记录会被拿掉。"
          confirmLabel="删除"
          onClose={() => setPending(null)}
          onConfirm={() => {
            wpc_mutate((current) => ({ ...current, diaries: current.diaries.filter((item) => item.id !== pending.id) }))
            setActiveId(null)
            setPending(null)
          }}
        />
      ) : null}
    </section>
  )
}
