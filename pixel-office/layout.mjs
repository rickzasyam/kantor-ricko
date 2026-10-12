// Denah Kantor Ricko untuk pixel-agents (format layout.json versi 1).
// Gaya kantor Jepang yang hangat: lantai oak & tatami, dinding plester berbalok kayu, taman onsen.
//
//   ┌──────────┬─────────┬──────────────┬───────────┐
//   │  Ruang   │ Ruang   │ Ruang Rapat  │  Matcha   │   baris 2-10
//   │  Ricko   │ Manajer │              │   Bar     │
//   ├──────────┴─────────┼──────┬───────┴───────────┤   dinding baris 11
//   │    Ruang Kerja     │Lounge│    Ruang Game     │   baris 12-21
//   ├─────────┬──────────┴──────┴───────────────────┤   dinding baris 22
//   │  Dojo   │          Taman Onsen                │   baris 23-33
//   └─────────┴─────────────────────────────────────┘
//
// Catatan tampilan: dinding digambar 2 tile tinggi, jadi baris tepat di atas dinding
// horizontal (10, 21) tertutup puncak dinding -- jangan taruh furnitur penting di sana.
// Barang dinding untuk ruangan di bawah dinding baris N diletakkan di baris N-1.
import fs from 'node:fs'
import path from 'node:path'
import { TIPE_LANTAI as T } from './lantai.mjs'

/** Naikkan kalau desain denah berubah besar: pasang-pixel-office.ps1 lalu memasang denah ini
 *  sekali (denah lama di-backup), walaupun Pak Ricko pernah mengedit denah lewat editor Layout. */
export const VERSI_DENAH = 3

const COLS = 50
const ROWS = 36
const VOID = 255
const WALL = 0

// Warna (h, s, b, c) dipakai pixel-agents untuk mewarnai pola abu-abu lantai & dinding.
const W = {
  oak: { h: 34, s: 32, b: 20, c: -36 },
  oakManajer: { h: 32, s: 31, b: 16, c: -36 },
  oakRapat: { h: 35, s: 28, b: 22, c: -40 },
  walnut: { h: 27, s: 25, b: -18, c: -28 },
  tatami: { h: 50, s: 24, b: 8, c: -18 },
  tatamiDojo: { h: 47, s: 22, b: 6, c: -18 },
  plesterKafe: { h: 36, s: 28, b: 16, c: -45 },
  doma: { h: 34, s: 24, b: 20, c: -66 },
  permadani: { h: 36, s: 30, b: 14, c: -50 },
  tepiPermadani: { h: 30, s: 22, b: 0, c: -45 },
  dek: { h: 30, s: 34, b: 4, c: -22 },
  lumut: { h: 84, s: 19, b: -12, c: -8 },
  batuJalan: { h: 38, s: 10, b: 4, c: -25 },
  kerikil: { h: 40, s: 16, b: 6, c: -12 },
  yogaSage: { h: 80, s: 18, b: 4, c: -40 },
  yogaLiat: { h: 22, s: 28, b: 6, c: -40 },
  yogaPasir: { h: 40, s: 24, b: 10, c: -40 },
}
const DINDING = {
  plester: { h: 36, s: 30, b: 2, c: 0 },
  plesterTeh: { h: 46, s: 26, b: 2, c: 0 },
  plesterGelap: { h: 32, s: 28, b: -8, c: 0 },
  pagar: { h: 28, s: 28, b: -34, c: 0 },
}

