// Furnitur ruang kerja, ruang pimpinan, dan ruang rapat -- gaya Japandi: oak terang, linen,
// rotan, keramik, aksen sage. Format daftar: [id, nama, kategori, gambar, fw, fh, baris latar, opsi].
import { Spr } from '../lib/sprite.mjs'
import { P, acak, alfa, bayangan, kayuAtas, kayuDepan, kain, daun, pot } from '../lib/bahan.mjs'

const OAK = [P.oak0, P.oak1, P.oak2, P.oak3]
const OAK_DEPAN = [P.oak2, P.oak3, P.oak4, P.oak5]

/** Anyaman rotan (kotak penyimpanan, sandaran kursi). */
export function anyaman(s, x, y, w, h, ramp = [P.rotan0, P.rotan1, P.rotan2, P.rotan3]) {
  s.rect(x, y, w, h, ramp[1])
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if ((i + j) % 3 === 0) s.px(x + i, y + j, ramp[2])
    else if ((i - j + 30) % 3 === 0) s.px(x + i, y + j, ramp[0])
  }
  s.frame(x, y, w, h, ramp[3])
  return s
}

/** Cangkir keramik kecil (yunomi / mug) dengan isi. */
function cangkir(s, x, y, glasir, isi, gagang = false) {
  s.rect(x, y + 1, 3, 3, glasir[1]).vl(x, y + 1, 3, glasir[0]).hl(x, y + 3, 3, glasir[2])
  s.hl(x, y, 3, isi)
  if (gagang) s.px(x + 3, y + 2, glasir[1])
  s.hl(x, y + 4, 3, P.bayang)
  return s
}

// ------------------------------------------------------------------ meja kerja

/** Meja kerja oak dengan kaki meruncing; `aksesori` menggambar barang di atasnya. */
function mejaKerja(seed, aksesori) {
  return () => {
    const s = new Spr(48, 32)
    s.rect(5, 28, 38, 3, P.bayang)
    // kaki meruncing
    for (const x of [3, 43]) s.rect(x, 24, 2, 6, P.oak3).vl(x + 1, 24, 6, P.oak4).px(x, 30, P.oak4).px(x + 1, 30, P.oak5)
    kayuAtas(s, 1, 8, 46, 14, OAK, seed)
    s.vl(1, 9, 13, P.oak2).vl(46, 9, 13, P.oak3)
    kayuDepan(s, 1, 22, 46, 3, OAK_DEPAN, seed + 1)
    for (const [x, y] of [[1, 8], [46, 8], [1, 24], [46, 24]]) s.hapus(x, y)
    // alas meja (felt sage) di bawah keyboard PC
    s.rect(14, 17, 20, 5, P.sage2).hl(14, 17, 20, P.sage1).hl(14, 21, 20, P.sage3)
    aksesori(s)
    return s
  }
}

const MEJA_A = mejaKerja(11, s => {
  // sukulen di pot tanah liat + mug matcha latte
  s.rect(5, 11, 5, 3, P.liat1).hl(5, 11, 5, P.liat0).hl(5, 13, 5, P.liat2)
  daun(s, 7.5, 9, 3, 2.4, [P.sage0, P.sage1, P.sage2, P.sage3, P.sage4], 12, 1.4)
  cangkir(s, 38, 12, [P.linen0, P.linen1, P.linen3], P.matcha2, true)
})
const MEJA_B = mejaKerja(21, s => {
  // tumpukan buku linen + yunomi seladon
  s.rect(4, 13, 8, 2, P.sage3).hl(4, 13, 8, P.sage2).px(11, 14, P.linen1)
  s.rect(5, 11, 7, 2, P.liat1).hl(5, 11, 7, P.liat0).px(11, 12, P.linen1)
  cangkir(s, 39, 13, [P.sage0, P.sage1, P.sage3], P.matcha3)
  s.rect(36, 18, 6, 3, P.linen0).hl(36, 18, 6, P.linen1).vl(39, 18, 3, P.linen2)   // buku catatan terbuka
})
const MEJA_C = mejaKerja(31, s => {
  // daruma kecil + buku catatan & pena
  s.oval(41, 13, 2.5, 3, P.shu1).oval(40.5, 12.5, 1.5, 1.5, P.linen0).px(40, 12, P.tinta).px(41, 12, P.tinta)
  s.px(39, 11, P.shu0).hl(39, 16, 5, P.bayang)
  s.rect(4, 12, 7, 5, P.linen0).frame(4, 12, 7, 5, P.linen2).hl(5, 14, 5, P.linen3)
  s.line(8, 11, 11, 15, P.arang3)
})

