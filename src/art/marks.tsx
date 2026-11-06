import type { ReactElement, SVGProps } from 'react'
import type { WpcCategory, WpcMood, WpcPage, WpcWeather } from '../../shared/types'

type WpcIconProps = SVGProps<SVGSVGElement>

/**
 * 统一的线框图标底。
 */
const wpc_icon = (children: ReactElement | ReactElement[], extra?: WpcIconProps): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...extra}>
    {children}
  </svg>
)

/**
 * 侧栏图标。
 */
export const WpcNavIcon = ({ name }: { name: WpcPage | 'search' | 'desk' }): ReactElement => {
  if (name === 'today') {
    return wpc_icon([
      <path key="a" d="M4 15.5c1.8-5 4-7.5 8-7.5s6.2 2.5 8 7.5" />,
      <path key="b" d="M12 8V4.5" />,
      <path key="c" d="M8 19h8" />,
    ])
  }
  if (name === 'notes') {
    return wpc_icon([
      <path key="a" d="M7 4.5h7l4 4V19a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1z" />,
      <path key="b" d="M14 4.5V9h4" />,
      <path key="c" d="M9 13h6M9 16h4" />,
    ])
  }
  if (name === 'diary') {
    return wpc_icon([
      <path key="a" d="M6 5.5h10.5A1.5 1.5 0 0 1 18 7v12H8.2A2.2 2.2 0 0 0 6 21.2V5.5z" />,
      <path key="b" d="M6 18.2A2.2 2.2 0 0 1 8.2 16H18" />,
    ])
  }
  if (name === 'time') {
    return wpc_icon([
      <circle key="a" cx="12" cy="12" r="7.2" />,
      <path key="b" d="M12 8.5V12l2.6 1.8" />,
    ])
  }
  if (name === 'journey') {
    return wpc_icon([
      <path key="a" d="M3.5 17.5 8 9l3.2 5 2.2-3.2L20.5 17.5" />,
      <path key="b" d="M4 17.5h16" />,
    ])
  }
  if (name === 'library') {
    return wpc_icon([
      <rect key="a" x="4" y="5" width="16" height="14" rx="2" />,
      <path key="b" d="m7 15 2.4-2.8 2 2.2 2.3-3 3.3 3.6" />,
      <circle key="c" cx="9" cy="9" r="0.8" fill="currentColor" stroke="none" />,
    ])
  }
  if (name === 'search') {
    return wpc_icon([
      <circle key="a" cx="11" cy="11" r="5.2" />,
      <path key="b" d="m15.2 15.2 3.3 3.3" />,
    ])
  }
  return wpc_icon([
    <path key="a" d="M12 4.5v2" />,
    <path key="b" d="M8 8.5h8l-1 9.2a2 2 0 0 1-2 1.8h-2a2 2 0 0 1-2-1.8l-1-9.2z" />,
    <path key="c" d="M9.2 8.5c.2-2 1.4-3.2 2.8-3.2s2.6 1.2 2.8 3.2" />,
  ])
}

/**
 * 心情印章里的图形。
 */
