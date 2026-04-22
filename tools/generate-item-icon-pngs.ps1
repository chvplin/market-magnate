# Generates 512x512 dark-theme PNGs for Market Magnate item icons (GDI+).
# Run from market-magnate-main: powershell -ExecutionPolicy Bypass -File tools/generate-item-icon-pngs.ps1
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

function Get-HashHue([string]$s) {
  $h = 0
  foreach ($ch in $s.ToCharArray()) { $h = (($h * 31) + [int][char]$ch) -band 0x7fffffff }
  return ($h % 360)
}

function Save-GradientPng([string]$outPath, [string]$label) {
  $dir = Split-Path $outPath -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  $fmt = [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
  $bmp = New-Object System.Drawing.Bitmap 512, 512, $fmt
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $hue = Get-HashHue $label
  $c1 = [System.Drawing.ColorTranslator]::FromHtml("#12121a")
  $c2 = [System.Drawing.Color]::FromArgb(255, [int](18 + ($hue % 40)), [int](22 + (($hue * 3) % 50)), [int](32 + (($hue * 5) % 60)))
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
    (New-Object System.Drawing.Rectangle(0, 0, 512, 512)),
    $c1,
    $c2,
    [single]35,
    [single]120
  )
  $g.FillRectangle($brush, 0, 0, 512, 512)
  $brush.Dispose()
  $font = [System.Drawing.Font]::new("Arial", 20, [System.Drawing.FontStyle]::Bold)
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Far
  $rect = New-Object System.Drawing.RectangleF(24, 360, 464, 120)
  $tb = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(220, 230, 240, 255))
  $g.DrawString($label, $font, $tb, $rect, $sf)
  $tb.Dispose()
  $font.Dispose()
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

foreach ($prop in $json.fallbacks.PSObject.Properties) {
  $rel = $prop.Value
  $full = Join-Path $root ($rel -replace "/", "\")
  Save-GradientPng $full "_fallback"
}

foreach ($prop in $json.byItemId.PSObject.Properties) {
  $row = $prop.Value
  $rel = $row.path -replace "/", "\"
  $full = Join-Path $root $rel
  Save-GradientPng $full $row.name
}

Write-Host ('Done PNG generation under ' + (Resolve-Path $base))