const RUANG = [
  { label: 'Ruang Ricko', c: [2, 11], r: [2, 10], lantai: T.KAYU_LEBAR, warna: W.oak, dinding: DINDING.plester, area: '#d9b77e' },
  { label: 'Ruang Manajer', c: [13, 21], r: [2, 10], lantai: T.KAYU_LEBAR, warna: W.oakManajer, dinding: DINDING.plester, area: '#c9a07a' },
  { label: 'Ruang Rapat', c: [23, 34], r: [2, 10], lantai: T.KAYU_LEBAR, warna: W.oakRapat, dinding: DINDING.plester, area: '#a3b086' },
  { label: 'Matcha Bar', c: [36, 47], r: [2, 10], lantai: T.PLESTER, warna: W.plesterKafe, dinding: DINDING.plesterTeh, area: '#9cb05c' },
  { label: 'Ruang Kerja', c: [2, 21], r: [12, 21], lantai: T.KAYU_LEBAR, warna: W.oak, dinding: DINDING.plester, area: '#c2a46a' },
  { label: 'Lounge', c: [23, 28], r: [12, 21], lantai: T.TATAMI, warna: W.tatami, dinding: DINDING.plester, area: '#b9a58a' },
  { label: 'Ruang Game', c: [30, 47], r: [12, 21], lantai: T.KAYU_LEBAR, warna: W.walnut, dinding: DINDING.plesterGelap, area: '#8d9ab3' },
  { label: 'Dojo', c: [2, 12], r: [23, 33], lantai: T.TATAMI, warna: W.tatamiDojo, dinding: DINDING.plesterGelap, area: '#c08766' },
  { label: 'Onsen', c: [14, 47], r: [23, 33], lantai: T.LUMUT, warna: W.lumut, dinding: DINDING.plester, area: '#7fb8ab' },
]

// Petak lantai bermotif di dalam ruangan: [kolom, baris, lebar, tinggi, jenis, warna].
// Diproses berurutan; petak belakangan menimpa yang lebih dulu.
const MOTIF = [
  // tatami: tikar 2 tile berselang supaya sambungannya tidak segaris
  ...tatami(24, 12, 4, 10, W.tatami),
  ...tatami(3, 26, 9, 7, W.tatamiDojo),
  ...tatami(30, 13, 5, 4, W.tatami),
  [2, 23, 11, 3, T.KAYU_LEBAR, W.oak],                     // dojo: lajur kayu untuk alat latihan
  [2, 26, 1, 8, T.KAYU_LEBAR, W.oak], [12, 26, 1, 8, T.KAYU_LEBAR, W.oak],
  [23, 12, 1, 10, T.KAYU_LEBAR, W.oak],                    // lounge: bingkai kayu di sisi kiri
  [24, 3, 10, 7, T.KERIKIL, W.tepiPermadani],              // ruang rapat: permadani rami bertepi gelap
  [25, 4, 8, 5, T.KERIKIL, W.permadani],
  [2, 7, 5, 3, T.KERIKIL, W.tepiPermadani],                // ruang Ricko: permadani rami di pojok baca
  [3, 8, 3, 1, T.KERIKIL, W.permadani],
  [37, 2, 7, 3, T.ISHIDATAMI, W.doma],                     // matcha bar: lantai batu (doma) di balik konter
  [43, 3, 5, 7, T.KAYU_LEBAR, W.oak],                      // matcha bar: area duduk berlantai kayu
  // yoga di dojo
  [4, 29, 1, 3, T.PLESTER, W.yogaSage], [6, 29, 1, 3, T.PLESTER, W.yogaLiat], [8, 29, 1, 3, T.PLESTER, W.yogaPasir],
  // taman onsen: dek kayu (engawa) sepanjang fasad
  [14, 23, 34, 2, T.DEK_KAYU, W.dek],
  // karesansui: kerikil digaruk di sisi kanan, tepi kirinya berlekuk mengikuti taman
  ...[[27, 41], [28, 40], [29, 39], [30, 39], [31, 40], [32, 41]].map(([r, c]) => [c, r, 48 - c, 1, T.KERIKIL_GARUK, W.kerikil]),
  // batu pijakan: dari pintu dojo ke kolam, dan dari kolam ke taman kerikil
  ...[[14, 27], [15, 27], [16, 28], [17, 28], [18, 27], [19, 27], [20, 28]].map(([c, r]) => [c, r, 1, 1, T.BATU_LONCAT, W.lumut]),
  ...[[35, 29], [36, 30], [37, 29], [38, 30], [21, 27], [21, 29], [34, 28], [27, 31], [29, 32]].map(([c, r]) => [c, r, 1, 1, T.BATU_LONCAT, W.lumut]),
]

