// Aktivitas karyawan saat menganggur (disuntikkan patch-pixel-agents.mjs ke bundel tampilan
// pixel-agents 1.4.1, tepat sebelum kelas OfficeState). Karyawan yang tidak sedang bekerja sesekali
// pergi bikin kopi lalu meminumnya di meja, berenang, main PS5, biliar, arcade, foosball, lari di
// treadmill, angkat dumbbell, tinju samsak, atau rebahan di bean bag sambil main HP.
//
// Nama hasil minify yang dipakai (hanya berlaku untuk 1.4.1):
//   R  = state karakter (R.IDLE, R.WALK, R.TYPE)      z  = arah hadap (z.DOWN, z.UP, z.LEFT, z.RIGHT)
//   Ai = cari jalan (kolom, baris -> kolom, baris)    Oi = tile bisa diinjak?
//   Ii = tengah tile dalam piksel dunia               Vi = angka acak (min, max)
//   _i = sprite karakter per palette                  ni = sprite -> kanvas (dengan cache)
//   xn = data katalog furnitur (footprint)
//
// Alurnya: __kantorAktivitas() dipanggil tiap frame sebelum logika bawaan karakter (zi). Kalau
// mengembalikan true, logika bawaan dilewati dan aktivitas yang mengendalikan karakter. Berjalan
// tetap memakai logika bawaan (path + state WALK). __kantorGambar() menggambar pose & properti
// (cangkir, stik PS, stik biliar, ...) di renderer.

var __KANTOR_JENIS = [
  { jenis: 'kopi', tipe: /^(COFFEE_BAR|COFFEE_MACHINE)$/, bobot: 3, durasi: [4, 4] },
  { jenis: 'renang', tipe: /^SWIMMING_POOL$/, bobot: 3, durasi: [25, 45] },
  { jenis: 'ps5', tipe: /^GAMING_CHAIR$/, bobot: 2.5, durasi: [25, 50] },
  { jenis: 'biliar', tipe: /^BILLIARD_TABLE$/, bobot: 2, durasi: [20, 35] },
  { jenis: 'arcade', tipe: /^ARCADE_MACHINE$/, bobot: 1.5, durasi: [15, 30] },
  { jenis: 'foosball', tipe: /^FOOSBALL$/, bobot: 1.5, durasi: [20, 35] },
  { jenis: 'lari', tipe: /^TREADMILL$/, bobot: 2, durasi: [20, 35] },
  { jenis: 'angkat', tipe: /^DUMBBELL_RACK$/, bobot: 1.5, durasi: [15, 25] },
  { jenis: 'tinju', tipe: /^PUNCH_BAG$/, bobot: 1.5, durasi: [15, 25] },
  { jenis: 'santai', tipe: /^BEAN_BAG/, bobot: 2, durasi: [20, 40] },
]

function __kantorFootprint(type) {
  var k = xn(String(type).replace(/:left$/, ''))
  return k ? { w: k.footprintW || 1, h: k.footprintH || 1, bg: k.backgroundTiles || 0 } : null
}

