// Cahaya hangat Kantor Ricko (disuntikkan patch-pixel-agents.mjs ke bundel tampilan pixel-agents
// 1.4.1). Setelah lantai, dinding, furnitur, dan karakter digambar, dua peta cahaya ditumpuk:
//   - "redup" (multiply): warna sekitar hangat, bayangan lembut di kaki dinding, sinar jendela,
//     teduh di bawah pohon, vinyet tipis.
//   - "terang" (screen): pendar lampu kertas, lentera, lampu gantung, dan sinar matahari sore.
// Peta dibuat sekali per denah & waktu (pagi/siang/sore/malam mengikuti jam PC) lalu hanya
// ditempel tiap frame, jadi ringan. Browser yang tidak mendukung mode campur warna dilewati.
//
// Uji dari console: window.__kantorWaktu = 'malam' (atau 'pagi' | 'siang' | 'sore'),
// matikan: window.__kantorCahaya = false.

var __KANTOR_WAKTU = {
  pagi: { dalam: [247, 241, 232], luar: [252, 249, 241], sinar: 0.34, warnaSinar: [255, 244, 222], lampu: 0.22, vinyet: 0.1 },
  siang: { dalam: [252, 247, 238], luar: [255, 253, 246], sinar: 0.3, warnaSinar: [255, 240, 212], lampu: 0.16, vinyet: 0.06 },
  sore: { dalam: [243, 228, 207], luar: [251, 234, 207], sinar: 0.46, warnaSinar: [255, 210, 150], lampu: 0.38, vinyet: 0.14 },
  malam: { dalam: [176, 164, 168], luar: [134, 138, 164], sinar: 0, warnaSinar: [0, 0, 0], lampu: 1, vinyet: 0.22 },
}

// Sumber cahaya per jenis furnitur: [dx, dy (px dari pojok kiri-atas sprite), jari-jari (px), kekuatan].
var __KANTOR_LAMPU = {
  AKARI: [[8, 12, 36, 0.6]],
  TORO: [[8, 11, 32, 0.7]],
  CHOCHIN: [[8, 17, 30, 0.6]],
  LAMPU_GANTUNG: [[8, 10, 30, 0.55]],
  LAMPION_UNTAI: [[6, 14, 16, 0.4], [17, 15, 16, 0.4], [30, 15, 16, 0.4], [41, 14, 16, 0.4]],
  BUFET: [[53, 5, 26, 0.55]],
  EXEC_DESK: [[51, 8, 18, 0.35]],
  RAK_TEH: [[20, 10, 22, 0.45], [44, 10, 22, 0.45]],
  AQUARIUM: [[16, 10, 18, 0.25]],
}
// Lebar bukaan jendela di sprite (px): [kiri, kanan].
var __KANTOR_JENDELA = { JENDELA_SHOJI: [4, 28], MARUMADO: [6, 26] }
// Pohon & semak yang meneduhi tanah: [dx, dy, rx, ry].
var __KANTOR_TEDUH = { MOMIJI: [24, 58, 18, 6], PINUS: [24, 58, 16, 5], RUMPUN_BAMBU: [16, 60, 12, 4], WAGASA: [16, 44, 12, 4] }

function __kantorNamaWaktu() {
  var paksa = typeof window !== 'undefined' && window.__kantorWaktu
  if (paksa && __KANTOR_WAKTU[paksa]) return paksa
  var d = new Date(), jam = d.getHours() + d.getMinutes() / 60
  return jam >= 18.5 || jam < 5.5 ? 'malam' : jam < 9.5 ? 'pagi' : jam < 15.5 ? 'siang' : 'sore'
}

function __kantorRgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')' }

