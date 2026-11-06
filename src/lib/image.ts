import type { WpcAssetInput } from '../../shared/types'

/**
 * 把二进制收成 base64。
 */
const wpc_bufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const size = 0x8000
  for (let index = 0; index < bytes.length; index += size) {
    binary += String.fromCharCode(...bytes.subarray(index, index + size))
  }
  return btoa(binary)
}

/**
 * 把大图收进 2000 像素以内，避免手稿目录被原图撑满。
 */
const wpc_drawCompressed = (file: File): Promise<WpcAssetInput> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const max = 2000
      const scale = Math.min(1, max / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      const context = canvas.getContext('2d')
      if (!context) {
        URL.revokeObjectURL(url)
        reject(new Error('无法处理图片'))
        return
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      const dataUrl = canvas.toDataURL(mime, 0.86)
      URL.revokeObjectURL(url)
      resolve({ name: file.name, mime, base64: dataUrl.split(',')[1] ?? '' })
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('这张图片无法打开'))
    }
    image.src = url
  })

/**
 * 准备一张可保存的图片。动图保持原样，照片会压一压。
 */
export const wpc_compressImage = async (file: File): Promise<WpcAssetInput> => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) throw new Error('请使用 JPG、PNG、WebP 或 GIF')
  if (file.type === 'image/gif' || file.size < 400 * 1024) {
    if (file.size > 8 * 1024 * 1024) throw new Error('图片请小于 8MB')
    return { name: file.name, mime: file.type, base64: wpc_bufferToBase64(await file.arrayBuffer()) }
  }
  return wpc_drawCompressed(file)
}