/** Tikar tatami 2x1 berselang-seling dalam persegi [c, r, w, h]. */
function tatami(c0, r0, w, h, warna) {
  const hasil = []
  for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w; c++) {
    const sambung = (c - c0 + (r - r0) % 2) % 2 === 0
    hasil.push([c, r, 1, 1, sambung ? T.TATAMI_SAMBUNG : T.TATAMI, warna])
  }
  return hasil
}

// Lantai alami (lumut, kerikil, batu) diberi variasi nada kecil per tile supaya tidak datar.
const ALAMI = new Set([T.LUMUT, T.KERIKIL, T.KERIKIL_GARUK, T.ISHIDATAMI, T.BATU_LONCAT, T.DEK_KAYU])

/** Lantai kayu: sebagian tile memuat ujung papan, sisanya polos, supaya papan tampak panjang. */
const acakTile = (c, r) => ((c * 73856093) ^ (r * 19349663)) >>> 0
const jenisKayu = (c, r) => (acakTile(c, r) % 3 === 0 ? T.KAYU_LEBAR : T.KAYU_POLOS)

// Pintu: tile dinding yang dijadikan lantai ruangan tujuan.
const PINTU = [
  { tiles: [[9, 11], [10, 11]], ke: 'Ruang Kerja' },
  { tiles: [[19, 11], [20, 11]], ke: 'Ruang Kerja' },
  { tiles: [[25, 11], [26, 11]], ke: 'Lounge' },
  { tiles: [[35, 7], [35, 8]], ke: 'Matcha Bar' },
  { tiles: [[40, 11], [41, 11]], ke: 'Ruang Game' },
  { tiles: [[22, 13]], ke: 'Lounge' },
  { tiles: [[22, 16], [22, 17]], ke: 'Lounge' },
  { tiles: [[29, 16], [29, 17]], ke: 'Lounge' },
  { tiles: [[6, 22], [7, 22]], ke: 'Dojo' },
  { tiles: [[25, 22], [26, 22]], ke: 'Onsen' },
  { tiles: [[38, 22], [39, 22]], ke: 'Onsen' },
  { tiles: [[13, 27], [13, 28]], ke: 'Onsen' },
]

/** Kursi rapat: urutan warna bantal di sisi atas & bawah meja. */
const BANTAL_ATAS = ['SAGE', 'PASIR', 'LIAT', 'INDIGO', 'PASIR', 'MATCHA']
const BANTAL_BAWAH = ['PASIR', 'INDIGO', 'SAGE', 'MATCHA', 'LIAT', 'SAGE']

