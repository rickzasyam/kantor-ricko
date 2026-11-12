<#
.SYNOPSIS
  Membuka ulang satu karyawan supaya model / jobdesk barunya berlaku. Dipanggil tombol
  "Save & restart" di dashboard Staff Pixel Office (lewat server Pixel Office).

.DESCRIPTION
  Karyawan yang sedang bekerja TIDAK diganggu: script mencetak SIBUK dan berhenti, pengaturan
  baru berlaku saat ia dibuka ulang nanti. Kalau menganggur (atau belum jalan), sesinya ditutup
  lalu dibuka lagi lewat mulai-kantor.ps1 (percakapan dan ingatan tetap), dan script mencetak DIBUKA.

.EXAMPLE
  .\tools\buka-ulang-karyawan.ps1 -Id ujang
#>
param([Parameter(Mandatory = $true)][string]$Id)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'kantor-umum.ps1')
if (@(Get-Karyawan @($Id)).Count -eq 0) { throw "Karyawan '$Id' tidak ditemukan di tools\karyawan.json" }

$proses = @(Get-ProsesKaryawan $Id)
foreach ($p in $proses) {
  if (-not (Test-SesiMenganggur $p.ProcessId)) { Write-Output 'SIBUK'; exit 0 }
}
foreach ($p in $proses) { Stop-SesiTerminal $p.ProcessId }

# Dibuka di proses terpisah: mulai-kantor menunggu karyawan siap (bisa 1 menit lebih), sedangkan
# dashboard perlu jawaban segera.
$mulai = Join-Path $KantorRoot 'mulai-kantor.ps1'
Start-Process powershell -WindowStyle Hidden -ArgumentList @(
  '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$mulai`"", '-Hanya', $Id, '-TanpaPixel'
)
Write-Output 'DIBUKA'
