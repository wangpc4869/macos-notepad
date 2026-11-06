import { spawn } from 'node:child_process'
import { app, BrowserWindow, dialog, ipcMain, Menu, protocol, session, shell } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { wpc_appName, wpc_normalizeVault, wpc_packageName } from '../shared/pure'
import type { WpcAssetInput } from '../shared/types'
import {
  wpc_backupVault,
  wpc_dataRoot,
  wpc_openVault,
  wpc_readVault,
  wpc_removeMediaFile,
  wpc_saveAssetFile,
  wpc_vaultPath,
  wpc_writeExport,
  wpc_writeVault,
} from '../shared/vault'

let projectRoot = ''
let mainWindow: BrowserWindow | null = null

/**
 * 安装包里的页面和定位程序放在 Resources，不跟开发目录绑在一起。
 */
const wpc_resourceRoot = (): string => (app.isPackaged ? process.resourcesPath : projectRoot)

/**
 * 安装版把手稿放进「应用程序支持」，开发版仍留在项目的 data 里。
 */
const wpc_packagedHome = (): string => path.join(app.getPath('appData'), wpc_appName)

/**
 * 从当前目录或应用包向上找到星笺项目，手稿必须留在项目里。
 */
const wpc_findProjectRoot = (): string | null => {
  const seeds = [process.env.HOSHISEN_ROOT, process.cwd(), path.dirname(process.execPath)].filter(
    (item): item is string => Boolean(item),
  )
  for (const seed of seeds) {
    let dir = path.resolve(seed)
    for (let depth = 0; depth < 8; depth += 1) {
      const pkgPath = path.join(dir, 'package.json')
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as { name?: string }
          if (pkg.name === wpc_packageName) return dir
        } catch {
          // 继续向上找
        }
      }
      const parent = path.dirname(dir)
      if (parent === dir) break
      dir = parent
    }
  }
  return null
}

/**
 * 页面文件的类型。
 */
const wpc_mime = (file: string): string => {
  const table: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
  }
  return table[path.extname(file).toLowerCase()] ?? 'application/octet-stream'
}

/**
 * 用自定义协议把打包后的页面交给窗口，这样系统定位才可用。
 */
const wpc_handleApp = (request: Request): Response => {
  try {
    const url = new URL(request.url)
    const rel = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html'
    const root = path.resolve(wpc_resourceRoot(), 'dist')
    const file = path.resolve(root, rel)
    if (file !== root && !file.startsWith(`${root}${path.sep}`)) return new Response('no', { status: 403 })
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return new Response('no', { status: 404 })
    return new Response(new Uint8Array(fs.readFileSync(file)), {
      headers: { 'content-type': wpc_mime(file) },
    })
  } catch {
    return new Response('no', { status: 500 })
  }
}

/**
 * 用自定义协议把 data/media 里的图片交给页面。
 */
const wpc_handleMedia = (request: Request): Response => {
  try {
    const url = new URL(request.url)
    const id = decodeURIComponent(url.pathname.replace(/^\//, ''))
    if (!/^[a-zA-Z0-9-]+$/.test(id)) return new Response('no', { status: 404 })
    const vault = wpc_readVault(projectRoot)
    const asset = vault.assets.find((item) => item.id === id)
    if (!asset) return new Response('no', { status: 404 })
    const file = path.join(wpc_dataRoot(projectRoot), 'media', `${asset.id}${asset.ext}`)
    if (!fs.existsSync(file)) return new Response('no', { status: 404 })
    return new Response(new Uint8Array(fs.readFileSync(file)), {
      headers: { 'content-type': asset.mime, 'cache-control': 'public, max-age=86400' },
    })
  } catch {
    return new Response('no', { status: 500 })
  }
}

/**
 * 页面和图片走同一个协议，按主机名分开。
 */
const wpc_handleProtocol = (request: Request): Response => {
  const host = new URL(request.url).hostname
  if (host === 'app') return wpc_handleApp(request)
  return wpc_handleMedia(request)
}

type WpcLocateResult =
  | { ok: true; latitude: number; longitude: number }
  | { ok: false; reason: 'denied' | 'unavailable' }

let wpc_locateTask: Promise<WpcLocateResult> | null = null

/**
 * 向系统要一次当前位置。页面里的定位接口在这台电脑上会超时。
 */
const wpc_locateOnce = (): Promise<WpcLocateResult> => {
  if (wpc_locateTask) return wpc_locateTask
  const task = new Promise<WpcLocateResult>((resolve) => {
    const bin = path.join(wpc_resourceRoot(), app.isPackaged ? 'LocationHelper.app' : 'build/LocationHelper.app', 'Contents', 'MacOS', 'location')
    if (!projectRoot || !fs.existsSync(bin)) {
      resolve({ ok: false, reason: 'unavailable' })
      return
    }
    const child = spawn(bin, [], { stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      resolve({ ok: false, reason: 'unavailable' })
    }, 28000)
    child.stdout.on('data', (chunk: Buffer) => {
      out += chunk.toString()
    })
    child.stderr.on('data', (chunk: Buffer) => {
      err += chunk.toString()
    })
    child.on('close', () => {
      clearTimeout(timer)
      if (err.includes('denied')) {
        resolve({ ok: false, reason: 'denied' })
        return
      }
      const matched = out.trim().match(/(-?\d+\.\d+),(-?\d+\.\d+)/)
      if (!matched) {
        resolve({ ok: false, reason: 'unavailable' })
        return
      }
      resolve({ ok: true, latitude: Number(matched[1]), longitude: Number(matched[2]) })
    })
    child.on('error', () => {
      clearTimeout(timer)
      resolve({ ok: false, reason: 'unavailable' })
    })
  }).finally(() => {
    wpc_locateTask = null
  })
  wpc_locateTask = task
  return task
}

/**
 * 允许系统定位，用来显示所在城市的天气。
 */
const wpc_allowLocation = (): void => {
  const wpc_isGeo = (permission: string): boolean => permission === 'geolocation' || permission === 'geolocation-approximate'
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => wpc_isGeo(permission))
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(wpc_isGeo(permission))
  })
}