// [jenis, kolom, baris, warna?] -- kolom/baris = pojok kiri-atas footprint.
const FURNITUR = [
  // Ruang Ricko: meja oak & kursi rotan, lukisan tinta, bufet berlampu bola, vas ranting, pojok baca
  ['JENDELA_SHOJI', 2, 0], ['LUKISAN_TINTA', 5, 0], ['PLAKAT_RICKO', 7, 0], ['KOKEDAMA', 11, 0],
  ['EXEC_DESK', 4, 4], ['EXEC_CHAIR_FRONT', 5, 3], ['MODERN_PC_BACK', 6, 4],
  ['BUFET', 8, 2], ['BONSAI', 2, 2],
  ['AQUARIUM', 2, 5],
  ['VAS_RANTING', 10, 5],
  ['SOFA_RENDAH', 3, 8], ['MEJA_BULAT', 5, 8], ['AKARI', 2, 8],

  // Ruang Manajer (Pak Asep): papan washi, gulungan ensō, pojok teh
  ['PAPAN_WASHI', 13, 0], ['GULUNGAN_ENSO', 17, 0], ['JENDELA_SHOJI', 19, 0],
  ['EXEC_DESK', 15, 4], ['EXEC_CHAIR_FRONT', 16, 3], ['MODERN_PC_BACK', 17, 4],
  ['RAK_TERBUKA', 13, 2], ['BONSAI', 21, 2],
  ['CHABUDAI', 14, 7], ['ZABUTON_SAGE', 13, 8], ['ZABUTON_OAT', 16, 8],
  ['BAMBU_POT', 21, 7], ['AKARI', 18, 8],

  // Ruang Rapat: meja oak panjang, kursi berbantal warna tanah (kursi paling kiri = kepala rapat)
  ['JENDELA_SHOJI', 23, 0], ['TV_RAPAT', 27, 0], ['PLAKAT_RAPAT', 30, 0], ['JENDELA_SHOJI', 33, 0],
  ['MEJA_RAPAT', 26, 5],
  ...BANTAL_ATAS.map((w, i) => [`KURSI_RAPAT_${w}_FRONT`, 26 + i, 4]),
  ...BANTAL_BAWAH.map((w, i) => [`KURSI_RAPAT_${w}_BACK`, 26 + i, 7]),
  ['KURSI_RAPAT_SAGE_SIDE', 25, 5], ['KURSI_RAPAT_PASIR_SIDE:left', 32, 5],
  ['BAMBU_POT', 23, 2], ['BAMBU_POT', 34, 2], ['TANAMAN_PEDANG', 23, 8], ['PAKIS', 33, 8],

  // Matcha Bar: noren, rak teh, konter, bangku bar, meja kafe di bawah lampu gantung
  ['PLAKAT_MATCHA', 36, 0], ['NOREN_TEH', 40, 0], ['MARUMADO', 43, 0], ['PAPAN_MENU', 46, 0],
  ['RAK_TEH', 39, 2], ['BAMBU_POT', 36, 2],
  ['MATCHA_BAR', 38, 5],
  ['BANGKU_BAR_SAGE', 38, 7], ['BANGKU_BAR_LINEN', 40, 7], ['BANGKU_BAR_SAGE', 42, 7],
  ['MEJA_KAFE', 45, 4], ['BANGKU_BAR_LINEN', 44, 4], ['BANGKU_BAR_SAGE', 46, 4], ['LAMPU_GANTUNG', 45, 2],
  ['MEJA_KAFE', 45, 8], ['BANGKU_BAR_SAGE', 44, 8], ['BANGKU_BAR_LINEN', 46, 8], ['LAMPU_GANTUNG', 45, 6],
  ['TANAMAN_PEDANG', 47, 6], ['TANAMAN_PEDANG', 37, 8], ['RAK_TERBUKA', 46, 2],

  // Ruang Kerja: 6 meja oak (5 karyawan + 1 cadangan), tanaman & lampu kertas di sela meja
  ['RAK_DINDING', 2, 10], ['OMBAK_HOKUSAI', 5, 10], ['JAM_DINDING', 7, 10], ['PLAKAT_FOKUS', 12, 10], ['GULUNGAN_ENSO', 16, 10], ['KOKEDAMA', 17, 10], ['KOKEDAMA', 21, 10],
  ...[[3, 13, 'A'], [9, 13, 'B'], [15, 13, 'C'], [3, 17, 'B'], [9, 17, 'C'], [15, 17, 'A']].flatMap(([c, r, v]) => [
    [`MEJA_KERJA_${v}`, c, r], ['MODERN_PC_FRONT_OFF', c + 1, r], ['OFFICE_CHAIR', c + 1, r + 2],
  ]),
  ['BAMBU_POT', 2, 12], ['PAKIS', 7, 12], ['AKARI', 13, 12], ['TANAMAN_PEDANG', 19, 12],
  ['AKARI', 7, 16], ['BONSAI', 13, 16], ['PAKIS', 20, 18],
  ['RAK_TERBUKA', 12, 20],

  // Lounge: tatami, tokonoma di bawah gulungan, chabudai & zabuton, kursi telur rotan
  ['GULUNGAN_ENSO', 23, 10], ['MARUMADO', 27, 10],
  ['TOKONOMA', 23, 12], ['EGG_CHAIR', 27, 12],
  ['CHABUDAI', 23, 18], ['ZABUTON_INDIGO', 23, 20], ['ZABUTON_LIAT', 24, 20], ['AKARI', 28, 19],

  // Ruang Game: TV kayu + kotatsu, arcade walnut, gachapon, biliar, foosball, pojok bean bag
  ['GAME_TV', 31, 10], ['POSTER_KUCING', 34, 10], ['PLAKAT_MAIN', 36, 10], ['POSTER_FUJI', 38, 10], ['LAMPION_UNTAI', 43, 10], ['KOKEDAMA', 47, 10],
  ['TV_CONSOLE', 31, 12], ['KOTATSU', 31, 13],
  ['ZAISU_BACK', 31, 15], ['ZAISU_SAGE_BACK', 32, 15], ['ZAISU_SIDE', 30, 14], ['ZAISU_SAGE_SIDE:left', 33, 14],
  ['ARCADE_MACHINE', 35, 12], ['ARCADE_MACHINE', 36, 12], ['GACHAPON', 37, 12],
  ['BILLIARD_TABLE', 36, 16],
  ['FOOSBALL', 43, 13],
  ['SOFA_RENDAH', 44, 16], ['MEJA_BULAT', 44, 17], ['BEAN_BAG_OAT', 43, 18], ['BEAN_BAG_SAGE', 45, 18], ['BEAN_BAG_LIAT', 44, 20], ['BEAN_BAG_INDIGO', 46, 20],
  ['AKARI', 47, 17], ['PAKIS', 47, 12], ['BAMBU_POT', 30, 19],

  // Dojo: lajur kayu untuk treadmill & dumbel, tatami untuk latihan, cermin & rak bokken
  ['GYM_MIRROR', 2, 21], ['RAK_BOKKEN', 8, 21], ['PLAKAT_DOJO', 10, 21],
  ['TREADMILL', 2, 23], ['TREADMILL', 4, 23], ['DUMBBELL_RACK', 9, 23], ['WEIGHT_BENCH', 12, 23],
  ['PUNCH_BAG', 11, 29],
  ['ZABUTON_SAGE', 4, 32], ['ZABUTON_LIAT', 6, 32], ['ZABUTON_OAT', 8, 32],
  ['BONSAI', 2, 31], ['BAMBU_POT', 12, 30],

  // Taman Onsen: fasad dengan noren & lentera, engawa, kolam onsen, bambu, pinus, maple, karesansui
  ['JENDELA_SHOJI', 15, 21], ['PLAKAT_ONSEN', 19, 21], ['CHOCHIN', 24, 21], ['CHOCHIN', 27, 21], ['NOREN_YU', 28, 21],
  ['JENDELA_SHOJI', 32, 21], ['CHOCHIN', 37, 21], ['CHOCHIN', 40, 21], ['JENDELA_SHOJI', 43, 21], ['KOKEDAMA', 46, 21],
  ['RAK_HANDUK', 21, 23], ['OKE', 22, 23],
  ['KURSI_DEK', 44, 23], ['KURSI_DEK', 46, 23],
  ['ONSEN', 22, 25],
  ['WAGASA', 14, 23], ['BANGKU_NODATE', 16, 24], ['RUMPUN_BAMBU', 14, 25],
  ['SHISHI_ODOSHI', 15, 29], ['TORO', 17, 29], ['PINUS', 18, 29], ['RUMPUN_BAMBU', 14, 29], ['SEMAK_BUNGA', 16, 32],
  ['MOMIJI', 35, 25], ['TORO', 38, 26], ['OKE', 34, 31],
  ['BATU_KARESANSUI', 42, 28], ['BATU_SEDANG', 40, 31], ['BATU_KECIL', 46, 27],
  ['SEMAK_BUNGA', 36, 32], ['SEMAK', 44, 32], ['SEMAK_BESAR', 31, 32], ['SEMAK', 21, 32],
  ['BATU_BESAR', 23, 31], ['BATU_KECIL', 28, 32], ['RUMPUN_BAMBU', 46, 29],
  ...Array.from({ length: 17 }, (_, i) => ['PAGAR_BAMBU', 14 + i * 2, 33]),
]

