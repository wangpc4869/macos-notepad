import type {
  WpcAlbum,
  WpcAsset,
  WpcCategory,
  WpcDiary,
  WpcFolder,
  WpcMood,
  WpcNote,
  WpcSkin,
  WpcTimeEntry,
  WpcVault,
  WpcWeather,
} from './types'

export const wpc_appName = '星笺'
export const wpc_packageName = 'hoshisen'
export const wpc_appVersion = '1.0.0'

const wpc_moods: WpcMood[] = ['clear', 'joy', 'focus', 'tired', 'blue', 'spark']
const wpc_weathers: WpcWeather[] = ['sun', 'cloud', 'rain', 'snow', 'night']
const wpc_categories: WpcCategory[] = ['work', 'study', 'life', 'travel', 'rest']

/**
 * 认出手稿里的皮肤。认不出时用晴窗。
 */
const wpc_skinIds: WpcSkin[] = ['aria', 'sakura', 'tide', 'night', 'noir', 'hush', 'youth', 'fleet', 'manga', 'mecha']

export const wpc_readSkin = (value: unknown): WpcSkin =>
  wpc_skinIds.find((item) => item === value) ?? 'aria'

/**
 * 生成本地记录主键。
 */
export const wpc_createId = (): string => crypto.randomUUID()

/**
 * 把日期收成当地的 YYYY-MM-DD。
 */
