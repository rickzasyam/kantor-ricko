// Antarmuka Kantor Ricko di atas adegan 3D (HTML biasa): label nama + status di atas kepala,
// gelembung interkom, kartu kuota, deretan staf, tombol kamera, dan panel Staff (model AI + job desk).
// Semua teks antarmuka berbahasa Inggris (permintaan Pak Ricko); isi obrolan karyawan apa adanya.
import { PENAMPILAN, potret } from './tokoh.js'
import { TEMPAT } from './denah.js'
import { namaWaktu } from './dunia.js'

const TEKS_TEMPAT = { matcha: 'Matcha break', onsen: 'Soaking in the onsen', game: 'Gaming at the kotatsu', arcade: 'At the arcade', biliar: 'Playing pool', foosball: 'Playing foosball', lari: 'On the treadmill', tinju: 'Boxing', meditasi: 'Meditating', teh: 'Tea break', santai: 'Relaxing', taman: 'In the garden' }
const TEKS_WAKTU = { pagi: 'Morning', siang: 'Daytime', sore: 'Evening', malam: 'Night' }
const TINGGI_LABEL = { duduk: 1.55, ketik: 1.55, lesehan: 1.2, meditasi: 1.2, rendam: 0.85, tidur: 0.95 }

/** Jendela kuota yang sudah habis dan belum reset (atau null). Uji: window.__kantorTidurPaksa = true. */
export function kuotaHabis(k) {
  let habis = null
  for (const w of [k?.limaJam, k?.mingguan]) if (w && w.persen >= 99.5 && w.reset && w.reset * 1000 > Date.now() && (!habis || w.reset > habis.reset)) habis = w
  return habis
}

const el = (tag, kelas, teks) => { const e = document.createElement(tag); if (kelas) e.className = kelas; if (teks !== undefined) e.textContent = teks; return e }
const $ = id => document.getElementById(id)
const jamReset = detik => {
  const d = new Date(detik * 1000), jam = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
  return d.toDateString() === new Date().toDateString() ? jam : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()] + ' ' + jam
}

