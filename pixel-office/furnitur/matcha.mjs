// Matcha bar: konter oak + batu, alat teh, rak keramik, lampu gantung rotan, bangku bar.
// Hijau matcha jadi warna identitas -- redup dan tanah, bukan hijau neon.
import { Spr } from '../lib/sprite.mjs'
import { P, acak, alfa, bayangan, kayuAtas, kayuDepan, daun } from '../lib/bahan.mjs'
import { anyaman } from './kerja.mjs'

const OAK_DEPAN = [P.oak2, P.oak3, P.oak4, P.oak5]

/** Mangkuk chawan dilihat dari samping-atas, berisi busa matcha. */
function chawan(s, cx, y, glasir) {
  s.oval(cx, y + 2.5, 3.4, 2.2, glasir[1]).hl(cx - 3, y + 1, 7, glasir[0])
  s.oval(cx, y + 1, 2.8, 0.9, P.matcha1).px(cx - 1, y + 1, P.matcha0)
  s.hl(cx - 2, y + 4, 5, glasir[2]).hl(cx - 1, y + 5, 3, P.bayang)
}

/** Gelas matcha latte berlapis: susu di bawah, matcha di tengah, busa di atas. */
function gelasLatte(s, x, y) {
  s.rect(x, y, 4, 7, alfa(P.linen0, 0.5)).vl(x, y, 7, alfa(P.linen0, 0.85))
  s.rect(x, y + 4, 4, 3, P.linen0).rect(x, y + 2, 4, 2, P.matcha2).hl(x, y + 1, 4, P.matcha1).hl(x, y, 4, P.linen1)
  s.hl(x, y + 7, 4, P.bayang)
}

/** Konter matcha bar (5 tile): bilah oak, panel plester berlogo, permukaan batu, alat teh. Uap ketel beranimasi. */
function konterMatcha(f = 0) {
  const s = new Spr(80, 32)
  s.rect(3, 30, 74, 2, P.bayang)
  // badan konter
  kayuDepan(s, 1, 15, 78, 15, OAK_DEPAN, 201)
  for (const [x0, w] of [[2, 26], [52, 26]]) {
    s.rect(x0, 17, w, 11, P.oak3)
    for (let x = x0 + 1; x < x0 + w; x += 2) s.vl(x, 17, 11, P.oak2)
    s.hl(x0, 17, w, P.oak4)
  }
  s.rect(29, 17, 22, 11, P.linen1).frame(29, 17, 22, 11, P.oak4).hl(30, 18, 20, P.linen0)
  // logo: ensō + daun teh
  for (let a = 0.5; a < 5.9; a += 0.18) s.px(40 + Math.cos(a - 1.4) * 3.2, 22.5 + Math.sin(a - 1.4) * 3.2, P.matcha3)
  s.px(40, 22, P.matcha2).px(41, 21, P.matcha2).px(39, 23, P.matcha3)
  s.rect(1, 28, 78, 2, P.wal3).hl(1, 28, 78, P.wal2)
  // permukaan batu
  s.rect(1, 9, 78, 6, P.batu1).hl(1, 9, 78, P.batu0).hl(1, 14, 78, P.batu2)
  const r = acak(202)
  for (let k = 0; k < 30; k++) s.px(2 + Math.floor(r() * 76), 10 + Math.floor(r() * 4), r() < 0.5 ? P.batu0 : P.batu2)
  s.hl(1, 15, 78, P.batu3)
  // ketel besi (tetsubin) di tungku kecil + uap
  s.rect(5, 11, 9, 3, P.arang2).hl(5, 11, 9, P.arang1)
  s.oval(9.5, 8, 4, 3.2, P.arang3).oval(8.6, 7, 2.2, 1.4, P.arang2).hl(7, 4, 5, P.arang4).px(13, 6, P.arang3).px(14, 5, P.arang3)
  for (let x = 6; x < 13; x++) s.px(x, 3 - Math.round(Math.sin(((x - 6) / 6) * Math.PI) * 2), P.arang4)
  for (let k = 0; k < 3; k++) {
    const t = ((f + k * 1.3) % 4) / 4
    const ux = 14 + Math.round(Math.sin((t + k) * 5) * 1.2) + k, uy = 4 - Math.round(t * 5)
    s.px(ux, uy, alfa(P.linen0, 0.7 - t * 0.5)).px(ux + 1, uy - 1, alfa(P.linen0, 0.45 - t * 0.35))
  }
  // nampan alat teh
  s.rect(18, 11, 16, 3, P.oak1).hl(18, 11, 16, P.oak0).hl(18, 13, 16, P.oak3)
  chawan(s, 21, 7, [P.arang2, P.arang3, P.arang4])
  chawan(s, 29, 7, [P.sage0, P.sage1, P.sage3])
  // chasen (kocokan bambu) di dudukan keramik
  s.rect(34, 9, 3, 3, P.linen0).hl(34, 11, 3, P.linen2)
  for (let x = 0; x < 3; x++) s.vl(34 + x, 6, 3, x === 1 ? P.bambu0 : P.rotan0)
  s.hl(34, 5, 3, P.rotan1)
  s.line(18, 10, 24, 10, P.rotan1)                       // chashaku (sendok bambu)
  // toples matcha bubuk
  for (const x of [40, 45]) {
    s.rect(x, 7, 4, 6, alfa(P.linen0, 0.55)).rect(x, 9, 4, 4, P.matcha2).hl(x, 9, 4, P.matcha1)
    s.rect(x, 6, 4, 1, P.oak2).vl(x, 7, 6, alfa(P.linen0, 0.85))
  }
  // gelas matcha latte
  gelasLatte(s, 51, 6)
  gelasLatte(s, 56, 6)
  // es krim matcha dalam cone
  s.oval(64, 6, 2.2, 2, P.matcha1).px(63, 5, P.matcha0).px(64, 3, P.matcha1)
  s.line(62, 8, 64, 12, P.oak2).line(66, 8, 64, 12, P.oak3).hl(63, 8, 3, P.oak2)
  // vas kecil dengan setangkai kamelia
  s.rect(70, 8, 3, 5, P.aizome2).hl(70, 8, 3, P.aizome1)
  s.line(71, 7, 72, 3, P.daun3).px(72, 2, P.shu0).px(73, 2, P.shu1).px(72, 1, P.shu0).px(71, 4, P.daun2)
  return s
}

