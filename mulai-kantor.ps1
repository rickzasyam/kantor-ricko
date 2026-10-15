<#
.SYNOPSIS
  Membuka Kantor Ricko: semua karyawan bekerja di Windows Terminal yang disembunyikan
  (tidak tampil di layar maupun taskbar) dan Pixel Office dibuka di browser.

.DESCRIPTION
  - Karyawan yang sudah bekerja dan tersambung ke Discord dibiarkan.
  - Karyawan yang belum jalan, atau jalan tapi tidak tersambung ke Discord, dibuka ulang.
    Karyawan melanjutkan percakapan terakhirnya (--continue).
  - Aman dijalankan berulang kali untuk "memperbaiki" kantor.
  Lihat / sembunyikan jendela kantor: .\tampilkan-kantor.ps1

  Catatan: background session Claude Code (claude --bg) sudah diuji dan TIDAK dipakai:
  plugin Discord gagal menyala di proses cadangan daemon, hilang saat sesi dibangunkan
  ulang, dan sesi yang menganggur dimatikan otomatis setelah sekitar 1 jam.

.EXAMPLE
  .\mulai-kantor.ps1                       # semua karyawan
  .\mulai-kantor.ps1 -Hanya pak-asep,kokom # sebagian saja
  .\mulai-kantor.ps1 -Baru                 # mulai percakapan baru (ingatan jangka panjang tetap)
  .\mulai-kantor.ps1 -Tampil               # jangan sembunyikan jendela terminal
  .\mulai-kantor.ps1 -TanpaBrowser         # jangan buka Pixel Office di browser
#>
param(
  [string[]]$Hanya,
  [switch]$Baru,
  [switch]$Tampil,
  [switch]$TanpaPixel,
  [switch]$TanpaBrowser
)

. (Join-Path $PSScriptRoot 'tools\kantor-umum.ps1')
Set-Location $KantorRoot
$karyawan = Get-Karyawan $Hanya
if ($karyawan.Count -eq 0) { throw 'Tidak ada karyawan yang cocok.' }

# --- Tunggu Google Drive (saat autostart, Drive for Desktop kadang belum siap) ---
for ($i = 0; $i -lt 24 -and -not (Test-Path $DriveKantor); $i++) {
  if ($i -eq 0) { Write-Host 'Menunggu Google Drive siap...' }
  Start-Sleep -Seconds 5
}
if (-not (Test-Path $DriveKantor)) {
  Write-Warning "Folder $DriveKantor belum ada. Ingatan karyawan di Drive belum bisa dipakai sampai Google Drive aktif."
}

Write-Host 'Membuka kantor...' -ForegroundColor Cyan
Clear-TandaDiscordGagal
Set-LanjutSetelahKuota
Sync-AksesDiscord
$perluDibuka = @()
foreach ($k in $karyawan) {
  $live = @(Get-ProsesKaryawan $k.id)
  if ($live.Count -eq 1 -and -not $Baru -and (Test-PunyaDiscord $live[0].ProcessId)) {
    Write-Host "  $($k.nama): sudah bekerja"
    continue
  }
  if ($live.Count) {
    foreach ($p in $live) { Stop-SesiTerminal $p.ProcessId }
    Write-Host "  $($k.nama): dibuka ulang" -ForegroundColor Yellow
  } else {
    Write-Host "  $($k.nama): mulai bekerja" -ForegroundColor Green
  }
  $perluDibuka += $k
}