// Hewan peliharaan bawaan pixel-agents, berkeliaran di kantor.
const PETS = ['gitcat', 'claudio']

/** Baca ukuran footprint semua jenis furnitur (bawaan + kustom) dari manifest. */
function bacaKatalog(dirs) {
  const katalog = new Map()
  const tambah = (m, root) => {
    if (m.type === 'asset') {
      katalog.set(m.id, {
        fw: m.footprintW, fh: m.footprintH, bg: root.backgroundTiles ?? 0,
        dinding: !!root.canPlaceOnWalls, permukaan: !!root.canPlaceOnSurfaces,
        kursi: root.category === 'chairs',
      })
    }
    for (const child of m.members ?? []) tambah(child, root)
  }
  for (const dir of dirs) {
    for (const item of fs.readdirSync(dir)) {
      const f = path.join(dir, item, 'manifest.json')
      if (fs.existsSync(f)) { const m = JSON.parse(fs.readFileSync(f, 'utf8')); tambah(m, m) }
    }
  }
  return katalog
}

/**
 * Semua kursi harus bisa didatangi karakter dari Ruang Kerja (tanpa menembus dinding atau
 * furnitur). Kursi yang terkurung membuat karyawan tidak bisa pindah ke sana -- misalnya
 * Ruang Rapat yang pintunya tertutup sofa. Mengembalikan daftar masalah.
 */
