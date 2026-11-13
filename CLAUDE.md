# Panduan developer Kantor Ricko

File ini untuk sesi Claude Code yang **mengubah kode repo ini** (sesi cloud atau sesi lokal di root repo).
Karyawan kantor melewati file ini (`claudeMdExcludes` di `karyawan/<id>/kantor-settings.json`); aturan mereka ada di `karyawan/CLAUDE.md`.

## Pemilik
Pak Ricko, berbahasa Indonesia, masih awam istilah agent/developer. Jelaskan dengan bahasa sederhana (analogi kantor), ringkas, dan selalu bilang apa yang harus ia klik/jalankan.

## Apa ini
"Kantor virtual" berisi 6 karyawan Claude Code (satu akun Claude **Pro**, tanpa API key) di **satu PC Windows 11**:
- Tiap karyawan = sesi Claude Code interaktif di tab Windows Terminal yang disembunyikan, `--channels plugin:discord@claude-plugins-official` (satu bot Discord per karyawan), mode izin `auto`, `--continue`.
- Antar-karyawan bicara lewat **interkom** = cross-session messaging (`SendMessage`), disalin ke Discord `#ruang-rapat` oleh hook `tools/interkom-log.mjs`.
- File kerja di Google Drive for Desktop, `G:\My Drive\Kantor Ricko\` (bukan di repo). Ingatan karyawan: `autoMemoryDirectory` di Drive.
- Tampilan: **Kantor 3D** (`kantor-3d/`): frontend Three.js + server Node kecil buatan sendiri, port 3737. Tidak lagi memakai pixel-agents; satu-satunya paket adalah `three` (versi dikunci).
- Token bot, `access.json`, webhook: `%USERPROFILE%\.claude\channels\kantor-ricko\`, **di luar repo. Jangan pernah commit rahasia.**

Peta file: lihat bagian "Isi folder" di `README.md`. Daftar karyawan + jabatan: `tools/karyawan.json`.

## Kerja dari sesi cloud
- Sesi cloud berjalan di Linux dan hanya punya salinan repo. **Tidak bisa** menjalankan/menguji: script PowerShell, Discord, Drive `G:`, Windows Terminal, karyawan yang sedang jalan, Kantor 3D live.
- Yang bisa diuji di cloud:
  - Kantor 3D: `cd kantor-3d && npm ci && npm test` (denah, perilaku, server, dan alat kantor diuji tanpa browser). Tampilan browsernya bisa dicoba dengan kantor tiruan (lihat bagian Kantor 3D). Jangan commit `node_modules/`.
  - Script Node: `node --check <file>`; `tools/interkom-log.mjs` bisa dites dengan server HTTP lokal + env `INTERKOM_WEBHOOK_FILE`.
  - Script PowerShell: minimal periksa sintaks kalau `pwsh` ada (`[System.Management.Automation.Language.Parser]::ParseFile`).
- Kerjakan di branch, buka PR dengan deskripsi bahasa Indonesia: apa yang berubah, dan **cara menerapkannya**. Biasanya cukup: merge PR, lalu klik ikon **Update Kantor** di desktop (`tools/update-kantor.ps1`: pull, pasang ulang Kantor 3D kalau `kantor-3d/` berubah, buka ulang karyawan yang menganggur kalau aturan/pengaturan mereka berubah). Sebutkan juga apa yang perlu dicek Pak Ricko secara visual.
- Hemat: kredit cloud dan kuota Pro terbatas. Jangan menjalankan hal berat yang tidak perlu.

## Aturan teknis (pelajaran yang sudah dibayar mahal)
**PowerShell 5.1 (semua `.ps1`)**
- Simpan script **ASCII saja** (PS 5.1 membaca file tanpa BOM sebagai ANSI).
- Hasil `ConvertFrom-Json`/`Invoke-RestMethod` berupa array perlu `| ForEach-Object { $_ }` supaya tidak menjadi satu objek.
- Jangan pakai nama parameter `-Debug`/`-Verbose` (bentrok dengan parameter bawaan). Kunci hashtable tidak peka huruf besar-kecil (`Ricko` = `ricko`).
- Commit dengan pesan berisi tanda kutip: `git commit -F file`, bukan `-m`.

**Karyawan / Claude Code**
- Sesi yang dibuka dari dalam sesi Claude Code lain mewarisi env `CLAUDE*`/`ANTHROPIC_*` dan menjadi "sesi anak" yang tidak terdaftar di interkom. `tools/jalankan-karyawan.ps1` membuang variabel itu; jangan dihapus.
- `~/.claude/mcp-needs-auth-cache.json` bersifat global: plugin Discord yang gagal di sesi mana pun membuat semua sesi berikutnya melewatkannya. Plugin Discord dimatikan di `~/.claude/settings.json` dan hanya dinyalakan lewat `enabledPlugins` di `kantor-settings.json`; `mulai-kantor.ps1` menghapus tandanya.
- Jangan pakai `claude --bg` / `claude agents` (sudah diuji: channel Discord hilang, daemon menyala). Jangan pernah mematikan `WindowsTerminal.exe` (jendela kantor tersembunyi ada di sana).
- Karyawan sehat = proses `claude.exe` dengan `--name <id>` + `kantor-settings.json`, punya proses `bun.exe` (Discord), dan file `~/.claude/sessions/<pid>.json` (interkom; `status: idle` = aman dibuka ulang).
- Perubahan `karyawan/**/CLAUDE.md` atau `kantor-settings.json` baru berlaku setelah karyawan dibuka ulang.
- Model per karyawan diatur di `kantor-settings.json` (`model`, `effortLevel`): Pak Asep haiku, Ujang/Joko/Ayu opus, Kokom/Neneng sonnet. Mode `auto` mendukung Haiku 5.5. Pilihan dari dashboard STAFF Kantor 3D (`~/.kantor-ricko/kantor-karyawan.json`: `model`, `jobdesk` per id) mengalahkannya: `jalankan-karyawan.ps1` menambahkan `--model`, hook `SessionStart` (`tools/jobdesk.mjs`) membacakan job desk. Pilihan dashboard sengaja di luar repo: file repo yang berubah membuat Update Kantor menolak `git pull`.
- Karyawan yang gagal karena akun (login kedaluwarsa, kuota habis) tidak bisa membalas sendiri. Hook `StopFailure` di `kantor-settings.json` menjalankan `tools/alarm-gagal.mjs`, yang membalas pesan Discord terakhir lewat bot karyawan itu (cadangan: webhook `#ruang-rapat`), paling sering sekali per 30 menit per masalah+channel (`~/.claude/channels/kantor-ricko/alarm-gagal.json`). Uji dengan server tiruan: env `KANTOR_DISCORD_API` + `INTERKOM_WEBHOOK_FILE`, dan picu `StopFailure` lewat `claude -p --model <nama-palsu>` (matcher `model_not_found`). Path dari Git Bash harus `cygpath -m`.
- Karyawan yang menunggu izin berhenti di terminal tersembunyi (status sesi `waiting` + `waitingFor: "permission prompt"`). Hook `Notification` (matcher `permission_prompt`) melapor lewat `alarm-gagal.mjs`; Kantor 3D memberi gelembung "Needs approval" dari status sesi itu (`kantor-3d/server.mjs` membaca status sesi itu). `additionalDirectories` mencakup Drive kantor dan `Documents\Coding` supaya proyek client tidak memicu izin.
- Kuota: `statusLine` karyawan menjalankan `tools/status-kantor.mjs`, yang menyimpan `rate_limits` (5 jam & mingguan) ke `~/.kantor-ricko/kantor-kuota.json`; server Kantor 3D menyiarkannya ke browser.
- Plugin ponytail (gaya "kode sesedikit mungkin") terpasang global di PC; hanya berguna untuk Joko & Ujang, karyawan lain mematikannya lewat `"ponytail@ponytail": false` di `enabledPlugins` (`--settings` mengalahkan pengaturan user).
- Plugin per karyawan: pasang di user scope lalu `claude plugin disable` (global mati), nyalakan lewat `enabledPlugins` di `kantor-settings.json`. Sekarang: impeccable (Ayu, Joko), ui-ux-pro-max (Ayu). Skill xlsx/docx/pdf/pptx sudah bawaan akun (`anthropic-skills`), jangan pasang document-skills. Plugin "synced" dari akun claude.ai (sales, zoom, hr, ...) dimatikan per karyawan lewat `"<nama>@synced": false`, sisakan yang sesuai jabatan (daftar nama skill ikut terbaca tiap giliran kerja). Chrome tidak diblokir, tapi aturan kantor menaruhnya paling akhir setelah connector/skill/CLI (Ujang pernah 2.900 aksi Chrome). Gmail di-deny kecuali Pak Asep.
- Plugin Discord membuang pesan dari bot lain, jadi karyawan tidak bisa saling bicara lewat Discord, hanya lewat interkom.

