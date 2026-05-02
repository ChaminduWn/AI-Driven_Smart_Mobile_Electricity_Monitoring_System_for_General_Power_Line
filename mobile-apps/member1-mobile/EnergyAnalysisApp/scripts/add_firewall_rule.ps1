$RuleName = "Allow EnergyIQ API"
$Port = 8000

# Check if rule already exists
$existingRule = Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue

if ($existingRule) {
    Write-Host "Firewall rule '$RuleName' already exists." -ForegroundColor Cyan
} else {
    Write-Host "Creating firewall rule '$RuleName' for port $Port..." -ForegroundColor Yellow
    New-NetFirewallRule -DisplayName $RuleName -Direction Inbound -LocalPort $Port -Protocol TCP -Action Allow
    Write-Host "Successfully created firewall rule." -ForegroundColor Green
}
