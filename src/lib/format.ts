import { wpc_dateKey } from '../../shared/pure'

/**
 * 时和分。
 */
export const wpc_formatClock = (date: Date): string => {
  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')
  return `${hour}:${minute}`
}

/**
 * 给日期输入框用的当地时间。
 */
export const wpc_toLocalInput = (date: Date): string => {
  const pad = (value: number): string => `${value}`.padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * 年月标题。
 */
export const wpc_formatMonth = (date: Date): string => `${date.getFullYear()}年${date.getMonth() + 1}月`

/**
 * 完整日期。
 */
export const wpc_formatFullDate = (date: Date): string =>
  `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 周${'日一二三四五六'[date.getDay()]}`

/**
 * 短日期加钟点。
 */
export const wpc_formatStamp = (iso: string): string => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getMonth() + 1}月${date.getDate()}日 ${wpc_formatClock(date)}`
}

/**
 * 今天、昨天，或原来的日期。
 */
export const wpc_formatSmartDay = (value: string, today = new Date()): string => {
  const key = value.slice(0, 10)
  if (key === wpc_dateKey(today)) return '今天'
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (key === wpc_dateKey(yesterday)) return '昨天'
  return key
}

/**
 * 秒数收成 00:00:00。
 */
export const wpc_formatHms = (totalSeconds: number): string => {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hour = Math.floor(safe / 3600)
  const minute = Math.floor((safe % 3600) / 60)
  const second = safe % 60
  return [hour, minute, second].map((part) => `${part}`.padStart(2, '0')).join(':')
}

/**
 * 分钟收成容易读的时长。
 */
export const wpc_formatMinutes = (minutes: number): string => {
  if (minutes > 0 && minutes < 0.5) return '不到 1 分钟'
  const safe = Math.max(0, Math.round(minutes))
  const hour = Math.floor(safe / 60)
  const minute = safe % 60
  if (hour <= 0) return `${minute} 分钟`
  if (minute === 0) return `${hour} 小时`
  return `${hour} 小时 ${minute} 分`
}

/**
 * 文件大小。
 */
export const wpc_formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
