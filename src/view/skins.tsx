import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import type { WpcSkin } from '../../shared/types'
import { WpcMascot } from '../art/scene'
import { wpc_skinList, wpc_skinMeta } from '../lib/skins'
import { WpcCloseButton } from './bits'

/**
 * 标题栏里的四款日常，以及进入皮肤中心的入口。
 */
export const WpcSkinPicker = ({
  skin,
  onPick,
  onMore,
}: {
  skin: WpcSkin
  onPick: (next: WpcSkin) => void
  onMore?: () => void
}): ReactElement => (
  <div className="skin-grid">
    {wpc_skinList
      .filter((item) => item.featured)
      .map((item) => (
        <button key={item.id} type="button" className={skin === item.id ? 'skin-card is-on' : 'skin-card'} onClick={() => onPick(item.id)}>
          <i className={`swatch is-${item.id}`} />
          <strong>{item.name}</strong>
          <small>{item.line}</small>
        </button>
      ))}
    {onMore ? (
      <button type="button" className="skin-more" onClick={onMore}>
        更多皮肤
      </button>
    ) : null}
  </div>
)

/**
 * 皮肤中心。日常和剧场都在这里换。
 */
export const WpcSkinCenter = ({
  open,
  skin,
  onPick,
  onClose,
}: {
  open: boolean
  skin: WpcSkin
  onPick: (next: WpcSkin) => void
  onClose: () => void
}): ReactElement | null => {
  if (!open) return null
  return (
    <div className="center-back" onMouseDown={onClose} role="presentation">
      <section className="center" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="皮肤中心">
        <header className="center-head">
          <div className="card-title">
            <div>
              <p className="kicker">WARDROBE</p>
              <h3>皮肤中心</h3>
            </div>
            <WpcCloseButton onClose={onClose} />
          </div>
          <p className="quiet">日常四款随时可换。剧场还有雨夜、放学、出海、墨线漫画，以及一套霆甲。</p>
        </header>
        <div className="center-scroll">
          <div className="center-grid">
            {wpc_skinList.map((item) => (
              <button key={item.id} type="button" className={skin === item.id ? 'center-card is-on' : 'center-card'} onClick={() => onPick(item.id)}>
                <WpcMascot skin={item.id} className="center-mascot" />
                <i className={`swatch is-${item.id}`} />
                <em>{item.stage}</em>
                <strong>{item.name}</strong>
                <small>{item.line}</small>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

/**
 * 灯狐贴在耳边的一句。过一会儿会换。
 */
export const WpcWhisper = ({ skin }: { skin: WpcSkin }): ReactElement => {
  const lines = wpc_skinMeta(skin).lines
  const [index, setIndex] = useState(0)
  useEffect(() => {
    setIndex(0)
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % lines.length), 7400)
    return () => window.clearInterval(timer)
  }, [lines])
  const line = lines[index] ?? lines[0]
  return (
    <div className="fox-whisper">
      <AnimatePresence mode="wait">
        <motion.p key={line} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35 }}>
          {line}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

const wpc_spots = [4, 9, 14, 19, 24, 29, 34, 39, 44, 49, 54, 59, 64, 69, 74, 79, 84, 89, 94]
const wpc_stars = [
  [6, 8], [14, 22], [22, 6], [31, 18], [38, 9], [46, 28], [53, 7], [61, 16], [69, 5], [76, 24], [84, 11], [92, 19],
  [11, 40], [27, 36], [48, 44], [66, 38], [81, 46], [18, 58], [57, 62], [88, 54],
]

const wpc_sea = 'M0 118C70 118 100 42 180 48C260 54 290 136 380 128C470 120 500 46 600 40C700 34 730 146 840 132C950 118 980 52 1080 56C1140 60 1170 118 1200 118C1270 118 1300 42 1380 48C1460 54 1490 136 1580 128C1670 120 1700 46 1800 40C1900 34 1930 146 2040 132C2150 118 2180 52 2280 56C2340 60 2370 118 2400 118V320H0Z'
const wpc_foam = 'M0 118C70 118 100 42 180 48C260 54 290 136 380 128C470 120 500 46 600 40C700 34 730 146 840 132C950 118 980 52 1080 56C1140 60 1170 118 1200 118C1270 118 1300 42 1380 48C1460 54 1490 136 1580 128C1670 120 1700 46 1800 40C1900 34 1930 146 2040 132C2150 118 2180 52 2280 56C2340 60 2370 118 2400 118'
const wpc_swell = 'M0 150C90 150 130 78 230 86C330 94 360 168 470 160C580 152 610 80 720 74C830 68 870 176 990 164C1110 152 1140 86 1200 90C1290 94 1330 78 1430 86C1530 94 1560 168 1670 160C1780 152 1810 80 1920 74C2030 68 2070 176 2190 164C2310 152 2340 96 2400 90V320H0Z'
const wpc_swellFoam = 'M0 150C90 150 130 78 230 86C330 94 360 168 470 160C580 152 610 80 720 74C830 68 870 176 990 164C1110 152 1140 86 1200 90C1290 94 1330 78 1430 86C1530 94 1560 168 1670 160C1780 152 1810 80 1920 74C2030 68 2070 176 2190 164C2310 152 2340 96 2400 90'

/**
 * 按落点铺一层同一种飘动物。
 */
const WpcDrift = ({ kind, duration }: { kind: string; duration: number }): ReactElement => (
  <>
    {wpc_spots.map((left) => (
      <i
        key={`${kind}-${left}`}
        className={kind}
        style={{
          left: `${left}%`,
          animationDelay: `${(left % 8) * -0.7}s`,
          animationDuration: `${duration + (left % 5) * 0.55}s`,
        }}
      />
    ))}
  </>
)

/**
 * 夜笺的星星，停在各自的位置上闪。
 */
const WpcStars = (): ReactElement => (
  <>
    {wpc_stars.map(([left, top]) => (
      <i
        key={`${left}-${top}`}
        className={left % 3 === 0 ? 'star-bit is-lg' : 'star-bit'}
        style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${(left % 7) * -0.4}s` }}
      />
    ))}
  </>
)

/**
 * 一层海面：填色的浪身，再加上浪头的白沫。
 */
const WpcSea = ({ level, body, crest }: { level: string; body: string; crest?: string }): ReactElement => (
  <svg className={`wave ${level}`} viewBox="0 0 2400 320" preserveAspectRatio="none">
    <path className="sea-body" d={body} />
    {crest ? <path className="sea-foam" d={crest} /> : null}
  </svg>
)

/**
 * 远航的海面，铺在窗口下半部。
 */
const WpcWaves = (): ReactElement => (
  <div className="wave-field" aria-hidden="true">
    <i className="sea-glint" />
    <WpcSea level="wave-deep" body={wpc_swell} />
    <WpcSea level="wave-mid" body={wpc_sea} crest={wpc_foam} />
    <WpcSea level="wave-front" body={wpc_swell} crest={wpc_swellFoam} />
  </div>
)

/**
 * 一片带分叉的闪电。
 */
const WpcBoltSky = ({ name, delay, trunk, forks }: { name: string; delay: string; trunk: string; forks: string[] }): ReactElement => (
  <svg className={`bolt-sky ${name}`} style={{ animationDelay: delay }} viewBox="0 0 1200 800" preserveAspectRatio="xMidYMin slice">
    <g className="bolt-glow">
      <path d={trunk} />
      {forks.map((fork) => (
        <path key={fork} d={fork} />
      ))}
    </g>
    <g className="bolt-core">
      <path d={trunk} />
      {forks.map((fork) => (
        <path key={fork} d={fork} />
      ))}
    </g>
  </svg>
)

/**
 * 霆甲的雷暴，铺满上半个窗口。
 */
const WpcBolts = (): ReactElement => (
  <div className="bolt-field" aria-hidden="true">
    <i className="bolt-flash" />
    <WpcBoltSky
      name="bolt-sky-a"
      delay="0s"
      trunk="M240 0L300 90L190 112L340 210L250 236L430 360L330 390L560 560L450 590L680 800"
      forks={['M340 210L520 180L610 250L540 310', 'M430 360L280 430L360 520', 'M560 560L760 520L860 610L780 700L920 760']}
    />
    <WpcBoltSky
      name="bolt-sky-b"
      delay="-1.5s"
      trunk="M620 0L560 100L720 130L640 230L820 270L730 400L920 450L800 600L980 660L860 800"
      forks={['M720 130L900 110L980 190', 'M820 270L980 240L1100 330L1020 420', 'M920 450L760 520L840 640']}
    />
    <WpcBoltSky
      name="bolt-sky-c"
      delay="-3s"
      trunk="M900 0L960 70L840 96L1040 190L930 220L1120 360L980 400L1160 560"
      forks={['M1040 190L860 230L780 180L640 240L520 200', 'M1120 360L980 430L1080 520L960 640', 'M840 96L700 70L620 140']}
    />
  </div>
)

/**
 * 铺在窗口背后、随皮肤变化的天气。
 */
export const WpcAtmosphere = ({ skin }: { skin: WpcSkin }): ReactElement => {
  if (skin === 'aria') {
    return (
      <div className="drift-field" aria-hidden="true">
        <i className="sun-ray" />
        <WpcDrift kind="mote" duration={14} />
      </div>
    )
  }
  if (skin === 'sakura') {
    return (
      <div className="drift-field" aria-hidden="true">
        <WpcDrift kind="petal-live" duration={12} />
      </div>
    )
  }
  if (skin === 'tide') {
    return (
      <div className="drift-field" aria-hidden="true">
        <i className="caustic" />
        <WpcDrift kind="bubble" duration={13} />
      </div>
    )
  }
  if (skin === 'night') {
    return (
      <div className="drift-field" aria-hidden="true">
        <i className="moon-glow" />
        <WpcStars />
        <WpcDrift kind="ember" duration={15} />
      </div>
    )
  }
  if (skin === 'noir') {
    return (
      <div className="rain-field" aria-hidden="true">
        <WpcDrift kind="rain-drop" duration={0.85} />
      </div>
    )
  }
  if (skin === 'youth') {
    return (
      <div className="drift-field" aria-hidden="true">
        <i className="warm-haze" />
        <WpcDrift kind="leaf-live" duration={13} />
      </div>
    )
  }
  if (skin === 'fleet') return <WpcWaves />
  if (skin === 'manga') {
    return (
      <div className="ink-field" aria-hidden="true">
        <i className="ink-bloom" style={{ left: '8%', top: '18%' }} />
        <i className="ink-bloom" style={{ right: '6%', top: '46%', animationDelay: '-6s' }} />
        <i className="ink-stroke" style={{ top: '22%' }} />
        <i className="ink-stroke" style={{ top: '58%', animationDelay: '-5s' }} />
        <WpcDrift kind="ink-drop" duration={11} />
      </div>
    )
  }
  if (skin === 'mecha') return <WpcBolts />
  return (
    <div className="drift-field" aria-hidden="true">
      <WpcDrift kind="mote" duration={13} />
    </div>
  )
}
