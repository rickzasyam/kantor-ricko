// Denah Kantor Ricko untuk pixel-agents (format layout.json versi 1).
//
//   ┌──────────┬─────────┬──────────────┬─────────┐
//   │  Ruang   │ Ruang   │ Ruang Rapat  │ Pantry  │   baris 2-10
//   │  Ricko   │ Manajer │              │         │
//   ├──────────┴─────────┼──────┬───────┴─────────┤   dinding baris 11
//   │    Ruang Kerja     │Lounge│   Ruang Game    │   baris 12-21
//   ├────────────────────┴──────┴─────────────────┤   dinding baris 22
//   │              Kolam Renang                   │   baris 23-31
//   └─────────────────────────────────────────────┘
//
// Catatan tampilan: dinding digambar 2 tile tinggi, jadi baris tepat di atas dinding
// horizontal (10, 21) tertutup puncak dinding -- jangan taruh furnitur penting di sana.
import fs from 'node:fs'
import path from 'node:path'

const COLS = 46
const ROWS = 34
const VOID = 255
const WALL = 0

// Jenis lantai = nomor pola floor_N + 1.
const POLOS = 1, UBIN = 4, PAPAN = 7, KOTAK_KECIL = 8

const WARNA_DINDING = { h: 35, s: 22, b: 0, c: -25 }

const RUANG = [
  { label: 'Ruang Ricko', c: [2, 11], r: [2, 10], lantai: PAPAN, warna: { h: 22, s: 38, b: -40, c: -80 }, area: '#ffd93d' },
  { label: 'Ruang Manajer', c: [13, 21], r: [2, 10], lantai: PAPAN, warna: { h: 28, s: 40, b: -28, c: -80 }, area: '#f6ad55' },
  { label: 'Ruang Rapat', c: [23, 34], r: [2, 10], lantai: POLOS, warna: { h: 222, s: 40, b: -45, c: -85 }, area: '#63b3ed' },
  { label: 'Pantry', c: [36, 43], r: [2, 10], lantai: KOTAK_KECIL, warna: { h: 190, s: 22, b: 2, c: -35 }, area: '#68d391' },
  { label: 'Ruang Kerja', c: [2, 21], r: [12, 21], lantai: PAPAN, warna: { h: 34, s: 32, b: 2, c: -82 }, area: '#4fd1c5' },
  { label: 'Lounge', c: [23, 28], r: [12, 21], lantai: UBIN, warna: { h: 210, s: 10, b: 2, c: -50 }, area: '#a0aec0' },
  { label: 'Ruang Game', c: [30, 43], r: [12, 21], lantai: POLOS, warna: { h: 265, s: 38, b: -48, c: -85 }, area: '#b794f4' },
  { label: 'Kolam Renang', c: [2, 43], r: [23, 31], lantai: UBIN, warna: { h: 40, s: 30, b: 12, c: -60 }, area: '#90cdf4' },
]

// Pintu: tile dinding yang dijadikan lantai ruangan tujuan.
const PINTU = [
  { tiles: [[9, 11], [10, 11]], ke: 'Ruang Kerja' },
  { tiles: [[19, 11], [20, 11]], ke: 'Ruang Kerja' },
  { tiles: [[25, 11], [26, 11]], ke: 'Lounge' },
  { tiles: [[39, 11], [40, 11]], ke: 'Ruang Game' },
  { tiles: [[22, 16], [22, 17]], ke: 'Lounge' },
  { tiles: [[29, 16], [29, 17]], ke: 'Lounge' },
  { tiles: [[25, 22], [26, 22]], ke: 'Kolam Renang' },
  { tiles: [[36, 22], [37, 22]], ke: 'Kolam Renang' },
]

const RUMPUT = { h: 110, s: 42, b: -12, c: -70 }