/**
 * 注册页面可以调用的本地能力。
 */
const wpc_bindIpc = (): void => {
  ipcMain.handle('vault:load', () => wpc_openVault(projectRoot))
  ipcMain.handle('vault:save', (_event, payload: unknown) => {
    const vault = wpc_normalizeVault(payload)
    if (!vault) return { ok: false, message: '手稿格式不对' }
    wpc_writeVault(projectRoot, vault)
    return { ok: true }
  })
  ipcMain.on('vault:save-now', (event, payload: unknown) => {
    try {
      const vault = wpc_normalizeVault(payload)
      if (!vault) throw new Error('手稿格式不对')
      wpc_writeVault(projectRoot, vault)
      event.returnValue = { ok: true }
    } catch (error) {
      event.returnValue = { ok: false, message: error instanceof Error ? error.message : '保存失败' }
    }
  })
  ipcMain.handle('asset:save', (_event, payload: unknown) => {
    const input = payload as WpcAssetInput
    if (!input || typeof input.base64 !== 'string' || typeof input.mime !== 'string') {
      throw new Error('图片没有送来')
    }
    return wpc_saveAssetFile(projectRoot, { ...input, name: typeof input.name === 'string' ? input.name : '图片' })
  })
  ipcMain.handle('asset:delete', (_event, id: unknown) => {
    if (typeof id !== 'string') throw new Error('无效素材')
    wpc_removeMediaFile(projectRoot, id)
    return { ok: true }
  })
  ipcMain.handle('vault:backup', () => ({ path: wpc_backupVault(projectRoot) }))
  ipcMain.handle('vault:reveal', () => {
    const target = wpc_vaultPath(projectRoot)
    shell.showItemInFolder(target)
    return { path: target }
  })
  ipcMain.handle('vault:root', () => ({ path: wpc_dataRoot(projectRoot) }))
  ipcMain.handle('location:get', () => wpc_locateOnce())
  ipcMain.handle('vault:export', (_event, payload: unknown) => {
    const body = payload as { title?: string; content?: string }
    if (!body || typeof body.content !== 'string') throw new Error('没有可导出的正文')
    return { path: wpc_writeExport(projectRoot, body.title ?? '未命名', body.content) }
  })
}

/**
 * 菜单保留拷贝粘贴，并把关于入口交回页面。
 */
const wpc_createMenu = (): void => {
  const menu = Menu.buildFromTemplate([
    {
      label: wpc_appName,
      submenu: [
        {
          label: '关于星笺',
          click: () => mainWindow?.webContents.send('menu:sheet'),
        },
        {
          label: '显示手稿',
          click: () => shell.showItemInFolder(wpc_vaultPath(projectRoot)),
        },
        { type: 'separator' },
        { role: 'quit', label: '退出星笺' },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '拷贝' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' },
      ],
    },
    {
      label: '窗口',
      submenu: [
        { role: 'minimize', label: '最小化' },
        { role: 'zoom', label: '缩放' },
        { role: 'close', label: '关闭窗口' },
      ],
    },
  ])
  Menu.setApplicationMenu(menu)
}

/**
 * 打开主窗口。
 */
const wpc_createWindow = (): void => {
  const dev = process.env.HOSHISEN_DEV === '1'
  const electronDir = __dirname
  const icon = path.join(projectRoot, 'build', 'icon.png')
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1120,
    minHeight: 720,
    show: false,
    title: wpc_appName,
    backgroundColor: '#e7f3ff',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 18, y: 18 },
    icon: fs.existsSync(icon) ? icon : undefined,
    webPreferences: {
      preload: path.join(electronDir, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  })
  mainWindow = win
  win.once('ready-to-show', () => win.show())
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('http://127.0.0.1:5173') || url.startsWith('hoshisen://app/')) return
    event.preventDefault()
  })
  if (dev) {
    void win.loadURL('http://127.0.0.1:5173')
  } else {
    void win.loadURL('hoshisen://app/index.html')
  }
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null
  })
}

app.setName(wpc_appName)

if (app.isPackaged) {
  app.setPath('userData', path.join(wpc_packagedHome(), 'data', 'runtime'))
} else {
  const earlyRoot = wpc_findProjectRoot()
  if (earlyRoot) app.setPath('userData', path.join(earlyRoot, 'data', 'runtime'))
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'hoshisen',
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true },
  },
])

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })
  void app.whenReady().then(() => {
    if (app.isPackaged) {
      projectRoot = wpc_packagedHome()
      fs.mkdirSync(path.join(projectRoot, 'data'), { recursive: true })
    } else {
      const found = wpc_findProjectRoot()
      if (!found) {
        dialog.showErrorBox(wpc_appName, '没有找到项目目录。请从项目里打开星笺，手稿会留在项目的 data 文件夹中。')
        app.quit()
        return
      }
      projectRoot = found
    }
    protocol.handle('hoshisen', wpc_handleProtocol)
    wpc_allowLocation()
    wpc_bindIpc()
    wpc_createMenu()
    wpc_createWindow()
  })
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && projectRoot) wpc_createWindow()
  })
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
