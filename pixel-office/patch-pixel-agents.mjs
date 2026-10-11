// Patch pixel-agents 1.4.1 untuk Kantor Ricko. Diterapkan ke salinan asli dist/cli.js
// (disimpan sebagai cli.js.asli), jadi aman dijalankan berulang kali dan setelah patch diubah.
//
// 1. Karakter tetap per karyawan: fungsi pemilih karakter (`ae`) membaca file JSON di env
//    KANTOR_KARAKTER ({ "<nama folder>": <nomor karakter> }) sebelum mengundi karakter.
// 2. Pulihkan karyawan saat server menyala: bawaannya agen lama baru dipulihkan saat browser
//    tersambung, padahal sebelum itu server sudah menimpa daftar agen dengan sesi yang baru
//    terdeteksi -- karyawan yang sedang menganggur jadi hilang dari kantor.
//
// Jalankan ulang setelah `npm install`.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PKG = path.join(HERE, 'node_modules', 'pixel-agents')
const CLI = path.join(PKG, 'dist', 'cli.js')
const ASLI = `${CLI}.asli`

const PATCHES = [
  {
    nama: 'karakter tetap per karyawan',
    cari: 'function ae(t,e){if(t.palette!==void 0)return;',
    ganti:
      'var __kantorPeta;function __kantorKarakter(t){try{if(__kantorPeta===void 0){var f=process.env.KANTOR_KARAKTER;' +
      '__kantorPeta=f?JSON.parse(require("fs").readFileSync(f,"utf8")):null}}catch(e){__kantorPeta=null}' +
      'if(!__kantorPeta||!t.folderName)return void 0;var v=__kantorPeta[String(t.folderName).toLowerCase()];' +
      'return typeof v==="number"&&v>=0&&v<64?v:void 0}' +
      'function ae(t,e){var __k=__kantorKarakter(t);if(__k!==void 0){t.palette=__k;t.hueShift=0;return}' +
      'if(t.palette!==void 0)return;',
  },
  {
    nama: 'pulihkan karyawan saat server menyala',
    cari: 'u.startProjectScan(x),u.startExternalScanning(x),u.startStaleCheck()',
    ganti: 'u.restoreExternalAgents(),u.startProjectScan(x),u.startExternalScanning(x),u.startStaleCheck()',
  },
]

const versi = JSON.parse(fs.readFileSync(path.join(PKG, 'package.json'), 'utf8')).version
if (!fs.existsSync(ASLI)) {
  const sekarang = fs.readFileSync(CLI, 'utf8')
  if (sekarang.includes('__kantorKarakter')) {
    console.error('cli.js sudah ter-patch tapi salinan aslinya tidak ada. Pasang ulang: hapus node_modules\\pixel-agents lalu npm install.')
    process.exit(1)
  }
  fs.copyFileSync(CLI, ASLI)
}

let js = fs.readFileSync(ASLI, 'utf8')
for (const p of PATCHES) {
  const jumlah = js.split(p.cari).length - 1
  if (jumlah !== 1) {
    console.error(`pixel-agents ${versi}: titik patch "${p.nama}" ditemukan ${jumlah}x (harus 1). Versi berubah? Patch dibatalkan.`)
    process.exit(1)
  }
  js = js.replace(p.cari, p.ganti)
}
fs.writeFileSync(CLI, js)
console.log(`pixel-agents ${versi}: ${PATCHES.length} patch terpasang (${PATCHES.map(p => p.nama).join('; ')}).`)
