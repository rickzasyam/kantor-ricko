// Ruang game (main santai ala ryokan) & dojo. Tetap seru, tapi warnanya hangat dan redup:
// kayu walnut, linen, sage, persimmon -- tidak ada neon.
import { Spr } from '../lib/sprite.mjs'
import { P, acak, alfa, bayangan, kayuAtas, kayuDepan } from '../lib/bahan.mjs'

const OAK = [P.oak0, P.oak1, P.oak2, P.oak3]
const OAK_DEPAN = [P.oak2, P.oak3, P.oak4, P.oak5]

// ------------------------------------------------------------------- ruang game

/** TV berbingkai kayu: gim platformer berlatar senja, kucing kecil melompat (4 frame). */
function tvGame(f = 0) {
  const s = new Spr(48, 32)
  s.rect(2, 7, 44, 22, P.wal2).hl(2, 7, 44, P.wal1)
  s.rect(3, 8, 42, 20, P.arang4)
  // langit senja
  const langit = [P.kaki0, P.kaki0, P.momiji0, P.linen1, P.linen1, P.sakura0]
  for (let y = 9; y < 20; y++) s.hl(4, y, 40, langit[Math.min(5, Math.floor((y - 9) / 2))])
  s.oval(34, 13, 3, 3, P.cahaya0)
  // gunung & bukit
  for (let x = 4; x < 44; x++) {
    const g = 17 - Math.round(Math.max(0, 4 - Math.abs(x - 14) * 0.5)) - Math.round(Math.max(0, 3 - Math.abs(x - 28) * 0.4))
    s.vl(x, g, 20 - g, P.aizome1)
  }
  s.rect(4, 20, 40, 7, P.sage2).hl(4, 20, 40, P.sage1)
  for (let x = 5; x < 44; x += 5) s.px(x, 23, P.sage3)
  s.rect(26, 15, 7, 2, P.oak2).hl(26, 15, 7, P.oak1)                   // panggung kayu
  // kucing pahlawan
  const hx = 10 + [0, 3, 6, 3][f % 4], loncat = f % 4 === 2 ? 3 : 0
  s.rect(hx, 17 - loncat, 4, 3, P.linen0).px(hx, 16 - loncat, P.linen0).px(hx + 3, 16 - loncat, P.linen0)
  s.px(hx + 1, 18 - loncat, P.tinta).px(hx + 3, 18 - loncat, P.tinta).px(hx + 4, 19 - loncat, P.kaki1)
  // koin berputar
  if (f % 2) s.vl(30, 12, 2, P.emas0); else s.rect(29, 12, 2, 2, P.emas0)
  s.hl(5, 10, 6, P.linen0).hl(37, 10, 5, P.emas0)                       // skor
  s.hl(3, 29, 42, alfa(P.tinta, 0.2))
  return s
}

/** Lemari TV rendah oak: konsol, dua stik, kaset, tanaman kecil. */
function lemariTv() {
  const s = new Spr(48, 16)
  s.hl(2, 15, 44, P.bayang)
  kayuAtas(s, 1, 4, 46, 3, OAK, 301)
  kayuDepan(s, 1, 7, 46, 7, OAK_DEPAN, 302)
  for (const x0 of [3, 25]) {
    s.rect(x0, 8, 20, 5, P.oak3)
    for (let x = x0 + 1; x < x0 + 20; x += 2) s.vl(x, 8, 5, P.oak2)
  }
  s.rect(6, 0, 5, 5, P.linen1).rect(7, 1, 3, 3, P.linen2).px(10, 1, P.sage1)       // konsol
  s.rect(14, 2, 5, 2, P.arang2).px(15, 2, P.arang1).px(17, 2, P.arang1)          // stik 1
  s.rect(20, 2, 5, 2, P.linen1).px(21, 2, P.linen2).px(23, 2, P.linen2)          // stik 2
  s.rect(29, 1, 2, 4, P.aizome1).rect(31, 1, 2, 4, P.kaki1).rect(33, 2, 2, 3, P.sage2)
  s.rect(40, 2, 4, 3, P.liat1).oval(42, 1, 2, 1.4, P.daun2)
  return s
}

