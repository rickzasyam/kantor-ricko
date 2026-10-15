<#
.SYNOPSIS
  Memasang (atau menghapus) shortcut Kantor Ricko.

.DESCRIPTION
  Membuat:
  - Startup Windows : "Kantor Ricko"     -> kantor terbuka otomatis saat login (tanpa jendela)
  - Desktop         : "Buka Kantor"      -> buka kantor + Pixel Office di browser
  - Desktop         : "Buka Kantor Baru" -> buka kantor dengan meja bersih (percakapan baru), seminggu sekali
  - Desktop         : "Tutup Kantor"     -> semua karyawan pulang
  - Desktop         : "Lihat Kantor"     -> tampilkan / sembunyikan jendela terminal karyawan
  - Desktop         : "Update Kantor"    -> ambil perubahan dari GitHub lalu terapkan

.EXAMPLE
  .\tools\pasang-shortcut.ps1          # pasang semua
  .\tools\pasang-shortcut.ps1 -Hapus   # hapus semua (termasuk autostart)
#>
param([switch]$Hapus)

$root = Split-Path -Parent $PSScriptRoot
$desktop = [Environment]::GetFolderPath('Desktop')
$startup = [Environment]::GetFolderPath('Startup')
$ps = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$mulai = Join-Path $root 'mulai-kantor.ps1'
$tutup = Join-Path $root 'tutup-kantor.ps1'
$lihat = Join-Path $root 'tampilkan-kantor.ps1'
$update = Join-Path $root 'tools\update-kantor.ps1'

$shortcuts = @(
  @{ Path = (Join-Path $startup 'Kantor Ricko.lnk'); Target = $ps; Style = 7
     Args = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$mulai`" -TanpaBrowser"
     Desc = 'Buka Kantor Ricko otomatis saat login' },
  @{ Path = (Join-Path $desktop 'Buka Kantor.lnk'); Target = $ps; Style = 1
     Args = "-NoProfile -ExecutionPolicy Bypass -Command `"& '$mulai'; Start-Sleep -Seconds 8`""
     Desc = 'Buka Kantor Ricko dan Pixel Office' },
  @{ Path = (Join-Path $desktop 'Buka Kantor Baru.lnk'); Target = $ps; Style = 1
     Args = "-NoProfile -ExecutionPolicy Bypass -Command `"& '$mulai' -Baru; Start-Sleep -Seconds 8`""
     Desc = 'Buka kantor dengan meja bersih (percakapan baru, ingatan tetap) - hemat kuota, pakai seminggu sekali' },
  @{ Path = (Join-Path $desktop 'Tutup Kantor.lnk'); Target = $ps; Style = 1
     Args = "-NoProfile -ExecutionPolicy Bypass -Command `"& '$tutup'; Start-Sleep -Seconds 4`""
     Desc = 'Semua karyawan Kantor Ricko pulang' },
  @{ Path = (Join-Path $desktop 'Lihat Kantor.lnk'); Target = $ps; Style = 7
     Args = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$lihat`""
     Desc = 'Tampilkan / sembunyikan jendela terminal karyawan' },
  @{ Path = (Join-Path $desktop 'Update Kantor.lnk'); Target = $ps; Style = 1
     Args = "-NoProfile -ExecutionPolicy Bypass -Command `"& '$update'; Read-Host 'Tekan Enter untuk menutup'`""
     Desc = 'Ambil perubahan Kantor Ricko dari GitHub lalu terapkan' }
)
# Shortcut lama dari versi sebelumnya
$usang = @((Join-Path $desktop 'Pantau Karyawan.lnk'))

foreach ($p in $usang) { if (Test-Path $p) { Remove-Item $p } }
if ($Hapus) {
  foreach ($s in $shortcuts) {
    if (Test-Path $s.Path) { Remove-Item $s.Path; Write-Host "Dihapus: $($s.Path)" }
  }
  return
}

$shell = New-Object -ComObject WScript.Shell
foreach ($s in $shortcuts) {
  $lnk = $shell.CreateShortcut($s.Path)
  $lnk.TargetPath = $s.Target
  $lnk.Arguments = $s.Args
  $lnk.WorkingDirectory = $root
  $lnk.WindowStyle = $s.Style   # 1 = normal, 7 = minimized
  $lnk.Description = $s.Desc
  $lnk.Save()
  Write-Host "Dipasang: $($s.Path)"
}
