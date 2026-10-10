// Hook PostToolUse untuk SendMessage: menyalin setiap pesan interkom antar-karyawan
// ke channel Discord #ruang-rapat lewat webhook, supaya Pak Ricko bisa membaca
// isi diskusi tim. Script biasa (bukan AI), jadi tidak memakai kuota Claude.
//
// Pemakaian (dipasang di kantor-settings.json tiap karyawan):
//   node tools/interkom-log.mjs "<Nama Pengirim>"
//
// URL webhook dibaca dari %USERPROFILE%\.claude\channels\kantor-ricko\ruang-rapat-webhook.txt
// (diisi oleh tools/setup-discord.ps1). Kalau file itu belum ada, script diam saja.

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const NAMA = {
  'pak-asep': 'Pak Asep',
  kokom: 'Kokom',
  ujang: 'Ujang',
  joko: 'Joko',
  neneng: 'Neneng',
  ayu: 'Ayu',
}
const DISCORD_LIMIT = 2000

async function main() {
  const sender = process.argv[2] ?? 'Karyawan'
  const webhookFile = join(homedir(), '.claude', 'channels', 'kantor-ricko', 'ruang-rapat-webhook.txt')
  if (!existsSync(webhookFile)) return
  const url = readFileSync(webhookFile, 'utf8').trim()
  if (!url) return

  let raw = ''
  for await (const chunk of process.stdin) raw += chunk
  const { to = '', message = '' } = JSON.parse(raw).tool_input ?? {}
  if (!message.trim()) return // langganan notify_when_idle tanpa pesan

  const bareTo = to.replace(/\s*\[.*\]$/, '')
  const target = NAMA[bareTo] ?? bareTo
  let text = `📞 **${sender} → ${target}**\n${message}`

  const chunks = []
  while (text.length > 0) {
    chunks.push(text.slice(0, DISCORD_LIMIT))
    text = text.slice(DISCORD_LIMIT)
  }
  for (const content of chunks) {
    await fetch(`${url}?wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        username: `Interkom · ${sender}`,
        allowed_mentions: { parse: [] }, // jangan sampai men-tag siapa pun
      }),
    })
  }
}

// Apa pun yang terjadi, jangan pernah mengganggu kerja karyawan. Biarkan proses
// selesai sendiri: process.exit() saat koneksi fetch masih terbuka bisa crash di Windows.
process.exitCode = 0
main().catch(() => {})
