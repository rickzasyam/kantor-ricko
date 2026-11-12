// Status kantor di Pixel Office (disuntikkan patch-pixel-agents.mjs ke bundel tampilan
// pixel-agents 1.4.1). Server menyiarkan pesan `kantorStatus` tiap 3 detik berisi:
//   - izin: id karakter yang sedang menunggu izin Pak Ricko. Sumbernya status asli Claude Code
//     (~/.claude/sessions/<pid>.json: status "waiting", waitingFor "permission prompt"), bukan
//     tebakan dari transkrip -- dulu karyawan yang menunggu izin terlihat seperti "Reading ...".
//     Karakternya diberi gelembung "Needs approval" bawaan pixel-agents; bunyi sekali di awal.
//   - kuota: pemakaian langganan (limit 5 jam & mingguan) dari tools/status-kantor.mjs,
//     ditampilkan sebagai panel kecil di pojok kanan atas. Kuota habis = window.__kantorTidur,
//     karyawan berjalan ke futonnya dan tidur sampai jam reset (lihat aktivitas.js).
// dan pesan `kantorInterkom` tiap ada pesan antar-karyawan (tools/interkom-log.mjs): pengirim
// berjalan ke penerima (aktivitas.js) dan gelembung obrolan digambar di sini.
//
// Semua teks antarmuka berbahasa Inggris (permintaan Pak Ricko); isi obrolan apa adanya.
// Uji dari console: window.__kantorTidurPaksa = true, atau
//   window.__kantorInterkom({ pesan: [{ id: 1, dari: 'ujang', ke: 'kokom', teks: 'Teh, minta aturan lembur' }] })
//
// Nama hasil minify yang dipakai: `lo` (ref OfficeState), `nn` (bunyi notifikasi izin).

var __kantorIzinLama = new Set()

function __kantorStatus(s, ref, bunyi) {
  var office = ref && ref.current
  if (office) {
    var baru = new Set(s.izin || [])
    baru.forEach(function (id) {
      var ch = office.characters.get(id)
      if (!ch) return
      if (ch.bubbleType !== 'permission') office.showPermissionBubble(id)
      if (!__kantorIzinLama.has(id)) { try { bunyi() } catch (e) {} }
    })
    __kantorIzinLama.forEach(function (id) { if (!baru.has(id)) office.clearPermissionBubble(id) })
    __kantorIzinLama = baru
  }
  __kantorPanelKuota(s.kuota)
}

/** Jendela kuota yang sudah habis dan belum reset (atau null). */
function __kantorKuotaHabis(k) {
  var habis = null
  ;[k && k.limaJam, k && k.mingguan].forEach(function (w) {
    if (w && w.persen >= 99.5 && w.reset && w.reset * 1000 > Date.now() && (!habis || w.reset > habis.reset)) habis = w
  })
  return habis
}

function __kantorWarnaKuota(p) {
  return p >= 85 ? '#c0664a' : p >= 60 ? '#d9a441' : '#8a9a5b'
}

function __kantorJamReset(detik) {
  if (!detik) return ''
  var d = new Date(detik * 1000)
  var jam = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
  var hari = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]
  return d.toDateString() === new Date().toDateString() ? jam : hari + ' ' + jam
}

function __kantorBarisKuota(label, w) {
  if (!w) return ''
  var lewat = w.reset && w.reset * 1000 < Date.now()
  var p = lewat ? 0 : Math.max(0, Math.min(100, w.persen))
  var ket = lewat ? 'already reset' : 'resets ' + __kantorJamReset(w.reset)
  return '<div style="margin-top:6px">' +
    '<div style="display:flex;justify-content:space-between;gap:8px"><span>' + label + '</span>' +
    '<span><b>' + Math.round(p) + '%</b></span></div>' +
    '<div style="height:10px;background:var(--color-bg-dark);border:1px solid var(--color-border);margin:3px 0">' +
    '<div style="height:100%;width:' + p + '%;background:' + __kantorWarnaKuota(p) + '"></div></div>' +
    '<div style="opacity:.6">' + ket + '</div></div>'
}

function __kantorPanelKuota(k) {
  var habis = __kantorKuotaHabis(k)
  window.__kantorTidur = !!habis || window.__kantorTidurPaksa === true
  var el = document.getElementById('kantor-kuota')
  if (!k || (!k.limaJam && !k.mingguan)) { if (el) el.remove(); return }
  if (!el) {
    el = document.createElement('div')
    el.id = 'kantor-kuota'
    el.title = 'Click to collapse / expand'
    el.style.cssText = 'position:fixed;top:10px;right:10px;z-index:40;min-width:230px;padding:8px 12px;' +
      'background:var(--color-bg);border:2px solid var(--color-border);color:var(--color-text);' +
      'font-size:20px;line-height:1.05;cursor:pointer;box-shadow:2px 2px 0 #0006;user-select:none'
    el.onclick = function () {
      var kecil = el.dataset.kecil !== '1'
      el.dataset.kecil = kecil ? '1' : '0'
      try { localStorage.setItem('kantor-kuota-kecil', el.dataset.kecil) } catch (e) {}
      __kantorPanelKuota(window.__kantorKuotaData)
    }
    try { el.dataset.kecil = localStorage.getItem('kantor-kuota-kecil') || '0' } catch (e) { el.dataset.kecil = '0' }
    document.body.appendChild(el)
  }
  window.__kantorKuotaData = k
  var menit = Math.round((Date.now() - (k.waktu || 0)) / 60000)
  var umur = menit < 1 ? 'just now' : menit < 60 ? menit + ' min ago' : Math.round(menit / 60) + ' h ago'
  var p5 = k.limaJam && !(k.limaJam.reset && k.limaJam.reset * 1000 < Date.now()) ? Math.round(k.limaJam.persen) : 0
  if (el.dataset.kecil === '1') {
    el.innerHTML = 'Quota <b style="color:' + __kantorWarnaKuota(p5) + '">' + p5 + '%</b>' + (habis ? ' · zzz' : '')
    return
  }
  el.innerHTML = '<div style="color:var(--color-accent-bright)">' + (k.akun || 'Claude') + ' quota</div>' +
    __kantorBarisKuota('5-hour', k.limaJam) + __kantorBarisKuota('Weekly', k.mingguan) +
    (habis ? '<div style="margin-top:6px;color:#d9a441">Out of quota. Staff asleep until ' + __kantorJamReset(habis.reset) + '</div>' : '') +
    '<div style="opacity:.5;margin-top:6px">updated ' + umur + '</div>'
}

