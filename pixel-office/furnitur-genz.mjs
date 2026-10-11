// Furnitur gaya kantor gen-Z (ala Google / Roblox): warna pastel cerah + aksen neon.
// Dipakai furnitur.mjs; formatnya sama: [id, nama, kategori, gambar, footprintW, footprintH, baris latar, opsi].
import { Spr, shade } from './lib/sprite.mjs'

const SHADOW = '#00000033'

// Palet utama: pastel cerah dengan garis tinta ungu tua supaya tetap "pixel art", bukan pucat.
export const WARNA = {
  lilac: '#b79cff', mint: '#5fe0b0', peach: '#ffb38a', coral: '#ff6b81',
  sunny: '#ffd166', sky: '#7cc6ff', pink: '#ff8fd0', cream: '#fff6e5', tinta: '#2b2540',
}
const KAYU = '#d9a066', KAYU_GELAP = '#a8703f', KROM = '#c9d1d9', KROM_GELAP = '#8a94a3'

// ------------------------------------------------------------------ huruf neon 3x5

const HURUF = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'],
  C: ['.##', '#..', '#..', '#..', '.##'], D: ['##.', '#.#', '#.#', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'], G: ['.##', '#..', '#.#', '#.#', '.##'],
  I: ['###', '.#.', '.#.', '.#.', '###'], K: ['#.#', '#.#', '##.', '#.#', '#.#'],
  M: ['#.#', '###', '###', '#.#', '#.#'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  P: ['##.', '#.#', '##.', '#..', '#..'], R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'], V: ['#.#', '#.#', '#.#', '#.#', '.#.'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], H: ['#.#', '#.#', '###', '#.#', '#.#'],
  L: ['#..', '#..', '#..', '#..', '###'],
}

/** Tulisan neon di dinding (48x32), huruf 3x5 diperbesar 2x, berdenyut 4 frame. */
function neonTeks(teks, warna, aksen) {
  return (f = 0) => {
    const s = new Spr(48, 32)
    const lebar = teks.length * 6 + (teks.length - 1) * 2
    const x0 = Math.floor((48 - lebar) / 2), y0 = 9
    const alfa = ['55', '88', '55', '33'][f % 4]
    const titik = []
    ;[...teks].forEach((h, i) => HURUF[h].forEach((baris, j) => [...baris].forEach((c, k) => {
      if (c === '#') titik.push([x0 + i * 8 + k * 2, y0 + j * 2])
    })))
    // papan akrilik gelap supaya neon tetap menyala di dinding terang
    s.rrect(x0 - 4, y0 - 4, lebar + 8, 22, '#241d3a').frame(x0 - 4, y0 - 4, lebar + 8, 22, '#3a3058')
    for (const [x, y] of titik) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) s.rect(x + dx, y + dy, 2, 2, `${warna}${alfa}`)
    for (const [x, y] of titik) s.rect(x, y, 2, 2, warna)
    for (const [x, y] of titik) s.px(x, y, shade(warna, 0.55))
    // garis bawah aksen (hati / petir kecil di ujung)
    s.hl(x0, y0 + 13, lebar, aksen).hl(x0, y0 + 14, lebar, `${aksen}${alfa}`)
    if (f % 4 === 3) s.px(x0 + lebar - 1, y0 + 13, shade(aksen, -0.5))   // satu titik berkedip
    return s
  }
}

// ---------------------------------------------------------------------- kursi pop

/** Kursi cangkang ala Eames: depan / belakang / samping, kaki kayu. */
function kursiPop(warna) {
  const gelap = shade(warna, -0.25), terang = shade(warna, 0.35)
  const depan = () => {
    const s = new Spr(16, 16)
    s.rrect(3, 1, 10, 8, warna).hl(4, 1, 8, terang).frame(3, 1, 10, 8, gelap)
    s.rrect(2, 8, 12, 4, terang).hl(3, 11, 10, warna)
    s.vl(4, 12, 3, KAYU_GELAP).vl(11, 12, 3, KAYU_GELAP).vl(6, 12, 2, KAYU).vl(9, 12, 2, KAYU)
    s.hl(3, 15, 10, SHADOW)
    return s
  }
  const belakang = () => {
    const s = new Spr(16, 16)
    s.rrect(2, 0, 12, 11, gelap).rrect(3, 1, 10, 9, warna).hl(4, 1, 8, terang)
    s.px(7, 4, terang).px(8, 4, terang)
    s.vl(4, 11, 4, KAYU_GELAP).vl(11, 11, 4, KAYU_GELAP)
    s.hl(3, 15, 10, SHADOW)
    return s
  }
  const samping = () => {
    const s = new Spr(16, 16)
    s.rect(3, 1, 3, 9, gelap).vl(3, 1, 9, warna)
    s.rrect(3, 8, 10, 3, warna).hl(4, 8, 8, terang)
    s.line(5, 11, 3, 15, KAYU_GELAP).line(11, 11, 13, 15, KAYU_GELAP)
    s.hl(3, 15, 10, SHADOW)
    return s
  }
  return { depan, belakang, samping }
}