// ---------------------------------------------------------------------------- PC

const LAYAR = '#2e332e'
const KODE = [P.sage1, P.kaki0, P.aizome0, P.emas0, P.linen2, P.matcha1]
function layarKode(offset) {
  return s => {
    s.rect(2, 2, 12, 9, LAYAR)
    for (let row = 0; row < 4; row++) {
      const r = acak(row * 7 + offset * 3 + 5)
      const indent = Math.floor(r() * 3), len = 3 + Math.floor(r() * 6)
      s.hl(3 + indent, 3 + row * 2, Math.min(len, 10 - indent), KODE[(row + offset) % KODE.length])
    }
    s.px(3 + (offset % 3) * 2, 10, P.linen0)
  }
}
function layarMati(s) {
  s.rect(2, 2, 12, 9, '#26231f')
  s.line(4, 9, 10, 3, '#35312b').line(5, 9, 11, 3, '#2f2b26')
}

function pcDepan(layar) {
  const s = new Spr(16, 32)
  s.rrect(1, 1, 14, 11, P.arang3)                    // bingkai monitor tipis
  s.hl(2, 1, 12, P.arang2)
  layar(s)
  s.hl(2, 11, 12, P.arang4)
  s.px(13, 11, P.sage1)                               // lampu daya hijau sage
  s.rect(7, 12, 2, 4, P.oak3).vl(7, 12, 4, P.oak2)   // leher dudukan kayu
  s.rect(4, 16, 8, 2, P.oak2).hl(4, 16, 8, P.oak1).hl(4, 18, 8, P.bayang)
  s.rect(2, 20, 10, 2, P.linen1).hl(2, 22, 10, P.linen3)   // keyboard warna oat
  for (let x = 3; x < 11; x += 2) s.px(x, 20, P.linen2).px(x + 1, 21, P.linen2)
  s.rect(2, 23, 10, 1, P.oak2)                        // sandaran pergelangan kayu
  s.rrect(13, 20, 2, 3, P.linen1).px(13, 22, P.linen3)
  return s
}
function pcBelakang() {
  const s = new Spr(16, 32)
  s.rrect(1, 1, 14, 11, P.arang2)
  s.rect(2, 2, 12, 9, P.arang1).hl(2, 2, 12, P.arang0)
  s.oval(7.5, 6, 1.5, 1.5, P.linen2)
  s.rect(7, 12, 2, 4, P.oak3).vl(7, 12, 4, P.oak2)
  s.rect(4, 16, 8, 2, P.oak2).hl(4, 16, 8, P.oak1).hl(4, 18, 8, P.bayang)
  return s
}
function pcSamping() {
  const s = new Spr(16, 32)
  s.rect(9, 1, 2, 11, P.arang3).vl(9, 1, 11, P.arang2)
  s.rect(9, 12, 2, 4, P.oak3)
  s.rect(6, 16, 8, 2, P.oak2).hl(6, 16, 8, P.oak1).hl(6, 18, 8, P.bayang)
  s.rect(2, 20, 5, 2, P.linen1).hl(2, 22, 5, P.linen3)
  return s
}

