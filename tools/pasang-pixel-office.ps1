<#
.SYNOPSIS
  Nama lama pemasang tampilan kantor. Pixel Office sudah diganti Kantor 3D; script ini hanya
  meneruskan ke pasang-kantor-3d.ps1.

.DESCRIPTION
  Dipertahankan karena update-kantor.ps1 versi lama (yang masih berjalan saat perubahan ini
  ditarik dari GitHub) memanggil nama ini. Boleh dihapus setelah semua PC memakai versi baru.
#>
param([switch]$TimpaLayout, [switch]$MulaiUlang)
& (Join-Path $PSScriptRoot 'pasang-kantor-3d.ps1') -MulaiUlang:$MulaiUlang