/** Kursi kantor ergonomis pastel (dilihat dari belakang, karyawan menghadap meja). */
export function kursiKantorPastel() {
  const s = new Spr(16, 16)
  s.rrect(3, 0, 10, 9, '#6c5ba7')
  for (let y = 2; y < 8; y += 2) s.hl(4, y, 8, WARNA.lilac)
  s.hl(4, 0, 8, '#cbb8ff')
  s.rect(1, 6, 2, 5, '#4b3f7a').rect(13, 6, 2, 5, '#4b3f7a')
  s.rect(2, 9, 12, 3, '#8f7ad6').hl(2, 9, 12, '#b8a6f5')
  s.rect(7, 12, 2, 2, '#9aa2ae')
  s.hl(3, 14, 10, '#3b3450')
  for (const x of [3, 7, 12]) s.px(x, 15, WARNA.tinta)
  return s
}

// ------------------------------------------------------------------- ruang rapat

/** Meja brainstorm putih panjang, penuh laptop berstiker, sticky note, boba, dan donat. */
function mejaBrainstorm() {
  const s = new Spr(96, 32)
  s.rrect(2, 4, 92, 19, '#e3dcf7')
  s.rrect(3, 4, 90, 17, '#ffffff')
  s.hl(6, 5, 84, '#f4f0ff')
  // strip warna-warni di tengah meja
  const strip = [WARNA.coral, WARNA.sunny, WARNA.mint, WARNA.sky, WARNA.lilac]
  strip.forEach((c, i) => s.rect(18 + i * 12, 12, 12, 2, c))
  // laptop (sisi atas & bawah) dengan stiker
  for (const [x, y, st] of [[8, 6, WARNA.coral], [34, 6, WARNA.mint], [60, 6, WARNA.sunny], [20, 15, WARNA.sky], [46, 15, WARNA.pink], [72, 15, WARNA.lilac]]) {
    s.rect(x, y, 9, 5, KROM).frame(x, y, 9, 5, KROM_GELAP).px(x + 2, y + 2, st).px(x + 6, y + 1, '#ffffff')
  }
  // sticky note, boba, donat
  for (const [x, y, c] of [[22, 7, WARNA.sunny], [25, 8, WARNA.pink], [50, 7, WARNA.mint], [84, 7, WARNA.sky], [8, 16, WARNA.coral], [86, 16, WARNA.sunny]]) s.rect(x, y, 3, 3, c)
  for (const [x, y] of [[46, 7], [66, 16], [36, 16]]) s.rect(x, y, 2, 3, '#e8c9a0').px(x, y + 2, '#3b2a20').px(x + 1, y + 2, '#3b2a20').vl(x + 1, y - 1, 1, WARNA.coral)
  s.oval(78, 8.5, 2.5, 2, WARNA.pink).px(78, 8, '#ffffff').px(77, 9, WARNA.sunny)
  s.oval(12, 12.5, 2, 1.5, '#4fbf6f').px(12, 12, '#6fe08f')        // sukulen
  s.hl(3, 21, 90, '#cfc6ea')
  s.rect(4, 22, 88, 2, '#b9addf')
  for (const x of [12, 82]) s.rect(x, 24, 3, 6, WARNA.mint).vl(x, 24, 6, shade(WARNA.mint, 0.3))
  s.rect(10, 29, 76, 2, SHADOW)
  return s
}