/** Sprite grup MODERN_PC (dipakai furnitur.mjs, id lama dipertahankan supaya denah tetap cocok). */
export function pcSprites() {
  return {
    MODERN_PC_FRONT_ON_1: pcDepan(layarKode(0)),
    MODERN_PC_FRONT_ON_2: pcDepan(layarKode(1)),
    MODERN_PC_FRONT_ON_3: pcDepan(layarKode(2)),
    MODERN_PC_FRONT_OFF: pcDepan(layarMati),
    MODERN_PC_BACK: pcBelakang(),
    MODERN_PC_SIDE: pcSamping(),
  }
}

// ---------------------------------------------------------------------- kursi

/** Kursi kerja ergonomis: sandaran jaring arang, sandaran tangan bertutup kayu, dudukan oat. */
function kursiKerja() {
  const s = new Spr(16, 16)
  s.rrect(3, 0, 10, 9, P.arang2)
  for (let y = 1; y < 8; y += 2) s.hl(4, y, 8, P.arang1)
  s.hl(4, 0, 8, P.arang0)
  s.rect(1, 6, 2, 5, P.arang3).rect(13, 6, 2, 5, P.arang3)
  s.hl(1, 6, 2, P.oak2).hl(13, 6, 2, P.oak2)
  s.rect(2, 9, 12, 3, P.linen2).hl(2, 9, 12, P.linen1).hl(2, 11, 12, P.linen3)
  s.rect(7, 12, 2, 2, P.arang1)
  s.hl(3, 14, 10, P.arang3)
  for (const x of [3, 7, 12]) s.px(x, 15, P.arang4)
  return s
}

/** Kursi oak bersandaran anyaman rotan + bantal linen (seperti foto referensi). */
const kursiRotan = {
  depan() {
    const s = new Spr(16, 16)
    s.hl(3, 15, 10, P.bayang)
    s.rect(3, 0, 10, 9, P.oak3).hl(3, 0, 10, P.oak2)
    anyaman(s, 4, 1, 8, 7)
    s.rect(2, 8, 12, 4, P.linen1).hl(2, 8, 12, P.linen0).hl(2, 11, 12, P.linen3)
    s.vl(3, 12, 3, P.oak3).vl(12, 12, 3, P.oak3).vl(4, 12, 2, P.oak4).vl(11, 12, 2, P.oak4)
    return s
  },
  belakang() {
    const s = new Spr(16, 16)
    s.hl(3, 15, 10, P.bayang)
    s.rect(3, 0, 10, 10, P.oak3).hl(3, 0, 10, P.oak2)
    anyaman(s, 4, 1, 8, 8, [P.rotan1, P.rotan2, P.rotan2, P.rotan3])
    s.rect(2, 10, 12, 2, P.linen2)
    s.vl(3, 12, 3, P.oak3).vl(12, 12, 3, P.oak3)
    return s
  },
  samping() {
    const s = new Spr(16, 16)
    s.hl(3, 15, 10, P.bayang)
    s.rect(3, 0, 2, 10, P.oak3).vl(3, 0, 10, P.oak2)
    s.rect(4, 8, 9, 3, P.linen1).hl(4, 8, 9, P.linen0)
    s.line(4, 11, 3, 14, P.oak4).line(12, 11, 13, 14, P.oak3)
    return s
  },
}

