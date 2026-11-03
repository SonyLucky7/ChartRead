$proc = [wmiclass]"Win32_Process"
$res = $proc.Create("d:\rea Projects\ChartRead\runtime\ChartRead.exe --remote-debugging-port=9222 --enable-logging")
Write-Host "Process created with return code: $($res.ReturnValue), ProcessId: $($res.ProcessId)"
