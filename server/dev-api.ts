import type { IncomingMessage, ServerResponse } from 'node:http'
import type { ViteDevServer } from 'vite'
import {
  wpc_backupVault,
  wpc_dataRoot,
  wpc_openVault,
  wpc_readVault,
  wpc_removeMediaFile,
  wpc_saveAssetFile,
  wpc_showInFinder,
  wpc_vaultPath,
  wpc_writeExport,
  wpc_writeVault,
} from '../shared/vault'
import { wpc_normalizeVault } from '../shared/pure'
import type { WpcAssetInput } from '../shared/types'
import fs from 'node:fs'
import path from 'node:path'

/**
 * 读完请求体，并限制体积。
 */
const wpc_readBody = (req: IncomingMessage, limit = 18_000_000): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > limit) {
        reject(new Error('文件太大'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })

/**
 * 回一段 JSON。
 */
const wpc_json = (res: ServerResponse, status: number, payload: unknown): void => {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

/**
 * 开发时给浏览器提供和客户端相同的本地手稿接口。
 */
const wpc_route = async (req: IncomingMessage, res: ServerResponse, projectRoot: string): Promise<void> => {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1')
  const pathname = url.pathname
  if (req.method === 'GET' && pathname === '/api/vault') {
    wpc_json(res, 200, wpc_openVault(projectRoot))
    return
  }
  if (req.method === 'PUT' && pathname === '/api/vault') {
    const vault = wpc_normalizeVault(JSON.parse(await wpc_readBody(req)) as unknown)
    if (!vault) {
      wpc_json(res, 400, { ok: false, message: '手稿格式不对' })
      return
    }
    wpc_writeVault(projectRoot, vault)
    wpc_json(res, 200, { ok: true })
    return
  }
  if (req.method === 'GET' && pathname === '/api/root') {
    wpc_json(res, 200, { path: wpc_dataRoot(projectRoot) })
    return
  }
  if (req.method === 'POST' && pathname === '/api/assets') {
    const input = JSON.parse(await wpc_readBody(req)) as WpcAssetInput
    if (!input || typeof input.base64 !== 'string' || typeof input.mime !== 'string') {
      wpc_json(res, 400, { ok: false, message: '图片没有送来' })
      return
    }
    wpc_json(res, 200, wpc_saveAssetFile(projectRoot, input))
    return
  }
  if (req.method === 'DELETE' && pathname.startsWith('/api/assets/')) {
    wpc_removeMediaFile(projectRoot, decodeURIComponent(pathname.slice('/api/assets/'.length)))
    wpc_json(res, 200, { ok: true })
    return
  }
  if (req.method === 'GET' && pathname.startsWith('/api/media/')) {
    const id = decodeURIComponent(pathname.slice('/api/media/'.length))
    if (!/^[a-zA-Z0-9-]+$/.test(id)) {
      res.statusCode = 404
      res.end('not found')
      return
    }
    const vault = wpc_readVault(projectRoot)
    const asset = vault.assets.find((item) => item.id === id)
    const file = asset ? path.join(wpc_dataRoot(projectRoot), 'media', `${asset.id}${asset.ext}`) : ''
    if (!asset || !file || !fs.existsSync(file)) {
      res.statusCode = 404
      res.end('not found')
      return
    }
    res.statusCode = 200
    res.setHeader('content-type', asset.mime)
    res.setHeader('cache-control', 'public, max-age=86400')
    res.end(fs.readFileSync(file))
    return
  }
  if (req.method === 'POST' && pathname === '/api/backup') {
    wpc_json(res, 200, { path: wpc_backupVault(projectRoot) })
    return
  }
  if (req.method === 'POST' && pathname === '/api/reveal') {
    const target = wpc_vaultPath(projectRoot)
    wpc_showInFinder(target)
    wpc_json(res, 200, { path: target })
    return
  }
  if (req.method === 'POST' && pathname === '/api/export') {
    const body = JSON.parse(await wpc_readBody(req)) as { title?: string; content?: string }
    if (typeof body.content !== 'string') {
      wpc_json(res, 400, { ok: false, message: '没有可导出的正文' })
      return
    }
    wpc_json(res, 200, { path: wpc_writeExport(projectRoot, body.title ?? '未命名', body.content) })
    return
  }
  wpc_json(res, 404, { ok: false, message: '没有这个接口' })
}

/**
 * 挂到 Vite 开发服务器上。
 */
export const wpc_attachDevApi = (server: ViteDevServer, projectRoot: string): void => {
  server.middlewares.use((req, res, next) => {
    const url = req.url ?? ''
    if (!url.startsWith('/api/')) {
      next()
      return
    }
    void wpc_route(req, res, projectRoot).catch((error: unknown) => {
      if (res.headersSent) return
      const message = error instanceof Error ? error.message : '请求失败'
      wpc_json(res, 500, { ok: false, message })
    })
  })
}
