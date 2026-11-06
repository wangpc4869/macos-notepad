import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { wpc_createDefaultVault, wpc_createId, wpc_fileStamp, wpc_normalizeVault, wpc_safeFileName } from './pure'
import type { WpcAsset, WpcAssetInput, WpcVault } from './types'

const wpc_mimeExt: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

/**
 * 项目里的手稿根目录。
 */
export const wpc_dataRoot = (projectRoot: string): string => path.join(projectRoot, 'data')

/**
 * 手稿主文件。
 */
export const wpc_vaultPath = (projectRoot: string): string => path.join(wpc_dataRoot(projectRoot), 'vault.json')

/**
 * 准备 data 下的目录。
 */
export const wpc_ensureDirs = (projectRoot: string): void => {
  for (const folder of ['media', 'backups', 'exports']) {
    fs.mkdirSync(path.join(wpc_dataRoot(projectRoot), folder), { recursive: true })
  }
}

/**
 * 原子写入手稿，避免写到一半断电损坏。
 */
export const wpc_writeVault = (projectRoot: string, vault: WpcVault): void => {
  const clean = wpc_normalizeVault(vault)
  if (!clean) throw new Error('手稿格式不对')
  wpc_ensureDirs(projectRoot)
  const file = wpc_vaultPath(projectRoot)
  const tmp = `${file}.tmp`
  fs.writeFileSync(tmp, `${JSON.stringify(clean, null, 2)}\n`, 'utf8')
  fs.renameSync(tmp, file)
}

/**
 * 只读手稿，不改文件。
 */
export const wpc_readVault = (projectRoot: string): WpcVault => {
  const raw = fs.readFileSync(wpc_vaultPath(projectRoot), 'utf8')
  const vault = wpc_normalizeVault(JSON.parse(raw) as unknown)
  if (!vault) throw new Error('手稿格式不对')
  return vault
}

/**
 * 打开手稿。没有文件就新建；损坏则另存后重开一册。
 */
export const wpc_openVault = (projectRoot: string): { vault: WpcVault; recovered: boolean } => {
  wpc_ensureDirs(projectRoot)
  const file = wpc_vaultPath(projectRoot)
  if (!fs.existsSync(file)) {
    const vault = wpc_createDefaultVault()
    wpc_writeVault(projectRoot, vault)
    return { vault, recovered: false }
  }
  try {
    return { vault: wpc_readVault(projectRoot), recovered: false }
  } catch {
    const raw = fs.readFileSync(file, 'utf8')
    const backup = path.join(wpc_dataRoot(projectRoot), 'backups', `broken-${Date.now()}.json`)
    fs.writeFileSync(backup, raw)
    const vault = wpc_createDefaultVault()
    wpc_writeVault(projectRoot, vault)
    return { vault, recovered: true }
  }
}

/**
 * 复制一份带时间的手稿备份，只保留最近 12 份。
 */
export const wpc_backupVault = (projectRoot: string): string => {
  wpc_ensureDirs(projectRoot)
  const source = wpc_vaultPath(projectRoot)
  if (!fs.existsSync(source)) throw new Error('还没有手稿')
  const target = path.join(wpc_dataRoot(projectRoot), 'backups', `vault-${wpc_fileStamp(new Date())}.json`)
  fs.copyFileSync(source, target)
  const folder = path.join(wpc_dataRoot(projectRoot), 'backups')
  const names = fs.readdirSync(folder).filter((name) => name.startsWith('vault-') && name.endsWith('.json')).sort()
  while (names.length > 12) {
    const oldest = names.shift()
    if (oldest) fs.rmSync(path.join(folder, oldest))
  }
  return target
}

/**
 * 把一篇文字导出到 data/exports。
 */
export const wpc_writeExport = (projectRoot: string, title: string, content: string): string => {
  wpc_ensureDirs(projectRoot)
  const file = path.join(wpc_dataRoot(projectRoot), 'exports', `${wpc_safeFileName(title)}-${wpc_fileStamp(new Date())}.md`)
  fs.writeFileSync(file, content, 'utf8')
  return file
}

/**
 * 保存一张图片到 data/media，不改手稿正文。
 */
export const wpc_saveAssetFile = (projectRoot: string, input: WpcAssetInput): WpcAsset => {
  const ext = wpc_mimeExt[input.mime]
  if (!ext) throw new Error('请使用 JPG、PNG、WebP 或 GIF')
  const payload = input.base64.includes(',') ? input.base64.slice(input.base64.indexOf(',') + 1) : input.base64
  const buffer = Buffer.from(payload, 'base64')
  if (buffer.length < 32) throw new Error('图片是空的')
  if (buffer.length > 8 * 1024 * 1024) throw new Error('图片请小于 8MB')
  wpc_ensureDirs(projectRoot)
  const asset: WpcAsset = {
    id: wpc_createId(),
    fileName: input.name.replace(/[\\/]/g, ' ').slice(0, 80) || '图片',
    mime: input.mime,
    ext,
    bytes: buffer.length,
    createdAt: new Date().toISOString(),
  }
  fs.writeFileSync(path.join(wpc_dataRoot(projectRoot), 'media', `${asset.id}${asset.ext}`), buffer)
  return asset
}

/**
 * 按编号删除图片文件。
 */
export const wpc_removeMediaFile = (projectRoot: string, id: string): void => {
  if (!/^[a-zA-Z0-9-]+$/.test(id)) throw new Error('无效素材')
  const mediaDir = path.join(wpc_dataRoot(projectRoot), 'media')
  if (!fs.existsSync(mediaDir)) return
  for (const name of fs.readdirSync(mediaDir)) {
    if (name.startsWith(`${id}.`)) fs.rmSync(path.join(mediaDir, name))
  }
}

/**
 * 在访达中定位一个文件。
 */
export const wpc_showInFinder = (target: string): void => {
  if (process.platform !== 'darwin') throw new Error('当前系统无法打开访达')
  const child = spawn('open', ['-R', target], { stdio: 'ignore', detached: true })
  child.unref()
}
