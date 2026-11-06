import type { ReactElement } from 'react'
import type { WpcSkyKind } from '../lib/weather'

/**
 * 横幅右侧的卡通天色。
 */
export const WpcWeatherScene = ({ kind }: { kind: WpcSkyKind }): ReactElement => (
  <svg className={`sky-scene is-${kind}`} viewBox="0 0 220 168" aria-hidden="true">
    <defs>
      <filter id="wpc-sky-soft" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="5" stdDeviation="3.2" floodColor="#7d92aa" floodOpacity="0.22" />
      </filter>
    </defs>
    <g filter="url(#wpc-sky-soft)">
      {kind === 'night' ? <WpcNightSky /> : null}
      {kind === 'sun' ? <WpcSunSky /> : null}
      {kind === 'cloud' ? <WpcCloudSky /> : null}
      {kind === 'rain' ? <WpcRainSky /> : null}
      {kind === 'snow' ? <WpcSnowSky /> : null}
      {kind === 'storm' ? <WpcStormSky /> : null}
      {kind === 'fog' ? <WpcFogSky /> : null}
    </g>
  </svg>
)

/**
 * 一颗带笑意的太阳。
 */
const WpcSunSky = (): ReactElement => (
  <>
    <ellipse cx="112" cy="128" rx="46" ry="8" fill="#f0c98a" opacity="0.35" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((turn) => (
      <rect key={turn} className="ray" x="106" y="14" width="12" height="18" rx="6" fill="#ffd27a" transform={`rotate(${turn} 112 78)`} />
    ))}
    <circle cx="112" cy="78" r="36" fill="#ffe7a6" />
    <circle cx="112" cy="78" r="30" fill="#ffc857" />
    <ellipse cx="100" cy="74" rx="5" ry="3.2" fill="#f0944a" opacity="0.55" />
    <ellipse cx="124" cy="74" rx="5" ry="3.2" fill="#f0944a" opacity="0.55" />
    <circle cx="101" cy="72" r="2.2" fill="#5c4634" />
    <circle cx="123" cy="72" r="2.2" fill="#5c4634" />
    <path d="M102 86c4 7 16 7 20 0" fill="none" stroke="#e08a3a" strokeWidth="2.4" strokeLinecap="round" />
  </>
)

/**
 * 一朵有轮廓的云。
 */
const WpcCloudBody = ({
  x,
  y,
  fill = '#f7fbff',
  shade = '#d7e6f6',
  ink = '#8eabc8',
}: {
  x: number
  y: number
  fill?: string
  shade?: string
  ink?: string
}): ReactElement => (
  <g transform={`translate(${x} ${y})`}>
    <path
      d="M28 62c-14 2-24-10-18-22 4-8 14-10 22-6 2-14 18-22 32-16 12-12 32-8 38 6 16-2 30 12 22 26-2 10-12 16-24 14H40c-4 0-8 0-12-2z"
      fill={shade}
    />
    <path
      d="M30 54c-12 0-20-9-16-20 3-7 12-10 20-6 3-12 16-18 28-12 11-10 28-6 32 6 14-1 26 10 20 22-1 8-10 14-20 13H42c-5 0-8-1-12-3z"
      fill={fill}
      stroke={ink}
      strokeWidth="2.4"
      strokeLinejoin="round"
    />
    <ellipse cx="48" cy="40" rx="10" ry="6" fill="#fff" opacity="0.7" />
  </g>
)

/**
 * 云上的表情。
 */
const WpcCloudFace = ({ x, y, ink = '#6d8aab' }: { x: number; y: number; ink?: string }): ReactElement => (
  <g transform={`translate(${x} ${y})`} fill="none" stroke={ink} strokeWidth="2.2" strokeLinecap="round">
    <path d="M0 2c1.4-2 3-2 4.4 0" />
    <path d="M14 2c1.4-2 3-2 4.4 0" />
    <path d="M6 12c2.4 3 8 3 10.4 0" />
  </g>
)

/**
 * 一滴雨。
 */
const WpcDrop = ({ x, y, tone = '#6eb4ea' }: { x: number; y: number; tone?: string }): ReactElement => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M0 0c5 8 5 13 0 20-5-7-5-12 0-20z" fill={tone} />
    <ellipse cx="-2.2" cy="8" rx="1.3" ry="2.4" fill="#fff" opacity="0.75" />
  </g>
)

