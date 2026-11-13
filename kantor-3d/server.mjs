// Server Kantor 3D: tampilan kantor virtual Kantor Ricko di browser (Three.js), mandiri.
// Tidak memakai paket pihak ketiga selain three (yang hanya disajikan ke browser).
//
// Yang dikerjakan:
//   1. Menyajikan halaman (web/) dan Three.js (node_modules/three/build -> /vendor/).
//   2. Membaca keadaan kantor tiap 1,5 detik dan menyiarkannya ke browser (Server-Sent Events):
//        - siapa yang hadir & sedang apa: ~/.claude/sessions/<pid>.json (status asli Claude Code:
//          idle / busy / waiting) + ekor transkrip sesi (tool yang sedang dipakai, isi konteks)
//        - kuota langganan: <DIR>/kantor-kuota.json (ditulis tools/status-kantor.mjs)
//        - rapat: <DIR>/kantor-rapat.json (ditulis tools/rapat.mjs)
//        - interkom: baris baru di <DIR>/kantor-interkom.jsonl (ditulis tools/interkom-log.mjs)
//   3. API panel Staff: model AI & job desk tiap karyawan (<DIR>/kantor-karyawan.json), buka ulang.
//
// <DIR> = %USERPROFILE%\.kantor-ricko (env KANTOR_DIR untuk pengujian). Semua rute /api/ wajib
// membawa token (Authorization: Bearer <token> atau ?token=); server hanya mendengar di 127.0.0.1.
// Token disimpan di <DIR>/token.txt supaya alamat kantor tetap sama setiap server dinyalakan.
//
// Jalankan: node kantor-3d/server.mjs [--port 3737]
import http from 'node:http'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const WEB = path.join(HERE, 'web')
const VENDOR = path.join(HERE, 'node_modules', 'three', 'build')
const POLA_MODEL = /^[A-Za-z0-9._\[\]-]{1,80}$/
const JENDELA_KONTEKS = 200_000   // sama dengan CLAUDE_CODE_AUTO_COMPACT_WINDOW di kantor-settings.json

export const dirKantor = () => process.env.KANTOR_DIR ?? path.join(os.homedir(), '.kantor-ricko')
const baca = (f, cadangan) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')) } catch { return cadangan } }
const roster = () => baca(path.join(ROOT, 'tools', 'karyawan.json'), [])
const samaJalur = (a, b) => path.resolve(String(a)).toLowerCase() === path.resolve(String(b)).toLowerCase()

/** Status kerja dalam bahasa manusia dari nama tool + inputnya, mis. "Reading Google Sheets (Data!A1:H50)". */
export function statusAlat(nama, input) {
  const i = input || {}
  const pendek = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n) + '…' : s }
  const file = p => pendek(String(p || '').split(/[\\/]/).pop(), 32)
  switch (nama) {
    case 'Read': return 'Reading ' + file(i.file_path)
    case 'Edit': case 'MultiEdit': return 'Editing ' + file(i.file_path)
    case 'Write': return 'Writing ' + file(i.file_path)
    case 'Bash': case 'PowerShell': return i.description ? pendek(i.description, 40) : 'Running a command'
    case 'Glob': return 'Searching files'
    case 'Grep': return 'Searching in files'
    case 'WebFetch': return 'Opening a web page'
    case 'WebSearch': return 'Searching the web'
    case 'Task': case 'Agent': return i.description ? 'Delegating: ' + pendek(i.description, 30) : 'Delegating to a helper'
    case 'SendMessage': return i.to ? 'Intercom to ' + i.to : 'Sending intercom'
    case 'ToolSearch': return 'Preparing tools'
    case 'TodoWrite': return 'Planning tasks'
    case 'Skill': return 'Opening SOP ' + pendek(i.skill || i.name, 24)
  }
  const m = /^mcp__(.+?)__(.+)$/.exec(String(nama))
  if (!m) return 'Using ' + pendek(nama, 30)
  const [, server, aksi] = m
  if (/discord/i.test(server)) return /react/.test(aksi) ? 'Reacting on Discord' : /fetch|download/.test(aksi) ? 'Reading Discord' : 'Replying on Discord'
  if (/chrome/i.test(server)) return 'Using Chrome'
  const layanan = server.replace(/^claude_ai_|^plugin_[^_]+_/, '').replace(/_/g, ' ')
  const kata = /^(get|read|list|fetch|view|describe|query|download)/.test(aksi) ? 'Reading'
    : /^(search|find)/.test(aksi) ? 'Searching'
    : /^(create|generate|copy|add|insert|append|upload)/.test(aksi) ? 'Adding to'
    : /^(update|edit|set|apply|move|rename|batch_update|write)/.test(aksi) ? 'Updating'
    : /^(delete|trash|remove|clear|batch_clear)/.test(aksi) ? 'Deleting in'
    : /^(send|reply|forward|publish|share)/.test(aksi) ? 'Sending via' : 'Using'
  const rentang = i.range || (i.ranges && i.ranges[0])
  return `${kata} ${layanan}${rentang ? ` (${pendek(rentang, 24)})` : ''}`
}

