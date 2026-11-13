<#
.SYNOPSIS
  Memasang tampilan Kantor 3D (folder kantor-3d\): Three.js + server kecilnya.

.DESCRIPTION
  - npm install di kantor-3d\ kalau Three.js belum ada (satu-satunya paket yang dipakai).
  - Pindahan dari Pixel Office, sekali saja: pilihan Staff & kuota disalin dari ~/.pixel-agents
    ke ~/.kantor-ricko, hook Pixel Agents dilepas dari ~/.claude/settings.json.
  - -MulaiUlang: matikan server tampilan yang sedang jalan (termasuk Pixel Office lama), buang
    sisa folder pixel-office\ (node_modules & hasil bangun), lalu nyalakan Kantor 3D.

.EXAMPLE
  .\tools\pasang-kantor-3d.ps1 -MulaiUlang
#>
param([switch]$MulaiUlang)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'kantor-umum.ps1')
$k3d = Join-Path $KantorRoot 'kantor-3d'
New-Item -ItemType Directory -Force -Path $DirKantor | Out-Null

# --- 1. Three.js ---------------------------------------------------------------------
if (-not (Test-Path (Join-Path $k3d 'node_modules\three\build\three.module.js'))) {
  Write-Host 'Memasang Three.js...'
  Push-Location $k3d
  try {
    npm install --no-audit --no-fund | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'npm install di kantor-3d gagal.' }
  } finally { Pop-Location }
}

# --- 2. Pindahan dari Pixel Office (aman diulang) --------------------------------------
$lama = Join-Path $env:USERPROFILE '.pixel-agents'
foreach ($f in @('kantor-karyawan.json', 'kantor-kuota.json')) {
  $dari = Join-Path $lama $f
  $ke = Join-Path $DirKantor $f
  if ((Test-Path $dari) -and -not (Test-Path $ke)) { Copy-Item $dari $ke; Write-Host "Data lama dipindahkan: $f" }
}
node (Join-Path $PSScriptRoot 'lepas-pixel-agents.mjs')

# --- 3. Mulai ulang --------------------------------------------------------------------
if ($MulaiUlang) {
  Stop-ServerKantor
  Start-Sleep -Seconds 1
  # Sisa Pixel Office yang tidak dilacak git (node_modules, aset hasil bangun). Dihapus hanya
  # kalau folder itu memang sudah tidak punya file repo.
  $po = Join-Path $KantorRoot 'pixel-office'
  if ((Test-Path $po) -and -not (git -C $KantorRoot ls-files -- pixel-office)) {
    try { [IO.Directory]::Delete($po, $true); Write-Host 'Folder pixel-office lama dihapus.' } catch { Write-Warning "Folder pixel-office belum bisa dihapus: $($_.Exception.Message)" }
  }
  & (Join-Path $KantorRoot 'mulai-kantor.ps1') -TanpaBrowser
}
