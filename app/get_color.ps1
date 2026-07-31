Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap("C:\Users\yraje\WeChristian2\app\assets\admin_cards\members.png")
$p = $bmp.GetPixel(10, 10); Write-Output "10,10: $($p.R), $($p.G), $($p.B)"
$p = $bmp.GetPixel(50, 50); Write-Output "50,50: $($p.R), $($p.G), $($p.B)"
$p = $bmp.GetPixel(100, 100); Write-Output "100,100: $($p.R), $($p.G), $($p.B)"
$p = $bmp.GetPixel(200, 50); Write-Output "200,50: $($p.R), $($p.G), $($p.B)"
$p = $bmp.GetPixel(300, 50); Write-Output "300,50: $($p.R), $($p.G), $($p.B)"
$p = $bmp.GetPixel(400, 50); Write-Output "400,50: $($p.R), $($p.G), $($p.B)"
