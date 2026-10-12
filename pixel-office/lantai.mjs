// Pola lantai & dinding gaya Jepang untuk pixel-agents.
//
// pixel-agents mewarnai pola lantai/dinding dari kecerahannya (colorize HSL per tile), jadi pola
// digambar abu-abu: terang-gelap menentukan detail, warna & kekuatan kontras diatur di denah
// (tileColors). Pola lantai baru ditambahkan sebagai floor_9.png dst. (tipe tile 10 dst.),
// dinding bawaan wall_0.png diganti (aslinya disimpan sebagai wall_0.png.asli).
//
// Rumus pewarnaan pixel-agents: L = 0.5 + (lum - 0.5) * (100 + c) / 100 + b / 200.
import fs from 'node:fs'
import path from 'node:path'
import pngjs from 'pngjs'
import { acak } from './lib/bahan.mjs'

const { PNG } = pngjs

/** Pola 16x16 dari fungsi kecerahan (0..1) per piksel. */
function pola(fn) {
  const v = new Float32Array(256)
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) v[y * 16 + x] = fn(x, y)
  return v
}

/**
 * Noise gumpalan yang menyambung di tepi tile (value noise periodik, grid `sel` x `sel`),
 * hasil -1..1. Dipakai untuk tekstur organik (lumut, plester) tanpa pola garis.
 */
function noiseTile(seed, sel = 4) {
  const r = acak(seed)
  const g = Array.from({ length: sel * sel }, () => r() * 2 - 1)
  const nilai = (i, j) => g[((j % sel) + sel) % sel * sel + (((i % sel) + sel) % sel)]
  const halus = t => t * t * (3 - 2 * t)
  return (x, y) => {
    const fx = (x / 16) * sel, fy = (y / 16) * sel
    const i = Math.floor(fx), j = Math.floor(fy), u = halus(fx - i), v = halus(fy - j)
    const a = nilai(i, j) + (nilai(i + 1, j) - nilai(i, j)) * u
    const b = nilai(i, j + 1) + (nilai(i + 1, j + 1) - nilai(i, j + 1)) * u
    return a + (b - a) * v
  }
}

// ------------------------------------------------------------------- pola lantai

/** Tatami: anyaman jerami melintang, pinggiran kain (heri) gelap di atas & bawah. */
function tatami(sambung) {
  const r = acak(sambung ? 92 : 91)
  const titik = Array.from({ length: 256 }, () => r())
  return pola((x, y) => {
    if (y === 0) return 0.38                                    // heri (pinggiran kain)
    if (y === 15) return 0.47
    if (y === 1) return 0.62                                    // bayangan tipis di bawah heri
    let v = y % 2 ? 0.69 : 0.66                                 // anyaman melintang
    if ((x + (y >> 1) * 3) % 6 === 0) v -= 0.035                // jahitan tegak halus
    v += (titik[y * 16 + x] - 0.5) * 0.04
    if (sambung && x === 0) v = 0.52                            // sambungan antar-tikar
    if (sambung && x === 1) v += 0.03
    return v
  })
}

/**
 * Papan kayu lebar (oak) melintang: tiga papan per tile (5, 5, 6 px) dengan garis papan halus.
 * `sambungan` = tile yang memuat ujung papan; denah menyelang-nyelingkan tile bersambungan dan
 * tile polos supaya papan tampak panjang, bukan seperti bata.
 */
function kayuLebar(sambungan, seed) {
  const r = acak(seed)
  const serat = new Float32Array(256)
  for (let k = 0; k < 16; k++) {
    const y = Math.floor(r() * 16), x0 = Math.floor(r() * 16), p = 4 + Math.floor(r() * 7)
    for (let i = 0; i < p; i++) serat[y * 16 + ((x0 + i) % 16)] -= 0.035
  }
  const papan = [[0, 4, 0.665, 11], [5, 9, 0.645, 3], [10, 15, 0.675, 8]]   // [y awal, y garis, nada, kolom sambungan]
  return pola((x, y) => {
    const [y0, garis, nada, sx] = papan.find(([a, g]) => y >= a && y <= g)
    if (y === garis) return 0.56
    if (sambungan && x === sx) return 0.585
    let v = nada + serat[y * 16 + x]
    if (y === y0) v += 0.025                                     // sisi atas papan memantulkan cahaya
    return v
  })
}

