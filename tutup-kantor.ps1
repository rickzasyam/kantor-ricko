<#
.SYNOPSIS
  Menutup Kantor Ricko: semua karyawan berhenti bekerja dan Kantor 3D dimatikan.

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

foreach ($k in $karyawan) {
  $procs = @(Get-ProsesKaryawan $k.id)
  if (-not $procs.Count) { continue }
  foreach ($p in $procs) { Stop-SesiTerminal $p.ProcessId }
  Write-Host "  $($k.nama): pulang"
}

if (-not $Hanya) {
  if (Get-ServerKantor) {
    Stop-ServerKantor
    Write-Host '  Kantor 3D: dimatikan'
  }
}
Write-Host 'Kantor tutup.' -ForegroundColor Cyan