function cekJangkauan(layout, katalog) {
  const { cols, rows, tiles, areaTiles, furniture } = layout
  const idx = (c, r) => r * cols + c
  const terhalang = new Set()
  const kursi = []
  for (const f of furniture) {
    const info = katalog.get(f.type.replace(/:left$/, ''))
    if (!info || info.dinding || info.permukaan) continue
    for (let r = f.row + info.bg; r < f.row + info.fh; r++) for (let c = f.col; c < f.col + info.fw; c++) terhalang.add(idx(c, r))
    if (info.kursi) kursi.push(f)
  }
  const bisaDiinjak = i => tiles[i] !== WALL && tiles[i] !== VOID && !terhalang.has(i)
  const mulai = areaTiles.findIndex((a, i) => a === 'Ruang Kerja' && bisaDiinjak(i))
  if (mulai < 0) return ['tidak ada lantai kosong di Ruang Kerja']
  const tercapai = new Set([mulai])
  const antre = [mulai]
  while (antre.length) {
    const i = antre.shift()
    const c = i % cols, r = Math.floor(i / cols)
    for (const [dc, dr] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nc = c + dc, nr = r + dr, j = idx(nc, nr)
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows || tercapai.has(j) || !bisaDiinjak(j)) continue
      tercapai.add(j)
      antre.push(j)
    }
  }
  const masalah = []
  for (const f of kursi) {
    const c = f.col, r = f.row
    const dekat = [[c, r - 1], [c, r + 1], [c - 1, r], [c + 1, r]].some(([x, y]) => tercapai.has(idx(x, y)))
    if (!dekat) masalah.push(`${f.type} (${c},${r}) di ${areaTiles[idx(c, r)] ?? 'luar ruangan'} tidak bisa didatangi -- jalannya tertutup furnitur/dinding`)
  }
  return masalah
}

/** Periksa denah lain (mis. ~/.pixel-agents/layout.json yang diedit lewat editor Layout). */
export function periksaJangkauan(layout, furnitureDirs) {
  return cekJangkauan(layout, bacaKatalog(furnitureDirs))
}

/** Variasi nada kecil yang tetap (deterministik) per tile untuk lantai alami. */
function variasi(warna, c, r) {
  const k = acakTile(c, r)
  return { ...warna, h: warna.h + ((k % 5) - 2), b: warna.b + (((k >> 3) % 5) - 2) }
}

