// Bangun semua aset visual Kantor Ricko:
//   aset/assets/furniture/*   furnitur kustom (dimuat pixel-agents sebagai folder aset luar)
//   aset/assets/characters/*  karakter kustom (palette 6 dst.)
//   layout-kantor.json        denah kantor
//   karakter.json             nama folder karyawan -> nomor karakter (dibaca patch pixel-agents)
//
// Jalankan: node bangun.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildFurniture } from './furnitur.mjs'
import { buildCharacters, PEMETAAN_KARAKTER } from './karakter.mjs'
import { buildLayout } from './layout.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ASET = path.join(HERE, 'aset', 'assets')
const BAWAAN = path.join(HERE, 'node_modules', 'pixel-agents', 'dist', 'assets', 'furniture')

const furnitur = buildFurniture(path.join(ASET, 'furniture'))
const jumlahKarakter = buildCharacters(path.join(ASET, 'characters'))
const { layout, masalah } = buildLayout([BAWAAN, path.join(ASET, 'furniture')])

fs.writeFileSync(path.join(HERE, 'layout-kantor.json'), JSON.stringify(layout) + '\n')
fs.writeFileSync(path.join(HERE, 'karakter.json'), JSON.stringify(PEMETAAN_KARAKTER, null, 2) + '\n')

console.log(`Furnitur kustom : ${furnitur.length} item`)
console.log(`Karakter kustom : ${jumlahKarakter}`)
console.log(`Denah           : ${layout.cols}x${layout.rows} tile, ${layout.furniture.length} furnitur, ${layout.areas.length} ruangan`)
if (masalah.length) {
  console.log(`\nMASALAH DENAH (${masalah.length}):`)
  for (const m of masalah) console.log(`  - ${m}`)
  process.exitCode = 1
} else {
  console.log('Validasi denah  : OK (tidak ada tumpukan / tabrakan dinding)')
}
