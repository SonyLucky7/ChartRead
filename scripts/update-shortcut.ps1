$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut("C:\Users\hac\Desktop\ChartRead.lnk")
$sc.TargetPath = "D:\rea Projects\ChartRead\runtime\ChartRead.exe"
$sc.WorkingDirectory = "D:\rea Projects\ChartRead\runtime"
$sc.IconLocation = "D:\rea Projects\ChartRead\resources\icons\logo.ico,0"
$sc.Save()
Write-Host "Desktop shortcut icon set to logo.ico!"
