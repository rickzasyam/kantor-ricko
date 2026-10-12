// Palet & bahan (material) gaya Jepang hangat untuk sprite Pixel Office.
//
// Arah seni: kayu oak terang, plester krem, linen, batu alam hangat, hijau sage/matcha, dan
// sedikit aksen persimmon/indigo. Cahaya datang dari kiri-atas: sisi kiri-atas lebih terang,
// bayangan jatuh ke kanan-bawah. Garis luar memakai cokelat tua hangat, bukan hitam.
import { shade } from './sprite.mjs'

export const P = {
  // garis luar & bayangan
  tinta: '#3b3129', tinta2: '#54463a', bayang: '#3b312933', bayangTebal: '#3b312955',

  // kayu oak (terang) -- meja, lantai, rangka
  oak0: '#f2dcb8', oak1: '#e4c69c', oak2: '#d1ab7b', oak3: '#b78d5d', oak4: '#8f6943', oak5: '#664a2d',
  // kayu walnut (gelap) -- balok, kabinet, rangka meja biliar
  wal0: '#a67d5b', wal1: '#8a6343', wal2: '#6e4d34', wal3: '#543a27', wal4: '#3c291c',
  // linen / kertas washi / plester
  linen0: '#fbf6ec', linen1: '#f2e9d9', linen2: '#e5d8c1', linen3: '#cfbea2', linen4: '#ad9a7e',
  // rotan / anyaman
  rotan0: '#e8cf9c', rotan1: '#d4b47a', rotan2: '#b8955c', rotan3: '#8d6c3f',
  // batu alam hangat
  batu0: '#e8e2d6', batu1: '#cfc7b8', batu2: '#b1a898', batu3: '#918878', batu4: '#70685c', batu5: '#4f4941',
  // arang (charcoal lembut) -- elektronik, besi
  arang0: '#8a847b', arang1: '#6c675f', arang2: '#55514a', arang3: '#423e39', arang4: '#2f2c28',
  // sage & matcha (warna identitas)
  sage0: '#dde3c9', sage1: '#c2cca8', sage2: '#a3b086', sage3: '#83926a', sage4: '#64734f', sage5: '#4a5639',
  matcha0: '#d9e1a6', matcha1: '#bdca7c', matcha2: '#9cb05c', matcha3: '#7c9145', matcha4: '#5d7033',
  // daun & lumut
  daun0: '#bccb8f', daun1: '#97ad69', daun2: '#748f4e', daun3: '#56713b', daun4: '#40562e', daun5: '#2e3f24',
  // bambu
  bambu0: '#e1e5a9', bambu1: '#c2cd82', bambu2: '#9fb162', bambu3: '#7d904a', bambu4: '#5c6b37',
  // air onsen (giok)
  air0: '#e2f1ea', air1: '#b4dccf', air2: '#8cc4b5', air3: '#6aa99b', air4: '#4f8d82', air5: '#3b6f68',
  // aksen hangat
  kaki0: '#f0b48a', kaki1: '#de8f62', kaki2: '#c06e45', kaki3: '#97522f',          // persimmon
  momiji0: '#efad6a', momiji1: '#dd8045', momiji2: '#c25b35', momiji3: '#963f27',  // daun maple
  shu0: '#d77a63', shu1: '#b9573f', shu2: '#924130',                               // merah jingga redup
  aizome0: '#8d9ab3', aizome1: '#66769a', aizome2: '#4c5b7b', aizome3: '#38445d',  // indigo
  liat0: '#d9a587', liat1: '#c08766', liat2: '#9c6a4f',                            // tanah liat
  emas0: '#e6c88a', emas1: '#c9a25b', emas2: '#9b783c',                            // kuningan
  sakura0: '#f3d9d3', sakura1: '#e3b7ae',
  cahaya0: '#fff3d6', cahaya1: '#ffe2a8', cahaya2: '#f7c477',                      // nyala lampu
}

