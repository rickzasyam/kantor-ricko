// Dekorasi bersama: tanaman, hiasan dinding, papan nama kayu, noren, lampion, dan set lounge.
//
// Barang dinding (32 px tinggi) diletakkan satu baris di atas dinding. Muka dinding ada di y 8..30
// sprite, balok nageshi di y 12-13: gulungan & papan nama digantung dari balok itu.
import { Spr } from '../lib/sprite.mjs'
import { P, acak, alfa, bayangan, kayuAtas, kayuDepan, kain, daun, pot, tulis, lebarTeks } from '../lib/bahan.mjs'
import { anyaman } from './kerja.mjs'

const OAK = [P.oak0, P.oak1, P.oak2, P.oak3]
const OAK_DEPAN = [P.oak2, P.oak3, P.oak4, P.oak5]
const DAUN_GELAP = [P.daun1, P.daun2, P.daun3, P.daun4, P.daun5]

/** Daun ramping (bambu): garis pendek miring dari titik (x, y). */
function daunRamping(s, x, y, arah, panjang, ramp = [P.daun1, P.daun2, P.daun3]) {
  for (let i = 0; i < panjang; i++) {
    const px = x + arah * i, py = y + Math.floor(i * 0.55)
    s.px(px, py, i === 0 ? ramp[2] : i < panjang - 1 ? ramp[1] : ramp[0])
    if (i > 0 && i < panjang - 2) s.px(px, py + 1, ramp[2])
  }
}

// ----------------------------------------------------------------------- tanaman

function bonsai() {
  const s = new Spr(16, 32)
  s.hl(3, 31, 11, P.bayang)
  s.rect(2, 24, 12, 2, P.wal1).hl(2, 24, 12, P.wal0)
  s.hl(2, 26, 12, P.wal2).vl(3, 26, 5, P.wal2).vl(12, 26, 5, P.wal3)
  s.rect(3, 20, 10, 4, P.aizome2).hl(3, 20, 10, P.aizome1).hl(3, 23, 10, P.aizome3).px(4, 24, P.aizome3).px(11, 24, P.aizome3)
  s.hl(4, 19, 8, P.daun3).px(5, 19, P.daun2).px(9, 19, P.daun2)
  s.line(8, 19, 7, 15, P.wal3).line(7, 19, 6, 15, P.wal2).line(6, 15, 8, 11, P.wal2).line(8, 11, 6, 8, P.wal2)
  s.line(7, 13, 11, 11, P.wal2).line(6, 10, 3, 9, P.wal2)
  daun(s, 11.5, 9.5, 3, 1.9, DAUN_GELAP, 101, 1.3)
  daun(s, 3.5, 8, 2.6, 1.7, DAUN_GELAP, 102, 1.3)
  daun(s, 7, 5, 3.6, 2.3, DAUN_GELAP, 103, 1.3)
  return s
}

function bambuPot() {
  const s = new Spr(16, 48)
  s.hl(3, 46, 11, P.bayang)
  s.rect(3, 37, 10, 9, P.linen2).vl(3, 37, 9, P.linen1).vl(12, 37, 9, P.linen3).hl(3, 45, 10, P.linen3)
  s.hl(3, 37, 10, P.linen1).hl(4, 38, 8, P.wal3)
  for (const [x, top] of [[6, 7], [9, 2], [11, 11]]) {
    for (let y = top; y < 38; y++) {
      const ruas = (y - top) % 6 === 0
      s.px(x, y, ruas ? P.bambu3 : P.bambu2).px(x - 1, y, ruas ? P.bambu2 : P.bambu1)
    }
  }
  const daunnya = [[6, 9, -1, 5], [6, 14, 1, 4], [9, 4, 1, 5], [9, 8, -1, 5], [11, 13, 1, 4], [11, 18, 1, 4], [9, 15, -1, 4], [6, 20, -1, 4], [9, 24, 1, 3], [10, 3, -1, 4], [7, 6, -1, 3]]
  for (const [x, y, a, p] of daunnya) daunRamping(s, x, y, a, p)
  return s
}

