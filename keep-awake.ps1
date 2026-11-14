# Formino Windows-only temporary display/sleep inhibition.
# The setting belongs to this helper process; it is released when the helper exits.
param([Parameter(Mandatory=$true)][int]$ServerPID)
$signature = @'
using System;
using System.Runtime.InteropServices;
public static class ForminoPowerManagement {
    [DllImport("kernel32.dll")]
    public static extern uint SetThreadExecutionState(uint esFlags);
}
'@
try {
    Add-Type -TypeDefinition $signature -ErrorAction Stop | Out-Null
    $ES_CONTINUOUS = [uint32]2147483648
    $ES_SYSTEM_REQUIRED = [uint32]0x00000001
    $ES_DISPLAY_REQUIRED = [uint32]0x00000002
    [void][ForminoPowerManagement]::SetThreadExecutionState($ES_CONTINUOUS -bor $ES_SYSTEM_REQUIRED -bor $ES_DISPLAY_REQUIRED)
    while ($true) {
        try {
            $p = [System.Diagnostics.Process]::GetProcessById($ServerPID)
            if ($p.HasExited) { break }
        } catch { break }
        Start-Sleep -Seconds 8
    }
} finally {
    try { [void][ForminoPowerManagement]::SetThreadExecutionState([uint32]2147483648) } catch {}
}