export function buildLayout(furnitureDirs) {
  const n = COLS * ROWS
  const tiles = Array(n).fill(VOID)
  const tileColors = Array(n).fill(null)
  const areaTiles = Array(n).fill(null)
  const idx = (c, r) => r * COLS + c

  for (let r = 1; r <= ROWS - 2; r++) for (let c = 1; c <= COLS - 2; c++) { tiles[idx(c, r)] = WALL; tileColors[idx(c, r)] = DINDING.plester }
  const ruang = Object.fromEntries(RUANG.map(x => [x.label, x]))
  for (const x of RUANG) {
    for (let r = x.r[0]; r <= x.r[1]; r++) for (let c = x.c[0]; c <= x.c[1]; c++) {
      tiles[idx(c, r)] = x.lantai
      tileColors[idx(c, r)] = x.warna
      areaTiles[idx(c, r)] = x.label
    }
  }
  for (const [c0, r0, w, h, jenis, warna] of MOTIF) {
    for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w; c++) { tiles[idx(c, r)] = jenis; tileColors[idx(c, r)] = warna }
  }
  for (const { tiles: ts, ke } of PINTU) {
    for (const [c, r] of ts) { tiles[idx(c, r)] = ruang[ke].lantai; tileColors[idx(c, r)] = ruang[ke].warna; areaTiles[idx(c, r)] = ke }
  }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const i = idx(c, r)
    if (tiles[i] === T.KAYU_LEBAR) tiles[i] = jenisKayu(c, r)
    if (ALAMI.has(tiles[i]) && tileColors[i]) tileColors[i] = variasi(tileColors[i], c, r)
  }
  // Warna dinding mengikuti ruangan yang melihatnya (sisi depan dinding = ruangan di bawahnya).
  // Dinding batas taman (bawah & kanan) berwarna kayu gelap seperti pagar.
  for (let r = 1; r <= ROWS - 2; r++) for (let c = 1; c <= COLS - 2; c++) {
    if (tiles[idx(c, r)] !== WALL) continue
    const tetangga = [[c, r + 1], [c, r + 2], [c - 1, r], [c + 1, r], [c, r - 1]]
    const lbl = tetangga.map(([x, y]) => areaTiles[idx(x, y)]).find(Boolean)
    if (lbl) tileColors[idx(c, r)] = ruang[lbl].dinding
    if (lbl === 'Onsen' && (r === ROWS - 2 || c === COLS - 2)) tileColors[idx(c, r)] = DINDING.pagar
  }

  // Validasi: footprint di dalam peta, tidak bertumpuk, tidak menembus dinding.
  const katalog = bacaKatalog(furnitureDirs)
  const terisi = new Map()
  const masalah = []
  const furniture = FURNITUR.map(([type, col, row, warna], i) => {
    const info = katalog.get(type.replace(/:left$/, ''))
    if (!info) { masalah.push(`jenis tidak dikenal: ${type}`); return null }
    if (!info.dinding && !info.permukaan) {
      for (let r = row + info.bg; r < row + info.fh; r++) for (let c = col; c < col + info.fw; c++) {
        const t = tiles[idx(c, r)]
        if (t === WALL || t === VOID) masalah.push(`${type} (${col},${row}) menabrak dinding di (${c},${r})`)
        const k = `${c},${r}`
        if (terisi.has(k)) masalah.push(`${type} (${col},${row}) bertumpuk dengan ${terisi.get(k)} di (${c},${r})`)
        terisi.set(k, type)
      }
    }
    return { uid: `f-kantor-${String(i).padStart(3, '0')}`, type, col, row, ...(warna ? { color: warna } : {}) }
  }).filter(Boolean)

  const layout = {
    version: 1,
    cols: COLS,
    rows: ROWS,
    layoutRevision: VERSI_DENAH,
    tiles,
    tileColors,
    furniture,
    areas: RUANG.map(x => ({ label: x.label, color: x.area })),
    areaTiles,
    pets: PETS.map(petType => ({ id: `kantor-${petType}`, petType })),
  }
  masalah.push(...cekJangkauan(layout, katalog))
  return { layout, masalah }
}
