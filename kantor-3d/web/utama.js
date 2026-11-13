// Titik masuk tampilan Kantor Ricko 3D: menyambung ke server (Server-Sent Events), menjalankan
// simulasi perilaku, menggerakkan karakter 3D, dan memperbarui antarmuka tiap frame.
//
// Uji dari console browser (window.__kantor):
//   __kantor.interkom({ dari: 'ujang', ke: 'kokom', teks: 'Teh, minta aturan lembur' })
//   __kantor.tidur(true)        paksa semua tidur (kuota habis)
//   __kantor.maju(10)           majukan simulasi 10 detik (untuk tab yang animasinya dijeda)
import { buatDunia } from './dunia.js'
import { Simulasi } from './simulasi.js'
import { buatTokoh, gerakkan, muatModel } from './tokoh.js'
import { buatAntarmuka, kuotaHabis } from './antarmuka.js'
import { KURSI } from './denah.js'

await muatModel()

const token = new URLSearchParams(location.search).get('token') || ''
const dunia = buatDunia(document.getElementById('kanvas'))
const sim = new Simulasi(dunia.peta)
const ui = buatAntarmuka({ token, dunia, sim })
const tokoh = new Map()
let keadaan = { karyawan: [], kuota: null, rapat: null }, paksaTidur = false

function terima(k) {
  keadaan = k
  sim.urutan = k.karyawan.filter(a => a.id !== 'ricko').map(a => a.id)
  sim.setel(k, paksaTidur || !!kuotaHabis(k.kuota))
  ui.terima(k)
}

const es = new EventSource('/api/events?token=' + encodeURIComponent(token))
es.addEventListener('state', e => { ui.putus(false); terima(JSON.parse(e.data)) })
es.addEventListener('interkom', e => sim.interkom(JSON.parse(e.data)))
es.onerror = () => ui.putus(true)

// Klik karakter = buka panel Staff-nya.
dunia.padaKlik = (x, y) => {
  let terdekat = null
  for (const o of sim.orang.values()) {
    const p = dunia.proyeksi(o.x, 0.9, o.z)
    const jarak = p ? Math.hypot(p.x - x, p.y - y) : Infinity
    if (jarak < 46 && (!terdekat || jarak < terdekat.jarak)) terdekat = { o, jarak }
  }
  if (terdekat && terdekat.o.id !== 'ricko') ui.bukaStaff(terdekat.o.id)
}

function selaraskan(t, dt) {
  for (const o of sim.orang.values()) {
    let s = tokoh.get(o.id)
    if (!s) { s = buatTokoh(o.id); dunia.scene.add(s.akar); tokoh.set(o.id, s) }
    gerakkan(s, o, t, dt)
  }
  for (const [id, s] of tokoh) if (!sim.orang.has(id)) { dunia.scene.remove(s.akar); tokoh.delete(id) }
  // Monitor meja menyala saat pemiliknya duduk bekerja di sana.
  for (const k of KURSI) if (k.meja !== undefined) { const o = k.pemilik && sim.orang.get(k.pemilik); dunia.aturLayar(k.meja, !!o && o.pose === 'ketik') }
}

let lalu = performance.now(), waktu = 0
function bingkai(kini) {
  const dt = Math.min(0.1, (kini - lalu) / 1000)
  lalu = kini; waktu += dt
  sim.langkah(dt)
  selaraskan(waktu, dt)
  dunia.bingkai(dt, waktu)
  ui.bingkai()
  requestAnimationFrame(bingkai)
}
requestAnimationFrame(bingkai)

window.__kantor = {
  sim, dunia,
  interkom: p => sim.interkom(p),
  tidur: ya => { paksaTidur = !!ya; terima(keadaan) },
  terima,
  maju: detik => { for (let i = 0; i < detik * 20; i++) sim.langkah(0.05) },
}
