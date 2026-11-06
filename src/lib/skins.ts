import { wpc_readSkin } from '../../shared/pure'
import type { WpcSkin } from '../../shared/types'

export interface WpcSkinMeta {
  id: WpcSkin
  name: string
  line: string
  hello: string
  lines: string[]
  featured: boolean
  stage: string
}

const wpc_skinKey = 'hoshisen.skin'

export const wpc_skinList: WpcSkinMeta[] = [
  {
    id: 'aria',
    name: '晴窗',
    line: '午后的风，亮一点',
    hello: '晴窗铺好了',
    lines: ['窗开着，光就进来了。', '今天的事，可以一件一件放下。', '写下一句，就已经开始了。'],
    featured: true,
    stage: '日常',
  },
  {
    id: 'sakura',
    name: '樱信',
    line: '粉雾与慢慢落下的花',
    hello: '樱信落下来了',
    lines: ['有些日子，适合慢慢写。', '花会落，句子可以留下。', '你已经在这里了，这就很好。'],
    featured: true,
    stage: '日常',
  },
  {
    id: 'tide',
    name: '潮灯',
    line: '海玻璃一样的安静',
    hello: '潮灯安静下来了',
    lines: ['海风很轻，思路也可以很轻。', '先呼吸一下，再写下一行。', '远处的浪，不急着追。'],
    featured: true,
    stage: '日常',
  },
  {
    id: 'night',
    name: '夜笺',
    line: '灯还亮着的夜晚',
    hello: '夜笺点上了',
    lines: ['灯还亮着，就从这一页开始。', '夜里适合把白天没说完的话补上。', '安静一会儿，也算度过。'],
    featured: true,
    stage: '日常',
  },
  {
    id: 'noir',
    name: '工藤新一',
    line: '真相只有一个',
    hello: '工藤新一到了',
    lines: ['把线索按顺序放下。', '雨还在下，答案可以慢慢来。', '这一页，就是今晚的证物。'],
    featured: false,
    stage: '剧场 · 推理',
  },
  {
    id: 'hush',
    name: '毛利兰',
    line: '清水寺世纪之吻',
    hello: '毛利兰到了',
    lines: ['灯只照这一页。', '先别说破，把线索留下。', '今晚的答案，可以晚点揭开。'],
    featured: false,
    stage: '剧场 · 推理',
  },
  {
    id: 'youth',
    name: '春日',
    line: '放学后还没说完的话',
    hello: '春日留住了',
    lines: ['青春不必一下写完。', '傍晚的光，适合把心情摊开。', '没说出口的，可以先记在这里。'],
    featured: false,
    stage: '剧场 · 青春',
  },
  {
    id: 'fleet',
    name: '远航',
    line: '海风、白浪和一盏锚灯',
    hello: '远航启程了',
    lines: ['海面很宽，今天只走一程。', '风从左边来，句子从这里开始。', '靠岸之前，先把今天记下来。'],
    featured: false,
    stage: '剧场 · 远航',
  },
  {
    id: 'manga',
    name: '墨格',
    line: '网点、墨线和一支蘸水笔',
    hello: '墨格铺开了',
    lines: ['这一格，先留白。', '粗线框住的，才是今天。', '写下来，就像翻到下一页。'],
    featured: false,
    stage: '剧场 · 漫画',
  },
  {
    id: 'mecha',
    name: '霆甲',
    line: '雷光从甲缝里亮起来',
    hello: '霆甲启动了',
    lines: ['今天的任务，一格一格推进。', '雷声过去，句子还在。', '装甲合上，就可以出发。'],
    featured: false,
    stage: '剧场 · 机甲',
  },
]

/**
 * 按编号取出一款皮肤。
 */
export const wpc_skinMeta = (id: WpcSkin): WpcSkinMeta => wpc_skinList.find((item) => item.id === id) ?? wpc_skinList[0]

/**
 * 读本机记下的皮肤，给开屏抢在手稿之前用。
 */
export const wpc_storedSkin = (): WpcSkin => {
  try {
    return wpc_readSkin(localStorage.getItem(wpc_skinKey))
  } catch {
    return 'aria'
  }
}

/**
 * 把皮肤铺到窗口上，并记在本机。
 */
export const wpc_applySkin = (id: WpcSkin): void => {
  document.documentElement.dataset.skin = id
  try {
    localStorage.setItem(wpc_skinKey, id)
  } catch {
    /* 手稿里仍会记住 */
  }
}
