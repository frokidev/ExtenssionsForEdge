# scripts/generate_icons.ps1
Add-Type -AssemblyName System.Drawing

$iconsDir = Join-Path $PSScriptRoot "..\icons"
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null
}

$sizes = @(16, 48, 128)

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    # Rounded rectangle background
    $radius = [Math]::Max(2, [Math]::Floor($size * 0.18))
    $rect = New-Object System.Drawing.Rectangle(0, 0, ($size - 1), ($size - 1))
    
    # Outer container background (Edge Dark: #202020)
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 32, 32, 32))
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
    $path.AddArc($rect.Right - $d, $rect.Y, $d, $d, 270, 90)
    $path.AddArc($rect.Right - $d, $rect.Bottom - $d, $d, $d, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    $g.FillPath($bgBrush, $path)

    # Accent vertical tab strip (Edge Blue: #0078d4)
    $sidebarWidth = [Math]::Max(3, [Math]::Floor($size * 0.32))
    $stripBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 0, 120, 212))
    $stripRect = New-Object System.Drawing.Rectangle(0, 0, $sidebarWidth, $size)
    
    # Clip to rounded path
    $g.SetClip($path)
    $g.FillRectangle($stripBrush, $stripRect)
    $g.ResetClip()

    # Border around icon
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(100, 255, 255, 255), 1)
    $g.DrawPath($borderPen, $path)

    $outPath = Join-Path $iconsDir "icon$size.png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $borderPen.Dispose()
    $stripBrush.Dispose()
    $path.Dispose()
    $bgBrush.Dispose()
    $g.Dispose()
    $bmp.Dispose()

    Write-Host "Generated: $outPath"
}
