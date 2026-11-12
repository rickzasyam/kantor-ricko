// Tampilan 2.5D Kantor Ricko dengan Three.js (disuntikkan patch-pixel-agents.mjs ke bundel tampilan
// pixel-agents 1.4.1). Hanya LANGKAH MENGGAMBAR yang diganti: logika kantor (kursi, jalan, rapat,
// aktivitas, izin) tetap milik pixel-agents + patch lain, jadi perilakunya sama di 2D dan 3D.
//
// Gaya "diorama kertas": lantai dan dinding benar-benar 3D, furnitur dan karakter tetap gambar
// piksel yang berdiri tegak menghadap kamera. Gambar piksel kantor ini bergaya miring (tampak atas
// + tampak depan sekaligus); supaya pas di dunia 3D kameranya menunduk 45 derajat dan gambar
// direntang vertikal akar-2 (lensa anamorfik). Dengan itu 1 tile lantai dan 1 tile tinggi sama
// besar di layar, persis seperti gambar 2D-nya, lalu perspektif dan putaran kamera memberi kedalaman.
//
// Mode edit denah (Layout) dan browser tanpa WebGL otomatis kembali ke tampilan 2D.
// Uji dari console: localStorage['kantor-3d'] = '0' (2D) / '1' (3D); window.__kantor3D.putar(15).
//
// Nama hasil minify yang dipakai (hanya berlaku untuk 1.4.1):
//   la = gambar lantai ke kanvas      Ei = sprite dinding per tile     ni = sprite -> kanvas
//   ua = gambar furnitur + karakter   va = gelembung izin/menunggu     xn = katalog furnitur

var __k3 = { T: null, memuat: false, gagal: false, tampil: false, yaw: 0, yawTuju: 0, w: 1, h: 1 }

function __kantor3DNyala() {
  try { return localStorage.getItem('kantor-3d') !== '0' } catch (e) { return true }
}

function __k3Sembunyi() {
  __k3.tampil = false
  if (__k3.kanvas) __k3.kanvas.style.display = 'none'
}

function __k3Tekstur(kanvas, halus) {
  var T = __k3.T, t = new T.CanvasTexture(kanvas)
  t.colorSpace = T.SRGBColorSpace
  t.magFilter = T.NearestFilter
  t.minFilter = halus ? T.LinearMipmapLinearFilter : T.NearestFilter
  t.generateMipmaps = !!halus
  return t
}

function __k3Kanvas(w, h) {
  var c = document.createElement('canvas')
  c.width = w; c.height = h
  return c
}

function __k3Siapkan(kanvas2d) {
  var T = __k3.T
  var kv = document.createElement('canvas')
  kv.id = 'kantor-3d'
  // Di atas kanvas 2D (yang dikosongkan) tapi tidak menangkap mouse: klik, geser, dan zoom tetap
  // ditangani kanvas 2D milik pixel-agents.
  kv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none'
  kanvas2d.parentNode.insertBefore(kv, kanvas2d.nextSibling)
  __k3.kanvas = kv
  __k3.r = new T.WebGLRenderer({ canvas: kv, antialias: false, alpha: true })
  __k3.r.setClearColor(0x000000, 0)
  __k3.scene = new T.Scene()
  __k3.cam = new T.PerspectiveCamera(30, 1, 1, 1000)
  __k3.v = new T.Vector3()
  __k3.v2 = new T.Vector3()

  // Kartu tegak: titik asal di tengah-bawah. Kartu datar: titik asal di pojok kiri-atas (utara-barat).
  __k3.geoTegak = new T.PlaneGeometry(1, 1).translate(0, 0.5, 0)
  __k3.geoDatar = new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0.5, 0, 0.5)

  __k3.denah = new T.Group(); __k3.scene.add(__k3.denah)
  __k3.furnitur = []
  __k3.tokoh = new Map()
  __k3.tekSprite = new WeakMap()
}