**Kantor 3D (`kantor-3d/`)**
- Mandiri: tidak ada pixel-agents, sprite, atau tileset. Semua model dirakit dari bentuk dasar di `web/model.js` (furnitur) dan `web/tokoh.js` (karakter); lantai dilukis ke kanvas di `web/dunia.js`. Furnitur diam digabung jadi dua jaring (terkena cahaya + "pijar" untuk lampu/layar) supaya draw call sedikit; tiap karakter 7 jaring. Jaga ini saat menambah benda: tambahkan ke `Rakit`, jangan membuat `Mesh` baru per benda.
- Arah seni tetap kantor Jepang yang hangat (Japandi): oak, plester krem, linen, rotan, batu, sage/matcha; tanpa neon dan warna jenuh. Palet di `W` (`model.js`).
- `web/denah.js` dan `web/simulasi.js` murni hitungan (tanpa Three.js) supaya bisa diuji Node. `npm test` memeriksa semua kursi, futon, kursi rapat, dan tempat santai bisa didatangi; jalankan setiap mengubah denah. Furnitur: `FURNITUR` (titik tengah, `r` = putaran, model menghadap +z/selatan) + tapaknya di `TAPAK`. Futon ke-n (`KASUR`) milik karyawan ke-n di `tools/karyawan.json`.
- Sumber data server (`server.mjs`): status karyawan dari `~/.claude/sessions/<pid>.json` (`name` = id karyawan, `status` idle/busy/waiting, proses harus hidup) + ekor transkrip sesi untuk tool yang sedang dipakai dan isi konteks; Pak Ricko = sesi yang `cwd`-nya root repo. Kuota, rapat, interkom, dan pilihan Staff dari file di `~/.kantor-ricko/` (env `KANTOR_DIR` untuk pengujian), ditulis `tools/status-kantor.mjs`, `rapat.mjs`, `interkom-log.mjs`, dan server sendiri. Browser menerima semuanya lewat Server-Sent Events (`/api/events`).
- Semua rute `/api/` wajib token (`Authorization: Bearer` atau `?token=`); token disimpan di `~/.kantor-ricko/token.txt` supaya alamat kantor tetap. Server hanya mendengar di 127.0.0.1.
- Perilaku (`simulasi.js`), urut prioritas: interkom (jalan ke rekan + gelembung), rapat, kerja di meja, tidur di Mess saat kuota habis (>= 99,5% dan belum reset), santai. Id karyawan dipakai apa adanya (`pak-asep`), tidak ada lagi nama pendek ala pixel-agents.
- Semua teks antarmuka berbahasa Inggris (permintaan Pak Ricko); isi obrolan karyawan apa adanya. Komentar kode tetap bahasa Indonesia.
- Daftar model panel Staff dibaca dari `~/.claude.json` (`additionalModelOptionsCache`, `clientDataCacheSlots`, keluarga model di `cachedGrowthBookFeatures`); nama kunci itu milik Claude Code dan bisa berubah, cadangannya alias `haiku`/`sonnet`/`opus`.
- Menguji tampilan tanpa mengganggu kantor yang sedang jalan: kerjakan di git worktree terpisah (file di repo utama dipakai hook karyawan yang sedang bekerja). `node uji/kantor-tiruan.mjs siapkan` membuat home palsu berisi sesi tiruan; jalankan `node server.mjs --port 3838` dengan env `USERPROFILE` + `HOME` ke folder itu, lalu ubah keadaan lewat perintah `status` / `kuota` / `interkom` / `rapat`. Di panel browser Claude animasi hanya berjalan saat di-screenshot: majukan waktu dengan `__kantor.maju(detik)`. Jangan memanggil rute `buka-ulang` dari server uji: ia bisa menyentuh karyawan asli.
- Pindahan dari Pixel Office dikerjakan `tools/pasang-kantor-3d.ps1` (dipanggil juga lewat nama lama `pasang-pixel-office.ps1`, karena `update-kantor.ps1` versi lama masih memanggil nama itu saat menarik perubahan ini): menyalin data lama, melepas hook Pixel Agents dari `~/.claude/settings.json` (`tools/lepas-pixel-agents.mjs`), mematikan server lama.
- Perintah shell lewat heredoc di sesi ini pernah menelan garis miring terbalik ganda (`\\` jadi `\`): untuk file berisi regex atau path Windows, tulis lewat alat Write/Edit lalu periksa hasilnya.

**PC**
- RAM 16 GB dan disk C: hampir penuh. Enam sesi + game bisa membuat pagefile memenuhi C: (`ENOSPC`, karyawan mati). Jangan menambah proses berat yang selalu menyala.

## Gaya kode
Ikuti kode di sekitarnya: komentar dan pesan untuk pengguna dalam bahasa Indonesia, nama variabel Indonesia, komentar menjelaskan *kenapa*. Perbarui `README.md` kalau cara pakai berubah.