export const wpc_dateKey = (date: Date): string => {
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/**
 * 生成导出文件用的时间戳。
 */
export const wpc_fileStamp = (date: Date): string => {
  const pad = (value: number): string => `${value}`.padStart(2, '0')
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}

/**
 * 去掉文件名里不能落盘的字符。
 */
export const wpc_safeFileName = (name: string): string => {
  const cleaned = name.replace(/[\\/:*?"<>|]/g, ' ').trim().slice(0, 40)
  return cleaned || '未命名'
}

/**
 * 默认的三本文集。
 */
export const wpc_defaultFolders = (): WpcFolder[] => [
  { id: 'folder-inbox', name: '收集箱', order: 0 },
  { id: 'folder-work', name: '工作', order: 1 },
  { id: 'folder-life', name: '生活', order: 2 },
]

/**
 * 按钟点猜一个天气印章，用户之后还能改。
 */
export const wpc_guessWeather = (date: Date): WpcWeather => {
  const hour = date.getHours()
  if (hour >= 19 || hour < 5) return 'night'
  return 'sun'
}

/**
 * 找出还没收尾的时段。
 */
export const wpc_runningEntry = (entries: WpcTimeEntry[]): WpcTimeEntry | null =>
  entries.find((entry) => entry.endedAt === null) ?? null

/**
 * 第一次打开时的空白手帐，附一页用法。
 */
export const wpc_createDefaultVault = (): WpcVault => {
  const now = new Date().toISOString()
  return {
    version: 1,
    profile: {
      displayName: '旅人',
      bornAt: now,
      skin: 'aria',
    },
    folders: wpc_defaultFolders(),
    notes: [
      {
        id: 'note-welcome',
        title: '欢迎来到星笺',
        folderId: 'folder-inbox',
        tags: ['入门'],
        imageIds: [],
        pinned: true,
        createdAt: now,
        updatedAt: now,
        content: [
          '# 欢迎来到星笺',
          '',
          '这册放在案头。工作的时段、生活的句子、路上的风景，都写在同一处。',
          '',
          '## 今天可以先做',
          '',
          '- [ ] 把称呼改成自己的名字',
          '- [ ] 记一笔正在做的事',
          '- [ ] 给今天留一段日记',
          '',
          '图片和文字都在项目里的 data 目录。删掉整个项目文件夹，客户端和手稿会一起离开。',
          '',
          '> 灯还亮着，就从这一页开始。',
        ].join('\n'),
      },
    ],
    diaries: [],
    times: [],
    albums: [],
    assets: [],
  }
}

/**
 * 判断心情值是否合法。
 */
const wpc_asMood = (value: unknown): WpcMood =>
  typeof value === 'string' && (wpc_moods as string[]).includes(value) ? (value as WpcMood) : 'clear'

/**
 * 判断天气值是否合法。
 */
const wpc_asWeather = (value: unknown): WpcWeather =>
  typeof value === 'string' && (wpc_weathers as string[]).includes(value) ? (value as WpcWeather) : 'sun'

/**
 * 判断时段分类是否合法。
 */
const wpc_asCategory = (value: unknown): WpcCategory =>
  typeof value === 'string' && (wpc_categories as string[]).includes(value) ? (value as WpcCategory) : 'work'

/**
 * 收成字符串数组。
 */
const wpc_asStrings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

/**
 * 把文集整理成可写的形状。
 */
const wpc_tidyFolder = (value: unknown): WpcFolder | null => {
  if (!value || typeof value !== 'object') return null
  const folder = value as WpcFolder
  if (typeof folder.id !== 'string' || typeof folder.name !== 'string') return null
  return {
    id: folder.id,
    name: folder.name.trim().slice(0, 16) || '未命名',
    order: typeof folder.order === 'number' ? folder.order : 0,
  }
}

/**
 * 把笔记整理成可写的形状。
 */
const wpc_tidyNote = (value: unknown): WpcNote | null => {
  if (!value || typeof value !== 'object') return null
  const note = value as WpcNote
  if (typeof note.id !== 'string' || typeof note.title !== 'string' || typeof note.content !== 'string') return null
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    folderId: typeof note.folderId === 'string' ? note.folderId : 'folder-inbox',
    tags: wpc_asStrings(note.tags).slice(0, 12),
    imageIds: wpc_asStrings(note.imageIds),
    pinned: Boolean(note.pinned),
    createdAt: typeof note.createdAt === 'string' ? note.createdAt : new Date().toISOString(),
    updatedAt: typeof note.updatedAt === 'string' ? note.updatedAt : new Date().toISOString(),
  }
}

/**
 * 把日记整理成可写的形状。
 */
const wpc_tidyDiary = (value: unknown): WpcDiary | null => {
  if (!value || typeof value !== 'object') return null
  const diary = value as WpcDiary
  if (typeof diary.id !== 'string' || typeof diary.content !== 'string') return null
  return {
    id: diary.id,
    date: typeof diary.date === 'string' ? diary.date : wpc_dateKey(new Date()),
    title: typeof diary.title === 'string' ? diary.title : '',
    content: diary.content,
    place: typeof diary.place === 'string' ? diary.place : '',
    mood: wpc_asMood(diary.mood),
    weather: wpc_asWeather(diary.weather),
    imageIds: wpc_asStrings(diary.imageIds),
    createdAt: typeof diary.createdAt === 'string' ? diary.createdAt : new Date().toISOString(),
    updatedAt: typeof diary.updatedAt === 'string' ? diary.updatedAt : new Date().toISOString(),
  }
}

/**
 * 把时段整理成可写的形状，并只保留一段进行中的记录。
 */
const wpc_tidyTimes = (value: unknown): WpcTimeEntry[] => {
  if (!Array.isArray(value)) return []
  const entries = value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const entry = item as WpcTimeEntry
    if (typeof entry.id !== 'string' || typeof entry.startedAt !== 'string') return []
    return [{
      id: entry.id,
      title: typeof entry.title === 'string' && entry.title.trim() ? entry.title : '未命名时段',
      category: wpc_asCategory(entry.category),
      detail: typeof entry.detail === 'string' ? entry.detail : '',
      startedAt: entry.startedAt,
      endedAt: typeof entry.endedAt === 'string' ? entry.endedAt : null,
      targetMin: typeof entry.targetMin === 'number' ? entry.targetMin : null,
    }]
  })
  const open = entries
    .filter((entry) => entry.endedAt === null)
    .sort((left, right) => right.startedAt.localeCompare(left.startedAt))
  const keepId = open[0]?.id
  return entries.map((entry) => {
    if (entry.endedAt !== null || entry.id === keepId) return entry
    return { ...entry, endedAt: entry.startedAt }
  })
}

/**
 * 把行迹整理成可写的形状。
 */