/** Bahan kartu gambar piksel (transparan di luar gambar, tetap menulis kedalaman). */
function __k3Bahan(tex, datar) {
  var T = __k3.T
  return new T.MeshBasicMaterial({
    map: tex, transparent: true, alphaTest: 0.01, side: T.DoubleSide,
    depthWrite: !datar,
  })
}

// ------------------------------------------------------------------- lantai & dinding

function __k3BangunDenah(p) {
  var T = __k3.T, tm = p.tileMap, rows = tm.length, cols = rows ? tm[0].length : 0
  var g = __k3.denah
  while (g.children.length) {
    var m = g.children.pop()
    if (m.material.map) m.material.map.dispose()
    m.material.dispose()
    if (m.geometry !== __k3.geoDatar) m.geometry.dispose()
  }

  // Lantai: digambar fungsi lantai bawaan ke satu kanvas besar, ditempel sebagai satu bidang.
  var S = 2, kl = __k3Kanvas(cols * 16 * S, rows * 16 * S), cl = kl.getContext('2d')
  cl.imageSmoothingEnabled = false
  la(cl, tm, 0, 0, S, p.tileColors, p.cols)
  var lantai = new T.Mesh(__k3.geoDatar, new T.MeshBasicMaterial({ map: __k3Tekstur(kl, true), transparent: true, depthWrite: false }))
  lantai.material.map.anisotropy = 4
  lantai.scale.set(cols, 1, rows)
  lantai.renderOrder = 0
  g.add(lantai)

  // Dinding: satu kotak per tile dinding, semuanya digabung jadi satu jaring (1 draw call).
  // Gambar tiap potongan dinding (16x32) ditaruh di atlas: 8 px teratas = puncak dinding, 24 px
  // di bawahnya = muka dinding. Jadi dinding setebal 1/2 tile dan setinggi 1,5 tile menghasilkan
  // gambar yang sama dengan versi 2D bila dilihat dari depan.
  var sprite = Ei(tm, p.tileColors, p.cols), petak = {}
  sprite.forEach(function (s) { petak[(s.x / 16) + ',' + (s.zY / 16 - 1)] = s })
  var AW = cols * 16, AH = rows * 32, ka = __k3Kanvas(AW, AH), ca = ka.getContext('2d')
  var pos = [], uv = [], warna = [], idx = []
  var TINGGI = 1.5, TEBAL = 0.5
  function dinding(c, r) { return r >= 0 && r < rows && c >= 0 && c < cols && tm[r][c] === L.WALL }
  function segi(a, b, c2, d, u0, v0, u1, v1, k) {   // a,b,c2,d searah jarum jam mulai kiri-atas
    var n = pos.length / 3
    ;[a, b, c2, d].forEach(function (t) { pos.push(t[0], t[1], t[2]); warna.push(k, k, k) })
    uv.push(u0, v0, u1, v0, u1, v1, u0, v1)
    idx.push(n, n + 3, n + 1, n + 1, n + 3, n + 2)
  }
  for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
    if (tm[r][c] !== L.WALL) continue
    var s = petak[c + ',' + r]
    if (s) ca.drawImage(ni(s.sprite, 1), 0, 0, 16, 32, c * 16, r * 32, 16, 32)
    else { ca.fillStyle = '#cdb99a'; ca.fillRect(c * 16, r * 32, 16, 32) }
    var u0 = c * 16 / AW, u1 = (c + 1) * 16 / AW
    var V = function (y) { return 1 - (r * 32 + y) / AH }
    var z0 = dinding(c, r - 1) ? r : r + 1 - TEBAL, z1 = r + 1, x0 = c, x1 = c + 1, y = TINGGI
    var adaMuka = !dinding(c, r + 1)
    // puncak
    if (adaMuka && z1 - z0 <= TEBAL) segi([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], u0, V(0), u1, V(8), 1)
    else segi([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], u0, V(17), u1, V(31), 1)
    // muka (selatan)
    if (adaMuka) segi([x0, y, z1], [x1, y, z1], [x1, 0, z1], [x0, 0, z1], u0, V(8), u1, V(32), 1)
    // sisi barat/timur/utara: satu warna (diambil dari tengah potongan), sedikit digelapkan
    var um = (c * 16 + 8.5) / AW, vm = V(adaMuka ? 20.5 : 24.5)
    if (!dinding(c - 1, r)) segi([x0, y, z0], [x0, y, z1], [x0, 0, z1], [x0, 0, z0], um, vm, um, vm, 0.86)
    if (!dinding(c + 1, r)) segi([x1, y, z1], [x1, y, z0], [x1, 0, z0], [x1, 0, z1], um, vm, um, vm, 0.8)
    if (!dinding(c, r - 1)) segi([x1, y, z0], [x0, y, z0], [x0, 0, z0], [x1, 0, z0], um, vm, um, vm, 0.72)
  }
  if (idx.length) {
    var geo = new T.BufferGeometry()
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3))
    geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2))
    geo.setAttribute('color', new T.Float32BufferAttribute(warna, 3))
    geo.setIndex(idx)
    g.add(new T.Mesh(geo, new T.MeshBasicMaterial({ map: __k3Tekstur(ka), vertexColors: true, alphaTest: 0.5, side: T.DoubleSide })))
  }
  __k3.cols = cols; __k3.rows = rows
}

