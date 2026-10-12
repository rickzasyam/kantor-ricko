// Kanvas piksel kecil untuk menggambar sprite Pixel Office (16 px = 1 tile).
import fs from 'node:fs'
import path from 'node:path'
import pngjs from 'pngjs'

const { PNG } = pngjs

/** '#rrggbb' atau '#rrggbbaa' -> [r, g, b, a] */
export function rgb(hex) {
  const h = hex.replace('#', '')
  return [0, 2, 4, 6].map(i => (i < h.length ? parseInt(h.slice(i, i + 2), 16) : 255))
}

/** Terangkan (f > 0) atau gelapkan (f < 0) warna hex, f dalam -1..1. */
export function shade(hex, f) {
  const [r, g, b, a] = rgb(hex)
  const t = f < 0 ? 0 : 255
  const p = Math.abs(f)
  const mix = v => Math.round((t - v) * p + v).toString(16).padStart(2, '0')
  return `#${mix(r)}${mix(g)}${mix(b)}${a === 255 ? '' : a.toString(16).padStart(2, '0')}`
}

export class Spr {
  constructor(w, h) {
    this.w = w
    this.h = h
    this.d = new Uint8Array(w * h * 4)
  }

  /** Piksel; warna dengan alpha < 255 dicampur ke piksel di bawahnya. */
  px(x, y, c) {
    x = Math.round(x)
    y = Math.round(y)
    if (!c || x < 0 || y < 0 || x >= this.w || y >= this.h) return this
    const [r, g, b, a] = rgb(c)
    const i = (y * this.w + x) * 4
    if (a >= 255 || this.d[i + 3] === 0) {
      this.d.set([r, g, b, a], i)
    } else {
      const k = a / 255
      for (const [j, v] of [r, g, b].entries()) this.d[i + j] = Math.round(v * k + this.d[i + j] * (1 - k))
      this.d[i + 3] = Math.max(this.d[i + 3], a)
    }
    return this
  }

  /** Kosongkan piksel (jadi transparan), mis. untuk membulatkan sudut. */
  hapus(x, y) {
    x = Math.round(x)
    y = Math.round(y)
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return this
    this.d.fill(0, (y * this.w + x) * 4, (y * this.w + x) * 4 + 4)
    return this
  }

  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c)
    return this
  }

  hl(x, y, w, c) { return this.rect(x, y, w, 1, c) }
  vl(x, y, h, c) { return this.rect(x, y, 1, h, c) }

  frame(x, y, w, h, c) {
    this.hl(x, y, w, c).hl(x, y + h - 1, w, c)
    return this.vl(x, y, h, c).vl(x + w - 1, y, h, c)
  }

  /** Kotak dengan sudut membulat 1 px. */
  rrect(x, y, w, h, c) {
    this.rect(x + 1, y, w - 2, h, c)
    return this.rect(x, y + 1, 1, h - 2, c).rect(x + w - 1, y + 1, 1, h - 2, c)
  }

  oval(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx
        const dy = (y - cy) / ry
        if (dx * dx + dy * dy <= 1) this.px(x, y, c)
      }
    }
    return this
  }

  line(x0, y0, x1, y1, c) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1
    for (let i = 0; i <= n; i++) this.px(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c)
    return this
  }

  /** Gambar dari baris teks; tiap karakter dipetakan ke warna lewat `map` (spasi/'.' = kosong). */
  pattern(x, y, rows, map) {
    rows.forEach((row, j) => [...row].forEach((ch, i) => { if (map[ch]) this.px(x + i, y + j, map[ch]) }))
    return this
  }

  save(file) {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    const p = new PNG({ width: this.w, height: this.h })
    p.data.set(this.d)
    fs.writeFileSync(file, PNG.sync.write(p))
  }
}

export function readPng(file) {
  return PNG.sync.read(fs.readFileSync(file))
}

export function writePng(file, png) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, PNG.sync.write(png))
}
