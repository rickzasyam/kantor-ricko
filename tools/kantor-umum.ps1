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

function Get-PixelOfficeUrl {
  $s = Get-PixelOfficeServer
  if ($s) { return "http://127.0.0.1:$($s.port)/?token=$($s.token)" }
  return $null
}