// ------------------------------------------------------------------- cahaya (cahaya.js)

/** Peta cahaya 2D yang sama ditempel di lantai tanpa uji kedalaman, jadi mewarnai seluruh adegan. */
function __k3Cahaya(os) {
  var T = __k3.T, mati = typeof window !== 'undefined' && window.__kantorCahaya === false
  var peta = !mati && os && os.layout && os.layout.tiles ? __kantorPetaCahaya(os.layout, __kantorNamaWaktu()) : null
  if (peta === __k3.peta) return
  __k3.peta = peta
  ;(__k3.lapisCahaya || []).forEach(function (m) { __k3.scene.remove(m); m.material.map.dispose(); m.material.dispose() })
  __k3.lapisCahaya = []
  if (!peta) return
  function lapis(sumber, dasar, urutan, atur) {
    // Bagian transparan diberi warna netral (putih untuk multiply, hitam untuk screen).
    var k = __k3Kanvas(sumber.width, sumber.height), c = k.getContext('2d')
    c.fillStyle = dasar; c.fillRect(0, 0, k.width, k.height); c.drawImage(sumber, 0, 0)
    var tex = __k3Tekstur(k); tex.magFilter = T.LinearFilter; tex.minFilter = T.LinearFilter
    var bahan = new T.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false })
    // alpha kanvas dibiarkan apa adanya supaya ruang kosong di luar kantor tetap tembus pandang
    bahan.blending = T.CustomBlending; bahan.blendSrcAlpha = T.ZeroFactor; bahan.blendDstAlpha = T.OneFactor
    atur(bahan)
    var m = new T.Mesh(__k3.geoDatar, bahan)
    m.scale.set(os.layout.cols, 1, os.layout.rows)
    m.renderOrder = urutan
    __k3.scene.add(m)
    __k3.lapisCahaya.push(m)
  }
  lapis(peta.redup, '#fff', 10, function (b) {
    b.blendSrc = T.DstColorFactor; b.blendDst = T.ZeroFactor
  })
  lapis(peta.terang, '#000', 11, function (b) {
    b.blendSrc = T.OneMinusDstColorFactor; b.blendDst = T.OneFactor
  })
}

// ------------------------------------------------------------------- furnitur

function __k3TekSprite(sprite) {
  var t = __k3.tekSprite.get(sprite)
  if (!t) { t = __k3Tekstur(ni(sprite, 1)); __k3.tekSprite.set(sprite, t) }
  return t
}

