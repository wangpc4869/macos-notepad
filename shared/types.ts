export type WpcPage = 'today' | 'notes' | 'diary' | 'time' | 'journey' | 'library'

export type WpcMood = 'clear' | 'joy' | 'focus' | 'tired' | 'blue' | 'spark'

export type WpcWeather = 'sun' | 'cloud' | 'rain' | 'snow' | 'night'

export type WpcCategory = 'work' | 'study' | 'life' | 'travel' | 'rest'

export interface WpcFolder {
  id: string
  name: string
  order: number
}

export interface WpcNote {
  id: string
  title: string
  content: string
  folderId: string
  tags: string[]
  imageIds: string[]
  pinned: boolean
  createdAt: string
  updatedAt: string
}

export interface WpcDiary {
  id: string
  date: string
  title: string
  content: string
  place: string
  mood: WpcMood
  weather: WpcWeather
  imageIds: string[]
  createdAt: string
  updatedAt: string
}

export interface WpcTimeEntry {
  id: string
  title: string
  category: WpcCategory
  detail: string
  startedAt: string
  endedAt: string | null
  targetMin: number | null
}

export interface WpcPhoto {
  id: string
  imageId: string
  caption: string
}

export interface WpcAlbum {
  id: string
  title: string
  place: string
  date: string
  story: string
  coverImageId: string | null
  photos: WpcPhoto[]
  createdAt: string
  updatedAt: string
}

export interface WpcAsset {
  id: string
  fileName: string
  mime: string
  ext: string
  bytes: number
  createdAt: string
}

export type WpcSkin = 'aria' | 'sakura' | 'tide' | 'night' | 'noir' | 'youth' | 'fleet' | 'manga' | 'mecha'

export interface WpcProfile {
  displayName: string
  bornAt: string
  skin: WpcSkin
}

export interface WpcVault {
  version: 1
  profile: WpcProfile
  folders: WpcFolder[]
  notes: WpcNote[]
  diaries: WpcDiary[]
  times: WpcTimeEntry[]
  albums: WpcAlbum[]
  assets: WpcAsset[]
}

export interface WpcAssetInput {
  name: string
  mime: string
  base64: string
}
