# Generates 512x512 dark-theme PNGs for Market Magnate item icons (GDI+).
# Each image: subtle gradient + large category emoji + 2-letter slug initials (readable when scaled ~48px).
# Run: powershell -NoProfile -ExecutionPolicy Bypass -File tools/generate-item-icon-pngs.ps1
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

function U([int]$cp) { return [char]::ConvertFromUtf32($cp) }

$FolderEmoji = @{
  "upgrades"   = (U 0x1F4C8) # chart
  "properties" = (U 0x1F3E0) # house
  "cars"       = (U 0x1F699) # car
  "jets"       = (U 0x1F6EB) # airplane departure
  "yachts"     = (U 0x1F6A4) # ferry / boat
  "jewelry"    = (U 0x1F48E) # gem
  "watches"    = (U 0x231A)  # watch (BMP)
  "outfits"    = (U 0x1F454) # necktie
  "lifestyle"  = (U 0x2728)  # sparkles (BMP)
  "misc"       = (U 0x1F381) # gift
}

function Get-HashHue([string]$s) {
  $h = 0
  foreach ($ch in $s.ToCharArray()) { $h = (($h * 31) + [int][char]$ch) -band 0x7fffffff }
  return ($h % 360)
}

function Get-AssetFolderFromPath([string]$outPath) {
  $norm = $outPath.Replace("/", "\")
  $m = [regex]::Match($norm, '[\\/]icons[\\/]([^\\/]+)[\\/]', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  if ($m.Success) { return $m.Groups[1].Value.ToLowerInvariant() }
  return "misc"
}

function Get-InitialsFromSlug([string]$fileBase) {
  if ([string]::IsNullOrWhiteSpace($fileBase) -or $fileBase -eq "_fallback") { return [string]"MM" }
  $parts = @($fileBase.Split("_", [System.StringSplitOptions]::RemoveEmptyEntries) | Where-Object { $_ -match '^[a-zA-Z]' })
  if ($parts.Count -ge 2) {
    return [string](($parts[0].Substring(0, 1) + $parts[1].Substring(0, 1)).ToUpperInvariant())
  }
  if ($parts.Count -eq 1 -and $parts[0].Length -ge 2) {
    return [string]$parts[0].Substring(0, 2).ToUpperInvariant()
  }
  if ($fileBase.Length -ge 2) { return [string]$fileBase.Substring(0, 2).ToUpperInvariant() }
  return [string]"MM"
}

function Save-ItemIconPng([string]$outPath, [string]$displayName, [string]$folder) {
  $dir = Split-Path $outPath -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

  $fmt = [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
  $bmp = New-Object System.Drawing.Bitmap 512, 512, $fmt
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $slug = [System.IO.Path]::GetFileNameWithoutExtension($outPath)
  $hue = Get-HashHue ($slug + $folder)
  $c1 = [System.Drawing.ColorTranslator]::FromHtml("#12121a")
  $c2 = [System.Drawing.Color]::FromArgb(255, [int](18 + ($hue % 40)), [int](22 + (($hue * 3) % 50)), [int](32 + (($hue * 5) % 60)))
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
    (New-Object System.Drawing.Rectangle(0, 0, 512, 512)),
    $c1, $c2, [single]35, [single]120
  )
  $g.FillRectangle($brush, 0, 0, 512, 512)
  $brush.Dispose()

  # Soft vignette for depth
  $vPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $vPath.AddEllipse(-80, -80, 672, 672)
  $vBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush $vPath
  $vBrush.CenterColor = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
  $vBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(120, 0, 0, 0))
  $g.FillEllipse($vBrush, -80, -80, 672, 672)
  $vBrush.Dispose()
  $vPath.Dispose()

  $emoji = $FolderEmoji[$folder]
  if (-not $emoji) { $emoji = $FolderEmoji["misc"] }

  $emojiFontName = "Segoe UI Emoji"
  try {
    $null = [System.Drawing.Font]::new($emojiFontName, 12, [System.Drawing.FontStyle]::Regular)
  } catch {
    $emojiFontName = "Segoe UI Symbol"
  }

  $emojiFont = [System.Drawing.Font]::new($emojiFontName, 148, [System.Drawing.FontStyle]::Regular)
  $sfEmoji = New-Object System.Drawing.StringFormat
  $sfEmoji.Alignment = [System.Drawing.StringAlignment]::Center
  $sfEmoji.LineAlignment = [System.Drawing.StringAlignment]::Center
  $emojiRect = [System.Drawing.RectangleF]::new(0.0, 72.0, 512.0, 220.0)
  $g.DrawString($emoji, $emojiFont, [System.Drawing.Brushes]::White, $emojiRect, $sfEmoji)
  $emojiFont.Dispose()

  $initials = Get-InitialsFromSlug $slug
  $letterFont = [System.Drawing.Font]::new("Segoe UI", 118, [System.Drawing.FontStyle]::Bold)
  $sfLet = New-Object System.Drawing.StringFormat
  $sfLet.Alignment = [System.Drawing.StringAlignment]::Center
  $sfLet.LineAlignment = [System.Drawing.StringAlignment]::Center
  $letRect = [System.Drawing.RectangleF]::new(8.0, 248.0, 496.0, 200.0)

  for ($dx = -3; $dx -le 3; $dx += 3) {
    for ($dy = -3; $dy -le 3; $dy += 3) {
      if ($dx -eq 0 -and $dy -eq 0) { continue }
      $shadowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(200, 0, 0, 0))
      $shadowRect = [System.Drawing.RectangleF]::new(
        $letRect.X + [float]$dx,
        $letRect.Y + [float]$dy,
        $letRect.Width,
        $letRect.Height)
      $g.DrawString([string]$initials, $letterFont, $shadowBrush, $shadowRect, $sfLet)
      $shadowBrush.Dispose()
    }
  }
  $fgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 244, 248, 255))
  $g.DrawString([string]$initials, $letterFont, $fgBrush, $letRect, $sfLet)
  $fgBrush.Dispose()
  $letterFont.Dispose()

  # Small caption (readable in asset picker / full view; still faint in tiny thumbs)
  $cap = if ($displayName -and $displayName -ne "_fallback") { $displayName } else { $folder }
  if ($cap.Length -gt 42) { $cap = $cap.Substring(0, 39) + "..." }
  $capFont = [System.Drawing.Font]::new("Segoe UI", 22, [System.Drawing.FontStyle]::Regular)
  $sfCap = New-Object System.Drawing.StringFormat
  $sfCap.Alignment = [System.Drawing.StringAlignment]::Center
  $sfCap.LineAlignment = [System.Drawing.StringAlignment]::Far
  $capRect = [System.Drawing.RectangleF]::new(24.0, 430.0, 464.0, 70.0)
  $capBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(200, 180, 190, 210))
  $g.DrawString($cap, $capFont, $capBrush, $capRect, $sfCap)
  $capBrush.Dispose()
  $capFont.Dispose()

  $g.Dispose()
  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$manifestPath = Join-Path $root "assets\icons\icon-manifest.json"
if (-not (Test-Path $manifestPath)) {
  Write-Error "Missing manifest. Run: node tools/mm-icon-build.mjs"
}
$json = Get-Content $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$base = Join-Path $root "assets\icons"

function Join-RootRel([string]$rootPath, [string]$rel) {
  $clean = $rel -replace "^[./\\]+", "" -replace "/", "\"
  return Join-Path $rootPath $clean
}

foreach ($prop in $json.fallbacks.PSObject.Properties) {
  $rel = $prop.Value
  $full = Join-RootRel $root.Path $rel
  $folder = Get-AssetFolderFromPath $full
  Save-ItemIconPng $full "_fallback" $folder
}

foreach ($prop in $json.byItemId.PSObject.Properties) {
  $row = $prop.Value
  $full = Join-RootRel $root.Path $row.path
  $folder = if ($row.folder) { [string]$row.folder } else { Get-AssetFolderFromPath $full }
  Save-ItemIconPng $full ([string]$row.name) $folder.ToLowerInvariant()
}

Write-Host ('Done PNG generation under ' + (Resolve-Path $base))