// [jenis, kolom, baris] -- kolom/baris = pojok kiri-atas footprint.
const FURNITUR = [
  // Ruang Ricko (Owner)
  ['LARGE_PAINTING', 3, 0], ['DOUBLE_BOOKSHELF', 7, 0],
  ['PLANT', 2, 2], ['AQUARIUM', 10, 2],
  ['EXEC_DESK', 4, 4], ['EXEC_CHAIR_FRONT', 5, 3], ['MODERN_PC_BACK', 6, 4], ['COFFEE', 4, 5],
  ['SOFA_SIDE', 2, 7], ['COFFEE_TABLE', 3, 7], ['SOFA_SIDE:left', 5, 7],
  ['LARGE_PLANT', 9, 7],

  // Ruang Manajer (Pak Asep)
  ['WHITEBOARD', 14, 0], ['SMALL_PAINTING', 17, 0], ['DOUBLE_BOOKSHELF', 19, 0],
  ['PLANT', 13, 2],
  ['EXEC_DESK', 15, 4], ['EXEC_CHAIR_FRONT', 16, 3], ['MODERN_PC_BACK', 17, 4], ['COFFEE', 18, 5],
  ['SOFA_SIDE', 13, 7], ['COFFEE_TABLE', 14, 7], ['CUSHIONED_CHAIR_SIDE:left', 16, 7],
  ['LARGE_PLANT', 20, 7],

  // Ruang Rapat
  ['LARGE_PAINTING', 24, 0], ['PRESENTATION_TV', 27, 0], ['LARGE_PAINTING', 32, 0],
  ['MEETING_TABLE', 26, 5],
  ...[26, 27, 28, 29, 30, 31].map(c => ['EXEC_CHAIR_FRONT', c, 4]),
  ...[26, 27, 28, 29, 30, 31].map(c => ['EXEC_CHAIR_BACK', c, 7]),
  ['EXEC_CHAIR_SIDE', 25, 5], ['EXEC_CHAIR_SIDE:left', 32, 5],
  ['LARGE_PLANT', 23, 7], ['LARGE_PLANT', 33, 7],

  // Pantry
  ['CLOCK', 41, 0],
  ['KITCHEN_COUNTER', 36, 2], ['COFFEE_MACHINE', 37, 2], ['COFFEE', 39, 3],
  ['FRIDGE', 41, 2], ['WATER_DISPENSER', 42, 2], ['PLANT_2', 43, 2],
  ['SMALL_TABLE_FRONT', 38, 6], ['CUSHIONED_CHAIR_SIDE', 37, 7], ['CUSHIONED_CHAIR_SIDE:left', 40, 7],
  ['BIN', 36, 8],

  // Ruang Kerja (6 meja, 5 karyawan + 1 cadangan)
  ['CLOCK', 6, 10], ['WHITEBOARD', 13, 10],
  ...[[3, 13], [9, 13], [15, 13], [3, 17], [9, 17], [15, 17]].flatMap(([c, r]) => [
    ['MODERN_DESK', c, r], ['MODERN_PC_FRONT_OFF', c + 1, r], ['OFFICE_CHAIR', c + 1, r + 2],
  ]),
  ['COFFEE', 11, 14], ['COFFEE', 5, 18], ['COFFEE', 17, 18],
  ['PLANT', 2, 13], ['PLANT', 21, 13], ['LARGE_PLANT', 20, 18], ['WATER_DISPENSER', 2, 19],

  // Lounge
  ['CACTUS', 23, 12], ['PLANT', 28, 12],
  ['SOFA_SIDE', 23, 18], ['COFFEE_TABLE', 24, 18], ['LARGE_PLANT', 27, 18],

  // Ruang Game
  ['GAME_TV', 31, 10], ['NEON_SIGN', 42, 10],
  ['TV_CONSOLE', 31, 12], ['GAMING_CHAIR', 31, 13], ['GAMING_CHAIR', 33, 13], ['BEAN_BAG', 32, 15],
  ['ARCADE_MACHINE', 36, 12], ['ARCADE_MACHINE', 37, 12],
  ['BILLIARD_TABLE', 36, 16],
  ['BEAN_BAG', 41, 14], ['BEAN_BAG', 42, 15], ['LARGE_PLANT', 42, 18],

  // Kolam Renang
  ['SWIMMING_POOL', 15, 25],
  ['SUN_LOUNGER', 27, 26], ['SUN_LOUNGER', 28, 26], ['BEACH_UMBRELLA', 29, 24],
  ['SUN_LOUNGER', 31, 26], ['SUN_LOUNGER', 32, 26], ['BEACH_UMBRELLA', 33, 24],
  ['SUN_LOUNGER', 35, 26], ['SUN_LOUNGER', 36, 26],
  ['PALM_TREE', 3, 23], ['PALM_TREE', 11, 23], ['PALM_TREE', 40, 23], ['PALM_TREE', 3, 27], ['PALM_TREE', 40, 27],
  ['BEAN_BAG', 8, 28], ['BEAN_BAG', 9, 29],
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

export function buildLayout(furnitureDirs) {
  const n = COLS * ROWS
  const tiles = Array(n).fill(VOID)
  const tileColors = Array(n).fill(null)
  const areaTiles = Array(n).fill(null)
  const idx = (c, r) => r * COLS + c

  for (let r = 1; r <= 32; r++) for (let c = 1; c <= 44; c++) { tiles[idx(c, r)] = WALL; tileColors[idx(c, r)] = WARNA_DINDING }
  const ruang = Object.fromEntries(RUANG.map(x => [x.label, x]))
  for (const x of RUANG) {
    for (let r = x.r[0]; r <= x.r[1]; r++) for (let c = x.c[0]; c <= x.c[1]; c++) {
      tiles[idx(c, r)] = x.lantai
      tileColors[idx(c, r)] = x.warna
      areaTiles[idx(c, r)] = x.label
    }
  }
  for (let c = 2; c <= 43; c++) for (const r of [30, 31]) { tiles[idx(c, r)] = POLOS; tileColors[idx(c, r)] = RUMPUT }   // taman
  for (const { tiles: ts, ke } of PINTU) {
    for (const [c, r] of ts) { tiles[idx(c, r)] = ruang[ke].lantai; tileColors[idx(c, r)] = ruang[ke].warna }
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
    layoutRevision: 1,
    tiles,
    tileColors,
    furniture,
    areas: RUANG.map(x => ({ label: x.label, color: x.area })),
    areaTiles,
    pets: PETS.map(petType => ({ id: `kantor-${petType}`, petType })),
  }
  return { layout, masalah }
}
