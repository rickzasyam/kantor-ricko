// Model 3D furnitur Kantor Ricko: semuanya dirakit dari bentuk dasar (kotak, silinder, bola,
// kerucut) langsung di kode, tanpa berkas aset. Semua furnitur yang diam digabung menjadi dua
// jaring besar (satu terkena cahaya, satu "pijar" untuk lampu/layar/kertas jendela) supaya seluruh
// kantor digambar dengan segelintir draw call dan termuat seketika.
//
// Gaya: kantor Jepang yang hangat (oak, plester krem, linen, rotan, batu, sage/matcha), bentuk
// membulat sederhana. Tiap model digambar di sekitar titik (0, 0, 0) dengan sisi depan menghadap
// +z (selatan); Rakit.taruh() memindah dan memutarnya ke tempatnya di denah.
import * as T from '../vendor/three.module.js'

export const W = {
  oak: '#dcbd8f', oakTua: '#b98f5e', oakGelap: '#8f6943', walnut: '#7d583a', walnutTua: '#573b27',
  plester: '#f1e8d8', plesterTeduh: '#dfd2bc', linen: '#f6efe2', linenTua: '#dccfb6', kertas: '#fff1cf',
  rotan: '#d4b47a', rotanTua: '#b08e55', tatami: '#bdb980', batu: '#b3aa9b', batuTua: '#857d70', batuGelap: '#5f594f',
  arang: '#3d3733', arangMuda: '#5a534c', sage: '#a3b086', sageTua: '#7f8f66', matcha: '#9cb05c', matchaTua: '#74893f',
  indigo: '#5f6f95', indigoTua: '#43506f', liat: '#c08766', oat: '#e5d8c1', sakura: '#e7bdb4', emas: '#cda85f',
  merah: '#b9573f', merahTua: '#8e3f2d', daun: '#789a4f', daunTua: '#557238', daunMuda: '#a5c070', bambu: '#a9b964', bambuTua: '#7f9048',
  momiji: '#dd7a43', momijiTua: '#bf5632', pinus: '#4f6b3c', air: '#7fc0b2', kaca: '#b9dcd6',
  layar: '#9fd6ee', layarGame: '#f2a36b', lampu: '#ffe2a6', lampuMerah: '#ff9d6b', putih: '#fbf8f1', kapibara: '#a9794f',
}
const KAIN = { sage: [W.sage, W.sageTua], oat: [W.oat, W.linenTua], liat: [W.liat, '#9c6a4f'], indigo: [W.indigo, W.indigoTua], matcha: [W.matcha, W.matchaTua], sakura: [W.sakura, '#cf9d93'], emas: [W.emas, '#a8853f'] }
const kain = o => KAIN[o.warna] ?? KAIN.oat

/** Perakit jaring: kumpulkan bentuk dasar berwarna, lalu gabung jadi satu BufferGeometry. */
export class Rakit {
  constructor() {
    this.padat = { pos: [], nor: [], warna: [] }
    this.pijar = { pos: [], nor: [], warna: [] }
    this.lampu = []          // [x, y, z, jari-jari, warna] sumber cahaya untuk pendar malam
    this.layar = []          // layar monitor meja kerja: { meja, x, y, z, ry }
    this.dasar = new T.Matrix4()
    this.m = new T.Matrix4(); this.q = new T.Quaternion(); this.e = new T.Euler(); this.v = new T.Vector3(); this.s = new T.Vector3(); this.c = new T.Color()
  }

  /** Atur tempat model berikutnya: titik tengah (x, z) dan putaran r. */
  taruh(x, z, r = 0, y = 0) { this.dasar.makeRotationY(r).setPosition(x, y, z); return this }

  tambah(geo, warna, x, y, z, o = {}) {
    const g = geo.index ? geo.toNonIndexed() : geo
    this.e.set(o.rx ?? 0, o.ry ?? 0, o.rz ?? 0)
    this.m.compose(this.v.set(x, y, z), this.q.setFromEuler(this.e), this.s.set(o.sx ?? 1, o.sy ?? 1, o.sz ?? 1)).premultiply(this.dasar)
    g.applyMatrix4(this.m)
    const t = o.pijar ? this.pijar : this.padat, p = g.attributes.position.array, n = g.attributes.normal.array
    this.c.set(warna)
    for (let i = 0; i < p.length; i += 3) { t.pos.push(p[i], p[i + 1], p[i + 2]); t.nor.push(n[i], n[i + 1], n[i + 2]); t.warna.push(this.c.r, this.c.g, this.c.b) }
    if (g !== geo) g.dispose()
    geo.dispose()
    return this
  }

  // y = alas bentuk (bukan tengahnya), supaya mudah menumpuk dari lantai.
  kotak(w, h, d, warna, x = 0, y = 0, z = 0, o) { return this.tambah(new T.BoxGeometry(w, h, d), warna, x, y + h / 2, z, o) }
  silinder(r, h, warna, x = 0, y = 0, z = 0, o = {}) { return this.tambah(new T.CylinderGeometry(o.rAtas ?? r, r, h, o.sisi ?? 9), warna, x, y + h / 2, z, o) }
  kerucut(r, h, warna, x = 0, y = 0, z = 0, o = {}) { return this.tambah(new T.ConeGeometry(r, h, o.sisi ?? 8), warna, x, y + h / 2, z, o) }
  bola(r, warna, x = 0, y = 0, z = 0, o = {}) { return this.tambah(new T.SphereGeometry(r, o.sisi ?? 8, o.tinggi ?? 6), warna, x, y, z, o) }
  bongkah(r, warna, x = 0, y = 0, z = 0, o = {}) { return this.tambah(new T.IcosahedronGeometry(r, 0), warna, x, y, z, o) }

  /** Catat sumber cahaya (koordinat lokal model) untuk pendar malam. */
  sinar(x, y, z, jari = 2.2, warna = W.lampu) {
    this.v.set(x, y, z).applyMatrix4(this.dasar)
    this.lampu.push([this.v.x, this.v.y, this.v.z, jari, warna])
    return this
  }

  gabung(t) {
    const g = new T.BufferGeometry()
    g.setAttribute('position', new T.Float32BufferAttribute(t.pos, 3))
    g.setAttribute('normal', new T.Float32BufferAttribute(t.nor, 3))
    g.setAttribute('color', new T.Float32BufferAttribute(t.warna, 3))
    return g
  }
}