function hidup(pid) {
  try { process.kill(pid, 0); return true } catch (e) { return e.code === 'EPERM' }
}

/** Sesi Claude Code yang prosesnya masih hidup. */
function bacaSesi() {
  const dir = path.join(os.homedir(), '.claude', 'sessions'), hasil = []
  let daftar = []
  try { daftar = fs.readdirSync(dir) } catch {}
  for (const f of daftar) {
    if (!f.endsWith('.json')) continue
    const s = baca(path.join(dir, f), null)
    if (s && s.pid && s.sessionId && hidup(s.pid)) hasil.push(s)
  }
  return hasil
}

const ekorCache = new Map()
/** Dari ekor transkrip sesi: tool yang sedang berjalan (kalau ada) dan persen konteks terpakai. */
function bacaEkor(sesi) {
  const file = path.join(os.homedir(), '.claude', 'projects', String(sesi.cwd).replace(/[^A-Za-z0-9]/g, '-'), `${sesi.sessionId}.jsonl`)
  let st
  try { st = fs.statSync(file) } catch { return { kegiatan: '', konteks: null } }
  const lama = ekorCache.get(file)
  if (lama && lama.size === st.size && lama.mtime === st.mtimeMs) return lama.hasil
  const panjang = Math.min(st.size, 128 * 1024), buf = Buffer.alloc(panjang)
  const fd = fs.openSync(file, 'r')
  try { fs.readSync(fd, buf, 0, panjang, st.size - panjang) } finally { fs.closeSync(fd) }
  let alat = null, konteks = null
  for (const baris of buf.toString('utf8').split('\n')) {
    let e
    try { e = JSON.parse(baris) } catch { continue }   // baris pertama ekor biasanya terpotong
    if (e.isSidechain || !e.message) continue
    const isi = Array.isArray(e.message.content) ? e.message.content : []
    if (e.type === 'assistant') {
      const u = e.message.usage
      if (u) konteks = Math.min(100, Math.round(((u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0)) / JENDELA_KONTEKS * 100))
      for (const b of isi) if (b.type === 'tool_use') alat = b
      if (!isi.some(b => b.type === 'tool_use')) alat = null
    } else if (e.type === 'user') {
      if (alat && isi.some(b => b.type === 'tool_result' && b.tool_use_id === alat.id)) alat = null
    }
  }
  const hasil = { kegiatan: alat ? statusAlat(alat.name, alat.input) : '', konteks }
  ekorCache.set(file, { size: st.size, mtime: st.mtimeMs, hasil })
  if (ekorCache.size > 40) ekorCache.delete(ekorCache.keys().next().value)
  return hasil
}

function statusSesi(s) {
  if (s.status === 'busy') return 'working'
  if (s.status === 'waiting') return /permission/i.test(s.waitingFor || '') ? 'approval' : 'waiting'
  return 'idle'
}

