<#
.SYNOPSIS
  Menjalankan satu karyawan: sesi Claude Code + bot Discord-nya.

.DESCRIPTION
  Biasanya dipanggil oleh mulai-kantor.ps1, tapi bisa juga dijalankan langsung.
  Secara default karyawan MELANJUTKAN percakapan terakhirnya (--continue), jadi
  tidak lupa apa yang sedang dikerjakan. Ingatan jangka panjang (auto memory di
  Google Drive) tetap ada walaupun memakai -Baru.

.EXAMPLE
  .\tools\jalankan-karyawan.ps1 -Id kokom
  .\tools\jalankan-karyawan.ps1 -Id kokom -Baru   # mulai percakapan baru
#>
param(
  [Parameter(Mandatory = $true)][string]$Id,
  [switch]$Baru
)

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
# "| ForEach-Object { $_ }": PowerShell 5.1 mengembalikan array JSON sebagai satu objek; ini memecahnya per karyawan.
$k = Get-Content (Join-Path $root 'tools\karyawan.json') -Raw | ConvertFrom-Json | ForEach-Object { $_ } | Where-Object { $_.id -eq $Id }
if (-not $k) { throw "Karyawan '$Id' tidak ditemukan di tools\karyawan.json" }

$dir = Join-Path $root "karyawan\$Id"
$state = Join-Path $env:USERPROFILE ".claude\channels\kantor-ricko\$Id"
if (-not (Test-Path (Join-Path $state '.env'))) {
  Write-Warning "Bot Discord $($k.nama) belum disetup. Jalankan .\tools\setup-discord.ps1 dulu."
}

$env:DISCORD_STATE_DIR = $state
$Host.UI.RawUI.WindowTitle = "$($k.nama) - $($k.role)"
Set-Location $dir

$claudeArgs = @(
  '--name', $Id,
  '--settings', (Join-Path $dir 'kantor-settings.json'),
  '--permission-mode', 'auto',
  '--channels', 'plugin:discord@claude-plugins-official'
)

# Lanjutkan percakapan terakhir kalau sudah pernah ada.
$projectKey = $dir -replace '[^A-Za-z0-9]', '-'
$transcripts = Join-Path $env:USERPROFILE ".claude\projects\$projectKey"
$hasHistory = (Test-Path $transcripts) -and (Get-ChildItem $transcripts -Filter '*.jsonl' -ErrorAction SilentlyContinue)
if (-not $Baru -and $hasHistory) { $claudeArgs = @('--continue') + $claudeArgs }

Write-Host "Menjalankan $($k.nama) ($($k.role))..." -ForegroundColor Cyan
& claude @claudeArgs
