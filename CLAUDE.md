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
- Tampilan: **pixel-agents 1.4.1** (npm, dikunci) + patch di `pixel-office/`, server lokal port 3737.
- Token bot, `access.json`, webhook: `%USERPROFILE%\.claude\channels\kantor-ricko\`, **di luar repo. Jangan pernah commit rahasia.**

Peta file: lihat bagian "Isi folder" di `README.md`. Daftar karyawan + jabatan: `tools/karyawan.json`.

## Kerja dari sesi cloud
- Sesi cloud berjalan di Linux dan hanya punya salinan repo. **Tidak bisa** menjalankan/menguji: script PowerShell, Discord, Drive `G:`, Windows Terminal, karyawan yang sedang jalan, Pixel Office live.
- Yang bisa diuji di cloud:
  - Pixel Office: `cd pixel-office && npm ci && node patch-pixel-agents.mjs && node bangun.mjs` (patch harus "N patch terpasang", denah harus "Validasi denah: OK"). Jangan commit `node_modules/`. Hasil bangun (`aset/`, `layout-kantor.json`, `karakter.json`) tidak disimpan di git: dibuat ulang di PC saat Pixel Office dipasang (byte PNG bisa beda antar-versi Node, dulu ini membuat Update Kantor tertahan "perubahan lokal").
  - Script Node: `node --check <file>`; `tools/interkom-log.mjs` bisa dites dengan server HTTP lokal + env `INTERKOM_WEBHOOK_FILE`.
  - Script PowerShell: minimal periksa sintaks kalau `pwsh` ada (`[System.Management.Automation.Language.Parser]::ParseFile`).
- Kerjakan di branch, buka PR dengan deskripsi bahasa Indonesia: apa yang berubah, dan **cara menerapkannya**. Biasanya cukup: merge PR, lalu klik ikon **Update Kantor** di desktop (`tools/update-kantor.ps1`: pull, pasang ulang Pixel Office kalau `pixel-office/` berubah, buka ulang karyawan yang menganggur kalau aturan/pengaturan mereka berubah). Sebutkan juga apa yang perlu dicek Pak Ricko secara visual.
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
- Model per karyawan diatur di `kantor-settings.json` (`model`, `effortLevel`): Pak Asep haiku, Kokom/Ujang/Joko opus, Neneng/Ayu sonnet. Mode `auto` mendukung Haiku 5.5.
- Karyawan yang gagal karena akun (login kedaluwarsa, kuota habis) tidak bisa membalas sendiri. Hook `StopFailure` di `kantor-settings.json` menjalankan `tools/alarm-gagal.mjs`, yang membalas pesan Discord terakhir lewat bot karyawan itu (cadangan: webhook `#ruang-rapat`), paling sering sekali per 30 menit per masalah+channel (`~/.claude/channels/kantor-ricko/alarm-gagal.json`). Uji dengan server tiruan: env `KANTOR_DISCORD_API` + `INTERKOM_WEBHOOK_FILE`, dan picu `StopFailure` lewat `claude -p --model <nama-palsu>` (matcher `model_not_found`). Path dari Git Bash harus `cygpath -m`.
- Plugin Discord membuang pesan dari bot lain, jadi karyawan tidak bisa saling bicara lewat Discord, hanya lewat interkom.