/** Dinding sticky note warna-warni + coretan ide. */
function dindingSticky() {
  const s = new Spr(48, 32)
  s.rrect(1, 3, 46, 24, '#fdfbf6').frame(1, 3, 46, 24, '#cfc6ea')
  s.hl(2, 26, 44, '#b9addf')
  const warna = [WARNA.sunny, WARNA.pink, WARNA.mint, WARNA.sky, WARNA.peach, WARNA.lilac]
  for (let j = 0; j < 3; j++) for (let i = 0; i < 5; i++) {
    if ((i + j) % 4 === 3) continue
    const x = 4 + i * 6, y = 6 + j * 6, c = warna[(i * 2 + j) % warna.length]
    s.rect(x, y, 5, 5, c).hl(x, y, 5, shade(c, 0.3)).hl(x + 1, y + 2, 3, shade(c, -0.3))
  }
  // coretan: bola lampu ide + panah
  s.oval(40, 11, 3, 3, WARNA.sunny).rect(39, 14, 3, 2, KROM_GELAP).px(40, 10, '#ffffff')
  for (const [x, y] of [[36, 8], [44, 8], [40, 6], [35, 12], [45, 12]]) s.px(x, y, WARNA.sunny)
  s.line(34, 21, 44, 21, WARNA.coral).px(43, 20, WARNA.coral).px(43, 22, WARNA.coral)
  s.hl(34, 18, 7, WARNA.tinta)
  return s
}

// ----------------------------------------------------------------------- bean bag

function beanBagWarna(warna) {
  return () => {
    const s = new Spr(16, 16)
    s.oval(8, 10, 7, 5, shade(warna, -0.25))
    s.oval(8, 9.5, 6.5, 4.5, warna)
    s.oval(6, 8, 3, 2, shade(warna, 0.35))
    s.oval(9, 10, 2, 1, shade(warna, -0.12))
    s.hl(3, 15, 10, SHADOW)
    return s
  }
}

// -------------------------------------------------------------------------- lounge

/** Kursi telur gantung dari rotan, berayun pelan (4 frame). */
function eggChair(f = 0) {
  const s = new Spr(32, 48)
  s.oval(16, 45, 9, 2, '#00000025')
  // tiang lengkung
  s.rect(14, 42, 4, 3, KROM_GELAP)
  for (let y = 4; y < 43; y++) s.px(15 + Math.round(Math.sin((y - 4) / 40 * Math.PI) * -9), y, KROM).px(16 + Math.round(Math.sin((y - 4) / 40 * Math.PI) * -9), y, KROM_GELAP)
  s.hl(6, 3, 12, KROM).hl(6, 4, 12, KROM_GELAP)
  const ayun = [0, 1, 0, -1][f % 4]
  s.vl(17 + ayun, 4, 9, '#6b5a4a')                                   // rantai
  const cx = 17 + ayun
  s.oval(cx, 25, 9, 12, '#b07a45')
  for (let y = 14; y < 37; y += 3) s.hl(cx - 8, y, 17, '#c99257')     // anyaman
  s.oval(cx, 27, 6, 8, '#5c3b22')
  s.oval(cx, 29, 5, 6, WARNA.pink).oval(cx - 1, 27, 2, 2, shade(WARNA.pink, 0.4))   // bantal
  return s
}

// ------------------------------------------------------------------------- kafe

/** Coffee bar: meja kayu + ubin mint, mesin espresso, etalase kue, cangkir. */
function coffeeBar() {
  const s = new Spr(64, 32)
  s.rect(1, 6, 62, 9, '#f3e9da').hl(1, 6, 62, '#fffaf2').hl(1, 14, 62, '#d8c8b0')   // meja atas
  // mesin espresso
  s.rrect(4, 0, 16, 11, '#e9edf2').rect(5, 1, 14, 3, WARNA.coral).hl(5, 1, 14, shade(WARNA.coral, 0.3))
  s.rect(6, 5, 3, 2, KROM_GELAP).rect(15, 5, 3, 2, KROM_GELAP).px(11, 2, '#ffffff').px(13, 2, WARNA.sunny)
  s.rect(6, 8, 3, 2, '#ffffff').rect(15, 8, 3, 2, '#ffffff')
  // etalase kue (kaca)
  s.rrect(36, 2, 22, 11, '#bfe6ff88').frame(36, 2, 22, 11, '#ffffffaa')
  for (const [x, c] of [[39, '#d99a4e'], [45, WARNA.pink], [51, '#8a5a3c']]) s.oval(x + 2, 9, 2.5, 1.5, c).px(x + 2, 8, shade(c, 0.4))
  s.oval(42, 5.5, 2, 1, WARNA.sunny).oval(50, 5.5, 2, 1, '#e8c9a0')
  // cangkir & gelas boba
  for (const x of [24, 28]) s.rect(x, 9, 3, 3, '#ffffff').hl(x, 9, 3, '#6b4226')
  s.rect(31, 8, 3, 4, '#e8c9a0').hl(31, 11, 3, '#3b2a20').vl(32, 6, 2, WARNA.coral)
  // badan meja: ubin mint
  s.rect(1, 15, 62, 14, WARNA.mint)
  for (let y = 15; y < 29; y += 4) s.hl(1, y, 62, shade(WARNA.mint, -0.18))
  for (let y = 15; y < 29; y += 4) for (let x = 1 + ((y / 4) % 2) * 4; x < 63; x += 8) s.vl(x, y, 4, shade(WARNA.mint, -0.18))
  s.hl(1, 15, 62, KAYU).hl(1, 16, 62, KAYU_GELAP)
  s.rect(1, 29, 62, 2, '#2f6b56').hl(2, 31, 60, SHADOW)
  return s
}

