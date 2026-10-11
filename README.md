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
  rapat.mjs                 mode rapat: karakter peserta berkumpul di Ruang Rapat Pixel Office
```

```
pixel-office/
  bangun.mjs                bangun furnitur, karakter, denah (node bangun.mjs)
  furnitur.mjs              23 furnitur kustom digambar piksel per piksel
  karakter.mjs              karakter tetap per karyawan + 2 karakter kustom (Ayu, Ricko)
  layout.mjs                denah kantor 46x34 (8 ruangan) + cek semua kursi bisa didatangi
  patch-pixel-agents.mjs    patch pixel-agents 1.4.1 (karakter tetap, pulihkan karyawan, mode rapat)
  aset/                     hasil bangun: folder aset tambahan untuk pixel-agents
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

## Tampilan Pixel Office

![Kantor Ricko](pixel-office/pratinjau-kantor.jpg)

| Ruangan | Isi | Yang duduk |
|---|---|---|
| Ruang Ricko | meja eksekutif, kursi kulit, akuarium, sofa | Ricko |
| Ruang Manajer | meja eksekutif, whiteboard, rak buku, sofa | Pak Asep |
| Ruang Rapat | meja rapat walnut 14 kursi, TV presentasi | - |
| Pantry | kitchen set, mesin kopi, kulkas, dispenser, meja makan | - |
| Ruang Kerja | 6 meja putih + PC modern (layar menyala saat bekerja) | Kokom, Ujang, Joko, Neneng, Ayu |
| Lounge | set sofa + meja kopi (susunan Pak Ricko), tanaman | - |
| Ruang Game | TV + PS5, kursi gaming, 2 mesin arcade, meja biliar, neon, bean bag | - |
| Kolam Renang | kolam, kursi berjemur, payung, pohon kelapa, taman | - |

Karakter tetap per karyawan (diatur di `pixel-office/karakter.mjs`): Pak Asep jas biru, Kokom rambut ikal oranye, Joko afro, Ujang rambut jabrik, Neneng rambut bob, Ayu rambut panjang + gaun pink, Ricko jas hitam.

- Pasang / perbarui tampilan: `.\tools\pasang-pixel-office.ps1 -MulaiUlang`
- Kembalikan denah ke desain ini setelah diedit di editor Layout: `.\tools\pasang-pixel-office.ps1 -TimpaLayout -MulaiUlang`
- Ubah desain: edit `pixel-office/furnitur.mjs` / `layout.mjs` / `karakter.mjs`, lalu jalankan perintah di atas.
- Setelah mengedit denah lewat editor Layout, `pasang-pixel-office.ps1` memperingatkan kalau ada kursi yang jalannya tertutup furnitur (karakter tidak akan bisa ke sana).
- Karyawan yang duduk di luar ruangannya otomatis dipindah kembali ke ruangannya.

## Rapat & kerja bareng

Minta rapat lewat Pak Asep, misalnya di `#lobby`: `@Pak Asep rapat kickoff proyek X dengan Kokom dan Ujang`.

1. Pak Asep menentukan agenda dan peserta, lalu menjalankan `node tools/rapat.mjs mulai`. Karakter peserta berjalan ke **Ruang Rapat** dan duduk di sana; Pak Asep di kepala meja.
2. Putaran pendapat dan tanggapan lewat interkom. Semuanya tampil di `#ruang-rapat`.
3. Notulen disimpan di `00 Kantor Bersama/Rapat/`, ringkasannya dikirim ke Discord, lalu `rapat.mjs selesai` mengembalikan semua ke mejanya. Kalau lupa ditutup, rapat berakhir sendiri setelah 60 menit.

Di luar rapat, karyawan saling menghubungi langsung (tanya data, serah terima, laporan QA) dan cukup mengabari Pak Asep. Aturannya ada di bagian "Kerja bareng" dan "Rapat" di `karyawan/CLAUDE.md`.

Mode rapat bisa juga dijalankan manual:
```powershell
node tools/rapat.mjs mulai --topik "Kickoff" --peserta pak-asep,kokom,ujang --menit 30
node tools/rapat.mjs status
node tools/rapat.mjs selesai
```

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