/** Calon tempat aktivitas untuk satu furnitur: jalan = tile tujuan, pos = tile saat beraktivitas. */
function __kantorCalon(def, f, os) {
  var fp = __kantorFootprint(f.type)
  if (!fp) return []
  var c = f.col, r = f.row, w = fp.w, h = fp.h, hasil = []
  function tambah(jc, jr, dir, pc, pr, kunci) {
    hasil.push({ jalan: [jc, jr], pos: [pc === undefined ? jc : pc, pr === undefined ? jr : pr], dir: dir, kunci: kunci || jc + ',' + jr })
  }
  var x
  switch (def.jenis) {
    case 'kopi':
    case 'arcade':
      for (x = c; x < c + w; x++) tambah(x, r + h, z.UP)
      break
    case 'angkat':
      for (x = c; x < c + w; x++) tambah(x, r + h, z.DOWN)
      break
    case 'biliar':
      for (var y = r + 1; y < r + h; y++) { tambah(c - 1, y, z.RIGHT); tambah(c + w, y, z.LEFT) }
      for (x = c + 1; x < c + w - 1; x++) tambah(x, r + h, z.UP)
      break
    case 'foosball':
    case 'tinju':
      tambah(c - 1, r + h - 1, z.RIGHT); tambah(c + w, r + h - 1, z.LEFT)
      break
    case 'lari':
      tambah(c, r + h, z.UP, c, r + h - 1, 'f' + c + ',' + r)
      break
    case 'ps5':
    case 'santai': {
      var kursi = null
      os.seats.forEach(function (s) { if (s.seatCol === c && s.seatRow === r) kursi = s })
      if (kursi && kursi.assigned) return []
      var arah = def.jenis === 'santai' ? z.DOWN : kursi ? kursi.facingDir : z.UP
      ;[[c, r + 1], [c - 1, r], [c + 1, r], [c, r - 1]].forEach(function (t) { tambah(t[0], t[1], arah, c, r, 'f' + c + ',' + r) })
      hasil.forEach(function (h2) { h2.kursi = kursi })
      break
    }
    case 'renang':
      for (x = c; x < c + w; x++) { tambah(x, r - 1, z.DOWN, undefined, undefined, 'renang' + x); tambah(x, r + h, z.UP, undefined, undefined, 'renang' + x) }
      for (var y2 = r; y2 < r + h; y2++) { tambah(c - 1, y2, z.RIGHT, undefined, undefined, 'renangk' + y2); tambah(c + w, y2, z.LEFT, undefined, undefined, 'renangk' + y2) }
      break
  }
  return hasil
}

function __kantorCadangan(os) {
  if (!os.__kantorCadang) os.__kantorCadang = new Map()
  return os.__kantorCadang
}

function __kantorIkutRapat(ch) {
  var r = typeof window !== 'undefined' && window.__kantorRapatData
  if (!r || !r.aktif || !ch.folderName) return false
  return !Array.isArray(r.peserta) || r.peserta.map(function (x) { return String(x).toLowerCase() }).indexOf(String(ch.folderName).toLowerCase()) >= 0
}

function __kantorPilih(os, ch) {
  var cadang = __kantorCadangan(os)
  var jumlahRenang = 0
  cadang.forEach(function (v, k) { if (/^renang/.test(k)) jumlahRenang++ })
  var pilihan = []
  __KANTOR_JENIS.forEach(function (def) {
    if (def.jenis === 'renang' && jumlahRenang >= 3) return
    var calon = []
    os.layout.furniture.forEach(function (f) {
      if (!def.tipe.test(String(f.type).replace(/:left$/, ''))) return
      __kantorCalon(def, f, os).forEach(function (k) {
        if (cadang.has(k.kunci)) return
        var bisa = (k.jalan[0] === ch.tileCol && k.jalan[1] === ch.tileRow) || Oi(k.jalan[0], k.jalan[1], os.tileMap, os.blockedTiles)
        if (bisa) { k.f = f; calon.push(k) }
      })
    })
    if (calon.length) pilihan.push({ def: def, calon: calon })
  })
  // Acak berbobot; jenis yang barusan dilakukan dikurangi peluangnya supaya bervariasi.
  var total = 0
  pilihan.forEach(function (p) { p.b = p.def.bobot * (p.def.jenis === ch.__kantorTerakhir ? 0.2 : 1); total += p.b })
  pilihan = pilihan.filter(function (p) { return p.b > 0 })
  var acak = Math.random() * total
  for (var i = 0; i < pilihan.length; i++) {
    acak -= pilihan[i].b
    if (acak > 0) continue
    var daftar = pilihan[i].calon.sort(function () { return Math.random() - 0.5 })
    for (var j = 0; j < Math.min(daftar.length, 6); j++) {
      var k = daftar[j]
      var sudah = k.jalan[0] === ch.tileCol && k.jalan[1] === ch.tileRow
      var jalur = sudah ? [] : os.withOwnSeatUnblocked(ch, function () { return Ai(ch.tileCol, ch.tileRow, k.jalan[0], k.jalan[1], os.tileMap, os.blockedTiles) })
      if (sudah || jalur.length) return { def: pilihan[i].def, k: k, jalur: jalur }
    }
    return null
  }
  return null
}