/** Kursi rapat oak bersandaran bilah, bantal linen berwarna tanah. */
function kursiRapat(bantal) {
  const [t, d, g] = bantal
  return {
    depan() {
      const s = new Spr(16, 16)
      s.hl(3, 15, 10, P.bayang)
      s.rect(3, 1, 10, 2, P.oak2).hl(3, 1, 10, P.oak1)
      for (const x of [4, 7, 10]) s.rect(x, 3, 2, 5, P.oak2).vl(x + 1, 3, 5, P.oak3)
      s.vl(3, 3, 6, P.oak3).vl(12, 3, 6, P.oak3)
      s.rrect(2, 8, 12, 4, d).hl(3, 8, 10, t).hl(3, 11, 10, g)
      s.vl(3, 12, 3, P.oak3).vl(12, 12, 3, P.oak3).vl(5, 12, 2, P.oak4).vl(10, 12, 2, P.oak4)
      return s
    },
    belakang() {
      const s = new Spr(16, 16)
      s.hl(3, 15, 10, P.bayang)
      s.rect(3, 0, 10, 2, P.oak3).hl(3, 0, 10, P.oak2)
      for (const x of [3, 6, 9, 12]) s.vl(x, 2, 8, x === 3 || x === 12 ? P.oak4 : P.oak3)
      s.rect(2, 10, 12, 2, d).hl(2, 10, 12, t)
      s.vl(3, 12, 3, P.oak4).vl(12, 12, 3, P.oak4)
      return s
    },
    samping() {
      const s = new Spr(16, 16)
      s.hl(3, 15, 10, P.bayang)
      s.rect(3, 1, 2, 9, P.oak3).vl(3, 1, 9, P.oak2)
      s.rrect(4, 8, 9, 3, d).hl(5, 8, 7, t)
      s.vl(4, 11, 4, P.oak4).vl(12, 11, 4, P.oak3)
      return s
    },
  }
}

// ------------------------------------------------------- meja & barang pimpinan

/** Meja pimpinan: lempeng oak tebal, kotak rotan di bawah, lampu kuningan, vas ranting. */
function mejaPimpinan() {
  const s = new Spr(64, 32)
  s.rect(3, 29, 58, 2, P.bayang)
  // panel kaki samping
  kayuDepan(s, 2, 20, 5, 10, OAK_DEPAN, 41)
  kayuDepan(s, 57, 20, 5, 10, OAK_DEPAN, 42)
  // ruang kaki gelap + kotak anyaman rotan
  s.rect(7, 20, 50, 9, alfa(P.wal4, 0.35))
  anyaman(s, 9, 21, 13, 8)
  anyaman(s, 42, 21, 13, 8)
  s.hl(9, 21, 13, P.rotan0).hl(42, 21, 13, P.rotan0)
  // lempeng meja
  kayuAtas(s, 1, 7, 62, 12, OAK, 43)
  s.vl(1, 8, 11, P.oak2).vl(62, 8, 11, P.oak3)
  kayuDepan(s, 1, 19, 62, 2, OAK_DEPAN, 44)
  for (const [x, y] of [[1, 7], [62, 7]]) s.hapus(x, y)
  // vas kecil + ranting
  s.rect(6, 10, 4, 5, P.linen1).vl(6, 10, 5, P.linen0).vl(9, 10, 5, P.linen3).hl(6, 14, 4, P.linen3)
  s.line(8, 10, 6, 3, P.wal2).line(8, 9, 11, 4, P.wal2).px(5, 3, P.linen0).px(6, 2, P.rotan0).px(11, 3, P.linen0).px(12, 4, P.rotan0)
  // buku catatan & pena
  s.rect(13, 11, 9, 6, P.linen0).frame(13, 11, 9, 6, P.linen2).vl(17, 11, 6, P.linen2)
  s.line(19, 12, 22, 16, P.arang3)
  s.rect(24, 12, 3, 3, P.sage1).hl(24, 12, 3, P.matcha2).hl(24, 15, 3, P.bayang)   // yunomi teh hijau
  // lampu meja kuningan
  s.oval(55, 15, 3, 1.4, P.arang3).px(54, 14, P.arang2)
  s.line(55, 14, 52, 6, P.emas1).px(53, 7, P.emas0)
  s.rect(48, 3, 6, 3, P.emas1).hl(48, 3, 6, P.emas0).hl(48, 5, 6, P.emas2)
  s.hl(49, 6, 4, P.cahaya1)
  s.oval(50.5, 10, 4, 2, alfa(P.cahaya1, 0.25))
  return s
}

