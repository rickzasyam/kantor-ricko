// Karakter 3D karyawan Kantor Ricko: sosok mungil berkepala besar yang dirakit dari bentuk dasar
// (tanpa berkas aset), dengan ciri tiap orang: warna baju dan gaya rambut. Pose (jalan, duduk,
// mengetik, tidur, berendam, ...) dibuat dengan memutar lengan/kaki dan menggeser badan.
//
// Supaya ringan saat banyak karakter bergerak, tiap sosok hanya 7 jaring (kepala, torso, 2 lengan,
// 2 kaki, cangkir) dengan satu bahan bersama; bagian kecilnya (mata, rambut, dasi) digabung.
import * as T from '../vendor/three.module.js'
import { Rakit } from './model.js'

const KULIT = '#f2cba6'
export const PENAMPILAN = {
  ricko: { baju: '#41414c', celana: '#2c2c34', rambut: '#231f1e', gaya: 'klimis', dasi: '#b9573f' },
  'pak-asep': { baju: '#41699b', celana: '#2f3e55', rambut: '#6f4928', gaya: 'pendek', dasi: '#cda85f' },
  kokom: { baju: '#33302f', celana: '#33302f', rambut: '#dc8d48', gaya: 'ikal', rok: true },
  ujang: { baju: '#f4f0e7', celana: '#4d6289', rambut: '#70492a', gaya: 'jabrik' },
  joko: { baju: '#df8e48', celana: '#3d3733', rambut: '#2a2220', gaya: 'afro' },
  neneng: { baju: '#bb483f', celana: '#3d3733', rambut: '#1f1b1b', gaya: 'bob' },
  ayu: { baju: '#e491b2', celana: '#e491b2', rambut: '#3b2721', gaya: 'panjang', rok: true },
}

const BAHAN = new T.MeshLambertMaterial({ vertexColors: true })
/** Rakit satu bagian tubuh menjadi satu jaring. */
function bagian(induk, susun, x = 0, y = 0, z = 0) {
  const k = new Rakit()
  susun(k)
  const m = new T.Mesh(k.gabung(k.padat), BAHAN)
  m.position.set(x, y, z)
  m.castShadow = true
  induk.add(m)
  return m
}
const halus = { sisi: 12, tinggi: 9 }

export function buatTokoh(id) {
  const p = PENAMPILAN[id] ?? PENAMPILAN.ujang
  const akar = new T.Group(), badan = new T.Group(), tubuh = new T.Group()
  akar.add(badan); badan.add(tubuh)

  bagian(tubuh, k => {
    k.silinder(p.rok ? 0.33 : 0.25, 0.46, p.baju, 0, 0.44, 0, { rAtas: 0.2, sisi: 12 })
    if (p.dasi) k.kotak(0.14, 0.2, 0.04, '#f4f0e7', 0, 0.66, 0.2).kotak(0.05, 0.22, 0.03, p.dasi, 0, 0.61, 0.225)
  })
  const anggota = (x, y, panjang, tebal, warna, ujung) => bagian(tubuh, k => {
    k.silinder(tebal, panjang, warna, 0, -panjang, 0).bola(tebal * 1.2, ujung, 0, -panjang, 0.012, { sz: 1.25 })
  }, x, y, 0)
  const lenganKi = anggota(-0.28, 0.86, 0.34, 0.065, p.baju, KULIT), lenganKa = anggota(0.28, 0.86, 0.34, 0.065, p.baju, KULIT)
  const kakiKi = anggota(-0.11, 0.46, 0.42, 0.085, p.rok ? KULIT : p.celana, '#3a322d'), kakiKa = anggota(0.11, 0.46, 0.42, 0.085, p.rok ? KULIT : p.celana, '#3a322d')
  const cangkir = bagian(lenganKa, k => k.silinder(0.06, 0.1, '#f6efe2', 0, 0, 0).silinder(0.045, 0.01, '#9cb05c', 0, 0.1, 0), 0, -0.45, 0.09)
  cangkir.visible = false

  // kepala: wajah, mata, pipi, rambut menurut gaya
  const r = p.rambut
  const kepala = bagian(badan, k => {
    k.bola(0.27, KULIT, 0, 0, 0, { sy: 0.96, sz: 0.96, ...halus })
    for (const x of [-0.095, 0.095]) k.bola(0.036, '#2e2622', x, 0, 0.238, { sy: 1.25, sz: 0.5 }).bola(0.042, '#eba58f', x * 1.75, -0.07, 0.205, { sy: 0.7, sz: 0.4 })
    k.bola(0.285, r, 0, 0.06, -0.035, { sy: 0.88, sz: 0.96, ...halus })                         // tudung rambut
    if (p.gaya === 'klimis') k.bola(0.2, r, 0.06, 0.2, 0.08, { sy: 0.4, sz: 0.8 })
    if (p.gaya === 'pendek') k.bola(0.2, r, -0.05, 0.2, 0.1, { sy: 0.45, sz: 0.7 })
    if (p.gaya === 'jabrik') for (const [x, z, t] of [[-0.14, 0.05, 0.2], [0, 0.1, 0.26], [0.14, 0.05, 0.2], [-0.07, -0.08, 0.22], [0.08, -0.08, 0.22]]) k.kerucut(0.09, t, r, x, 0.2, z, { rx: 0.25, rz: -x * 1.6, sisi: 6 })
    if (p.gaya === 'afro') k.bola(0.38, r, 0, 0.14, -0.05, { sy: 0.9, sz: 0.95, ...halus })
    if (p.gaya === 'ikal') for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; k.bola(0.12, r, Math.cos(a) * 0.24, 0.1 + Math.sin(i * 2.3) * 0.05, Math.sin(a) * 0.22 - 0.06) }
    if (p.gaya === 'bob') { for (const x of [-0.23, 0.23]) k.bola(0.2, r, x, -0.08, -0.02, { sx: 0.45 }); k.kotak(0.36, 0.08, 0.08, r, 0, 0.13, 0.2) }
    if (p.gaya === 'panjang') { k.kotak(0.44, 0.6, 0.14, r, 0, -0.58, -0.2); for (const x of [-0.24, 0.24]) k.bola(0.24, r, x, -0.1, 0, { sx: 0.3, sz: 0.65 }) }
  }, 0, 1.16, 0)

  return { id, akar, badan, tubuh, kepala, lenganKi, lenganKa, kakiKi, kakiKa, cangkir, fase: Math.random() * 6, kini: {} }
}

