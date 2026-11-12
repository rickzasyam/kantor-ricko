// Status kerja karyawan dalam bahasa manusia (disuntikkan patch-pixel-agents.mjs ke server
// pixel-agents 1.4.1, di depan fungsi `ps` yang membuat teks "Using <nama tool>").
// Contoh: mcp__claude_ai_Google_Sheets__get_values -> "Reading Google Sheets (Data!A1:H50)".
// Teks antarmuka berbahasa Inggris (permintaan Pak Ricko). Tool yang tidak dikenal mengembalikan
// undefined supaya teks bawaan tetap dipakai.

function __kantorStatusAlat(nama, input) {
  var i = input || {}
  var pendek = function (s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n) + '…' : s }
  var file = function (p) { return pendek(String(p || '').split(/[\\/]/).pop(), 32) }
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
  var m = /^mcp__(.+?)__(.+)$/.exec(String(nama))
  if (!m) return undefined
  var server = m[1], aksi = m[2]
  if (/discord/i.test(server)) return /react/.test(aksi) ? 'Reacting on Discord' : /fetch|download/.test(aksi) ? 'Reading Discord' : 'Replying on Discord'
  if (/chrome/i.test(server)) return 'Using Chrome'
  // claude_ai_Google_Sheets -> "Google Sheets"
  var layanan = server.replace(/^claude_ai_|^plugin_[^_]+_/, '').replace(/_/g, ' ')
  var kata = /^(get|read|list|fetch|view|describe|query|download)/.test(aksi) ? 'Reading'
    : /^(search|find)/.test(aksi) ? 'Searching'
    : /^(create|generate|copy|add|insert|append|upload)/.test(aksi) ? 'Adding to'
    : /^(update|edit|set|apply|move|rename|batch_update|write)/.test(aksi) ? 'Updating'
    : /^(delete|trash|remove|clear|batch_clear)/.test(aksi) ? 'Deleting in'
    : /^(send|reply|forward|publish|share)/.test(aksi) ? 'Sending via'
    : 'Using'
  var rentang = i.range || (i.ranges && i.ranges[0])
  return kata + ' ' + layanan + (rentang ? ' (' + pendek(rentang, 24) + ')' : '')
}