/** Kursi bar bundar, kaki krom. */
function barStool(warna) {
  return () => {
    const s = new Spr(16, 16)
    s.oval(8, 5, 5, 2.5, shade(warna, -0.2)).oval(8, 4.5, 4.5, 2, warna).hl(6, 3, 3, shade(warna, 0.4))
    s.vl(7, 7, 6, KROM).vl(8, 7, 6, KROM_GELAP)
    s.hl(5, 10, 6, KROM_GELAP)
    s.oval(7.5, 14, 4, 1, KROM_GELAP).hl(4, 15, 8, SHADOW)
    return s
  }
}

/** Papan menu kapur. */
function papanMenu() {
  const s = new Spr(32, 32)
  s.rrect(2, 3, 28, 24, KAYU_GELAP).rect(4, 5, 24, 20, '#2e3a35')
  // tulisan "KOPI" kecil
  const teks = 'KOPI'
  ;[...teks].forEach((h, i) => HURUF[h].forEach((b, j) => [...b].forEach((c, k) => { if (c === '#') s.px(7 + i * 4 + k, 7 + j, '#ffffff') })))
  for (const [y, w, c] of [[14, 12, '#cfd8d4'], [17, 10, '#cfd8d4'], [20, 13, '#cfd8d4']]) s.hl(6, y, w, c).px(23, y, WARNA.sunny).px(24, y, WARNA.sunny)
  s.rect(20, 7, 5, 4, '#ffffff').px(25, 8, '#ffffff').hl(20, 7, 5, WARNA.peach)   // cangkir
  return s
}

// ---------------------------------------------------------------------------- gym

function treadmill() {
  const s = new Spr(16, 32)
  s.rect(2, 1, 12, 5, '#2b2f3a').rect(4, 2, 8, 2, '#5ad1ff').px(5, 2, '#ffffff')    // konsol + layar
  s.vl(2, 6, 4, WARNA.coral).vl(13, 6, 4, WARNA.coral)                                 // pegangan
  s.rrect(2, 9, 12, 22, '#3a3f4c')
  s.rect(4, 10, 8, 20, '#22252e')
  for (let y = 12; y < 30; y += 4) s.hl(4, y, 8, '#2e323d')
  s.hl(2, 30, 12, WARNA.coral).hl(2, 31, 12, SHADOW)
  return s
}

function rakDumbbell() {
  const s = new Spr(32, 16)
  s.rect(2, 6, 28, 2, KROM_GELAP).rect(2, 11, 28, 2, KROM_GELAP)
  s.vl(2, 4, 11, '#4a5060').vl(29, 4, 11, '#4a5060')
  const warna = [WARNA.coral, WARNA.sunny, WARNA.mint, WARNA.sky, WARNA.lilac]
  warna.forEach((c, i) => {
    const x = 4 + i * 5
    s.rect(x, 4, 2, 3, c).rect(x + 3, 4, 2, 3, c).hl(x + 2, 5, 1, KROM)
    s.rect(x, 9, 2, 3, shade(c, -0.2)).rect(x + 3, 9, 2, 3, shade(c, -0.2)).hl(x + 2, 10, 1, KROM)
  })
  s.hl(2, 15, 28, SHADOW)
  return s
}

/** Samsak merah tergantung, bergoyang pelan (4 frame). */
function samsak(f = 0) {
  const s = new Spr(16, 32)
  s.hl(3, 0, 10, '#4a5060').vl(8, 1, 6, KROM_GELAP)
  const g = [0, 1, 0, -1][f % 4]
  s.rrect(4 + g, 7, 8, 20, '#d94a4f').rect(5 + g, 8, 2, 18, '#ff6b6b')
  s.hl(4 + g, 10, 8, '#1f1f26').hl(4 + g, 23, 8, '#1f1f26')
  s.oval(8, 30, 4, 1, SHADOW)
  return s
}