/** Rak teh di dinding belakang: keramik, kaleng teh, toples, dua lampu gantung rotan menyala. */
function rakTeh() {
  const s = new Spr(64, 32)
  s.hl(2, 31, 60, P.bayang)
  s.rect(2, 3, 60, 19, P.oak2)
  s.rect(1, 2, 2, 28, P.oak3).rect(61, 2, 2, 28, P.oak4).rect(1, 1, 62, 2, P.oak1).hl(1, 1, 62, P.oak0)
  for (const y of [11, 20]) s.rect(3, y, 58, 2, P.oak1).hl(3, y + 1, 58, P.oak3).hl(3, y - 1, 58, alfa(P.wal4, 0.2))
  // rak atas: kaleng teh & chawan pajangan
  const kaleng = [[5, P.linen1], [9, P.aizome1], [13, P.kaki1], [17, P.sage2]]
  for (const [x, c] of kaleng) s.rect(x, 5, 3, 6, c).hl(x, 5, 3, P.linen0).hl(x, 7, 3, alfa(P.tinta, 0.2))
  for (const [x, g] of [[26, [P.liat0, P.liat1, P.liat2]], [34, [P.arang1, P.arang2, P.arang3]], [42, [P.sage0, P.sage1, P.sage3]]]) {
    s.oval(x, 9, 3.2, 1.8, g[1]).hl(x - 3, 8, 7, g[0]).hl(x - 2, 10, 5, g[2])
  }
  s.rect(50, 4, 6, 7, alfa(P.linen0, 0.5)).rect(50, 7, 6, 4, P.matcha2).hl(50, 4, 6, P.oak3)     // toples besar matcha
  s.rect(57, 6, 3, 5, P.linen0).hl(57, 6, 3, P.linen1)
  // rak bawah: cangkir bertumpuk, kotak kayu, tanaman
  for (const x of [5, 9]) for (let k = 0; k < 3; k++) s.rect(x, 18 - k * 2, 3, 2, k % 2 ? P.linen0 : P.linen1)
  s.rect(14, 14, 8, 6, P.oak3).frame(14, 14, 8, 6, P.oak4).hl(15, 16, 6, P.oak2)
  s.rect(24, 15, 6, 5, alfa(P.linen0, 0.5)).rect(24, 17, 6, 3, P.linen0).hl(24, 15, 6, P.oak3)   // kendi susu
  anyaman(s, 32, 14, 9, 6)
  daun(s, 48, 15, 3.5, 2.6, undefined, 203, 1.2)
  s.rect(46, 17, 5, 3, P.liat1).hl(46, 17, 5, P.liat0)
  s.rect(54, 13, 5, 7, P.arang2).hl(54, 13, 5, P.arang1).px(56, 12, P.arang3)
  // kabinet geser berpanel kertas
  s.rect(2, 22, 60, 8, P.oak3)
  for (const x0 of [3, 18, 33, 48]) s.rect(x0, 23, 13, 6, P.linen0).frame(x0, 23, 13, 6, P.oak2).vl(x0 + 6, 23, 6, P.oak2)
  // lampu gantung rotan di depan rak
  for (const x of [20, 44]) {
    s.vl(x, 0, 6, P.arang3)
    s.oval(x, 8, 4, 2.6, P.rotan1)
    for (let k = -3; k <= 3; k += 2) s.px(x + k, 8, P.rotan2)
    s.hl(x - 3, 10, 7, P.cahaya1).hl(x - 2, 11, 5, alfa(P.cahaya0, 0.7))
  }
  return s
}

