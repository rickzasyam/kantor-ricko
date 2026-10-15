# Fungsi bersama untuk mulai-kantor.ps1 dan tutup-kantor.ps1 (dipakai lewat dot-source).

$KantorRoot = Split-Path -Parent $PSScriptRoot
$DriveKantor = 'G:\My Drive\Kantor Ricko'
$DiscordChannel = 'plugin:discord@claude-plugins-official'
$PixelPort = 3737
$JudulTab = 'Kantor - '   # awalan judul tab Windows Terminal; dipakai untuk menemukan jendela kantor

# Akses Win32 untuk menyembunyikan / menampilkan jendela Windows Terminal kantor.
if (-not ('KantorWin' -as [type])) {
  Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

public static class KantorWin {
  delegate bool EnumProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc cb, IntPtr lParam);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr hWnd, StringBuilder s, int n);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowText(IntPtr hWnd, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int cmd);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);

  // Jendela Windows Terminal yang judulnya diawali prefix (termasuk yang tersembunyi).
  public static IntPtr[] FindTerminal(string prefix) {
    var found = new List<IntPtr>();
    EnumWindows((h, p) => {
      var cls = new StringBuilder(256);
      GetClassName(h, cls, cls.Capacity);
      if (cls.ToString() == "CASCADIA_HOSTING_WINDOW_CLASS") {
        var title = new StringBuilder(512);
        GetWindowText(h, title, title.Capacity);
        if (title.ToString().StartsWith(prefix)) found.Add(h);
      }
      return true;
    }, IntPtr.Zero);
    return found.ToArray();
  }
}
'@
}

function Get-JendelaKantor { return @([KantorWin]::FindTerminal($JudulTab)) }

function Set-JendelaKantor([bool]$Tampil) {
  foreach ($h in (Get-JendelaKantor)) {
    if ($Tampil) {
      [KantorWin]::ShowWindow($h, 9) | Out-Null   # SW_RESTORE
      [KantorWin]::SetForegroundWindow($h) | Out-Null
    } else {
      [KantorWin]::ShowWindow($h, 0) | Out-Null   # SW_HIDE: hilang dari layar dan taskbar
    }
  }
}

# Apakah sesi terdaftar untuk interkom (pesan antar-sesi). Sesi yang mengira dirinya
# "sesi anak" (mewarisi variabel sesi Claude Code lain) tidak pernah mendaftar.
function Test-TerdaftarInterkom([int]$SessionPid) {
  if (-not $SessionPid) { return $false }
  return Test-Path (Join-Path $env:USERPROFILE ".claude\sessions\$SessionPid.json")
}

# Apakah sesi sedang menganggur (tidak di tengah tugas), jadi aman dibuka ulang.
# Claude Code mencatat status sesi ("idle", "busy", ...) di file daftar sesinya.
function Test-SesiMenganggur([int]$SessionPid) {
  $f = Join-Path $env:USERPROFILE ".claude\sessions\$SessionPid.json"
  if (-not (Test-Path $f)) { return $false }
  try { return ((Get-Content $f -Raw | ConvertFrom-Json).status -eq 'idle') } catch { return $false }
}

# Claude Code menandai server MCP yang gagal sebagai "perlu login" di file cache global,
# lalu SEMUA sesi berikutnya melewatkan server itu. Plugin Discord gagal setiap kali
# dinyalakan tanpa token bot (mis. di sesi Claude Code biasa), jadi tanda itu dihapus
# sebelum kantor dibuka. Bagian lain file dibiarkan apa adanya.
function Clear-TandaDiscordGagal {
  $file = Join-Path $env:USERPROFILE '.claude\mcp-needs-auth-cache.json'
  if (-not (Test-Path $file)) { return }
  $text = [IO.File]::ReadAllText($file)
  $key = [regex]::Escape('"plugin:discord:discord"')
  $baru = [regex]::Replace($text, ",\s*$key\s*:\s*\{[^{}]*\}", '')
  if ($baru -eq $text) { $baru = [regex]::Replace($text, "$key\s*:\s*\{[^{}]*\}\s*,?", '') }
  if ($baru -eq $text) { return }
  try { $null = $baru | ConvertFrom-Json } catch { return }   # jangan pernah menulis JSON rusak
  [IO.File]::WriteAllText($file, $baru, (New-Object System.Text.UTF8Encoding $false))
  Write-Host '  (tanda "Discord gagal" dari sesi lain dibersihkan)'
}