function __k3Furnitur(daftar, os) {
  var T = __k3.T, kolam = __k3.furnitur
  var lay = os && os.layout && os.layout.furniture
  var cocok = lay && lay.length === daftar.length   // instance ke-i = furnitur denah ke-i
  for (var i = 0; i < daftar.length; i++) {
    var f = daftar[i], H = f.sprite.length, W = f.sprite[0].length
    var kat = cocok ? xn(String(lay[i].type).replace(/:left$/, '')) : null
    // jenis: 'dinding' menempel di dinding, 'datar' rebah di lantai (kolam, meja, futon: gambar yang
    // tidak lebih tinggi dari tapaknya dan dalamnya >= 2 tile), sisanya 'tegak' menghadap kamera.
    var jenis = kat && kat.canPlaceOnWalls ? 'dinding'
      : kat && kat.category !== 'chairs' && !kat.canPlaceOnSurfaces && (kat.footprintH || 1) >= 2 && H <= (kat.footprintH || 1) * 16 ? 'datar' : 'tegak'
    var e = kolam[i]
    if (!e) { e = kolam[i] = { mesh: new T.Mesh(__k3.geoTegak, __k3Bahan(null)), jenis: null }; __k3.scene.add(e.mesh) }
    var m = e.mesh
    if (e.jenis !== jenis) {
      e.jenis = jenis
      m.geometry = jenis === 'datar' ? __k3.geoDatar : __k3.geoTegak
      m.material.depthWrite = jenis !== 'datar'
      m.renderOrder = jenis === 'datar' ? 1 + i * 1e-4 : 2
    }
    var tex = __k3TekSprite(f.sprite)
    if (m.material.map !== tex) { if (!m.material.map) m.material.needsUpdate = true; m.material.map = tex }
    m.visible = true
    var cermin = f.mirrored ? -1 : 1, geser = i * 1e-4   // geser kecil: urutan daftar memutus seri kedalaman
    if (jenis === 'datar') {
      m.position.set((f.x + (f.mirrored ? W : 0)) / 16, 0.01, f.y / 16)
      m.scale.set(cermin * W / 16, 1, H / 16)
      m.rotation.y = 0
    } else {
      // Kedalaman kartu = zY (urutan gambar versi 2D); alasnya dinaik/turunkan supaya gambar jatuh
      // di tempat yang sama dengan versi 2D.
      m.position.set((f.x + W / 2) / 16, (f.zY - (f.y + H)) / 16, f.zY / 16 + geser + (jenis === 'dinding' ? 0.02 : 0))
      m.scale.set(cermin * W / 16, H / 16, 1)
      m.rotation.y = jenis === 'dinding' ? 0 : __k3.yaw
    }
  }
  for (var j = daftar.length; j < kolam.length; j++) kolam[j].mesh.visible = false
}

// ------------------------------------------------------------------- karakter & hewan

// Tiap karakter digambar fungsi 2D bawaan (termasuk pose aktivitas, garis pilih, efek muncul, dan
// gelembung) ke kanvas kecilnya sendiri, lalu kanvas itu jadi kartu tegak di dunia 3D.
var __K3_TOKOH = { Z: 2, W: 80, H: 96, KX: 40, KY: 72 }     // px dunia; (KX, KY) = letak kaki
var __K3_HEWAN = { Z: 2, W: 48, H: 48, KX: 24, KY: 40 }

function __k3Kartu(peta, kunci, U) {
  var e = peta.get(kunci)
  if (e) return e
  var k = __k3Kanvas(U.W * U.Z, U.H * U.Z), ctx = k.getContext('2d')
  ctx.imageSmoothingEnabled = false
  var tex = __k3Tekstur(k)
  var mesh = new __k3.T.Mesh(__k3.geoTegak, __k3Bahan(tex))
  mesh.renderOrder = 2
  mesh.scale.set(U.W / 16, U.H / 16, 1)
  __k3.scene.add(mesh)
  e = { ctx: ctx, tex: tex, mesh: mesh }
  peta.set(kunci, e)
  return e
}