function tanamanPedang() {
  const s = new Spr(16, 32)
  s.hl(4, 31, 9, P.bayang)
  s.rect(4, 24, 8, 6, P.liat1).vl(4, 24, 6, P.liat0).vl(11, 24, 6, P.liat2).hl(4, 24, 8, P.liat0).hl(5, 25, 6, P.wal3)
  const daunnya = [[5, 12, -1], [7, 6, 0], [8, 9, 1], [10, 13, 1], [6, 15, 0], [9, 4, 0]]
  for (const [x, top, miring] of daunnya) {
    for (let y = top; y < 25; y++) {
      const dx = miring * Math.floor((y - top) / 8)
      s.px(x + dx, y, P.sage3).px(x + dx + 1, y, y === top ? P.sage3 : P.sage4)
      if ((y - top) % 4 === 1) s.px(x + dx, y, P.sage1)
    }
    s.px(x, top - 1, P.sage2)
  }
  return s
}

function pakis() {
  const s = new Spr(16, 32)
  s.hl(3, 31, 11, P.bayang)
  s.oval(8, 27, 4.5, 3.5, P.linen3).oval(7.5, 26.5, 3.5, 2.8, P.linen2).hl(4, 24, 9, P.linen1).hl(5, 25, 7, P.wal3)
  const pelepah = [[-6, -6], [-7, -1], [-4, -10], [0, -12], [4, -10], [7, -2], [6, -7], [-2, -8], [2, -7]]
  for (const [dx, dy] of pelepah) {
    for (let i = 0; i <= 10; i++) {
      const t = i / 10, x = 8 + dx * t, y = 24 + dy * t + 3 * t * t * (Math.abs(dx) > 4 ? 1 : 0)
      s.px(x, y, P.daun3)
      if (i % 2 === 0 && i > 1) { s.px(x - 1, y, P.daun1).px(x + 1, y, P.daun2) }
    }
  }
  return s
}

/** Kokedama: bola lumut bertanaman, digantung dengan tali (barang dinding). */
function kokedama() {
  const s = new Spr(16, 32)
  s.vl(8, 6, 9, P.linen3).px(8, 5, P.wal2)
  s.oval(8, 19, 4.6, 4.2, P.daun3).oval(7.3, 18.2, 3.6, 3.2, P.daun2).oval(6.5, 17, 1.6, 1.2, P.daun1)
  s.px(10, 22, P.daun4).px(11, 20, P.daun4).hl(5, 23, 6, P.daun4)
  for (const [x, a, p] of [[7, -1, 4], [9, 1, 4], [8, 1, 3]]) daunRamping(s, x, 14, a, p, [P.matcha0, P.matcha1, P.matcha2])
  return s
}

// ------------------------------------------------------------- hiasan dinding

/** Bingkai tipis dengan kertas di dalam: kembalikan batas area isi. */
function bingkai(s, x, y, w, h, list = P.arang3, kertas = P.linen0) {
  s.rect(x, y, w, h, list).rect(x + 1, y + 1, w - 2, h - 2, kertas)
  s.hl(x + 1, y + h, w - 1, alfa(P.tinta, 0.18))
  return [x + 1, y + 1, w - 2, h - 2]
}

/** Lukisan tinta sumi-e: gunung berlapis kabut, burung terbang, cap merah. */
function lukisanTinta() {
  const s = new Spr(32, 32)
  const [x, y, w, h] = bingkai(s, 4, 9, 24, 18)
  const pegunungan = [[0.55, P.linen2, 0], [0.7, P.batu1, 2], [0.85, P.arang0, 4]]
  for (const [dasar, c, geser] of pegunungan) {
    for (let i = 0; i < w; i++) {
      const tinggi = Math.round((Math.sin((i + geser) / 3.2) * 0.5 + Math.sin((i + geser * 2) / 7) * 0.8) * 2.2 + (1 - dasar) * h * 0.9)
      for (let j = Math.max(0, h - tinggi - Math.round((1 - dasar) * 4)); j < h; j++) s.px(x + i, y + j, c)
    }
  }
  s.line(x + 2, y + h - 1, x + 6, y + h - 6, P.arang3).line(x + 6, y + h - 6, x + 9, y + h - 5, P.arang3)   // ranting pinus
  s.px(x + 5, y + h - 7, P.arang2).px(x + 8, y + h - 6, P.arang2)
  for (const [bx, by] of [[13, 3], [16, 5], [11, 6]]) s.px(x + bx, y + by, P.arang3).px(x + bx - 1, y + by - 1, P.arang3).px(x + bx + 1, y + by - 1, P.arang3)
  s.rect(x + w - 3, y + h - 4, 2, 2, P.shu1)
  return s
}