const wpc_tidyAlbum = (value: unknown): WpcAlbum | null => {
  if (!value || typeof value !== 'object') return null
  const album = value as WpcAlbum
  if (typeof album.id !== 'string' || typeof album.title !== 'string') return null
  const photos = Array.isArray(album.photos)
    ? album.photos.flatMap((photo) => {
        if (!photo || typeof photo !== 'object') return []
        if (typeof photo.id !== 'string' || typeof photo.imageId !== 'string') return []
        return [{ id: photo.id, imageId: photo.imageId, caption: typeof photo.caption === 'string' ? photo.caption : '' }]
      })
    : []
  return {
    id: album.id,
    title: album.title,
    place: typeof album.place === 'string' ? album.place : '',
    date: typeof album.date === 'string' ? album.date : wpc_dateKey(new Date()),
    story: typeof album.story === 'string' ? album.story : '',
    coverImageId: typeof album.coverImageId === 'string' && photos.some((photo) => photo.imageId === album.coverImageId)
      ? album.coverImageId
      : photos[0]?.imageId ?? null,
    photos,
    createdAt: typeof album.createdAt === 'string' ? album.createdAt : new Date().toISOString(),
    updatedAt: typeof album.updatedAt === 'string' ? album.updatedAt : new Date().toISOString(),
  }
}

/**
 * 把素材登记整理成可写的形状。
 */
const wpc_tidyAsset = (value: unknown): WpcAsset | null => {
  if (!value || typeof value !== 'object') return null
  const asset = value as WpcAsset
  if (typeof asset.id !== 'string' || typeof asset.ext !== 'string' || typeof asset.mime !== 'string') return null
  return {
    id: asset.id,
    fileName: typeof asset.fileName === 'string' ? asset.fileName : '图片',
    mime: asset.mime,
    ext: asset.ext,
    bytes: typeof asset.bytes === 'number' ? asset.bytes : 0,
    createdAt: typeof asset.createdAt === 'string' ? asset.createdAt : new Date().toISOString(),
  }
}

/**
 * 把磁盘上的手稿收成稳定结构。读不懂时返回空。
 */
export const wpc_normalizeVault = (value: unknown): WpcVault | null => {
  if (!value || typeof value !== 'object') return null
  const raw = value as Partial<WpcVault>
  if (raw.version !== 1) return null
  const folders = Array.isArray(raw.folders) ? raw.folders.flatMap((item) => {
    const folder = wpc_tidyFolder(item)
    return folder ? [folder] : []
  }) : []
  const bornAt = typeof raw.profile?.bornAt === 'string' ? raw.profile.bornAt : new Date().toISOString()
  const displayName = typeof raw.profile?.displayName === 'string'
    ? raw.profile.displayName.replace(/\s+/g, ' ').trim().slice(0, 16)
    : ''
  return {
    version: 1,
    profile: {
      displayName,
      bornAt,
      skin: wpc_readSkin(raw.profile?.skin),
    },
    folders: folders.length > 0 ? folders : wpc_defaultFolders(),
    notes: Array.isArray(raw.notes) ? raw.notes.flatMap((item) => {
      const note = wpc_tidyNote(item)
      return note ? [note] : []
    }) : [],
    diaries: Array.isArray(raw.diaries) ? raw.diaries.flatMap((item) => {
      const diary = wpc_tidyDiary(item)
      return diary ? [diary] : []
    }) : [],
    times: wpc_tidyTimes(raw.times),
    albums: Array.isArray(raw.albums) ? raw.albums.flatMap((item) => {
      const album = wpc_tidyAlbum(item)
      return album ? [album] : []
    }) : [],
    assets: Array.isArray(raw.assets) ? raw.assets.flatMap((item) => {
      const asset = wpc_tidyAsset(item)
      return asset ? [asset] : []
    }) : [],
  }
}

/**
 * 从正文、日记和行迹里拿掉一张图，并删掉登记。
 */
export const wpc_withoutAsset = (vault: WpcVault, id: string): WpcVault => {
  const clean = (text: string): string =>
    text
      .split('\n')
      .filter((line) => !line.includes(`asset:${id}`))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  return {
    ...vault,
    assets: vault.assets.filter((asset) => asset.id !== id),
    notes: vault.notes.map((note) => ({
      ...note,
      content: clean(note.content),
      imageIds: note.imageIds.filter((imageId) => imageId !== id),
    })),
    diaries: vault.diaries.map((diary) => ({
      ...diary,
      content: clean(diary.content),
      imageIds: diary.imageIds.filter((imageId) => imageId !== id),
    })),
    albums: vault.albums.map((album) => ({
      ...album,
      coverImageId: album.coverImageId === id ? album.photos.find((photo) => photo.imageId !== id)?.imageId ?? null : album.coverImageId,
      photos: album.photos.filter((photo) => photo.imageId !== id),
    })),
  }
}
