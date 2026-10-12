// Taman onsen: kolam air panas bertepi batu alam, bambu, maple, pinus, lentera batu,
// shishi-odoshi, payung wagasa, dek kayu. Komposisi alami, cahaya sore yang hangat.
import { Spr } from '../lib/sprite.mjs'
import { P, acak, alfa, bayangan, batu, daun } from '../lib/bahan.mjs'

const BATU = [P.batu0, P.batu1, P.batu2, P.batu3, P.batu4]
const BATU_GELAP = [P.batu1, P.batu2, P.batu3, P.batu4, P.batu5]
const MOMIJI = [P.momiji0, P.momiji1, P.momiji2, P.momiji3, P.wal3]
const PINUS = [P.daun2, P.daun3, P.daun4, P.daun5, '#223019']

// ------------------------------------------------------------------------ onsen

export const FRAME_ONSEN = 8
/** Ukuran & batas air untuk aktivitas berendam (relatif ke pojok kiri-atas sprite). */
export const ONSEN = { w: 12, h: 6, renang: { x0: 34, x1: 128, y0: 44, y1: 70 } }

function bentukAir() {
  const cx = 98, cy = 55, rx = 80, ry = 27
  return (x, y) => {
    const a = Math.atan2((y - cy) / ry, (x - cx) / rx)
    const k = 1 + 0.06 * Math.sin(3 * a + 0.5) + 0.04 * Math.sin(5 * a + 1.7) + 0.025 * Math.sin(8 * a + 2.9)
    const dx = (x - cx) / rx, dy = (y - cy) / ry
    return dx * dx + dy * dy <= k * k
  }
}
const diAir = bentukAir()

/** Kapibara berendam dengan yuzu di kepala (naik-turun pelan). */
function kapibara(s, cx, cy) {
  const tubuh = [P.oak4, P.oak3, P.oak5]
  s.oval(cx + 2, cy, 9, 5, tubuh[0]).oval(cx + 1, cy - 1, 7, 3.5, tubuh[1])
  s.oval(cx - 7, cy - 3, 5, 4, tubuh[0]).oval(cx - 8, cy - 4, 3.5, 2.6, tubuh[1])
  s.rect(cx - 13, cy - 3, 3, 3, tubuh[2]).px(cx - 13, cy - 3, P.wal3)          // moncong
  s.px(cx - 4, cy - 7, tubuh[2]).px(cx - 3, cy - 7, tubuh[0])                    // telinga
  s.hl(cx - 9, cy - 4, 2, P.wal4)                                                // mata terpejam
  // yuzu
  s.oval(cx - 7, cy - 9, 2.2, 2, P.emas0).px(cx - 8, cy - 10, P.cahaya0).px(cx - 5, cy - 9, P.kaki0)
  s.px(cx - 7, cy - 11, P.daun2).px(cx - 6, cy - 12, P.daun1)
}