function __k3Tokoh(p) {
  var ada = new Set()
  function pasang(kunci, U, x, y, gambar) {
    ada.add(kunci)
    var e = __k3Kartu(__k3.tokoh, kunci, U)
    e.ctx.clearRect(0, 0, U.W * U.Z, U.H * U.Z)
    gambar(e.ctx, (U.KX - x) * U.Z, (U.KY - y) * U.Z, U.Z)
    e.tex.needsUpdate = true
    var zY = y + 8.5
    e.mesh.position.set(x / 16, (zY - (y + U.H - U.KY)) / 16, zY / 16)
    e.mesh.rotation.y = __k3.yaw
  }
  var pilih = p.pilih ? p.pilih.selectedAgentId : null, sorot = p.pilih ? p.pilih.hoveredAgentId : null
  p.karakter.forEach(function (ch) {
    pasang('k' + ch.id, __K3_TOKOH, ch.x, ch.y, function (ctx, ox, oy, Z) {
      ua(ctx, [], [ch], ox, oy, Z, pilih, sorot, [])
      va(ctx, [ch], ox, oy, Z)
    })
  })
  ;(p.pets || []).forEach(function (h, i) {
    pasang('h' + (h.id || i), __K3_HEWAN, h.x, h.y, function (ctx, ox, oy, Z) { ua(ctx, [], [], ox, oy, Z, null, null, [h]) })
  })
  __k3.tokoh.forEach(function (e, kunci) {
    if (ada.has(kunci)) return
    __k3.scene.remove(e.mesh); e.tex.dispose(); e.mesh.material.dispose(); __k3.tokoh.delete(kunci)
  })
}

// ------------------------------------------------------------------- kamera

// Kamera mengikuti zoom & geseran milik pixel-agents: tile yang ada di tengah layar versi 2D juga
// jadi titik pandang 3D, dan 1 tile di titik itu selebar 16 x zoom piksel.
function __k3Kamera(p) {
  var cam = __k3.cam
  __k3.yaw += (__k3.yawTuju - __k3.yaw) * 0.18
  if (Math.abs(__k3.yawTuju - __k3.yaw) < 1e-4) __k3.yaw = __k3.yawTuju
  var cx = (p.w / 2 - p.ox) / p.zoom / 16, cz = (p.h / 2 - p.oy) / p.zoom / 16
  var mx = __k3.cols / 2, mz = __k3.rows / 2, vx = cx - mx, vz = cz - mz
  var s = Math.sin(__k3.yaw), c = Math.cos(__k3.yaw)
  // Geseran diputar ikut kamera supaya "geser ke kanan" tetap ke kanan di layar.
  var tx = mx + vx * c + vz * s, tz = mz - vx * s + vz * c
  var D = p.h / (2 * Math.tan(cam.fov * Math.PI / 360) * 16 * p.zoom), k = Math.SQRT1_2
  cam.aspect = p.w / p.h
  cam.near = Math.max(0.5, D / 20)
  cam.far = D * 4 + 200
  cam.position.set(tx + s * k * D, k * D, tz + c * k * D)
  cam.lookAt(tx, 0, tz)
  cam.updateProjectionMatrix()
  cam.projectionMatrix.elements[5] *= Math.SQRT2            // lensa anamorfik (lihat kepala file)
  cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert()
  cam.updateMatrixWorld()
}

/** Titik dunia (px, dengan tinggi px di atas lantai) -> px CSS di layar. null kalau 3D tidak tampil. */
function __kantor3DLayar(xpx, ypx, tinggiPx) {
  if (!__k3.tampil) return null
  var v = __k3.v.set(xpx / 16, (tinggiPx || 0) / 16, ypx / 16).project(__k3.cam)
  var dpr = window.devicePixelRatio || 1
  return { x: (v.x + 1) / 2 * __k3.w / dpr, y: (1 - v.y) / 2 * __k3.h / dpr }
}

