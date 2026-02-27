# test_iot_setup.ps1 - Quick verification script for Windows PowerShell

$API_URL = "http://192.168.1.24:8000/api/v1"
$ACCOUNT = "4120239802"

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "  IoT Integration Test Suite" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check backend is running
Write-Host "[1/6] Testing backend connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_URL/docs" -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Backend is running!" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend not responding. Start with: uvicorn src.main:app --reload --host 0.0.0.0 --port 8000" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: Test device status
Write-Host "[2/6] Checking device status..." -ForegroundColor Yellow
$status = Invoke-WebRequest -Uri "$API_URL/iot/status/$ACCOUNT" -UseBasicParsing -ErrorAction SilentlyContinue
Write-Host $status.Content -ForegroundColor White
Write-Host ""

# Test 3: Get latest reading
Write-Host "[3/6] Getting latest reading..." -ForegroundColor Yellow
try {
    $latest = Invoke-WebRequest -Uri "$API_URL/iot/latest/$ACCOUNT" -UseBasicParsing
    Write-Host $latest.Content -ForegroundColor White
} catch {
    Write-Host "⚠️  No live data yet (device might be offline)" -ForegroundColor Yellow
}
Write-Host ""

# Test 4: Simulate a reading (test storage)
Write-Host "[4/6] Simulating idle appliance..." -ForegroundColor Yellow
$sim1 = Invoke-WebRequest -Uri "$API_URL/iot/simulate/$ACCOUNT?scenario=idle" -Method Post -UseBasicParsing
Write-Host $sim1.Content -ForegroundColor White
Write-Host ""

# Test 5: Simulate rice cooker
Write-Host "[5/6] Simulating rice cooker..." -ForegroundColor Yellow
$sim2 = Invoke-WebRequest -Uri "$API_URL/iot/simulate/$ACCOUNT?scenario=rice_cooker" -Method Post -UseBasicParsing
Write-Host $sim2.Content -ForegroundColor White
Write-Host ""

# Test 6: Get stored history from database
Write-Host "[6/6] Retrieving stored readings from database..." -ForegroundColor Yellow
$history = Invoke-WebRequest -Uri "$API_URL/iot/stored-history/$ACCOUNT?hours=24&limit=10" -UseBasicParsing -ErrorAction SilentlyContinue
if ($history) {
    Write-Host $history.Content -ForegroundColor White
} else {
    Write-Host "⚠️  No stored readings yet" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "  Tests Complete!" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Open Mobile App → Live Meter tab to see data" -ForegroundColor Cyan
Write-Host "📊 Access API documentation at: http://192.168.1.24:8000/api/docs" -ForegroundColor Cyan
Write-Host "💡 When real ESP32 is powered on, data will auto-populate" -ForegroundColor Cyan