function __kantorTitik(col, row) { return Ii(col, row) }

/** Kembalikan karakter ke tile logisnya dan lepaskan semua cadangan. */
function __kantorSelesai(os, ch, jedaMin, jedaMaks) {
  var a = ch.__akt
  if (a) {
    __kantorCadangan(os).delete(a.kunci)
    if (a.kursi && a.kursiDipakai) a.kursi.assigned = false
    if (a.jenis !== 'kopi' || a.fase !== 'minum') {
      var p = __kantorTitik(ch.tileCol, ch.tileRow)
      ch.x = p.x; ch.y = p.y
      if (ch.state !== R.WALK) { ch.state = R.IDLE; ch.wanderTimer = Vi(2, 6); ch.frame = 0; ch.frameTimer = 0 }
    } else if (ch.state === R.TYPE) {
      ch.seatTimer = Vi(10, 40)
    }
    ch.__kantorTerakhir = a.jenis
  }
  ch.__akt = null
  ch.__aktJeda = Vi(jedaMin, jedaMaks)
}

function __kantorJalan(ch, jalur) {
  ch.path = jalur; ch.moveProgress = 0; ch.state = R.WALK; ch.frame = 0; ch.frameTimer = 0
}

/** Dipanggil tiap frame per karakter. true = logika bawaan dilewati. */
function __kantorAktivitas(os, ch, dt) {
  if (ch.isSubagent || ch.matrixEffect) return false
  var a = ch.__akt
  if (a && (ch.isActive || __kantorIkutRapat(ch) || a.layout !== os.layout)) {
    __kantorSelesai(os, ch, 10, 30)
    return false
  }
  if (!a) {
    if (ch.isActive || __kantorIkutRapat(ch)) return false
    var santai = (ch.state === R.IDLE && !ch.path.length) || (ch.state === R.TYPE && ch.seatTimer > 0)
    if (!santai) return false
    if (ch.__aktJeda === undefined) ch.__aktJeda = Vi(6, 25)
    ch.__aktJeda -= dt
    if (ch.__aktJeda > 0) return false
    var pilih = Math.random() < 0.85 ? __kantorPilih(os, ch) : null
    if (!pilih) { ch.__aktJeda = Vi(15, 40); return false }
    var d = pilih.def
    a = ch.__akt = {
      jenis: d.jenis, fase: 'jalan', t: 0, anim: 0, layout: os.layout, kunci: pilih.k.kunci,
      jalan: pilih.k.jalan, pos: pilih.k.pos, dir: pilih.k.dir, f: pilih.k.f, kursi: pilih.k.kursi,
      durasi: Vi(d.durasi[0], d.durasi[1]),
    }
    __kantorCadangan(os).set(a.kunci, ch.id)
    if (pilih.jalur.length) { __kantorJalan(ch, pilih.jalur); return false }
  }

  a.anim += dt
  if (a.fase === 'jalan' || a.fase === 'bawa') {
    if (ch.state === R.WALK) return false
    if (a.fase === 'bawa') {
      // Sampai di kursinya sendiri: logika bawaan membuatnya duduk (TYPE). Lanjut minum.
      a.fase = 'minum'; a.t = 0; a.durasi = Vi(20, 35); a.berdiri = ch.state !== R.TYPE
      return true
    }
    if (ch.tileCol !== a.jalan[0] || ch.tileRow !== a.jalan[1]) { __kantorSelesai(os, ch, 5, 15); return false }
    a.fase = 'main'; a.t = 0
    if (a.kursi && !a.kursi.assigned) { a.kursi.assigned = true; a.kursiDipakai = true }
    ch.state = R.IDLE; ch.path = []; ch.dir = a.dir
    var p = __kantorTitik(a.pos[0], a.pos[1])
    ch.x = p.x; ch.y = p.y
    if (a.jenis === 'renang') __kantorMulaiRenang(a, ch)
  }

  a.t += dt
  ch.dir = a.dir
  if (a.fase === 'main') {
    if (a.jenis === 'renang') __kantorRenang(a, ch, dt)
    if (a.t < a.durasi) return true
    if (a.jenis === 'kopi') {
      // Kopi jadi: bawa ke meja sendiri.
      var kursi = ch.seatId && os.seats.get(ch.seatId)
      var jalur = kursi ? os.withOwnSeatUnblocked(ch, function () { return Ai(ch.tileCol, ch.tileRow, kursi.seatCol, kursi.seatRow, os.tileMap, os.blockedTiles) }) : []
      __kantorCadangan(os).delete(a.kunci)
      if (jalur.length) { a.fase = 'bawa'; ch.seatTimer = 0; __kantorJalan(ch, jalur); return false }
      a.fase = 'minum'; a.t = 0; a.durasi = Vi(15, 25); a.berdiri = true
      return true
    }
    __kantorSelesai(os, ch, 30, 80)
    return false
  }
  if (a.fase === 'minum') {
    if (a.t < a.durasi) return true
    __kantorSelesai(os, ch, 30, 80)
    return false
  }
  return false
}