/** Kotatsu: meja rendah berselimut futon (motif kotak indigo-persimmon), semangkuk jeruk mikan. */
function kotatsu() {
  const s = new Spr(32, 32)
  bayangan(s, 16, 29, 14, 2.5)
  // selimut futon menjuntai
  s.rrect(1, 12, 30, 17, P.aizome2)
  for (let y = 13; y < 28; y++) for (let x = 2; x < 30; x++) {
    if ((Math.floor(x / 4) + Math.floor(y / 4)) % 2 === 0) s.px(x, y, P.aizome1)
    if (x % 4 === 0 && y % 4 === 0) s.px(x, y, P.kaki0)
  }
  s.hl(2, 28, 28, P.aizome3)
  // papan meja oak
  kayuAtas(s, 4, 9, 24, 9, OAK, 303)
  s.hl(4, 18, 24, P.oak3).hl(4, 19, 24, alfa(P.wal4, 0.3))
  // mangkuk mikan
  s.oval(16, 13, 4.5, 2, P.oak3).oval(16, 12.5, 4.2, 1.6, P.oak2)
  for (const [x, y] of [[14, 11], [17, 11], [15.5, 9.8], [18.5, 12]]) s.oval(x, y, 1.6, 1.4, P.kaki1).px(x - 0.5, y - 0.5, P.kaki0)
  s.px(16, 8, P.daun2)
  // dua cangkir teh
  s.rect(7, 12, 2, 2, P.linen0).px(7, 12, P.matcha2).rect(23, 14, 2, 2, P.linen0).px(23, 14, P.matcha2)
  return s
}

/** Zaisu: kursi lantai tanpa kaki, sandaran berbantal. */
function zaisu(bantal) {
  return {
    depan() {
      const s = new Spr(16, 16)
      s.hl(2, 15, 12, P.bayang)
      s.rrect(3, 1, 10, 8, P.wal2).rrect(4, 2, 8, 6, bantal[1]).hl(4, 2, 8, bantal[0])
      s.rrect(2, 9, 12, 5, P.wal2).rrect(3, 9, 10, 4, bantal[1]).hl(3, 9, 10, bantal[0]).hl(3, 12, 10, bantal[2])
      return s
    },
    belakang() {
      const s = new Spr(16, 16)
      s.hl(2, 15, 12, P.bayang)
      s.rrect(2, 9, 12, 5, P.wal2).rrect(3, 10, 10, 3, bantal[1])
      s.rrect(3, 1, 10, 10, P.wal2).rect(4, 2, 8, 8, P.wal1).hl(4, 2, 8, P.wal0)
      s.px(7, 6, P.wal3).px(8, 6, P.wal3)
      return s
    },
    samping() {
      const s = new Spr(16, 16)
      s.hl(2, 15, 12, P.bayang)
      s.line(3, 2, 5, 11, P.wal2).line(4, 2, 6, 11, P.wal1)
      s.rrect(4, 10, 10, 4, P.wal2).rect(5, 10, 8, 2, bantal[1]).hl(5, 10, 8, bantal[0])
      return s
    },
  }
}