/** Keadaan kantor saat ini (yang disiarkan ke browser). */
export function bangunKeadaan() {
  const sesi = bacaSesi(), dir = dirKantor()
  const orang = (id, nama, jabatan, milik) => {
    const s = milik.sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0))
    // Pemilik bisa punya beberapa sesi: tampil bekerja kalau salah satunya bekerja.
    const utama = s.find(x => x.status === 'busy') ?? s.find(x => x.status === 'waiting') ?? s[0]
    if (!utama) return { id, nama, jabatan, hadir: false, status: 'off', kegiatan: '', konteks: null }
    const status = statusSesi(utama), ekor = bacaEkor(utama)
    return { id, nama, jabatan, hadir: true, status, kegiatan: status === 'working' ? ekor.kegiatan : '', konteks: ekor.konteks }
  }
  const daftar = roster()
  const ids = new Set(daftar.map(k => k.id))
  const karyawan = [
    orang('ricko', 'Pak Ricko', 'Owner', sesi.filter(s => !ids.has(s.name) && samaJalur(s.cwd, ROOT))),
    ...daftar.map(k => orang(k.id, k.nama, k.jabatan ?? k.role, sesi.filter(s => s.name === k.id))),
  ]
  const rapat = baca(path.join(dir, 'kantor-rapat.json'), null)
  const rapatAktif = !!(rapat && rapat.aktif && (!rapat.sampai || Date.parse(rapat.sampai) > Date.now()))
  return {
    karyawan,
    kuota: baca(path.join(dir, 'kantor-kuota.json'), null),
    rapat: rapatAktif ? { topik: rapat.topik ?? '', pemimpin: rapat.pemimpin ?? '', peserta: Array.isArray(rapat.peserta) ? rapat.peserta : null } : null,
  }
}

/** Pilihan model: alias keluarga ("opus" = Opus terbaru) + model yang dikenal Claude Code di PC ini. */
export function daftarModel() {
  const c = baca(path.join(os.homedir(), '.claude.json'), {})
  const keluarga = c.cachedGrowthBookFeatures?.tengu_wobbly_petal?.sessionModelFamilies
  const urut = ['haiku', 'sonnet', 'opus']
  for (const k of Array.isArray(keluarga) ? keluarga : []) if (typeof k === 'string' && k !== 'other' && !urut.includes(k)) urut.push(k)
  const hasil = [], ada = new Set()
  const tambah = (nilai, label, ket) => {
    if (typeof nilai !== 'string' || ada.has(nilai) || !POLA_MODEL.test(nilai)) return
    ada.add(nilai); hasil.push({ nilai, label, ket: ket || '' })
  }
  for (const k of urut) tambah(k, `${k[0].toUpperCase()}${k.slice(1)} (latest)`, `Always the newest ${k} model`)
  for (const m of Array.isArray(c.additionalModelOptionsCache) ? c.additionalModelOptionsCache : []) if (m) tambah(m.value, (m.label ? m.label + ' · ' : '') + m.value, m.description)
  for (const id of Object.values(c.clientDataCacheSlots || {}).map(s => s && s.model).filter(Boolean).sort()) tambah(id, id, 'Exact version')
  return hasil
}

function pengaturanStaff() {
  const atur = baca(path.join(dirKantor(), 'kantor-karyawan.json'), {})
  return {
    model: daftarModel(),
    karyawan: roster().map(k => {
      const s = baca(path.join(ROOT, 'karyawan', k.id, 'kantor-settings.json'), {}), a = atur[k.id] || {}
      return { id: k.id, nama: k.nama, jabatan: k.jabatan ?? k.role, role: k.role, modelBawaan: s.model || '', model: a.model || s.model || '', jobdesk: Array.isArray(a.jobdesk) ? a.jobdesk : [] }
    }),
  }
}

