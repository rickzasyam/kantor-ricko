<#
.SYNOPSIS
  Memasang tampilan Pixel Office Kantor Ricko: karakter tetap per karyawan, furnitur
  kustom, denah kantor baru, dan pembagian ruangan.

.DESCRIPTION
  - npm install di pixel-office\ (pixel-agents dikunci di versi 1.4.1) + patch karakter
  - node bangun.mjs: furnitur, karakter kustom, denah, karakter.json
  - ~/.pixel-agents/config.json: folder aset kustom + areaMappings (siapa duduk di ruang mana)
  - ~/.pixel-agents/layout.json: dipasang kalau belum ada, kalau -TimpaLayout, atau sekali
    saat versi desain denah di repo naik. Layout lama selalu di-backup dulu.
  - -MulaiUlang: matikan Pixel Office yang sedang jalan lalu buka lagi dengan versi baru.

.EXAMPLE
  .\tools\pasang-pixel-office.ps1 -MulaiUlang
  .\tools\pasang-pixel-office.ps1 -TimpaLayout -MulaiUlang   # kembalikan denah ke desain ini
#>
param([switch]$TimpaLayout, [switch]$MulaiUlang)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'kantor-umum.ps1')
$po = Join-Path $KantorRoot 'pixel-office'
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$pa = Join-Path $env:USERPROFILE '.pixel-agents'
New-Item -ItemType Directory -Force -Path $pa | Out-Null

# --- 1. Paket + patch + aset ------------------------------------------------------
Push-Location $po
try {
  if (-not (Test-Path 'node_modules\pixel-agents\dist\cli.js')) {
    Write-Host 'Memasang paket pixel-agents...'
    npm install --no-audit --no-fund | Out-Null
  }
  node patch-pixel-agents.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Patch pixel-agents gagal.' }
  node bangun.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Membangun aset gagal (lihat MASALAH DENAH di atas).' }
} finally { Pop-Location }

# --- 2. Konfigurasi pixel-agents ---------------------------------------------------
$cfgFile = Join-Path $pa 'config.json'
$cfg = if (Test-Path $cfgFile) { Get-Content $cfgFile -Raw | ConvertFrom-Json } else { [pscustomobject]@{} }
if (-not $cfg.PSObject.Properties['standalone']) { $cfg | Add-Member -NotePropertyName standalone -NotePropertyValue ([pscustomobject]@{}) }

$asetDir = Join-Path $po 'aset'
$dirs = @(@($cfg.externalAssetDirectories) | Where-Object { $_ -and $_ -ne $asetDir })
$cfg | Add-Member -Force -NotePropertyName externalAssetDirectories -NotePropertyValue (@($dirs) + $asetDir)

# Nama folder sesi (seperti terbaca pixel-agents) -> ruangan tempat duduknya.
$kerja = @('Ruang Kerja')
$mapping = [ordered]@{
  'Ricko' = @('Ruang Ricko')
  'asep' = @('Ruang Manajer')
  'kokom' = $kerja; 'ujang' = $kerja; 'joko' = $kerja; 'neneng' = $kerja; 'ayu' = $kerja
}
$cfg.standalone | Add-Member -Force -NotePropertyName areaMappings -NotePropertyValue ([pscustomobject]$mapping)
$cfg.standalone | Add-Member -Force -NotePropertyName showAreas -NotePropertyValue $false
$cfg.standalone | Add-Member -Force -NotePropertyName alwaysShowLabels -NotePropertyValue $true
$cfg.standalone | Add-Member -Force -NotePropertyName watchAllSessions -NotePropertyValue $true
if (Test-Path $cfgFile) { Copy-Item $cfgFile "$cfgFile.bak-kantor" -Force }
[IO.File]::WriteAllText($cfgFile, ($cfg | ConvertTo-Json -Depth 10), $utf8NoBom)
Write-Host 'Konfigurasi pixel-agents diperbarui (folder aset + pembagian ruangan).'

# --- 3. Denah ------------------------------------------------------------------------
$layoutFile = Join-Path $pa 'layout.json'
# Versi desain denah (layoutRevision di layout-kantor.json, dari VERSI_DENAH di layout.mjs).
# Kalau desain di repo lebih baru dari yang terakhir dipasang, denah dipasang ulang sekali
# (denah lama tetap di-backup). Setelah itu suntingan lewat editor Layout dipertahankan lagi.
$versiFile = Join-Path $pa 'kantor-versi-denah.txt'
$versiRepo = [int](Get-Content (Join-Path $po 'layout-kantor.json') -Raw | ConvertFrom-Json).layoutRevision
$versiPasang = 0
if (Test-Path $versiFile) { $versiPasang = [int]((Get-Content $versiFile -Raw).Trim()) }
$desainBaru = $versiRepo -gt $versiPasang
if ($desainBaru -and (Test-Path $layoutFile)) { Write-Host "Desain kantor baru (versi $versiRepo). Denah dipasang ulang." -ForegroundColor Cyan }
if (-not (Test-Path $layoutFile) -or $TimpaLayout -or $desainBaru) {
  if (Test-Path $layoutFile) {
    $bak = "$layoutFile.bak-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $layoutFile $bak
    Write-Host "Denah lama disimpan: $bak"
  }
  Copy-Item (Join-Path $po 'layout-kantor.json') $layoutFile -Force
  [IO.File]::WriteAllText($versiFile, "$versiRepo", $utf8NoBom)
  Write-Host 'Denah Kantor Ricko dipasang.'
} else {
  Write-Host 'Denah yang ada dipertahankan (pakai -TimpaLayout untuk mengganti dengan desain ini).'
}

# --- 4. Mulai ulang Pixel Office -----------------------------------------------------
if ($MulaiUlang) {
  $px = Get-PixelOfficeServer
  if ($px) { taskkill /PID $px.pid /T /F 2>&1 | Out-Null; Start-Sleep -Seconds 1 }
  & (Join-Path $KantorRoot 'mulai-kantor.ps1') -TanpaBrowser
}