/** Akuarium aquascape (gaya Nature Aquarium) di atas kabinet oak, ikan berenang (4 frame). */
function akuarium(f = 0) {
  const s = new Spr(32, 32)
  s.hl(2, 31, 28, P.bayang)
  // kabinet
  kayuDepan(s, 1, 20, 30, 11, OAK_DEPAN, 51)
  s.hl(1, 20, 30, P.oak1).vl(16, 21, 9, P.oak4)
  s.px(14, 25, P.emas1).px(18, 25, P.emas1)
  // tutup lampu
  s.rect(1, 2, 30, 2, P.oak2).hl(1, 2, 30, P.oak1)
  // air: terang di atas
  for (let y = 4; y < 20; y++) s.hl(2, y, 28, y < 6 ? P.air1 : y < 12 ? P.air2 : P.air3)
  s.hl(2, 4, 28, P.cahaya0)
  s.vl(1, 4, 16, P.arang3).vl(30, 4, 16, P.arang3)
  // pasir & batu iwagumi
  s.rect(2, 17, 28, 3, P.linen3).hl(2, 17, 28, P.linen2)
  const r = acak(52)
  for (let k = 0; k < 10; k++) s.px(2 + Math.floor(r() * 28), 18 + Math.floor(r() * 2), P.linen4)
  s.oval(12, 15, 4, 3, P.batu2).oval(11, 14, 2.5, 1.6, P.batu1).px(14, 17, P.batu4)
  s.oval(18, 16, 2.5, 1.8, P.batu3).px(17, 15, P.batu1)
  // karpet tanaman
  for (let x = 3; x < 29; x++) if (r() < 0.7) s.px(x, 16 + (x % 3 === 0 ? 0 : 1), r() < 0.5 ? P.daun1 : P.daun0)
  // tanaman batang bergoyang
  const g = [0, 1, 0, -1][f % 4]
  for (const [x, t] of [[24, 9], [26, 11], [28, 8], [5, 7]]) {
    for (let y = 17 - t; y < 17; y++) s.px(x + (y < 17 - t / 2 ? g : 0), y, P.daun2)
    s.px(x - 1 + g, 17 - t, P.daun1).px(x + 1 + g, 18 - t, P.daun1)
  }
  // ikan kecil berwarna persimmon
  const ikan = [[8, 8], [11, 9], [9, 11], [21, 7]]
  ikan.forEach(([x, y], i) => {
    const dx = [0, 2, 4, 2][(f + i) % 4] * (i % 2 ? -1 : 1)
    s.hl(x + dx, y, 2, P.kaki1).px(x + dx + (i % 2 ? -1 : 2), y, P.kaki0)
  })
  for (const [x, y] of [[20, 13], [21, 10], [20, 6]]) s.px(x + (f % 2), 4 + ((y - 4 - f * 2 + 40) % 14), P.air0)
  s.vl(3, 5, 12, alfa(P.linen0, 0.35))
  return s
}

