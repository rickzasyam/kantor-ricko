// Alarm kegagalan karyawan (hook StopFailure di kantor-settings.json).
//
// Kalau karyawan gagal menjawab karena masalah akun -- login Claude kedaluwarsa, kuota Pro habis,
// tagihan/akun bermasalah -- Claude-nya sendiri tidak bisa membalas, jadi Pak Ricko hanya melihat
// reaksi 👀 lalu sepi. Script ini membalas pesan terakhir Pak Ricko di channel Discord yang sama
// (memakai bot karyawan itu) dan menjelaskan cara memperbaikinya. Gagal kirim lewat bot -> lewat
// webhook #ruang-rapat.
//
// Hanya berjalan saat ada kegagalan (tidak ada proses yang terus menyala). Masalah yang sama di
// channel yang sama dilaporkan paling sering sekali per 30 menit, supaya tidak banjir pesan.
//
// Pemakaian (dari hook): node alarm-gagal.mjs "<Nama karyawan>" <id karyawan>
// Input stdin (Claude Code): { error, error_details, transcript_path, ... }
// Pengujian: KANTOR_DISCORD_API (alamat pengganti discord.com/api), INTERKOM_WEBHOOK_FILE.
import { readFileSync, writeFileSync, existsSync, openSync, readSync, fstatSync, closeSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const [nama = 'Karyawan', id = ''] = process.argv.slice(2)
const KANTOR = join(homedir(), '.claude', 'channels', 'kantor-ricko')
const API = process.env.KANTOR_DISCORD_API ?? 'https://discord.com/api/v10'
const JEDA_MENIT = 30

const PERBAIKI_LOGIN =
  'Cara memperbaiki:\n' +
  '1. Buka **PowerShell**, ketik `claude`, lalu ketik `/login` dan masuk dengan akun Claude Pro.\n' +
  '2. Ketik `/exit`, lalu klik ikon **Tutup Kantor** dan **Buka Kantor** (percakapan & ingatan tetap).\n' +
  '3. Kirim ulang pesannya.'

function pesanUntuk(error) {
  switch (error) {
    case 'authentication_failed':
    case 'oauth_org_not_allowed':
      return `⚠️ ${nama} tidak bisa bekerja: **login Claude di PC kantor kedaluwarsa** (berlaku untuk semua karyawan).\n${PERBAIKI_LOGIN}`
    case 'rate_limit':
      return `⏳ ${nama} belum bisa menjawab: **kuota Claude Pro sedang habis**. Karyawan bisa bekerja lagi setelah kuota pulih ` +
        '(lihat jamnya di claude.ai → Settings → Usage). Kirim ulang pesannya setelah itu.'
    case 'billing_error':
    case 'account_on_hold':
      return `⚠️ ${nama} tidak bisa bekerja: **ada masalah akun atau tagihan Claude**. Cek claude.ai → Settings → Billing.`
    default:
      return `⚠️ ${nama} gagal menjawab karena error Claude (\`${error}\`). Coba kirim ulang pesannya sebentar lagi.`
  }
}

/** Pesan Discord terakhir di percakapan: { chatId, messageId }. Cukup baca ekor transkrip. */
function pesanTerakhir(transkrip) {
  if (!transkrip || !existsSync(transkrip)) return null
  const fd = openSync(transkrip, 'r')
  try {
    const ukuran = fstatSync(fd).size
    const n = Math.min(ukuran, 400_000)
    const buf = Buffer.alloc(n)
    readSync(fd, buf, 0, n, ukuran - n)
    const cocok = [...buf.toString('utf8').matchAll(/source=\\?"plugin:discord:discord\\?" chat_id=\\?"(\d+)\\?" message_id=\\?"(\d+)\\?"/g)]
    const akhir = cocok.at(-1)
    return akhir ? { chatId: akhir[1], messageId: akhir[2] } : null
  } finally {
    closeSync(fd)
  }
}

/** true kalau masalah ini di channel ini sudah dilaporkan dalam JEDA_MENIT terakhir (lalu dicatat). */
function sudahDilaporkan(kunci) {
  const file = join(KANTOR, 'alarm-gagal.json')
  let catatan = {}
  try { catatan = JSON.parse(readFileSync(file, 'utf8')) } catch {}
  const sekarang = Date.now()
  if (catatan[kunci] && sekarang - catatan[kunci] < JEDA_MENIT * 60_000) return true
  for (const k of Object.keys(catatan)) if (sekarang - catatan[k] > 24 * 3600_000) delete catatan[k]
  catatan[kunci] = sekarang
  try { writeFileSync(file, JSON.stringify(catatan, null, 2)) } catch {}
  return false
}

function bacaJson(file) {
  try { return JSON.parse(readFileSync(file, 'utf8')) } catch { return {} }
}

function tokenBot() {
  const dir = process.env.DISCORD_STATE_DIR ?? (id ? join(KANTOR, id) : '')
  const file = dir && join(dir, '.env')
  if (!file || !existsSync(file)) return null
  const baris = readFileSync(file, 'utf8').split(/\r?\n/).find(b => b.startsWith('DISCORD_BOT_TOKEN='))
  return baris ? baris.slice('DISCORD_BOT_TOKEN='.length).trim() : null
}

async function kirimLewatBot(tujuan, isi, pemilik) {
  const token = tokenBot()
  if (!token || !tujuan) return false
  const res = await fetch(`${API}/channels/${tujuan.chatId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: isi,
      message_reference: { message_id: tujuan.messageId, fail_if_not_exists: false },
      allowed_mentions: { users: pemilik ? [pemilik] : [], replied_user: true },
    }),
    signal: AbortSignal.timeout(8000),
  })
  return res.ok
}

async function kirimLewatWebhook(isi, pemilik) {
  const file = process.env.INTERKOM_WEBHOOK_FILE ?? join(KANTOR, 'ruang-rapat-webhook.txt')
  if (!existsSync(file)) return false
  const res = await fetch(readFileSync(file, 'utf8').trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `Alarm Kantor (${nama})`,
      content: (pemilik ? `<@${pemilik}> ` : '') + isi,
      allowed_mentions: { users: pemilik ? [pemilik] : [] },
    }),
    signal: AbortSignal.timeout(8000),
  })
  return res.ok
}

async function main() {
  let input = {}
  try { input = JSON.parse(readFileSync(0, 'utf8')) } catch {}
  const error = input.error
  if (!error) return
  const tujuan = pesanTerakhir(input.transcript_path)
  if (sudahDilaporkan(`${error}|${tujuan?.chatId ?? 'ruang-rapat'}`)) return
  const pemilik = bacaJson(join(KANTOR, 'config.json')).ownerId
  const isi = pesanUntuk(error) + (input.error_details ? `\n-# ${String(input.error_details).slice(0, 150)}` : '')
  let terkirim = false
  try { terkirim = await kirimLewatBot(tujuan, isi, pemilik) } catch {}
  if (!terkirim) await kirimLewatWebhook(isi, pemilik)
}

// Hook tidak boleh membuat sesi karyawan tersendat: semua error ditelan.
main().catch(() => {}).finally(() => process.exit(0))
