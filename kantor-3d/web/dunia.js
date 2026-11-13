// Dunia 3D Kantor Ricko: lantai (tekstur dilukis di kanvas), dinding, furnitur gabungan, kolam
// onsen, papan nama, cahaya pagi/siang/sore/malam, dan kamera (geser, zoom, putar).
//
// Kelancaran: semua benda diam digabung jadi dua jaring (lihat model.js), lantai satu bidang
// bertekstur, pendar lampu satu Points + satu InstancedMesh. Yang bergerak tiap frame hanya
// karakter, air kolam, dan uap.
import * as T from '../vendor/three.module.js'
import { COLS, ROWS, UBIN, FURNITUR, HIASAN, PAPAN, RUANG, KOLAM, bangunPeta } from './denah.js'
import { Rakit, MODEL, HIAS, W } from './model.js'

const TINGGI_DINDING = 1.3, TEBAL = 0.3     // dinding menjorok 0,3 ubin dari tepi ubinnya (tebal 0,4)
const PX = 32                               // piksel tekstur lantai per ubin

const WAKTU = {
  pagi: { matahari: ['#ffe2bd', 2.3, [-22, 20, 12]], langit: ['#fff4e2', '#d8c4a2', 1.35], pijar: 0.95, pendar: 0.12, latar: ['#f3e7d2', '#dccaa9'] },
  siang: { matahari: ['#fff1dc', 2.7, [-10, 28, 14]], langit: ['#ffffff', '#e2d3b8', 1.45], pijar: 0.92, pendar: 0.06, latar: ['#f4ecdb', '#e2d3b8'] },
  sore: { matahari: ['#ffae70', 2.3, [22, 13, 14]], langit: ['#ffdcb8', '#c2a07c', 1.05], pijar: 1.0, pendar: 0.5, latar: ['#f2cda2', '#c58f6c'] },
  malam: { matahari: ['#a9baf0', 0.9, [-14, 24, 16]], langit: ['#9aa7dc', '#454060', 1.05], pijar: 1.2, pendar: 1.0, latar: ['#2b2c47', '#141320'] },
}

/** Nama waktu menurut jam PC; bisa dipaksa lewat ?waktu=malam atau window.__kantorWaktu. */
export function namaWaktu() {
  const paksa = (typeof window !== 'undefined' && window.__kantorWaktu) || new URLSearchParams(location.search).get('waktu')
  if (WAKTU[paksa]) return paksa
  const d = new Date(), jam = d.getHours() + d.getMinutes() / 60
  return jam >= 18.5 || jam < 5.5 ? 'malam' : jam < 9.5 ? 'pagi' : jam < 15.5 ? 'siang' : 'sore'
}

