// Hook SessionStart karyawan: membacakan "jobdesk tambahan" yang diatur Pak Ricko lewat dashboard
// Staff di Kantor 3D. Apa pun yang dicetak hook SessionStart masuk ke konteks karyawan, jadi
// daftar ini terbaca setiap sesi dibuka, dilanjutkan, atau selesai dipadatkan (compact).
//
// Daftarnya disimpan di ~/.kantor-ricko/kantor-karyawan.json (di luar repo, ditulis server Kantor 3D
// Office). Kosong / belum ada = tidak mencetak apa-apa. Script biasa, tidak memakai kuota Claude.
//
// Pemakaian (di kantor-settings.json tiap karyawan): node tools/jobdesk.mjs <id karyawan>
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const id = process.argv[2] ?? ''
const dir = process.env.KANTOR_DIR ?? join(homedir(), '.kantor-ricko')   // env: untuk pengujian
let daftar = []
try { daftar = JSON.parse(readFileSync(join(dir, 'kantor-karyawan.json'), 'utf8'))[id]?.jobdesk ?? [] } catch {}

if (Array.isArray(daftar) && daftar.length) {
  process.stdout.write(
    'Jobdesk tambahan dari Pak Ricko (diatur lewat dashboard kantor; berlaku bersama job description di CLAUDE.md-mu):\n' +
    daftar.map(t => `- ${t}`).join('\n') + '\n',
  )
}
