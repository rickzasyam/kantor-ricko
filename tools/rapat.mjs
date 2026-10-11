// Mode rapat di Pixel Office: karakter peserta berjalan ke Ruang Rapat dan duduk di sana
// sampai rapat ditutup, lalu kembali ke mejanya.
//
//   node tools/rapat.mjs mulai --topik "Kickoff Kedai Kopi" [--peserta pak-asep,kokom,ujang] [--menit 60]
//   node tools/rapat.mjs selesai
//   node tools/rapat.mjs status
//
// Tanpa --peserta semua karyawan ikut. Rapat otomatis dianggap selesai setelah --menit
// (bawaan 60) kalau lupa ditutup. Pixel Office membaca file ~/.pixel-agents/kantor-rapat.json
// (lihat patch "mode rapat" di pixel-office/patch-pixel-agents.mjs).
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const FILE = path.join(os.homedir(), '.pixel-agents', 'kantor-rapat.json')
const karyawan = JSON.parse(fs.readFileSync(path.join(HERE, 'karyawan.json'), 'utf8'))

// pixel-agents menamai karakter dengan bagian terakhir nama folder sesi (pak-asep -> asep).
const namaPixel = id => id.split('-').pop().toLowerCase()

function opsi(nama) {
  const i = process.argv.indexOf(`--${nama}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}

function baca() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch { return null }
}

const perintah = process.argv[2]
if (perintah === 'mulai') {
  const daftar = (opsi('peserta') ?? karyawan.map(k => k.id).join(',')).split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  const peserta = []
  for (const p of daftar) {
    const k = karyawan.find(k => k.id === p || namaPixel(k.id) === p || k.nama.toLowerCase() === p)
    if (!k) { console.error(`Peserta tidak dikenal: ${p}. Pilihan: ${karyawan.map(k => k.id).join(', ')}`); process.exit(1) }
    peserta.push(k)
  }
  const menit = Number(opsi('menit') ?? 60)
  const topik = opsi('topik') ?? 'Rapat tim'
  const data = {
    aktif: true,
    topik,
    ruang: 'Ruang Rapat',
    pemimpin: 'asep',
    peserta: peserta.map(k => namaPixel(k.id)),
    mulai: new Date().toISOString(),
    sampai: new Date(Date.now() + menit * 60_000).toISOString(),
  }
  fs.mkdirSync(path.dirname(FILE), { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2))
  console.log(`Rapat "${topik}" dimulai (maks. ${menit} menit). Peserta menuju Ruang Rapat: ${peserta.map(k => k.nama).join(', ')}.`)
} else if (perintah === 'selesai') {
  const lama = baca()
  fs.mkdirSync(path.dirname(FILE), { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify({ aktif: false, topik: lama?.topik, selesai: new Date().toISOString() }, null, 2))
  console.log('Rapat selesai. Peserta kembali ke mejanya.')
} else if (perintah === 'status') {
  const d = baca()
  const aktif = d?.aktif && (!d.sampai || Date.parse(d.sampai) > Date.now())
  console.log(aktif ? `Rapat "${d.topik}" sedang berlangsung sampai ${new Date(d.sampai).toLocaleTimeString('id-ID')}. Peserta: ${d.peserta.join(', ')}.` : 'Tidak ada rapat.')
} else {
  console.log('Pemakaian: node tools/rapat.mjs mulai --topik "<topik>" [--peserta pak-asep,kokom] [--menit 60] | selesai | status')
  process.exit(perintah ? 1 : 0)
}
