// Kantor tiruan untuk menguji Kantor 3D tanpa mengganggu kantor asli: membuat folder "home" palsu
// berisi sesi Claude Code tiruan (file ~/.claude/sessions/*.json + transkrip), kuota, rapat, dan
// interkom, lalu server dijalankan dengan USERPROFILE/HOME menunjuk ke folder itu.
//
//   node uji/kantor-tiruan.mjs siapkan             buat kantor tiruan; proses ini harus tetap hidup
//                                                  (pid-nya dipakai sebagai "proses" semua sesi)
//   node uji/kantor-tiruan.mjs status ujang busy   idle | busy | waiting (waiting = menunggu izin)
//   node uji/kantor-tiruan.mjs kuota 100           persen limit 5 jam (100 = habis -> semua tidur)
//   node uji/kantor-tiruan.mjs interkom ujang kokom "Teh, minta aturan lembur"
//   node uji/kantor-tiruan.mjs rapat mulai|selesai
//
// Folder home palsu: env KANTOR_UJI_HOME (bawaan: <tmp>/kantor-uji). Jalankan server dengan:
//   USERPROFILE=<folder> HOME=<folder> node server.mjs --port 3838
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const HOME = process.env.KANTOR_UJI_HOME ?? path.join(os.tmpdir(), 'kantor-uji')
const SESI = path.join(HOME, '.claude', 'sessions'), DIR = path.join(HOME, '.kantor-ricko')
const roster = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'karyawan.json'), 'utf8'))
const tulis = (f, isi) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof isi === 'string' ? isi : JSON.stringify(isi, null, 2)) }
const fileSesi = id => path.join(SESI, `${[...roster.map(k => k.id), 'ricko'].indexOf(id) + 9001}.json`)

function sesi(id, status) {
  const cwd = id === 'ricko' ? ROOT : path.join(ROOT, 'karyawan', id)
  const lama = (() => { try { return JSON.parse(fs.readFileSync(fileSesi(id), 'utf8')) } catch { return null } })()
  const s = { pid: lama?.pid ?? process.pid, sessionId: `0000${id}`.slice(-4).replace(/[^a-z]/g, 'x') + '0000-1111-2222-3333-444444444444', cwd, startedAt: Date.now(), kind: 'interactive', name: id === 'ricko' ? 'sesi Pak Ricko' : id, status, statusUpdatedAt: Date.now() }
  if (status === 'waiting') s.waitingFor = 'permission prompt'
  tulis(fileSesi(id), s)
  // transkrip: satu tool yang sedang berjalan + pemakaian konteks, supaya status kerja & FOCUS terisi
  const alat = { 'pak-asep': ['mcp__claude_ai_Gmail__search_threads', {}], kokom: ['mcp__claude_ai_Google_Sheets__get_values', { range: 'Jurnal!A1:H200' }], ujang: ['Edit', { file_path: 'Code.gs' }], joko: ['Bash', { description: 'Run the test suite' }], neneng: ['Read', { file_path: 'penjualan-2026.csv' }], ayu: ['mcp__claude_ai_Canva__generate-design', {}] }[id] ?? ['Read', { file_path: 'README.md' }]
  const baris = [
    { type: 'user', message: { role: 'user', content: 'kerjakan' } },
    { type: 'assistant', message: { role: 'assistant', usage: { input_tokens: 1200, cache_read_input_tokens: 30000 + id.length * 9000, cache_creation_input_tokens: 4000 }, content: [{ type: 'tool_use', id: 'toolu_1', name: alat[0], input: alat[1] }] } },
  ]
  tulis(path.join(HOME, '.claude', 'projects', cwd.replace(/[^A-Za-z0-9]/g, '-'), `${s.sessionId}.jsonl`), baris.map(b => JSON.stringify(b)).join('\n') + '\n')
}

const [perintah, a, b, c] = process.argv.slice(2)
if (perintah === 'siapkan') {
  fs.rmSync(HOME, { recursive: true, force: true })
  for (const id of [...roster.map(k => k.id), 'ricko']) sesi(id, 'idle')
  tulis(path.join(DIR, 'kantor-kuota.json'), { akun: 'Claude Pro', limaJam: { persen: 42, reset: Math.floor(Date.now() / 1000) + 7200 }, mingguan: { persen: 18, reset: Math.floor(Date.now() / 1000) + 400000 }, dari: 'uji', waktu: Date.now() })
  console.log(`Kantor tiruan siap di ${HOME}. Biarkan proses ini hidup (Ctrl+C untuk mengakhiri).`)
  setInterval(() => {}, 60000)
} else if (perintah === 'status' && a && ['idle', 'busy', 'waiting'].includes(b)) {
  sesi(a, b)
} else if (perintah === 'kuota' && a) {
  tulis(path.join(DIR, 'kantor-kuota.json'), { akun: 'Claude Pro', limaJam: { persen: Number(a), reset: Math.floor(Date.now() / 1000) + 5400 }, mingguan: { persen: 31, reset: Math.floor(Date.now() / 1000) + 400000 }, dari: 'uji', waktu: Date.now() })
} else if (perintah === 'interkom' && a && b && c) {
  fs.mkdirSync(DIR, { recursive: true })
  fs.appendFileSync(path.join(DIR, 'kantor-interkom.jsonl'), JSON.stringify({ id: `${Date.now()}`, dari: a, ke: b, teks: c, waktu: Date.now() }) + '\n')
} else if (perintah === 'rapat' && (a === 'mulai' || a === 'selesai')) {
  tulis(path.join(DIR, 'kantor-rapat.json'), a === 'mulai' ? { aktif: true, topik: 'Kickoff Kedai Kopi', pemimpin: 'pak-asep', peserta: roster.map(k => k.id), sampai: new Date(Date.now() + 3600_000).toISOString() } : { aktif: false })
} else {
  console.log('Pemakaian: siapkan | status <id> <idle|busy|waiting> | kuota <persen> | interkom <dari> <ke> "<teks>" | rapat <mulai|selesai>')
  process.exit(1)
}
