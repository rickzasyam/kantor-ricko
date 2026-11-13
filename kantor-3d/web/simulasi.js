// Perilaku karyawan di kantor 3D: siapa pergi ke mana dan sedang berpose apa. Murni hitungan
// (tanpa Three.js) supaya bisa diuji dengan Node; tokoh.js yang menggambarnya.
//
// Tiap frame setiap karyawan punya satu "niat", dipilih menurut urutan ini:
//   1. interkom  - berjalan ke rekan yang dikirimi pesan, bicara beberapa detik
//   2. rapat     - duduk di Ruang Rapat selama rapat berlangsung
//   3. kerja     - duduk di mejanya (mengetik saat bekerja, diam saat menunggu izin/jawaban)
//   4. tidur     - kuota Claude habis: rebah di futonnya di Mess sampai kuota pulih
//   5. santai    - duduk di meja, sesekali pergi ke Matcha Bar, onsen, ruang game, dojo, ...
// Niat berubah = cari jalan baru. Sampai di tujuan = pose niat itu dipakai.
import { KURSI, KASUR, KURSI_RAPAT, TEMPAT, SUDUT, cariJalan } from './denah.js'

const LAJU = 2.9            // ubin per detik
const LAMA_BICARA = 7       // detik gelembung interkom tampil
const acak = (a, b) => a + Math.random() * (b - a)
const tengah = ([c, r]) => [c + 0.5, r + 0.5]

export class Simulasi {
  /** urutan = id karyawan menurut tools/karyawan.json (futon ke-n milik karyawan ke-n). */
  constructor(peta, urutan = []) {
    this.peta = peta
    this.urutan = urutan
    this.orang = new Map()
    this.dipakai = new Set()      // indeks TEMPAT yang sedang ditempati / dituju
    this.keadaan = { karyawan: [], rapat: null }
    this.tidur = false
    this.t = 0
  }

  /** Terima keadaan kantor dari server. */
  setel(keadaan, tidur) {
    this.keadaan = keadaan
    this.tidur = !!tidur
    const hadir = new Set()
    for (const k of keadaan.karyawan) {
      if (!k.hadir) continue
      hadir.add(k.id)
      let o = this.orang.get(k.id)
      if (!o) {
        const kursi = KURSI.find(s => s.pemilik === k.id) ?? KURSI.find(s => !s.pemilik)
        o = { id: k.id, kursi, x: kursi.pos[0], z: kursi.pos[1], sudut: SUDUT[kursi.hadap], pose: 'duduk', ubin: kursi.ubin, jalur: [], niat: null, tiba: true, santai: { tempat: null, sampai: this.t + acak(8, 30) }, bicara: null, antre: [] }
        this.orang.set(k.id, o)
      }
      o.status = k.status
    }
    for (const [id, o] of this.orang) if (!hadir.has(id)) { this.lepas(o); this.orang.delete(id) }
  }

  lepas(o) {
    if (o.santai.tempat !== null) { this.dipakai.delete(o.santai.tempat); o.santai = { tempat: null, sampai: this.t + acak(20, 60) } }
  }

  /** Pesan interkom { dari, ke, teks }: pengirim mendatangi penerima. */
  interkom(p) {
    const o = this.orang.get(p.dari)
    if (o) o.antre.push({ ke: p.ke, teks: String(p.teks ?? '') })
  }

  mulaiBicara(o, p) {
    const lawan = this.orang.get(p.ke)
    o.bicara = { ke: p.ke, teks: p.teks, sisa: LAMA_BICARA, niat: null }
    if (!lawan || lawan === o || this.ikutRapat(o.id)) return     // bicara dari tempatnya
    const [c, r] = lawan.ubin
    let terbaik = null
    for (const t of [[c - 1, r], [c + 1, r], [c, r + 1], [c, r - 1]]) {
      const diSini = t[0] === o.ubin[0] && t[1] === o.ubin[1]
      if (!diSini && !this.peta.bisa(t[0], t[1])) continue
      const j = cariJalan(this.peta, o.ubin, t)
      if (j && (!terbaik || j.length < terbaik.j.length)) terbaik = { t, j }
    }
    if (terbaik) o.bicara.niat = { kunci: 'interkom' + this.t, ubin: terbaik.t, pos: tengah(terbaik.t), pose: 'bicara', menghadap: lawan }
  }

  ikutRapat(id) {
    const r = this.keadaan.rapat
    return !!r && id !== 'ricko' && (!r.peserta || r.peserta.includes(id))
  }

