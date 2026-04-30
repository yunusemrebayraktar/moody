# Generates allegedly icons (16, 32, 48, 128) as PNG using System.Drawing.
# Run from project root:  powershell -ExecutionPolicy Bypass -File scripts\generate-icons.ps1

Add-Type -AssemblyName System.Drawing

$sizes = @(16, 32, 48, 128)
$outDir = Join-Path $PSScriptRoot "..\icons"
$outDir = (Resolve-Path $outDir).Path

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Background: rounded square (#0b0b0b)
    $bg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(11, 11, 11))
    $radius = [Math]::Max(2, [int]($size * 0.17))
    $rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
    $path.AddArc($rect.Right - $d, $rect.Y, $d, $d, 270, 90)
    $path.AddArc($rect.Right - $d, $rect.Bottom - $d, $d, $d, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    $g.FillPath($bg, $path)

    # Asterisk: three rotated bars (#f3f3f3)
    $fg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(243, 243, 243))
    $cx = $size / 2.0
    $cy = $size / 2.0
    $barW = [Math]::Max(1, $size * 0.10)
    $barH = $size * 0.66

    foreach ($angle in 0, 60, 120) {
        $state = $g.Save()
        $g.TranslateTransform([single]$cx, [single]$cy)
        $g.RotateTransform([single]$angle)
        $r = New-Object System.Drawing.RectangleF (-$barW / 2.0), (-$barH / 2.0), $barW, $barH
        $rad = [Math]::Max(1, $barW / 2.0)
        $bp = New-Object System.Drawing.Drawing2D.GraphicsPath
        $bd = $rad * 2.0
        $bp.AddArc($r.X, $r.Y, $bd, $bd, 180, 90)
        $bp.AddArc($r.Right - $bd, $r.Y, $bd, $bd, 270, 90)
        $bp.AddArc($r.Right - $bd, $r.Bottom - $bd, $bd, $bd, 0, 90)
        $bp.AddArc($r.X, $r.Bottom - $bd, $bd, $bd, 90, 90)
        $bp.CloseFigure()
        $g.FillPath($fg, $bp)
        $g.Restore($state)
    }

    # Tiny center dot (background color) — footnote feel
    $dotR = [Math]::Max(1, $size * 0.07)
    $g.FillEllipse($bg, [single]($cx - $dotR), [single]($cy - $dotR), [single]($dotR * 2), [single]($dotR * 2))

    # Soft accent inner border (clay, very faint) — ties icon to popup chrome
    if ($size -ge 32) {
        $borderColor = [System.Drawing.Color]::FromArgb(46, 214, 165, 133)  # ~18% alpha
        $borderPen = New-Object System.Drawing.Pen $borderColor, 1
        $inset = [int]([Math]::Max(2, $size * 0.05))
        $bRect = New-Object System.Drawing.Rectangle $inset, $inset, ($size - $inset * 2 - 1), ($size - $inset * 2 - 1)
        $bRad = [Math]::Max(2, [int]($size * 0.14))
        $bPath = New-Object System.Drawing.Drawing2D.GraphicsPath
        $bd2 = $bRad * 2
        $bPath.AddArc($bRect.X, $bRect.Y, $bd2, $bd2, 180, 90)
        $bPath.AddArc($bRect.Right - $bd2, $bRect.Y, $bd2, $bd2, 270, 90)
        $bPath.AddArc($bRect.Right - $bd2, $bRect.Bottom - $bd2, $bd2, $bd2, 0, 90)
        $bPath.AddArc($bRect.X, $bRect.Bottom - $bd2, $bd2, $bd2, 90, 90)
        $bPath.CloseFigure()
        $g.DrawPath($borderPen, $bPath)
        $borderPen.Dispose()
    }

    # Top-right accent dot (clay) — the brand's footnote mark
    $accent = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(217, 214, 165, 133))
    $aR = [Math]::Max(1.0, $size * 0.045)
    $aCx = $size * 0.81
    $aCy = $size * 0.19
    $g.FillEllipse($accent, [single]($aCx - $aR), [single]($aCy - $aR), [single]($aR * 2), [single]($aR * 2))
    $accent.Dispose()

    $g.Dispose()
    $outPath = Join-Path $outDir ("icon{0}.png" -f $size)
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "wrote $outPath"
}
