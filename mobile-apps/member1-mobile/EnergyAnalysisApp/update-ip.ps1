# update-ip.ps1
# This script automatically detects your current IP address and updates your .env file
# It's useful when moving between networks (e.g. Home to Office)

$envFile = join-path $PSScriptRoot ".env"

if (-not (test-path $envFile)) {
    write-host "Error: .env file not found at $envFile" -foregroundcolor red
    exit 1
}

# Get current WiFi/Ethernet IPv4 address
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -match "Wi-Fi|Ethernet" -and $_.IPAddress -notmatch "^169\." -and $_.IPAddress -notmatch "^127\." } | Select-Object -ExpandProperty IPAddress -First 1)

if (-not $ip) {
    write-host "Warning: Could not detect a valid network IP. Still using localhost for fallback." -foregroundcolor yellow
    # Fallback to localhost if no network IP found
    $ip = "127.0.0.1"
}

write-host "Updating .env with current IP: $ip" -foregroundcolor cyan

$content = get-content $envFile
$newContent = @()

foreach ($line in $content) {
    if ($line -match "^EXPO_PUBLIC_API_URL=") {
        $newContent += "EXPO_PUBLIC_API_URL=http://$($ip):8000/api/v1"
    }
    elseif ($line -match "^EXPO_PUBLIC_WS_URL=") {
        $newContent += "EXPO_PUBLIC_WS_URL=ws://$($ip):8000"
    }
    elseif ($line -match "^# Using your current machine IP:") {
        $newContent += "# Using your current machine IP: $ip"
    }
    else {
        $newContent += $line
    }
}

$newContent | set-content $envFile -encoding utf8
write-host "Successfully updated $envFile" -foregroundcolor green