/** Generator acak deterministik (mulberry32): sprite selalu sama di setiap build. */
export function acak(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Alpha: '#rrggbb' + 0..1 -> '#rrggbbaa'. */
export const alfa = (hex, a) => hex.slice(0, 7) + Math.round(a * 255).toString(16).padStart(2, '0')

/** Bayangan lembut di lantai (elips gelap transparan). */
export function bayangan(s, cx, cy, rx, ry, kuat = 0.22) {
  s.oval(cx, cy, rx, ry, alfa(P.tinta, kuat * 0.6))
  s.oval(cx, cy, rx * 0.75, ry * 0.7, alfa(P.tinta, kuat * 0.5))
  return s
}

/**
 * Permukaan kayu dilihat dari atas: serat memanjang horizontal, sambungan papan, mata kayu.
 * ramp = [terang, dasar, serat, gelap].
 */
export function kayuAtas(s, x, y, w, h, ramp = [P.oak0, P.oak1, P.oak2, P.oak3], seed = 1, papan = 0) {
  const r = acak(seed)
  s.rect(x, y, w, h, ramp[1])
  for (let j = 1; j < h; j += 2 + Math.floor(r() * 2)) {
    let i = Math.floor(r() * 4)
    while (i < w - 1) {
      const pj = 3 + Math.floor(r() * 7)
      s.hl(x + i, y + j, Math.min(pj, w - i), ramp[2])
      i += pj + 2 + Math.floor(r() * 5)
    }
  }
  if (papan) for (let j = papan; j < h; j += papan) s.hl(x, y + j, w, ramp[3])
  if (w * h > 120) for (let k = 0; k < Math.floor(w * h / 260); k++) s.px(x + 2 + Math.floor(r() * (w - 4)), y + 1 + Math.floor(r() * (h - 2)), ramp[3])
  s.hl(x, y, w, ramp[0])
  return s
}

/** Sisi depan kayu (dilihat dari depan): serat vertikal halus, garis bawah gelap. */
export function kayuDepan(s, x, y, w, h, ramp = [P.oak2, P.oak3, P.oak4, P.oak5], seed = 2) {
  const r = acak(seed)
  s.rect(x, y, w, h, ramp[1])
  for (let i = 1; i < w - 1; i += 3 + Math.floor(r() * 3)) s.vl(x + i, y + 1, Math.max(1, h - 2 - Math.floor(r() * 2)), ramp[2])
  s.hl(x, y, w, ramp[0])
  s.hl(x, y + h - 1, w, ramp[3])
  return s
}

/** Kain linen/kapas: warna dasar + tekstur titik jarang + bayangan bawah. */
export function kain(s, x, y, w, h, ramp, seed = 3) {
  const r = acak(seed)
  s.rect(x, y, w, h, ramp[1])
  for (let k = 0; k < Math.floor(w * h / 9); k++) s.px(x + Math.floor(r() * w), y + Math.floor(r() * h), r() < 0.5 ? ramp[0] : ramp[2])
  s.hl(x, y, w, ramp[0])
  s.hl(x, y + h - 1, w, ramp[2])
  return s
}

/** Batu alam bulat tak beraturan, disinari dari kiri-atas. ramp = [sorot, terang, dasar, gelap, garis]. */
export function batu(s, cx, cy, rx, ry, ramp = [P.batu0, P.batu1, P.batu2, P.batu3, P.batu4], seed = 4, lumut = 0) {
  const r = acak(seed)
  const benjol = Array.from({ length: 12 }, () => 0.82 + r() * 0.26)
  const di = (x, y) => {
    const dx = (x - cx) / rx, dy = (y - cy) / ry
    const sudut = Math.atan2(dy, dx), k = Math.floor(((sudut + Math.PI) / (2 * Math.PI)) * 12) % 12
    return dx * dx + dy * dy <= benjol[k] * benjol[k]
  }
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
    for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      if (!di(x, y)) continue
      const tepi = !di(x - 1, y) || !di(x + 1, y) || !di(x, y - 1) || !di(x, y + 1)
      const nx = (x - cx) / rx, ny = (y - cy) / ry
      const terang = -0.55 * nx - 0.75 * ny + (r() - 0.5) * 0.25
      let c = terang > 0.55 ? ramp[0] : terang > 0.15 ? ramp[1] : terang > -0.35 ? ramp[2] : ramp[3]
      if (tepi && (ny > 0.1 || nx > 0.35)) c = ramp[4]
      s.px(x, y, c)
      if (lumut && ny < -0.15 && r() < lumut) s.px(x, y, r() < 0.5 ? P.daun2 : P.daun1)
    }
  }
  return s
}