/** Kolam onsen 12x6 tile: tepi batu alam organik, air giok, uap, pancuran bambu, kapibara (8 frame). */
function kolamOnsen(f = 0) {
  const s = new Spr(192, 96)
  const t = (2 * Math.PI * f) / FRAME_ONSEN
  const r = acak(401)
  // titik tepi air
  const tepi = []
  for (let a = 0; a < Math.PI * 2; a += 0.075) {
    let x = 98 + Math.cos(a) * 80, y = 55 + Math.sin(a) * 27
    while (diAir(x, y)) { x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.8 }
    tepi.push([x, y, a])
  }
  const belakang = tepi.filter(([, y]) => y < 55), depan = tepi.filter(([, y]) => y >= 55)
  // bayangan lembut di sekeliling kolam
  s.oval(98, 58, 92, 36, alfa(P.tinta, 0.1))
  // batu besar latar (pojok belakang) + batu tepi belakang
  batu(s, 30, 22, 20, 15, BATU_GELAP, 402, 0.25)
  batu(s, 168, 24, 18, 14, BATU_GELAP, 403, 0.3)
  batu(s, 52, 20, 11, 8, BATU, 404, 0.2)
  batu(s, 146, 21, 10, 7, BATU, 405, 0.15)
  for (const [x, y] of belakang.sort((a, b) => a[1] - b[1])) {
    if (r() < 0.5) continue
    batu(s, x + (r() - 0.5) * 3, y - 2, 4 + r() * 4, 3 + r() * 2.5, r() < 0.5 ? BATU : BATU_GELAP, 410 + Math.floor(x * 7 + y), r() * 0.3)
  }
  // air: dangkal di tepi (terang), dalam di tengah (gelap)
  for (let y = 0; y < 96; y++) for (let x = 0; x < 192; x++) {
    if (!diAir(x, y)) continue
    let jarak = 99
    for (let d = 1; d <= 9 && jarak === 99; d++) {
      if (!diAir(x + d, y) || !diAir(x - d, y) || !diAir(x, y + d) || !diAir(x, y - d)) jarak = d
    }
    const c = jarak <= 2 ? P.air1 : jarak <= 4 ? P.air2 : jarak <= 7 ? P.air3 : P.air4
    s.px(x, y, c)
  }
  // kilau tipis yang bergeser pelan (garis 2-3 px mendatar, jarang)
  for (let k = 0; k < 16; k++) {
    const gx = 30 + ((k * 53 + f * 3) % 135), gy = 36 + ((k * 29) % 34)
    if (diAir(gx - 2, gy) && diAir(gx + 3, gy)) s.hl(gx, gy, 2 + (k % 2), alfa(P.air0, 0.55))
  }
  // pancuran bambu (kakehi) dari batu kiri, disangga dua bambu bersilang, + aliran air
  s.line(44, 15, 46, 27, P.bambu3).line(49, 15, 45, 27, P.bambu3)
  for (let i = 0; i <= 18; i++) {
    const x = 36 + i, y = 13 + Math.round(i * 0.45)
    s.px(x, y - 1, P.bambu1).px(x, y, P.bambu2).px(x, y + 1, P.bambu3)
    if (i % 6 === 2) s.px(x, y - 1, P.bambu2).px(x, y, P.bambu3)
  }
  s.px(55, 21, P.bambu4).px(55, 22, P.bambu3)
  for (let k = 0; k < 5; k++) {
    const y = 23 + ((k * 3 + f * 2) % 13)
    s.px(56, y, alfa(P.air0, 0.95)).px(56, y + 1, alfa(P.air1, 0.85))
  }
  // riak tempat air jatuh
  const rr = 2 + (f % 4) * 1.5
  for (let a = 0; a < Math.PI * 2; a += 0.2) s.px(56 + Math.cos(a) * rr * 1.6, 37 + Math.sin(a) * rr * 0.6, alfa(P.air0, 0.6 - (f % 4) * 0.12))
  // kapibara: digambar terpisah lalu ditempel, bagian di bawah permukaan air disamarkan
  const naik = Math.round(Math.sin(t) * 1)
  const kp = new Spr(192, 96)
  const garisAir = 55 + naik
  kapibara(kp, 158, 54 + naik)
  for (let y = 0; y < 96; y++) for (let x = 120; x < 192; x++) {
    const i = (y * 192 + x) * 4
    if (!kp.d[i + 3]) continue
    const c = '#' + [0, 1, 2].map(k => kp.d[i + k].toString(16).padStart(2, '0')).join('')
    if (y <= garisAir) s.px(x, y, c)
    else if (y <= garisAir + 2) s.px(x, y, alfa(c, 0.35))
  }
  s.hl(146, garisAir + 1, 20, alfa(P.air0, 0.5))
  const rk = 10 + (f % 4)
  for (let a = 0; a < Math.PI * 2; a += 0.15) {
    const px = 157 + Math.cos(a) * rk * 1.3, py = 56 + Math.sin(a) * rk * 0.35
    if (diAir(px, py)) s.px(px, py, alfa(P.air0, 0.45))
  }
  // batu tepi depan (lebih kecil & pipih supaya air tetap terlihat)
  for (const [x, y] of depan.sort((a, b) => a[1] - b[1])) {
    if (r() < 0.35) continue
    batu(s, x + (r() - 0.5) * 2, y + 1, 3.5 + r() * 3, 2.2 + r() * 1.6, r() < 0.6 ? BATU : BATU_GELAP, 500 + Math.floor(x * 5 + y), 0.1)
  }
  batu(s, 18, 70, 9, 6, BATU, 510, 0.3)
  batu(s, 178, 66, 8, 6, BATU, 511, 0.25)
  // uap air panas: gulungan tipis yang naik, melebar, lalu memudar
  for (let k = 0; k < 7; k++) {
    const bx = 34 + ((k * 41) % 120), by = 48 + ((k * 17) % 18)
    const fase = (f / FRAME_ONSEN + k * 0.29) % 1
    const a = 0.3 * Math.sin(fase * Math.PI)
    for (let i = 0; i < 7; i++) {
      const x = bx + Math.sin(i * 0.9 + fase * 6.28 + k) * (1 + i * 0.3), y = by - fase * 16 - i
      s.px(x, y, alfa(P.linen0, a * (1 - i / 9))).px(x + 1, y, alfa(P.linen0, a * 0.5 * (1 - i / 9)))
    }
  }
  return s
}