function benchBarbel() {
  const s = new Spr(16, 32)
  s.hl(0, 4, 16, KROM).rect(0, 2, 2, 5, '#2b2f3a').rect(14, 2, 2, 5, '#2b2f3a')   // barbel
  s.vl(3, 3, 6, KROM_GELAP).vl(12, 3, 6, KROM_GELAP)
  s.rrect(4, 8, 8, 20, '#2b2f3a').rect(5, 9, 6, 18, WARNA.lilac).hl(5, 9, 6, shade(WARNA.lilac, 0.3))
  s.vl(5, 28, 3, KROM_GELAP).vl(10, 28, 3, KROM_GELAP).hl(4, 31, 8, SHADOW)
  return s
}

function cerminGym() {
  const s = new Spr(48, 32)
  s.rrect(1, 3, 46, 24, KROM_GELAP).rect(3, 5, 42, 20, '#d6ecf5')
  for (let i = 0; i < 3; i++) s.line(8 + i * 14, 24, 14 + i * 14, 6, '#f3fbff').line(9 + i * 14, 24, 15 + i * 14, 6, '#f3fbff')
  s.hl(3, 24, 42, '#b8d4e0')
  return s
}

// --------------------------------------------------------------------- ruang game

function foosball() {
  const s = new Spr(48, 32)
  s.rrect(1, 3, 46, 20, '#3a2f5c').rect(4, 6, 40, 14, '#2fae5f').frame(4, 6, 40, 14, '#ffffff')
  s.vl(24, 6, 14, '#ffffff').oval(24, 13, 2, 2, '#ffffff').oval(24, 13, 1, 1, '#2fae5f')
  for (const x of [9, 16, 32, 39]) {
    s.vl(x, 2, 22, KROM)
    const tim = x === 9 || x === 32 ? WARNA.coral : WARNA.sky
    for (const y of [8, 13, 18]) s.rect(x - 1, y, 3, 2, tim)
  }
  s.px(26, 11, '#ffffff')
  s.rect(2, 23, 44, 3, '#2a2245').rect(4, 26, 3, 5, '#2a2245').rect(41, 26, 3, 5, '#2a2245').hl(6, 31, 36, SHADOW)
  return s
}

// ---------------------------------------------------------------------- dekorasi

function posterRoket() {
  const s = new Spr(16, 32)
  s.rect(2, 4, 12, 20, '#2b2540').frame(2, 4, 12, 20, WARNA.sunny)
  for (const [x, y] of [[4, 7], [11, 9], [5, 19], [12, 20], [9, 6]]) s.px(x, y, '#ffffff')
  s.rect(7, 9, 3, 7, '#ffffff').px(8, 8, '#ffffff').px(8, 7, WARNA.coral).px(8, 11, WARNA.sky)
  s.px(6, 15, WARNA.coral).px(10, 15, WARNA.coral)
  s.px(8, 17, WARNA.sunny).px(7, 17, '#ff9a3c').px(9, 17, '#ff9a3c').px(8, 18, '#ff9a3c')
  s.hl(4, 22, 8, WARNA.sunny)
  return s
}

function posterSenyum() {
  const s = new Spr(16, 32)
  s.rect(2, 4, 12, 20, WARNA.pink).frame(2, 4, 12, 20, '#ffffff')
  s.oval(8, 12, 4, 4, WARNA.sunny).px(6, 11, WARNA.tinta).px(10, 11, WARNA.tinta)
  s.px(6, 14, WARNA.tinta).hl(7, 15, 3, WARNA.tinta).px(10, 14, WARNA.tinta)
  s.hl(4, 19, 8, '#ffffff').hl(5, 21, 6, '#ffffff')
  return s
}

function posterGelombang() {
  const s = new Spr(16, 32)
  s.rect(2, 4, 12, 20, WARNA.cream).frame(2, 4, 12, 20, WARNA.tinta)
  s.oval(10, 9, 2, 2, WARNA.coral)
  for (let x = 3; x < 13; x++) {
    s.px(x, 15 + Math.round(Math.sin(x / 1.6) * 1.5), WARNA.sky).px(x, 18 + Math.round(Math.sin(x / 1.6 + 1) * 1.5), WARNA.mint)
  }
  s.rect(3, 20, 10, 3, WARNA.lilac)
  return s
}

// ------------------------------------------------------------------- daftar item