/** Mesin arcade lemari walnut: papan nama krem, layar blok jatuh warna redup (4 frame). */
function arcade(f = 0) {
  const s = new Spr(16, 32)
  s.hl(1, 31, 15, P.bayang)
  s.rect(1, 1, 14, 30, P.wal2).rect(13, 1, 2, 30, P.wal3).vl(1, 1, 30, P.wal1)
  s.rect(2, 2, 11, 4, P.linen1).hl(2, 2, 11, P.linen0)
  s.px(4, 3, P.kaki1).px(5, 3, P.kaki1).px(7, 4, P.sage3).px(8, 3, P.sage3).px(10, 3, P.aizome1)
  s.rect(3, 7, 9, 9, '#2c302b')
  const blok = [[4, 14, P.sage2], [5, 14, P.sage2], [6, 14, P.kaki1], [7, 14, P.kaki1], [8, 14, P.emas0], [9, 14, P.aizome0], [10, 14, P.aizome0],
    [4, 13, P.liat0], [5, 13, P.sage2], [9, 13, P.emas0], [10, 13, P.liat0], [4, 12, P.liat0]]
  for (const [x, y, c] of blok) s.px(x, y, c)
  const jatuh = [8, 9, 10, 11][f % 4]
  s.px(6, jatuh, P.matcha1).px(7, jatuh, P.matcha1).px(7, jatuh - 1, P.matcha1)
  s.hl(4, 8, 3, P.linen1).hl(9, 8, 2, P.emas0)
  s.rect(2, 17, 11, 4, P.wal3).hl(2, 17, 11, P.wal1)
  s.vl(5, 16, 2, P.linen2).px(5, 15, P.shu1)
  s.px(9, 19, P.kaki1).px(11, 19, P.sage1).px(10, 18, P.linen0)
  s.rect(6, 23, 3, 3, P.wal4).vl(7, 23, 3, P.emas1)
  s.rect(2, 28, 11, 3, P.wal3)
  return s
}

/** Meja biliar walnut berkain hijau zaitun, sudut kuningan. */
function biliar() {
  const s = new Spr(64, 48)
  s.rect(9, 43, 46, 3, P.bayang)
  s.rrect(1, 4, 62, 34, P.wal2).hl(2, 4, 60, P.wal1).hl(2, 37, 60, P.wal3)
  s.rect(5, 8, 54, 26, P.sage3)
  for (let k = 0; k < 40; k++) { const r = acak(310 + k); s.px(6 + Math.floor(r() * 52), 9 + Math.floor(r() * 24), P.sage4) }
  s.frame(5, 8, 54, 26, P.sage4).hl(6, 9, 52, alfa(P.sage2, 0.6))
  for (const [x, y] of [[4, 7], [31, 6], [58, 7], [4, 33], [31, 34], [58, 33]]) s.rect(x, y, 3, 3, P.arang4).px(x, y, P.emas1)
  for (const x of [17, 45]) s.px(x, 5, P.linen1).px(x, 36, P.linen1)
  const bola = [[44, 20, P.emas0], [47, 18, P.aizome1], [47, 22, P.shu1], [50, 16, P.sage5], [50, 20, P.arang4], [50, 24, P.kaki1], [53, 18, P.matcha3], [53, 22, P.liat2]]
  for (const [x, y, c] of bola) s.rect(x, y, 2, 2, c).px(x, y, alfa(P.linen0, 0.6))
  s.rect(16, 20, 2, 2, P.linen0)
  s.line(5, 30, 15, 22, P.oak1).px(15, 22, P.aizome1)
  s.rect(1, 38, 62, 4, P.wal3).hl(1, 38, 62, P.wal2)
  s.rect(4, 42, 5, 5, P.wal3).rect(55, 42, 5, 5, P.wal3).hl(4, 42, 5, P.wal2).hl(55, 42, 5, P.wal2)
  return s
}

/** Meja foosball kayu, lapangan sage, pemain indigo vs persimmon. */
function foosball() {
  const s = new Spr(48, 32)
  s.hl(6, 31, 36, P.bayang)
  s.rrect(1, 3, 46, 20, P.oak3).hl(2, 3, 44, P.oak2)
  s.rect(4, 6, 40, 14, P.sage2).frame(4, 6, 40, 14, P.linen1)
  s.vl(24, 6, 14, P.linen1).oval(24, 13, 2, 2, P.linen1).oval(24, 13, 1, 1, P.sage2)
  for (const x of [9, 16, 32, 39]) {
    s.vl(x, 2, 22, P.linen2).px(x, 1, P.wal3).px(x, 24, P.wal3)
    const tim = x === 9 || x === 32 ? P.kaki1 : P.aizome1
    for (const y of [8, 13, 18]) s.rect(x - 1, y, 3, 2, tim).px(x - 1, y, alfa(P.linen0, 0.5))
  }
  s.px(26, 11, P.linen0)
  s.rect(2, 23, 44, 3, P.oak4).rect(4, 26, 3, 5, P.oak4).rect(41, 26, 3, 5, P.oak4)
  return s
}

