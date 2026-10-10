# Kantor Ricko — AI Office Virtual

Enam karyawan AI (Claude Code) yang bekerja lewat Discord, saling berdiskusi lewat interkom, dan tampil sebagai karakter pixel di [pixel-agents](https://github.com/pixel-agents-hq/pixel-agents).

| Karyawan | Role | Nama interkom |
|---|---|---|
| Pak Asep | Project Manager & Admin (manajer utama) | `pak-asep` |
| Kokom | Akuntan Senior | `kokom` |
| Ujang | Spreadsheet & Automation Engineer | `ujang` |
| Joko | Full-stack Developer | `joko` |
| Neneng | Data Analyst & QA | `neneng` |
| Ayu | Designer (UI/UX & Visual) | `ayu` |

## Isi folder

```
mulai-kantor.ps1            buka kantor (terminal tersembunyi) + Pixel Office
tutup-kantor.ps1            semua karyawan pulang
tampilkan-kantor.ps1        tampilkan / sembunyikan jendela terminal karyawan
karyawan/
  CLAUDE.md                 aturan kantor (berlaku untuk semua)
  <id>/CLAUDE.md            job description tiap karyawan
  <id>/kantor-settings.json model, ingatan, compact, hook interkom
tools/
  karyawan.json             daftar karyawan + channel Discord yang didengar
  setup-discord.ps1         sambungkan token bot & channel
  jalankan-karyawan.ps1     jalankan satu karyawan (dipanggil mulai-kantor.ps1)
  kantor-umum.ps1           fungsi bersama script kantor
  pasang-shortcut.ps1       autostart Windows + ikon desktop (-Hapus untuk melepas)
  interkom-log.mjs          salin pesan interkom ke #ruang-rapat
```

Token bot, daftar akses, dan URL webhook disimpan di `%USERPROFILE%\.claude\channels\kantor-ricko\` — **di luar** folder ini, jadi tidak ikut ke GitHub.

## Setup pertama kali

### 1. Server Discord
Buat server Discord, lalu buat channel teks: `#lobby`, `#keuangan`, `#laporan-harian`, `#ruang-rapat`.
Channel proyek (`#proyek-<nama-client>`) dibuat nanti per proyek.

### 2. Enam bot (ulangi untuk tiap karyawan)
Di [Discord Developer Portal](https://discord.com/developers/applications):
1. **New Application** → beri nama karyawan (mis. `Pak Asep`). Foto profil boleh diisi.
2. Menu **Bot** → **Reset Token** → salin token (simpan sementara, nanti di-paste ke script).
3. Masih di menu **Bot**, nyalakan **Message Content Intent**.
4. Menu **OAuth2 → URL Generator**: centang scope `bot`, lalu permission
   *View Channels, Send Messages, Send Messages in Threads, Read Message History, Attach Files, Add Reactions*.
   Buka URL yang dihasilkan → pilih server kantor → **Authorize**.

### 3. Webhook untuk #ruang-rapat
Klik ⚙️ channel `#ruang-rapat` → **Integrations → Webhooks → New Webhook** → **Copy Webhook URL**.

### 4. Sambungkan semuanya
```powershell
.\tools\setup-discord.ps1
```
Script akan meminta: User ID Discord Anda, 6 token bot, dan URL webhook. Ketikan token tidak terlihat di layar.

### 5. Buka kantor
```powershell
.\mulai-kantor.ps1 -Tampil
```
- Pertama kali, tiap tab akan bertanya apakah folder ini dipercaya → pilih **Yes**. (Pakai `-Tampil` supaya dialog ini terlihat; setelahnya jendela boleh disembunyikan.)
- Pixel Office terbuka di browser. Kalau belum semua karakter tampil, nyalakan **Watch All Sessions** di pengaturan pixel-agents.

### 6. Autostart & ikon desktop
```powershell
.\tools\pasang-shortcut.ps1
```
Kantor terbuka sendiri saat login Windows, plus ikon **Buka Kantor**, **Tutup Kantor**, dan **Lihat Kantor** di desktop.

### 7. Tes
Di `#lobby`: `@Pak Asep halo, perkenalkan diri lalu sapa tim lewat interkom`.
Balasan Pak Asep muncul di `#lobby`, obrolan interkomnya muncul di `#ruang-rapat`.

## Pemakaian harian

Karyawan bekerja di jendela Windows Terminal yang **disembunyikan** (tidak di layar, tidak di taskbar). Izin yang perlu persetujuan dikirim ke DM Discord Anda.

| Kebutuhan | Ikon desktop | Perintah |
|---|---|---|
| Buka kantor (otomatis saat login) | Buka Kantor | `.\mulai-kantor.ps1` |
| Lihat / sembunyikan terminal karyawan | Lihat Kantor | `.\tampilkan-kantor.ps1` |
| Tutup kantor | Tutup Kantor | `.\tutup-kantor.ps1` |
| Ada karyawan yang tidak membalas | Buka Kantor (memperbaiki yang putus) | `.\mulai-kantor.ps1` |
| Hemat kuota: sebagian karyawan saja | | `.\mulai-kantor.ps1 -Hanya pak-asep,ujang,kokom` |
| Semua mulai percakapan baru | | `.\mulai-kantor.ps1 -Baru` |
| Setelah membuat channel `#proyek-...` baru (juga memperbarui daftar chat_id; lalu `-Baru` atau tutup-buka kantor) | | `.\tools\setup-discord.ps1 -SegarkanChannel` |
| Ganti token satu bot | | `.\tools\setup-discord.ps1 -Hanya kokom` |
| Lepas autostart & ikon | | `.\tools\pasang-shortcut.ps1 -Hapus` |

## Ingatan karyawan

Tiga lapis supaya karyawan tidak lupa:

1. **Job description** (`CLAUDE.md`) — dibaca setiap kali bekerja, tidak pernah hilang.
2. **Ingatan jangka panjang** (auto memory) — catatan yang ditulis karyawan sendiri, tersimpan di
   `Google Drive/Kantor Ricko/02 Karyawan/<Nama>/memori/` dan dimuat setiap sesi.
3. **Percakapan terakhir** — `mulai-kantor.ps1` otomatis melanjutkan percakapan terakhir (`--continue`).
   Kalau percakapan sudah panjang (±120 ribu token), Claude Code merangkumnya otomatis (compact)
   supaya hemat kuota; hal penting dipertahankan sesuai bagian "Instruksi compact" di aturan kantor.

## Catatan

- Semua karyawan memakai **satu akun Claude Pro** — kuota dipakai bersama. Karyawan yang menunggu di-tag tidak memakai kuota.
- Mode izin: **auto** — aksi aman berjalan tanpa bertanya, aksi berisiko diperiksa dulu.
- *Background session* Claude Code (`claude --bg`) sudah diuji dan tidak dipakai: plugin Discord gagal menyala di proses cadangan daemon, hilang saat sesi dibangunkan ulang, dan sesi yang menganggur dimatikan setelah ±1 jam. Sebagai gantinya jendela terminal disembunyikan.
- Tidak bisa dijalankan di GitHub Actions / Vercel: karyawan butuh PC ini (login Claude, Google Drive `G:`, Pixel Office lokal).
- Plugin Discord hanya aktif di sesi karyawan (`enabledPlugins` di `kantor-settings.json`); di sesi Claude Code lain dimatikan di `~/.claude/settings.json`. Kalau plugin itu gagal di sesi mana pun, Claude Code menandainya "perlu login" di `~/.claude/mcp-needs-auth-cache.json` dan semua sesi berikutnya melewatkannya — `mulai-kantor.ps1` menghapus tanda itu setiap membuka kantor.
- Script karyawan membuang variabel sesi Claude Code warisan (kalau kantor dibuka dari dalam sesi Claude Code lain), supaya karyawan tetap terdaftar di interkom.
- Channel Discord di [Claude Code Channels](https://code.claude.com/docs/en/channels) masih *research preview*.
