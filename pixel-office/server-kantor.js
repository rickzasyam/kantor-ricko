// Bagian server Kantor Ricko (disuntikkan patch-pixel-agents.mjs ke dist/cli.js pixel-agents 1.4.1,
// di depan fungsi `oi` yang membuat server Fastify). Dipanggil sekali saat server menyala.
//
// 1. API dashboard "Staff" (dasbor.js), semuanya wajib membawa token server (Authorization: Bearer):
//      GET  /api/kantor/karyawan                 daftar karyawan + model + jobdesk + pilihan model
//      POST /api/kantor/karyawan/<id>            simpan { model, jobdesk }
//      POST /api/kantor/karyawan/<id>/buka-ulang buka ulang karyawan itu kalau sedang menganggur
//    Pilihan disimpan di ~/.pixel-agents/kantor-karyawan.json (DI LUAR repo: file di repo yang
//    berubah membuat Update Kantor menolak git pull). Model dipakai tools/jalankan-karyawan.ps1
//    (--model), jobdesk dibacakan ke karyawan oleh tools/jobdesk.mjs (hook SessionStart).
// 2. Pilihan model otomatis: alias keluarga model ("opus" = Opus terbaru, dst.) + model yang
//    dikenal Claude Code di PC ini (~/.claude.json: additionalModelOptionsCache dan model yang
//    dipakai sesi-sesi terakhir). Model baru dari Anthropic muncul di sini tanpa mengubah kode.
// 3. Siaran interkom: baris baru di ~/.pixel-agents/kantor-interkom.jsonl (ditulis
//    tools/interkom-log.mjs) disiarkan ke browser sebagai pesan `kantorInterkom`.
//
// Nama hasil minify yang dipakai: `Wl` (pemeriksa token untuk rute Fastify).