export const WpcMoodMark = ({ mood }: { mood: WpcMood }): ReactElement => {
  if (mood === 'joy') {
    return wpc_icon([
      <path key="a" d="M12 5.5c1.2 2.4.4 3.6-1.2 4.2 2.4.2 3.6 1.4 3.6 3.4-2.2-.2-3.4.6-3.6 2.4-.4-2.2-1.6-3.2-3.6-3 1.8-1.2 2.2-2.6 1.2-4.2.8 1 .8 1.6.6 2.4.6-1.6 1.4-2.8 2.4-3.6.2.8.4 1.4.6 1.4z" />,
    ])
  }
  if (mood === 'focus') {
    return wpc_icon([
      <path key="a" d="M12 4.5v15" />,
      <path key="b" d="m12 8 2.2 2.2L12 12.4 9.8 10.2 12 8z" />,
    ])
  }
  if (mood === 'tired') {
    return wpc_icon([
      <path key="a" d="M6 9c2 1 3.2 3.2 3.2 6" />,
      <path key="b" d="M12 8c1.2 2 1 4.5-.4 6.5" />,
      <path key="c" d="M17 10c.6 1.6.2 3.4-.8 4.8" />,
    ])
  }
  if (mood === 'blue') {
    return wpc_icon([
      <path key="a" d="M8 6.5v8" />,
      <path key="b" d="M12 8.5v8" />,
      <path key="c" d="M16 6.5v8" />,
    ])
  }
  if (mood === 'spark') {
    return wpc_icon(<path d="M12 3.8 13.4 9H19l-4.4 3.2 1.7 5.2L12 14.6 7.7 17.4 9.4 12.2 5 9h5.6L12 3.8z" />)
  }
  return wpc_icon([
    <path key="a" d="M5 14c2.2-1.2 4-1.2 7 0s4.8 1.2 7 0" />,
    <circle key="b" cx="16.5" cy="8" r="1.4" />,
  ])
}

/**
 * 天气图形。
 */
export const WpcWeatherMark = ({ weather }: { weather: WpcWeather }): ReactElement => {
  if (weather === 'cloud') {
    return wpc_icon([
      <path key="a" d="M7 16h9.2a3.2 3.2 0 0 0 .4-6.4 4.6 4.6 0 0 0-8.8 1.2A2.8 2.8 0 0 0 7 16z" />,
    ])
  }
  if (weather === 'rain') {
    return wpc_icon([
      <path key="a" d="M7 13h9.2a3.2 3.2 0 0 0 .4-6.4 4.6 4.6 0 0 0-8.8 1.2A2.8 2.8 0 0 0 7 13z" />,
      <path key="b" d="M9 16.5 8 19M13 16.5 12 19M17 16.5 16 19" />,
    ])
  }
  if (weather === 'snow') {
    return wpc_icon([
      <path key="a" d="M12 5v14M7.2 7.2l9.6 9.6M16.8 7.2l-9.6 9.6" />,
    ])
  }
  if (weather === 'night') {
    return wpc_icon(<path d="M14.5 4.8A6.8 6.8 0 1 0 18 14.8 5.4 5.4 0 0 1 14.5 4.8z" />)
  }
  return wpc_icon([
    <circle key="a" cx="12" cy="12" r="3.2" />,
    <path key="b" d="M12 4.2v1.8M12 18v1.8M4.2 12h1.8M18 12h1.8M6.4 6.4l1.3 1.3M16.3 16.3l1.3 1.3M17.6 6.4l-1.3 1.3M7.7 16.3l-1.3 1.3" />,
  ])
}

/**
 * 时光分类图形。
 */
export const WpcCategoryMark = ({ category }: { category: WpcCategory }): ReactElement => {
  if (category === 'study') return wpc_icon([<path key="a" d="M4 7.5 12 4l8 3.5-8 3.5-8-3.5z" />, <path key="b" d="M8 10.2v4.2c1.2.8 2.6 1.2 4 1.2s2.8-.4 4-1.2v-4.2" />])
  if (category === 'life') return wpc_icon([<path key="a" d="M8 9h8v2.2a4 4 0 0 1-8 0V9z" />, <path key="b" d="M9 9V7.8A3 3 0 0 1 12 5a3 3 0 0 1 3 2.8V9" />, <path key="c" d="M8 20c1.2-2 2.6-3 4-3s2.8 1 4 3" />])
  if (category === 'travel') return wpc_icon([<path key="a" d="M5 17c2.5-4 4-6 7-6s4.2 2 7 6" />, <path key="b" d="M12 7.2 13.2 11" />, <circle key="c" cx="12" cy="6" r="1" />])
  if (category === 'rest') return wpc_icon(<path d="M14.2 6.2A6.2 6.2 0 1 0 18 15 5 5 0 0 1 14.2 6.2z" />)
  return wpc_icon([<path key="a" d="M8 18V8.5L12 6l4 2.5V18" />, <path key="b" d="M10 18v-4h4v4" />])
}