export function buatAntarmuka({ token, dunia, sim }) {
  let keadaan = { karyawan: [], kuota: null, rapat: null }
  const label = new Map(), gelembung = new Map(), chip = new Map()
  const nama = id => keadaan.karyawan.find(k => k.id === id)?.nama ?? id

  function status(k, o) {
    if (!k.hadir) return ['off', 'Off duty']
    if (k.status === 'approval') return ['approval', 'Needs approval']
    if (k.status === 'waiting') return ['waiting', 'Waiting for input']
    if (k.status === 'working') return ['working', k.kegiatan || 'Working']
    const kunci = o?.niat?.kunci ?? ''
    if (o?.bicara?.tampil) return ['idle', 'Talking to ' + nama(o.bicara.ke)]
    if (kunci === 'tidur') return ['sleeping', o.tiba ? 'Sleeping' : 'Heading to bed']
    if (kunci.startsWith('rapat')) return ['idle', 'In a meeting']
    if (kunci.startsWith('tempat') && o.tiba) return ['idle', TEKS_TEMPAT[TEMPAT[+kunci.slice(6)].jenis] ?? 'Idle']
    return ['idle', 'Idle']
  }

  // --- kartu kuota ---
  const kartuKuota = $('kuota')
  try { kartuKuota.classList.toggle('kecil', localStorage.getItem('kantor-kuota-kecil') === '1') } catch {}
  kartuKuota.title = 'Click to collapse / expand'
  kartuKuota.onclick = () => { const kecil = kartuKuota.classList.toggle('kecil'); try { localStorage.setItem('kantor-kuota-kecil', kecil ? '1' : '0') } catch {} }
  function gambarKuota() {
    const k = keadaan.kuota
    kartuKuota.hidden = !k || (!k.limaJam && !k.mingguan)
    if (kartuKuota.hidden) return
    const habis = kuotaHabis(k)
    const baris = (judul, w) => {
      if (!w) return ''
      const lewat = w.reset && w.reset * 1000 < Date.now(), p = lewat ? 0 : Math.max(0, Math.min(100, w.persen))
      return `<div class="baris"><span>${judul}</span><b>${Math.round(p)}%</b></div><div class="batang"><i class="${p >= 85 ? 'tinggi' : p >= 60 ? 'sedang' : ''}" style="width:${p}%"></i></div><div class="ket">${lewat ? 'already reset' : 'resets ' + jamReset(w.reset)}</div>`
    }
    const menit = Math.round((Date.now() - (k.waktu || 0)) / 60000)
    const p5 = k.limaJam && !(k.limaJam.reset * 1000 < Date.now()) ? Math.round(k.limaJam.persen) : 0
    kartuKuota.innerHTML = `<h2><span>${k.akun || 'Claude'} quota</span><span>${habis ? 'zzz' : p5 + '%'}</span></h2>` + baris('5-hour', k.limaJam) + baris('Weekly', k.mingguan) +
      (habis ? `<div class="tidur">Out of quota. Staff asleep until ${jamReset(habis.reset)}.</div>` : '') +
      `<div class="ket">updated ${menit < 1 ? 'just now' : menit < 60 ? menit + ' min ago' : Math.round(menit / 60) + ' h ago'}</div>`
  }

  // --- deretan staf ---
  function gambarDok() {
    const dok = $('dok')
    for (const k of keadaan.karyawan) {
      let c = chip.get(k.id)
      if (!c) {
        c = el('button', 'chip')
        const p = PENAMPILAN[k.id] ?? {}, w = el('span', 'wajah')
        w.style.setProperty('--baju', p.baju); w.style.setProperty('--rambut', p.rambut)
        const teks = el('span'); teks.append(el('b', '', k.nama), el('small'))
        c.append(w, teks)
        c.onclick = () => { const o = sim.orang.get(k.id); if (o) dunia.sorot(o.x, o.z); if (k.id !== 'ricko') bukaStaff(k.id) }
        chip.set(k.id, c); dok.append(c)
      }
      const [kode, teks] = status(k, sim.orang.get(k.id))
      c.dataset.status = kode
      c.classList.toggle('absen', !k.hadir)
      c.title = `${k.nama} · ${k.jabatan}`
      const kecil = c.querySelector('small'), isi = `<i class="titik"></i>${teks.replace(/[&<>]/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[s]))}`
      if (kecil.innerHTML !== isi) kecil.innerHTML = isi
    }
  }

  // --- label & gelembung di atas karakter ---
  const lapis = $('lapis')
  function gambarLabel() {
    const ada = new Set()
    for (const o of sim.orang.values()) {
      const k = keadaan.karyawan.find(x => x.id === o.id)
      if (!k) continue
      ada.add(o.id)
      let l = label.get(o.id)
      if (!l) { l = el('div', 'label'); l.append(el('b', '', k.nama), el('span')); lapis.append(l); label.set(o.id, l) }
      const [kode, teks] = status(k, o)
      if (l.dataset.status !== kode) l.dataset.status = kode
      if (l.children[1].textContent !== teks) l.children[1].textContent = teks
      const tidur = kode === 'sleeping' && o.tiba
      if (tidur !== !!l.querySelector('.zzz')) tidur ? l.append(el('i', 'zzz', 'z')) : l.querySelector('.zzz').remove()
      const p = dunia.proyeksi(o.x, TINGGI_LABEL[o.pose] ?? 1.68, o.pose === 'tidur' ? o.z - 1.1 : o.z)
      l.style.display = p ? '' : 'none'
      if (p) l.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) translate(-50%,-100%)`

      let g = gelembung.get(o.id)
      if (o.bicara?.tampil && p) {
        if (!g || g.pesan !== o.bicara) {
          g?.remove()
          g = el('div', 'gelembung'); g.pesan = o.bicara
          g.append(el('small', '', `${k.nama} → ${nama(o.bicara.ke)}`), document.createTextNode(o.bicara.teks))
          lapis.append(g); gelembung.set(o.id, g)
        }
        const setengah = g.offsetWidth / 2 + 6
        const x = Math.max(setengah, Math.min(lapis.clientWidth - setengah, p.x)), y = Math.max(g.offsetHeight + 6, p.y - l.offsetHeight - 12)
        g.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-100%)`
        g.style.opacity = o.bicara.sisa < 0.4 ? '0.4' : '1'
      } else if (g) { g.remove(); gelembung.delete(o.id) }
    }
    for (const [id, l] of label) if (!ada.has(id)) { l.remove(); label.delete(id); gelembung.get(id)?.remove(); gelembung.delete(id) }
  }

  // --- tombol kamera ---
  const aksi = { kiri: () => dunia.putar(-15), kanan: () => dunia.putar(15), jauh: () => dunia.zoom(1.25), dekat: () => dunia.zoom(0.8), setel: () => dunia.setel(), staff: () => bukaStaff() }
  $('alat').onclick = e => aksi[e.target.dataset.aksi]?.()
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') return tutupStaff()
    if (!$('staff').hidden || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return
    if (e.key === 'q' || e.key === 'Q') dunia.putar(-15)
    if (e.key === 'e' || e.key === 'E') dunia.putar(15)
  })

  // --- panel Staff: potret di kiri, model AI + job desk di kanan ---
  let data = null, pilih = null, draf = {}, kabar = ['', ''], tutupPotret = null, detak = null
  const api = (jalur, isi) => fetch('/api/' + jalur, {
    method: isi ? 'POST' : 'GET',
    headers: { Authorization: 'Bearer ' + token, ...(isi ? { 'Content-Type': 'application/json' } : {}) },
    body: isi ? JSON.stringify(isi) : undefined,
  }).then(async r => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Server error ' + r.status); return j })

  function tutupStaff() { tutupPotret?.(); tutupPotret = null; clearInterval(detak); $('staff').hidden = true; $('staff').textContent = '' }
  function bukaStaff(id) {
    if (id) pilih = id
    $('staff').hidden = false
    data = null; draf = {}; kabar = ['', '']
    gambarStaff()
    api('karyawan').then(r => { data = r; gambarStaff() }).catch(e => { kabar = [String(e.message || e), 'gagal']; gambarStaff() })
  }
  $('staff').onmousedown = e => { if (e.target === $('staff')) tutupStaff() }

  function meter(judul, persen, ket, kelas = '') {
    const m = el('div', 'meter'), atas = el('div'); atas.append(el('span', '', judul), el('span', '', ket))
    const b = el('div', 'batang'), i = el('i', kelas); i.style.width = Math.max(0, Math.min(100, persen)) + '%'; b.append(i)
    m.append(atas, b)
    return m
  }
  function isiStatus(wadah, k) {
    const hidup = keadaan.karyawan.find(x => x.id === k.id) ?? { hadir: false }
    const [kode, teks] = status(hidup, sim.orang.get(k.id))
    wadah.textContent = ''
    const s = el('span', 'status'); s.dataset.status = kode; s.innerHTML = '<i class="titik"></i>'; s.append(teks)
    wadah.append(s)
    const q = keadaan.kuota?.limaJam
    if (q) { const sisa = q.reset * 1000 < Date.now() ? 100 : 100 - q.persen; wadah.append(meter('ENERGY', sisa, Math.round(sisa) + '% quota left', sisa < 15 ? 'tinggi' : sisa < 40 ? 'sedang' : '')) }
    if (hidup.konteks != null) wadah.append(meter('FOCUS', 100 - hidup.konteks, (100 - hidup.konteks) + '% context free'))
  }

  function gambarStaff() {
    const akar = $('staff')
    tutupPotret?.(); tutupPotret = null; clearInterval(detak)
    akar.textContent = ''
    const j = el('div', 'jendela'), kepala = el('header'), x = el('button', 'tutup', '✕')
    x.title = 'Close (Esc)'; x.onclick = tutupStaff
    kepala.append(el('span', 'cap', 'K'), el('h2', '', 'STAFF'), x)
    j.append(kepala); akar.append(j)
    if (!data) { j.append(el('div', 'isi redup', kabar[0] || 'Loading staff…')); return }
    const k = data.karyawan.find(a => a.id === pilih) ?? data.karyawan[0]
    if (!k) { j.append(el('div', 'isi redup', 'No staff found.')); return }
    pilih = k.id
    const d = draf[k.id] ??= { model: k.model, jobdesk: [...k.jobdesk] }

    const tab = el('div', 'tab')
    for (const a of data.karyawan) {
      const c = el('button', 'chip' + (a.id === k.id ? ' aktif' : '')), w = el('span', 'wajah'), p = PENAMPILAN[a.id] ?? {}
      w.style.setProperty('--baju', p.baju); w.style.setProperty('--rambut', p.rambut)
      c.append(w, el('b', '', a.nama))
      c.onclick = () => { pilih = a.id; kabar = ['', '']; gambarStaff() }
      tab.append(c)
    }
    j.append(tab)

    const isi = el('div', 'isi'), kiri = el('div', 'kolom-potret'), bingkai = el('div', 'bingkai'), kv = el('canvas')
    bingkai.append(kv)
    const wadahStatus = el('div')
    kiri.append(bingkai, el('h3', 'nama', k.nama), el('div', 'jabatan', k.jabatan + (k.role && k.role !== k.jabatan ? ' · ' + k.role : '')), wadahStatus)
    isiStatus(wadahStatus, k)
    detak = setInterval(() => isiStatus(wadahStatus, k), 1000)

    const kanan = el('div', 'kolom-atur')
    const pilihan = [...data.model]
    if (d.model && !pilihan.some(m => m.nilai === d.model)) pilihan.push({ nilai: d.model, label: d.model, ket: '' })
    const sel = el('select'), ket = el('div', 'redup')
    for (const m of pilihan) { const o = el('option', '', m.label + (m.nilai === k.modelBawaan ? '  (default)' : '')); o.value = m.nilai; sel.append(o) }
    sel.value = d.model
    const isiKet = () => {
      const m = pilihan.find(a => a.nilai === sel.value), bawaan = pilihan.find(a => a.nilai === k.modelBawaan)?.label ?? (k.modelBawaan || 'none')
      ket.textContent = `${m?.ket ? m.ket + '. ' : ''}Default for ${k.nama}: ${bawaan}. New models appear here automatically.`
    }
    sel.onchange = () => { d.model = sel.value; isiKet() }
    isiKet()
    kanan.append(el('h3', '', 'AI MODEL'), sel, ket, el('h3', '', 'JOB DESK'), el('div', 'redup', `Standing duties for ${k.nama}, on top of the base role. Write them in any language.`))
    const daftar = el('ul', 'tugas')
    if (!d.jobdesk.length) daftar.append(el('div', 'redup', 'No extra duties yet.'))
    d.jobdesk.forEach((t, i) => {
      const li = el('li'), hapus = el('button', '', '✕')
      hapus.title = 'Remove'; hapus.onclick = () => { d.jobdesk.splice(i, 1); gambarStaff() }
      li.append(el('span', '', t), hapus); daftar.append(li)
    })
    const baris = el('div', 'baris-tambah'), masuk = el('input'), tambah = el('button', 'tombol', 'Add')
    masuk.placeholder = 'Add a duty, then press Enter'; masuk.maxLength = 300
    const tambahkan = () => { const t = masuk.value.replace(/\s+/g, ' ').trim(); if (!t || d.jobdesk.length >= 30) return; d.jobdesk.push(t); gambarStaff(); $('staff').querySelector('.baris-tambah input')?.focus() }
    tambah.onclick = tambahkan; masuk.onkeydown = e => { if (e.key === 'Enter') tambahkan() }
    baris.append(masuk, tambah)
    const kaki = el('div', 'kaki'), simpan = el('button', 'tombol', 'Save'), ulang = el('button', 'tombol utama', 'Save & restart')
    const info = el('span', 'kabar ' + kabar[1], kabar[0] || `Changes take effect after ${k.nama} restarts.`)
    const kirim = restart => {
      simpan.disabled = ulang.disabled = true
      api('karyawan/' + k.id, { model: d.model, jobdesk: d.jobdesk })
        .then(() => { k.model = d.model; k.jobdesk = [...d.jobdesk]; return restart ? api(`karyawan/${k.id}/buka-ulang`, {}) : { hasil: 'saved' } })
        .then(r => {
          kabar = r.hasil === 'saved' ? [`Saved. Applies when ${k.nama} restarts.`, 'baik']
            : r.hasil === 'restarted' ? [`Saved. ${k.nama} is restarting (about a minute).`, 'baik']
            : r.hasil === 'busy' ? [`Saved, but ${k.nama} is busy. Restart later to apply.`, 'awas']
            : ['Saved, but the restart failed. Use Update Kantor / Buka Kantor.', 'gagal']
        })
        .catch(e => { kabar = [String(e.message || e), 'gagal'] })
        .finally(gambarStaff)
    }
    simpan.onclick = () => kirim(false); ulang.onclick = () => kirim(true)
    kaki.append(simpan, ulang, info)
    kanan.append(daftar, baris, kaki)
    isi.append(kiri, kanan); j.append(isi)
    tutupPotret = potret(k.id, kv)
  }

  let detikLalu = -1
  return {
    bukaStaff,
    putus(ya) { $('putus').hidden = !ya },
    terima(k) { keadaan = k; gambarKuota(); gambarDok(); const r = $('rapat'); r.hidden = !k.rapat; r.textContent = ''; if (k.rapat) r.append('Meeting in progress', ...(k.rapat.topik ? [' · ', el('b', '', k.rapat.topik)] : [])) },
    bingkai() {
      gambarLabel()
      const detik = Math.floor(Date.now() / 1000)
      if (detik === detikLalu) return
      detikLalu = detik
      const d = new Date()
      $('jam').textContent = `${TEKS_WAKTU[namaWaktu()]} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      gambarDok()
      if (detik % 30 === 0) gambarKuota()
    },
  }
}