function simpanStaff(id, b) {
  if (!roster().some(k => k.id === id)) return [404, { error: 'Unknown employee' }]
  const dir = dirKantor(), file = path.join(dir, 'kantor-karyawan.json'), atur = baca(file, {}), a = atur[id] || {}
  if (b.model !== undefined) {
    if (b.model !== '' && !POLA_MODEL.test(String(b.model))) return [400, { error: 'Invalid model name' }]
    if (b.model) a.model = String(b.model); else delete a.model
  }
  if (b.jobdesk !== undefined) {
    if (!Array.isArray(b.jobdesk) || b.jobdesk.length > 30) return [400, { error: 'Invalid job desk (max 30 items)' }]
    a.jobdesk = b.jobdesk.map(t => String(t).replace(/\s+/g, ' ').trim().slice(0, 300)).filter(Boolean)
  }
  atur[id] = a
  fs.mkdirSync(dir, { recursive: true })
  // tulis ke file sementara lalu ganti nama, supaya pembaca tidak pernah melihat file setengah jadi
  fs.writeFileSync(file + '.tmp', JSON.stringify(atur, null, 2))
  fs.renameSync(file + '.tmp', file)
  return [200, { ok: true }]
}

function bukaUlang(id) {
  if (!roster().some(k => k.id === id)) return Promise.resolve([404, { error: 'Unknown employee' }])
  if (process.platform !== 'win32') return Promise.resolve([501, { error: 'Restart only works on the office PC' }])
  const skrip = path.join(ROOT, 'tools', 'buka-ulang-karyawan.ps1')
  return new Promise(selesai => {
    execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', skrip, '-Id', id], { timeout: 60000, windowsHide: true },
      (err, stdout) => selesai([200, { ok: !err, hasil: err ? 'failed' : /SIBUK/.test(String(stdout)) ? 'busy' : 'restarted' }]))
  })
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.glb': 'model/gltf-binary' }