// Sasaran tiap pose: y = naik/turun badan, kaki/lengan = putaran maju (negatif = ke depan),
// buka = lengan/kaki membuka ke samping, condong = badan miring ke depan.
const DIAM = { y: 0, rebah: 0, kakiKi: 0, kakiKa: 0, lenganKi: 0, lenganKa: 0, bukaKaki: 0, bukaLengan: 0.08, condong: 0, angguk: 0 }
function sasaran(pose, t) {
  const s = Math.sin, a = { ...DIAM }
  switch (pose) {
    case 'jalan': { const g = s(t * 9.5); Object.assign(a, { kakiKi: g * 0.75, kakiKa: -g * 0.75, lenganKi: -g * 0.55, lenganKa: g * 0.55, y: Math.abs(g) * 0.035 }); break }
    case 'lari': { const g = s(t * 15); Object.assign(a, { kakiKi: g * 1.0, kakiKa: -g * 1.0, lenganKi: -g * 0.9 - 0.4, lenganKa: g * 0.9 - 0.4, y: Math.abs(g) * 0.06, condong: 0.12 }); break }
    case 'duduk': Object.assign(a, { y: 0.03, kakiKi: -1.5, kakiKa: -1.5, lenganKi: -0.35, lenganKa: -0.35 }); break
    case 'ketik': Object.assign(a, { y: 0.03, kakiKi: -1.5, kakiKa: -1.5, lenganKi: -1.15 + s(t * 15) * 0.1, lenganKa: -1.15 + s(t * 15 + 2) * 0.1, condong: 0.06, angguk: 0.08 }); break
    case 'lesehan': Object.assign(a, { y: -0.34, kakiKi: -1.5, kakiKa: -1.5, bukaKaki: 0.25, lenganKi: -0.6, lenganKa: -0.6 + (s(t * 0.7) > 0.8 ? -0.9 : 0) }); break
    case 'meditasi': Object.assign(a, { y: -0.34 + s(t * 0.9) * 0.012, kakiKi: -1.5, kakiKa: -1.5, bukaKaki: 0.75, lenganKi: -0.55, lenganKa: -0.55, bukaLengan: 0.4 }); break
    case 'rendam': Object.assign(a, { y: -0.74 + s(t * 1.4) * 0.015, kakiKi: -1.3, kakiKa: -1.3, lenganKi: -0.3, lenganKa: -0.3, bukaLengan: 0.5, angguk: -0.12 }); break
    case 'tidur': Object.assign(a, { y: 0.4, rebah: -Math.PI / 2 }); break
    case 'minum': Object.assign(a, { lenganKa: s(t * 1.3) > 0.55 ? -2.25 : -1.0, lenganKi: -0.1, angguk: s(t * 1.3) > 0.55 ? -0.15 : 0 }); break
    case 'main': Object.assign(a, { lenganKi: -1.2 + s(t * 11) * 0.14, lenganKa: -1.2 + s(t * 13 + 1) * 0.14, condong: 0.1, y: Math.abs(s(t * 3)) * 0.02 }); break
    case 'tinju': { const g = s(t * 7); Object.assign(a, { lenganKi: g > 0.3 ? -1.6 : -0.9, lenganKa: g < -0.3 ? -1.6 : -0.9, bukaLengan: 0.2, y: Math.abs(s(t * 7)) * 0.03, condong: 0.1 }); break }
    case 'bicara': Object.assign(a, { lenganKa: -1.1 + s(t * 5) * 0.45, lenganKi: -0.2, bukaLengan: 0.25, angguk: s(t * 3) * 0.08 }); break
    default: a.y = s(t * 2) * 0.006
  }
  return a
}

