import type { WpcAsset, WpcAssetInput, WpcVault } from '../../shared/types'

/**
 * 图片在页面里的地址。客户端走自定义协议，浏览器走本地接口。
 */
export const wpc_mediaUrl = (id: string): string =>
  window.hoshisen ? `hoshisen://media/${id}` : `/api/media/${id}`

/**
 * 把失败响应转成可读错误。
 */
const wpc_reject = async (response: Response, fallback: string): Promise<never> => {
  const payload = (await response.json().catch(() => null)) as { message?: string } | null
  throw new Error(payload?.message || fallback)
}

/**
 * 读入手稿。
 */
export const wpc_loadVault = async (): Promise<{ vault: WpcVault; recovered: boolean }> => {
  if (window.hoshisen) return window.hoshisen.loadVault()
  const response = await fetch('/api/vault')
  if (!response.ok) return wpc_reject(response, '无法读入手稿')
  return response.json() as Promise<{ vault: WpcVault; recovered: boolean }>
}

/**
 * 保存手稿。
 */
export const wpc_saveVault = async (vault: WpcVault): Promise<void> => {
  if (window.hoshisen) {
    const result = await window.hoshisen.saveVault(vault)
    if (!result.ok) throw new Error(result.message)
    return
  }
  const response = await fetch('/api/vault', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(vault),
  })
  if (!response.ok) return wpc_reject(response, '保存失败')
}

/**
 * 在窗口关闭前尽量同步写盘。
 */
export const wpc_saveVaultNow = (vault: WpcVault): { ok: boolean; message?: string } => {
  if (window.hoshisen) return window.hoshisen.saveVaultNow(vault)
  try {
    void fetch('/api/vault', {
      method: 'PUT',
      body: JSON.stringify(vault),
      keepalive: true,
      headers: { 'content-type': 'application/json' },
    })
    return { ok: true }
  } catch {
    return { ok: false, message: '保存失败' }
  }
}

/**
 * 上传一张已经压过的图片。
 */
export const wpc_uploadAsset = async (input: WpcAssetInput): Promise<WpcAsset> => {
  if (window.hoshisen) return window.hoshisen.saveAsset(input)
  const response = await fetch('/api/assets', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) return wpc_reject(response, '图片没有放进来')
  return response.json() as Promise<WpcAsset>
}

/**
 * 删除图片文件。
 */
export const wpc_deleteAssetFile = async (id: string): Promise<void> => {
  if (window.hoshisen) {
    await window.hoshisen.deleteAsset(id)
    return
  }
  const response = await fetch(`/api/assets/${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (!response.ok) return wpc_reject(response, '图片没有删掉')
}

/**
 * 手稿目录的绝对路径。
 */
export const wpc_fetchRoot = async (): Promise<{ path: string }> => {
  if (window.hoshisen) return window.hoshisen.root()
  const response = await fetch('/api/root')
  if (!response.ok) return wpc_reject(response, '找不到手稿目录')
  return response.json() as Promise<{ path: string }>
}

/**
 * 复制一份手稿备份。
 */
export const wpc_backup = async (): Promise<{ path: string }> => {
  if (window.hoshisen) return window.hoshisen.backup()
  const response = await fetch('/api/backup', { method: 'POST' })
  if (!response.ok) return wpc_reject(response, '备份失败')
  return response.json() as Promise<{ path: string }>
}

/**
 * 在访达中显示手稿文件。
 */
export const wpc_reveal = async (): Promise<{ path: string }> => {
  if (window.hoshisen) return window.hoshisen.reveal()
  const response = await fetch('/api/reveal', { method: 'POST' })
  if (!response.ok) return wpc_reject(response, '无法打开访达')
  return response.json() as Promise<{ path: string }>
}

/**
 * 把一篇文字导出到 data/exports。
 */
export const wpc_exportText = async (title: string, content: string): Promise<{ path: string }> => {
  if (window.hoshisen) return window.hoshisen.exportText({ title, content })
  const response = await fetch('/api/export', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title, content }),
  })
  if (!response.ok) return wpc_reject(response, '导出失败')
  return response.json() as Promise<{ path: string }>
}
