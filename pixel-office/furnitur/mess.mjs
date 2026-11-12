// Furnitur Mess (kamar istirahat karyawan): futon di atas tatami, satu warna per karyawan.
// Saat kuota Claude habis, karyawan berjalan ke futonnya dan tidur (lihat aktivitas.js: jenis
// furnitur FUTON_* ke-n di denah milik karyawan ke-n di tools/karyawan.json).
import { Spr, shade } from '../lib/sprite.mjs'
import { P, alfa } from '../lib/bahan.mjs'

/**
 * Futon 1x2 tile dilihat dari atas: alas linen, bantal di tile atas, selimut berlipat di tile
 * bawah. Kepala karakter yang tidur digambar di atas bantal (16 px teratas), jadi selimut baru
 * mulai di baris 14.
 */
function futon(ramp) {
  return () => {
    const s = new Spr(16, 32)
    s.hl(2, 31, 12, P.bayang)                                     // bayangan tipis di tatami
    s.rrect(1, 1, 14, 30, P.linen3).rrect(2, 2, 12, 28, P.linen1) // alas (shikibuton)
    s.hl(3, 2, 10, P.linen0)                                      // cahaya dari kiri-atas
    s.rrect(4, 4, 8, 7, P.linen3).rrect(4, 3, 8, 7, P.linen0)     // bantal + bayangannya
    s.hl(5, 9, 6, P.linen2)
    s.rrect(1, 14, 14, 17, ramp[2]).rect(2, 14, 12, 16, ramp[1])  // selimut (kakebuton)
    s.rect(2, 14, 12, 3, ramp[0]).hl(2, 17, 12, ramp[2])          // lipatan di tepi atas
    for (let y = 20; y < 29; y += 4) for (let x = 4; x < 13; x += 4) s.px(x, y, ramp[2])   // jahitan kapas
    s.vl(13, 18, 11, alfa(ramp[2], 0.55))                         // sisi kanan sedikit teduh
    return s
  }
}

export const SINGLE = [
  ['FUTON_SAGE', 'Futon Sage', 'decor', futon([P.sage1, P.sage2, P.sage3]), 1, 2, 0],
  ['FUTON_SAKURA', 'Futon Sakura', 'decor', futon([P.sakura0, P.sakura1, shade(P.sakura1, -0.18)]), 1, 2, 0],
  ['FUTON_MATCHA', 'Futon Matcha', 'decor', futon([P.matcha1, P.matcha2, P.matcha3]), 1, 2, 0],
  ['FUTON_INDIGO', 'Futon Indigo', 'decor', futon([P.aizome0, P.aizome1, P.aizome2]), 1, 2, 0],
  ['FUTON_LIAT', 'Futon Tanah Liat', 'decor', futon([P.liat0, P.liat1, P.liat2]), 1, 2, 0],
  ['FUTON_EMAS', 'Futon Kuning Emas', 'decor', futon([P.emas0, P.emas1, P.emas2]), 1, 2, 0],
]