/** Bufet rendah oak berpintu bilah, di atasnya vas ranting kering, mangkuk, dan lampu bola. */
function bufet() {
  const s = new Spr(64, 32)
  s.rect(3, 30, 58, 2, P.bayang)
  kayuAtas(s, 1, 14, 62, 3, OAK, 61)
  kayuDepan(s, 1, 17, 62, 12, OAK_DEPAN, 62)
  // pintu bilah tegak (tategoshi) kiri & kanan, laci tengah
  for (const [x0, w] of [[3, 22], [39, 22]]) {
    s.rect(x0, 18, w, 10, P.oak3)
    for (let x = x0 + 1; x < x0 + w; x += 2) s.vl(x, 18, 10, P.oak2)
    s.frame(x0, 18, w, 10, P.oak4)
  }
  s.rect(27, 19, 10, 3, P.oak2).frame(27, 19, 10, 3, P.oak4).hl(30, 20, 4, P.oak4)
  s.rect(27, 24, 10, 3, P.oak2).frame(27, 24, 10, 3, P.oak4).hl(30, 25, 4, P.oak4)
  s.rect(3, 29, 2, 2, P.oak5).rect(59, 29, 2, 2, P.oak5)
  // vas tinggi + ranting kering & bunga kecil
  s.oval(12, 10, 4, 4, P.linen2).rect(10, 3, 4, 4, P.linen2).oval(11, 9, 2, 3, P.linen1).vl(15, 8, 4, P.linen3).hl(9, 13, 7, P.linen3)
  for (const [x1, y1] of [[7, -2], [16, -1], [4, 3], [19, 4]]) s.line(12, 4, x1, y1 + 2, P.wal3)
  const r = acak(63)
  for (const [x, y] of [[7, 0], [16, 1], [4, 5], [19, 6], [10, 1]]) for (let k = 0; k < 5; k++) s.px(x + Math.floor(r() * 3) - 1, y + Math.floor(r() * 3) - 1, r() < 0.5 ? P.linen0 : P.rotan0)
  // mangkuk & vas kecil
  s.oval(26, 12, 4, 2, P.sage1).hl(23, 11, 7, P.sage0).hl(24, 13, 5, P.sage3)
  s.rect(33, 8, 3, 6, P.arang2).hl(33, 8, 3, P.arang1).rect(37, 10, 3, 4, P.linen0).hl(37, 13, 3, P.linen2)
  // lampu bola (globe) di dudukan hitam
  s.rect(51, 10, 4, 4, P.arang3).hl(51, 10, 4, P.arang2)
  s.oval(53, 5, 4.5, 4.5, P.cahaya1).oval(52.3, 4.3, 3, 3, P.cahaya0).oval(54.5, 7, 2, 1.5, P.cahaya2)
  return s
}

/** Vas lantai besar berisi ranting kering bergerombol bunga kecil (fokus seperti referensi). */
function vasRanting() {
  const s = new Spr(32, 48)
  bayangan(s, 16, 45, 9, 2)
  // vas keramik matte
  s.oval(16, 39, 7.5, 6.5, P.linen3).oval(15, 38.5, 6.5, 5.8, P.linen2).oval(13.5, 37, 3, 3.5, P.linen1)
  s.rect(13, 31, 6, 3, P.linen2).vl(13, 31, 3, P.linen1).vl(18, 31, 3, P.linen3).hl(12, 31, 8, P.linen1)
  // ranting
  const cab = [[16, 31, 15, 20], [15, 20, 12, 10], [12, 10, 9, 3], [16, 29, 20, 18], [20, 18, 25, 9], [25, 9, 27, 4],
    [15, 23, 9, 16], [9, 16, 5, 12], [20, 19, 23, 14], [12, 12, 15, 6], [25, 10, 29, 9], [9, 15, 6, 17]]
  for (const [x0, y0, x1, y1] of cab) s.line(x0, y0, x1, y1, P.wal3)
  for (const [x0, y0, x1, y1] of cab.slice(0, 3)) s.line(x0 + 1, y0, x1 + 1, y1, P.wal2)
  // gerombolan bunga kering kecil di ujung-ujung ranting
  const r = acak(71)
  for (const [x, y] of [[9, 3], [12, 6], [27, 4], [29, 9], [5, 12], [23, 14], [6, 17], [15, 6], [25, 9], [10, 9]]) {
    for (let k = 0; k < 9; k++) {
      const a = r() * 6.28, d = r() * 2.6
      s.px(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, r() < 0.5 ? P.linen0 : r() < 0.6 ? P.rotan0 : P.oak0)
    }
  }
  return s
}

