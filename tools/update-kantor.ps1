<#
.SYNOPSIS
  Ambil perubahan terbaru dari GitHub (mis. hasil sesi cloud yang PR-nya sudah di-merge)
  lalu terapkan ke kantor.

.DESCRIPTION
  1. git pull (hanya kalau tidak ada perubahan lokal yang belum di-commit).
  2. Ada perubahan di kantor-3d/ atau tools/karyawan.json -> pasang ulang Kantor 3D.
  3. Ada perubahan aturan / pengaturan karyawan -> karyawan yang sedang menganggur dibuka
     ulang (percakapan dan ingatan tetap). Yang sedang bekerja dibiarkan; aturan baru berlaku
     setelah ia dibuka ulang (jalankan script ini lagi nanti).

.EXAMPLE
  .\tools\update-kantor.ps1
#>
param()

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'kantor-umum.ps1')
Set-Location $KantorRoot

# File hasil `npm install` di kantor-3d\ bisa ditulis ulang setiap Kantor 3D
# dipasang, dan isinya bisa sedikit berbeda antar-komputer (versi Node/npm). Itu bukan suntingan
# Pak Ricko: kembalikan ke versi repo supaya git pull tidak terhalang.
$hasilBangun = @('kantor-3d/package-lock.json')
foreach ($f in $hasilBangun) {
  if (git ls-files -- $f) { git checkout -- $f 2>$null }
}

$lokal = @(git status --porcelain | Where-Object { $_ })
if ($lokal.Count) {
  Write-Warning 'Ada perubahan lokal yang belum di-commit. Update dibatalkan supaya tidak bentrok.'
  git status --short
  exit 1
}

$lama = (git rev-parse HEAD).Trim()
Write-Host 'Mengambil perubahan dari GitHub...' -ForegroundColor Cyan
git pull --ff-only
if ($LASTEXITCODE -ne 0) { throw 'git pull gagal (lihat pesan di atas).' }
$baru = (git rev-parse HEAD).Trim()
if ($lama -eq $baru) { Write-Host 'Sudah versi terbaru. Tidak ada yang perlu diterapkan.' -ForegroundColor Green; exit 0 }

Write-Host ''
Write-Host 'Perubahan baru:' -ForegroundColor Cyan
git log --oneline "$lama..$baru"
$berubah = @(git diff --name-only $lama $baru)

# --- Karyawan: buka ulang yang menganggur supaya membaca aturan / pengaturan baru ---
$aturanKaryawan = $berubah | Where-Object { $_ -match '^karyawan/|^tools/(jalankan-karyawan|kantor-umum|interkom-log)|^tools/atasan\.json$|^mulai-kantor\.ps1$' }
$perluPixel = $berubah | Where-Object { $_ -match '^kantor-3d/|^tools/karyawan\.json$|^tools/pasang-kantor-3d\.ps1$|^tools/lepas-pixel-agents\.mjs$' }
if ($aturanKaryawan) {
  Write-Host ''
  Write-Host 'Aturan / pengaturan karyawan berubah. Membuka ulang karyawan yang menganggur...' -ForegroundColor Cyan
  foreach ($k in Get-Karyawan) {
    foreach ($p in @(Get-ProsesKaryawan $k.id)) {
      if (Test-SesiMenganggur $p.ProcessId) {
        Stop-SesiTerminal $p.ProcessId
        Write-Host "  $($k.nama): dibuka ulang"
      } else {
        Write-Warning "$($k.nama) sedang bekerja, dibiarkan. Jalankan update ini lagi setelah ia selesai."
      }
    }
  }
}

# --- Kantor 3D ------------------------------------------------------------------
if ($perluPixel) {
  Write-Host ''
  Write-Host 'Tampilan Kantor 3D berubah. Memasang ulang...' -ForegroundColor Cyan
  & (Join-Path $PSScriptRoot 'pasang-kantor-3d.ps1') -MulaiUlang   # ikut membuka karyawan yang ditutup di atas
} elseif ($aturanKaryawan) {
  & (Join-Path $KantorRoot 'mulai-kantor.ps1') -TanpaBrowser
}

# --- Ikon desktop: pasang ulang kalau daftar ikonnya berubah (mis. ikon baru) ---------
if ($berubah -match '^tools/pasang-shortcut\.ps1$') {
  Write-Host ''
  Write-Host 'Ikon desktop berubah. Memasang ulang...' -ForegroundColor Cyan
  & (Join-Path $PSScriptRoot 'pasang-shortcut.ps1')
}

Write-Host ''
Write-Host 'Update selesai.' -ForegroundColor Green
