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
mulai-kantor.ps1            buka semua karyawan + pixel office
karyawan/
  CLAUDE.md                 aturan kantor (berlaku untuk semua)
  <id>/CLAUDE.md            job description tiap karyawan
  <id>/kantor-settings.json model, ingatan, compact, hook interkom
tools/
  karyawan.json             daftar karyawan + channel Discord yang didengar
  setup-discord.ps1         sambungkan token bot & channel
  jalankan-karyawan.ps1     jalankan satu karyawan
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
.\mulai-kantor.ps1
```
- Pertama kali, tiap tab akan bertanya apakah folder ini dipercaya → pilih **Yes**.
- Di tab **Pixel Office**, buka link `http://127.0.0.1:3737/?token=...` yang muncul. Kalau belum semua karakter tampil, nyalakan **Watch All Sessions** di pengaturan pixel-agents.

### 6. Tes
Di `#lobby`: `@Pak Asep halo, perkenalkan diri lalu sapa tim lewat interkom`.
Balasan Pak Asep muncul di `#lobby`, obrolan interkomnya muncul di `#ruang-rapat`.

## Pemakaian harian

| Kebutuhan | Perintah |
|---|---|
| Buka kantor | `.\mulai-kantor.ps1` |
| Hemat kuota: sebagian karyawan saja | `.\mulai-kantor.ps1 -Hanya pak-asep,ujang,kokom` |
| Semua mulai percakapan baru | `.\mulai-kantor.ps1 -Baru` |
| Setelah membuat channel `#proyek-...` baru (juga memperbarui daftar chat_id di aturan kantor; jalankan ulang karyawan setelahnya) | `.\tools\setup-discord.ps1 -SegarkanChannel` |
| Ganti token satu bot | `.\tools\setup-discord.ps1 -Hanya kokom` |
| Tutup kantor | tutup jendela Windows Terminal "kantor-ricko" |

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
- Channel Discord di [Claude Code Channels](https://code.claude.com/docs/en/channels) masih *research preview*.