const kaki4 = (k, w, d, h, warna, t = 0.07) => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.kotak(t, h, t, warna, sx * (w / 2 - t), 0, sz * (d / 2 - t)) }
const potTanaman = (k, warna = W.indigoTua, r = 0.2, h = 0.26) => k.silinder(r * 0.8, h, warna, 0, 0, 0, { rAtas: r }).silinder(r * 0.86, 0.03, W.walnutTua, 0, h - 0.02, 0)

export const MODEL = {
  mejaKerja(k, o) {
    k.kotak(2.7, 0.07, 0.86, W.oak, 0, 0.66, 0).kotak(2.5, 0.05, 0.05, W.oakTua, 0, 0.6, 0.36)
    kaki4(k, 2.6, 0.8, 0.66, W.oakTua)
    k.kotak(0.5, 0.03, 0.2, W.oakTua, 0, 0.73, -0.2).kotak(0.06, 0.2, 0.06, W.arang, 0, 0.75, -0.2)      // dudukan monitor
    k.kotak(0.8, 0.5, 0.05, W.arang, 0, 0.92, -0.2)
    k.kotak(0.6, 0.02, 0.2, W.linenTua, 0, 0.73, 0.14)                                                   // papan tik
    const v = o.meja % 3
    if (v === 0) { potTanaman(k.taruhLokal(-1.05, 0.73, -0.1), W.plesterTeduh, 0.09, 0.12); k.bola(0.12, W.daun, 0, 0.2, 0, { sy: 1.2 }); k.pulih() }
    if (v === 1) k.silinder(0.06, 0.1, W.putih, 1.0, 0.73, 0.1).silinder(0.045, 0.02, W.matcha, 1.0, 0.82, 0.1)
    if (v === 2) k.kotak(0.34, 0.03, 0.26, W.sage, -0.95, 0.73, 0.05).kotak(0.34, 0.03, 0.26, W.liat, -0.93, 0.76, 0.03, { ry: 0.2 })
    k.kotak(0.3, 0.015, 0.22, W.putih, 0.85, 0.73, -0.18, { ry: -0.15 })
    k.catatLayar(o.meja, 0, 1.17, -0.17)
  },
  mejaEksekutif(k) {
    k.kotak(2.8, 0.09, 0.95, W.oak, 0, 0.66, 0)
    k.kotak(0.08, 0.66, 0.85, W.oakTua, -1.3, 0, 0).kotak(0.08, 0.66, 0.85, W.oakTua, 1.3, 0, 0).kotak(2.6, 0.5, 0.05, W.rotan, 0, 0.14, 0.38)
    k.kotak(0.5, 0.02, 0.34, W.arangMuda, 0.1, 0.75, 0.05).kotak(0.5, 0.32, 0.02, W.arang, 0.1, 0.77, 0.23, { rx: 0.25 })   // laptop menghadap kursi (utara)
    k.silinder(0.08, 0.02, W.emas, -0.95, 0.75, 0.15).silinder(0.015, 0.28, W.emas, -0.95, 0.75, 0.15).bola(0.1, W.lampu, -0.95, 1.08, 0.15, { pijar: true })
    k.sinar(-0.95, 1.1, 0.15, 1.4)
    k.kotak(0.3, 0.02, 0.22, W.putih, 0.9, 0.75, -0.1, { ry: 0.3 }).silinder(0.05, 0.09, W.putih, 0.75, 0.75, 0.25)
  },
  kursi(k) {
    k.silinder(0.26, 0.03, W.arang, 0, 0.02, 0, { sisi: 5 }).silinder(0.035, 0.36, W.arangMuda, 0, 0.04, 0)
    k.kotak(0.5, 0.08, 0.5, W.arangMuda, 0, 0.4, 0).kotak(0.48, 0.5, 0.07, W.arangMuda, 0, 0.5, -0.24, { rx: -0.08 })
  },
  kursiEksekutif(k) {
    kaki4(k, 0.56, 0.56, 0.4, W.oakTua, 0.05)
    k.kotak(0.6, 0.08, 0.6, W.rotan, 0, 0.4, 0).kotak(0.52, 0.05, 0.52, W.linen, 0, 0.47, 0.02).kotak(0.6, 0.62, 0.07, W.rotan, 0, 0.46, -0.28, { rx: -0.1 })
  },
  kursiRapat(k, o) {
    kaki4(k, 0.46, 0.46, 0.42, W.oakTua, 0.045)
    k.kotak(0.5, 0.05, 0.5, W.oak, 0, 0.42, 0).kotak(0.44, 0.05, 0.44, kain(o)[0], 0, 0.46, 0.01)
    k.kotak(0.5, 0.12, 0.05, W.oak, 0, 0.82, -0.23).kotak(0.05, 0.5, 0.05, W.oakTua, -0.2, 0.44, -0.23).kotak(0.05, 0.5, 0.05, W.oakTua, 0.2, 0.44, -0.23)
  },
  bufet(k) {
    k.kotak(2.8, 0.62, 0.6, W.oak, 0, 0.08, 0).kotak(2.8, 0.08, 0.5, W.oakTua, 0, 0, 0).kotak(2.86, 0.05, 0.66, W.oakTua, 0, 0.7, 0)
    for (const x of [-0.93, 0, 0.93]) k.kotak(0.86, 0.5, 0.02, W.rotan, x, 0.14, 0.3)
    k.silinder(0.1, 0.03, W.arang, 0.95, 0.75, 0).bola(0.2, W.lampu, 0.95, 0.97, 0, { pijar: true }).sinar(0.95, 1.0, 0, 2.2)
    k.bola(0.14, W.linen, -0.9, 0.87, 0, { sy: 1.25 }).silinder(0.012, 0.5, W.walnutTua, -0.9, 0.95, 0, { rz: 0.25 })
    k.kotak(0.4, 0.06, 0.28, W.indigo, -0.1, 0.75, 0).kotak(0.36, 0.05, 0.26, W.liat, -0.08, 0.81, 0, { ry: 0.2 })
  },
  rak(k) {
    k.kotak(0.06, 1.35, 0.4, W.oakTua, -0.9, 0, 0).kotak(0.06, 1.35, 0.4, W.oakTua, 0.9, 0, 0)
    for (const y of [0.06, 0.48, 0.9, 1.3]) k.kotak(1.86, 0.05, 0.42, W.oak, 0, y, 0)
    const buku = [W.indigo, W.liat, W.sage, W.oat, W.matcha, W.merah, W.linenTua]
    for (let i = 0; i < 6; i++) k.kotak(0.07, 0.26 + (i % 3) * 0.03, 0.26, buku[i % buku.length], -0.75 + i * 0.085, 0.53, 0)
    for (let i = 0; i < 5; i++) k.kotak(0.07, 0.24 + (i % 2) * 0.05, 0.26, buku[(i + 3) % buku.length], 0.3 + i * 0.085, 0.95, 0)
    k.bola(0.13, W.linen, 0.45, 0.66, 0).bola(0.1, W.liat, -0.5, 1.05, 0, { sy: 1.3 }).silinder(0.11, 0.2, W.indigoTua, 0.1, 0.11, 0).kotak(0.5, 0.2, 0.3, W.rotan, -0.5, 0.11, 0)
  },
  rakTeh(k) {
    k.kotak(3.9, 1.5, 0.08, W.oakTua, 0, 0, -0.2).kotak(0.08, 1.5, 0.42, W.oakTua, -1.95, 0, 0).kotak(0.08, 1.5, 0.42, W.oakTua, 1.95, 0, 0)
    for (const y of [0.05, 0.5, 0.95, 1.42]) k.kotak(3.9, 0.05, 0.44, W.oak, 0, y, 0)
    const kaleng = [W.matcha, W.liat, W.indigo, W.oat, W.sage, W.merah, W.linen, W.emas]
    for (let b = 0; b < 2; b++) for (let i = 0; i < 9; i++) k.silinder(0.1, 0.22 + ((i + b) % 3) * 0.04, kaleng[(i * 3 + b) % kaleng.length], -1.65 + i * 0.41, 0.55 + b * 0.45, 0.02)
    for (const x of [-1.2, 0, 1.2]) k.bola(0.12, W.linen, x, 0.22, 0.02, { sy: 0.8 })
    for (const x of [-1, 1]) k.bola(0.11, W.lampu, x, 1.32, 0.05, { pijar: true }).sinar(x, 1.3, 0.2, 1.8)
  },
  akuarium(k) {
    k.kotak(0.9, 0.5, 0.6, W.oakTua, 0, 0, 0).kotak(0.86, 0.55, 0.56, W.air, 0, 0.5, 0, { pijar: true }).kotak(0.9, 0.04, 0.6, W.arang, 0, 1.05, 0)
    k.bola(0.08, W.daun, -0.2, 0.62, 0.3, { pijar: true }).bola(0.05, W.momiji, 0.15, 0.8, 0.3, { pijar: true }).bola(0.04, W.emas, -0.05, 0.9, 0.3, { pijar: true })
    k.sinar(0, 0.8, 0.3, 1.2, W.air)
  },
  sofa(k) {
    k.kotak(1.9, 0.28, 0.82, W.linenTua, 0, 0.08, 0).kotak(1.9, 0.08, 0.7, W.oakTua, 0, 0, 0)
    k.kotak(1.9, 0.5, 0.2, W.linenTua, 0, 0.3, -0.32).kotak(0.18, 0.3, 0.8, W.linenTua, -0.9, 0.3, 0).kotak(0.18, 0.3, 0.8, W.linenTua, 0.9, 0.3, 0)
    k.kotak(0.76, 0.12, 0.56, W.linen, -0.4, 0.36, 0.08).kotak(0.76, 0.12, 0.56, W.linen, 0.4, 0.36, 0.08).kotak(0.36, 0.3, 0.12, W.sage, -0.55, 0.5, -0.16, { rx: -0.2 })
  },
  mejaBulat(k) { k.silinder(0.36, 0.05, W.oak, 0, 0.4, 0, { sisi: 16 }).silinder(0.05, 0.4, W.oakTua).silinder(0.2, 0.03, W.oakTua).silinder(0.06, 0.08, W.putih, 0.1, 0.45, 0.05) },
  chabudai(k) {
    k.silinder(0.78, 0.07, W.walnut, 0, 0.3, 0, { sisi: 20, sz: 0.62 })
    for (const [x, z] of [[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]]) k.silinder(0.045, 0.3, W.walnutTua, x, 0, z)
    k.bola(0.11, W.arang, 0, 0.47, 0, { sy: 0.85 }).silinder(0.02, 0.1, W.arang, 0.13, 0.44, 0, { rz: -0.9 }).silinder(0.05, 0.06, W.linen, -0.3, 0.37, 0.12).silinder(0.05, 0.06, W.linen, 0.32, 0.37, -0.1)
  },
  zabuton(k, o) { k.kotak(0.7, 0.1, 0.7, kain(o)[0], 0, 0.01, 0).kotak(0.5, 0.03, 0.5, kain(o)[1], 0, 0.1, 0) },
  kursiTelur(k) {
    k.silinder(0.34, 0.04, W.walnutTua).silinder(0.04, 1.75, W.walnutTua, -0.3, 0, -0.25, { rz: -0.12 }).silinder(0.03, 0.7, W.walnutTua, -0.02, 1.7, -0.22, { rz: Math.PI / 2 - 0.2 })
    k.bola(0.5, W.rotan, 0.1, 0.95, 0, { sy: 1.15 }).bola(0.4, W.walnutTua, 0.1, 0.95, 0.16, { sy: 1.05 }).bola(0.3, W.linen, 0.1, 0.78, 0.2, { sy: 0.55 })
  },
  mejaRapat(k) {
    k.kotak(5.8, 0.1, 1.7, W.oak, 0, 0.64, 0).kotak(5.0, 0.012, 0.5, W.linen, 0, 0.74, 0)
    for (const x of [-2.2, 2.2]) k.kotak(0.12, 0.64, 1.2, W.oakTua, x, 0, 0)
    k.kotak(4.3, 0.1, 0.1, W.oakTua, 0, 0.22, 0)
    k.silinder(0.1, 0.16, W.indigoTua, 0, 0.75, 0).bola(0.16, W.daun, 0, 1.0, 0, { sy: 1.3 }).bola(0.06, W.sakura, 0.1, 1.15, 0.05)
    for (let i = 0; i < 6; i++) k.silinder(0.055, 0.07, W.linen, -2.3 + i * 0.92, 0.74, i % 2 ? 0.55 : -0.55).silinder(0.04, 0.01, W.matcha, -2.3 + i * 0.92, 0.805, i % 2 ? 0.55 : -0.55)
    k.kotak(0.42, 0.02, 0.3, W.putih, -1.4, 0.74, -0.45, { ry: 0.2 }).kotak(0.42, 0.02, 0.3, W.putih, 1.3, 0.74, 0.4, { ry: -0.15 })
  },
  konter(k) {
    k.kotak(5.8, 0.92, 0.7, W.plester, 0, 0, 0).kotak(5.8, 0.12, 0.72, W.oakTua, 0, 0, 0).kotak(6.0, 0.08, 0.95, W.oak, 0, 0.92, 0).kotak(1.7, 0.03, 0.8, W.batu, -1.9, 1.0, 0)
    for (let i = 0; i < 9; i++) k.kotak(0.04, 0.7, 0.02, W.oakTua, -2.6 + i * 0.65, 0.16, 0.36)
    k.silinder(0.2, 0.04, W.matcha, 0, 0.5, 0.36, { rx: Math.PI / 2, sisi: 18 }).silinder(0.13, 0.05, W.plester, 0, 0.5, 0.37, { rx: Math.PI / 2, sisi: 18 })
    k.bola(0.17, W.arang, -2.2, 1.17, -0.05, { sy: 0.8 }).silinder(0.025, 0.16, W.arang, -2.0, 1.15, -0.05, { rz: -0.9 }).silinder(0.1, 0.02, W.arang, -2.2, 1.3, -0.05)
    for (let i = 0; i < 4; i++) k.silinder(0.1, 0.09, [W.linen, W.liat, W.sage, W.linen][i], -1.3 + i * 0.42, 1.0, 0.1, { rAtas: 0.12 }).silinder(0.09, 0.01, W.matcha, -1.3 + i * 0.42, 1.085, 0.1)
    for (let i = 0; i < 3; i++) k.silinder(0.08, 0.2, W.kaca, 1.0 + i * 0.3, 1.0, -0.1).silinder(0.075, 0.12, W.matcha, 1.0 + i * 0.3, 1.0, -0.1)
    k.kotak(0.5, 0.25, 0.3, W.oakTua, 2.3, 1.0, 0).silinder(0.02, 0.2, W.bambu, 2.2, 1.25, 0.05).silinder(0.02, 0.24, W.bambu, 2.35, 1.25, -0.02)
  },
  bangkuBar(k, o) {
    k.silinder(0.27, 0.08, kain(o)[0], 0, 0.56, 0, { sisi: 14 }).silinder(0.25, 0.04, W.oakTua, 0, 0.52, 0, { sisi: 14 })
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.78; k.silinder(0.03, 0.54, W.oakTua, Math.cos(a) * 0.19, 0, Math.sin(a) * 0.19) }
    k.silinder(0.2, 0.02, W.oakTua, 0, 0.2, 0, { sisi: 14 })
  },
  mejaKafe(k) { k.silinder(0.42, 0.05, W.oak, 0, 0.7, 0, { sisi: 18 }).silinder(0.05, 0.7, W.arangMuda).silinder(0.24, 0.03, W.arangMuda).silinder(0.06, 0.08, W.linen, 0.12, 0.75, 0.05).silinder(0.06, 0.08, W.liat, -0.15, 0.75, -0.08) },
  tvKonsol(k) {
    k.kotak(2.8, 0.42, 0.5, W.walnut, 0, 0.06, 0).kotak(2.8, 0.06, 0.42, W.walnutTua).kotak(2.86, 0.04, 0.54, W.walnutTua, 0, 0.48, 0)
    for (const x of [-0.93, 0, 0.93]) k.kotak(0.84, 0.3, 0.02, W.rotanTua, x, 0.12, 0.25)
    k.kotak(0.5, 0.08, 0.3, W.putih, -0.8, 0.52, 0).kotak(0.3, 0.04, 0.2, W.arang, 0.6, 0.52, 0.05).bola(0.1, W.merah, 1.1, 0.62, 0)
  },
  kotatsu(k) {
    k.kotak(1.9, 0.26, 1.15, W.indigo, 0, 0, 0).kotak(2.05, 0.05, 1.3, W.indigoTua, 0, 0, 0).kotak(1.7, 0.07, 0.95, W.oak, 0, 0.27, 0)
    k.silinder(0.14, 0.05, W.walnutTua, 0, 0.34, 0).bola(0.055, W.momiji, -0.04, 0.42, 0).bola(0.055, W.momiji, 0.06, 0.42, 0.03).bola(0.055, W.momiji, 0.01, 0.48, -0.02)
    k.kotak(0.2, 0.03, 0.12, W.putih, -0.55, 0.34, 0.2, { ry: 0.3 }).kotak(0.2, 0.03, 0.12, W.arangMuda, 0.5, 0.34, 0.22, { ry: -0.2 })
  },
  zaisu(k, o) { k.kotak(0.6, 0.08, 0.6, kain(o)[0], 0, 0.02, 0).kotak(0.6, 0.55, 0.08, kain(o)[0], 0, 0.08, -0.28, { rx: -0.18 }).kotak(0.64, 0.03, 0.64, W.oakTua) },
  arcade(k, o) {
    const badan = o.warna === 'indigo' ? W.indigoTua : W.walnut
    k.kotak(0.72, 1.0, 0.7, badan).kotak(0.72, 0.6, 0.45, badan, 0, 1.0, -0.12).kotak(0.76, 0.2, 0.5, W.arang, 0, 1.6, -0.1)
    k.kotak(0.6, 0.14, 0.04, W.lampuMerah, 0, 1.63, 0.16, { pijar: true }).kotak(0.56, 0.42, 0.04, W.layarGame, 0, 1.08, 0.1, { rx: -0.25, pijar: true })
    k.kotak(0.7, 0.06, 0.3, W.arangMuda, 0, 0.98, 0.25, { rx: 0.2 }).silinder(0.02, 0.1, W.arang, -0.15, 1.02, 0.27).bola(0.04, W.merah, -0.15, 1.14, 0.27).bola(0.03, W.emas, 0.1, 1.05, 0.3).bola(0.03, W.matcha, 0.2, 1.05, 0.28)
    k.sinar(0, 1.2, 0.5, 1.5, W.layarGame)
  },
  gachapon(k) {
    k.kotak(0.6, 0.7, 0.55, W.merah).kotak(0.3, 0.12, 0.02, W.arang, 0, 0.2, 0.28).silinder(0.07, 0.04, W.linen, 0, 0.45, 0.28, { rx: Math.PI / 2 })
    k.bola(0.33, W.kaca, 0, 1.0, 0, { pijar: true }).silinder(0.2, 0.06, W.merahTua, 0, 1.3, 0)
    for (const [x, y, z, c] of [[-0.1, 0.85, 0.1, W.emas], [0.1, 0.88, 0.05, W.matcha], [0, 0.95, -0.08, W.indigo], [0.08, 1.02, 0.12, W.sakura], [-0.1, 1.0, -0.02, W.momiji]]) k.bola(0.08, c, x, y, z, { pijar: true })
  },
  biliar(k) {
    k.kotak(3.8, 0.22, 1.9, W.walnut, 0, 0.56, 0).kotak(3.4, 0.03, 1.5, W.sageTua, 0, 0.77, 0)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.kotak(0.18, 0.56, 0.18, W.walnutTua, sx * 1.7, 0, sz * 0.75)
    for (const [x, z, c] of [[0.9, 0.1, W.putih], [-0.6, -0.2, W.merah], [-0.75, 0.0, W.emas], [-0.75, -0.4, W.indigo], [-0.9, -0.1, W.arang], [-0.2, 0.4, W.momiji]]) k.bola(0.06, c, x, 0.86, z)
    k.silinder(0.02, 1.7, W.oak, 0.5, 0.82, -0.55, { rz: Math.PI / 2, ry: 0.25 })
  },
  foosball(k) {
    k.kotak(2.6, 0.3, 1.1, W.oak, 0, 0.62, 0).kotak(2.4, 0.02, 0.9, W.matcha, 0, 0.93, 0)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.kotak(0.1, 0.62, 0.1, W.oakTua, sx * 1.15, 0, sz * 0.42)
    for (let i = 0; i < 6; i++) {
      const x = -1.0 + i * 0.4, c = i % 2 ? W.indigo : W.merah
      k.silinder(0.018, 1.45, W.batu, x, 1.0, 0, { rx: Math.PI / 2 })
      for (const z of [-0.25, 0, 0.25]) k.kotak(0.06, 0.14, 0.05, c, x, 0.93, z)
    }
  },
  beanBag(k, o) { k.bola(0.46, kain(o)[0], 0, 0.26, 0, { sy: 0.62 }).bola(0.3, kain(o)[1], 0, 0.42, -0.12, { sy: 0.7 }) },
  treadmill(k) {
    k.kotak(0.8, 0.14, 1.8, W.arang, 0, 0.03, 0).kotak(0.62, 0.02, 1.5, W.arangMuda, 0, 0.17, 0.05)
    for (const x of [-0.36, 0.36]) k.kotak(0.05, 1.1, 0.05, W.batuTua, x, 0.15, -0.75, { rx: 0.1 })
    k.kotak(0.8, 0.26, 0.08, W.arang, 0, 1.2, -0.84, { rx: 0.4 }).kotak(0.5, 0.14, 0.02, W.layar, 0, 1.27, -0.79, { rx: 0.4, pijar: true })
  },
  rakDumbel(k) {
    k.kotak(1.8, 0.05, 0.5, W.arangMuda, 0, 0.3, 0).kotak(1.8, 0.05, 0.5, W.arangMuda, 0, 0.62, 0)
    for (const x of [-0.86, 0.86]) k.kotak(0.06, 0.7, 0.5, W.arang, x, 0, 0)
    for (let b = 0; b < 2; b++) for (let i = 0; i < 4; i++) {
      const x = -0.6 + i * 0.4, y = 0.4 + b * 0.32, r = 0.07 + (3 - i) * 0.012
      k.silinder(r, 0.1, W.arang, x, y, -0.12, { rx: Math.PI / 2 }).silinder(r, 0.1, W.arang, x, y, 0.12, { rx: Math.PI / 2 }).silinder(0.025, 0.2, W.batu, x, y, 0, { rx: Math.PI / 2 })
    }
  },
  bench(k) {
    k.kotak(0.4, 0.1, 1.5, W.arangMuda, 0, 0.42, 0.15).kotak(0.3, 0.42, 0.08, W.arang, 0, 0, 0.75).kotak(0.3, 0.42, 0.08, W.arang, 0, 0, -0.4)
    for (const x of [-0.4, 0.4]) k.kotak(0.05, 1.0, 0.05, W.arang, x, 0, -0.6)
    k.silinder(0.02, 1.3, W.batu, 0, 0.98, -0.6, { rz: Math.PI / 2 })
    for (const x of [-0.58, 0.58]) k.silinder(0.17, 0.06, W.arang, x, 0.95, -0.6, { rz: Math.PI / 2 })
  },
  samsak(k) {
    k.silinder(0.3, 0.05, W.arang).silinder(0.04, 1.9, W.arang, 0.3, 0, 0).kotak(0.5, 0.05, 0.05, W.arang, 0.08, 1.85, 0)
    k.silinder(0.012, 0.3, W.batu, -0.12, 1.55, 0).silinder(0.19, 0.9, W.liat, -0.12, 0.65, 0).silinder(0.195, 0.08, W.merahTua, -0.12, 1.3, 0)
  },
  futon(k, o) {
    k.kotak(0.95, 0.1, 1.95, W.linenTua, 0, 0.01, 0).kotak(0.9, 0.06, 1.9, W.linen, 0, 0.08, 0)
    k.kotak(0.5, 0.1, 0.3, W.putih, 0, 0.13, -0.72)
    k.kotak(0.96, 0.16, 1.2, kain(o)[0], 0, 0.1, 0.36).kotak(0.96, 0.17, 0.2, kain(o)[1], 0, 0.1, -0.2)
  },
  akari(k) {
    for (let i = 0; i < 3; i++) { const a = i * 2.094; k.silinder(0.018, 0.5, W.walnutTua, Math.cos(a) * 0.14, 0, Math.sin(a) * 0.14, { rx: Math.sin(a) * 0.3, rz: -Math.cos(a) * 0.3 }) }
    k.bola(0.24, W.kertas, 0, 0.92, 0, { sy: 1.9, pijar: true }).sinar(0, 0.9, 0, 3.2)
  },
  bonsai(k) {
    k.kotak(0.5, 0.42, 0.4, W.oakTua).kotak(0.56, 0.04, 0.46, W.oak, 0, 0.42, 0)
    k.kotak(0.4, 0.1, 0.28, W.indigoTua, 0, 0.46, 0).silinder(0.04, 0.34, W.walnutTua, 0, 0.55, 0, { rz: 0.4 }).silinder(0.03, 0.22, W.walnutTua, -0.14, 0.8, 0, { rz: -0.6 })
    k.bola(0.2, W.pinus, -0.2, 0.98, 0, { sy: 0.6 }).bola(0.16, W.daunTua, 0.08, 1.08, 0.04, { sy: 0.6 }).bola(0.13, W.pinus, 0.02, 0.82, 0.1, { sy: 0.55 })
  },
  bambuPot(k) {
    potTanaman(k, W.plesterTeduh, 0.24, 0.34)
    for (const [x, z, h] of [[-0.07, 0, 1.9], [0.06, 0.05, 2.2], [0.02, -0.07, 1.6], [0.1, -0.03, 1.3]]) {
      k.silinder(0.03, h, W.bambu, x, 0.3, z)
      for (let y = 0.9; y < h; y += 0.45) k.bola(0.14, y % 0.9 < 0.45 ? W.daun : W.daunMuda, x + Math.sin(y * 7) * 0.12, 0.3 + y, z + Math.cos(y * 5) * 0.12, { sy: 0.5 })
    }
  },
  pakis(k) {
    potTanaman(k, W.liat, 0.2, 0.26)
    for (let i = 0; i < 8; i++) { const a = i * 0.785; k.bola(0.2, i % 2 ? W.daun : W.daunMuda, Math.cos(a) * 0.2, 0.42, Math.sin(a) * 0.2, { sy: 0.25, sx: 1, sz: 0.5, ry: -a, rz: 0.5 }) }
    k.bola(0.16, W.daunTua, 0, 0.42, 0, { sy: 0.9 })
  },
  pedang(k) {
    potTanaman(k, W.putih, 0.19, 0.3)
    for (let i = 0; i < 6; i++) { const a = i * 1.047; k.kerucut(0.07, 0.75 + (i % 3) * 0.15, i % 2 ? W.daunTua : W.daun, Math.cos(a) * 0.08, 0.28, Math.sin(a) * 0.08, { rz: -Math.cos(a) * 0.18, rx: Math.sin(a) * 0.18, sisi: 5 }) }
  },
  vasRanting(k) {
    k.bola(0.26, W.linen, 0, 0.3, 0, { sy: 1.2 }).silinder(0.1, 0.12, W.linen, 0, 0.55, 0)
    for (const [rz, rx, h] of [[0.25, 0.1, 1.2], [-0.3, -0.1, 1.0], [0.05, 0.3, 1.35], [-0.12, -0.28, 0.9]]) {
      k.silinder(0.014, h, W.walnutTua, Math.sin(-rz) * h / 2, 0.6, Math.sin(rx) * h / 2, { rz, rx })
      k.bola(0.05, W.sakura, Math.sin(-rz) * h, 0.6 + h * 0.95, Math.sin(rx) * h).bola(0.04, W.putih, Math.sin(-rz) * h * 0.6, 0.6 + h * 0.62, Math.sin(rx) * h * 0.6)
    }
  },
  kapibara(k) {
    k.bola(0.36, W.kapibara, 0, 0.08, 0, { sx: 1.35, sy: 0.75 }).bola(0.22, W.kapibara, 0.42, 0.22, 0, { sx: 1.2 }).bola(0.05, W.walnutTua, 0.38, 0.4, 0.12).bola(0.05, W.walnutTua, 0.38, 0.4, -0.12)
    k.bola(0.03, W.arang, 0.56, 0.28, 0.1).bola(0.03, W.arang, 0.56, 0.28, -0.1).bola(0.09, W.emas, 0.4, 0.47, 0)
  },
  rakHanduk(k) {
    kaki4(k, 0.8, 0.5, 0.9, W.oakTua, 0.05)
    for (const y of [0.25, 0.58, 0.9]) k.kotak(0.8, 0.04, 0.5, W.oak, 0, y, 0)
    for (const y of [0.29, 0.62]) for (const x of [-0.22, 0.02, 0.26]) k.silinder(0.1, 0.4, W.putih, x, y + 0.1, 0, { rx: Math.PI / 2 })
    k.silinder(0.16, 0.2, W.oak, 0, 0.94, 0)
  },
  kursiDek(k) { kaki4(k, 0.6, 1.2, 0.26, W.oakTua, 0.05); k.kotak(0.62, 0.06, 1.0, W.oak, 0, 0.26, 0.15).kotak(0.62, 0.06, 0.6, W.oak, 0, 0.42, -0.5, { rx: 0.9 }).kotak(0.5, 0.05, 0.5, W.linen, 0, 0.32, 0.2) },
  wagasa(k) {
    k.silinder(0.18, 0.06, W.batuTua).silinder(0.025, 2.2, W.walnutTua, 0, 0, 0)
    k.kerucut(1.25, 0.4, W.merah, 0, 2.05, 0, { sisi: 16 }).kerucut(1.3, 0.05, W.merahTua, 0, 2.02, 0, { sisi: 16 }).bola(0.05, W.walnutTua, 0, 2.48, 0)
  },
  bangku(k) { kaki4(k, 1.8, 0.6, 0.4, W.oakTua, 0.07); k.kotak(1.9, 0.07, 0.66, W.oak, 0, 0.4, 0).kotak(1.94, 0.03, 0.5, W.merah, 0, 0.47, 0) },
  rumpunBambu(k) {
    for (const [x, z, h] of [[-0.2, 0, 3.2], [0.1, 0.15, 3.6], [0.22, -0.12, 2.8], [-0.05, -0.22, 3.0], [-0.28, 0.2, 2.4], [0.3, 0.25, 2.2]]) {
      k.silinder(0.045, h, W.bambu, x, 0, z, { rz: x * 0.1 })
      for (let y = 1.4; y < h + 0.2; y += 0.5) k.bola(0.24, (y * 2 | 0) % 2 ? W.daun : W.bambuTua, x + Math.sin(y * 6 + x * 9) * 0.25, y, z + Math.cos(y * 4 + z * 9) * 0.25, { sy: 0.45 })
    }
  },
  toro(k) {
    k.silinder(0.26, 0.1, W.batuTua, 0, 0, 0, { sisi: 6 }).silinder(0.1, 0.55, W.batu, 0, 0.1, 0, { sisi: 6 }).silinder(0.24, 0.07, W.batuTua, 0, 0.65, 0, { sisi: 6 })
    k.kotak(0.26, 0.26, 0.26, W.batu, 0, 0.72, 0).kotak(0.18, 0.18, 0.28, W.lampu, 0, 0.76, 0, { pijar: true }).kotak(0.28, 0.18, 0.18, W.lampu, 0, 0.76, 0, { pijar: true })
    k.kerucut(0.36, 0.22, W.batuTua, 0, 0.98, 0, { sisi: 6 }).bola(0.06, W.batuTua, 0, 1.22, 0).sinar(0, 0.85, 0, 2.4)
  },
  pinus(k) {
    k.silinder(0.1, 1.2, W.walnutTua, 0, 0, 0, { rz: 0.2 }).silinder(0.07, 0.9, W.walnutTua, -0.3, 1.1, 0, { rz: -0.5 })
    for (const [x, y, z, r] of [[-0.25, 1.35, 0.1, 0.5], [0.3, 1.65, -0.1, 0.42], [-0.55, 1.95, 0, 0.4], [0.05, 2.15, 0.1, 0.36], [0.5, 1.2, 0.2, 0.3]]) k.bola(r, W.pinus, x, y, z, { sy: 0.4 }).bola(r * 0.7, W.daunTua, x + 0.08, y + 0.1, z, { sy: 0.4 })
  },
  momiji(k) {
    k.silinder(0.09, 1.3, W.walnutTua, 0, 0, 0, { rz: -0.12 }).silinder(0.05, 0.8, W.walnutTua, 0.3, 1.1, 0, { rz: -0.7 }).silinder(0.05, 0.7, W.walnutTua, -0.15, 1.2, 0.1, { rz: 0.6 })
    for (const [x, y, z, r, c] of [[0.1, 1.9, 0, 0.55, W.momiji], [0.65, 1.6, 0.1, 0.42, W.momijiTua], [-0.5, 1.7, 0.1, 0.45, W.momiji], [0.2, 2.3, -0.1, 0.38, W.momijiTua], [-0.1, 1.5, 0.35, 0.36, W.emas], [0.45, 2.0, -0.3, 0.34, W.momiji]]) k.bola(r, c, x, y, z, { sy: 0.7 })
    for (const [x, z] of [[0.7, 0.6], [-0.5, 0.8], [0.2, 1.0], [-0.9, 0.2]]) k.silinder(0.06, 0.01, W.momiji, x, 0.02, z, { sisi: 5 })
  },
  batu(k, o) { const s = o.besar ?? 1; k.bongkah(0.38 * s, W.batu, 0, 0.14 * s, 0, { sy: 0.6, ry: 0.5 }).bongkah(0.2 * s, W.batuTua, 0.3 * s, 0.07 * s, 0.14, { sy: 0.6 }).bola(0.2 * s, W.daunTua, -0.1 * s, 0.26 * s, -0.05, { sy: 0.25 }) },
  batuBesar(k) { k.bongkah(0.6, W.batu, -0.3, 0.26, 0, { sy: 0.7, ry: 0.3 }).bongkah(0.42, W.batuTua, 0.5, 0.18, 0.1, { sy: 0.65, ry: 1 }).bola(0.3, W.daunTua, -0.3, 0.52, 0, { sy: 0.2 }) },
  semak(k) { k.bola(0.36, W.daun, -0.12, 0.22, 0, { sy: 0.75 }).bola(0.3, W.daunTua, 0.22, 0.2, 0.08, { sy: 0.75 }).bola(0.2, W.daunMuda, 0.02, 0.4, -0.08).bola(0.05, W.sakura, -0.2, 0.46, 0.2).bola(0.05, W.putih, 0.25, 0.4, 0.22) },
  kolam() {},   // digambar di dunia.js (air beranimasi + batu tepi)
}