// ----------------------------------------------------------------------- renang

function __kantorKolam(a) {
  var X = a.f.col * 16, Y = a.f.row * 16
  return { x0: X + 16, x1: X + 144, y0: Y + 26, y1: Y + 70, bawah: Y + 80 }
}
function __kantorMulaiRenang(a, ch) {
  var k = __kantorKolam(a)
  var p = __kantorTitik(a.jalan[0], a.jalan[1])
  a.sx = Math.max(k.x0, Math.min(k.x1, p.x))
  a.sy = k.y0 + Math.random() * (k.y1 - k.y0)
  a.arah = a.sx < (k.x0 + k.x1) / 2 ? 1 : -1
  a.dir = a.arah > 0 ? z.RIGHT : z.LEFT
  ch.x = a.sx; ch.y = a.sy
}
function __kantorRenang(a, ch, dt) {
  var k = __kantorKolam(a)
  a.sx += a.arah * 20 * dt
  if (a.sx > k.x1) { a.sx = k.x1; a.arah = -1 }
  if (a.sx < k.x0) { a.sx = k.x0; a.arah = 1 }
  a.dir = a.arah > 0 ? z.RIGHT : z.LEFT
  ch.x = a.sx; ch.y = a.sy + Math.sin(a.anim * 4) * 0.6
}

// ----------------------------------------------------------------------- gambar