/** Mesin gachapon (kapsul mainan): badan persimmon redup, kubah kaca berisi kapsul pastel. */
function gachapon() {
  const s = new Spr(16, 32)
  s.hl(2, 31, 12, P.bayang)
  s.rect(2, 16, 12, 15, P.kaki2).vl(2, 16, 15, P.kaki1).vl(13, 16, 15, P.kaki3).hl(2, 30, 12, P.kaki3)
  s.oval(8, 21, 2.6, 2.6, P.linen1).oval(8, 21, 1.4, 1.4, P.linen2).hl(7, 21, 3, P.kaki3)
  s.rect(5, 26, 6, 3, P.wal3).hl(5, 26, 6, P.arang3)
  s.rect(2, 14, 12, 2, P.linen1).hl(2, 14, 12, P.linen0)
  s.oval(8, 8, 6, 6.2, alfa(P.linen0, 0.55))
  const kap = [[5, 11, P.sakura1], [8, 12, P.matcha1], [11, 11, P.aizome0], [6, 8, P.emas0], [10, 8, P.liat0], [8, 5, P.sage1], [4, 6, P.linen0], [12, 6, P.sakura0]]
  for (const [x, y, c] of kap) s.oval(x, y, 1.6, 1.4, c).px(x - 0.5, y - 0.5, alfa(P.linen0, 0.7))
  s.oval(6, 5, 1.5, 2, alfa(P.linen0, 0.5))
  s.rect(6, 1, 4, 2, P.kaki2).hl(6, 1, 4, P.kaki1)
  return s
}

/** Bean bag linen bulat. */
function beanBag(ramp) {
  return () => {
    const s = new Spr(16, 16)
    s.hl(3, 15, 10, P.bayang)
    s.oval(8, 10, 7, 5, ramp[2]).oval(8, 9.5, 6.5, 4.5, ramp[1]).oval(6, 8, 3, 2, ramp[0])
    s.px(9, 10, ramp[2]).px(10, 11, ramp[2]).px(5, 11, alfa(ramp[2], 0.6))
    return s
  }
}

/** Cetakan bergaya ukiyo-e: kucing memegang stik gim. */
function posterKucing() {
  const s = new Spr(16, 32)
  s.rect(2, 8, 12, 19, P.oak4).rect(3, 9, 10, 17, P.linen1)
  s.oval(8, 19, 4, 4, P.linen0).rect(5, 13, 6, 4, P.linen0).px(5, 12, P.linen0).px(10, 12, P.linen0)
  s.px(6, 15, P.tinta).px(9, 15, P.tinta).px(7, 16, P.kaki1).px(8, 16, P.kaki1)
  s.hl(5, 14, 2, P.arang1).hl(9, 14, 2, P.arang1)
  s.rect(5, 20, 6, 2, P.arang2).px(6, 20, P.shu1).px(9, 20, P.aizome1)
  s.oval(11, 10, 1.5, 1.5, P.shu1)
  s.px(4, 24, P.shu1).px(4, 25, P.shu1)
  return s
}

