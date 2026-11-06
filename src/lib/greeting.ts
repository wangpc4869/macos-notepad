import { wpc_dateKey } from '../../shared/pure'

export type WpcPhase = 'morning' | 'day' | 'dusk' | 'night'

/**
 * 按钟点写一句问候。
 */
export const wpc_greeting = (name: string, date: Date): { phase: WpcPhase; title: string; line: string } => {
  const hour = date.getHours()
  const who = name.trim() || '旅人'
  if (hour < 5) return { phase: 'night', title: `${who}，夜还很长`, line: '未眠的句子，也值得留下。' }
  if (hour < 11) return { phase: 'morning', title: `早安，${who}`, line: '先把今天最重要的一件事写下来。' }
  if (hour < 17) return { phase: 'day', title: `${who}，午后安稳`, line: '工作的脉络，可以在这里理清。' }
  if (hour < 20) return { phase: 'dusk', title: `黄昏好，${who}`, line: '把白天的光，收成短短几行。' }
  return { phase: 'night', title: `晚上好，${who}`, line: '灯还亮着，今天就还没有结束。' }
}

/**
 * 月历格子，周一开头，空白处是 null。
 */
export const wpc_monthMatrix = (cursor: Date): Array<Date | null> => {
  const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const lead = (start.getDay() + 6) % 7
  const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
  const cells: Array<Date | null> = []
  for (let index = 0; index < lead; index += 1) cells.push(null)
  for (let day = 1; day <= days; day += 1) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), day))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

/**
 * 今天的日期键。
 */
export const wpc_todayKey = (date = new Date()): string => wpc_dateKey(date)