/**
 * 一片雪花。
 */
const WpcFlake = ({ x, y, size = 7 }: { x: number; y: number; size?: number }): ReactElement => (
  <g transform={`translate(${x} ${y})`} stroke="#d5e6fb" strokeWidth="1.8" strokeLinecap="round">
    <path d={`M0 ${-size}v${size * 2}M${-size} 0h${size * 2}`} />
    <path d={`M${-size * 0.7} ${-size * 0.7}l${size * 1.4} ${size * 1.4}M${size * 0.7} ${-size * 0.7}l${-size * 1.4} ${size * 1.4}`} />
  </g>
)

/**
 * 多云，太阳从云后露出半张脸。
 */
const WpcCloudSky = (): ReactElement => (
  <>
    <g transform="translate(148 58)">
      <rect className="ray" x="-5" y="-38" width="10" height="14" rx="5" fill="#ffd27a" />
      <rect className="ray" x="20" y="-8" width="14" height="10" rx="5" fill="#ffd27a" />
      <rect className="ray" x="12" y="16" width="12" height="9" rx="4.5" fill="#ffe3a6" transform="rotate(36 18 20)" />
    </g>
    <circle cx="148" cy="58" r="22" fill="#ffe3a2" />
    <circle cx="148" cy="58" r="16" fill="#ffc857" />
    <WpcCloudBody x={34} y={36} />
    <WpcCloudFace x={78} y={78} />
  </>
)

/**
 * 雨。
 */
const WpcRainSky = (): ReactElement => (
  <>
    <WpcCloudBody x={36} y={18} fill="#f4f8ff" shade="#c9ddf3" />
    <WpcCloudFace x={80} y={62} />
    <WpcDrop x={78} y={108} />
    <WpcDrop x={102} y={116} tone="#4f9fe0" />
    <WpcDrop x={126} y={108} />
  </>
)

/**
 * 雪。
 */
const WpcSnowSky = (): ReactElement => (
  <>
    <WpcCloudBody x={36} y={16} />
    <WpcCloudFace x={80} y={60} />
    <WpcFlake x={84} y={118} />
    <WpcFlake x={112} y={132} size={5} />
    <WpcFlake x={136} y={116} size={6} />
  </>
)

/**
 * 雷雨。
 */
const WpcStormSky = (): ReactElement => (
  <>
    <WpcCloudBody x={28} y={16} fill="#e7eef8" shade="#b7cbe2" ink="#7f97b0" />
    <path d="M118 86l-18 26h14l-10 24 26-34h-16z" fill="#f3c14e" stroke="#e09a2e" strokeWidth="1.4" strokeLinejoin="round" />
    <WpcDrop x={70} y={112} tone="#8eb6d8" />
    <WpcDrop x={92} y={120} tone="#8eb6d8" />
  </>
)

/**
 * 雾。
 */
const WpcFogSky = (): ReactElement => (
  <>
    <circle cx="150" cy="58" r="16" fill="#ffe7b0" opacity="0.9" />
    <rect x="36" y="62" width="148" height="16" rx="8" fill="#f7fbff" stroke="#c5d5e6" strokeWidth="1.6" />
    <rect x="52" y="88" width="124" height="14" rx="7" fill="#f7fbff" stroke="#c5d5e6" strokeWidth="1.6" opacity="0.9" />
    <rect x="44" y="112" width="104" height="12" rx="6" fill="#f7fbff" stroke="#c5d5e6" strokeWidth="1.6" opacity="0.75" />
  </>
)

/**
 * 夜里的月亮。
 */
const WpcNightSky = (): ReactElement => (
  <>
    <circle cx="58" cy="42" r="1.6" fill="#fff1c2" />
    <circle cx="78" cy="28" r="2.2" fill="#fff6d8" />
    <circle cx="168" cy="36" r="1.5" fill="#fff1c2" />
    <path d="M118 34a36 36 0 1 0 26 62 26 26 0 1 1-26-62z" fill="#fff3c4" stroke="#f0d48a" strokeWidth="1.6" />
    <circle cx="104" cy="70" r="2.2" fill="#c9a15a" />
    <circle cx="118" cy="74" r="2.2" fill="#c9a15a" />
    <path d="M106 86c3.2 4 9 4 12.2 0" fill="none" stroke="#e0b15a" strokeWidth="1.8" strokeLinecap="round" />
  </>
)