/** Gumpalan daun (semak, kanopi pohon): lingkaran-lingkaran kecil bertumpuk, sorot kiri-atas. */
export function daun(s, cx, cy, rx, ry, ramp = [P.daun0, P.daun1, P.daun2, P.daun3, P.daun4], seed = 5, rapat = 1) {
  const r = acak(seed)
  const n = Math.max(4, Math.round(rx * ry * 0.35 * rapat))
  const blob = []
  for (let k = 0; k < n; k++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r())
    blob.push([cx + Math.cos(a) * d * rx * 0.85, cy + Math.sin(a) * d * ry * 0.85, 1.6 + r() * 1.8])
  }
  blob.sort((p, q) => p[1] - q[1])
  for (const [bx, by, br] of blob) s.oval(bx + 0.6, by + 0.8, br, br * 0.9, ramp[4])
  for (const [bx, by, br] of blob) {
    s.oval(bx, by, br, br * 0.85, ramp[2])
    s.oval(bx - br * 0.3, by - br * 0.35, br * 0.6, br * 0.5, ramp[1])
    if (br > 2.2) s.px(bx - br * 0.45, by - br * 0.5, ramp[0])
    s.px(bx + br * 0.5, by + br * 0.6, ramp[3])
  }
  // tepi bergerigi: daun-daun kecil mencuat
  for (let k = 0; k < n; k++) {
    const a = r() * Math.PI * 2
    s.px(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, a > Math.PI * 0.2 && a < Math.PI * 1.1 ? ramp[3] : ramp[2])
  }
  return s
}

/** Pot keramik bundar dilihat dari depan-atas. glasir = [terang, dasar, gelap]. */
export function pot(s, cx, yAtas, lebar, tinggi, glasir, tanah = P.wal3) {
  const x0 = Math.round(cx - lebar / 2)
  s.rect(x0 + 1, yAtas + 1, lebar - 2, tinggi - 1, glasir[1])
  s.vl(x0, yAtas + 1, tinggi - 2, glasir[2]).vl(x0 + lebar - 1, yAtas + 1, tinggi - 2, glasir[2])
  s.vl(x0 + 1, yAtas + 2, tinggi - 4, glasir[0])
  s.hl(x0 + 1, yAtas + tinggi - 1, lebar - 2, glasir[2])
  s.hl(x0, yAtas, lebar, glasir[0]).hl(x0 + 1, yAtas + 1, lebar - 2, tanah)
  return s
}

/** Teks piksel 3x5 (huruf kapital & angka sederhana). */
export const HURUF = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'],
  C: ['.##', '#..', '#..', '#..', '.##'], D: ['##.', '#.#', '#.#', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'],
  I: ['###', '.#.', '.#.', '.#.', '###'], J: ['..#', '..#', '..#', '#.#', '.#.'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#.#', '###', '#.#', '#.#', '#.#'], N: ['##.', '#.#', '#.#', '#.#', '#.#'],
  O: ['.#.', '#.#', '#.#', '#.#', '.#.'], P: ['##.', '#.#', '##.', '#..', '#..'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'], S: ['.##', '#..', '.#.', '..#', '##.'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'], U: ['#.#', '#.#', '#.#', '#.#', '###'],
  V: ['#.#', '#.#', '#.#', '#.#', '.#.'], W: ['#.#', '#.#', '###', '###', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], ' ': ['...', '...', '...', '...', '...'],
}

/** Tulis teks 3x5 mulai (x, y); kembalikan lebar piksel. */
export function tulis(s, x, y, teks, warna, jarak = 1) {
  let cx = x
  for (const h of teks) {
    const g = HURUF[h] ?? HURUF[' ']
    g.forEach((b, j) => [...b].forEach((c, k) => { if (c === '#') s.px(cx + k, y + j, warna) }))
    cx += 3 + jarak
  }
  return cx - x - jarak
}

export const lebarTeks = (teks, jarak = 1) => teks.length * (3 + jarak) - jarak

export { shade }
