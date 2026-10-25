Add-Type -AssemblyName System.Drawing
$srcPath = "d:\rea Projects\ChartRead\resources\branding\ChartRead-Logo-Transparent.png"
$dstPath256 = "d:\rea Projects\ChartRead\resources\branding\ChartRead-Logo-Transparent-256.png"

$src = [System.Drawing.Image]::FromFile($srcPath)
$thumb256 = New-Object System.Drawing.Bitmap 256, 256
$g256 = [System.Drawing.Graphics]::FromImage($thumb256)
$g256.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g256.DrawImage($src, 0, 0, 256, 256)
$thumb256.Save($dstPath256, [System.Drawing.Imaging.ImageFormat]::Png)

$g256.Dispose()
$thumb256.Dispose()
$src.Dispose()

Write-Host "Created 256x256 transparent logo successfully!"