# Karyawan yang terhenti karena kuota Pro habis menunggu lalu melanjutkan tugasnya sendiri setelah
# kuota pulih (autoContinueAtUsageLimit). Pengaturan ini hanya dibaca dari ~/.claude/settings.json,
# bukan dari kantor-settings.json, jadi dipasang di sini. Bagian lain file dibiarkan apa adanya.
function Set-LanjutSetelahKuota {
  $file = Join-Path $env:USERPROFILE '.claude\settings.json'
  $text = if (Test-Path $file) { [IO.File]::ReadAllText($file) } else { '{}' }
  if ($text -match '"autoContinueAtUsageLimit"') { return }
  if ($text -match '^\s*\{\s*\}\s*$') {
    $baru = "{`n  `"autoContinueAtUsageLimit`": true`n}`n"
  } else {
    $baru = ([regex]'\{').Replace($text, "{`n  `"autoContinueAtUsageLimit`": true,", 1)
  }
  try { $null = $baru | ConvertFrom-Json } catch { return }   # jangan pernah menulis JSON rusak
  [IO.File]::WriteAllText($file, $baru, (New-Object System.Text.UTF8Encoding $false))
  Write-Host '  (karyawan otomatis lanjut bekerja setelah kuota Pro pulih)'
}

# Siapa saja yang boleh memerintah karyawan lewat Discord: Pak Ricko (ownerId di config.json,
# diisi setup-discord.ps1) ditambah orang di tools\atasan.json (mis. Bu Ghina).
function Get-IdPemberiPerintah {
  $ids = @()
  $cfgFile = Join-Path $env:USERPROFILE '.claude\channels\kantor-ricko\config.json'
  if (Test-Path $cfgFile) {
    $cfg = [IO.File]::ReadAllText($cfgFile) | ConvertFrom-Json
    if ($cfg.ownerId) { $ids += [string]$cfg.ownerId }
  }
  # Tanpa ID Pak Ricko jangan ubah apa pun, supaya pemilik tidak terkunci dari botnya sendiri.
  if ($ids.Count -eq 0) { return @() }
  $atasanFile = Join-Path $KantorRoot 'tools\atasan.json'
  if (Test-Path $atasanFile) {
    $ids += @([IO.File]::ReadAllText($atasanFile) | ConvertFrom-Json | ForEach-Object { $_ } |
      Where-Object { $_.discordId } | ForEach-Object { ([string]$_.discordId).Trim() })
  }
  return @($ids | Where-Object { $_ } | Select-Object -Unique)
}

# Samakan daftar allowFrom di access.json tiap bot dengan Get-IdPemberiPerintah, supaya
# menambah atasan cukup lewat tools\atasan.json + Update Kantor (tanpa setup-discord ulang).
# Plugin Discord membaca access.json saat pesan masuk, jadi berlaku tanpa membuka ulang karyawan.
function Sync-AksesDiscord {
  $ids = @(Get-IdPemberiPerintah)
  if ($ids.Count -eq 0) { return }   # Discord belum di-setup
  $utf8NoBom = New-Object System.Text.UTF8Encoding $false
  foreach ($k in (Get-Karyawan)) {
    $file = Join-Path $env:USERPROFILE ".claude\channels\kantor-ricko\$($k.id)\access.json"
    if (-not (Test-Path $file)) { continue }
    # ReadAllText (bukan Get-Content) supaya emoji ackReaction tidak rusak di PowerShell 5.1.
    $text = [IO.File]::ReadAllText($file)
    try { $akses = $text | ConvertFrom-Json } catch { Write-Warning "access.json $($k.nama) rusak, dilewati."; continue }
    $sebelum = $akses | ConvertTo-Json -Depth 6
    $akses | Add-Member -Force -NotePropertyName allowFrom -NotePropertyValue $ids
    if ($akses.groups) {
      foreach ($g in $akses.groups.PSObject.Properties) { $g.Value | Add-Member -Force -NotePropertyName allowFrom -NotePropertyValue $ids }
    }
    $sesudah = $akses | ConvertTo-Json -Depth 6
    if ($sesudah -eq $sebelum) { continue }
    [IO.File]::WriteAllText($file, $sesudah, $utf8NoBom)
    Write-Host "  $($k.nama): daftar pemberi perintah Discord diperbarui ($($ids.Count) orang)"
  }
}

# Proses Claude Code milik karyawan $Id yang sedang jalan di terminal. Dicari dari baris
# perintahnya, karena sesi terminal tidak selalu muncul di `claude agents --json`.
function Get-ProsesKaryawan([string]$Id) {
  return @(Get-CimInstance Win32_Process | Where-Object {
    $_.Name -eq 'claude.exe' -and $_.CommandLine -match "--name\s+$([regex]::Escape($Id))(\s|$)" -and $_.CommandLine -match 'kantor-settings\.json'
  })
}

# Hentikan sesi terminal karyawan (Claude Code beserta plugin Discord-nya). Tab-nya
# tertutup sendiri: jalankan-karyawan.ps1 lalu keluar dengan kode 0, dan Windows
# Terminal menutup tab yang keluar normal.
function Stop-SesiTerminal([int]$SessionPid) {
  taskkill /PID $SessionPid /T /F 2>&1 | Out-Null
}

