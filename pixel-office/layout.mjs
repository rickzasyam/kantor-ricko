// Denah Kantor Ricko untuk pixel-agents (format layout.json versi 1).
// Gaya kantor gen-Z: lantai & dinding pastel per ruangan, aksen neon, banyak tempat main.
//
//   ┌──────────┬─────────┬──────────────┬───────────┐
//   │  Ruang   │ Ruang   │ Ruang Rapat  │   Kafe    │   baris 2-10
//   │  Ricko   │ Manajer │ (brainstorm) │           │
//   ├──────────┴─────────┼──────┬───────┴───────────┤   dinding baris 11
//   │    Ruang Kerja     │Lounge│    Ruang Game     │   baris 12-21
//   ├─────────┬──────────┴──────┴───────────────────┤   dinding baris 22
//   │   Gym   │          Kolam Renang               │   baris 23-33
//   └─────────┴─────────────────────────────────────┘
//
// Catatan tampilan: dinding digambar 2 tile tinggi, jadi baris tepat di atas dinding
// horizontal (10, 21) tertutup puncak dinding -- jangan taruh furnitur penting di sana.
// Barang dinding untuk ruangan di bawah dinding baris N diletakkan di baris N-1.
import fs from 'node:fs'
import path from 'node:path'

/** Naikkan kalau desain denah berubah besar: pasang-pixel-office.ps1 lalu memasang denah ini
 *  sekali (denah lama di-backup), walaupun Pak Ricko pernah mengedit denah lewat editor Layout. */
export const VERSI_DENAH = 2

const COLS = 50
const ROWS = 36
const VOID = 255
const WALL = 0

// Jenis lantai = nomor pola floor_N + 1.
const POLOS = 1, BINGKAI = 2, UBIN = 4, UBIN_TERANG = 5, PAPAN = 7, KOTAK_KECIL = 8, KOTAK_BESAR = 9

const DINDING_DASAR = { h: 35, s: 18, b: 10, c: -25 }

const RUANG = [
  { label: 'Ruang Ricko', c: [2, 11], r: [2, 10], lantai: PAPAN, warna: { h: 30, s: 40, b: 5, c: -75 }, dinding: { h: 45, s: 60, b: 15, c: -25 }, area: '#ffd93d' },
  { label: 'Ruang Manajer', c: [13, 21], r: [2, 10], lantai: PAPAN, warna: { h: 32, s: 38, b: 10, c: -75 }, dinding: { h: 200, s: 45, b: 15, c: -25 }, area: '#f6ad55' },
  { label: 'Ruang Rapat', c: [23, 34], r: [2, 10], lantai: POLOS, warna: { h: 258, s: 45, b: 22, c: -55 }, dinding: { h: 258, s: 50, b: 18, c: -25 }, area: '#63b3ed' },
  { label: 'Kafe', c: [36, 47], r: [2, 10], lantai: KOTAK_KECIL, warna: { h: 160, s: 38, b: 18, c: -45 }, dinding: { h: 155, s: 45, b: 12, c: -25 }, area: '#68d391' },
  { label: 'Ruang Kerja', c: [2, 21], r: [12, 21], lantai: PAPAN, warna: { h: 32, s: 38, b: 12, c: -78 }, dinding: { h: 20, s: 60, b: 18, c: -25 }, area: '#4fd1c5' },
  { label: 'Lounge', c: [23, 28], r: [12, 21], lantai: POLOS, warna: { h: 18, s: 60, b: 22, c: -50 }, dinding: { h: 330, s: 50, b: 18, c: -25 }, area: '#a0aec0' },
  { label: 'Ruang Game', c: [30, 47], r: [12, 21], lantai: POLOS, warna: { h: 265, s: 42, b: -42, c: -80 }, dinding: { h: 268, s: 40, b: -20, c: -25 }, area: '#b794f4' },
  { label: 'Gym', c: [2, 12], r: [23, 33], lantai: UBIN, warna: { h: 225, s: 12, b: -38, c: -70 }, dinding: { h: 350, s: 55, b: 10, c: -25 }, area: '#fc8181' },
  { label: 'Kolam Renang', c: [14, 47], r: [23, 33], lantai: UBIN, warna: { h: 40, s: 30, b: 14, c: -60 }, dinding: { h: 195, s: 45, b: 18, c: -25 }, area: '#90cdf4' },
]