// --------------------------------------------------------------------- tanaman

/** Rumpun bambu: 5 batang beruas, daun ramping di bagian atas, bergoyang pelan (4 frame). */
function rumpunBambu(f = 0) {
  const s = new Spr(32, 64)
  bayangan(s, 16, 61, 12, 2.5)
  const goyang = [0, 1, 1, 0][f % 4]
  const batang = [[9, 6], [13, 1], [17, 4], [21, 9], [25, 15]]
  for (const [x0, top] of batang) {
    for (let y = top; y < 62; y++) {
      const g = y < 30 ? Math.round(goyang * (30 - y) / 30) : 0
      const ruas = (y - top) % 7 === 0
      s.px(x0 + g, y, ruas ? P.bambu3 : P.bambu2).px(x0 - 1 + g, y, ruas ? P.bambu2 : P.bambu1)
      if (ruas) s.px(x0 + 1 + g, y, P.bambu4)
    }
  }
  const r = acak(420)
  for (let k = 0; k < 34; k++) {
    const [x0, top] = batang[k % 5]
    const y = top + 2 + Math.floor(r() * 26)
    const g = Math.round(goyang * (30 - y) / 30)
    const arah = r() < 0.5 ? -1 : 1, p = 3 + Math.floor(r() * 3)
    for (let i = 0; i < p; i++) {
      const px = x0 + g + arah * (i + 1), py = y + Math.floor(i * 0.5)
      s.px(px, py, i < p - 1 ? (r() < 0.5 ? P.daun1 : P.daun2) : P.daun0)
      if (i > 0 && i < p - 1) s.px(px, py + 1, P.daun3)
    }
  }
  // tunas & lumut di kaki rumpun
  s.oval(16, 61, 9, 2, P.daun3).px(8, 60, P.bambu1).px(23, 60, P.bambu1).px(12, 61, P.daun2)
  return s
}

