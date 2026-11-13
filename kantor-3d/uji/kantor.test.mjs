// Uji Kantor 3D tanpa browser: denah bisa dijalani, perilaku (interkom, tidur, rapat) benar, dan
// server membaca kantor tiruan lalu menyiarkannya. Jalankan: npm test (di folder kantor-3d).
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { bangunPeta, cariJalan, KURSI, KASUR, KURSI_RAPAT, TEMPAT, FURNITUR, TAPAK } from '../web/denah.js'
import { Simulasi } from '../web/simulasi.js'

const peta = bangunPeta()
const AWAL = [7, 15]     // lorong di Ruang Kerja

test('denah: semua kursi, futon, kursi rapat, dan tempat santai bisa didatangi', () => {
  assert.ok(peta.bisa(...AWAL))
  const tujuan = [...KURSI.map(k => ['kursi ' + k.pemilik, k.ubin]), ...KASUR.map((k, i) => ['futon ' + i, k.ubin]), ...KURSI_RAPAT.map((k, i) => ['kursi rapat ' + i, k.ubin]), ...TEMPAT.map((t, i) => [`tempat ${i} (${t.jenis})`, t.ubin])]
  for (const [nama, ubin] of tujuan) assert.ok(cariJalan(peta, AWAL, ubin), `${nama} di ${ubin} tidak bisa didatangi`)
  for (const f of FURNITUR) assert.ok(TAPAK[f.j], `tapak ${f.j}`)
})

const keadaan = (status = {}, rapat = null) => ({ rapat, karyawan: ['pak-asep', 'kokom', 'ujang'].map(id => ({ id, nama: id, hadir: true, status: status[id] ?? 'idle' })) })
const maju = (sim, detik) => { for (let i = 0; i < detik * 20; i++) sim.langkah(0.05) }

test('simulasi: interkom membuat pengirim mendatangi penerima lalu kembali bekerja', () => {
  const sim = new Simulasi(peta, ['pak-asep', 'kokom', 'ujang'])
  sim.setel(keadaan({ ujang: 'working', kokom: 'working' }), false)
  maju(sim, 1)
  const ujang = sim.orang.get('ujang'), kokom = sim.orang.get('kokom')
  assert.equal(ujang.pose, 'ketik')
  sim.interkom({ dari: 'ujang', ke: 'kokom', teks: 'Teh, minta aturan lembur' })
  maju(sim, 4)
  assert.ok(ujang.bicara?.tampil, 'gelembung tampil')
  assert.equal(ujang.pose, 'bicara')
  assert.equal(Math.abs(ujang.ubin[0] - kokom.ubin[0]) + Math.abs(ujang.ubin[1] - kokom.ubin[1]), 1, 'berdiri di sebelah penerima')
  maju(sim, 12)
  assert.equal(ujang.bicara, null)
  assert.equal(ujang.pose, 'ketik', 'kembali ke mejanya')
})

test('simulasi: kuota habis = tidur di futon sendiri, kerja membangunkan', () => {
  const sim = new Simulasi(peta, ['pak-asep', 'kokom', 'ujang'])
  sim.setel(keadaan(), true)
  maju(sim, 40)
  for (const [i, id] of ['pak-asep', 'kokom', 'ujang'].entries()) {
    const o = sim.orang.get(id)
    assert.equal(o.pose, 'tidur', id)
    assert.deepEqual(o.ubin, KASUR[i].ubin, 'futon ' + id)
  }
  sim.setel(keadaan({ ujang: 'working' }), true)
  maju(sim, 40)
  assert.equal(sim.orang.get('ujang').pose, 'ketik')
  assert.equal(sim.orang.get('kokom').pose, 'tidur')
})

