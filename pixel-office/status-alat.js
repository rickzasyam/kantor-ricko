// Status kerja karyawan dalam bahasa manusia (disuntikkan patch-pixel-agents.mjs ke server
// pixel-agents 1.4.1, di depan fungsi `ps` yang membuat teks "Using <nama tool>").
// Contoh: mcp__claude_ai_Google_Sheets__get_values -> "Membaca Google Sheets (Data!A1:H50)".
// Tool yang tidak dikenal mengembalikan undefined supaya teks bawaan tetap dipakai.

function __kantorStatusAlat(nama, input) {
  var i = input || {}
  var pendek = function (s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n) + '…' : s }
  var file = function (p) { return pendek(String(p || '').split(/[\\/]/).pop(), 32) }
  switch (nama) {
    case 'Read': return 'Membaca ' + file(i.file_path)
    case 'Edit': case 'MultiEdit': return 'Mengedit ' + file(i.file_path)
    case 'Write': return 'Menulis ' + file(i.file_path)
    case 'Bash': case 'PowerShell': return i.description ? pendek(i.description, 40) : 'Menjalankan perintah'
    case 'Glob': return 'Mencari file'
    case 'Grep': return 'Mencari di dalam file'
    case 'WebFetch': return 'Membuka halaman web'
    case 'WebSearch': return 'Mencari di internet'
    case 'Task': case 'Agent': return i.description ? 'Minta bantuan: ' + pendek(i.description, 30) : 'Minta bantuan rekan'
    case 'SendMessage': return i.to ? 'Interkom ke ' + i.to : 'Kirim interkom'
    case 'ToolSearch': return 'Menyiapkan alat'
    case 'TodoWrite': return 'Menyusun daftar tugas'
    case 'Skill': return 'Membuka SOP ' + pendek(i.skill || i.name, 24)
  }
  var m = /^mcp__(.+?)__(.+)$/.exec(String(nama))
  if (!m) return undefined
  var server = m[1], aksi = m[2]
  if (/discord/i.test(server)) return /react/.test(aksi) ? 'Memberi reaksi di Discord' : /fetch|download/.test(aksi) ? 'Membaca pesan Discord' : 'Membalas di Discord'
  if (/chrome/i.test(server)) return 'Membuka Chrome'
  // claude_ai_Google_Sheets -> "Google Sheets"
  var layanan = server.replace(/^claude_ai_|^plugin_[^_]+_/, '').replace(/_/g, ' ')
  var kata = /^(get|read|list|fetch|view|describe|query|download)/.test(aksi) ? 'Membaca'
    : /^(search|find)/.test(aksi) ? 'Mencari di'
    : /^(create|generate|copy|add|insert|append|upload)/.test(aksi) ? 'Menambah ke'
    : /^(update|edit|set|apply|move|rename|batch_update|write)/.test(aksi) ? 'Mengubah'
    : /^(delete|trash|remove|clear|batch_clear)/.test(aksi) ? 'Menghapus di'
    : /^(send|reply|forward|publish|share)/.test(aksi) ? 'Mengirim lewat'
    : 'Memakai'
  var rentang = i.range || (i.ranges && i.ranges[0])
  return kata + ' ' + layanan + (rentang ? ' (' + pendek(rentang, 24) + ')' : '')
}
