// Status kantor di Pixel Office (disuntikkan patch-pixel-agents.mjs ke bundel tampilan
// pixel-agents 1.4.1). Server menyiarkan pesan `kantorStatus` tiap 3 detik berisi:
//   - izin: id karakter yang sedang menunggu izin Pak Ricko. Sumbernya status asli Claude Code
//     (~/.claude/sessions/<pid>.json: status "waiting", waitingFor "permission prompt"), bukan
//     tebakan dari transkrip -- dulu karyawan yang menunggu izin terlihat seperti "Reading ...".
//     Karakternya diberi gelembung "Needs approval" bawaan pixel-agents; bunyi sekali di awal.
//   - kuota: pemakaian langganan (limit 5 jam & mingguan) dari tools/status-kantor.mjs,
//     ditampilkan sebagai panel kecil di pojok kanan atas.
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

function __kantorWarnaKuota(p) {
  return p >= 85 ? '#c0664a' : p >= 60 ? '#d9a441' : '#8a9a5b'
}

function __kantorJamReset(detik) {
  if (!detik) return ''
  var d = new Date(detik * 1000)
  var jam = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
  var hari = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][d.getDay()]
  return d.toDateString() === new Date().toDateString() ? jam : hari + ' ' + jam
}

function __kantorBarisKuota(label, w) {
  if (!w) return ''
  var lewat = w.reset && w.reset * 1000 < Date.now()
  var p = lewat ? 0 : Math.max(0, Math.min(100, w.persen))
  var ket = lewat ? 'sudah reset' : 'reset ' + __kantorJamReset(w.reset)
  return '<div style="margin-top:6px">' +
    '<div style="display:flex;justify-content:space-between;gap:8px"><span>' + label + '</span>' +
    '<span><b>' + Math.round(p) + '%</b></span></div>' +
    '<div style="height:10px;background:var(--color-bg-dark);border:1px solid var(--color-border);margin:3px 0">' +
    '<div style="height:100%;width:' + p + '%;background:' + __kantorWarnaKuota(p) + '"></div></div>' +
    '<div style="opacity:.6">' + ket + '</div></div>'
}

function __kantorPanelKuota(k) {
  var el = document.getElementById('kantor-kuota')
  if (!k || (!k.limaJam && !k.mingguan)) { if (el) el.remove(); return }
  if (!el) {
    el = document.createElement('div')
    el.id = 'kantor-kuota'
    el.title = 'Klik untuk mengecilkan / membesarkan'
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
  var umur = menit < 1 ? 'baru saja' : menit < 60 ? menit + ' mnt lalu' : Math.round(menit / 60) + ' jam lalu'
  var p5 = k.limaJam && !(k.limaJam.reset && k.limaJam.reset * 1000 < Date.now()) ? Math.round(k.limaJam.persen) : 0
  if (el.dataset.kecil === '1') {
    el.innerHTML = 'Kuota <b style="color:' + __kantorWarnaKuota(p5) + '">' + p5 + '%</b>'
    return
  }
  el.innerHTML = '<div style="color:var(--color-accent-bright)">Kuota ' + (k.akun || 'Claude') + '</div>' +
    __kantorBarisKuota('5 jam', k.limaJam) + __kantorBarisKuota('Mingguan', k.mingguan) +
    '<div style="opacity:.5;margin-top:6px">diperbarui ' + umur + '</div>'
}