/** Cetakan gunung Fuji senja. */
function posterFuji() {
  const s = new Spr(16, 32)
  s.rect(2, 8, 12, 19, P.oak4).rect(3, 9, 10, 17, P.kaki0)
  for (let y = 9; y < 17; y++) s.hl(3, y, 10, y < 12 ? P.momiji0 : y < 14 ? P.kaki0 : P.linen1)
  s.oval(10, 12, 1.6, 1.6, P.shu0)
  for (let j = 0; j < 7; j++) s.hl(8 - j, 16 + j, 1 + j * 2, j < 2 ? P.linen0 : P.aizome1)
  s.rect(3, 23, 10, 3, P.aizome2)
  for (let x = 3; x < 13; x += 3) s.px(x, 24, P.linen1)
  return s
}

// ----------------------------------------------------------------------- dojo

function treadmill() {
  const s = new Spr(16, 32)
  s.hl(2, 31, 12, P.bayang)
  s.rect(2, 1, 12, 5, P.arang3).rect(4, 2, 8, 2, '#3a4038').px(5, 2, P.sage1).px(9, 3, P.emas0)
  s.vl(2, 6, 4, P.oak3).vl(13, 6, 4, P.oak3)
  s.rrect(2, 9, 12, 22, P.arang2)
  s.rect(4, 10, 8, 20, P.arang4)
  for (let y = 12; y < 30; y += 4) s.hl(4, y, 8, P.arang3)
  s.rect(2, 10, 2, 20, P.oak2).rect(12, 10, 2, 20, P.oak3)
  s.hl(2, 30, 12, P.oak4)
  return s
}

function rakDumbbell() {
  const s = new Spr(32, 16)
  s.hl(2, 15, 28, P.bayang)
  s.rect(2, 6, 28, 2, P.oak2).hl(2, 6, 28, P.oak1).rect(2, 11, 28, 2, P.oak3).hl(2, 11, 28, P.oak2)
  s.vl(2, 4, 11, P.oak3).vl(29, 4, 11, P.oak4)
  for (let i = 0; i < 5; i++) {
    const x = 4 + i * 5
    s.rect(x, 4, 2, 3, P.arang3).rect(x + 3, 4, 2, 3, P.arang3).hl(x + 2, 5, 1, P.arang0).px(x, 4, P.arang1)
    s.rect(x, 9, 2, 3, P.arang2).rect(x + 3, 9, 2, 3, P.arang2).hl(x + 2, 10, 1, P.arang0).px(x, 9, P.arang1)
  }
  return s
}

function benchBarbel() {
  const s = new Spr(16, 32)
  s.hl(3, 31, 10, P.bayang)
  s.hl(0, 4, 16, P.arang0).rect(0, 2, 2, 5, P.arang3).rect(14, 2, 2, 5, P.arang3)
  s.vl(3, 3, 6, P.oak3).vl(12, 3, 6, P.oak4)
  s.rrect(4, 8, 8, 20, P.oak3).rect(5, 9, 6, 18, P.arang2).hl(5, 9, 6, P.arang1)
  s.vl(5, 28, 3, P.oak4).vl(10, 28, 3, P.oak4)
  return s
}

/** Samsak kanvas & kulit tergantung di balok kayu, bergoyang pelan (4 frame). */
function samsak(f = 0) {
  const s = new Spr(16, 32)
  s.hl(2, 0, 12, P.wal2).vl(8, 1, 5, P.arang2)
  const g = [0, 1, 0, -1][f % 4]
  s.rrect(4 + g, 6, 8, 21, P.liat1).rect(5 + g, 7, 2, 19, P.liat0).vl(11 + g, 7, 19, P.liat2)
  s.hl(4 + g, 9, 8, P.wal3).hl(4 + g, 23, 8, P.wal3)
  s.oval(8, 30, 4, 1, P.bayang)
  return s
}

function cerminDojo() {
  const s = new Spr(48, 32)
  s.rect(2, 8, 44, 20, P.oak3).hl(2, 8, 44, P.oak2)
  s.rect(4, 10, 40, 16, '#e9eee8')
  for (let i = 0; i < 3; i++) s.line(9 + i * 14, 25, 15 + i * 14, 11, alfa(P.linen0, 0.9)).line(10 + i * 14, 25, 16 + i * 14, 11, alfa(P.linen0, 0.6))
  s.hl(4, 25, 40, P.batu1)
  s.hl(2, 28, 44, alfa(P.tinta, 0.2))
  return s
}

