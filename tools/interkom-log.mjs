// Hook PostToolUse untuk SendMessage: menyalin setiap pesan interkom antar-karyawan
// ke channel Discord #ruang-rapat lewat webhook, supaya Pak Ricko bisa membaca
// isi diskusi tim. Script biasa (bukan AI), jadi tidak memakai kuota Claude.
//
// Pemakaian (dipasang di kantor-settings.json tiap karyawan):
//   node tools/interkom-log.mjs "<Nama Pengirim>"
//
// URL webhook dibaca dari %USERPROFILE%\.claude\channels\kantor-ricko\ruang-rapat-webhook.txt
// (diisi oleh tools/setup-discord.ps1). Kalau file itu belum ada, script diam saja.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
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
const KANTOR = join(homedir(), '.claude', 'channels', 'kantor-ricko')

// Karyawan kadang membalas ke alamat internal pengirim ("uds:\\.\pipe\LOCAL\cc-msg-<kode>")
// alih-alih namanya. Terjemahkan kode itu ke nama: dari daftar sesi yang sedang jalan
// (~/.claude/sessions/*.json), dengan cadangan alamat lama di interkom-alamat.json
// supaya sesi yang sudah mati tetap terbaca namanya.
const kodeAlamat = s => String(s).match(/cc-msg-[0-9a-f]+/i)?.[0]?.toLowerCase()

function namaDariAlamat(to) {
  const kode = kodeAlamat(to)
  if (!kode) return undefined
  const cacheFile = join(KANTOR, 'interkom-alamat.json')
  let cache = {}
  try { cache = JSON.parse(readFileSync(cacheFile, 'utf8')) } catch {}
  let berubah = false
  try {
    const dir = join(homedir(), '.claude', 'sessions')
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.json')) continue
      try {
        const s = JSON.parse(readFileSync(join(dir, f), 'utf8'))
        const k = kodeAlamat(s.messagingSocketPath ?? '')
        if (k && s.name && cache[k] !== s.name) { cache[k] = s.name; berubah = true }
      } catch {}
    }
  } catch {}
  if (berubah) { try { writeFileSync(cacheFile, JSON.stringify(cache, null, 2)) } catch {} }
  return cache[kode]
}

async function main() {
  const sender = process.argv[2] ?? 'Karyawan'
  const webhookFile = process.env.INTERKOM_WEBHOOK_FILE // untuk pengujian
    ?? join(homedir(), '.claude', 'channels', 'kantor-ricko', 'ruang-rapat-webhook.txt')
  if (!existsSync(webhookFile)) return
  const url = readFileSync(webhookFile, 'utf8').trim()
  if (!url) return

  let raw = ''
  for await (const chunk of process.stdin) raw += chunk
  const input = JSON.parse(raw)
  const { to = '', message = '' } = input.tool_input ?? {}
  if (!message.trim()) return // langganan notify_when_idle tanpa pesan

  let response = input.tool_response
  if (typeof response === 'string') {
    try { response = JSON.parse(response) } catch {}
  }

  // Nama penerima: dari nama interkom, atau terjemahan alamat internal, atau dari
  // laporan pengiriman ("... → pak-asep (another Claude session ...").
  let bareTo = to.replace(/\s*\[.*\]$/, '')
  if (/^uds:|cc-msg-/i.test(bareTo)) {
    bareTo = namaDariAlamat(bareTo)
      ?? String(response?.message ?? '').match(/→ ([\w-]+) \(/)?.[1]
      ?? 'rekan'
  }
  const target = NAMA[bareTo] ?? bareTo

  // Pesan ke karyawan yang sesinya tidak berjalan gagal terkirim ({success: false}).
  // Catat sebagai gagal, tanpa isi, supaya tidak terlihat seolah-olah sampai.
  let text = response?.success === false
    ? `📵 **${sender} → ${target}** — tidak terkirim (sesi ${target === 'rekan' ? 'penerima' : target} sedang tidak berjalan)`
    : `📞 **${sender} → ${target}**\n${message}`

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