/** Pohon maple Jepang: kanopi berlapis merah-jingga, satu daun berguguran (4 frame). */
function momiji(f = 0) {
  const s = new Spr(48, 64)
  bayangan(s, 24, 61, 16, 3)
  s.oval(24, 60, 12, 2.2, alfa(P.momiji2, 0.35))
  // batang & cabang
  s.line(24, 62, 23, 46, P.wal3).line(25, 62, 24, 46, P.wal2).line(26, 62, 25, 50, P.wal3)
  s.line(23, 46, 17, 36, P.wal2).line(24, 46, 31, 34, P.wal2).line(23, 44, 12, 40, P.wal3).line(25, 48, 36, 44, P.wal3)
  s.line(17, 36, 14, 28, P.wal3).line(31, 34, 34, 25, P.wal3)
  // kanopi berlapis
  const lapis = [[14, 32, 11, 6, 431], [34, 30, 12, 6, 432], [24, 22, 14, 7, 433], [11, 22, 8, 5, 434], [37, 19, 9, 5, 435], [24, 12, 11, 6, 436], [31, 40, 7, 4, 437]]
  for (const [x, y, rx, ry, seed] of lapis) daun(s, x, y, rx, ry, MOMIJI, seed, 0.9)
  const r = acak(438)
  for (let k = 0; k < 18; k++) s.px(8 + Math.floor(r() * 34), 8 + Math.floor(r() * 30), r() < 0.5 ? P.momiji0 : P.emas0)
  // daun berguguran
  const jatuh = [[38, 42], [40, 47], [37, 52], [39, 57]][f % 4]
  s.px(jatuh[0], jatuh[1], P.momiji1).px(jatuh[0] + 1, jatuh[1], P.momiji0)
  return s
}

/** Pinus hitam bergaya niwaki: bantalan daun bertingkat di batang meliuk. */
function pinus() {
  const s = new Spr(48, 64)
  bayangan(s, 24, 61, 15, 3)
  s.line(26, 62, 24, 50, P.liat2).line(27, 62, 25, 50, P.wal2).line(24, 50, 28, 40, P.liat2).line(25, 50, 29, 40, P.wal2)
  s.line(28, 40, 24, 30, P.liat2).line(24, 30, 26, 20, P.liat2)
  s.line(25, 47, 12, 44, P.wal2).line(28, 41, 40, 37, P.wal2).line(25, 33, 14, 28, P.wal2).line(26, 24, 34, 18, P.wal2)
  for (const [x, y, rx, ry, seed] of [[11, 42, 9, 3.4, 441], [39, 35, 9, 3.2, 442], [15, 26, 9, 3.2, 443], [33, 17, 8, 3, 444], [25, 9, 8, 3.2, 445]]) {
    daun(s, x, y, rx, ry, PINUS, seed, 1.1)
    s.hl(x - rx + 2, y - ry + 1, rx, alfa(P.daun1, 0.7))
  }
  return s
}

function semak(seed, rx, ry, bunga) {
  return () => {
    const w = Math.ceil(rx * 2 / 16) * 16, h = 16 * Math.ceil((ry * 2 + 3) / 16)
    const s = new Spr(w, h)
    bayangan(s, w / 2, h - 2, rx + 1, 2)
    daun(s, w / 2, h - 2 - ry, rx, ry, [P.daun0, P.daun1, P.daun2, P.daun3, P.daun4], seed, 1.3)
    if (bunga) {
      const r = acak(seed + 1)
      for (let k = 0; k < rx * 2; k++) s.px(w / 2 + (r() - 0.5) * rx * 1.6, h - 2 - ry + (r() - 0.6) * ry * 1.4, r() < 0.6 ? bunga[0] : bunga[1])
    }
    return s
  }
}

// -------------------------------------------------------------------- batu & air

function batuBesar() {
  const s = new Spr(32, 32)
  bayangan(s, 16, 28, 14, 3)
  batu(s, 15, 19, 13, 9, BATU, 451, 0.35)
  batu(s, 25, 24, 5, 3.5, BATU_GELAP, 452, 0.2)
  return s
}
function batuSedang() {
  const s = new Spr(16, 16)
  bayangan(s, 8, 13, 7, 2)
  batu(s, 8, 9, 6, 4.5, BATU, 453, 0.25)
  return s
}
function batuKecil() {
  const s = new Spr(16, 16)
  for (const [x, y, rx, ry, k] of [[5, 10, 3, 2.2, 454], [10, 11, 3.6, 2.5, 455], [8, 7, 2.4, 1.8, 456]]) {
    bayangan(s, x + 1, y + 2, rx, 1.2, 0.18)
    batu(s, x, y, rx, ry, BATU, k, 0.1)
  }
  return s
}

