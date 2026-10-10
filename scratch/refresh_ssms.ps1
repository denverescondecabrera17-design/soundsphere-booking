Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName Microsoft.VisualBasic

$proc = Get-Process -Name Ssms -ErrorAction SilentlyContinue | Select-Object -First 1

if ($proc) {
    Write-Output "Found SSMS process: $($proc.Id)"
    $activated = [Microsoft.VisualBasic.Interaction]::AppActivate($proc.Id)
    Start-Sleep -Milliseconds 600
    
    # Send Ctrl + Shift + R to refresh IntelliSense Local Cache
    [System.Windows.Forms.SendKeys]::SendWait("^+{R}")
    Start-Sleep -Milliseconds 500
    [System.Windows.Forms.SendKeys]::SendWait("^+{R}")
    
    Write-Output "IntelliSense Refresh command (Ctrl+Shift+R) sent successfully!"
} else {
    Write-Output "SSMS process not running."
}
