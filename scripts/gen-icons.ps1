Add-Type -AssemblyName System.Drawing

$sourcePath = "D:\Cristian\NaxosDev\Naxos-Frontend\public\logo-naxos.jpg"
$outDir = "D:\Cristian\NaxosDev\Naxos-Frontend\public\icons"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$source = [System.Drawing.Image]::FromFile($sourcePath)
Write-Output ("Origen: " + $source.Width + "x" + $source.Height)

$targets = @(
  @{ Name = "icon-192.png"; Size = 192 },
  @{ Name = "icon-512.png"; Size = 512 },
  @{ Name = "apple-icon.png"; Size = 180 }
)

foreach ($t in $targets) {
  $bmp = New-Object System.Drawing.Bitmap($t.Size, $t.Size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.DrawImage($source, 0, 0, $t.Size, $t.Size)
  $outPath = Join-Path $outDir $t.Name
  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
  Write-Output ("Generado: " + $outPath)
}

$source.Dispose()