/** Rak dinding dua bokken (pedang kayu) + ikat kepala hachimaki. */
function rakBokken() {
  const s = new Spr(32, 32)
  s.rect(4, 11, 3, 14, P.wal2).rect(25, 11, 3, 14, P.wal2).hl(4, 11, 3, P.wal1).hl(25, 11, 3, P.wal1)
  for (const y of [14, 20]) {
    s.hl(3, y, 26, P.oak2).hl(3, y + 1, 26, P.oak3)
    s.hl(3, y + 1, 5, P.arang3).px(8, y, P.oak4).px(8, y + 1, P.oak4)
  }
  s.rect(10, 24, 12, 2, P.linen0).px(14, 24, P.shu1).px(15, 24, P.shu1).line(22, 25, 24, 27, P.linen0)
  return s
}

export const SINGLE = [
  ['TV_CONSOLE', 'Lemari TV Oak', 'desks', lemariTv, 3, 1, 0],
  ['KOTATSU', 'Kotatsu', 'desks', kotatsu, 2, 2, 1],
  ['BILLIARD_TABLE', 'Meja Biliar Walnut', 'misc', biliar, 4, 3, 1],
  ['FOOSBALL', 'Meja Foosball Kayu', 'misc', foosball, 3, 2, 1],
  ['GACHAPON', 'Mesin Gachapon', 'misc', gachapon, 1, 2, 1],
  ['BEAN_BAG_OAT', 'Bean Bag Oat', 'decor', beanBag([P.linen1, P.linen2, P.linen3]), 1, 1, 0],
  ['BEAN_BAG_SAGE', 'Bean Bag Sage', 'decor', beanBag([P.sage1, P.sage2, P.sage3]), 1, 1, 0],
  ['BEAN_BAG_LIAT', 'Bean Bag Tanah Liat', 'decor', beanBag([P.liat0, P.liat1, P.liat2]), 1, 1, 0],
  ['BEAN_BAG_INDIGO', 'Bean Bag Indigo', 'decor', beanBag([P.aizome0, P.aizome1, P.aizome2]), 1, 1, 0],
  ['POSTER_KUCING', 'Cetakan Kucing Gamer', 'wall', posterKucing, 1, 2, 0, { walls: true }],
  ['POSTER_FUJI', 'Cetakan Fuji Senja', 'wall', posterFuji, 1, 2, 0, { walls: true }],
  ['TREADMILL', 'Treadmill', 'misc', treadmill, 1, 2, 0],
  ['DUMBBELL_RACK', 'Rak Dumbel Besi', 'misc', rakDumbbell, 2, 1, 0],
  ['WEIGHT_BENCH', 'Bench Barbel', 'misc', benchBarbel, 1, 2, 0],
  ['GYM_MIRROR', 'Cermin Dojo', 'wall', cerminDojo, 3, 2, 0, { walls: true }],
  ['RAK_BOKKEN', 'Rak Bokken', 'wall', rakBokken, 2, 2, 0, { walls: true }],
]

export const ANIMASI = [
  ['GAME_TV', 'TV Game Kayu', 'wall', tvGame, 4, 3, 2, 0, { walls: true }],
  ['ARCADE_MACHINE', 'Mesin Arcade Walnut', 'misc', arcade, 4, 1, 2, 1],
  ['PUNCH_BAG', 'Samsak Kanvas', 'misc', samsak, 4, 1, 2, 1],
]

export const ROTASI = [
  ['ZAISU', 'Kursi Lantai Zaisu', zaisu([P.linen1, P.linen2, P.linen3])],
  ['ZAISU_SAGE', 'Kursi Lantai Zaisu Sage', zaisu([P.sage1, P.sage2, P.sage3])],
]

