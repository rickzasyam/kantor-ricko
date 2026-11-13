// Melepas hook Pixel Agents dari ~/.claude/settings.json (dipakai sekali saat pindah dari Pixel
// Office ke Kantor 3D, dipanggil tools/pasang-kantor-3d.ps1).
//
// Pixel Agents dulu memasang hook di 12 kejadian Claude Code ("Instant Detection") yang memanggil
// ~/.pixel-agents/hooks/claude-hook.js di SEMUA sesi di PC ini. Kantor 3D membaca status sesi
// langsung dari Claude Code, jadi hook itu tinggal membuang waktu tiap kali tool dipakai.
// Hanya entri yang perintahnya menunjuk ke folder .pixel-agents yang dibuang; hook lain dan
// pengaturan lain dibiarkan. Salinan cadangan: settings.json.bak-pixel-agents.
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const file = join(homedir(), '.claude', 'settings.json')
if (existsSync(file)) {
  const atur = JSON.parse(readFileSync(file, 'utf8'))
  let dibuang = 0
  for (const [kejadian, grup] of Object.entries(atur.hooks ?? {})) {
    for (const g of grup) {
      const sisa = (g.hooks ?? []).filter(h => !/[\\/]\.pixel-agents[\\/]/.test(h.command ?? ''))
      dibuang += (g.hooks ?? []).length - sisa.length
      g.hooks = sisa
    }
    atur.hooks[kejadian] = grup.filter(g => g.hooks.length)
    if (!atur.hooks[kejadian].length) delete atur.hooks[kejadian]
  }
  if (atur.hooks && !Object.keys(atur.hooks).length) delete atur.hooks
  if (dibuang) {
    copyFileSync(file, file + '.bak-pixel-agents')
    writeFileSync(file, JSON.stringify(atur, null, 2) + '\n')
    console.log(`Hook Pixel Agents dilepas dari settings.json (${dibuang} entri; cadangan: settings.json.bak-pixel-agents).`)
  }
}
