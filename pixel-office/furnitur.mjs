// Furnitur kustom Kantor Ricko: digambar piksel demi piksel, lalu ditulis sebagai
// paket aset pixel-agents (assets/furniture/<ID>/manifest.json + PNG).
//
// Gaya: kantor Jepang yang hangat (Japandi) -- oak, linen, rotan, batu, sage & matcha.
// Gambar tiap barang ada di furnitur/*.mjs per area; berkas ini hanya merakit manifest-nya.
import fs from 'node:fs'
import path from 'node:path'
import * as kerja from './furnitur/kerja.mjs'
import * as dekor from './furnitur/dekor.mjs'
import * as matcha from './furnitur/matcha.mjs'
import * as main from './furnitur/main.mjs'
import * as taman from './furnitur/taman.mjs'

const MODUL = [kerja, dekor, matcha, main, taman]

/** id, nama, kategori, sprite, footprint (tile), baris latar, opsi penempatan */
const SINGLE = MODUL.flatMap(m => m.SINGLE ?? [])

/**
 * Furnitur beranimasi terus (animasi ambien, lihat patch-pixel-agents.mjs): id, nama, kategori,
 * fungsi gambar(frame), jumlah frame, footprint, baris latar, opsi. Frame pertama memakai id
 * barangnya sendiri supaya denah cukup menyebut id itu.
 */
const ANIMASI = MODUL.flatMap(m => m.ANIMASI ?? [])

/** Kursi berputar (depan/belakang/samping, samping dicerminkan otomatis): id, nama, gambar. */
const ROTASI = MODUL.flatMap(m => m.ROTASI ?? [])

function asset(id, spr, fw, fh, extra = {}) {
  return { type: 'asset', id, file: `${id}.png`, width: spr.w, height: spr.h, footprintW: fw, footprintH: fh, ...extra }
}

export function buildFurniture(outDir) {
  fs.rmSync(outDir, { recursive: true, force: true })
  const ids = []
  const cekUnik = id => { if (ids.includes(id)) throw new Error(`id furnitur ganda: ${id}`); ids.push(id) }

  for (const [id, name, category, draw, fw, fh, bg, opt = {}] of SINGLE) {
    const dir = path.join(outDir, id)
    const spr = draw()
    if (spr.w !== fw * 16 && !opt.walls) console.warn(`peringatan: lebar ${id} ${spr.w}px bukan ${fw} tile`)
    spr.save(path.join(dir, `${id}.png`))
    const manifest = {
      id, name, category, type: 'asset',
      canPlaceOnWalls: !!opt.walls, canPlaceOnSurfaces: !!opt.surfaces, backgroundTiles: bg,
      width: spr.w, height: spr.h, footprintW: fw, footprintH: fh,
    }
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
    cekUnik(id)
  }

  for (const [id, name, category, draw, n, fw, fh, bg, opt = {}] of ANIMASI) {
    const dir = path.join(outDir, id)
    const frames = Array.from({ length: n }, (_, i) => [i ? `${id}_ANIM_${i + 1}` : id, draw(i)])
    for (const [nama, spr] of frames) spr.save(path.join(dir, `${nama}.png`))
    const s = frames[0][1]
    const manifest = {
      id, name, category, type: 'group', groupType: 'animation',
      canPlaceOnWalls: !!opt.walls, canPlaceOnSurfaces: !!opt.surfaces, backgroundTiles: bg,
      members: frames.map(([nama], i) => asset(nama, s, fw, fh, { frame: i })),
    }
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
    cekUnik(id)
  }

  // PC: menyala (animasi 3 frame) saat karyawan bekerja, mati saat menganggur.
  {
    const id = 'MODERN_PC'
    const dir = path.join(outDir, id)
    const sprites = kerja.pcSprites()
    for (const [name, spr] of Object.entries(sprites)) spr.save(path.join(dir, `${name}.png`))
    const s = sprites.MODERN_PC_BACK
    const manifest = {
      id, name: 'Monitor Dudukan Kayu', category: 'electronics', type: 'group', groupType: 'rotation',
      rotationScheme: '3-way-mirror', canPlaceOnWalls: false, canPlaceOnSurfaces: true, backgroundTiles: 1,
      members: [
        {
          type: 'group', groupType: 'state', orientation: 'front',
          members: [
            {
              type: 'group', groupType: 'animation', state: 'on',
              members: [1, 2, 3].map((n, i) => asset(`MODERN_PC_FRONT_ON_${n}`, s, 1, 2, { frame: i })),
            },
            asset('MODERN_PC_FRONT_OFF', s, 1, 2, { state: 'off' }),
          ],
        },
        asset('MODERN_PC_BACK', s, 1, 2, { orientation: 'back' }),
        asset('MODERN_PC_SIDE', s, 1, 2, { orientation: 'side', mirrorSide: true }),
      ],
    }
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
    cekUnik(id)
  }

  for (const [id, name, gambar] of ROTASI) {
    const dir = path.join(outDir, id)
    const sprites = { [`${id}_FRONT`]: gambar.depan(), [`${id}_BACK`]: gambar.belakang(), [`${id}_SIDE`]: gambar.samping() }
    for (const [nama, spr] of Object.entries(sprites)) spr.save(path.join(dir, `${nama}.png`))
    const s = sprites[`${id}_FRONT`]
    const manifest = {
      id, name, category: 'chairs', type: 'group', groupType: 'rotation',
      rotationScheme: '3-way-mirror', canPlaceOnWalls: false, canPlaceOnSurfaces: false, backgroundTiles: 0,
      members: [
        asset(`${id}_FRONT`, s, 1, 1, { orientation: 'front' }),
        asset(`${id}_BACK`, s, 1, 1, { orientation: 'back' }),
        asset(`${id}_SIDE`, s, 1, 1, { orientation: 'side', mirrorSide: true }),
      ],
    }
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
    cekUnik(id)
  }

  return ids
}