function acak(benih) {
  let a = benih >>> 0
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

/** Lukis seluruh lantai kantor ke satu kanvas: papan kayu, tatami, batu, lumut, kerikil, dek. */
function lukisLantai(peta) {
  const kv = document.createElement('canvas')
  kv.width = COLS * PX; kv.height = ROWS * PX
  const g = kv.getContext('2d')
  const jenis = (c, r) => (c < 0 || r < 0 || c >= COLS || r >= ROWS ? null : peta.lantai[peta.idx(c, r)])
  const papan = (x, y, r, dasar, garis, vertikal) => {
    g.fillStyle = dasar; g.fillRect(x, y, PX, PX)
    for (let i = 0; i < 2; i++) {
      g.fillStyle = `rgba(${r() > 0.5 ? '255,240,215' : '90,60,30'},${0.04 + r() * 0.07})`
      vertikal ? g.fillRect(x + i * 16, y, 16, PX) : g.fillRect(x, y + i * 16, PX, 16)
      g.fillStyle = garis
      vertikal ? g.fillRect(x + i * 16, y, 1, PX) : g.fillRect(x, y + i * 16, PX, 1)
      if (r() < 0.22) { const p = 4 + Math.floor(r() * 24); vertikal ? g.fillRect(x + i * 16, y + p, 16, 1) : g.fillRect(x + p, y + i * 16, 1, 16) }
    }
  }
  const lumut = (x, y, r) => {
    g.fillStyle = '#8aa05c'; g.fillRect(x, y, PX, PX)
    for (let i = 0; i < 9; i++) { g.fillStyle = ['#7c9352', '#96ab66', '#839a58', '#a3b673'][Math.floor(r() * 4)]; g.beginPath(); g.arc(x + r() * PX, y + r() * PX, 2 + r() * 5, 0, 7); g.fill() }
  }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const j = jenis(c, r)
    if (peta.ubin[peta.idx(c, r)] !== UBIN.LANTAI || !j) continue
    const x = c * PX, y = r * PX, rnd = acak(c * 7919 + r * 104729)
    if (j === 'oak') papan(x, y, rnd, '#dcc095', 'rgba(120,85,45,0.28)')
    else if (j === 'walnut') papan(x, y, rnd, '#9a7250', 'rgba(60,35,18,0.35)')
    else if (j === 'dek') papan(x, y, rnd, '#b08a60', 'rgba(70,45,22,0.45)', true)
    else if (j === 'tatami' || j.startsWith('matras')) {
      g.fillStyle = '#c3bf86'; g.fillRect(x, y, PX, PX)
      g.fillStyle = 'rgba(110,115,60,0.13)'
      for (let i = 0; i < PX; i += 3) g.fillRect(x, y + i, PX, 1)
      g.fillStyle = '#6f7650'
      g.fillRect(x, y, PX, 1.5)
      if ((c + (r % 2)) % 2 === 0) g.fillRect(x, y, 1.5, PX)
      if (j !== 'tatami') { g.fillStyle = { matras1: '#a9b88e', matras2: '#c99579', matras3: '#e2d4b8' }[j]; g.fillRect(x + 4, y, PX - 8, PX) }
    } else if (j === 'plester') {
      g.fillStyle = '#eadfca'; g.fillRect(x, y, PX, PX)
      g.fillStyle = `rgba(150,125,90,${0.03 + rnd() * 0.06})`; g.fillRect(x, y, PX, PX)
      g.fillStyle = 'rgba(140,115,80,0.25)'; g.fillRect(x, y, PX, 1); g.fillRect(x, y, 1, PX)
    } else if (j === 'batu') {
      g.fillStyle = '#8f877a'; g.fillRect(x, y, PX, PX)
      for (const [bx, by] of [[1, 1], [17, 1], [1, 17], [17, 17]]) { g.fillStyle = ['#b9b0a1', '#aaa192', '#c4bbac'][Math.floor(rnd() * 3)]; g.fillRect(x + bx, y + by, 14, 14) }
    } else if (j === 'permadani') {
      g.fillStyle = '#d2bd95'; g.fillRect(x, y, PX, PX)
      g.fillStyle = 'rgba(120,95,55,0.16)'
      for (let i = 0; i < PX; i += 4) { g.fillRect(x + i, y, 1, PX); g.fillRect(x, y + i, PX, 1) }
      g.fillStyle = '#a98f62'
      if (jenis(c, r - 1) !== 'permadani') g.fillRect(x, y, PX, 4)
      if (jenis(c, r + 1) !== 'permadani') g.fillRect(x, y + PX - 4, PX, 4)
      if (jenis(c - 1, r) !== 'permadani') g.fillRect(x, y, 4, PX)
      if (jenis(c + 1, r) !== 'permadani') g.fillRect(x + PX - 4, y, 4, PX)
    } else if (j === 'kerikil') {
      g.fillStyle = '#ddd5c2'; g.fillRect(x, y, PX, PX)
      g.strokeStyle = 'rgba(140,130,110,0.5)'; g.lineWidth = 1
      for (let i = 3; i < PX; i += 6) { g.beginPath(); g.moveTo(x, y + i); g.quadraticCurveTo(x + 16, y + i + 2.5, x + PX, y + i); g.stroke() }
    } else {
      lumut(x, y, rnd)
      if (j === 'pijak') { g.fillStyle = '#b5ad9d'; g.beginPath(); g.ellipse(x + 16, y + 16, 11 + rnd() * 2, 8 + rnd() * 2, rnd() * 3, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.ellipse(x + 14, y + 14, 6, 4, 0, 0, 7); g.fill() }
    }
  }
  const tex = new T.CanvasTexture(kv)
  tex.colorSpace = T.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

function teksturBulat() {
  const kv = document.createElement('canvas'); kv.width = kv.height = 64
  const g = kv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64)
  return new T.CanvasTexture(kv)
}

function papanNama(teks) {
  const kv = document.createElement('canvas'); kv.width = 512; kv.height = 96
  const g = kv.getContext('2d')
  g.fillStyle = '#c9a36f'; g.fillRect(0, 0, 512, 96)
  g.fillStyle = '#b48c58'; for (let y = 6; y < 96; y += 11) g.fillRect(0, y, 512, 1)
  g.strokeStyle = '#6d4c2c'; g.lineWidth = 8; g.strokeRect(4, 4, 504, 88)
  g.fillStyle = '#3f2c1b'; g.font = '600 50px Georgia, "Yu Mincho", serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
  g.fillText(teks.split('').join(' '), 256, 51, 470)
  const tex = new T.CanvasTexture(kv)
  tex.colorSpace = T.SRGBColorSpace
  return tex
}

export function buatDunia(kanvas) {
  const peta = bangunPeta()
  const renderer = new T.WebGLRenderer({ canvas: kanvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  renderer.shadowMap.enabled = true
  const scene = new T.Scene()
  const kamera = new T.PerspectiveCamera(30, 1, 1, 400)

  // --- lantai ---
  const lantai = new T.Mesh(new T.PlaneGeometry(COLS, ROWS).rotateX(-Math.PI / 2), new T.MeshLambertMaterial({ map: lukisLantai(peta), alphaTest: 0.5 }))
  lantai.position.set(COLS / 2, 0, ROWS / 2)
  lantai.receiveShadow = true
  scene.add(lantai)

  // --- benda diam: alas, dinding, furnitur, hiasan ---
  const k = new Rakit()
  k.taruh(0, 0).kotak(48, 0.5, 34, W.walnutTua, 25, -0.52, 18).kotak(12, 0.5, 12, W.walnutTua, 54, -0.52, 17)
  const dinding = (c, r) => c >= 0 && r >= 0 && c < COLS && r < ROWS && (peta.ubin[peta.idx(c, r)] === UBIN.DINDING || peta.ubin[peta.idx(c, r)] === UBIN.PAGAR)
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const u = peta.ubin[peta.idx(c, r)]
    if (u !== UBIN.DINDING && u !== UBIN.PAGAR) continue
    const t = u === UBIN.PAGAR ? 0.42 : TEBAL
    const x0 = c + (dinding(c - 1, r) ? 0 : t), x1 = c + 1 - (dinding(c + 1, r) ? 0 : t)
    const z0 = r + (dinding(c, r - 1) ? 0 : t), z1 = r + 1 - (dinding(c, r + 1) ? 0 : t)
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0
    if (u === UBIN.PAGAR) {
      k.kotak(w, 0.95, d, W.rotanTua, cx, 0, cz).kotak(w + 0.05, 0.06, d + 0.05, W.walnutTua, cx, 0.95, cz).kotak(w + 0.03, 0.05, d + 0.03, W.walnutTua, cx, 0.5, cz)
    } else {
      k.kotak(w, TINGGI_DINDING, d, W.plester, cx, 0, cz).kotak(w + 0.04, 0.14, d + 0.04, W.oakGelap, cx, 0, cz).kotak(w + 0.08, 0.08, d + 0.08, W.oakGelap, cx, TINGGI_DINDING, cz)
    }
  }
  for (const f of FURNITUR) {
    if (!MODEL[f.j]) throw new Error(`model belum ada: ${f.j}`)
    MODEL[f.j](k.taruh(f.x, f.z, f.r ?? 0, f.j === 'kapibara' ? -0.02 : 0), f)
  }
  const mukaDinding = d => d + 1 - TEBAL + 0.005
  for (const h of HIASAN) {
    if (!HIAS[h.j]) throw new Error(`hiasan belum ada: ${h.j}`)
    HIAS[h.j](k.taruh(h.x, mukaDinding(h.d)), h)
  }
  // batu tepi kolam
  k.taruh(KOLAM.x, KOLAM.z)
  const rb = acak(77)
  for (let i = 0; i < 26; i++) {
    const a = i / 26 * Math.PI * 2 + rb() * 0.1, s = 0.28 + rb() * 0.3
    if (Math.sin(a) > 0.35 && Math.abs(Math.cos(a)) < 0.45) continue      // celah di sisi selatan untuk masuk
    k.bongkah(s, rb() > 0.5 ? W.batu : W.batuTua, Math.cos(a) * (KOLAM.rx + 0.15), s * 0.3, Math.sin(a) * (KOLAM.rz + 0.15), { sy: 0.65, ry: rb() * 3 })
    if (rb() > 0.6) k.bola(s * 0.5, W.daunTua, Math.cos(a) * (KOLAM.rx + 0.2), s * 0.6, Math.sin(a) * (KOLAM.rz + 0.2), { sy: 0.3 })
  }
  k.taruh(KOLAM.x - KOLAM.rx - 0.2, KOLAM.z - 0.6, 0.5).silinder(0.05, 0.9, W.bambu, 0, 0, 0, { rz: -0.5 }).silinder(0.04, 0.5, W.bambu, 0.3, 0.72, 0, { rz: -1.5 })   // pancuran bambu

  const padat = new T.Mesh(k.gabung(k.padat), new T.MeshLambertMaterial({ vertexColors: true }))
  padat.castShadow = padat.receiveShadow = true
  const bahanPijar = new T.MeshBasicMaterial({ vertexColors: true })
  const pijar = new T.Mesh(k.gabung(k.pijar), bahanPijar)
  scene.add(padat, pijar)

  // papan nama ruangan
  for (const [id, x, d] of PAPAN) {
    const teks = RUANG.find(r => r.id === id).papan, w = 0.5 + teks.length * 0.17
    const m = new T.Mesh(new T.PlaneGeometry(w, 0.36), new T.MeshLambertMaterial({ map: papanNama(teks) }))
    m.position.set(x, 0.92, mukaDinding(d) + 0.03)
    scene.add(m)
  }

  // layar monitor meja kerja: menyala saat pemiliknya bekerja
  const layar = new Map()
  for (const l of k.layar) {
    const m = new T.Mesh(new T.PlaneGeometry(0.72, 0.42), new T.MeshBasicMaterial({ color: '#27221f' }))
    m.position.set(l.x, l.y, l.z + 0.012)
    scene.add(m)
    layar.set(l.meja, m)
  }

  // --- kolam onsen: air beriak + uap ---
  const kvAir = document.createElement('canvas'); kvAir.width = kvAir.height = 128
  const ga = kvAir.getContext('2d'), ra = acak(5)
  ga.fillStyle = '#74b9aa'; ga.fillRect(0, 0, 128, 128)
  for (let i = 0; i < 40; i++) { ga.strokeStyle = `rgba(230,250,244,${0.12 + ra() * 0.2})`; ga.lineWidth = 1 + ra() * 1.5; ga.beginPath(); ga.ellipse(ra() * 128, ra() * 128, 6 + ra() * 14, 2 + ra() * 4, 0, 0, 7); ga.stroke() }
  const texAir = new T.CanvasTexture(kvAir)
  texAir.colorSpace = T.SRGBColorSpace; texAir.wrapS = texAir.wrapT = T.RepeatWrapping; texAir.repeat.set(3, 1.5)
  const air = new T.Mesh(new T.CircleGeometry(1, 40).rotateX(-Math.PI / 2), new T.MeshLambertMaterial({ map: texAir, emissive: '#2c5f58', emissiveIntensity: 0.35 }))
  air.scale.set(KOLAM.rx, 1, KOLAM.rz); air.position.set(KOLAM.x, 0.05, KOLAM.z); air.receiveShadow = true
  scene.add(air)
  const texBulat = teksturBulat()
  const uap = []
  for (let i = 0; i < 8; i++) {
    const s = new T.Sprite(new T.SpriteMaterial({ map: texBulat, color: '#ffffff', transparent: true, opacity: 0.2, depthWrite: false }))
    s.userData = { x: KOLAM.x + (ra() - 0.5) * KOLAM.rx * 1.5, z: KOLAM.z + (ra() - 0.5) * KOLAM.rz * 1.3, fase: ra() }
    uap.push(s); scene.add(s)
  }

  // --- pendar lampu (terlihat sore & malam) ---
  const gp = new T.BufferGeometry(), pp = [], pc = [], cw = new T.Color()
  for (const [x, y, z, , warna] of k.lampu) { pp.push(x, y, z); cw.set(warna); pc.push(cw.r, cw.g, cw.b) }
  gp.setAttribute('position', new T.Float32BufferAttribute(pp, 3)); gp.setAttribute('color', new T.Float32BufferAttribute(pc, 3))
  const halo = new T.Points(gp, new T.PointsMaterial({ map: texBulat, size: 2.6, vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false }))
  const kolamCahaya = new T.InstancedMesh(new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ map: texBulat, transparent: true, blending: T.AdditiveBlending, depthWrite: false }), k.lampu.length)
  const mi = new T.Matrix4()
  k.lampu.forEach(([x, , z, jari, warna], i) => { kolamCahaya.setMatrixAt(i, mi.makeScale(jari * 2, 1, jari * 2).setPosition(x, 0.03, z)); kolamCahaya.setColorAt(i, cw.set(warna)) })
  scene.add(halo, kolamCahaya)

  // --- cahaya ---
  const langit = new T.HemisphereLight('#fff', '#ccc', 1)
  const matahari = new T.DirectionalLight('#fff', 2)
  matahari.castShadow = true
  matahari.shadow.mapSize.set(2048, 2048)
  Object.assign(matahari.shadow.camera, { left: -36, right: 36, top: 26, bottom: -26, near: 1, far: 120 })
  matahari.shadow.bias = -0.0005; matahari.shadow.normalBias = 0.03
  matahari.target.position.set(COLS / 2, 0, ROWS / 2)
  scene.add(langit, matahari, matahari.target)

  let waktuKini = null
  function aturWaktu() {
    const nama = namaWaktu()
    if (nama === waktuKini) return
    waktuKini = nama
    const w = WAKTU[nama]
    matahari.color.set(w.matahari[0]); matahari.intensity = w.matahari[1]
    matahari.position.set(COLS / 2 + w.matahari[2][0], w.matahari[2][1], ROWS / 2 + w.matahari[2][2])
    langit.color.set(w.langit[0]); langit.groundColor.set(w.langit[1]); langit.intensity = w.langit[2]
    bahanPijar.color.setScalar(w.pijar)
    halo.material.opacity = w.pendar * 0.75; kolamCahaya.material.opacity = w.pendar * 0.4
    halo.visible = kolamCahaya.visible = w.pendar > 0.1
    document.documentElement.style.setProperty('--latar-atas', w.latar[0]); document.documentElement.style.setProperty('--latar-bawah', w.latar[1])
    document.documentElement.dataset.waktu = nama
  }

  // --- kamera: geser (seret kiri), zoom (roda), putar (seret kanan / Q / E) ---
  const kam = { tx: COLS / 2, tz: ROWS / 2 + 1, jarak: 70, yaw: 0, yawTuju: 0, pitch: 0.9, jarakTuju: 70, otomatis: true }
  const tan = Math.tan(kamera.fov * Math.PI / 360)
  function muat() {
    const lebar = kanvas.clientWidth || 1, tinggi = kanvas.clientHeight || 1
    kam.jarakTuju = Math.max((COLS + 4) / (2 * tan * (lebar / tinggi)), (ROWS + 10) * Math.sin(kam.pitch) / (2 * tan))
  }
  function ukur() {
    const lebar = kanvas.clientWidth || 1, tinggi = kanvas.clientHeight || 1
    renderer.setSize(lebar, tinggi, false)
    kamera.aspect = lebar / tinggi
    kamera.updateProjectionMatrix()
    if (kam.otomatis) muat()      // selama belum di-zoom sendiri, seluruh kantor selalu pas di layar
  }
  function setel() { kam.tx = COLS / 2; kam.tz = ROWS / 2 + 1; kam.yawTuju = 0; kam.otomatis = true; muat() }
  ukur(); setel(); kam.jarak = kam.jarakTuju

  let seret = null, digeser = 0
  kanvas.addEventListener('pointerdown', e => { seret = { x: e.clientX, y: e.clientY, putar: e.button === 2 || e.shiftKey }; digeser = 0; kanvas.setPointerCapture(e.pointerId) })
  kanvas.addEventListener('pointermove', e => {
    if (!seret) return
    const dx = e.clientX - seret.x, dy = e.clientY - seret.y
    seret.x = e.clientX; seret.y = e.clientY; digeser += Math.abs(dx) + Math.abs(dy)
    if (seret.putar) { kam.yawTuju = Math.max(-1.2, Math.min(1.2, kam.yawTuju - dx * 0.006)); return }
    const skala = 2 * kam.jarak * tan / kanvas.clientHeight, s = Math.sin(kam.yaw), c = Math.cos(kam.yaw)
    const kanan = -dx * skala, maju = -dy * skala / Math.sin(kam.pitch)
    kam.tx = Math.max(0, Math.min(COLS, kam.tx + kanan * c + maju * s))
    kam.tz = Math.max(0, Math.min(ROWS, kam.tz - kanan * s + maju * c))
  })
  kanvas.addEventListener('pointerup', e => { const klik = seret && digeser < 6; seret = null; if (klik && dunia.padaKlik) dunia.padaKlik(e.clientX, e.clientY) })
  kanvas.addEventListener('contextmenu', e => e.preventDefault())
  kanvas.addEventListener('wheel', e => { e.preventDefault(); kam.otomatis = false; kam.jarakTuju = Math.max(9, Math.min(130, kam.jarakTuju * Math.exp(e.deltaY * 0.0012))) }, { passive: false })
  kanvas.addEventListener('dblclick', setel)
  window.addEventListener('resize', ukur)

  const v = new T.Vector3()
  const dunia = {
    peta, scene, kamera, renderer, kam, padaKlik: null,
    putar(derajat) { kam.yawTuju = Math.max(-1.2, Math.min(1.2, kam.yawTuju + derajat * Math.PI / 180)) },
    zoom(faktor) { kam.otomatis = false; kam.jarakTuju = Math.max(9, Math.min(130, kam.jarakTuju * faktor)) },
    setel,
    /** Arahkan kamera ke satu titik (dipakai saat karyawan dipilih). */
    sorot(x, z) { kam.tx = x; kam.tz = z; kam.otomatis = false; kam.jarakTuju = Math.min(kam.jarakTuju, 26) },
    aturLayar(meja, nyala) { const m = layar.get(meja); if (m) m.material.color.set(nyala ? W.layar : '#27221f') },
    /** Titik dunia -> piksel CSS di kanvas (null kalau di belakang kamera). */
    proyeksi(x, y, z) {
      v.set(x, y, z).project(kamera)
      return v.z > 1 ? null : { x: (v.x + 1) / 2 * kanvas.clientWidth, y: (1 - v.y) / 2 * kanvas.clientHeight }
    },
    bingkai(dt, t) {
      aturWaktu()
      const h = 1 - Math.exp(-dt * 9)
      kam.yaw += (kam.yawTuju - kam.yaw) * h; kam.jarak += (kam.jarakTuju - kam.jarak) * h
      const cp = Math.cos(kam.pitch)
      kamera.position.set(kam.tx + Math.sin(kam.yaw) * cp * kam.jarak, Math.sin(kam.pitch) * kam.jarak, kam.tz + Math.cos(kam.yaw) * cp * kam.jarak)
      kamera.lookAt(kam.tx, 0.4, kam.tz)
      texAir.offset.set(t * 0.012, Math.sin(t * 0.3) * 0.03)
      for (const s of uap) {
        const u = (t * 0.12 + s.userData.fase) % 1
        s.position.set(s.userData.x + Math.sin(u * 6 + s.userData.fase * 9) * 0.3, 0.3 + u * 2.2, s.userData.z)
        s.scale.setScalar(0.8 + u * 1.6); s.material.opacity = 0.22 * Math.sin(u * Math.PI)
      }
      renderer.render(scene, kamera)
    },
  }
  return dunia
}
