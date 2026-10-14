// Status line karyawan (statusLine di kantor-settings.json).
//
// Claude Code memberi status line data pemakaian langganan Pro: persentase limit 5 jam dan
// mingguan beserta jam reset-nya (`rate_limits`). Data ini disimpan ke
// ~/.pixel-agents/kantor-kuota.json supaya Pixel Office bisa menampilkan indikator kuota.
// Semua karyawan memakai akun yang sama, jadi cukup satu file: data terbaru yang menang.
//
// Berjalan hanya saat tampilan terminal karyawan diperbarui (setelah ada jawaban), bukan terus.
// Pemakaian: node status-kantor.mjs <id karyawan>   (input JSON status line di stdin)
import { readFileSync, writeFileSync, renameSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const id = process.argv[2] ?? ''
let data = {}
try { data = JSON.parse(readFileSync(0, 'utf8')) } catch {}

const rl = data.rate_limits
const jendela = w => (w && Number.isFinite(w.used_percentage)
  ? { persen: Math.round(w.used_percentage * 10) / 10, reset: w.resets_at ?? null }
  : null)
const limaJam = jendela(rl?.five_hour)
const mingguan = jendela(rl?.seven_day)

if (limaJam || mingguan) {
  const dir = join(homedir(), '.pixel-agents')
  try {
    mkdirSync(dir, { recursive: true })
    const file = join(dir, 'kantor-kuota.json')
    // Tulis ke file sementara lalu ganti nama, supaya server tidak membaca file setengah jadi.
    writeFileSync(file + `.${id}.tmp`, JSON.stringify({ akun: 'Claude Pro', limaJam, mingguan, dari: id, waktu: Date.now() }))
    renameSync(file + `.${id}.tmp`, file)
  } catch {}
}

// Baris yang tampil di terminal karyawan (kalau jendelanya dibuka lewat Lihat Kantor).
const teks = [
  data.model?.display_name,
  limaJam && `5 jam ${Math.round(limaJam.persen)}%`,
  mingguan && `mingguan ${Math.round(mingguan.persen)}%`,
].filter(Boolean).join(' · ')
process.stdout.write(teks || 'Kantor Ricko')
