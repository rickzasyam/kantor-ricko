// Karakter tetap untuk tiap karyawan. 6 karakter bawaan pixel-agents (palette 0-5)
// ditambah karakter kustom hasil pewarnaan ulang (palette 6 dst., dimuat dari folder aset).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readPng, writePng } from './lib/sprite.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const BAWAAN = path.join(HERE, 'node_modules', 'pixel-agents', 'dist', 'assets', 'characters')

// Karakter bawaan:
//   0 = rambut cokelat, jas biru + dasi     3 = rambut putih, kemeja putih
//   1 = rambut ikal oranye, gaun hitam      4 = rambut cokelat jabrik, kemeja putih
//   2 = rambut afro, jaket oranye           5 = rambut hitam bob, baju merah
const KUSTOM = [
  {
    // palette 6 - Ayu: rambut panjang cokelat gelap, gaun pink
    dari: 1,
    warna: {
      '7e4b29': '2e1d16', 'be7743': '4a2e22', 'e39f5a': '6b4332', 'f1c084': '8a5a42',   // rambut
      '101010': '7a2e5c', '1a1a1a': '8e3a6c', '252525': 'b0508a', '2b2b2b': 'c2609a',   // gaun
    },
  },
  {
    // palette 7 - Ricko (Owner): rambut hitam klimis, jas charcoal
    dari: 0,
    warna: {
      '8f6439': '2b2523', '6d4726': '1e1a19', '6f4a2a': '201b1a', 'b18649': '3d3431', '84523a': '2a2220',  // rambut
      '114978': '3a3a44', '071c2e': '1c1c22', '0f406a': '30303a', '1164a9': '50505c',                    // jas
    },
  },
]

/** Nama folder sesi (seperti terbaca pixel-agents) -> nomor karakter. */
export const PEMETAAN_KARAKTER = {
  asep: 0,     // Pak Asep - Project Manager
  kokom: 1,    // Kokom - Akuntan
  joko: 2,     // Joko - Developer
  ujang: 4,    // Ujang - Spreadsheet
  neneng: 5,   // Neneng - Data & QA
  ayu: 6,      // Ayu - Designer (kustom)
  ricko: 7,    // Ricko - Owner (kustom)
}

export function buildCharacters(outDir) {
  fs.rmSync(outDir, { recursive: true, force: true })
  KUSTOM.forEach(({ dari, warna }, i) => {
    const png = readPng(path.join(BAWAAN, `char_${dari}.png`))
    for (let p = 0; p < png.data.length; p += 4) {
      if (png.data[p + 3] === 0) continue
      const key = [0, 1, 2].map(k => png.data[p + k].toString(16).padStart(2, '0')).join('')
      const baru = warna[key]
      if (baru) for (let k = 0; k < 3; k++) png.data[p + k] = parseInt(baru.slice(k * 2, k * 2 + 2), 16)
    }
    writePng(path.join(outDir, `char_${i}.png`), png)
  })
  return KUSTOM.length
}
