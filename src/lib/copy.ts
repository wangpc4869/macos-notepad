import type { WpcAsset, WpcCategory, WpcMood, WpcPage, WpcVault, WpcWeather } from '../../shared/types'
import type { WpcNote } from '../../shared/types'

export interface WpcJump {
  page: WpcPage
  id: string
  nonce: number
}

export const wpc_pageMeta: { id: WpcPage; label: string; kicker: string; hint: string }[] = [
  { id: 'today', label: '今日', kicker: 'TODAY', hint: '一天的入口' },
  { id: 'notes', label: '笔记', kicker: 'NOTES', hint: '工作与灵感' },
  { id: 'diary', label: '日记', kicker: 'DIARY', hint: '心情与日常' },
  { id: 'time', label: '时光', kicker: 'HOURS', hint: '专注与记录' },
  { id: 'journey', label: '行迹', kicker: 'JOURNEY', hint: '出行与风景' },
  { id: 'library', label: '素材', kicker: 'ARCHIVE', hint: '图片与附件' },
]

export const wpc_categoryLabel: Record<WpcCategory, string> = {
  work: '工作',
  study: '研习',
  life: '生活',
  travel: '行旅',
  rest: '休整',
}

export const wpc_categoryColor: Record<WpcCategory, string> = {
  work: '#f0b35a',
  study: '#b3a6ff',
  life: '#f2a4c0',
  travel: '#8fd0c6',
  rest: '#93a9d4',
}

export const wpc_moodLabel: Record<WpcMood, string> = {
  clear: '澄',
  joy: '悦',
  focus: '定',
  tired: '倦',
  blue: '郁',
  spark: '跃',
}

export const wpc_weatherLabel: Record<WpcWeather, string> = {
  sun: '晴',
  cloud: '阴',
  rain: '雨',
  snow: '雪',
  night: '夜',
}

export const wpc_categories: WpcCategory[] = ['work', 'study', 'life', 'travel', 'rest']
export const wpc_moods: WpcMood[] = ['clear', 'joy', 'focus', 'spark', 'tired', 'blue']
export const wpc_weathers: WpcWeather[] = ['sun', 'cloud', 'rain', 'snow', 'night']

/**
 * 去掉标记，留下能读的一句。
 */
const wpc_plain = (text: string): string =>
  text
    .replace(/!\[[^\]]*\]\(asset:[^)]+\)/g, '图片')
    .replace(/[#>*`]/g, ' ')
    .replace(/\[[ xX]\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * 正文收成列表里的一行摘要。
 */
export const wpc_excerpt = (text: string, max = 46): string => {
  const plain = wpc_plain(text)
  if (!plain) return '还没有正文'
  return plain.length > max ? `${plain.slice(0, max)}…` : plain
}

/**
 * 列表摘要。正文开头如果就是标题，不再重复一遍。
 */
export const wpc_listExcerpt = (title: string, content: string, max = 46): string => {
  let plain = wpc_plain(content)
  const name = title.trim()
  if (name && plain.startsWith(name)) plain = plain.slice(name.length).replace(/^[\s,，。:：·-]+/, '')
  if (!plain) return ''
  return plain.length > max ? `${plain.slice(0, max)}…` : plain
}

/**
 * 一张图被哪些记录用着。
 */
export const wpc_assetUsage = (vault: WpcVault, id: string): string[] => {
  const usage: string[] = []
  for (const note of vault.notes) {
    if (note.imageIds.includes(id) || note.content.includes(`asset:${id}`)) usage.push(note.title.trim() || '无题笔记')
  }
  for (const diary of vault.diaries) {
    if (diary.imageIds.includes(id)) usage.push(diary.title.trim() || diary.date)
  }
  for (const album of vault.albums) {
    if (album.coverImageId === id || album.photos.some((photo) => photo.imageId === id)) {
      usage.push(album.title.trim() || '未命名行迹')
    }
  }
  return usage
}

/**
 * 笔记导出成 Markdown，图片指向 data/media。
 */
export const wpc_noteMarkdown = (note: WpcNote, assets: WpcAsset[]): string => {
  const body = note.content.replace(/\(asset:([a-zA-Z0-9-]+)\)/g, (_match, id: string) => {
    const asset = assets.find((item) => item.id === id)
    return asset ? `(../media/${asset.id}${asset.ext})` : `(asset:${id})`
  })
  if (body.startsWith('# ')) return `${body.trim()}\n`
  return `# ${note.title.trim() || '无题'}\n\n${body.trim()}\n`
}
