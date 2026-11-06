import fs from 'node:fs'
import zlib from 'node:zlib'
import path from 'node:path'

const size = 1024

/**
 * 把像素收成一张 PNG。
 */
const wpc_png = (pixels) => {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1)
    raw[row] = 0
    pixels.copy(raw, row + 1, y * size * 4, (y + 1) * size * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const chunk = (type, data) => {
    const length = Buffer.alloc(4)
    length.writeUInt32BE(data.length, 0)
    const body = Buffer.concat([Buffer.from(type), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(zlib.crc32(body), 0)
    return Buffer.concat([length, body, crc])
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const pixels = Buffer.alloc(size * size * 4)

/**
 * 盖上一个带透明的颜色。
 */
const wpc_blend = (x, y, red, green, blue, alpha) => {
  if (x < 0 || y < 0 || x >= size || y >= size || alpha <= 0) return
  const index = (y * size + x) * 4
  const src = Math.min(1, alpha)
  const dst = pixels[index + 3] / 255
  const out = src + dst * (1 - src)
  pixels[index] = Math.round((red * src + pixels[index] * dst * (1 - src)) / out)
  pixels[index + 1] = Math.round((green * src + pixels[index + 1] * dst * (1 - src)) / out)
  pixels[index + 2] = Math.round((blue * src + pixels[index + 2] * dst * (1 - src)) / out)
  pixels[index + 3] = Math.round(out * 255)
}

/**
 * 画实心圆。
 */
const wpc_circle = (cx, cy, radius, red, green, blue, alpha = 1) => {
  const left = Math.max(0, Math.floor(cx - radius - 1))
  const right = Math.min(size - 1, Math.ceil(cx + radius + 1))
  const top = Math.max(0, Math.floor(cy - radius - 1))
  const bottom = Math.min(size - 1, Math.ceil(cy + radius + 1))
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      const distance = Math.hypot(x - cx, y - cy)
      if (distance <= radius) wpc_blend(x, y, red, green, blue, alpha * Math.min(1, radius - distance + 1))
    }
  }
}

/**
 * 画圆角方底。
 */
const wpc_roundRect = (radius, red, green, blue) => {
  const pad = 48
  for (let y = pad; y < size - pad; y += 1) {
    for (let x = pad; x < size - pad; x += 1) {
      const nearX = x < pad + radius ? pad + radius : x > size - pad - radius ? size - pad - radius : x
      const nearY = y < pad + radius ? pad + radius : y > size - pad - radius ? size - pad - radius : y
      if (Math.hypot(x - nearX, y - nearY) <= radius) wpc_blend(x, y, red, green, blue, 1)
    }
  }
}

wpc_roundRect(210, 20, 16, 36)
wpc_circle(700, 250, 78, 255, 246, 224)
wpc_circle(512, 430, 34, 255, 225, 168)
for (let y = 470; y < 760; y += 1) {
  for (let x = 390; x < 634; x += 1) {
    const dx = Math.abs(x - 512) / 122
    const dy = (y - 470) / 290
    const edge = dx * dx + Math.pow((dy - 0.5) * 1.15, 4)
    if (edge < 0.42 && y > 500) wpc_blend(x, y, 240, 179, 90, 1)
  }
}
wpc_circle(512, 620, 42, 255, 246, 216, 0.9)

const out = path.join(process.cwd(), 'build', 'icon.png')
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, wpc_png(pixels))
console.log(out)