/**
 * Batu karesansui: batu besar di tengah kerikil yang digaruk melingkar. Alur garukan digambar
 * transparan sehingga warna kerikil lantai tetap terlihat.
 */
function batuKaresansui() {
  const s = new Spr(48, 32)
  for (let ring = 0; ring < 4; ring++) {
    const rx = 12 + ring * 4, ry = 6.5 + ring * 2.2
    for (let a = 0; a < Math.PI * 2; a += 0.03) {
      const x = 24 + Math.cos(a) * rx, y = 18 + Math.sin(a) * ry
      s.px(x, y, alfa(P.tinta, 0.14)).px(x, y - 1, alfa(P.linen0, 0.22))
    }
  }
  bayangan(s, 25, 21, 10, 3)
  batu(s, 24, 15, 9, 7, BATU_GELAP, 461, 0.45)
  batu(s, 31, 19, 3.5, 2.5, BATU, 462, 0.2)
  return s
}

/** Lentera batu (tōrō) gaya kasuga, jendela menyala hangat & berkedip pelan (4 frame). */
function toro(f = 0) {
  const s = new Spr(16, 32)
  bayangan(s, 8, 30, 6, 1.5)
  s.rect(3, 26, 10, 4, P.batu3).hl(3, 26, 10, P.batu2).hl(3, 29, 10, P.batu4)
  s.rect(6, 17, 4, 9, P.batu2).vl(6, 17, 9, P.batu1).vl(9, 17, 9, P.batu4)
  s.rect(4, 15, 8, 2, P.batu3).hl(4, 15, 8, P.batu2)
  s.rect(4, 9, 8, 6, P.batu2).vl(4, 9, 6, P.batu1).vl(11, 9, 6, P.batu4)
  const nyala = [P.cahaya1, P.cahaya0, P.cahaya1, P.cahaya2][f % 4]
  s.rect(6, 10, 4, 4, nyala).px(7, 11, P.cahaya0)
  s.rect(1, 6, 14, 3, P.batu3).hl(2, 6, 12, P.batu2).px(0, 8, P.batu3).px(15, 8, P.batu3).px(1, 5, P.batu3).px(14, 5, P.batu3)
  s.rect(5, 4, 6, 2, P.batu2).oval(8, 2, 1.6, 1.6, P.batu1)
  s.px(3, 27, P.daun2).px(4, 26, P.daun1).px(12, 28, P.daun2).px(6, 16, P.daun2)
  return s
}

/** Shishi-odoshi: bambu berengsel terisi air dari pancuran, lalu menjungkit (8 frame). */
function shishiOdoshi(f = 0) {
  const s = new Spr(32, 32)
  bayangan(s, 16, 29, 14, 2.5)
  // cekungan batu (tsukubai)
  batu(s, 22, 24, 7, 4, BATU, 471, 0.3)
  s.oval(22, 23, 4.5, 1.8, P.air3).hl(19, 22, 6, P.air2)
  // tiang & pancuran
  s.vl(9, 8, 18, P.bambu3).vl(8, 8, 18, P.bambu2).vl(15, 12, 14, P.bambu3).vl(14, 12, 14, P.bambu2)
  s.line(2, 6, 12, 9, P.bambu2).line(2, 7, 12, 10, P.bambu3).px(12, 9, P.bambu4)
  // tabung yang menjungkit: frame 0-5 terangkat mengisi, 6 menjungkit, 7 kembali
  const sudut = f < 6 ? -0.45 : f === 6 ? 0.5 : 0.05
  const px = 12, py = 15
  for (let i = -6; i <= 10; i++) {
    const x = px + Math.cos(sudut) * i, y = py + Math.sin(sudut) * i
    s.px(x, y, P.bambu2).px(x, y + 1, P.bambu3).px(x, y - 1, P.bambu1)
  }
  s.px(px, py, P.wal3)
  if (f < 6) for (let k = 0; k < 2; k++) s.px(12 + k, 11 + ((f + k) % 3), alfa(P.air0, 0.9))
  if (f === 6) for (let k = 0; k < 4; k++) s.px(21 + k, 20 + (k % 2), alfa(P.air0, 0.9))
  const rr = f === 7 ? 3 : f === 0 ? 4.5 : 0
  if (rr) for (let a = 0; a < Math.PI * 2; a += 0.35) s.px(22 + Math.cos(a) * rr, 23 + Math.sin(a) * rr * 0.4, alfa(P.air0, 0.6))
  s.px(4, 27, P.daun2).px(5, 26, P.daun1).px(28, 27, P.daun2)
  return s
}

