export interface WpcFestival {
  label: string
  tone: 'feast' | 'rest'
}

interface WpcLunar {
  year: number
  month: number
  day: number
  leap: boolean
}

/** 1900–2100 的农历月大小。来源为公开的农历对照表。 */
const wpc_lunarInfo = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, 0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540,
  0x0d6a0, 0x0ada2, 0x095b0, 0x14977, 0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, 0x06566, 0x0d4a0,
  0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, 0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2,
  0x0a950, 0x0b557, 0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, 0x0aea6, 0x0ab50, 0x04b60, 0x0aae4,
  0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, 0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, 0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58,
  0x05ac0, 0x0ab60, 0x096d5, 0x092e0, 0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, 0x0a950, 0x0b4a0,
  0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, 0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260,
  0x0ea65, 0x0d530, 0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, 0x0b5a0, 0x056d0, 0x055b2, 0x049b0,
  0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, 0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
  0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, 0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50,
  0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, 0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, 0x0e968, 0x0d520,
  0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252, 0x0d520,
]

/**
 * 这一年的闰月，没有则是 0。
 */
const wpc_leapMonth = (year: number): number => (wpc_lunarInfo[year - 1900] ?? 0) & 0xf

/**
 * 闰月的天数。
 */
const wpc_leapDays = (year: number): number => {
  if (!wpc_leapMonth(year)) return 0
  return (wpc_lunarInfo[year - 1900] ?? 0) & 0x10000 ? 30 : 29
}

/**
 * 农历某月的天数。
 */
const wpc_lunarMonthDays = (year: number, month: number): number => ((wpc_lunarInfo[year - 1900] ?? 0) & (0x10000 >> month) ? 30 : 29)

/**
 * 农历这一年的总天数。
 */
const wpc_lunarYearDays = (year: number): number => {
  let sum = 348
  for (let bit = 0x8000; bit > 0x8; bit >>= 1) sum += (wpc_lunarInfo[year - 1900] ?? 0) & bit ? 1 : 0
  return sum + wpc_leapDays(year)
}

/**
 * 公历换成农历月日。1900 到 2100 年。
 */
export const wpc_lunarOf = (date: Date): WpcLunar | null => {
  const yearNo = date.getFullYear()
  if (yearNo < 1901 || yearNo > 2100) return null
  let offset = Math.round((Date.UTC(yearNo, date.getMonth(), date.getDate()) - Date.UTC(1900, 0, 31)) / 86400000)
  let year = 1900
  let yearDays = 0
  for (year = 1900; year < 2101 && offset > 0; year += 1) {
    yearDays = wpc_lunarYearDays(year)
    offset -= yearDays
  }
  if (offset < 0) {
    offset += yearDays
    year -= 1
  }
  const leap = wpc_leapMonth(year)
  let leapHit = false
  let month = 1
  let monthDays = 0
  for (month = 1; month < 13 && offset > 0; month += 1) {
    if (leap > 0 && month === leap + 1 && !leapHit) {
      month -= 1
      leapHit = true
      monthDays = wpc_leapDays(year)
    } else {
      monthDays = wpc_lunarMonthDays(year, month)
    }
    if (leapHit && month === leap + 1) leapHit = false
    offset -= monthDays
  }
  if (offset === 0 && leap > 0 && month === leap + 1) {
    if (leapHit) leapHit = false
    else {
      leapHit = true
      month -= 1
    }
  }
  if (offset < 0) {
    offset += monthDays
    month -= 1
  }
  return { year, month, day: offset + 1, leap: leapHit }
}

/**
 * 清明落在四月的哪一天。
 */
const wpc_qingmingDay = (year: number): number => {
  const tail = year % 100
  const base = year >= 2000 ? 4.81 : 5.59
  return Math.floor(tail * 0.2422 + base) - Math.floor(tail / 4)
}

/**
 * 这一天若是节庆，返回贴纸上的两个字。
 */
export const wpc_festivalOn = (date: Date): WpcFestival | null => {
  const lunar = wpc_lunarOf(date)
  if (lunar && !lunar.leap) {
    if (lunar.month === 1 && lunar.day === 1) return { label: '春节', tone: 'feast' }
    if (lunar.month === 1 && lunar.day === 15) return { label: '元宵', tone: 'feast' }
    if (lunar.month === 5 && lunar.day === 5) return { label: '端午', tone: 'feast' }
    if (lunar.month === 7 && lunar.day === 7) return { label: '七夕', tone: 'feast' }
    if (lunar.month === 8 && lunar.day === 15) return { label: '中秋', tone: 'feast' }
    if (lunar.month === 9 && lunar.day === 9) return { label: '重阳', tone: 'feast' }
    if (lunar.month === 12 && lunar.day === 8) return { label: '腊八', tone: 'feast' }
  }
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
  const nextLunar = wpc_lunarOf(next)
  if (nextLunar && !nextLunar.leap && nextLunar.month === 1 && nextLunar.day === 1) return { label: '除夕', tone: 'feast' }
  const month = date.getMonth() + 1
  const day = date.getDate()
  if (month === 1 && day === 1) return { label: '元旦', tone: 'rest' }
  if (month === 4 && day === wpc_qingmingDay(date.getFullYear())) return { label: '清明', tone: 'rest' }
  if (month === 5 && day === 1) return { label: '劳动', tone: 'rest' }
  if (month === 10 && day === 1) return { label: '国庆', tone: 'rest' }
  return null
}
