<#
.SYNOPSIS
  Membuka Kantor Ricko: satu tab Windows Terminal per karyawan + satu tab pixel-agents.

.EXAMPLE
  .\mulai-kantor.ps1                              # semua karyawan
  .\mulai-kantor.ps1 -Hanya pak-asep,ujang,kokom  # sebagian saja (hemat kuota)
  .\mulai-kantor.ps1 -Baru                        # semua mulai percakapan baru
  .\mulai-kantor.ps1 -TanpaPixel                  # tanpa tampilan pixel office
#>
param(
  [string[]]$Hanya,
  [switch]$Baru,
  [switch]$TanpaPixel
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$karyawan = @(Get-Content (Join-Path $root 'tools\karyawan.json') -Raw | ConvertFrom-Json)
if ($Hanya) { $karyawan = @($karyawan | Where-Object { $Hanya -contains $_.id }) }
if ($karyawan.Count -eq 0) { throw 'Tidak ada karyawan yang cocok.' }

$runner = Join-Path $root 'tools\jalankan-karyawan.ps1'
$wtArgs = @()
foreach ($k in $karyawan) {
  if ($wtArgs.Count) { $wtArgs += ';' }
  $wtArgs += @('new-tab', '--title', $k.nama, '-d', (Join-Path $root "karyawan\$($k.id)"),
    'powershell', '-NoExit', '-ExecutionPolicy', 'Bypass', '-File', $runner, '-Id', $k.id)
  if ($Baru) { $wtArgs += '-Baru' }
}
if (-not $TanpaPixel) {
  $wtArgs += @(';', 'new-tab', '--title', 'Pixel Office', '-d', (Join-Path $root 'karyawan'),
    'powershell', '-NoExit', '-Command', 'npx --yes pixel-agents --port 3737')
}

& wt.exe -w kantor-ricko @wtArgs
Write-Host "Kantor dibuka: $($karyawan.nama -join ', ')" -ForegroundColor Cyan
if (-not $TanpaPixel) { Write-Host 'Buka link (dengan ?token=...) yang muncul di tab "Pixel Office" untuk melihat kantor.' }