/** Gulungan gantung (kakejiku) bergambar ensō. */
function gulunganEnso() {
  const s = new Spr(16, 32)
  s.line(5, 9, 8, 6, P.linen3).line(11, 9, 8, 6, P.linen3).px(8, 5, P.emas1)
  s.hl(3, 9, 10, P.wal2).px(2, 9, P.wal3).px(13, 9, P.wal3)
  s.rect(4, 10, 8, 17, P.sage3).vl(4, 10, 17, P.sage2)
  s.rect(5, 12, 6, 13, P.linen0)
  for (let a = 0.35; a < 6.0; a += 0.12) {
    const t = a / 6.28, tebal = t < 0.6 ? 1 : 0
    const px = 8 + Math.cos(a - 1.2) * 2.4, py = 17.5 + Math.sin(a - 1.2) * 2.6
    s.px(px, py, P.arang3)
    if (tebal) s.px(px - 0.6, py, P.arang2)
  }
  s.px(9, 23, P.shu1)
  s.hl(3, 27, 10, P.wal2).px(2, 27, P.wal3).px(13, 27, P.wal3)
  return s
}

/** Cetakan "Ombak Besar" ala Hokusai, warna indigo redup: ombak melengkung, Fuji kecil di kanan. */
const OMBAK = [
  '.......WWW............',
  '.....WWLLLW...........',
  '....WLLMMMLW..........',
  '...WLMMDDDMLW.........',
  '...LMDD...DMLW........',
  '..LMD......WDLW.......',
  '..LMD.......WDW....S..',
  '.LMDD........W....SFS.',
  '.LMD.............FFFFF',
  'LMDD..W.........FFFFFF',
  'LMD..WLW.....W..FFFFFF',
  'MDD.WLMLW...WLW.......',
  'MD.WLMDMLWWWLMLWW.....',
  'DLLMDDDMLLLMDDDMLLW...',
  'DMMDDDDDMMMDDDDDDMMLLW',
  'DDDDDDDDDDDDDDDDDDDDDD',
]
function ombakHokusai() {
  const s = new Spr(32, 32)
  const [x, y] = bingkai(s, 4, 9, 24, 18, P.oak4, P.linen1)
  s.pattern(x + 1, y + 1, OMBAK, { W: P.linen0, L: P.aizome0, M: P.aizome1, D: P.aizome2, F: P.aizome1, S: P.linen0 })
  s.rect(x + 20, y + 1, 2, 2, P.shu1)
  return s
}

/** Jendela shoji: kisi kayu di atas kertas yang diterangi siang, bayangan daun bambu di luar. */
function jendelaShoji() {
  const s = new Spr(32, 32)
  s.rect(2, 8, 28, 21, P.oak3).rect(2, 8, 28, 1, P.oak2).vl(2, 8, 21, P.oak2)
  for (let j = 10; j < 27; j++) s.hl(4, j, 24, j < 14 ? P.cahaya0 : j < 20 ? P.linen0 : P.linen1)
  // bayangan bambu di kertas (dari luar)
  const bambu = [[23, 10, -1, 5], [25, 13, -1, 4], [22, 16, 1, 4], [26, 18, -1, 4], [7, 11, 1, 4]]
  for (const [bx, by, a, p] of bambu) for (let i = 0; i < p; i++) s.px(bx + a * i, by + Math.floor(i * 0.6), alfa(P.sage4, 0.22))
  s.vl(25, 10, 16, alfa(P.sage4, 0.16))
  for (const xx of [10, 16, 22]) s.vl(xx, 10, 17, P.oak2)
  for (const yy of [15, 21]) s.hl(4, yy, 24, P.oak2)
  s.rect(4, 26, 24, 2, P.oak2).hl(4, 26, 24, P.oak1)   // ambang bawah
  s.hl(2, 29, 28, alfa(P.tinta, 0.2))
  return s
}