  niat(o) {
    if (o.bicara?.niat) return o.bicara.niat
    const r = this.keadaan.rapat
    if (this.ikutRapat(o.id)) {
      const peserta = (r.peserta ?? this.urutan).filter(id => id !== r.pemimpin && this.orang.has(id))
      const i = o.id === r.pemimpin ? 0 : 1 + peserta.indexOf(o.id)
      const k = KURSI_RAPAT[Math.max(0, i) % KURSI_RAPAT.length]
      return { kunci: 'rapat' + i, ubin: k.ubin, pos: k.pos, hadap: k.hadap, pose: 'duduk' }
    }
    const meja = { kunci: 'kursi', ubin: o.kursi.ubin, pos: o.kursi.pos, hadap: o.kursi.hadap, pose: o.status === 'working' ? 'ketik' : 'duduk' }
    if (o.status !== 'idle') return meja
    const kasur = KASUR[this.urutan.indexOf(o.id)]
    if (this.tidur && kasur) return { kunci: 'tidur', ubin: kasur.ubin, pos: kasur.pos, hadap: 'S', pose: 'tidur' }
    const s = o.santai
    if (s.tempat === null) {
      if (this.t < s.sampai) return meja
      const bebas = TEMPAT.map((t, i) => i).filter(i => !this.dipakai.has(i) && TEMPAT[i].jenis !== o.terakhir)
      let undi = Math.random() * bebas.reduce((n, i) => n + TEMPAT[i].bobot, 0)
      const pilih = bebas.find(i => (undi -= TEMPAT[i].bobot) <= 0)
      if (pilih === undefined) { s.sampai = this.t + acak(15, 40); return meja }
      s.tempat = pilih; s.sampai = null; o.terakhir = TEMPAT[pilih].jenis
      this.dipakai.add(pilih)
    }
    const t = TEMPAT[s.tempat]
    return { kunci: 'tempat' + s.tempat, ubin: t.ubin, pos: t.pos, hadap: t.hadap, pose: t.pose, lama: t.lama }
  }

  langkah(dt) {
    this.t += dt
    for (const o of this.orang.values()) this.gerak(o, dt)
  }

  gerak(o, dt) {
    if (!o.bicara && o.antre.length) this.mulaiBicara(o, o.antre.shift())
    const n = this.niat(o)
    if (o.santai.tempat !== null && n.kunci !== 'tempat' + o.santai.tempat) this.lepas(o)   // dipanggil kerja / rapat / tidur
    if (n.kunci !== o.niat?.kunci) {
      o.niat = n; o.tiba = false
      o.jalur = cariJalan(this.peta, o.ubin, n.ubin)
      if (!o.jalur) { o.jalur = []; o.ubin = n.ubin; o.x = n.pos[0]; o.z = n.pos[1] }   // tidak ada jalan: langsung pindah
    } else o.niat = n     // pose bisa berubah di tempat yang sama (duduk <-> ketik)

    if (!o.tiba) {
      const [tx, tz] = o.jalur.length ? tengah(o.jalur[0]) : o.niat.pos
      const dx = tx - o.x, dz = tz - o.z, jarak = Math.hypot(dx, dz), maju = LAJU * dt
      if (jarak <= maju) {
        o.x = tx; o.z = tz
        if (o.jalur.length) o.ubin = o.jalur.shift()
        else {
          o.tiba = true
          const m = o.niat.menghadap
          o.sudutTuju = m ? Math.atan2(m.x - o.x, m.z - o.z) : SUDUT[o.niat.hadap ?? 'S']
          if (o.niat.lama) o.santai.sampai = this.t + acak(o.niat.lama[0], o.niat.lama[1])
        }
      } else {
        o.x += dx / jarak * maju; o.z += dz / jarak * maju
        o.sudutTuju = Math.atan2(dx, dz)
      }
      o.pose = o.tiba ? o.niat.pose : 'jalan'
    } else {
      o.pose = o.niat.pose
      if (o.santai.tempat !== null && o.santai.sampai !== null && this.t > o.santai.sampai) this.lepas(o)
    }
    // putar halus lewat jalur terpendek
    if (o.sudutTuju !== undefined) {
      let d = o.sudutTuju - o.sudut
      d = Math.atan2(Math.sin(d), Math.cos(d))
      o.sudut += d * Math.min(1, dt * 12)
    }
    if (o.bicara && (!o.bicara.niat || (o.tiba && o.niat === o.bicara.niat))) {
      o.bicara.tampil = true
      o.bicara.sisa -= dt
      if (o.bicara.sisa <= 0) o.bicara = null
    }
  }
}