export const GENZ_SINGLE = [
  ['BRAINSTORM_TABLE', 'Meja Brainstorm', 'desks', mejaBrainstorm, 6, 2, 0],
  ['STICKY_WALL', 'Dinding Sticky Note', 'wall', dindingSticky, 3, 2, 0, { walls: true }],
  ['BEAN_BAG_PINK', 'Bean Bag Pink', 'decor', beanBagWarna(WARNA.pink), 1, 1, 0],
  ['BEAN_BAG_MINT', 'Bean Bag Mint', 'decor', beanBagWarna(WARNA.mint), 1, 1, 0],
  ['BEAN_BAG_LILAC', 'Bean Bag Lilac', 'decor', beanBagWarna(WARNA.lilac), 1, 1, 0],
  ['BEAN_BAG_SKY', 'Bean Bag Biru', 'decor', beanBagWarna(WARNA.sky), 1, 1, 0],
  ['COFFEE_BAR', 'Coffee Bar', 'desks', coffeeBar, 4, 2, 1],
  ['BAR_STOOL_CORAL', 'Kursi Bar Coral', 'chairs', barStool(WARNA.coral), 1, 1, 0],
  ['BAR_STOOL_SUNNY', 'Kursi Bar Kuning', 'chairs', barStool(WARNA.sunny), 1, 1, 0],
  ['MENU_BOARD', 'Papan Menu', 'wall', papanMenu, 2, 2, 0, { walls: true }],
  ['TREADMILL', 'Treadmill', 'misc', treadmill, 1, 2, 0],
  ['DUMBBELL_RACK', 'Rak Dumbbell', 'misc', rakDumbbell, 2, 1, 0],
  ['WEIGHT_BENCH', 'Bench Barbel', 'misc', benchBarbel, 1, 2, 0],
  ['GYM_MIRROR', 'Cermin Gym', 'wall', cerminGym, 3, 2, 0, { walls: true }],
  ['FOOSBALL', 'Meja Foosball', 'misc', foosball, 3, 2, 1],
  ['POSTER_ROCKET', 'Poster Roket', 'wall', posterRoket, 1, 2, 0, { walls: true }],
  ['POSTER_SMILE', 'Poster Senyum', 'wall', posterSenyum, 1, 2, 0, { walls: true }],
  ['POSTER_WAVE', 'Poster Ombak', 'wall', posterGelombang, 1, 2, 0, { walls: true }],
]

export const GENZ_ANIMASI = [
  ['NEON_RICKO', 'Neon RICKO', 'wall', neonTeks('RICKO', '#ffd166', '#ff6b81'), 4, 3, 2, 0, { walls: true }],
  ['NEON_VIBES', 'Neon VIBES', 'wall', neonTeks('VIBES', '#ff8fd0', '#7cc6ff'), 4, 3, 2, 0, { walls: true }],
  ['NEON_KOPI', 'Neon KOPI', 'wall', neonTeks('KOPI', '#ffb38a', '#5fe0b0'), 4, 3, 2, 0, { walls: true }],
  ['NEON_GYM', 'Neon GYM', 'wall', neonTeks('GYM', '#5fe0b0', '#ffd166'), 4, 3, 2, 0, { walls: true }],
  ['NEON_CHILL', 'Neon CHILL', 'wall', neonTeks('CHILL', '#7cc6ff', '#ffd166'), 4, 3, 2, 0, { walls: true }],
  ['NEON_IDE', 'Neon IDE', 'wall', neonTeks('IDE', '#7cc6ff', '#ffd166'), 4, 3, 2, 0, { walls: true }],
  ['EGG_CHAIR', 'Kursi Telur Gantung', 'decor', eggChair, 4, 2, 3, 1],
  ['PUNCH_BAG', 'Samsak', 'misc', samsak, 4, 1, 2, 1],
]

/** Kursi berputar (depan/belakang/samping): id, nama, gambar. */
export const GENZ_ROTASI = [
  ['POP_CHAIR_CORAL', 'Kursi Pop Coral', kursiPop(WARNA.coral)],
  ['POP_CHAIR_MINT', 'Kursi Pop Mint', kursiPop(WARNA.mint)],
  ['POP_CHAIR_SUNNY', 'Kursi Pop Kuning', kursiPop(WARNA.sunny)],
  ['POP_CHAIR_LILAC', 'Kursi Pop Lilac', kursiPop(WARNA.lilac)],
  ['POP_CHAIR_SKY', 'Kursi Pop Biru', kursiPop(WARNA.sky)],
]