# Daftar karyawan dari tools\karyawan.json. "| ForEach-Object { $_ }" memecah array JSON;
# tanpa itu PowerShell 5.1 mengembalikan seluruh daftar sebagai satu objek.
function Get-Karyawan([string[]]$Hanya) {
  $all = @(Get-Content (Join-Path $KantorRoot 'tools\karyawan.json') -Raw | ConvertFrom-Json | ForEach-Object { $_ })
  if ($Hanya) { $all = @($all | Where-Object { $Hanya -contains $_.id }) }
  return $all
}

# Apakah sesi dengan proses $SessionPid punya koneksi Discord hidup (proses bun plugin
# Discord di bawahnya). Sesi latar belakang yang dibangunkan ulang (respawn) atau dibuat
# dengan --continue tidak membawa --channels, jadi pemeriksaan ini yang dipakai.
function Test-PunyaDiscord([int]$SessionPid) {
  if (-not $SessionPid) { return $false }
  $procs = Get-CimInstance Win32_Process
  $byId = @{}
  $procs | ForEach-Object { $byId[[int]$_.ProcessId] = $_ }
  foreach ($b in ($procs | Where-Object { $_.Name -eq 'bun.exe' })) {
    $cur = $byId[[int]$b.ParentProcessId]
    for ($i = 0; $i -lt 8 -and $cur; $i++) {
      if ([int]$cur.ProcessId -eq $SessionPid) { return $true }
      $cur = $byId[[int]$cur.ParentProcessId]
    }
  }
  return $false
}

# Server Pixel Office yang sedang hidup, dibaca dari registrasi pixel-agents.
function Get-PixelOfficeServer {
  $dir = Join-Path $env:USERPROFILE '.pixel-agents\servers'
  foreach ($f in (Get-ChildItem $dir -Filter '*.json' -ErrorAction SilentlyContinue)) {
    try { $s = Get-Content $f.FullName -Raw | ConvertFrom-Json } catch { continue }
    if ($s.pid -and (Get-Process -Id $s.pid -ErrorAction SilentlyContinue)) { return $s }
  }
  return $null
}

# Daftarkan sesi terbaru tiap karyawan di state Pixel Office (panggil saat server MATI).
# Server hanya melihat sesi yang sedang aktif; karyawan yang menganggur baru muncul setelah
# bekerja. Dengan ini mereka langsung tampil di mejanya saat Pixel Office dibuka.
function Set-AgenPixelKaryawan {
  $stateFile = Join-Path $env:USERPROFILE '.pixel-agents\standalone-state.json'
  $state = if (Test-Path $stateFile) { Get-Content $stateFile -Raw | ConvertFrom-Json } else { $null }
  $agents = @(if ($state -and $state.agents) { $state.agents | ForEach-Object { $_ } })
  $projects = Join-Path $env:USERPROFILE '.claude\projects'
  $berubah = $false
  foreach ($k in (Get-Karyawan)) {
    $key = (Join-Path $KantorRoot "karyawan\$($k.id)") -replace '[^A-Za-z0-9]', '-'
    $dir = Join-Path $projects $key
    $latest = Get-ChildItem $dir -Filter '*.jsonl' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $latest) { continue }
    # Buang sesi lama karyawan ini, sisakan / tambahkan sesi terbarunya.
    $lama = @($agents | Where-Object { $_.projectDir -eq $dir -and $_.jsonlFile -ne $latest.FullName })
    if ($lama.Count) { $agents = @($agents | Where-Object { $lama -notcontains $_ }); $berubah = $true }
    if (-not ($agents | Where-Object { $_.jsonlFile -eq $latest.FullName })) {
      $nextId = (@($agents | ForEach-Object { [int]$_.id }) + 0 | Measure-Object -Maximum).Maximum + 1
      $agents += [pscustomobject]@{
        id = $nextId; sessionId = $latest.BaseName; terminalName = ''; isExternal = $true
        jsonlFile = $latest.FullName; projectDir = $dir; folderName = ($key -split '-')[-1]
      }
      $berubah = $true
    }
  }
  if (-not $berubah) { return }
  # Kursi lama dibuang; kursi baru dipilih ulang sesuai ruangan (areaMappings).
  $baru = [pscustomobject]@{ agents = $agents; seats = [pscustomobject]@{} }
  New-Item -ItemType Directory -Force -Path (Split-Path $stateFile) | Out-Null
  [IO.File]::WriteAllText($stateFile, ($baru | ConvertTo-Json -Depth 10), (New-Object System.Text.UTF8Encoding $false))
}

function Get-PixelOfficeUrl {
  $s = Get-PixelOfficeServer
  if ($s) { return "http://127.0.0.1:$($s.port)/?token=$($s.token)" }
  return $null
}