/**
 * Lempeng batu alam (ishidatami): tiga lempeng berbeda ukuran & nada per tile, nat lembut,
 * sisi kiri-atas memantulkan cahaya. Menyambung dengan tile di sebelahnya.
 */
function ishidatami() {
  const r = acak(41)
  const bintik = Array.from({ length: 256 }, () => r())
  // [x0, y0, x1, y1, nada] -- batas lempeng (inklusif), nat di kanan & bawah tiap lempeng
  const lempeng = [[0, 0, 9, 6, 0.66], [10, 0, 15, 9, 0.62], [0, 7, 9, 15, 0.6], [10, 10, 15, 15, 0.67]]
  return pola((x, y) => {
    const l = lempeng.find(([x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1)
    const [x0, y0, x1, y1, nada] = l
    if (x === x1 || y === y1) return 0.46                       // nat
    let v = nada + (bintik[y * 16 + x] - 0.5) * 0.06
    if (x === x0 || y === y0) v += 0.05                          // tepi terkena cahaya
    if (x === x1 - 1 || y === y1 - 1) v -= 0.04
    return v
  })
}

/** Kerikil halus; `garuk` = garis garukan ala karesansui. */
function kerikil(garuk) {
  const r = acak(garuk ? 52 : 51)
  const bintik = Array.from({ length: 256 }, () => r())
  return pola((x, y) => {
    const b = bintik[y * 16 + x]
    let v = 0.72 + (b < 0.18 ? -0.07 : b > 0.86 ? 0.06 : (b - 0.5) * 0.04)
    if (garuk) {
      // alur garukan: lekuk gelap lalu punggung terang, berulang tiap 4 piksel
      const g = y % 4
      v += [-0.1, 0.05, 0.02, -0.02][g]
    }
    return v
  })
}

/** Lumut / rumput pendek: gumpalan lembut, titik terang kena matahari. */
function lumut() {
  const besar = noiseTile(61, 4), kecil = noiseTile(63, 8)
  const r = acak(62)
  const bintik = Array.from({ length: 256 }, () => r())
  return pola((x, y) => {
    const b = bintik[y * 16 + x]
    let v = 0.5 + besar(x, y) * 0.06 + kecil(x, y) * 0.04
    if (b > 0.92) v += 0.08
    else if (b < 0.07) v -= 0.07
    return v
  })
}

/** Batu pijakan pipih di tengah lumut. */
function batuLoncat() {
  const dasar = lumut()
  const r = acak(71)
  const benjol = Array.from({ length: 10 }, () => 0.9 + r() * 0.18)
  const cx = 7.5, cy = 7.6, rx = 6.3, ry = 5
  const dalam = (x, y) => {
    const dx = (x - cx) / rx, dy = (y - cy) / ry
    const k = Math.floor(((Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI)) * 10) % 10
    return dx * dx + dy * dy <= benjol[k] * benjol[k]
  }
  const bintik = Array.from({ length: 256 }, () => r())
  return pola((x, y) => {
    if (dalam(x, y)) {
      const nx = (x - cx) / rx, ny = (y - cy) / ry
      let v = 0.76 - 0.05 * (0.6 * nx + 0.8 * ny) + (bintik[y * 16 + x] - 0.5) * 0.04
      if (!dalam(x, y + 1) || !dalam(x + 1, y)) v = 0.58
      else if (!dalam(x, y - 1) || !dalam(x - 1, y)) v += 0.04
      return v
    }
    if (dalam(x - 1, y - 1)) return dasar[y * 16 + x] - 0.1      // bayangan batu di lumut
    return dasar[y * 16 + x]
  })
}

/** Dek kayu engawa: bilah melintang sejajar bangunan, celah tipis, paku di ujung bilah. */
function dekKayu() {
  const r = acak(81)
  const serat = new Float32Array(256)
  for (let k = 0; k < 14; k++) {
    const y = Math.floor(r() * 16), x0 = Math.floor(r() * 16), p = 3 + Math.floor(r() * 6)
    for (let i = 0; i < p; i++) serat[y * 16 + ((x0 + i) % 16)] -= 0.04
  }
  return pola((x, y) => {
    if (y % 4 === 3) return 0.46                                // celah antar-bilah
    let v = 0.64 + serat[y * 16 + x]
    if (y % 4 === 0) v += 0.04                                  // sisi atas bilah memantulkan cahaya
    if (y % 4 === 1 && (x === 1 || x === 14)) v = 0.5           // paku
    return v
  })
}

/** Plester / beton halus hangat dengan bintik terrazzo halus. */
function plester() {
  const n = noiseTile(91, 4)
  const r = acak(92)
  const bintik = Array.from({ length: 256 }, () => r())
  return pola((x, y) => {
    const b = bintik[y * 16 + x]
    let v = 0.7 + n(x, y) * 0.025
    if (b > 0.94) v += 0.05
    else if (b < 0.05) v -= 0.05
    return v
  })
}

/** Ubin batu besar (satu ubin per tile) dengan nat lembut di kanan & bawah. */
function ubinBatu() {
  const n = noiseTile(101, 4)
  const r = acak(102)
  const bintik = Array.from({ length: 256 }, () => r())
  return pola((x, y) => {
    if (x === 15 || y === 15) return 0.56
    let v = 0.7 + n(x, y) * 0.025 + (bintik[y * 16 + x] - 0.5) * 0.03
    if (x === 0 || y === 0) v += 0.03
    if (x === 14 || y === 14) v -= 0.02
    return v
  })
}

/** Urutan = nomor floor_N mulai 9. Tipe tile di denah = N + 1. */
export const LANTAI_BARU = [
  ['TATAMI', tatami(false)],
  ['TATAMI_SAMBUNG', tatami(true)],
  ['KAYU_LEBAR', kayuLebar(true, 31)],
  ['ISHIDATAMI', ishidatami()],
  ['KERIKIL_GARUK', kerikil(true)],
  ['KERIKIL', kerikil(false)],
  ['LUMUT', lumut()],
  ['BATU_LONCAT', batuLoncat()],
  ['DEK_KAYU', dekKayu()],
  ['PLESTER', plester()],
  ['UBIN_BATU', ubinBatu()],
  ['KAYU_POLOS', kayuLebar(false, 33)],
]
const NOMOR_AWAL = 9

/** Tipe tile denah untuk tiap pola baru: { TATAMI: 10, ... }. */
export const TIPE_LANTAI = Object.fromEntries(LANTAI_BARU.map(([nama], i) => [nama, NOMOR_AWAL + i + 1]))

function simpanAbu(file, w, h, nilai, alfa) {
  const p = new PNG({ width: w, height: h })
  for (let i = 0; i < w * h; i++) {
    const v = Math.max(0, Math.min(255, Math.round(nilai[i] * 255)))
    p.data[i * 4] = p.data[i * 4 + 1] = p.data[i * 4 + 2] = v
    p.data[i * 4 + 3] = alfa ? alfa[i] : 255
  }
  fs.writeFileSync(file, PNG.sync.write(p))
}

// ------------------------------------------------------------------------- dinding

/**
 * Dinding bergaya Jepang dari potongan bawaan wall_0 (16 potongan 16x32 untuk penyambungan
 * otomatis). Tiap piksel bawaan sudah bermakna: garis luar (gelap), puncak dinding (sedang), dan
 * muka dinding (putih). Puncak digambar sebagai balok kayu, muka sebagai plester dengan balok
 * nageshi di atas, papan habaki di bawah, dan tiang di ujung dinding.
 */
function dindingJepang(asli) {
  const W = asli.width, H = asli.height
  const jenis = new Array(W * H)
  for (let i = 0; i < W * H; i++) {
    const a = asli.data[i * 4 + 3], v = asli.data[i * 4]
    jenis[i] = a < 10 ? ' ' : v < 90 ? '#' : v < 230 ? '+' : '.'
  }
  const r = acak(111)
  const nilai = new Float32Array(W * H), alfa = new Uint8Array(W * H)
  for (let py = 0; py < H; py += 32) for (let px = 0; px < W; px += 16) {
    for (let x = 0; x < 16; x++) {
      // rentang muka dinding (putih) di kolom ini
      let atas = -1, bawah = -1
      for (let y = 0; y < 32; y++) if (jenis[(py + y) * W + px + x] === '.') { if (atas < 0) atas = y; bawah = y }
      for (let y = 0; y < 32; y++) {
        const i = (py + y) * W + px + x, j = jenis[i]
        alfa[i] = j === ' ' ? 0 : 255
        let v
        if (j === '#') v = 0.3
        else if (j === '+') {
          // balok kayu di puncak: serat memanjang + sorot di tepi atas
          v = 0.6 + (r() < 0.22 ? -0.05 : 0)
          if (y > 0 && jenis[i - W] === '#') v = 0.68
        } else if (j === '.') {
          const d = y - atas, e = bawah - y
          v = 0.93 + (r() < 0.07 ? -0.03 : 0)
          if (d === 4 || d === 5) v = 0.56                       // nageshi (balok mendatar)
          else if (d === 3) v = 0.66
          else if (d === 6) v = 0.86                             // bayangan di bawah balok
          if (e <= 2) v = 0.5                                    // habaki (papan bawah)
          else if (e === 3) v = 0.62
          // tiang di ujung dinding: kolom bersebelahan dengan garis luar
          const kiri = x > 0 && jenis[i - 1] === '#', kanan = x < 15 && jenis[i + 1] === '#'
          if ((kiri || kanan) && e > 2) v = 0.58
          else if (x > 1 && jenis[i - 2] === '#' && e > 2) v = Math.min(v, 0.7)
        } else v = 0
        nilai[i] = v
      }
    }
  }
  return { nilai, alfa, W, H }
}

/**
 * Pasang pola lantai baru + dinding Jepang ke folder aset pixel-agents (`<dist>/assets`).
 * Aman diulang: lantai lama buatan kita (floor_9 dst.) dihapus dulu, dinding asli dicadangkan.
 */
export function buildLantai(distDir) {
  const dirLantai = path.join(distDir, 'assets', 'floors')
  for (const f of fs.readdirSync(dirLantai)) {
    const m = /^floor_(\d+)\.png$/.exec(f)
    if (m && Number(m[1]) >= NOMOR_AWAL) fs.unlinkSync(path.join(dirLantai, f))
  }
  LANTAI_BARU.forEach(([, nilai], i) => simpanAbu(path.join(dirLantai, `floor_${NOMOR_AWAL + i}.png`), 16, 16, nilai))

  const fileDinding = path.join(distDir, 'assets', 'walls', 'wall_0.png')
  const asliDinding = `${fileDinding}.asli`
  if (!fs.existsSync(asliDinding)) fs.copyFileSync(fileDinding, asliDinding)
  const d = dindingJepang(PNG.sync.read(fs.readFileSync(asliDinding)))
  simpanAbu(fileDinding, d.W, d.H, d.nilai, d.alfa)
  return { lantai: LANTAI_BARU.length }
}
