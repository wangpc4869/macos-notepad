import { wpc_createId, wpc_dateKey, wpc_runningEntry } from '../../shared/pure'
import type { WpcCategory, WpcTimeEntry, WpcVault } from '../../shared/types'

/**
 * 计算一段记录到某个时刻的秒数。
 */
export const wpc_entrySeconds = (entry: WpcTimeEntry, now: number): number => {
  const start = new Date(entry.startedAt).getTime()
  const end = entry.endedAt ? new Date(entry.endedAt).getTime() : now
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0
  return Math.max(0, Math.round((end - start) / 1000))
}

/**
 * 某一天开始的时段，合计秒数。
 */
export const wpc_secondsOnDay = (entries: WpcTimeEntry[], dayKey: string, now: number): number =>
  entries.reduce((sum, entry) => {
    if (wpc_dateKey(new Date(entry.startedAt)) !== dayKey) return sum
    return sum + wpc_entrySeconds(entry, now)
  }, 0)

/**
 * 按分类合计某一天的秒数。
 */
export const wpc_categorySecondsOnDay = (
  entries: WpcTimeEntry[],
  dayKey: string,
  now: number,
): Record<WpcCategory, number> => {
  const result: Record<WpcCategory, number> = { work: 0, study: 0, life: 0, travel: 0, rest: 0 }
  for (const entry of entries) {
    if (wpc_dateKey(new Date(entry.startedAt)) !== dayKey) continue
    if (!(entry.category in result)) continue
    result[entry.category] += wpc_entrySeconds(entry, now)
  }
  return result
}

/**
 * 最近若干天，从旧到新。
 */
export const wpc_lastDays = (count: number, today = new Date()): Date[] => {
  const days: Date[] = []
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const day = new Date(today)
    day.setHours(12, 0, 0, 0)
    day.setDate(day.getDate() - offset)
    days.push(day)
  }
  return days
}

/**
 * 日记连续天数。今天没写时，从昨天往回数。
 */
export const wpc_diaryStreak = (dates: string[], today = new Date()): number => {
  const days = new Set(dates)
  const cursor = new Date(today)
  if (!days.has(wpc_dateKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (days.has(wpc_dateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

/**
 * 开始一段新的时光。已经有进行中的记录时保持原样。
 */
export const wpc_withStartedTimer = (
  vault: WpcVault,
  input: { title: string; category: WpcCategory; targetMin: number | null },
): { vault: WpcVault; ok: boolean } => {
  if (wpc_runningEntry(vault.times)) return { vault, ok: false }
  const entry: WpcTimeEntry = {
    id: wpc_createId(),
    title: input.title.trim() || '未命名时段',
    category: input.category,
    detail: '',
    startedAt: new Date().toISOString(),
    endedAt: null,
    targetMin: input.targetMin,
  }
  return { vault: { ...vault, times: [entry, ...vault.times] }, ok: true }
}

/**
 * 结束正在进行的时段。
 */
export const wpc_withStoppedTimer = (vault: WpcVault): WpcVault => ({
  ...vault,
  times: vault.times.map((entry) => (entry.endedAt === null ? { ...entry, endedAt: new Date().toISOString() } : entry)),
})

/**
 * 丢掉还没结束的时段。
 */
export const wpc_withoutRunningTimer = (vault: WpcVault): WpcVault => ({
  ...vault,
  times: vault.times.filter((entry) => entry.endedAt !== null),
})

/**
 * 补记一段已经发生的时间。失败时返回原因。
 */
export const wpc_manualEntry = (input: {
  title: string
  category: WpcCategory
  start: string
  end: string
  detail: string
}): { entry: WpcTimeEntry } | { error: string } => {
  const start = new Date(input.start)
  const end = new Date(input.end)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return { error: '时间没有填完整' }
  if (start.getTime() > Date.now()) return { error: '开始时间还没到' }
  if (end.getTime() <= start.getTime()) return { error: '结束要晚于开始' }
  if (end.getTime() - start.getTime() > 18 * 60 * 60 * 1000) return { error: '一段先不要超过 18 小时' }
  return {
    entry: {
      id: wpc_createId(),
      title: input.title.trim() || '未命名时段',
      category: input.category,
      detail: input.detail.trim(),
      startedAt: start.toISOString(),
      endedAt: end.toISOString(),
      targetMin: null,
    },
  }
}