/** Jendela bundar (marumado) berkisi shoji, siluet bambu di luar. */
function marumado() {
  const s = new Spr(32, 32)
  const cx = 15.5, cy = 18, R = 10.5
  for (let y = 6; y < 31; y++) for (let x = 3; x < 29; x++) {
    const d = Math.hypot(x - cx, y - cy)
    if (d > R + 1.2) continue
    if (d > R - 0.6) s.px(x, y, d > R + 0.3 ? P.oak4 : P.oak3)
    else s.px(x, y, y < cy - 3 ? P.cahaya0 : P.linen0)
  }
  for (const [bx, by, a, p] of [[20, 11, -1, 5], [22, 15, -1, 4], [19, 19, 1, 4], [11, 13, 1, 3]]) for (let i = 0; i < p; i++) s.px(bx + a * i, by + Math.floor(i * 0.6), alfa(P.sage4, 0.25))
  s.vl(21, 9, 18, alfa(P.sage4, 0.18))
  for (let y = 8; y < 29; y++) for (const x of [11, 16, 21]) if (Math.hypot(x - cx, y - cy) < R - 0.6) s.px(x, y, P.oak2)
  for (let x = 6; x < 26; x++) for (const y of [14, 21]) if (Math.hypot(x - cx, y - cy) < R - 0.6) s.px(x, y, P.oak2)
  for (let a = 0.6; a < 2.6; a += 0.05) s.px(cx + Math.cos(a) * (R + 0.6), cy + Math.sin(a) * (R + 0.6), alfa(P.tinta, 0.25))
  return s
}

/** Papan nama kayu digantung dari balok, tulisan diukir + cap merah kecil. */
function plakat(teks) {
  const lebar = lebarTeks(teks)
  const w = Math.max(32, Math.ceil((lebar + 14) / 16) * 16)
  return () => {
    const s = new Spr(w, 32)
    const pw = lebar + 11, x0 = Math.floor((w - pw) / 2)
    s.line(x0 + 3, 15, x0 + 5, 12, P.linen3).line(x0 + pw - 4, 15, x0 + pw - 6, 12, P.linen3)
    s.px(x0 + 5, 11, P.emas1).px(x0 + pw - 6, 11, P.emas1)
    s.rrect(x0, 15, pw, 10, P.oak1).hl(x0 + 1, 15, pw - 2, P.oak0).hl(x0 + 1, 24, pw - 2, P.oak3)
    s.vl(x0, 16, 8, P.oak2).vl(x0 + pw - 1, 16, 8, P.oak3)
    tulis(s, x0 + 3, 17, teks, P.wal3)
    s.rect(x0 + pw - 5, 18, 2, 3, P.shu1).px(x0 + pw - 5, 18, P.shu0)
    s.hl(x0 + 1, 25, pw - 1, alfa(P.tinta, 0.18))
    return s
  }
}

const AKSARA = {
  // 茶 (cha, teh)
  teh: ['..#.....#..', '###########', '..#.....#..', '.....#.....', '....#.#....', '...#...#...', '.##.....##.', '...#####...', '.....#.....', '...#.#.#...', '..#..#..#..'],
  // ゆ (yu, air panas -- tanda onsen)
  yu: ['.#...#....', '.#..#####.', '.#.#.#...#', '.##..#...#', '.#...#...#', '.#...#..#.', '.....#.#..', '....##....', '...##.....', '..#.......'],
}

/** Noren: tirai kain dengan celah, digantung di batang kayu, aksara putih di tengah. */
function noren(ramp, aksara) {
  return () => {
    const s = new Spr(32, 32)
    s.hl(2, 9, 28, P.wal2).px(1, 9, P.wal3).px(30, 9, P.wal3).hl(2, 8, 28, P.wal1)
    for (const [x0, w] of [[3, 8], [12, 8], [21, 8]]) {
      s.rect(x0, 10, w, 17, ramp[1]).hl(x0, 10, w, ramp[0]).hl(x0, 26, w, ramp[2])
      for (let x = x0 + 2; x < x0 + w; x += 3) s.vl(x, 12, 13, alfa(ramp[2], 0.5))
    }
    const g = AKSARA[aksara], gw = g[0].length, gx = 16 - Math.floor(gw / 2), gy = 13
    g.forEach((b, j) => [...b].forEach((c, k) => { if (c === '#' && !([11, 20].includes(gx + k))) s.px(gx + k, gy + j, P.linen0) }))
    s.hl(3, 27, 26, alfa(P.tinta, 0.15))
    return s
  }
}