test('simulasi: rapat mengumpulkan peserta di Ruang Rapat, pemimpin di kepala meja', () => {
  const sim = new Simulasi(peta, ['pak-asep', 'kokom', 'ujang'])
  sim.setel(keadaan({}, { topik: 'x', pemimpin: 'pak-asep', peserta: ['pak-asep', 'kokom'] }), false)
  maju(sim, 40)
  assert.deepEqual(sim.orang.get('pak-asep').ubin, KURSI_RAPAT[0].ubin)
  assert.equal(peta.ruang[peta.idx(...sim.orang.get('kokom').ubin)], 'rapat')
  assert.notEqual(peta.ruang[peta.idx(...sim.orang.get('ujang').ubin)], 'rapat', 'bukan peserta tidak ikut')
})

test('server: membaca kantor tiruan, menjaga API dengan token, menyimpan pilihan Staff, menyiarkan interkom', async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'kantor-uji-'))
  process.env.USERPROFILE = process.env.HOME = home
  delete process.env.KANTOR_DIR
  const { mulaiServer, dirKantor } = await import('../server.mjs')
  const root = path.resolve(import.meta.dirname, '..', '..'), cwd = path.join(root, 'karyawan', 'ujang')
  const tulis = (f, isi) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, isi) }
  tulis(path.join(home, '.claude', 'sessions', '1.json'), JSON.stringify({ pid: process.pid, sessionId: 'abc', cwd, name: 'ujang', status: 'busy', startedAt: 1 }))
  tulis(path.join(home, '.claude', 'sessions', '2.json'), JSON.stringify({ pid: 999999, sessionId: 'mati', cwd, name: 'kokom', status: 'busy' }))   // proses sudah mati
  tulis(path.join(home, '.claude', 'projects', cwd.replace(/[^A-Za-z0-9]/g, '-'), 'abc.jsonl'),
    JSON.stringify({ type: 'assistant', message: { usage: { input_tokens: 50000 }, content: [{ type: 'tool_use', id: 't1', name: 'mcp__claude_ai_Google_Sheets__get_values', input: { range: 'Data!A1:H50' } }] } }) + '\n')
  assert.equal(dirKantor(), path.join(home, '.kantor-ricko'))
  assert.ok(!fs.existsSync(path.join(home, '.pixel-agents')), 'tidak memakai folder Pixel Agents')

  const s = await mulaiServer({ port: 0 })
  try {
    const dasar = `http://127.0.0.1:${s.port}`, kunci = { Authorization: 'Bearer ' + s.token }
    assert.equal((await fetch(dasar + '/')).status, 200)
    assert.equal((await fetch(dasar + '/vendor/three.module.js')).status, 200)
    assert.equal((await fetch(dasar + '/web/../server.mjs')).status, 404)
    assert.equal((await fetch(dasar + '/api/state')).status, 401)
    const k = await (await fetch(dasar + '/api/state', { headers: kunci })).json()
    const ujang = k.karyawan.find(a => a.id === 'ujang')
    assert.deepEqual([ujang.hadir, ujang.status, ujang.kegiatan, ujang.konteks], [true, 'working', 'Reading Google Sheets (Data!A1:H50)', 25])
    assert.equal(k.karyawan.find(a => a.id === 'kokom').hadir, false, 'sesi yang prosesnya mati tidak dihitung')

    const pos = (jalur, isi) => fetch(dasar + jalur, { method: 'POST', headers: { ...kunci, 'Content-Type': 'application/json' }, body: JSON.stringify(isi) })
    assert.equal((await pos('/api/karyawan/ujang', { model: 'sonnet', jobdesk: ['  Cek  stok tiap Senin '] })).status, 200)
    assert.equal((await pos('/api/karyawan/ujang', { model: 'bad model; rm' })).status, 400)
    assert.equal((await pos('/api/karyawan/siapa', { model: 'opus' })).status, 404)
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dirKantor(), 'kantor-karyawan.json'), 'utf8')), { ujang: { model: 'sonnet', jobdesk: ['Cek stok tiap Senin'] } })
    const staff = await (await fetch(dasar + '/api/karyawan', { headers: kunci })).json()
    assert.equal(staff.karyawan.find(a => a.id === 'ujang').model, 'sonnet')
    assert.ok(staff.model.some(m => m.nilai === 'opus'))

    // siaran: keadaan awal lalu satu pesan interkom
    const res = await fetch(`${dasar}/api/events?token=${s.token}`), baca = res.body.getReader()
    let teks = ''
    const tunggu = async pola => { const batas = Date.now() + 6000; while (!pola.test(teks) && Date.now() < batas) teks += new TextDecoder().decode((await baca.read()).value); assert.match(teks, pola) }
    await tunggu(/event: state/)
    await new Promise(r => setTimeout(r, 1200))      // server mencatat ukuran awal file interkom dulu
    fs.appendFileSync(path.join(dirKantor(), 'kantor-interkom.jsonl'), JSON.stringify({ id: 'x1', dari: 'ujang', ke: 'kokom', teks: 'halo' }) + '\n')
    await tunggu(/event: interkom\ndata: .*"teks":"halo"/)
    await baca.cancel()
  } finally { await s.tutup() }
})