// Petak lantai bermotif di dalam ruangan (karpet, matras yoga, rumput): [kolom, baris, lebar, tinggi, jenis, warna].
const MOTIF = [
  [25, 3, 8, 7, KOTAK_BESAR, { h: 40, s: 70, b: 25, c: -60 }],   // karpet kuning di bawah meja brainstorm
  [24, 13, 4, 3, KOTAK_BESAR, { h: 330, s: 55, b: 25, c: -55 }], // karpet pink lounge
  [31, 13, 4, 4, BINGKAI, { h: 300, s: 60, b: -20, c: -60 }],    // karpet gaming
  [3, 30, 1, 2, BINGKAI, { h: 330, s: 60, b: 15, c: -40 }],      // matras yoga pink
  [5, 30, 1, 2, BINGKAI, { h: 160, s: 55, b: 10, c: -40 }],      // matras yoga mint
  [7, 30, 1, 2, BINGKAI, { h: 45, s: 70, b: 15, c: -40 }],       // matras yoga kuning
  [14, 32, 34, 2, POLOS, { h: 110, s: 42, b: -12, c: -70 }],     // taman rumput
  [38, 7, 2, 2, UBIN_TERANG, { h: 30, s: 30, b: 25, c: -60 }],   // alas meja kafe
  [43, 7, 2, 2, UBIN_TERANG, { h: 30, s: 30, b: 25, c: -60 }],
]

// Pintu: tile dinding yang dijadikan lantai ruangan tujuan.
const PINTU = [
  { tiles: [[9, 11], [10, 11]], ke: 'Ruang Kerja' },
  { tiles: [[19, 11], [20, 11]], ke: 'Ruang Kerja' },
  { tiles: [[25, 11], [26, 11]], ke: 'Lounge' },
  { tiles: [[35, 7], [35, 8]], ke: 'Kafe' },
  { tiles: [[40, 11], [41, 11]], ke: 'Ruang Game' },
  { tiles: [[22, 13]], ke: 'Lounge' },
  { tiles: [[22, 16], [22, 17]], ke: 'Lounge' },
  { tiles: [[29, 16], [29, 17]], ke: 'Lounge' },
  { tiles: [[6, 22], [7, 22]], ke: 'Gym' },
  { tiles: [[25, 22], [26, 22]], ke: 'Kolam Renang' },
  { tiles: [[38, 22], [39, 22]], ke: 'Kolam Renang' },
  { tiles: [[13, 27], [13, 28]], ke: 'Kolam Renang' },
]

