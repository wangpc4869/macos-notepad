import type { WpcPage, WpcVault } from '../../shared/types'
import { wpc_excerpt } from './copy'

export interface WpcSearchHit {
  page: WpcPage
  id: string
  kind: string
  title: string
  excerpt: string
}

/**
 * 在笔记、日记、时光和行迹里查找。空关键词时给出最近笔记。
 */
export const wpc_search = (vault: WpcVault, query: string): WpcSearchHit[] => {
  const needle = query.trim().toLowerCase()
  if (!needle) {
    return [...vault.notes]
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, 6)
      .map((note) => ({
        page: 'notes' as const,
        id: note.id,
        kind: '笔记',
        title: note.title.trim() || '无题',
        excerpt: wpc_excerpt(note.content),
      }))
  }
  const hits: WpcSearchHit[] = []
  const hit = (parts: string[]): boolean => parts.join('\n').toLowerCase().includes(needle)
  for (const note of vault.notes) {
    if (!hit([note.title, note.content, note.tags.join(' ')])) continue
    hits.push({ page: 'notes', id: note.id, kind: '笔记', title: note.title.trim() || '无题', excerpt: wpc_excerpt(note.content) })
  }
  for (const diary of vault.diaries) {
    if (!hit([diary.title, diary.content, diary.place, diary.date])) continue
    hits.push({
      page: 'diary',
      id: diary.id,
      kind: '日记',
      title: diary.title.trim() || diary.date,
      excerpt: wpc_excerpt(diary.content),
    })
  }
  for (const entry of vault.times) {
    if (!hit([entry.title, entry.detail, entry.category])) continue
    hits.push({ page: 'time', id: entry.id, kind: '时光', title: entry.title, excerpt: wpc_excerpt(entry.detail) })
  }
  for (const album of vault.albums) {
    if (!hit([album.title, album.place, album.story, album.date])) continue
    hits.push({
      page: 'journey',
      id: album.id,
      kind: '行迹',
      title: album.title.trim() || '未命名行迹',
      excerpt: wpc_excerpt(album.story || album.place),
    })
  }
  return hits.slice(0, 40)
}