/** Dipanggil renderer untuk tiap karakter. true = karakter sudah digambar di sini. */
function __kantorGambar(l, ch, a, r, i) {
  var akt = ch.__akt
  if (!akt || ch.matrixEffect) return false
  var S = _i(ch.palette, ch.hueShift)
  var zY = ch.y + 8 + 0.5
  function kotak(ctx, X, Y, w, h, c) {
    ctx.fillStyle = c
    ctx.fillRect(Math.round(r + Math.round(X) * a), Math.round(i + Math.round(Y) * a), w * a, h * a)
  }
  function sosok(spr, naik, potong) {
    var n = ni(spr, a)
    var dx = Math.round(r + ch.x * a - n.width / 2), dy = Math.round(i + (ch.y + naik) * a - n.height)
    return function (ctx) {
      if (potong) ctx.drawImage(n, 0, 0, n.width, potong * a, dx, dy, n.width, potong * a)
      else ctx.drawImage(n, dx, dy)
    }
  }
  var X0 = ch.x - 8, d = ch.dir, k2 = Math.floor(akt.anim / 0.3) % 2, k4 = Math.floor(akt.anim / 0.15) % 4
  function tangan(naik) {
    var Y0 = ch.y + naik - 32
    if (d === z.DOWN) return [X0 + 12, Y0 + 21]
    if (d === z.RIGHT) return [X0 + 8, Y0 + 21]
    if (d === z.LEFT) return [X0 + 5, Y0 + 21]
    return [X0 + 13, Y0 + 20]
  }
  function cangkir(ctx, x, y, uap) {
    kotak(ctx, x, y, 3, 3, '#ffffff'); kotak(ctx, x, y, 3, 1, '#6b4226'); kotak(ctx, x + 3, y + 1, 1, 1, '#ffffff')
    if (uap) { var u = Math.floor(akt.anim * 2) % 3; kotak(ctx, x + (u % 2), y - 2 - u, 1, 1, '#ffffffaa') }
  }

  // Sedang berjalan membawa kopi: gambar bawaan + cangkir di tangan.
  if (akt.fase === 'bawa' || akt.fase === 'jalan') {
    if (akt.fase === 'bawa') {
      var tb = tangan(0)
      l.push({ zY: zY + 0.01, draw: function (ctx) { cangkir(ctx, tb[0], tb[1], true) } })
    }
    return false
  }

  var gambar = [], tambahan = null
  switch (akt.jenis) {
    case 'kopi':
      if (akt.fase === 'main') {
        gambar.push(sosok(S.walk[d][1], 0))
        tambahan = function (ctx) {
          var u = Math.floor(akt.anim * 3) % 4
          kotak(ctx, ch.x - 1 + (u % 2), ch.y - 36 - u, 1, 1, '#ffffffcc'); kotak(ctx, ch.x + 1 - (u % 2), ch.y - 34 - u, 1, 1, '#ffffffaa')
        }
      } else if (akt.berdiri) {
        gambar.push(sosok(S.walk[d][1], 0))
        var tm = tangan(0)
        tambahan = function (ctx) { cangkir(ctx, tm[0], tm[1] - (akt.t % 5 < 1 ? 6 : 0), true) }
      } else {
        gambar.push(sosok(S.typing[d][0], 6))
        var td = tangan(6), seruput = akt.t % 6 < 1.2
        tambahan = function (ctx) { cangkir(ctx, td[0] - (seruput ? 3 : 0), td[1] - (seruput ? 7 : 0), !seruput) }
      }
      break
    case 'renang': {
      var kol = __kantorKolam(akt)
      zY = kol.bawah + 1
      gambar.push(sosok(S.walk[d][k4], 13, 19))
      tambahan = function (ctx) {
        var y = Math.round(ch.y)
        kotak(ctx, ch.x - 6, y - 2, 12, 2, '#2aa3d699')
        for (var x = -7; x <= 7; x++) if ((x + Math.floor(akt.anim * 6)) % 3 === 0) kotak(ctx, ch.x + x, y - 1 + (x % 2), 1, 1, '#d9f6ff')
        var sisi = k2 ? 1 : -1, depan = d === z.RIGHT ? 1 : -1
        kotak(ctx, ch.x + sisi * 5 + depan * 2, y - 4 - k2, 2, 1, '#ffffff')
        kotak(ctx, ch.x - depan * 9, y - 1, 2, 1, '#ffffffaa')
      }
      break
    }
    case 'ps5': {
      gambar.push(sosok(S.typing[d][k2], 6))
      var tp = tangan(6)
      tambahan = function (ctx) {
        var y = tp[1] + 1
        if (d === z.UP) { kotak(ctx, X0 + 1, y, 3, 2, '#e9edf2'); kotak(ctx, X0 + 12, y, 3, 2, '#e9edf2'); kotak(ctx, X0 + 2, y, 1, 1, '#3b5bdb') }
        else { kotak(ctx, X0 + 5, y, 6, 2, '#e9edf2'); kotak(ctx, X0 + 6, y, 1, 1, '#3b5bdb'); kotak(ctx, X0 + 9, y, 1, 1, '#e53e3e') }
        if (akt.t % 4 < 0.4) kotak(ctx, ch.x - 1, ch.y - 30, 2, 4, '#ffd166')    // tanda seru: gol!
      }
      break
    }
    case 'biliar': {
      gambar.push(sosok(S.walk[d][1], 0))
      var siklus = akt.t % 3, maju = siklus < 2 ? -Math.floor(siklus * 2) : 3
      var th = tangan(0)
      tambahan = function (ctx) {
        for (var s = 0; s < 14; s++) {
          var px, py
          if (d === z.RIGHT) { px = th[0] - 4 + s + maju; py = th[1] + 1 - Math.floor(s / 7) }
          else if (d === z.LEFT) { px = th[0] + 4 - s - maju; py = th[1] + 1 - Math.floor(s / 7) }
          else { px = th[0] - 1; py = th[1] + 2 - s - maju }
          kotak(ctx, px, py, 1, 1, s === 13 ? '#3a7bd5' : s < 4 ? '#7a4a2a' : '#e2c38f')
        }
      }
      break
    }
    case 'arcade':
    case 'foosball': {
      var lompat = akt.jenis === 'arcade' && k2 ? 1 : 0
      gambar.push(sosok(S.walk[d][1], -lompat))
      var tf = tangan(-lompat)
      tambahan = function (ctx) {
        if (akt.jenis === 'arcade') {
          var w = ['#7cff6b', '#ff4fd8', '#ffd93d'][Math.floor(akt.anim * 4) % 3]
          kotak(ctx, ch.x - 3 + k4, ch.y - 34, 1, 1, w)
        } else {
          kotak(ctx, tf[0] + (d === z.RIGHT ? 1 : -1), tf[1] + (k2 ? 0 : 1), 2, 1, '#c9d1d9')
        }
      }
      break
    }
    case 'lari':
      gambar.push(sosok(S.walk[d][Math.floor(akt.anim / 0.1) % 4], 0))
      tambahan = function (ctx) { if (akt.t % 3 < 0.5) kotak(ctx, ch.x + 5, ch.y - 30 + Math.floor((akt.t % 3) * 6), 1, 2, '#7cc6ff') }
      break
    case 'angkat': {
      gambar.push(sosok(S.walk[d][1], 0))
      var ta = tangan(0), kiri = Math.floor(akt.anim / 0.7) % 2
      tambahan = function (ctx) {
        function dumbbell(x, y) {
          kotak(ctx, x, y + 1, 5, 1, '#e9edf2')
          kotak(ctx, x, y, 2, 3, '#ff6b81'); kotak(ctx, x + 3, y, 2, 3, '#ff6b81')
          kotak(ctx, x, y, 1, 1, '#ffb3bf'); kotak(ctx, x + 3, y, 1, 1, '#ffb3bf')
        }
        dumbbell(X0, ta[1] - (kiri ? 7 : 0))
        dumbbell(X0 + 11, ta[1] - (kiri ? 0 : 7))
        if (akt.t % 4 < 0.6) kotak(ctx, ch.x + 4, ch.y - 28 + Math.floor((akt.t % 4) * 5), 1, 2, '#7cc6ff')
      }
      break
    }
    case 'tinju': {
      gambar.push(sosok(S.walk[d][k2 ? 0 : 2], 0))
      var tt = tangan(0), jab = Math.floor(akt.anim / 0.25) % 3 === 0 ? 3 : 0
      tambahan = function (ctx) {
        var arah = d === z.RIGHT ? 1 : -1
        kotak(ctx, tt[0] + arah * (1 + jab), tt[1] - 3, 2, 2, '#e53e3e')
        kotak(ctx, tt[0] - arah * 3, tt[1] - 2, 2, 2, '#c53030')
      }
      break
    }
    case 'santai': {
      gambar.push(sosok(S.typing[d][0], 4))
      var hp = tangan(4)
      tambahan = function (ctx) {
        kotak(ctx, ch.x - 2, hp[1] - 1, 4, 3, '#1d1830')
        kotak(ctx, ch.x - 1, hp[1], 2, 1, ['#7cc6ff', '#ff8fd0', '#5fe0b0'][Math.floor(akt.anim) % 3])
      }
      break
    }
    default:
      return false
  }
  l.push({ zY: zY, draw: function (ctx) { gambar.forEach(function (g) { g(ctx) }); if (tambahan) tambahan(ctx) } })
  return true
}

// Untuk uji coba dari console browser: bobot jenis aktivitas bisa diubah lewat objek ini.
if (typeof window !== 'undefined') window.__kantorJenisAktivitas = __KANTOR_JENIS