// ----------------------------------------------------------------------- interkom

var __kantorInterkomLihat = new Set()

/** Pesan `kantorInterkom` dari server: antrekan untuk aktivitas.js (sekali per id). */
function __kantorInterkom(s) {
  var antre = window.__kantorInterkomAntre || (window.__kantorInterkomAntre = [])
  ;(s.pesan || []).forEach(function (p) {
    if (!p || !p.dari || __kantorInterkomLihat.has(p.id)) return
    __kantorInterkomLihat.add(p.id)
    antre.push({ dari: String(p.dari).toLowerCase(), ke: String(p.ke || '').toLowerCase(), teks: String(p.teks || ''), masuk: Date.now() })
  })
  // Pengirim yang tidak punya karakter di kantor tidak akan pernah mengambil pesannya.
  for (var i = antre.length - 1; i >= 0; i--) if (Date.now() - antre[i].masuk > 30000) antre.splice(i, 1)
}
if (typeof window !== 'undefined') window.__kantorInterkom = __kantorInterkom

/** Titik dunia (px; tinggi = px di atas lantai) -> px CSS di area kantor, untuk 3D maupun 2D. */
function __kantorKeLayar(x, y, tinggi) {
  var p = __kantor3DLayar(x, y, tinggi)
  if (p) return p
  var d = window.__kantor2D, dpr = window.devicePixelRatio || 1
  return d ? { x: (d.ox + x * d.zoom) / dpr, y: (d.oy + (y - tinggi) * d.zoom) / dpr } : null
}

function __kantorNamaTampil(nama) {
  var p = window.__kantorProfil && window.__kantorProfil[String(nama).toLowerCase()]
  return p ? p.nama : nama
}

// Gelembung obrolan: satu elemen DOM per karyawan yang sedang bicara, diposisikan tiap frame di
// atas kepalanya. Isinya ringkasan pesan; percakapan lengkapnya tetap di Discord #ruang-rapat.
;(function () {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  var gelembung = new Map()
  function lapisan() {
    var el = document.getElementById('kantor-obrolan')
    if (el) return el
    var kanvas = document.querySelector('canvas')
    if (!kanvas || !kanvas.parentNode) return null
    el = document.createElement('div')
    el.id = 'kantor-obrolan'
    el.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:43;overflow:hidden'
    kanvas.parentNode.appendChild(el)
    return el
  }
  function bingkai() {
    var os = window.__kantorOffice && window.__kantorOffice.current
    var ada = new Set()
    if (os) os.characters.forEach(function (ch) {
      var a = ch.__akt
      if (!a || a.jenis !== 'interkom' || a.fase !== 'bicara') return
      var wadah = lapisan(), p = wadah && __kantorKeLayar(ch.x, ch.y, 58)
      if (!p) return
      ada.add(ch.id)
      var el = gelembung.get(ch.id)
      if (!el) {
        el = document.createElement('div')
        // width:max-content: tanpa ini gelembung di tepi kanan layar menyempit jadi satu huruf per baris
        el.style.cssText = 'position:absolute;transform:translate(-50%,-100%);width:max-content;max-width:260px;padding:6px 10px 8px;' +
          'background:#fbf6ec;color:#3b3129;border:2px solid #3b3129;box-shadow:3px 3px 0 #0005;' +
          'font-size:20px;line-height:1.05;white-space:normal;word-break:break-word'
        var kepala = document.createElement('div')
        kepala.style.cssText = 'font-size:16px;color:#64734f;margin-bottom:2px'
        var isi = document.createElement('div')
        var ekor = document.createElement('div')
        ekor.style.cssText = 'position:absolute;left:50%;bottom:-8px;width:10px;height:10px;margin-left:-5px;' +
          'background:#fbf6ec;border-right:2px solid #3b3129;border-bottom:2px solid #3b3129;transform:rotate(45deg)'
        el.appendChild(kepala); el.appendChild(isi); el.appendChild(ekor)
        kepala.textContent = __kantorNamaTampil(ch.folderName) + ' → ' + __kantorNamaTampil(a.ke)
        isi.textContent = a.teks
        wadah.appendChild(el)
        gelembung.set(ch.id, el)
      }
      // jaga supaya gelembung tidak terpotong tepi area kantor
      var setengah = el.offsetWidth / 2 + 4
      el.style.left = Math.max(setengah, Math.min(wadah.clientWidth - setengah, p.x)) + 'px'
      el.style.top = Math.max(el.offsetHeight + 4, p.y) + 'px'
      el.style.opacity = a.t > a.durasi - 0.4 ? '0.4' : '1'
    })
    gelembung.forEach(function (el, id) { if (!ada.has(id)) { el.remove(); gelembung.delete(id) } })
    requestAnimationFrame(bingkai)
  }
  requestAnimationFrame(bingkai)
})()
