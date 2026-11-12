// Dashboard bergaya game untuk Pixel Office Kantor Ricko (disuntikkan patch-pixel-agents.mjs ke
// bundel tampilan pixel-agents 1.4.1):
//   - bilah tombol kiri-atas: STAFF, ganti tampilan 3D/2D, putar kamera (juga tombol Q / E)
//   - jendela STAFF seperti layar status karakter di game RPG: potret karyawan di kiri (nama,
//     jabatan, status, batang ENERGY = sisa kuota 5 jam, FOCUS = sisa ruang konteks), pengaturan
//     di kanan (model AI + job desk). Data dari / ke server lewat /api/kantor/* (server-kantor.js).
//
// Semua teks antarmuka berbahasa Inggris (permintaan Pak Ricko). Model & job desk baru berlaku
// setelah karyawan dibuka ulang: tombol "Save & restart" melakukannya kalau ia sedang menganggur.
//
// Nama hasil minify yang dipakai: `_i` (sprite karakter per palette), `ni` (sprite -> kanvas),
// `z` (arah hadap).

;(function () {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  var token = new URLSearchParams(location.search).get('token') || ''
  var data = null, pilih = null, draf = {}, kabar = { teks: '', warna: '' }, jendela = null, detak = null

  var CSS = [
    '#kantor-bilah{position:fixed;left:64px;top:10px;z-index:45;display:flex;gap:6px;font-size:20px;user-select:none}',
    '.kd-tombol{background:var(--color-btn-bg);color:var(--color-text);border:2px solid var(--color-border);padding:3px 10px 5px;cursor:pointer;box-shadow:2px 2px 0 #0006;font:inherit;line-height:1}',
    '.kd-tombol:hover{background:var(--color-btn-hover)}',
    '.kd-tombol[disabled]{opacity:.45;cursor:default}',
    '.kd-utama{background:var(--color-active-bg);border-color:var(--color-accent)}',
    '#kantor-staff{position:fixed;inset:0;z-index:60;background:#000a;display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--color-text)}',
    '.kd-jendela{width:min(980px,96vw);max-height:94vh;display:flex;flex-direction:column;background:var(--color-bg);border:3px solid #8f6943;box-shadow:0 0 0 3px #3b3129,6px 6px 0 3px #0008}',
    '.kd-judul{display:flex;justify-content:space-between;align-items:center;padding:6px 12px 8px;background:#3b3129;color:#e6c88a;font-size:26px;letter-spacing:2px}',
    '.kd-tab{display:flex;gap:6px;padding:8px 12px 0;flex-wrap:wrap}',
    '.kd-tab button{display:flex;align-items:center;gap:6px;padding:2px 10px 4px 4px}',
    '.kd-tab canvas{image-rendering:pixelated;background:var(--color-bg-dark)}',
    '.kd-isi{display:flex;gap:12px;padding:12px;overflow:auto;flex-wrap:wrap}',
    '.kd-potret{flex:0 0 280px;display:flex;flex-direction:column;gap:8px}',
    '.kd-bingkai{position:relative;height:300px;border:3px solid #8f6943;box-shadow:inset 0 0 0 2px #3b3129;background:linear-gradient(#e9dcc3 0 62%,#c9a97a 62% 64%,#d8bd92 64%);overflow:hidden;display:flex;align-items:flex-end;justify-content:center}',
    '.kd-bingkai canvas{image-rendering:pixelated;margin-bottom:14px;animation:kd-napas 1.4s steps(2) infinite}',
    '@keyframes kd-napas{50%{transform:translateY(4px)}}',
    '.kd-nama{font-size:30px;color:#e6c88a;line-height:1}',
    '.kd-jabatan{color:var(--color-text-muted);line-height:1}',
    '.kd-batang{height:12px;background:var(--color-bg-dark);border:1px solid var(--color-border)}',
    '.kd-batang div{height:100%}',
    '.kd-baris{display:flex;justify-content:space-between;gap:8px;line-height:1.1}',
    '.kd-atur{flex:1 1 380px;display:flex;flex-direction:column;gap:6px;min-width:0}',
    '.kd-label{color:#e6c88a;letter-spacing:1px;margin-top:6px}',
    '.kd-redup{color:var(--color-text-muted);font-size:18px;line-height:1.1}',
    '.kd-atur select,.kd-atur input{font:inherit;background:var(--color-bg-dark);color:var(--color-text);border:2px solid var(--color-border);padding:3px 6px;min-width:0}',
    '.kd-tugas{display:flex;flex-direction:column;gap:3px;max-height:200px;overflow:auto;border:2px solid var(--color-border);background:var(--color-bg-dark);padding:6px;min-height:64px}',
    '.kd-tugas div{display:flex;gap:6px;align-items:flex-start;line-height:1.1}',
    '.kd-tugas span{flex:1;word-break:break-word}',
    '.kd-hapus{background:none;border:0;color:#c0664a;cursor:pointer;font:inherit;line-height:1}',
    '.kd-kaki{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px}',
  ].join('\n')

  function el(tag, kelas, teks) {
    var e = document.createElement(tag)
    if (kelas) e.className = kelas
    if (teks !== undefined) e.textContent = teks
    return e
  }

  function api(jalur, isi) {
    return fetch('/api/kantor/' + jalur, {
      method: isi ? 'POST' : 'GET',
      headers: Object.assign({ Authorization: 'Bearer ' + token }, isi ? { 'Content-Type': 'application/json' } : {}),
      body: isi ? JSON.stringify(isi) : undefined,
    }).then(function (r) {
      return r.json().catch(function () { return {} }).then(function (j) {
        if (!r.ok) throw new Error(j.error || (r.status === 401 ? 'Not authorized. Open the office from its own link.' : 'Server error ' + r.status))
        return j
      })
    })
  }

  /** Gambar karakter (hadap depan) diperbesar `skala` kali; `tinggi` = jumlah baris sprite dari atas. */
  function potret(k, skala, tinggi) {
    var c = document.createElement('canvas')
    c.width = 16 * skala; c.height = tinggi * skala
    try {
      var ch = karakter(k)
      var nomor = ch ? ch.palette : k.karakter
      var asal = ni(_i(typeof nomor === 'number' ? nomor : 0, 0).walk[z.DOWN][1], 1)
      var x = c.getContext('2d')
      x.imageSmoothingEnabled = false
      x.drawImage(asal, 0, 0, 16, tinggi, 0, 0, c.width, c.height)
    } catch (e) {}
    return c
  }

  function karakter(k) {
    var os = window.__kantorOffice && window.__kantorOffice.current, hasil = null
    if (os) os.characters.forEach(function (c) { if (!c.isSubagent && String(c.folderName || '').toLowerCase() === k.pixel) hasil = c })
    return hasil
  }

  function keadaan(k) {
    var ch = karakter(k)
    if (!ch) return { teks: 'Off duty', warna: '#8a847b' }
    if (ch.bubbleType === 'permission') return { teks: 'Needs approval', warna: '#d9a441' }
    if (ch.__akt && ch.__akt.jenis === 'tidur') return { teks: 'Sleeping (out of quota)', warna: '#8d9ab3' }
    if (ch.isActive) return { teks: 'Working', warna: '#8cc4b5' }
    return { teks: 'Idle', warna: '#a3b86c' }
  }

  function batang(label, persen, warna, ket) {
    var w = el('div')
    var b = el('div', 'kd-baris'); b.appendChild(el('span', '', label)); b.appendChild(el('span', '', ket))
    var luar = el('div', 'kd-batang'), dalam = el('div')
    dalam.style.width = Math.max(0, Math.min(100, persen)) + '%'
    dalam.style.background = warna
    luar.appendChild(dalam); w.appendChild(b); w.appendChild(luar)
    return w
  }

  function isiStatus(wadah, k) {
    wadah.textContent = ''
    var s = keadaan(k), ch = karakter(k)
    var baris = el('div', 'kd-baris')
    var kiri = el('span', '', '● ' + s.teks); kiri.style.color = s.warna
    baris.appendChild(kiri)
    wadah.appendChild(baris)
    var q = window.__kantorKuotaData && window.__kantorKuotaData.limaJam
    if (q) {
      var sisa = q.reset && q.reset * 1000 < Date.now() ? 100 : 100 - q.persen
      wadah.appendChild(batang('ENERGY', sisa, sisa < 15 ? '#c0664a' : sisa < 40 ? '#d9a441' : '#8a9a5b', Math.round(sisa) + '% quota left'))
    }
    if (ch && ch.maxContextTokens > 0 && ch.contextTokens > 0) {
      var lega = 100 - ch.contextTokens / ch.maxContextTokens * 100
      wadah.appendChild(batang('FOCUS', lega, '#8cc4b5', Math.round(lega) + '% context free'))
    }
  }

  function labelModel(nilai) {
    var m = (data.model || []).find(function (x) { return x.nilai === nilai })
    return m ? m.label : nilai || '(none)'
  }

  function gambar() {
    if (!jendela) return
    var badan = jendela.querySelector('.kd-badan')
    badan.textContent = ''
    if (!data) { badan.appendChild(el('div', 'kd-isi', kabar.teks || 'Loading staff...')); return }
    var k = data.karyawan.find(function (x) { return x.id === pilih }) || data.karyawan[0]
    if (!k) { badan.appendChild(el('div', 'kd-isi', 'No staff found.')); return }
    pilih = k.id
    var d = draf[k.id] || (draf[k.id] = { model: k.model, jobdesk: k.jobdesk.slice() })

    var tab = el('div', 'kd-tab')
    data.karyawan.forEach(function (x) {
      var b = el('button', 'kd-tombol' + (x.id === k.id ? ' kd-utama' : ''))
      b.appendChild(potret(x, 2, 17)); b.appendChild(el('span', '', x.nama))
      b.onclick = function () { pilih = x.id; kabar = { teks: '', warna: '' }; gambar() }
      tab.appendChild(b)
    })
    badan.appendChild(tab)

    var isi = el('div', 'kd-isi')
    // --- kiri: potret ---
    var kiri = el('div', 'kd-potret'), bingkai = el('div', 'kd-bingkai')
    bingkai.appendChild(potret(k, 9, 31))
    kiri.appendChild(bingkai)
    kiri.appendChild(el('div', 'kd-nama', k.nama))
    kiri.appendChild(el('div', 'kd-jabatan', k.jabatan + (k.role && k.role !== k.jabatan ? ' · ' + k.role : '')))
    var status = el('div'); status.style.cssText = 'display:flex;flex-direction:column;gap:6px;margin-top:4px'
    isiStatus(status, k)
    kiri.appendChild(status)
    clearInterval(detak)
    detak = setInterval(function () { if (jendela && status.isConnected) isiStatus(status, k) }, 1000)
    isi.appendChild(kiri)

    // --- kanan: pengaturan ---
    var kanan = el('div', 'kd-atur')
    kanan.appendChild(el('div', 'kd-label', 'AI MODEL'))
    var sel = el('select')
    var pilihan = (data.model || []).slice()
    if (d.model && !pilihan.some(function (m) { return m.nilai === d.model })) pilihan.push({ nilai: d.model, label: d.model, ket: '' })
    pilihan.forEach(function (m) {
      var o = el('option', '', m.label + (m.nilai === k.modelBawaan ? '  (default)' : ''))
      o.value = m.nilai
      sel.appendChild(o)
    })
    sel.value = d.model
    var ket = el('div', 'kd-redup')
    function isiKet() {
      var m = pilihan.find(function (x) { return x.nilai === sel.value })
      ket.textContent = (m && m.ket ? m.ket + '. ' : '') + 'Default for ' + k.nama + ': ' + labelModel(k.modelBawaan) + '. New models appear here automatically.'
    }
    sel.onchange = function () { d.model = sel.value; isiKet() }
    isiKet()
    kanan.appendChild(sel); kanan.appendChild(ket)

    kanan.appendChild(el('div', 'kd-label', 'JOB DESK'))
    kanan.appendChild(el('div', 'kd-redup', 'Standing duties for ' + k.nama + ', added on top of the base role. Write them in any language.'))
    var daftar = el('div', 'kd-tugas')
    if (!d.jobdesk.length) daftar.appendChild(el('div', 'kd-redup', 'No extra duties yet.'))
    d.jobdesk.forEach(function (t, i) {
      var b = el('div'); b.appendChild(el('span', '', '▸ ' + t))
      var h = el('button', 'kd-hapus', '✕'); h.title = 'Remove'
      h.onclick = function () { d.jobdesk.splice(i, 1); gambar() }
      b.appendChild(h); daftar.appendChild(b)
    })
    kanan.appendChild(daftar)
    var tambah = el('div'); tambah.style.cssText = 'display:flex;gap:6px'
    var masuk = el('input'); masuk.placeholder = 'Add a duty, then press Enter'; masuk.maxLength = 300; masuk.style.flex = '1'
    var bTambah = el('button', 'kd-tombol', 'Add')
    function tambahkan() {
      var t = masuk.value.replace(/\s+/g, ' ').trim()
      if (!t || d.jobdesk.length >= 30) return
      d.jobdesk.push(t); gambar()
      var baru = jendela && jendela.querySelector('.kd-atur input'); if (baru) baru.focus()
    }
    bTambah.onclick = tambahkan
    masuk.onkeydown = function (e) { if (e.key === 'Enter') tambahkan(); e.stopPropagation() }
    tambah.appendChild(masuk); tambah.appendChild(bTambah)
    kanan.appendChild(tambah)

    var kaki = el('div', 'kd-kaki')
    var bSimpan = el('button', 'kd-tombol', 'Save'), bUlang = el('button', 'kd-tombol kd-utama', 'Save & restart')
    var info = el('span', 'kd-redup', kabar.teks || 'Changes take effect after ' + k.nama + ' restarts.')
    if (kabar.warna) info.style.color = kabar.warna
    function simpan(ulang) {
      bSimpan.disabled = bUlang.disabled = true
      api('karyawan/' + k.id, { model: d.model, jobdesk: d.jobdesk }).then(function () {
        k.model = d.model; k.jobdesk = d.jobdesk.slice()
        if (!ulang) return { hasil: 'saved' }
        return api('karyawan/' + k.id + '/buka-ulang', {})
      }).then(function (r) {
        kabar = r.hasil === 'saved' ? { teks: 'Saved. Applies when ' + k.nama + ' restarts.', warna: '#a3b86c' }
          : r.hasil === 'restarted' ? { teks: 'Saved. ' + k.nama + ' is restarting (about a minute).', warna: '#a3b86c' }
          : r.hasil === 'busy' ? { teks: 'Saved, but ' + k.nama + ' is busy. Restart later to apply.', warna: '#d9a441' }
          : { teks: 'Saved, but the restart failed. Use Update Kantor / Buka Kantor.', warna: '#c0664a' }
        gambar()
      }).catch(function (e) { kabar = { teks: String(e.message || e), warna: '#c0664a' }; gambar() })
    }
    bSimpan.onclick = function () { simpan(false) }
    bUlang.onclick = function () { simpan(true) }
    kaki.appendChild(bSimpan); kaki.appendChild(bUlang); kaki.appendChild(info)
    kanan.appendChild(kaki)
    isi.appendChild(kanan)
    badan.appendChild(isi)
  }

  function tutup() {
    clearInterval(detak)
    if (jendela) jendela.remove()
    jendela = null
  }

  function buka() {
    if (jendela) return
    jendela = el('div'); jendela.id = 'kantor-staff'
    var j = el('div', 'kd-jendela'), judul = el('div', 'kd-judul')
    judul.appendChild(el('span', '', 'STAFF'))
    var x = el('button', 'kd-tombol', '✕'); x.title = 'Close (Esc)'; x.onclick = tutup
    judul.appendChild(x)
    j.appendChild(judul); j.appendChild(el('div', 'kd-badan'))
    jendela.appendChild(j)
    jendela.onmousedown = function (e) { if (e.target === jendela) tutup() }
    document.body.appendChild(jendela)
    data = null; draf = {}; kabar = { teks: '', warna: '' }
    gambar()
    api('karyawan').then(function (r) { data = r; gambar() }).catch(function (e) { kabar = { teks: String(e.message || e), warna: '#c0664a' }; gambar() })
  }

  function pasangBilah() {
    if (document.getElementById('kantor-bilah') || !document.body) return
    var gaya = el('style'); gaya.textContent = CSS; document.head.appendChild(gaya)
    var bilah = el('div'); bilah.id = 'kantor-bilah'
    var bStaff = el('button', 'kd-tombol kd-utama', 'STAFF'); bStaff.title = 'Staff roster: AI model and job desk'
    bStaff.onclick = buka
    var bMode = el('button', 'kd-tombol'); bMode.title = 'Switch between the 3D and the classic 2D view'
    var bKiri = el('button', 'kd-tombol', '⟲'), bKanan = el('button', 'kd-tombol', '⟳')
    bKiri.title = 'Rotate view left (Q)'; bKanan.title = 'Rotate view right (E)'
    function segarkan() {
      var tiga = window.__kantor3D && window.__kantor3D.nyala
      bMode.textContent = tiga ? 'VIEW: 3D' : 'VIEW: 2D'
      bKiri.style.display = bKanan.style.display = tiga ? '' : 'none'
    }
    bMode.onclick = function () { window.__kantor3D.atur(!window.__kantor3D.nyala); segarkan() }
    bKiri.onclick = function () { window.__kantor3D.putar(-15) }
    bKanan.onclick = function () { window.__kantor3D.putar(15) }
    bKiri.ondblclick = bKanan.ondblclick = function () { window.__kantor3D.lurus() }
    ;[bStaff, bMode, bKiri, bKanan].forEach(function (b) { bilah.appendChild(b) })
    document.body.appendChild(bilah)
    segarkan()
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && jendela) { tutup(); return }
      if (jendela || /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '')) return
      if (e.key === 'q' || e.key === 'Q') window.__kantor3D.putar(-15)
      if (e.key === 'e' || e.key === 'E') window.__kantor3D.putar(15)
    })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pasangBilah)
  else setTimeout(pasangBilah, 0)
})()