// ------------------------------------------------------------- perabot taman

/** Payung kertas wagasa merah-jingga redup bermotif cincin (janome), tiang bambu. */
function wagasa() {
  const s = new Spr(32, 48)
  s.oval(16, 44, 10, 2.5, alfa(P.tinta, 0.15))
  s.rect(15, 18, 2, 26, P.rotan1).vl(15, 18, 26, P.rotan0)
  s.oval(16, 44, 3, 1.2, P.batu3)
  for (let y = 2; y < 19; y++) {
    const half = Math.round(Math.min(15, 2 + (y - 2) * 1.05))
    for (let x = 16 - half; x < 16 + half; x++) {
      const d = Math.hypot((x - 16) / 15, (y - 10) / 9)
      let c = P.shu1
      if (d > 0.42 && d < 0.55) c = P.linen0
      else if (d <= 0.42) c = P.shu0
      if ((x - 16) % 4 === 0) c = P.shu2
      s.px(x, y, c)
    }
  }
  for (let x = 2; x < 30; x += 4) s.px(x, 19, P.shu2)
  s.hl(1, 18, 30, alfa(P.shu2, 0.7))
  s.oval(16, 2, 1.5, 1, P.wal3)
  return s
}

/** Bangku nodate berkain merah (hikimōsen) untuk minum teh di taman. */
function bangkuNodate() {
  const s = new Spr(32, 16)
  s.hl(3, 15, 26, P.bayang)
  s.rect(3, 9, 2, 5, P.oak4).rect(27, 9, 2, 5, P.oak4)
  s.rect(1, 3, 30, 6, P.shu1).hl(1, 3, 30, P.shu0).hl(1, 8, 30, P.shu2)
  s.rect(1, 9, 30, 2, P.shu1).hl(1, 10, 30, P.shu2)
  s.rect(6, 4, 3, 2, P.linen0).hl(6, 4, 3, P.matcha2)
  return s
}

/** Kursi dek kayu dengan bantal linen. */
function kursiDek() {
  const s = new Spr(16, 32)
  s.hl(3, 31, 10, P.bayang)
  s.rrect(3, 4, 10, 25, P.oak3)
  for (let y = 6; y < 28; y += 3) s.hl(4, y, 8, P.oak2)
  s.rect(4, 5, 8, 22, P.linen1).hl(4, 5, 8, P.linen0).hl(4, 26, 8, P.linen2)
  s.rect(5, 6, 6, 4, P.sage1).hl(5, 6, 6, P.sage0)
  s.px(3, 29, P.oak4).px(12, 29, P.oak4)
  return s
}

/** Tumpukan ember mandi kayu hinoki + dingklik kayu. */
function oke() {
  const s = new Spr(16, 16)
  s.hl(2, 15, 12, P.bayang)
  s.rect(9, 10, 6, 4, P.oak1).hl(9, 10, 6, P.oak0).vl(10, 14, 1, P.oak3).vl(13, 14, 1, P.oak3)
  for (const y of [6, 2]) {
    s.rect(2, y + 4, 7, 4, P.oak1).hl(2, y + 4, 7, P.oak0).hl(2, y + 6, 7, P.wal2).hl(2, y + 7, 7, P.oak3)
    s.oval(5.5, y + 4, 3.5, 1.2, P.oak2)
  }
  return s
}