/** Lampu lantai kertas washi (akari): kertas menyala hangat, rusuk halus, kaki tipis. */
function akari() {
  const s = new Spr(16, 32)
  bayangan(s, 8, 30, 5, 1.2)
  s.line(5, 22, 3, 30, P.arang3).line(10, 22, 12, 30, P.arang3).vl(8, 22, 8, P.arang3)
  s.rrect(2, 3, 12, 19, P.linen1)
  s.rect(3, 4, 10, 17, P.cahaya0)
  s.oval(7.5, 12, 4, 6, P.cahaya1)
  for (let y = 5; y < 21; y += 3) s.hl(3, y, 10, alfa(P.linen3, 0.55))
  s.vl(2, 4, 17, P.linen2).vl(13, 4, 17, P.linen3)
  s.hl(5, 2, 6, P.arang3).hl(4, 22, 8, P.arang3)
  return s
}

/** Rak terbuka oak: buku berwarna tanah, keramik, tanaman menjuntai, keranjang rotan. */
function rakTerbuka() {
  const s = new Spr(32, 32)
  s.hl(2, 31, 28, P.bayang)
  s.rect(3, 3, 26, 26, P.oak2)
  for (const y of [10, 19, 28]) s.hl(3, y - 1, 26, alfa(P.wal4, 0.25))
  s.rect(1, 2, 2, 29, P.oak3).vl(1, 2, 29, P.oak2).rect(29, 2, 2, 29, P.oak4)
  s.rect(1, 1, 30, 2, P.oak1).hl(1, 1, 30, P.oak0)
  for (const y of [10, 19, 28]) s.rect(3, y, 26, 2, P.oak1).hl(3, y + 1, 26, P.oak3)
  // buku rak atas
  const buku = [P.sage3, P.liat1, P.linen3, P.aizome1, P.oak4, P.sage2, P.linen2]
  let x = 4
  buku.forEach((c, i) => { const t = 5 + (i % 3 === 1 ? 1 : 0); s.rect(x, 10 - t, 2, t, c).px(x, 10 - t, P.linen0); x += 2 })
  s.line(x + 1, 9, x + 4, 5, P.liat2).line(x + 2, 9, x + 5, 5, P.liat1)
  s.rect(21, 6, 3, 4, P.linen0).hl(21, 6, 3, P.linen1).hl(21, 9, 3, P.linen2)
  daun(s, 26.5, 7, 2.6, 2.2, undefined, 72)
  s.vl(27, 9, 4, P.daun2).vl(25, 10, 3, P.daun3)
  // keramik rak tengah
  s.oval(9, 17, 4, 1.6, P.sage1).hl(6, 16, 7, P.sage0).oval(9, 15.5, 3, 1.2, P.linen1)
  s.rect(15, 13, 4, 5, P.arang2).hl(15, 13, 4, P.arang1).rect(20, 14, 4, 4, P.liat1).hl(20, 14, 4, P.liat0)
  s.rect(25, 12, 3, 6, P.oak4).rect(25, 12, 3, 1, P.oak3)
  // keranjang rotan rak bawah
  anyaman(s, 4, 22, 11, 6)
  anyaman(s, 17, 22, 11, 6)
  return s
}

// ---------------------------------------------------------------- ruang rapat