function __kantorApi(app, cfg) {
  var fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process')
  var root = path.resolve(__dirname, '..', '..', '..', '..')     // pixel-office/node_modules/pixel-agents/dist -> root repo
  var pa = path.join(os.homedir(), '.pixel-agents')
  var fAtur = path.join(pa, 'kantor-karyawan.json')
  var jaga = { preHandler: Wl(cfg.token) }
  var POLA_MODEL = /^[A-Za-z0-9._\[\]-]{1,80}$/

  function baca(f, cadangan) { try { return JSON.parse(fs.readFileSync(f, 'utf8')) } catch (e) { return cadangan } }
  function roster() { return baca(path.join(root, 'tools', 'karyawan.json'), []) }
  function cari(id) { return roster().find(function (k) { return k.id === id }) }

  function daftarModel() {
    var c = baca(path.join(os.homedir(), '.claude.json'), {})
    var keluarga = ((c.cachedGrowthBookFeatures || {}).tengu_wobbly_petal || {}).sessionModelFamilies
    if (!Array.isArray(keluarga) || !keluarga.length) keluarga = []
    var urut = ['haiku', 'sonnet', 'opus']
    keluarga.forEach(function (k) { if (typeof k === 'string' && k !== 'other' && urut.indexOf(k) < 0) urut.push(k) })
    var hasil = [], ada = {}
    function tambah(nilai, label, ket) {
      if (typeof nilai !== 'string' || ada[nilai] || !POLA_MODEL.test(nilai)) return
      ada[nilai] = 1
      hasil.push({ nilai: nilai, label: label, ket: ket || '' })
    }
    urut.forEach(function (k) { tambah(k, k.charAt(0).toUpperCase() + k.slice(1) + ' (latest)', 'Always the newest ' + k + ' model') })
    ;(Array.isArray(c.additionalModelOptionsCache) ? c.additionalModelOptionsCache : []).forEach(function (m) {
      if (m) tambah(m.value, (m.label ? m.label + ' · ' : '') + m.value, m.description)
    })
    var slot = c.clientDataCacheSlots || {}
    Object.keys(slot).map(function (k) { return slot[k] && slot[k].model }).filter(Boolean).sort().forEach(function (id) { tambah(id, id, 'Exact version') })
    return hasil
  }

  app.get('/api/kantor/karyawan', jaga, async function () {
    var atur = baca(fAtur, {}), karakter = baca(path.join(root, 'pixel-office', 'karakter.json'), {})
    return {
      model: daftarModel(),
      karyawan: roster().map(function (k) {
        var s = baca(path.join(root, 'karyawan', k.id, 'kantor-settings.json'), {}), a = atur[k.id] || {}
        var pixel = k.id.split('-').pop().toLowerCase()
        return {
          id: k.id, pixel: pixel, nama: k.nama, jabatan: k.jabatan || k.role, role: k.role, karakter: karakter[pixel],
          modelBawaan: s.model || '', model: a.model || s.model || '', jobdesk: Array.isArray(a.jobdesk) ? a.jobdesk : [],
        }
      }),
    }
  })

  app.post('/api/kantor/karyawan/:id', jaga, async function (req, rep) {
    var k = cari(req.params.id)
    if (!k) return rep.code(404).send({ error: 'Unknown employee' })
    var b = req.body || {}, atur = baca(fAtur, {}), a = atur[k.id] || {}
    if (b.model !== undefined) {
      if (b.model !== '' && !POLA_MODEL.test(String(b.model))) return rep.code(400).send({ error: 'Invalid model name' })
      if (b.model) a.model = String(b.model); else delete a.model
    }
    if (b.jobdesk !== undefined) {
      if (!Array.isArray(b.jobdesk) || b.jobdesk.length > 30) return rep.code(400).send({ error: 'Invalid job desk (max 30 items)' })
      a.jobdesk = b.jobdesk.map(function (t) { return String(t).replace(/\s+/g, ' ').trim().slice(0, 300) }).filter(Boolean)
    }
    atur[k.id] = a
    fs.mkdirSync(pa, { recursive: true })
    // tulis ke file sementara lalu ganti nama, supaya pembaca tidak pernah melihat file setengah jadi
    fs.writeFileSync(fAtur + '.tmp', JSON.stringify(atur, null, 2))
    fs.renameSync(fAtur + '.tmp', fAtur)
    return { ok: true }
  })

  app.post('/api/kantor/karyawan/:id/buka-ulang', jaga, async function (req, rep) {
    var k = cari(req.params.id)
    if (!k) return rep.code(404).send({ error: 'Unknown employee' })
    if (process.platform !== 'win32') return rep.code(501).send({ error: 'Restart only works on the office PC' })
    var skrip = path.join(root, 'tools', 'buka-ulang-karyawan.ps1')
    return await new Promise(function (selesai) {
      cp.execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', skrip, '-Id', k.id],
        { timeout: 60000, windowsHide: true }, function (err, stdout) {
          var keluar = String(stdout || '')
          selesai({ ok: !err, hasil: err ? 'failed' : /SIBUK/.test(keluar) ? 'busy' : 'restarted' })
        })
    })
  })

  // Interkom: baca hanya baris yang baru ditambahkan sejak pemeriksaan terakhir.
  var fInterkom = path.join(pa, 'kantor-interkom.jsonl'), posisi = -1
  setInterval(function () {
    var st
    try { st = fs.statSync(fInterkom) } catch (e) { posisi = 0; return }
    if (posisi < 0 || st.size < posisi) { posisi = st.size; return }   // server baru menyala / file dipangkas: pesan lama tidak diputar ulang
    if (st.size === posisi) return
    var buf = Buffer.alloc(st.size - posisi), fd = fs.openSync(fInterkom, 'r')
    try { fs.readSync(fd, buf, 0, buf.length, posisi) } finally { fs.closeSync(fd) }
    posisi = st.size
    var pesan = []
    buf.toString('utf8').split('\n').forEach(function (b) { try { if (b.trim()) pesan.push(JSON.parse(b)) } catch (e) {} })
    if (pesan.length && cfg.store) cfg.store.broadcast({ type: 'kantorInterkom', pesan: pesan })
    if (st.size > 262144) { try { fs.writeFileSync(fInterkom, ''); posisi = 0 } catch (e) {} }   // jangan tumbuh tanpa batas
  }, 1000).unref()
}
