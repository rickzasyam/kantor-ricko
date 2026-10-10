<#
.SYNOPSIS
  Menyambungkan bot Discord ke tiap karyawan Kantor Ricko.

.DESCRIPTION
  - Meminta token bot tiap karyawan (ketikan disembunyikan) lalu menyimpannya di
    %USERPROFILE%\.claude\channels\kantor-ricko\<id>\.env
    Lokasi ini di luar folder proyek, jadi token tidak ikut ter-upload ke GitHub.
  - Membaca daftar channel di server Discord, lalu menulis access.json tiap bot:
    hanya Pak Ricko yang boleh memerintah, dan channel mana yang didengar bot itu
    (lihat kolom "channel" di tools\karyawan.json).
  - Menyimpan URL webhook #ruang-rapat untuk log interkom.

.EXAMPLE
  .\tools\setup-discord.ps1                   # setup lengkap (pertama kali)
  .\tools\setup-discord.ps1 -Hanya kokom      # ganti token satu karyawan
  .\tools\setup-discord.ps1 -SegarkanChannel  # setelah membuat channel #proyek-... baru
#>
param(
  [string[]]$Hanya,
  [switch]$SegarkanChannel
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$karyawan = Get-Content (Join-Path $root 'tools\karyawan.json') -Raw | ConvertFrom-Json
$stateRoot = Join-Path $env:USERPROFILE '.claude\channels\kantor-ricko'
$configFile = Join-Path $stateRoot 'config.json'
$webhookFile = Join-Path $stateRoot 'ruang-rapat-webhook.txt'
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
New-Item -ItemType Directory -Force -Path $stateRoot | Out-Null

function Read-Secret([string]$Prompt) {
  $secure = Read-Host -Prompt $Prompt -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { return ([Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)).Trim() }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
}

function Get-Token([string]$Id) {
  $envFile = Join-Path $stateRoot "$Id\.env"
  if (-not (Test-Path $envFile)) { return $null }
  $line = Get-Content $envFile | Where-Object { $_ -match '^DISCORD_BOT_TOKEN=' } | Select-Object -First 1
  if ($line) { return $line.Substring('DISCORD_BOT_TOKEN='.Length).Trim() }
  return $null
}

$userAgent = 'DiscordBot (https://github.com/rickzasyam/kantor-ricko, 1.0)'

# Memanggil API Discord. Mencoba ulang bila Discord sibuk (rate limit / gangguan sesaat).
# "| ForEach-Object { $_ }" memecah array JSON jadi elemen satu per satu; tanpa ini
# PowerShell 5.1 mengembalikan seluruh daftar sebagai satu objek.
function Invoke-Discord([string]$Token, [string]$Path) {
  for ($try = 1; ; $try++) {
    try {
      return (Invoke-RestMethod -Uri "https://discord.com/api/v10$Path" -UserAgent $userAgent `
        -Headers @{ Authorization = "Bot $Token" } | ForEach-Object { $_ })
    } catch {
      $err = $_
      $detail = "$($err.ErrorDetails.Message)"
      $status = 0
      try { $status = [int]$err.Exception.Response.StatusCode } catch {}
      $wait = 2
      try { $j = $detail | ConvertFrom-Json; if ($j.retry_after) { $wait = [int][math]::Ceiling([double]$j.retry_after) + 1 } } catch {}
      $transient = ($status -eq 429) -or ($status -ge 500) -or ($detail -match '40333')
      if (-not $transient -or $try -ge 4) { throw $err }
      Write-Host "  Discord sedang sibuk, mencoba lagi dalam $wait detik..." -ForegroundColor DarkGray
      Start-Sleep -Seconds $wait
    }
  }
}

function Test-ChannelMatch([string]$Name, $Patterns) {
  foreach ($p in $Patterns) { if ($Name -like $p) { return $true } }
  return $false
}

# --- 1. User ID Discord milik Pak Ricko -------------------------------------
$config = if (Test-Path $configFile) { Get-Content $configFile -Raw | ConvertFrom-Json } else { $null }
if (-not $config) { $config = [pscustomobject]@{ ownerId = ''; guildId = '' } }
if (-not $config.ownerId) {
  Write-Host ''
  Write-Host 'User ID Discord Anda dibutuhkan supaya HANYA Anda yang bisa memerintah karyawan.'
  Write-Host 'Cara: Discord > User Settings > Advanced > nyalakan Developer Mode,'
  Write-Host '      lalu klik kanan nama/foto Anda > Copy User ID.'
  $config.ownerId = (Read-Host 'User ID Anda').Trim()
  [IO.File]::WriteAllText($configFile, ($config | ConvertTo-Json), $utf8NoBom)
}

# --- 2. Token bot tiap karyawan ----------------------------------------------
$targets = if ($Hanya) { @($karyawan | Where-Object { $Hanya -contains $_.id }) } else { @($karyawan) }
if ($Hanya -and $targets.Count -eq 0) { throw "Karyawan '$($Hanya -join ', ')' tidak ditemukan di tools\karyawan.json" }

if (-not $SegarkanChannel) {
  Write-Host ''
  Write-Host '== Token bot (ketikan tidak akan terlihat, paste lalu Enter) =='
  foreach ($k in $targets) {
    $dir = Join-Path $stateRoot $k.id
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    if ((Get-Token $k.id) -and -not $Hanya) {
      Write-Host "Token $($k.nama): sudah tersimpan (untuk mengganti: .\tools\setup-discord.ps1 -Hanya $($k.id))"
      continue
    }
    $token = Read-Secret "Token bot $($k.nama)"
    if (-not $token) { Write-Host "  Dilewati." -ForegroundColor Yellow; continue }
    try {
      $me = Invoke-Discord $token '/users/@me'
      Write-Host "  OK - $($k.nama) terhubung sebagai @$($me.username)" -ForegroundColor Green
    } catch {
      Write-Host "  Token $($k.nama) ditolak Discord. Cek lagi, lalu jalankan: .\tools\setup-discord.ps1 -Hanya $($k.id)" -ForegroundColor Red
      continue
    }
    # Tanpa BOM dan tanpa baris baru di akhir: plugin membaca file ini baris per baris.
    [IO.File]::WriteAllText((Join-Path $dir '.env'), "DISCORD_BOT_TOKEN=$token", $utf8NoBom)
  }
}

# --- 3. Channel server Discord -> access.json tiap bot ------------------------
$anyToken = $karyawan | ForEach-Object { Get-Token $_.id } | Where-Object { $_ } | Select-Object -First 1
if (-not $anyToken) { throw 'Belum ada token bot yang tersimpan. Jalankan script ini tanpa -SegarkanChannel dulu.' }

$guilds = @(Invoke-Discord $anyToken '/users/@me/guilds')
if ($guilds.Count -eq 0) { throw 'Bot belum diundang ke server Discord mana pun. Undang dulu lewat link OAuth2.' }
if (-not $config.guildId -or -not ($guilds.id -contains $config.guildId)) {
  if ($guilds.Count -eq 1) {
    $config.guildId = $guilds[0].id
  } else {
    Write-Host ''
    for ($i = 0; $i -lt $guilds.Count; $i++) { Write-Host "  [$($i + 1)] $($guilds[$i].name)" }
    $pick = [int](Read-Host 'Server mana yang dipakai untuk kantor? (nomor)')
    $config.guildId = $guilds[$pick - 1].id
  }
}

# 0 = text, 5 = announcement, 15 = forum
$channels = @(Invoke-Discord $anyToken "/guilds/$($config.guildId)/channels") | Where-Object { @(0, 5, 15) -contains $_.type }
$eyes = [char]::ConvertFromUtf32(0x1F440)

Write-Host ''
Write-Host '== Channel yang didengar tiap karyawan =='
foreach ($k in $karyawan) {
  if (-not (Get-Token $k.id)) { Write-Host "  $($k.nama): (belum ada token, dilewati)" -ForegroundColor Yellow; continue }
  $groups = [ordered]@{}
  foreach ($ch in $channels) {
    if (Test-ChannelMatch $ch.name $k.channel) {
      $groups[$ch.id] = [ordered]@{ requireMention = $true; allowFrom = @($config.ownerId) }
    }
  }
  $access = [ordered]@{
    dmPolicy    = 'allowlist'
    allowFrom   = @($config.ownerId)
    groups      = $groups
    pending     = @{}
    ackReaction = $eyes
  }
  $dir = Join-Path $stateRoot $k.id
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  [IO.File]::WriteAllText((Join-Path $dir 'access.json'), ($access | ConvertTo-Json -Depth 6), $utf8NoBom)
  $names = @($channels | Where-Object { $groups.Contains($_.id) } | ForEach-Object { '#' + $_.name })
  $label = if ($names.Count) { $names -join ', ' } else { '(belum ada channel yang cocok)' }
  Write-Host "  $($k.nama): $label"
}

# --- 4. Webhook #ruang-rapat ---------------------------------------------------
if (-not $SegarkanChannel -and -not $Hanya) {
  $ask = $true
  if (Test-Path $webhookFile) {
    $ask = (Read-Host 'Webhook #ruang-rapat sudah tersimpan. Ganti? (y/N)') -match '^[yY]'
  }
  if ($ask) {
    Write-Host ''
    Write-Host 'URL webhook #ruang-rapat (Edit Channel > Integrations > Webhooks > New Webhook > Copy Webhook URL).'
    $url = Read-Secret 'URL webhook (Enter untuk lewati)'
    if ($url) {
      try {
        $wh = Invoke-RestMethod -Uri $url
        [IO.File]::WriteAllText($webhookFile, $url, $utf8NoBom)
        Write-Host "  OK - log interkom akan dikirim lewat webhook '$($wh.name)'." -ForegroundColor Green
      } catch {
        Write-Host '  URL webhook tidak valid, dilewati. Jalankan ulang script ini untuk mencoba lagi.' -ForegroundColor Red
      }
    }
  }
}

[IO.File]::WriteAllText($configFile, ($config | ConvertTo-Json), $utf8NoBom)
Write-Host ''
Write-Host 'Selesai. Perubahan channel langsung berlaku; perubahan token berlaku setelah karyawan dijalankan ulang.' -ForegroundColor Cyan
