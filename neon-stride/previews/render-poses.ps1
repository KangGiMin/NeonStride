$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$frames = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'poses.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$bitmap = New-Object System.Drawing.Bitmap 1536,880
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#0c1722'))
function Get-PoseColor($hex, $opacity) {
  $digits = $hex.TrimStart('#')
  $a = 255
  if ($digits.Length -eq 8) { $a = [Convert]::ToInt32($digits.Substring(6,2),16); $digits=$digits.Substring(0,6) }
  $rgb = [System.Drawing.ColorTranslator]::FromHtml('#'+$digits)
  return [System.Drawing.Color]::FromArgb([int]($a*$opacity),$rgb.R,$rgb.G,$rgb.B)
}
for($frameIndex=0;$frameIndex -lt $frames.Count;$frameIndex++) {
  $offsetX = ($frameIndex%4)*384-158
  $offsetY = [Math]::Floor($frameIndex/4)*440-660
  $labelBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(180,210,220))
  $font = New-Object System.Drawing.Font 'Arial',11
  $graphics.DrawString(@('RIGHT HEEL UP','TRANSITION','LEFT HEEL UP')[$frameIndex],$font,$labelBrush,[single]($frameIndex*384+28),[single]22)
  $labelBrush.Dispose(); $font.Dispose()
  foreach($op in $frames[$frameIndex]) {
    $color = Get-PoseColor $op.color $op.alpha
    $brush = New-Object System.Drawing.SolidBrush $color
    $pen = New-Object System.Drawing.Pen $color,([single][Math]::Max(.5,$op.width))
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    if($op.kind -eq 'ellipse' -or $op.kind -eq 'ellipseStroke') {
      $bounds = New-Object System.Drawing.RectangleF ([single]($op.x-$op.rx+$offsetX)),([single]($op.y-$op.ry+$offsetY)),([single]($op.rx*2)),([single]($op.ry*2))
      if($op.kind -eq 'ellipse'){$graphics.FillEllipse($brush,$bounds)}else{$graphics.DrawEllipse($pen,$bounds)}
    } else {
      $points = [System.Collections.Generic.List[System.Drawing.PointF]]::new()
      foreach($p in $op.path){$points.Add([System.Drawing.PointF]::new([single]($p[0]+$offsetX),[single]($p[1]+$offsetY)))}
      if($op.kind -eq 'fill' -and $points.Count -ge 3){$graphics.FillPolygon($brush,$points.ToArray())}
      elseif($op.kind -eq 'stroke' -and $points.Count -ge 2){if($op.closed){$points.Add($points[0])};$graphics.DrawLines($pen,$points.ToArray())}
    }
    $brush.Dispose();$pen.Dispose()
  }
}
$bitmap.Save((Join-Path $PSScriptRoot 'natural-run-cycle.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose();$bitmap.Dispose()
Write-Output 'Rendered previews/natural-run-cycle.png'