// [jenis, kolom, baris] -- kolom/baris = pojok kiri-atas footprint.
const FURNITUR = [
  // Ruang Ricko (Owner): neon nama, akuarium, pojok santai bean bag
  ['NEON_RICKO', 3, 0], ['DOUBLE_BOOKSHELF', 8, 0],
  ['PLANT', 2, 2], ['AQUARIUM', 10, 2],
  ['EXEC_DESK', 4, 4], ['EXEC_CHAIR_FRONT', 5, 3], ['MODERN_PC_BACK', 6, 4], ['COFFEE', 4, 5],
  ['SOFA_SIDE', 2, 7], ['COFFEE_TABLE', 3, 7], ['BEAN_BAG_PINK', 5, 7], ['BEAN_BAG_SKY', 6, 8],
  ['LARGE_PLANT', 9, 7],

  // Ruang Manajer (Pak Asep): papan kanban sticky note
  ['STICKY_WALL', 14, 0], ['POSTER_ROCKET', 17, 0], ['DOUBLE_BOOKSHELF', 19, 0],
  ['PLANT', 13, 2],
  ['EXEC_DESK', 15, 4], ['EXEC_CHAIR_FRONT', 16, 3], ['MODERN_PC_BACK', 17, 4], ['COFFEE', 18, 5],
  ['SOFA_SIDE', 13, 7], ['COFFEE_TABLE', 14, 7], ['BEAN_BAG_MINT', 16, 8],
  ['LARGE_PLANT', 20, 7],

  // Ruang Rapat: meja brainstorm + kursi pop warna-warni (kursi paling kiri = kepala rapat)
  ['NEON_IDE', 23, 0], ['PRESENTATION_TV', 27, 0], ['STICKY_WALL', 31, 0],
  ['BRAINSTORM_TABLE', 26, 5],
  ...['CORAL', 'SUNNY', 'MINT', 'SKY', 'LILAC', 'CORAL'].map((w, i) => [`POP_CHAIR_${w}_FRONT`, 26 + i, 4]),
  ...['MINT', 'LILAC', 'CORAL', 'SUNNY', 'SKY', 'MINT'].map((w, i) => [`POP_CHAIR_${w}_BACK`, 26 + i, 7]),
  ['POP_CHAIR_SUNNY_SIDE', 25, 5], ['POP_CHAIR_LILAC_SIDE:left', 32, 5],
  ['LARGE_PLANT', 23, 7], ['LARGE_PLANT', 33, 7], ['BEAN_BAG_LILAC', 23, 2], ['BEAN_BAG_PINK', 34, 2],

  // Kafe: coffee bar, kursi bar, meja nongkrong
  ['NEON_KOPI', 37, 0], ['MENU_BOARD', 41, 0], ['CLOCK', 44, 0],
  ['COFFEE_BAR', 37, 2], ['KITCHEN_COUNTER', 41, 2], ['FRIDGE', 46, 2], ['WATER_DISPENSER', 47, 2],
  ['BAR_STOOL_CORAL', 38, 4], ['BAR_STOOL_SUNNY', 40, 4],
  ['SMALL_TABLE_FRONT', 38, 7], ['BAR_STOOL_SUNNY', 37, 8], ['BAR_STOOL_CORAL', 40, 8],
  ['SMALL_TABLE_FRONT', 43, 7], ['BAR_STOOL_CORAL', 42, 8], ['BAR_STOOL_SUNNY', 45, 8],
  ['PLANT_2', 47, 7], ['BIN', 36, 9],

  // Ruang Kerja (6 meja, 5 karyawan + 1 cadangan)
  ['POSTER_SMILE', 3, 10], ['CLOCK', 6, 10], ['STICKY_WALL', 12, 10], ['NEON_VIBES', 15, 10],
  ...[[3, 13], [9, 13], [15, 13], [3, 17], [9, 17], [15, 17]].flatMap(([c, r]) => [
    ['MODERN_DESK', c, r], ['MODERN_PC_FRONT_OFF', c + 1, r], ['OFFICE_CHAIR', c + 1, r + 2],
  ]),
  ['COFFEE', 11, 14], ['COFFEE', 5, 18], ['COFFEE', 17, 18],
  ['PLANT', 2, 13], ['PLANT', 21, 13], ['LARGE_PLANT', 19, 19], ['WATER_DISPENSER', 2, 19],

  // Lounge: sofa, kursi telur gantung, bean bag
  ['PLANT', 28, 12],
  ['SOFA_FRONT', 25, 13], ['SOFA_SIDE', 24, 14], ['COFFEE_TABLE', 25, 14], ['SOFA_SIDE:left', 27, 14],
  ['EGG_CHAIR', 27, 18], ['BEAN_BAG_PINK', 24, 19], ['BEAN_BAG_SKY', 23, 20],

  // Ruang Game: PS5, arcade, biliar, foosball
  ['GAME_TV', 31, 10], ['POSTER_WAVE', 35, 10], ['NEON_SIGN', 44, 10],
  ['TV_CONSOLE', 31, 12], ['GAMING_CHAIR', 31, 13], ['GAMING_CHAIR', 33, 13], ['BEAN_BAG', 32, 15],
  ['ARCADE_MACHINE', 36, 12], ['ARCADE_MACHINE', 37, 12],
  ['BILLIARD_TABLE', 36, 16],
  ['FOOSBALL', 43, 13],
  ['ARCADE_MACHINE', 38, 12], ['POSTER_ROCKET', 42, 10], ['POSTER_SMILE', 47, 10],
  ['BEAN_BAG_LILAC', 42, 18], ['BEAN_BAG_MINT', 43, 19], ['BEAN_BAG_SKY', 44, 18], ['LARGE_PLANT', 46, 18],
  ['SOFA_FRONT', 42, 16], ['SOFA_FRONT', 44, 16],

  // Gym: treadmill, dumbbell, bench, samsak, matras yoga (motif lantai)
  ['GYM_MIRROR', 2, 21], ['NEON_GYM', 9, 21],
  ['TREADMILL', 2, 23], ['TREADMILL', 4, 23], ['TREADMILL', 9, 23], ['TREADMILL', 11, 23],
  ['DUMBBELL_RACK', 2, 27], ['WEIGHT_BENCH', 6, 27], ['PUNCH_BAG', 10, 27],
  ['WATER_DISPENSER', 12, 31], ['PLANT', 11, 30],

  // Kolam Renang
  ['SWIMMING_POOL', 22, 25],
  ['SUN_LOUNGER', 34, 26], ['SUN_LOUNGER', 35, 26], ['BEACH_UMBRELLA', 36, 24],
  ['SUN_LOUNGER', 38, 26], ['SUN_LOUNGER', 39, 26], ['BEACH_UMBRELLA', 40, 24],
  ['SUN_LOUNGER', 42, 26], ['SUN_LOUNGER', 43, 26],
  ['PALM_TREE', 15, 23], ['PALM_TREE', 19, 23], ['PALM_TREE', 45, 23], ['PALM_TREE', 15, 28], ['PALM_TREE', 45, 28],
  ['BEAN_BAG', 17, 30], ['BEAN_BAG_PINK', 18, 31], ['BEAN_BAG_SKY', 33, 31],
  ['POSTER_WAVE', 16, 21], ['HANGING_PLANT', 21, 21], ['NEON_CHILL', 30, 21], ['HANGING_PLANT', 35, 21],
  ['POSTER_SMILE', 42, 21], ['HANGING_PLANT', 45, 21],
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

export function buildLayout(furnitureDirs) {
  const n = COLS * ROWS
  const tiles = Array(n).fill(VOID)
  const tileColors = Array(n).fill(null)
  const areaTiles = Array(n).fill(null)
  const idx = (c, r) => r * COLS + c

  for (let r = 1; r <= ROWS - 2; r++) for (let c = 1; c <= COLS - 2; c++) { tiles[idx(c, r)] = WALL; tileColors[idx(c, r)] = DINDING_DASAR }
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
  // Warna dinding mengikuti ruangan yang melihatnya (sisi depan dinding = ruangan di bawahnya).
  for (let r = 1; r <= ROWS - 2; r++) for (let c = 1; c <= COLS - 2; c++) {
    if (tiles[idx(c, r)] !== WALL) continue
    const tetangga = [[c, r + 1], [c, r + 2], [c - 1, r], [c + 1, r], [c, r - 1]]
    const lbl = tetangga.map(([x, y]) => areaTiles[idx(x, y)]).find(Boolean)
    if (lbl) tileColors[idx(c, r)] = ruang[lbl].dinding
  }

  // Validasi: footprint di dalam peta, tidak bertumpuk, tidak menembus dinding.
  const katalog = bacaKatalog(furnitureDirs)
  const terisi = new Map()
  const masalah = []
  const furniture = FURNITUR.map(([type, col, row], i) => {
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
    return { uid: `f-kantor-${String(i).padStart(3, '0')}`, type, col, row }
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
