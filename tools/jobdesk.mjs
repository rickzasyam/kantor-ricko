// Hook SessionStart karyawan: membacakan "jobdesk tambahan" yang diatur Pak Ricko lewat dashboard
// Staff di Pixel Office. Apa pun yang dicetak hook SessionStart masuk ke konteks karyawan, jadi
// daftar ini terbaca setiap sesi dibuka, dilanjutkan, atau selesai dipadatkan (compact).
//
// Daftarnya disimpan di ~/.pixel-agents/kantor-karyawan.json (di luar repo, ditulis server Pixel
// Office). Kosong / belum ada = tidak mencetak apa-apa. Script biasa, tidak memakai kuota Claude.
//
// Pemakaian (di kantor-settings.json tiap karyawan): node tools/jobdesk.mjs <id karyawan>
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const id = process.argv[2] ?? ''
const dir = process.env.KANTOR_PIXEL_DIR ?? join(homedir(), '.pixel-agents')   // env: untuk pengujian
let daftar = []
try { daftar = JSON.parse(readFileSync(join(dir, 'kantor-karyawan.json'), 'utf8'))[id]?.jobdesk ?? [] } catch {}

if (Array.isArray(daftar) && daftar.length) {
  process.stdout.write(
    'Jobdesk tambahan dari Pak Ricko (diatur lewat dashboard kantor; berlaku bersama job description di CLAUDE.md-mu):\n' +
    daftar.map(t => `- ${t}`).join('\n') + '\n',
  )
}