/** Lampu gantung rotan untuk di atas meja (tidak menghalangi jalan). */
function lampuGantung() {
  const s = new Spr(16, 32)
  s.vl(8, 0, 5, P.arang3)
  s.oval(8, 7.5, 5, 3.2, P.rotan2).oval(8, 7, 4.5, 2.6, P.rotan1)
  for (let k = -3; k <= 3; k += 2) s.px(8 + k, 7, P.rotan0).px(8 + k + 1, 8, P.rotan2)
  s.hl(4, 10, 9, P.cahaya1).hl(5, 11, 7, alfa(P.cahaya0, 0.75))
  return s
}

/** Bangku bar oak dengan bantal bundar. */
function bangkuBar(bantal) {
  return () => {
    const s = new Spr(16, 16)
    s.oval(8, 14.5, 5, 1.2, P.bayang)
    s.line(5, 7, 3, 14, P.oak3).line(11, 7, 13, 14, P.oak4).line(7, 7, 6, 14, P.oak3).line(9, 7, 10, 14, P.oak4)
    s.hl(4, 11, 9, P.oak4)
    s.oval(8, 5.5, 5.2, 2.6, P.oak3).oval(8, 5, 5, 2.3, bantal[1]).oval(7, 4.5, 3, 1.2, bantal[0])
    return s
  }
}

/** Meja kafe bundar kecil: matcha latte + dango tiga warna. */
function mejaKafe() {
  const s = new Spr(16, 16)
  bayangan(s, 8, 14.5, 6, 1.4)
  s.vl(8, 9, 5, P.oak4).hl(6, 13, 5, P.oak4)
  s.oval(8, 7, 7, 3.3, P.oak3).oval(8, 6.5, 7, 3, P.oak1).oval(7, 6, 5, 1.8, P.oak0)
  s.rect(3, 4, 3, 3, alfa(P.linen0, 0.6)).hl(3, 5, 3, P.matcha2).hl(3, 4, 3, P.linen1)
  s.line(8, 7, 13, 4, P.rotan1)
  s.oval(9.5, 6.2, 1.2, 1.1, P.sakura1).oval(11, 5.4, 1.2, 1.1, P.linen0).oval(12.5, 4.6, 1.2, 1.1, P.matcha1)
  return s
}

/** Papan menu: papan sage gelap berbingkai oak, tulisan kapur & ikon mungil. */
function papanMenu() {
  const s = new Spr(32, 32)
  s.rect(4, 8, 24, 20, P.oak3).hl(4, 8, 24, P.oak2)
  s.rect(5, 9, 22, 18, P.sage5)
  s.hl(7, 11, 9, P.linen1).hl(7, 12, 6, alfa(P.linen1, 0.6))
  for (const [y, w] of [[15, 10], [18, 8], [21, 11], [24, 7]]) s.hl(7, y, w, alfa(P.linen1, 0.75)).px(20, y, P.emas0).px(21, y, P.emas0)
  // ikon: mangkuk, gelas, dango
  s.oval(23, 12, 2, 1.2, P.linen1).hl(22, 11, 3, P.matcha1)
  s.rect(22, 15, 2, 3, P.matcha1).hl(22, 15, 2, P.linen1)
  s.px(22, 22, P.sakura1).px(23, 21, P.linen1).px(24, 20, P.matcha1)
  s.hl(5, 28, 22, alfa(P.tinta, 0.2))
  return s
}

export const SINGLE = [
  ['RAK_TEH', 'Rak Teh & Keramik', 'storage', rakTeh, 4, 2, 1],
  ['LAMPU_GANTUNG', 'Lampu Gantung Rotan', 'decor', lampuGantung, 1, 2, 2],
  ['BANGKU_BAR_SAGE', 'Bangku Bar Sage', 'chairs', bangkuBar([P.sage1, P.sage2]), 1, 1, 0],
  ['BANGKU_BAR_LINEN', 'Bangku Bar Linen', 'chairs', bangkuBar([P.linen0, P.linen2]), 1, 1, 0],
  ['MEJA_KAFE', 'Meja Kafe Bundar', 'desks', mejaKafe, 1, 1, 0],
  ['PAPAN_MENU', 'Papan Menu', 'wall', papanMenu, 2, 2, 0, { walls: true }],
]

export const ANIMASI = [
  ['MATCHA_BAR', 'Konter Matcha', 'desks', konterMatcha, 4, 5, 2, 1],
]