/** Lentera kertas (chochin) di kait dinding, nyala berdenyut halus (4 frame). */
function chochin(f = 0) {
  const s = new Spr(16, 32)
  s.vl(8, 7, 3, P.arang3)
  s.hl(5, 10, 6, P.arang3).hl(6, 9, 4, P.arang2)
  s.oval(8, 16.5, 4.6, 6.2, P.linen1)
  const nyala = [P.cahaya1, P.cahaya0, P.cahaya1, P.cahaya2][f % 4]
  s.oval(8, 16.5, 3.4, 5, nyala).oval(7.4, 15, 1.8, 2.6, P.cahaya0)
  for (let y = 12; y < 22; y += 2) s.hl(4, y, 9, alfa(P.linen3, 0.45))
  s.hl(5, 23, 6, P.arang3).hl(6, 24, 4, P.arang2)
  s.vl(8, 25, 2, P.shu1).px(7, 27, P.shu1).px(9, 27, P.shu1)
  return s
}

/** Untaian lampion kecil krem & persimmon (3 tile), berkelip pelan (4 frame). */
function lampionUntai(f = 0) {
  const s = new Spr(48, 32)
  const tali = x => 9 + Math.round(Math.sin((x / 47) * Math.PI) * 3)
  for (let x = 1; x < 47; x++) s.px(x, tali(x), P.arang2)
  ;[6, 17, 30, 41].forEach((x, i) => {
    const y = tali(x) + 2
    const warna = i % 2 ? [P.kaki1, P.kaki0] : [P.linen1, P.cahaya0]
    const terang = (f + i) % 4 === 1
    s.vl(x, y - 1, 1, P.arang3)
    s.oval(x, y + 3, 2.6, 3.2, warna[0]).oval(x - 0.4, y + 2.6, 1.5, 2, terang ? P.cahaya0 : warna[1])
    s.hl(x - 1, y, 3, P.arang3).hl(x - 1, y + 6, 3, P.arang3)
  })
  return s
}

/** Jam dinding kayu bundar minimalis. */
function jamDinding() {
  const s = new Spr(16, 32)
  s.oval(8, 17, 5.6, 5.6, P.oak3).oval(8, 17, 4.6, 4.6, P.linen0).oval(7.4, 16.4, 3, 3, P.linen0)
  for (const [x, y] of [[8, 13], [12, 17], [8, 21], [4, 17]]) s.px(x, y, P.arang1)
  s.line(8, 17, 6, 14, P.arang3).line(8, 17, 11, 15, P.arang3).px(8, 17, P.emas1)
  s.hl(4, 23, 8, alfa(P.tinta, 0.15))
  return s
}

/** Rak dinding melayang: bonsai mini, buku, vas, dan maneki-neko kecil. */
function rakDinding() {
  const s = new Spr(32, 32)
  s.rect(3, 19, 26, 2, P.oak1).hl(3, 19, 26, P.oak0).hl(3, 21, 26, P.oak3).hl(4, 22, 24, alfa(P.tinta, 0.2))
  s.rect(4, 21, 2, 3, P.arang3).rect(26, 21, 2, 3, P.arang3)
  // buku rebah & berdiri
  s.rect(4, 16, 8, 3, P.sage3).hl(4, 16, 8, P.sage2).rect(5, 13, 6, 3, P.liat1).hl(5, 13, 6, P.liat0)
  // vas kecil
  s.rect(14, 13, 3, 6, P.aizome2).hl(14, 13, 3, P.aizome1).line(15, 12, 13, 8, P.wal2).px(13, 8, P.linen0).px(12, 9, P.rotan0)
  // maneki-neko
  s.rect(19, 13, 5, 6, P.linen0).rect(19, 11, 5, 3, P.linen0).px(19, 10, P.linen0).px(23, 10, P.linen0)
  s.px(20, 12, P.tinta).px(22, 12, P.tinta).hl(19, 14, 5, P.shu1).px(21, 15, P.emas1)
  s.rect(24, 9, 1, 4, P.linen0).px(24, 8, P.linen0)
  s.hl(19, 18, 5, P.linen2)
  // sukulen mini
  s.rect(26, 16, 3, 3, P.liat1).oval(27.5, 15, 2, 1.5, P.sage2).px(27, 14, P.sage1)
  return s
}