/** Rak handuk kayu dengan handuk linen terlipat. */
function rakHanduk() {
  const s = new Spr(16, 32)
  s.hl(2, 31, 12, P.bayang)
  s.vl(2, 10, 21, P.oak3).vl(13, 10, 21, P.oak4)
  for (const y of [12, 20]) s.hl(2, y, 12, P.oak2)
  s.rect(3, 13, 10, 6, P.linen0).hl(3, 13, 10, P.linen1).hl(3, 18, 10, P.linen2).hl(3, 15, 10, P.aizome1)
  s.rect(3, 21, 10, 5, P.sage1).hl(3, 21, 10, P.sage0).hl(3, 25, 10, P.sage3)
  s.rect(4, 26, 8, 2, P.linen1)
  return s
}

/** Pagar bambu tua (barang dinding, dipasang berjajar di dinding batas taman). */
function pagarBambu() {
  const s = new Spr(32, 32)
  for (let x = 1; x < 32; x += 3) {
    const r = acak(480 + x)
    const top = 6 + Math.floor(r() * 2)
    s.rect(x, top, 2, 31 - top, P.rotan1).vl(x, top, 31 - top, P.rotan0).px(x, top, P.rotan2)
    for (let y = top + 5; y < 30; y += 8) s.px(x, y, P.rotan2).px(x + 1, y, P.rotan3)
  }
  for (const y of [12, 22]) {
    s.hl(0, y, 32, P.rotan2).hl(0, y + 1, 32, P.rotan3)
    for (let x = 2; x < 32; x += 6) s.rect(x, y - 1, 2, 3, P.arang3)
  }
  return s
}

export const SINGLE = [
  ['PINUS', 'Pinus Hitam', 'decor', pinus, 3, 4, 3],
  ['SEMAK', 'Semak Bulat', 'decor', semak(491, 6.5, 4.5), 1, 1, 0],
  ['SEMAK_BUNGA', 'Semak Azalea', 'decor', semak(492, 6.5, 4.5, [P.sakura1, P.sakura0]), 1, 1, 0],
  ['SEMAK_BESAR', 'Semak Besar', 'decor', semak(493, 13, 7), 2, 1, 0],
  ['BATU_BESAR', 'Batu Besar Berlumut', 'decor', batuBesar, 2, 2, 1],
  ['BATU_SEDANG', 'Batu Sedang', 'decor', batuSedang, 1, 1, 0],
  ['BATU_KECIL', 'Batu Kecil', 'decor', batuKecil, 1, 1, 0],
  ['BATU_KARESANSUI', 'Batu Karesansui', 'decor', batuKaresansui, 3, 2, 1],
  ['WAGASA', 'Payung Wagasa', 'decor', wagasa, 2, 3, 2],
  ['BANGKU_NODATE', 'Bangku Nodate', 'chairs', bangkuNodate, 2, 1, 0],
  ['KURSI_DEK', 'Kursi Dek Kayu', 'decor', kursiDek, 1, 2, 0],
  ['OKE', 'Ember Kayu', 'decor', oke, 1, 1, 0],
  ['RAK_HANDUK', 'Rak Handuk', 'decor', rakHanduk, 1, 2, 1],
  ['PAGAR_BAMBU', 'Pagar Bambu', 'wall', pagarBambu, 2, 2, 0, { walls: true }],
]

export const ANIMASI = [
  ['ONSEN', 'Kolam Onsen', 'misc', kolamOnsen, FRAME_ONSEN, ONSEN.w, ONSEN.h, 0],
  ['RUMPUN_BAMBU', 'Rumpun Bambu', 'decor', rumpunBambu, 4, 2, 4, 3],
  ['MOMIJI', 'Pohon Maple', 'decor', momiji, 4, 3, 4, 3],
  ['TORO', 'Lentera Batu', 'decor', toro, 4, 1, 2, 1],
  ['SHISHI_ODOSHI', 'Shishi-odoshi', 'decor', shishiOdoshi, 8, 2, 2, 1],
]