/** Meja rapat oak panjang: taplak linen, ikebana di tengah, buku catatan & cangkir matcha. */
function mejaRapat() {
  const s = new Spr(96, 32)
  s.rect(8, 29, 80, 2, P.bayang)
  for (const x of [10, 84]) s.rect(x, 24, 3, 6, P.oak3).vl(x + 2, 24, 6, P.oak4)
  kayuAtas(s, 2, 4, 92, 17, OAK, 81)
  s.vl(2, 5, 16, P.oak2).vl(93, 5, 16, P.oak3)
  kayuDepan(s, 2, 21, 92, 3, OAK_DEPAN, 82)
  for (const [x, y] of [[2, 4], [93, 4], [2, 23], [93, 23]]) s.hapus(x, y)
  // taplak linen bergaris
  s.rect(10, 11, 76, 4, P.linen1).hl(10, 11, 76, P.linen0).hl(10, 14, 76, P.linen2)
  for (let x = 12; x < 86; x += 6) s.px(x, 12, P.linen2)
  // ikebana tengah
  s.oval(48, 13, 3, 1.5, P.arang2).hl(46, 12, 5, P.arang1)
  s.line(48, 12, 45, 5, P.wal2).line(48, 12, 52, 7, P.wal2)
  daun(s, 45, 6, 2, 1.6, undefined, 83, 1.4)
  s.px(52, 7, P.momiji1).px(53, 6, P.momiji0).px(51, 6, P.momiji1)
  // buku catatan, cangkir matcha, laptop
  for (const x of [8, 24, 40, 56, 72]) s.rect(x + 3, 6, 6, 4, P.linen0).hl(x + 3, 9, 6, P.linen2)
  for (const x of [16, 32, 64, 80]) s.rect(x + 3, 16, 6, 4, P.linen0).hl(x + 3, 19, 6, P.linen2)
  for (const x of [17, 49, 75]) cangkir(s, x, 5, [P.linen0, P.linen1, P.linen3], P.matcha2)
  for (const x of [10, 42, 58]) cangkir(s, x, 15, [P.sage0, P.sage1, P.sage3], P.matcha3)
  s.rect(26, 15, 9, 5, P.arang1).frame(26, 15, 9, 5, P.arang2).px(30, 17, P.sage1)
  // daruma kecil penjaga rapat
  s.oval(88, 8, 2.2, 2.6, P.shu1).oval(87.6, 7.6, 1.3, 1.2, P.linen0).px(87, 7, P.tinta).px(88, 7, P.tinta)
  return s
}

// ----------------------------------------------------------------- daftar item

/** Bantal kursi rapat: [terang, dasar, gelap]. */
const BANTAL = {
  SAGE: [P.sage1, P.sage2, P.sage3],
  PASIR: [P.linen1, P.linen2, P.linen3],
  LIAT: [P.liat0, P.liat1, P.liat2],
  INDIGO: [P.aizome0, P.aizome1, P.aizome2],
  MATCHA: [P.matcha1, P.matcha2, P.matcha3],
}

export const SINGLE = [
  ['MEJA_KERJA_A', 'Meja Kerja Oak (sukulen)', 'desks', MEJA_A, 3, 2, 1],
  ['MEJA_KERJA_B', 'Meja Kerja Oak (buku)', 'desks', MEJA_B, 3, 2, 1],
  ['MEJA_KERJA_C', 'Meja Kerja Oak (daruma)', 'desks', MEJA_C, 3, 2, 1],
  ['OFFICE_CHAIR', 'Kursi Kerja', 'chairs', kursiKerja, 1, 1, 0],
  ['EXEC_DESK', 'Meja Pimpinan Oak', 'desks', mejaPimpinan, 4, 2, 1],
  ['BUFET', 'Bufet Rendah', 'storage', bufet, 4, 2, 1],
  ['VAS_RANTING', 'Vas Ranting Kering', 'decor', vasRanting, 2, 3, 2],
  ['AKARI', 'Lampu Kertas Akari', 'decor', akari, 1, 2, 1],
  ['RAK_TERBUKA', 'Rak Terbuka Oak', 'storage', rakTerbuka, 2, 2, 1],
  ['MEJA_RAPAT', 'Meja Rapat Oak', 'desks', mejaRapat, 6, 2, 0],
]

export const ANIMASI = [
  ['AQUARIUM', 'Akuarium Aquascape', 'decor', akuarium, 4, 2, 2, 1],
]

export const ROTASI = [
  ['EXEC_CHAIR', 'Kursi Rotan Oak', kursiRotan],
  ...Object.entries(BANTAL).map(([w, b]) => [`KURSI_RAPAT_${w}`, `Kursi Rapat ${w[0]}${w.slice(1).toLowerCase()}`, kursiRapat(b)]),
]