/** Papan washi (kanban): kertas krem, kartu warna tanah, cap hanko di kartu yang selesai. */
function papanWashi() {
  const s = new Spr(48, 32)
  s.rect(2, 9, 44, 19, P.oak3).hl(2, 9, 44, P.oak2)
  s.rect(3, 10, 42, 17, P.linen0)
  const r = acak(141)
  for (let k = 0; k < 40; k++) s.px(3 + Math.floor(r() * 42), 10 + Math.floor(r() * 17), P.linen1)
  for (const x of [17, 31]) s.vl(x, 11, 15, P.linen3)
  const tanda = [P.sage3, P.emas1, P.matcha3]
  ;[4, 18, 32].forEach((x, i) => s.hl(x + 1, 11, 11, tanda[i]))
  const kartu = [[5, 13, P.sage1], [9, 13, P.linen2], [5, 18, P.liat0], [10, 19, P.linen2], [6, 23, P.aizome0],
    [19, 13, P.emas0], [24, 14, P.sage1], [20, 19, P.linen2], [33, 13, P.matcha0], [38, 13, P.linen2], [34, 18, P.sage0], [39, 19, P.liat0]]
  for (const [x, y, c] of kartu) s.rect(x, y, 4, 4, c).hl(x, y, 4, alfa(P.linen0, 0.6)).hl(x, y + 4, 4, alfa(P.tinta, 0.15))
  for (const [x, y] of [[35, 15], [40, 21], [35, 20]]) s.px(x, y, P.shu1)
  // coretan kucing kecil di pojok
  s.px(41, 23, P.arang2).px(43, 23, P.arang2).hl(41, 24, 3, P.arang2).hl(41, 25, 3, P.arang2)
  return s
}

/** TV presentasi berbingkai oak, slide lembut. */
function tvRapat() {
  const s = new Spr(48, 32)
  s.rect(2, 8, 44, 21, P.oak3).hl(2, 8, 44, P.oak2)
  s.rect(3, 9, 42, 19, P.arang4)
  s.rect(4, 10, 40, 17, P.linen0)
  s.rect(6, 12, 14, 2, P.sage3).hl(22, 13, 8, P.linen3)
  for (const [y, w] of [[16, 12], [19, 10], [22, 13]]) s.px(6, y, P.matcha2).hl(8, y, w, P.linen3)
  const batang = [[26, 4, P.sage2], [30, 7, P.matcha2], [34, 5, P.liat1], [38, 9, P.aizome1]]
  for (const [x, h, c] of batang) s.rect(x, 25 - h, 3, h, c)
  s.hl(25, 25, 17, P.linen3)
  for (let a = 0.4; a < 6; a += 0.3) s.px(40 + Math.cos(a) * 1.8, 13.5 + Math.sin(a) * 1.8, P.arang2)
  s.hl(3, 29, 42, alfa(P.tinta, 0.2))
  return s
}

// ------------------------------------------------------------------------- lounge

/** Chabudai: meja bundar rendah kayu gelap, poci besi, cangkir, piring wagashi. */
function chabudai() {
  const s = new Spr(32, 32)
  bayangan(s, 16, 27, 13, 3)
  s.rect(6, 22, 2, 4, P.wal3).rect(24, 22, 2, 4, P.wal3)
  s.oval(16, 18, 14, 6.5, P.wal3).oval(16, 17, 14, 6, P.wal1).oval(14, 15.5, 11, 4, P.wal0)
  s.oval(16, 19.5, 13.5, 4, alfa(P.wal2, 0.6))
  // poci besi (tetsubin)
  s.oval(12, 15, 3.4, 2.6, P.arang3).oval(11.4, 14.4, 2, 1.4, P.arang2).hl(10, 12, 5, P.arang4).px(15, 14, P.arang3).px(16, 13, P.arang3)
  // cangkir & piring wagashi
  s.rect(19, 13, 3, 2, P.linen0).hl(19, 13, 3, P.matcha2).rect(23, 16, 3, 2, P.linen0).hl(23, 16, 3, P.matcha2)
  s.oval(18, 19, 3, 1.4, P.linen0).px(17, 19, P.sakura1).px(19, 19, P.matcha1).px(18, 18, P.linen1)
  return s
}

