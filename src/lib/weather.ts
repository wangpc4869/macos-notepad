import { wpc_cityBook } from './city-book'

export type WpcSkyKind = 'sun' | 'cloud' | 'rain' | 'snow' | 'storm' | 'fog' | 'night'

export interface WpcLiveWeather {
  ready: boolean
  kind: WpcSkyKind
  code: number
  label: string
  temp: number | null
  place: string
  latitude: number
  longitude: number
  at: number
}

const wpc_weatherKey = 'hoshisen.live-weather.v3'
const wpc_freshMs = 45 * 60 * 1000
const wpc_moveKm = 15

/**
 * 两点之间的公里数。
 */
const wpc_kmBetween = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const radius = 6371
  const lat = ((lat2 - lat1) * Math.PI) / 180
  const lon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(lat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(lon / 2) ** 2
  return 2 * radius * Math.asin(Math.sqrt(a))
}

/**
 * 把坐标收成最近的城市。离所有城市都太远时，只说当地。
 */
export const wpc_cityName = (latitude: number, longitude: number): string => {
  let best = '当地'
  let bestKm = 420
  for (const [name, lat, lon] of wpc_cityBook) {
    const km = wpc_kmBetween(latitude, longitude, lat, lon)
    if (km < bestKm) {
      bestKm = km
      best = name
    }
  }
  return best
}

/**
 * 把气象编码收成横幅上的一种天色。
 */
export const wpc_skyKind = (code: number, hour: number): WpcSkyKind => {
  if (code >= 95) return 'storm'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 2) return 'cloud'
  if (hour >= 19 || hour < 5) return 'night'
  return 'sun'
}

/**
 * 气象编码的中文名。
 */
export const wpc_skyLabel = (code: number): string => {
  if (code >= 95) return '雷雨'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return '雪'
  if (code >= 80) return '阵雨'
  if (code >= 51) return '雨'
  if (code === 45 || code === 48) return '雾'
  if (code === 3) return '阴'
  if (code === 2 || code === 1) return '多云'
  return '晴'
}

/**
 * 没有连上天气时，按钟点给一个天色。
 */
export const wpc_fallbackSky = (date: Date): WpcSkyKind => wpc_skyKind(0, date.getHours())

/**
 * 限时拉取一段 JSON。
 */
const wpc_fetchJson = async (url: string): Promise<unknown> => {
  const control = new AbortController()
  const timer = window.setTimeout(() => control.abort(), 8000)
  try {
    const response = await fetch(url, { signal: control.signal })
    if (!response.ok) throw new Error('天气没有取到')
    return await response.json()
  } finally {
    window.clearTimeout(timer)
  }
}

/**
 * 读出还新鲜、而且是定位得到的天气。
 */
const wpc_readCache = (): WpcLiveWeather | null => {
  try {
    const raw = JSON.parse(localStorage.getItem(wpc_weatherKey) ?? 'null') as WpcLiveWeather | null
    if (!raw?.ready || typeof raw.latitude !== 'number' || typeof raw.longitude !== 'number') return null
    if (typeof raw.at !== 'number' || Date.now() - raw.at > wpc_freshMs) return null
    return raw
  } catch {
    return null
  }
}

/**
 * 记下这次定位到的天气。
 */
const wpc_writeCache = (live: WpcLiveWeather): void => {
  try {
    localStorage.setItem(wpc_weatherKey, JSON.stringify(live))
  } catch {
    /* 这一页仍然能显示 */
  }
}

/**
 * 按坐标取实况，城市名用最近的市。
 */
const wpc_weatherAt = async (latitude: number, longitude: number, date: Date): Promise<WpcLiveWeather | null> => {
  const data = (await wpc_fetchJson(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`,
  )) as { current?: { temperature_2m?: number; weather_code?: number } }
  const code = data.current?.weather_code
  if (typeof code !== 'number') return null
  const temp = typeof data.current?.temperature_2m === 'number' ? Math.round(data.current.temperature_2m) : null
  return {
    ready: true,
    kind: wpc_skyKind(code, date.getHours()),
    code,
    label: wpc_skyLabel(code),
    temp,
    place: wpc_cityName(latitude, longitude),
    latitude,
    longitude,
    at: Date.now(),
  }
}

/**
 * 定位没被允许时，横幅上的那一行。
 */
const wpc_deniedWeather = (): WpcLiveWeather => ({
  ready: false,
  kind: 'cloud',
  code: 0,
  label: '定位',
  temp: null,
  place: '',
  latitude: 0,
  longitude: 0,
  at: Date.now(),
})

/**
 * 向系统要当前位置。桌面端走主进程，浏览器里才用页面定位。
 */
const wpc_readFix = async (): Promise<{ latitude: number; longitude: number } | 'denied' | null> => {
  const locate = window.hoshisen?.locate
  if (locate) {
    const result = await locate()
    if (result.ok) return { latitude: result.latitude, longitude: result.longitude }
    return result.reason === 'denied' ? 'denied' : null
  }
  if (!navigator.geolocation) return 'denied'
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      (error) => resolve(error.code === error.PERMISSION_DENIED ? 'denied' : null),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 12000 },
    )
  })
}

/**
 * 跟着这台电脑的位置看天气。人换了城市，下一次定位就会换过去。
 */
export const wpc_watchLiveWeather = (onChange: (weather: WpcLiveWeather) => void): (() => void) => {
  let stop = false
  let pending = false
  let reading = false
  const cached = wpc_readCache()
  let lastLat = cached?.latitude ?? Number.NaN
  let lastLon = cached?.longitude ?? Number.NaN
  let lastAt = cached?.at ?? 0
  if (cached) onChange(cached)

  const wpc_consider = (latitude: number, longitude: number): void => {
    if (stop || pending) return
    const moved = !Number.isFinite(lastLat) || wpc_kmBetween(latitude, longitude, lastLat, lastLon) >= wpc_moveKm
    const stale = Date.now() - lastAt > wpc_freshMs
    if (!moved && !stale) return
    pending = true
    void wpc_weatherAt(latitude, longitude, new Date())
      .then((live) => {
        pending = false
        if (stop || !live) return
        lastLat = latitude
        lastLon = longitude
        lastAt = live.at
        wpc_writeCache(live)
        onChange(live)
      })
      .catch(() => {
        pending = false
      })
  }

  const wpc_tick = async (): Promise<void> => {
    if (stop || reading) return
    reading = true
    try {
      const fix = await wpc_readFix()
      if (stop) return
      if (fix === 'denied') {
        if (!Number.isFinite(lastLat)) onChange(wpc_deniedWeather())
        return
      }
      if (fix) wpc_consider(fix.latitude, fix.longitude)
    } finally {
      reading = false
    }
  }

  void wpc_tick()
  const timer = window.setInterval(() => void wpc_tick(), 2 * 60 * 1000)
  const wpc_onVisible = (): void => {
    if (document.visibilityState === 'visible') void wpc_tick()
  }
  document.addEventListener('visibilitychange', wpc_onVisible)
  return () => {
    stop = true
    window.clearInterval(timer)
    document.removeEventListener('visibilitychange', wpc_onVisible)
  }
}
