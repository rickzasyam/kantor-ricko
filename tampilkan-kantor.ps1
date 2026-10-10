<#
.SYNOPSIS
  Menampilkan atau menyembunyikan jendela Windows Terminal Kantor Ricko.

.DESCRIPTION
  Tanpa parameter: kalau tersembunyi ditampilkan, kalau tampil disembunyikan.
  Jendela yang tersembunyi tidak muncul di layar maupun taskbar, tapi karyawan
  tetap bekerja dan mendengarkan Discord.

.EXAMPLE
  .\tampilkan-kantor.ps1               # tukar tampil / sembunyi
  .\tampilkan-kantor.ps1 -Tampilkan
  .\tampilkan-kantor.ps1 -Sembunyikan
#>
param([switch]$Tampilkan, [switch]$Sembunyikan)

. (Join-Path $PSScriptRoot 'tools\kantor-umum.ps1')
$jendela = Get-JendelaKantor
if ($jendela.Count -eq 0) {
  Write-Host 'Jendela kantor tidak ditemukan. Kantor mungkin belum dibuka: .\mulai-kantor.ps1' -ForegroundColor Yellow
  return
}

$tampil = if ($Tampilkan) { $true } elseif ($Sembunyikan) { $false } else { -not [KantorWin]::IsWindowVisible($jendela[0]) }
Set-JendelaKantor $tampil
Write-Host $(if ($tampil) { 'Jendela kantor ditampilkan.' } else { 'Jendela kantor disembunyikan.' })