/** Bangun peta cahaya untuk satu denah & satu waktu. Hasil di-cache. */
function __kantorPetaCahaya(L, nama) {
  var cache = __kantorPetaCahaya.cache
  if (cache && cache.layout === L && cache.nama === nama) return cache
  if (typeof document === 'undefined') return null
  var w = __KANTOR_WAKTU[nama], S = 0.5                     // 1 piksel peta = 2 piksel dunia
  var W = L.cols * 16, H = L.rows * 16
  function kanvas() { var c = document.createElement('canvas'); c.width = Math.ceil(W * S); c.height = Math.ceil(H * S); return c }
  var redup = kanvas(), terang = kanvas(), topeng = kanvas()
  var r = redup.getContext('2d'), t = terang.getContext('2d'), m = topeng.getContext('2d')
  r.scale(S, S); t.scale(S, S); m.scale(S, S)
  var WALL = 0, VOID = 255
  function tile(c, rr) { return c < 0 || rr < 0 || c >= L.cols || rr >= L.rows ? VOID : L.tiles[rr * L.cols + c] }
  function area(c, rr) { return L.areaTiles ? L.areaTiles[rr * L.cols + c] : null }
  var luar = function (c, rr) { return area(c, rr) === 'Onsen' }

  // 1. topeng: semua tile yang digambar (+ baris kosong tepat di atas dinding, tempat puncak dinding)
  m.fillStyle = '#000'
  for (var y = 0; y < L.rows; y++) for (var x = 0; x < L.cols; x++) {
    var tv = tile(x, y)
    if (tv !== VOID || tile(x, y + 1) === WALL) m.fillRect(x * 16, y * 16, 16, 16)
  }

  // 2. warna sekitar per tile
  for (y = 0; y < L.rows; y++) for (x = 0; x < L.cols; x++) {
    var lu = luar(x, y) || (tile(x, y) === WALL && (luar(x, y + 1) || luar(x, y + 2)))
    r.fillStyle = __kantorRgba(lu ? w.luar : w.dalam, 1)
    r.fillRect(x * 16, y * 16, 16, 16)
  }
  // 3. bayangan lembut di kaki dinding (atas, kiri, kanan)
  for (y = 1; y < L.rows; y++) for (x = 0; x < L.cols; x++) {
    var tv2 = tile(x, y)
    if (tv2 === WALL || tv2 === VOID) continue
    var g
    if (tile(x, y - 1) === WALL) {
      g = r.createLinearGradient(0, y * 16, 0, y * 16 + 14)
      g.addColorStop(0, 'rgba(84,60,36,0.26)'); g.addColorStop(1, 'rgba(84,60,36,0)')
      r.fillStyle = g; r.fillRect(x * 16, y * 16, 16, 14)
    }
    if (tile(x - 1, y) === WALL) {
      g = r.createLinearGradient(x * 16, 0, x * 16 + 7, 0)
      g.addColorStop(0, 'rgba(84,60,36,0.14)'); g.addColorStop(1, 'rgba(84,60,36,0)')
      r.fillStyle = g; r.fillRect(x * 16, y * 16, 7, 16)
    }
    if (tile(x + 1, y) === WALL) {
      g = r.createLinearGradient(x * 16 + 16, 0, x * 16 + 9, 0)
      g.addColorStop(0, 'rgba(84,60,36,0.1)'); g.addColorStop(1, 'rgba(84,60,36,0)')
      r.fillStyle = g; r.fillRect(x * 16 + 9, y * 16, 7, 16)
    }
  }

  function bundar(ctx, cx, cy, rad, warna, a) {
    var gg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad)
    gg.addColorStop(0, __kantorRgba(warna, a)); gg.addColorStop(0.45, __kantorRgba(warna, a * 0.45)); gg.addColorStop(1, __kantorRgba(warna, 0))
    ctx.fillStyle = gg
    ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2)
  }

  // 4. furnitur: jendela, lampu, teduh pohon
  var hangat = nama === 'malam' ? [255, 196, 120] : [255, 214, 160]
  L.furniture.forEach(function (f) {
    var tipe = String(f.type).replace(/:left$/, '')
    var X = f.col * 16, Y = f.row * 16
    var jendela = __KANTOR_JENDELA[tipe]
    if (jendela) {
      var lantaiY = (f.row + 2) * 16                         // baris lantai pertama di bawah dinding
      var bawahLuar = luar(f.col, f.row + 2)
      var x0 = X + jendela[0], x1 = X + jendela[1]
      if (!bawahLuar && w.sinar > 0) {
        // sinar matahari miring dari kiri-atas jatuh ke lantai
        var panjang = 60, geser = 22
        r.save(); r.globalCompositeOperation = 'lighter'
        var gs = r.createLinearGradient(0, lantaiY, 0, lantaiY + panjang)
        gs.addColorStop(0, 'rgba(255,250,240,' + (w.sinar * 0.55) + ')'); gs.addColorStop(1, 'rgba(255,250,240,0)')
        r.fillStyle = gs
        r.beginPath(); r.moveTo(x0, lantaiY); r.lineTo(x1, lantaiY); r.lineTo(x1 + geser, lantaiY + panjang); r.lineTo(x0 + geser, lantaiY + panjang); r.closePath(); r.fill()
        r.restore()
        var gt = t.createLinearGradient(0, lantaiY, 0, lantaiY + panjang)
        gt.addColorStop(0, __kantorRgba(w.warnaSinar, w.sinar * 0.5)); gt.addColorStop(1, __kantorRgba(w.warnaSinar, 0))
        t.fillStyle = gt
        t.beginPath(); t.moveTo(x0, lantaiY); t.lineTo(x1, lantaiY); t.lineTo(x1 + geser, lantaiY + panjang); t.lineTo(x0 + geser, lantaiY + panjang); t.closePath(); t.fill()
        // kertas jendela sendiri bercahaya
        bundar(t, (x0 + x1) / 2, Y + 18, 18, w.warnaSinar, w.sinar * 0.6)
      }
      if (bawahLuar && nama === 'malam') {
        // jendela fasad menyala dari dalam, cahayanya tumpah ke engawa
        bundar(t, (x0 + x1) / 2, Y + 18, 26, hangat, 0.55)
        bundar(t, (x0 + x1) / 2, lantaiY + 10, 30, hangat, 0.3)
      }
      return
    }
    var lampu = __KANTOR_LAMPU[tipe]
    if (lampu && w.lampu > 0) lampu.forEach(function (l) { if (l[2]) bundar(t, X + l[0], Y + l[1], l[2], hangat, l[3] * w.lampu) })
    var teduh = __KANTOR_TEDUH[tipe]
    if (teduh) {
      r.save(); r.translate(X + teduh[0], Y + teduh[1]); r.scale(1, teduh[3] / teduh[2])
      var gd = r.createRadialGradient(0, 0, 0, 0, 0, teduh[2])
      gd.addColorStop(0, 'rgba(60,70,40,0.2)'); gd.addColorStop(1, 'rgba(60,70,40,0)')
      r.fillStyle = gd; r.fillRect(-teduh[2], -teduh[2], teduh[2] * 2, teduh[2] * 2)
      r.restore()
    }
  })

  // 5. vinyet tipis supaya pandangan terpusat
  var vg = r.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72)
  vg.addColorStop(0, 'rgba(60,40,24,0)'); vg.addColorStop(1, 'rgba(60,40,24,' + w.vinyet + ')')
  r.fillStyle = vg; r.fillRect(0, 0, W, H)

  // 6. potong dengan topeng supaya ruang kosong di luar kantor tetap kosong
  r.setTransform(1, 0, 0, 1, 0, 0); t.setTransform(1, 0, 0, 1, 0, 0)
  r.globalCompositeOperation = 'destination-in'; r.drawImage(topeng, 0, 0)
  t.globalCompositeOperation = 'destination-in'; t.drawImage(topeng, 0, 0)

  __kantorPetaCahaya.cache = { layout: L, nama: nama, redup: redup, terang: terang }
  return __kantorPetaCahaya.cache
}

/** Dipanggil renderer setelah semua furnitur & karakter digambar. */
function __kantorCahaya(ctx, ox, oy, zoom) {
  if (typeof window === 'undefined' || window.__kantorCahaya === false) return
  var os = window.__kantorOffice && window.__kantorOffice.current
  if (!os || !os.layout || !os.layout.tiles) return
  var peta = __kantorPetaCahaya(os.layout, __kantorNamaWaktu())
  if (!peta) return
  var W = os.layout.cols * 16 * zoom, H = os.layout.rows * 16 * zoom
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  if (ctx.globalCompositeOperation !== 'multiply') { ctx.restore(); return }
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(peta.redup, ox, oy, W, H)
  ctx.globalCompositeOperation = 'screen'
  ctx.drawImage(peta.terang, ox, oy, W, H)
  ctx.restore()
}