# --- Satu tab Windows Terminal per karyawan --------------------------------------
if ($perluDibuka.Count) {
  $runner = Join-Path $KantorRoot 'tools\jalankan-karyawan.ps1'
  $wtArgs = @()
  foreach ($k in $perluDibuka) {
    if ($wtArgs.Count) { $wtArgs += ';' }
    $wtArgs += @('new-tab', '--title', "$JudulTab$($k.nama)", '--suppressApplicationTitle',
      '-d', (Join-Path $KantorRoot "karyawan\$($k.id)"),
      'powershell', '-ExecutionPolicy', 'Bypass', '-File', $runner, '-Id', $k.id)
    if ($Baru) { $wtArgs += '-Baru' }
  }
  & wt.exe -w kantor-ricko @wtArgs

  # Tunggu jendelanya muncul, lalu sembunyikan.
  if (-not $Tampil) {
    for ($i = 0; $i -lt 30 -and (Get-JendelaKantor).Count -eq 0; $i++) { Start-Sleep -Milliseconds 500 }
    Start-Sleep -Seconds 2   # beri waktu semua tab terbuka
    Set-JendelaKantor $false
  }
} elseif (-not $Tampil) {
  Set-JendelaKantor $false
}

# --- Pastikan tiap karyawan tersambung ke Discord dan terdaftar di interkom ---------
# Karyawan yang tertahan dialog di jendela tersembunyi tidak akan pernah siap,
# jadi laporkan supaya bisa dilihat dengan tampilkan-kantor.ps1.
if ($perluDibuka.Count) {
  Write-Host 'Menunggu karyawan siap (Discord + interkom)...'
  $belum = @($perluDibuka)
  for ($i = 0; $i -lt 30 -and $belum.Count; $i++) {
    Start-Sleep -Seconds 3
    $belum = @($belum | Where-Object {
      -not (@(Get-ProsesKaryawan $_.id) | Where-Object { (Test-PunyaDiscord $_.ProcessId) -and (Test-TerdaftarInterkom $_.ProcessId) })
    })
  }
  if ($belum.Count) {
    foreach ($k in $belum) {
      $p = @(Get-ProsesKaryawan $k.id) | Select-Object -First 1
      $d = if ($p -and (Test-PunyaDiscord $p.ProcessId)) { 'ok' } else { 'BELUM' }
      $s = if ($p -and (Test-TerdaftarInterkom $p.ProcessId)) { 'ok' } else { 'BELUM' }
      Write-Warning "$($k.nama): Discord $d, interkom $s. Lihat jendelanya dengan .\tampilkan-kantor.ps1"
    }
  } else {
    Write-Host '  Semua karyawan tersambung ke Discord dan interkom.' -ForegroundColor Green
  }
}

# --- Pixel Office (tanpa jendela) ---------------------------------------------------
if (-not $TanpaPixel) {
  $url = Get-PixelOfficeUrl
  if (-not $url) {
    $log = Join-Path $env:USERPROFILE '.pixel-agents\kantor-pixel.log'
    Set-AgenPixelKaryawan
    # pixel-agents lokal (versi dikunci + patch karakter tetap). Belum dipasang? pakai npx.
    $cli = Join-Path $KantorRoot 'pixel-office\node_modules\pixel-agents\dist\cli.js'
    $env:KANTOR_KARAKTER = Join-Path $KantorRoot 'pixel-office\karakter.json'
    $cmd = if (Test-Path $cli) { "node `"$cli`"" } else { 'npx --yes pixel-agents' }
    Start-Process -FilePath 'cmd.exe' -WindowStyle Hidden -WorkingDirectory (Join-Path $KantorRoot 'karyawan') `
      -ArgumentList "/c $cmd --port $PixelPort > `"$log`" 2>&1"
    for ($i = 0; $i -lt 30 -and -not $url; $i++) { Start-Sleep -Seconds 2; $url = Get-PixelOfficeUrl }
  }
  if ($url) {
    Write-Host "Pixel Office: $url"
    if (-not $TanpaBrowser) { Start-Process $url }
  } else {
    Write-Warning "Pixel Office belum menyala. Lihat log: $env:USERPROFILE\.pixel-agents\kantor-pixel.log"
  }
}

Write-Host ''
Write-Host 'Kantor buka.' -ForegroundColor Cyan
if (-not $Tampil) { Write-Host 'Jendela terminal karyawan disembunyikan. Lihat dengan: .\tampilkan-kantor.ps1' }