// Hiasan dinding: digambar menghadap +z dengan punggung di z = 0, y = tinggi dari lantai.
export const HIAS = {
  jendela(k) {
    k.kotak(1.8, 0.86, 0.05, W.oakTua, 0, 0.3, 0.01).kotak(1.66, 0.72, 0.02, W.kertas, 0, 0.37, 0.04, { pijar: true })
    for (const x of [-0.55, 0, 0.55]) k.kotak(0.03, 0.72, 0.02, W.oakTua, x, 0.37, 0.055)
    for (const y of [0.6, 0.84]) k.kotak(1.66, 0.03, 0.02, W.oakTua, 0, y, 0.055)
    k.sinar(0, 0.4, 0.9, 2.0, W.kertas)
  },
  marumado(k) {
    k.silinder(0.5, 0.05, W.oakTua, 0, 0.72, 0.02, { rx: Math.PI / 2, sisi: 24 }).silinder(0.42, 0.06, W.kertas, 0, 0.72, 0.03, { rx: Math.PI / 2, sisi: 24, pijar: true })
    k.kotak(0.03, 0.84, 0.02, W.oakTua, 0, 0.3, 0.07).kotak(0.84, 0.03, 0.02, W.oakTua, 0, 0.7, 0.07).kotak(0.03, 0.6, 0.02, W.oakTua, 0.2, 0.42, 0.07)
    k.sinar(0, 0.4, 0.9, 1.8, W.kertas)
  },
  lukisan(k, o) {
    k.kotak(1.3, 0.8, 0.04, W.walnutTua, 0, 0.36, 0.01).kotak(1.18, 0.68, 0.02, o.motif === 'fuji' ? '#f3cfa0' : o.motif === 'ombak' ? '#dfe6e2' : W.linen, 0, 0.42, 0.03)
    if (o.motif === 'ombak') k.silinder(0.3, 0.02, W.indigo, -0.2, 0.62, 0.045, { rx: Math.PI / 2, sisi: 16 }).silinder(0.2, 0.025, '#dfe6e2', -0.12, 0.7, 0.045, { rx: Math.PI / 2, sisi: 16 }).kotak(1.18, 0.14, 0.02, W.indigoTua, 0, 0.42, 0.045)
    else if (o.motif === 'fuji') k.kerucut(0.4, 0.34, W.indigo, 0, 0.42, 0.045, { sz: 0.05, sisi: 4 }).silinder(0.09, 0.02, W.merah, 0.35, 0.92, 0.045, { rx: Math.PI / 2 })
    else k.kerucut(0.32, 0.3, W.arangMuda, -0.2, 0.42, 0.045, { sz: 0.05, sisi: 4 }).kerucut(0.24, 0.2, W.batuTua, 0.22, 0.42, 0.045, { sz: 0.05, sisi: 4 }).silinder(0.07, 0.02, W.merah, 0.38, 0.92, 0.045, { rx: Math.PI / 2 })
  },
  kokedama(k) { k.silinder(0.008, 0.5, W.walnutTua, 0, 0.75, 0.22).bola(0.15, W.daunTua, 0, 0.65, 0.22).bola(0.08, W.daunMuda, 0.05, 0.82, 0.22, { sy: 1.6 }).kotak(0.04, 0.04, 0.24, W.oakTua, 0, 1.24, 0.1) },
  papanWashi(k) {
    k.kotak(2.4, 0.86, 0.04, W.oakTua, 0, 0.3, 0.01).kotak(2.28, 0.74, 0.02, W.linen, 0, 0.36, 0.03)
    const c = [W.sage, W.sakura, W.kertas, W.oat, W.liat, W.matcha]
    for (let i = 0; i < 8; i++) k.kotak(0.3, 0.24, 0.01, c[i % c.length], -0.9 + (i % 4) * 0.6, i < 4 ? 0.74 : 0.42, 0.045, { rz: (i % 3 - 1) * 0.05 })
  },
  gulungan(k) {
    k.kotak(0.62, 0.04, 0.05, W.walnutTua, 0, 1.2, 0.02).kotak(0.56, 0.95, 0.015, W.linen, 0, 0.25, 0.02).kotak(0.62, 0.05, 0.05, W.walnutTua, 0, 0.22, 0.02)
    k.silinder(0.19, 0.012, W.arang, 0, 0.76, 0.035, { rx: Math.PI / 2, sisi: 20 }).silinder(0.14, 0.016, W.linen, 0.01, 0.765, 0.035, { rx: Math.PI / 2, sisi: 20 })
  },
  tv(k, o) {
    k.kotak(2.5, 0.92, 0.07, W.arang, 0, 0.3, 0.01).kotak(2.36, 0.78, 0.02, o.game ? W.layarGame : W.layar, 0, 0.37, 0.05, { pijar: true })
    if (o.game) k.silinder(0.2, 0.01, W.kertas, 0.5, 0.84, 0.065, { rx: Math.PI / 2, pijar: true }).kotak(2.36, 0.22, 0.01, W.indigoTua, 0, 0.37, 0.065, { pijar: true })
    else for (let i = 0; i < 4; i++) k.kotak(0.2, 0.16 + i * 0.1, 0.01, [W.sage, W.matcha, W.emas, W.liat][i], 0.3 + i * 0.3, 0.45, 0.065, { pijar: true })
    k.sinar(0, 0.5, 0.8, 2.2, o.game ? W.layarGame : W.layar)
  },
  papanMenu(k) { k.kotak(1.0, 1.0, 0.04, W.walnutTua, 0, 0.26, 0.01).kotak(0.9, 0.9, 0.02, W.arang, 0, 0.31, 0.03); for (let i = 0; i < 5; i++) k.kotak(0.5 + (i % 2) * 0.2, 0.04, 0.01, i === 0 ? W.matcha : W.linen, -0.05, 1.05 - i * 0.15, 0.045) },
  rakDinding(k) {
    k.kotak(1.8, 0.05, 0.3, W.oak, 0, 0.6, 0.16).kotak(1.2, 0.05, 0.3, W.oak, 0.3, 1.0, 0.16)
    k.bola(0.1, W.merah, -0.6, 0.76, 0.16, { sy: 1.2 }).bola(0.12, W.putih, 0, 0.78, 0.16).silinder(0.07, 0.18, W.indigoTua, 0.6, 0.65, 0.16).bola(0.1, W.daun, 0.6, 0.92, 0.16).kotak(0.3, 0.2, 0.2, W.oat, 0.2, 1.05, 0.16)
  },
  jam(k) { k.silinder(0.24, 0.05, W.oakTua, 0, 0.9, 0.03, { rx: Math.PI / 2, sisi: 20 }).silinder(0.2, 0.055, W.putih, 0, 0.9, 0.03, { rx: Math.PI / 2, sisi: 20 }).kotak(0.02, 0.14, 0.01, W.arang, 0, 0.9, 0.07).kotak(0.1, 0.02, 0.01, W.arang, 0.05, 0.9, 0.07) },
  lampion(k) {
    k.silinder(0.008, 3.6, W.arang, 0, 1.15, 0.12, { rz: Math.PI / 2 })
    for (let i = 0; i < 7; i++) { const x = -1.5 + i * 0.5, y = 1.0 - Math.sin(i / 6 * Math.PI) * 0.12; k.bola(0.1, i % 2 ? W.lampuMerah : W.lampu, x, y, 0.12, { sy: 1.2, pijar: true }) }
    k.sinar(-0.8, 0.9, 0.5, 1.8, W.lampuMerah).sinar(0.8, 0.9, 0.5, 1.8)
  },
  cermin(k) { k.kotak(2.7, 1.0, 0.04, W.oakTua, 0, 0.2, 0.01).kotak(2.58, 0.9, 0.02, '#cfe0dc', 0, 0.25, 0.03).kotak(0.5, 0.9, 0.01, '#e4efec', -0.6, 0.25, 0.045, { rz: 0 }) },
  rakBokken(k) { for (const x of [-0.6, 0.6]) k.kotak(0.06, 0.7, 0.1, W.walnutTua, x, 0.4, 0.05); for (let i = 0; i < 3; i++) k.silinder(0.025, 1.6, i === 1 ? W.walnut : W.oak, 0, 0.5 + i * 0.22, 0.12, { rz: Math.PI / 2 }) },
  chochin(k) { k.kotak(0.04, 0.04, 0.3, W.walnutTua, 0, 1.2, 0.14).silinder(0.006, 0.14, W.arang, 0, 1.06, 0.26).silinder(0.13, 0.36, W.kertas, 0, 0.7, 0.26, { pijar: true }).silinder(0.09, 0.04, W.arang, 0, 1.04, 0.26).silinder(0.09, 0.04, W.arang, 0, 0.68, 0.26).sinar(0, 0.6, 0.6, 2.4) },
}

// Pembantu untuk model yang punya bagian "di atas meja": taruh sementara di titik lokal lalu pulih.
Rakit.prototype.taruhLokal = function (x, y, z) { this._simpan = this.dasar.clone(); this.dasar.multiply(new T.Matrix4().makeTranslation(x, y, z)); return this }
Rakit.prototype.pulih = function () { this.dasar.copy(this._simpan); return this }
Rakit.prototype.catatLayar = function (meja, x, y, z) { this.v.set(x, y, z).applyMatrix4(this.dasar); this.layar.push({ meja, x: this.v.x, y: this.v.y, z: this.v.z, ry: Math.atan2(this.dasar.elements[8], this.dasar.elements[10]) }); return this }