function zabuton(ramp) {
  return () => {
    const s = new Spr(16, 16)
    s.hl(2, 14, 12, P.bayang)
    s.rrect(2, 4, 12, 10, ramp[2])
    s.rrect(2, 3, 12, 10, ramp[1]).hl(3, 3, 10, ramp[0]).vl(2, 4, 8, ramp[0])
    s.px(7, 7, ramp[2]).px(8, 8, ramp[2]).px(7, 8, alfa(ramp[0], 0.7))
    for (const [x, y] of [[2, 3], [13, 3], [2, 12], [13, 12]]) s.px(x, y, ramp[2]).px(x + (x < 7 ? -1 : 1), y + (y < 7 ? -1 : 1), alfa(ramp[2], 0.6))
    return s
  }
}

/** Sofa rendah linen dengan alas kayu (menghadap ke bawah). */
function sofaRendah() {
  const s = new Spr(32, 16)
  s.hl(2, 15, 28, P.bayang)
  s.rect(1, 12, 30, 2, P.oak3).hl(1, 12, 30, P.oak2).px(2, 14, P.oak4).px(29, 14, P.oak4)
  s.rrect(1, 1, 30, 7, P.linen2).hl(2, 1, 28, P.linen1)
  kain(s, 2, 6, 28, 6, [P.linen0, P.linen1, P.linen2], 151)
  s.vl(16, 6, 6, P.linen2)
  s.rect(0, 4, 3, 8, P.linen2).rect(29, 4, 3, 8, P.linen3)
  s.rect(4, 3, 5, 4, P.sage1).hl(4, 3, 5, P.sage0)
  s.rect(23, 3, 5, 4, P.liat0).hl(23, 3, 5, P.linen1)
  return s
}

function mejaBulat() {
  const s = new Spr(16, 16)
  bayangan(s, 8, 14, 6, 1.5)
  s.vl(8, 9, 5, P.oak4)
  s.oval(8, 7, 6.5, 3.2, P.oak3).oval(8, 6.5, 6.5, 3, P.oak1).oval(7, 6, 4.5, 1.8, P.oak0)
  s.rect(6, 4, 3, 2, P.linen0).hl(6, 4, 3, P.matcha2)
  return s
}

/** Panggung tokonoma: alas kayu gelap rendah dengan ikebana di wadah ceper & batu kecil. */
function tokonoma() {
  const s = new Spr(32, 16)
  s.hl(1, 15, 30, P.bayang)
  kayuAtas(s, 1, 8, 30, 4, [P.wal0, P.wal1, P.wal2, P.wal3], 161)
  kayuDepan(s, 1, 12, 30, 3, [P.wal1, P.wal2, P.wal3, P.wal4], 162)
  s.oval(10, 9, 5, 1.5, P.arang2).hl(6, 8, 9, P.arang1).hl(7, 9, 7, P.air2)
  s.line(9, 8, 7, 1, P.wal3).line(10, 8, 13, 3, P.wal3)
  daun(s, 7, 2, 2, 1.5, DAUN_GELAP, 163, 1.4)
  s.px(13, 3, P.momiji1).px(14, 2, P.momiji0).px(12, 2, P.momiji2)
  s.oval(23, 9, 3, 1.8, P.batu2).oval(22.4, 8.4, 1.8, 1, P.batu1).px(25, 10, P.batu4)
  return s
}

/** Kursi telur gantung rotan, bantal linen, berayun pelan (4 frame). */
function kursiTelur(f = 0) {
  const s = new Spr(32, 48)
  bayangan(s, 16, 45, 9, 2)
  s.rect(14, 42, 4, 3, P.arang2)
  for (let y = 4; y < 43; y++) {
    const x = 15 + Math.round(Math.sin(((y - 4) / 40) * Math.PI) * -9)
    s.px(x, y, P.arang1).px(x + 1, y, P.arang3)
  }
  s.hl(6, 3, 12, P.arang1).hl(6, 4, 12, P.arang3)
  const g = [0, 1, 0, -1][f % 4], cx = 17 + g
  s.vl(cx, 4, 9, P.wal3)
  s.oval(cx, 25, 9, 12, P.rotan2)
  for (let y = 14; y < 37; y += 3) for (let x = cx - 8; x < cx + 9; x++) if ((x + y) % 2 === 0) s.px(x, y, P.rotan1)
  s.oval(cx, 25, 9, 12, alfa(P.rotan3, 0)).oval(cx, 27, 6, 8, P.wal2)
  s.oval(cx, 29, 5, 6, P.linen1).oval(cx - 1, 27, 2.5, 2.5, P.linen0).oval(cx + 1, 31, 3, 2, P.sage1)
  return s
}

