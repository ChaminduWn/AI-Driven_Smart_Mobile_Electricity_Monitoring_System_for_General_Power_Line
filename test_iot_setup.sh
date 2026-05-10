#!/bin/bash
# test_iot_setup.sh - Quick verification script

API_URL="http://192.168.1.24:8000/api/v1"
ACCOUNT="4120239802"

echo "==================================="
echo "  IoT Integration Test Suite"
echo "==================================="
echo ""

# Test 1: Check backend is running
echo "[1/6] Testing backend connectivity..."
if curl -s "$API_URL/docs" > /dev/null; then
    echo "✅ Backend is running!"
else
    echo "❌ Backend not responding. Start with: uvicorn src.main:app --reload --host 0.0.0.0 --port 8000"
    exit 1
fi
echo ""

# Test 2: Test device status
echo "[2/6] Checking device status..."
curl -s "$API_URL/iot/status/$ACCOUNT" | python3 -m json.tool
echo ""

# Test 3: Get latest reading
echo "[3/6] Getting latest reading..."
curl -s "$API_URL/iot/latest/$ACCOUNT" 2>/dev/null || echo "⚠️  No live data yet (device might be offline)"
echo ""

# Test 4: Simulate a reading (test storage)
echo "[4/6] Simulating idle appliance..."
curl -s -X POST "$API_URL/iot/simulate/$ACCOUNT?scenario=idle" | python3 -m json.tool
echo ""

# Test 5: Simulate rice cooker
echo "[5/6] Simulating rice cooker..."
curl -s -X POST "$API_URL/iot/simulate/$ACCOUNT?scenario=rice_cooker" | python3 -m json.tool
echo ""

# Test 6: Get stored history from database
echo "[6/6] Retrieving stored readings from database..."
curl -s "$API_URL/iot/stored-history/$ACCOUNT?hours=24&limit=10" | python3 -m json.tool
echo ""

echo "==================================="
echo "  Tests Complete!"
echo "==================================="
echo ""
echo "📱 Open Mobile App → Live Meter tab to see data"
echo "📊 Access API documentation at: http://192.168.1.24:8000/api/docs"
echo "💡 When real ESP32 is powered on, data will auto-populate"
