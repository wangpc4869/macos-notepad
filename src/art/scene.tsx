import { useId } from 'react'
import type { ReactElement, ReactNode } from 'react'
import type { WpcSkin } from '../../shared/types'
import castAria from '../assets/cast/aria.jpg'
import castFleet from '../assets/cast/fleet.jpg'
import castHush from '../assets/cast/hush.jpg'
import castManga from '../assets/cast/manga.jpg'
import castMecha from '../assets/cast/mecha.jpg'
import castNight from '../assets/cast/night.jpg'
import castNoir from '../assets/cast/noir.jpg'
import castSakura from '../assets/cast/sakura.jpg'
import castTide from '../assets/cast/tide.jpg'
import castYouth from '../assets/cast/youth.jpg'
import type { WpcPhase } from '../lib/greeting'

const wpc_cast: Partial<Record<WpcSkin, string>> = {
  aria: castAria,
  sakura: castSakura,
  tide: castTide,
  night: castNight,
  noir: castNoir,
  hush: castHush,
  youth: castYouth,
  fleet: castFleet,
  manga: castManga,
  mecha: castMecha,
}

/**
 * 星笺的灯狐。原创吉祥物，提着一盏纸灯。
 */
export const WpcFox = ({ className }: { className?: string }): ReactElement => {
  const raw = useId().replace(/:/g, '')
  const fur = `fur-${raw}`
  const glow = `glow-${raw}`
  return (
    <svg className={className} viewBox="0 0 240 220" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={fur} x1="80" y1="40" x2="150" y2="190" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff8ef" />
          <stop offset="1" stopColor="#f0d2b4" />
        </linearGradient>
        <radialGradient id={glow} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(176 146) scale(36)">
          <stop stopColor="#fff4cc" />
          <stop offset="0.45" stopColor="#f0b35a" stopOpacity="0.7" />
          <stop offset="1" stopColor="#f0b35a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="118" cy="204" rx="62" ry="8" fill="rgba(0,0,0,0.18)" />
      <path d="M168 150c28 8 34 32 12 42-20 6-36-6-40-24 8-2 18-10 28-18z" fill={`url(#${fur})`} />
      <path d="M58 156c-22 10-24 32-4 38 18 4 30-12 28-28-6-2-16-6-24-10z" fill="#e7c4a4" />
      <path d="M78 92 96 28l22 58" fill={`url(#${fur})`} />
      <path d="M168 92 150 28l-22 58" fill={`url(#${fur})`} />
      <path d="M92 46 102 74 84 70" fill="#f3a7c2" />
      <path d="M154 46 144 74 162 70" fill="#f3a7c2" />
      <ellipse cx="122" cy="112" rx="58" ry="50" fill={`url(#${fur})`} />
      <ellipse cx="100" cy="112" rx="7" ry="8" fill="#2c261c" />
      <ellipse cx="146" cy="112" rx="7" ry="8" fill="#2c261c" />
      <ellipse cx="102" cy="109" rx="2.2" ry="2.2" fill="#fff" />
      <ellipse cx="148" cy="109" rx="2.2" ry="2.2" fill="#fff" />
      <path d="M116 126c2 4 6 4 8 0" stroke="#2c261c" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M86 124c6 4 12 2 14-2" stroke="#e7a8b4" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M158 124c-6 4-12 2-14-2" stroke="#e7a8b4" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M122 78l6 8 6-8" stroke="#e2a44a" strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="128" cy="74" r="3.2" fill="#f0b35a" />
      <circle className="lantern-glow" cx="176" cy="146" r="36" fill={`url(#${glow})`} />
      <path d="M176 112v10" stroke="#f0b35a" strokeWidth="3" strokeLinecap="round" />
      <rect x="168" y="120" width="16" height="8" rx="2" fill="#ffe1a8" />
      <rect x="162" y="128" width="28" height="32" rx="10" fill="#f0b35a" />
      <ellipse cx="176" cy="144" rx="6" ry="8" fill="#fff6d8" />
      <path d="M166 160h20" stroke="#c4843a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/**
 * 按皮肤换侧栏里的人。人物都用同一套细光影画法。
 */
export const WpcMascot = ({ skin, className }: { skin: WpcSkin; className?: string }): ReactElement => {
  const portrait = wpc_cast[skin]
  if (portrait) {
    return <img className={className ? `${className} cast-portrait` : 'cast-portrait'} src={portrait} alt="" draggable={false} />
  }
  return <WpcFox className={className} />
}

/**
 * 今日页顶部的天色。日期留在页眉，这里放问候和天气。
 */
export const WpcSky = ({ phase, scene, children }: { phase: WpcPhase; scene?: ReactNode; children: ReactNode }): ReactElement => (
  <section className={`sky sky-${phase}`}>
    {scene}
    <svg className="hills" viewBox="0 0 800 120" preserveAspectRatio="none" aria-hidden="true">
      <path className="hill-far" d="M0 78C140 40 220 96 340 70C470 40 560 92 690 66C740 56 770 60 800 64V120H0Z" />
      <path className="hill-near" d="M0 96C150 74 250 112 410 90C560 70 650 108 800 86V120H0Z" />
    </svg>
    <div className="sky-copy">{children}</div>
  </section>
)