function sajikan(res, dasar, nama, lama) {
  const file = path.resolve(dasar, nama)
  if (!file.startsWith(dasar + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end('Not found'); return }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': lama ? 'max-age=86400' : 'no-cache' })
  fs.createReadStream(file).pipe(res)
}

function bacaBadan(req) {
  return new Promise((selesai, gagal) => {
    let isi = ''
    req.on('data', d => { isi += d; if (isi.length > 65536) { gagal(new Error('terlalu besar')); req.destroy() } })
    req.on('end', () => { try { selesai(isi ? JSON.parse(isi) : {}) } catch (e) { gagal(e) } })
    req.on('error', gagal)
  })
}

/** Nyalakan server. Mengembalikan { server, port, token, url, tutup }. */
export async function mulaiServer({ port = 3737 } = {}) {
  const dir = dirKantor()
  fs.mkdirSync(dir, { recursive: true })
  const fileToken = path.join(dir, 'token.txt')
  let token = ''
  try { token = fs.readFileSync(fileToken, 'utf8').trim() } catch {}
  if (!/^[0-9a-f-]{36}$/.test(token)) { token = crypto.randomUUID(); fs.writeFileSync(fileToken, token) }

  const tokenSah = (req, url) => {
    const diberi = Buffer.from((req.headers.authorization ?? '').replace(/^Bearer /, '') || url.searchParams.get('token') || '')
    const benar = Buffer.from(token)
    return diberi.length === benar.length && crypto.timingSafeEqual(diberi, benar)
  }
  const json = (res, kode, isi) => { res.writeHead(kode, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(isi)) }

  const pendengar = new Set()
  const siar = (acara, isi) => { for (const res of pendengar) res.write(`event: ${acara}\ndata: ${JSON.stringify(isi)}\n\n`) }
  let keadaan = bangunKeadaan(), teksKeadaan = JSON.stringify(keadaan)

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1')
      const jalur = decodeURIComponent(url.pathname)
      if (jalur === '/' || jalur === '/index.html') return sajikan(res, WEB, 'index.html')
      if (jalur.startsWith('/web/')) return sajikan(res, WEB, jalur.slice(5))
      if (jalur === '/vendor/three.module.js' || jalur === '/vendor/three.core.js') return sajikan(res, VENDOR, jalur.slice(8), true)
      if (jalur.startsWith('/vendor/jsm/')) return sajikan(res, path.join(VENDOR, '..', 'examples', 'jsm'), jalur.slice(12), true)   // GLTFLoader dkk.
      if (!jalur.startsWith('/api/')) { res.writeHead(404).end('Not found'); return }
      if (!tokenSah(req, url)) return json(res, 401, { error: 'Not authorized. Open the office from its own link.' })

      if (req.method === 'GET' && jalur === '/api/state') return json(res, 200, keadaan)
      if (req.method === 'GET' && jalur === '/api/events') {
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' })
        res.write(`event: state\ndata: ${teksKeadaan}\n\n`)
        pendengar.add(res)
        req.on('close', () => pendengar.delete(res))
        return
      }
      if (req.method === 'GET' && jalur === '/api/karyawan') return json(res, 200, pengaturanStaff())
      const m = /^\/api\/karyawan\/([a-z0-9-]+)(\/buka-ulang)?$/.exec(jalur)
      if (req.method === 'POST' && m) {
        const [kode, isi] = m[2] ? await bukaUlang(m[1]) : simpanStaff(m[1], await bacaBadan(req))
        return json(res, kode, isi)
      }
      json(res, 404, { error: 'Not found' })
    } catch (e) {
      if (!res.headersSent) json(res, 400, { error: 'Bad request' }); else res.end()
    }
  })

  const jam = []
  // Keadaan kantor: disiarkan hanya kalau berubah.
  jam.push(setInterval(() => {
    keadaan = bangunKeadaan()
    const teks = JSON.stringify(keadaan)
    if (teks !== teksKeadaan) { teksKeadaan = teks; siar('state', keadaan) }
  }, 1500))
  jam.push(setInterval(() => { for (const res of pendengar) res.write(': hidup\n\n') }, 20000))
  // Interkom: baca hanya baris yang baru ditambahkan sejak pemeriksaan terakhir.
  const fInterkom = path.join(dir, 'kantor-interkom.jsonl')
  let posisi = -1
  jam.push(setInterval(() => {
    let st
    try { st = fs.statSync(fInterkom) } catch { posisi = 0; return }
    if (posisi < 0 || st.size < posisi) { posisi = st.size; return }   // server baru menyala / file dipangkas: pesan lama tidak diputar ulang
    if (st.size === posisi) return
    const buf = Buffer.alloc(st.size - posisi), fd = fs.openSync(fInterkom, 'r')
    try { fs.readSync(fd, buf, 0, buf.length, posisi) } finally { fs.closeSync(fd) }
    posisi = st.size
    for (const baris of buf.toString('utf8').split('\n')) { try { if (baris.trim()) siar('interkom', JSON.parse(baris)) } catch {} }
    if (st.size > 262144) { try { fs.writeFileSync(fInterkom, ''); posisi = 0 } catch {} }   // jangan tumbuh tanpa batas
  }, 1000))

  await new Promise((selesai, gagal) => { server.once('error', gagal); server.listen(port, '127.0.0.1', selesai) })
  const portNyata = server.address().port
  const url = `http://127.0.0.1:${portNyata}/?token=${token}`
  const fileServer = path.join(dir, 'server.json')
  fs.writeFileSync(fileServer, JSON.stringify({ pid: process.pid, port: portNyata, token, url, mulai: Date.now() }, null, 2))
  const tutup = () => {
    jam.forEach(clearInterval)
    for (const res of pendengar) res.end()
    try { if (baca(fileServer, {}).pid === process.pid) fs.unlinkSync(fileServer) } catch {}
    return new Promise(selesai => { server.close(selesai); server.closeAllConnections?.() })
  }
  return { server, port: portNyata, token, url, tutup }
}

if (process.argv[1] && samaJalur(process.argv[1], fileURLToPath(import.meta.url))) {
  const i = process.argv.indexOf('--port')
  const port = i > 0 ? Number(process.argv[i + 1]) : 3737
  if (!fs.existsSync(path.join(VENDOR, 'three.module.js'))) { console.error('Three.js belum terpasang. Jalankan: npm install (di folder kantor-3d)'); process.exit(1) }
  mulaiServer({ port }).then(s => {
    console.log(`Kantor 3D menyala: ${s.url}`)
    const berhenti = () => s.tutup().then(() => process.exit(0))
    process.on('SIGINT', berhenti); process.on('SIGTERM', berhenti)
  }).catch(e => { console.error('Kantor 3D gagal menyala:', e.message); process.exit(1) })
}