**Pixel Office (pixel-agents 1.4.1)**
- `patch-pixel-agents.mjs` menerapkan patch ke salinan asli (`*.asli`) `dist/cli.js` dan `dist/webview/assets/index-*.js` (tema warna ditempel di akhir `index-*.css`). Tiap titik patch harus muncul tepat 1x; nama variabel hasil minify (`lo`, `Sa`, `E.jsx`, `a.folderName`, ...) hanya berlaku untuk 1.4.1. Naik versi = cari ulang semua titik patch.
- Arah seni: kantor Jepang yang hangat (Japandi): oak, plester krem, linen, rotan, batu, sage/matcha; tanpa neon dan warna jenuh. Palet & bahan bersama di `lib/bahan.mjs` (`P`, `kayuAtas`, `batu`, `daun`, ...), cahaya dari kiri-atas, garis luar cokelat tua. Gambar furnitur per area di `furnitur/*.mjs` (daftar `SINGLE`/`ANIMASI`/`ROTASI`), dirakit `furnitur.mjs`; id ganda membuat bangun gagal.
- Lantai & dinding: `lantai.mjs` (dipanggil `bangun.mjs`) menulis pola abu-abu ke `node_modules/pixel-agents/dist/assets/floors/floor_9.png` dst. dan mengganti `walls/wall_0.png` (asli: `wall_0.png.asli`). Tipe tile = nomor pola + 1 (`TIPE_LANTAI`); warnanya diatur per tile di `layout.mjs` (`W`, rumus pewarnaan di kepala `lantai.mjs`).
- Cahaya: `pixel-office/cahaya.js` (disuntikkan patch) menumpuk peta cahaya (multiply + screen) setelah karakter digambar; waktu mengikuti jam PC. Lampu/jendela/pohon yang memancarkan atau meneduhkan didaftarkan di `__KANTOR_LAMPU`/`__KANTOR_JENDELA`/`__KANTOR_TEDUH`. Uji: `window.__kantorWaktu = 'malam'`, matikan: `window.__kantorCahaya = false`.
- Nama folder karakter = segmen terakhir nama folder sesi setelah `-` (`pak-asep` -> `asep`, root repo -> `Ricko`). Karakter tetap: `pixel-office/karakter.mjs`; ruangan: `areaMappings` di `~/.pixel-agents/config.json` (dipasang `tools/pasang-pixel-office.ps1`).
- Kursi = furnitur kategori `chairs`; tile kursi termasuk tile terhalang, jadi harus ada jalan ke sebelahnya. `layout.mjs` mengecek semua kursi terjangkau.
- Pak Ricko suka mengedit denah lewat editor Layout (`~/.pixel-agents/layout.json`). **Jangan menimpa denahnya (`-TimpaLayout`) tanpa izin**; salin perubahannya ke `layout.mjs` kalau perlu. Furnitur baru tambahkan di akhir daftar `FURNITUR` supaya uid furnitur lama tetap.
- Denah baru yang harus menggantikan denah Pak Ricko: naikkan `VERSI_DENAH` di `layout.mjs` (dipasang sekali oleh `pasang-pixel-office.ps1`, denah lama di-backup). Hanya kalau ia memintanya.
- Aktivitas karyawan saat menganggur: `pixel-office/aktivitas.js` (kode biasa, disuntikkan patch). Memakai nama minify 1.4.1 (`R`, `z`, `Ai`, `Oi`, `Ii`, `Vi`, `_i`, `ni`, `xn`). Uji di browser dengan karyawan tiruan: `window.__kantorOffice.current.addAgent(...)`, bobot aktivitas lewat `window.__kantorJenisAktivitas`. Aktivitas terikat ke id furnitur lewat regex di `__KANTOR_JENIS` (mis. `MATCHA_BAR`, `ONSEN`, `ZABUTON`); ganti id furnitur = perbarui regexnya. Batas air onsen ada di `__kantorKolam` dan harus sama dengan `ONSEN.renang` di `furnitur/taman.mjs`.
- Mode rapat: `tools/rapat.mjs` menulis `~/.pixel-agents/kantor-rapat.json`; server menyiarkannya, tampilan memindah peserta ke Ruang Rapat.

**PC**
- RAM 16 GB dan disk C: hampir penuh. Enam sesi + game bisa membuat pagefile memenuhi C: (`ENOSPC`, karyawan mati). Jangan menambah proses berat yang selalu menyala.

## Gaya kode
Ikuti kode di sekitarnya: komentar dan pesan untuk pengguna dalam bahasa Indonesia, nama variabel Indonesia, komentar menjelaskan *kenapa*. Perbarui `README.md` kalau cara pakai berubah.