/** Terapkan posisi, arah, dan pose ke sosok. o = { x, z, sudut, pose } dari simulasi. */
export function gerakkan(tokoh, o, t, dt) {
  const a = sasaran(o.pose, t + tokoh.fase), k = tokoh.kini, h = Math.min(1, dt * 14)
  for (const n in a) k[n] = k[n] === undefined ? a[n] : k[n] + (a[n] - k[n]) * h
  tokoh.akar.position.set(o.x, 0, o.z)
  tokoh.akar.rotation.y = o.sudut
  // rebah: badan diputar telentang, kepala ke utara (bantal); digeser supaya kepala jatuh di bantal
  tokoh.badan.position.set(0, k.y, k.rebah < -0.5 ? 0.42 : 0)
  tokoh.badan.rotation.x = k.rebah + k.condong
  tokoh.tubuh.visible = k.rebah > -1.2          // saat tidur badan "di bawah selimut" futon
  tokoh.kepala.rotation.x = k.angguk
  tokoh.kakiKi.rotation.set(k.kakiKi, 0, -k.bukaKaki); tokoh.kakiKa.rotation.set(k.kakiKa, 0, k.bukaKaki)
  tokoh.lenganKi.rotation.set(k.lenganKi, 0, -k.bukaLengan); tokoh.lenganKa.rotation.set(k.lenganKa, 0, k.bukaLengan)
  tokoh.cangkir.visible = o.pose === 'minum'
}

/** Potret karyawan untuk panel Staff: adegan kecil sendiri di kanvas yang diberikan. Mengembalikan fungsi tutup. */
export function potret(id, kanvas) {
  const renderer = new T.WebGLRenderer({ canvas: kanvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(kanvas.clientWidth, kanvas.clientHeight, false)
  const scene = new T.Scene(), kamera = new T.PerspectiveCamera(24, kanvas.clientWidth / kanvas.clientHeight, 0.1, 20)
  kamera.position.set(0.9, 1.3, 4.1); kamera.lookAt(0, 0.76, 0)
  scene.add(new T.HemisphereLight('#fff6e6', '#b9a487', 1.5))
  const lampu = new T.DirectionalLight('#fff2dc', 2.2); lampu.position.set(-2, 3, 3); scene.add(lampu)
  scene.add(new T.Mesh(new T.CircleGeometry(0.75, 32).rotateX(-Math.PI / 2), new T.MeshLambertMaterial({ color: '#cdb98f' })))
  const tokoh = buatTokoh(id)
  scene.add(tokoh.akar)
  let hidup = true
  const t0 = performance.now()
  const putar = () => {
    if (!hidup) return
    const t = (performance.now() - t0) / 1000
    gerakkan(tokoh, { x: 0, z: 0, sudut: Math.sin(t * 0.6) * 0.35, pose: 'berdiri' }, t, 0.016)
    renderer.render(scene, kamera)
    requestAnimationFrame(putar)
  }
  putar()
  return () => { hidup = false; renderer.dispose(); renderer.forceContextLoss() }
}