// ----------------------------------------------------------------- daftar item

export const SINGLE = [
  ['BONSAI', 'Bonsai', 'decor', bonsai, 1, 2, 1],
  ['BAMBU_POT', 'Bambu dalam Pot', 'decor', bambuPot, 1, 3, 2],
  ['TANAMAN_PEDANG', 'Lidah Mertua', 'decor', tanamanPedang, 1, 2, 1],
  ['PAKIS', 'Pakis', 'decor', pakis, 1, 2, 1],
  ['KOKEDAMA', 'Kokedama Gantung', 'wall', kokedama, 1, 2, 0, { walls: true }],
  ['LUKISAN_TINTA', 'Lukisan Tinta', 'wall', lukisanTinta, 2, 2, 0, { walls: true }],
  ['GULUNGAN_ENSO', 'Gulungan Enso', 'wall', gulunganEnso, 1, 2, 0, { walls: true }],
  ['OMBAK_HOKUSAI', 'Cetakan Ombak Besar', 'wall', ombakHokusai, 2, 2, 0, { walls: true }],
  ['JENDELA_SHOJI', 'Jendela Shoji', 'wall', jendelaShoji, 2, 2, 0, { walls: true }],
  ['MARUMADO', 'Jendela Bundar', 'wall', marumado, 2, 2, 0, { walls: true }],
  ['JAM_DINDING', 'Jam Kayu', 'wall', jamDinding, 1, 2, 0, { walls: true }],
  ['RAK_DINDING', 'Rak Dinding', 'wall', rakDinding, 2, 2, 0, { walls: true }],
  ['PAPAN_WASHI', 'Papan Washi', 'wall', papanWashi, 3, 2, 0, { walls: true }],
  ['TV_RAPAT', 'TV Presentasi Kayu', 'wall', tvRapat, 3, 2, 0, { walls: true }],
  ...['RICKO', 'FOKUS', 'MATCHA', 'MAIN', 'DOJO', 'ONSEN', 'RAPAT'].map(t => {
    const g = plakat(t)
    return [`PLAKAT_${t}`, `Papan Nama ${t}`, 'wall', g, g().w / 16, 2, 0, { walls: true }]
  }),
  ['NOREN_TEH', 'Noren Teh', 'wall', noren([P.matcha2, P.matcha3, P.matcha4], 'teh'), 2, 2, 0, { walls: true }],
  ['NOREN_YU', 'Noren Onsen', 'wall', noren([P.aizome1, P.aizome2, P.aizome3], 'yu'), 2, 2, 0, { walls: true }],
  ['CHABUDAI', 'Meja Chabudai', 'desks', chabudai, 2, 2, 1],
  ['ZABUTON_INDIGO', 'Zabuton Indigo', 'chairs', zabuton([P.aizome0, P.aizome1, P.aizome2]), 1, 1, 0],
  ['ZABUTON_SAGE', 'Zabuton Sage', 'chairs', zabuton([P.sage1, P.sage2, P.sage3]), 1, 1, 0],
  ['ZABUTON_LIAT', 'Zabuton Tanah Liat', 'chairs', zabuton([P.liat0, P.liat1, P.liat2]), 1, 1, 0],
  ['ZABUTON_OAT', 'Zabuton Oat', 'chairs', zabuton([P.linen1, P.linen2, P.linen3]), 1, 1, 0],
  ['SOFA_RENDAH', 'Sofa Rendah Linen', 'chairs', sofaRendah, 2, 1, 0],
  ['MEJA_BULAT', 'Meja Bulat Kecil', 'desks', mejaBulat, 1, 1, 0],
  ['TOKONOMA', 'Panggung Tokonoma', 'decor', tokonoma, 2, 1, 0],
]

export const ANIMASI = [
  ['CHOCHIN', 'Lentera Chochin', 'wall', chochin, 4, 1, 2, 0, { walls: true }],
  ['LAMPION_UNTAI', 'Untaian Lampion', 'wall', lampionUntai, 4, 3, 2, 0, { walls: true }],
  ['EGG_CHAIR', 'Kursi Telur Rotan', 'decor', kursiTelur, 4, 2, 3, 1],
]