/** Posisi mouse (px perangkat di kanvas) -> titik di lantai (px dunia). null kalau 3D tidak tampil. */
function __kantor3DDunia(sx, sy) {
  if (!__k3.tampil) return null
  var nx = sx / __k3.w * 2 - 1, ny = 1 - sy / __k3.h * 2
  var a = __k3.v.set(nx, ny, -1).unproject(__k3.cam), b = __k3.v2.set(nx, ny, 1).unproject(__k3.cam)
  if (a.y === b.y) return null
  var t = a.y / (a.y - b.y)
  return { x: (a.x + (b.x - a.x) * t) * 16, y: (a.z + (b.z - a.z) * t) * 16 }
}

// ------------------------------------------------------------------- pintu masuk

/** Dipanggil renderer 2D tiap frame (setelah kanvas dikosongkan). true = sudah digambar di 3D. */
function __kantor3DGambar(p) {
  // Posisi 2D frame ini, dipakai lapisan DOM (gelembung obrolan) saat 3D tidak tampil.
  if (typeof window !== 'undefined') window.__kantor2D = p
  if (__k3.gagal || p.editor || !__kantor3DNyala() || !p.tileMap || !p.tileMap.length) { __k3Sembunyi(); return false }
  if (!__k3.T) {
    if (!__k3.memuat) {
      __k3.memuat = true
      import('./three.module.js').then(function (T) { __k3.T = T }).catch(function (e) {
        __k3.gagal = true
        console.error('[Kantor 3D] Three.js gagal dimuat, kembali ke 2D:', e)
      })
    }
    return false
  }
  try {
    if (!__k3.r) __k3Siapkan(p.ctx.canvas)
    // React bisa membuat ulang wadah kanvas (mis. ganti mode); kanvas 3D ikut dipindahkan.
    if (!__k3.kanvas.isConnected) p.ctx.canvas.parentNode.insertBefore(__k3.kanvas, p.ctx.canvas.nextSibling)
    if (__k3.w !== p.w || __k3.h !== p.h) { __k3.w = p.w; __k3.h = p.h; __k3.r.setSize(p.w, p.h, false) }
    if (__k3.tm !== p.tileMap || __k3.tc !== p.tileColors) { __k3.tm = p.tileMap; __k3.tc = p.tileColors; __k3BangunDenah(p) }
    var os = window.__kantorOffice && window.__kantorOffice.current
    __k3Kamera(p)
    __k3Furnitur(p.furnitur, os)
    __k3Tokoh(p)
    __k3Cahaya(os)
    __k3.kanvas.style.display = 'block'
    __k3.tampil = true
    __k3.r.render(__k3.scene, __k3.cam)
  } catch (e) {
    __k3.gagal = true
    console.error('[Kantor 3D] gagal menggambar, kembali ke 2D:', e)
    __k3Sembunyi()
    return false
  }
  return true
}

if (typeof window !== 'undefined') {
  window.__kantor3D = {
    get tampil() { return __k3.tampil },
    get nyala() { return __kantor3DNyala() },
    /** Ganti mode: true = 3D, false = 2D. */
    atur: function (nyala) { try { localStorage.setItem('kantor-3d', nyala ? '1' : '0') } catch (e) {} },
    /** Putar kamera (derajat, + = searah jarum jam), dibatasi supaya gambar tetap enak dilihat. */
    putar: function (derajat) {
      __k3.yawTuju = Math.max(-0.7, Math.min(0.7, __k3.yawTuju + derajat * Math.PI / 180))
    },
    lurus: function () { __k3.yawTuju = 0 },
    internal: __k3,
  }
}