test('alat kantor: hook Pixel Agents dilepas tanpa menyentuh yang lain; interkom, rapat, job desk menulis ke folder Kantor 3D', async () => {
  const { execFileSync } = await import('node:child_process')
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'kantor-alat-')), dir = path.join(home, '.kantor-ricko')
  const alat = n => path.resolve(import.meta.dirname, '..', '..', 'tools', n)
  const env = { ...process.env, USERPROFILE: home, HOME: home, KANTOR_DIR: dir, INTERKOM_WEBHOOK_FILE: path.join(home, 'tidak-ada.txt') }
  const jalankan = (n, argumen = [], masukan) => execFileSync(process.execPath, [alat(n), ...argumen], { env, input: masukan, encoding: 'utf8' })

  const pixel = { type: 'command', command: String.raw`node "C:\Users\Ricko Erlangga\.pixel-agents\hooks\claude-hook.js"` }, lain = { type: 'command', command: 'node lain.js' }
  fs.mkdirSync(path.join(home, '.claude'))
  fs.writeFileSync(path.join(home, '.claude', 'settings.json'), JSON.stringify({ model: 'opus', hooks: { Stop: [{ hooks: [pixel] }], PreToolUse: [{ matcher: 'Bash', hooks: [pixel, lain] }] } }))
  jalankan('lepas-pixel-agents.mjs')
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(home, '.claude', 'settings.json'), 'utf8')), { model: 'opus', hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [lain] }] } })
  assert.ok(fs.existsSync(path.join(home, '.claude', 'settings.json.bak-pixel-agents')))

  jalankan('interkom-log.mjs', ['Ujang'], JSON.stringify({ tool_input: { to: 'pak-asep', message: '**Pak Asep**, template stok sudah siap. Detail menyusul.' }, tool_response: { success: true } }))
  const pesan = JSON.parse(fs.readFileSync(path.join(dir, 'kantor-interkom.jsonl'), 'utf8').trim())
  assert.deepEqual([pesan.dari, pesan.ke, pesan.teks], ['ujang', 'pak-asep', 'Pak Asep, template stok sudah siap.'])

  jalankan('rapat.mjs', ['mulai', '--topik', 'Uji', '--peserta', 'asep,kokom'])
  const rapat = JSON.parse(fs.readFileSync(path.join(dir, 'kantor-rapat.json'), 'utf8'))
  assert.deepEqual([rapat.aktif, rapat.pemimpin, rapat.peserta], [true, 'pak-asep', ['pak-asep', 'kokom']])

  fs.writeFileSync(path.join(dir, 'kantor-karyawan.json'), JSON.stringify({ ujang: { jobdesk: ['Cek stok tiap Senin'] } }))
  assert.match(jalankan('jobdesk.mjs', ['ujang']), /- Cek stok tiap Senin/)
  assert.equal(jalankan('jobdesk.mjs', ['kokom']), '')

  jalankan('status-kantor.mjs', ['ujang'], JSON.stringify({ rate_limits: { five_hour: { used_percentage: 41.26, resets_at: 1 } } }))
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'kantor-kuota.json'), 'utf8')).limaJam.persen, 41.3)
  assert.ok(!fs.existsSync(path.join(home, '.pixel-agents')), 'tidak ada yang menulis ke folder Pixel Agents')
})
