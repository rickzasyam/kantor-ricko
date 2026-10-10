<#
.SYNOPSIS
  Menutup Kantor Ricko: semua karyawan berhenti bekerja dan Pixel Office dimatikan.

.DESCRIPTION
  Sesi karyawan dihentikan dan tab terminalnya ditutup. Transkrip percakapan tetap
  tersimpan (besok dilanjutkan dengan --continue), dan ingatan jangka panjang di Drive
  tidak tersentuh.

.EXAMPLE
  .\tutup-kantor.ps1
  .\tutup-kantor.ps1 -Hanya joko,ayu
#>
param([string[]]$Hanya)

. (Join-Path $PSScriptRoot 'tools\kantor-umum.ps1')
$karyawan = Get-Karyawan $Hanya
$ids = @($karyawan | ForEach-Object { $_.id })

# Sisa background session (claude --bg) dari percobaan lama.
foreach ($s in @(Get-SesiClaude | Where-Object { $_.kind -eq 'background' -and $ids -contains $_.name })) {
  & claude stop $s.id 2>&1 | Out-Null
  & claude rm $s.id 2>&1 | Out-Null
}

foreach ($k in $karyawan) {
  $procs = @(Get-ProsesKaryawan $k.id)
  if (-not $procs.Count) { continue }
  foreach ($p in $procs) { Stop-SesiTerminal $p.ProcessId }
  Write-Host "  $($k.nama): pulang"
}

if (-not $Hanya) {
  $px = Get-PixelOfficeServer
  if ($px) {
    taskkill /PID $px.pid /T /F 2>&1 | Out-Null
    Write-Host '  Pixel Office: dimatikan'
  }
}
Write-Host 'Kantor tutup.' -ForegroundColor Cyan
