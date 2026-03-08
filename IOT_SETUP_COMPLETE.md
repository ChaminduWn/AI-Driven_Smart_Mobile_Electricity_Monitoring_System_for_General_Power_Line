# IoT Integration: ESP32 to Mobile App - Complete Setup

## Current Status ✅

Your system is now fully set up to:
1. ✅ Receive live readings from ESP32 via MQTT (HiveMQ)
2. ✅ Display all meter data in mobile app via WebSocket
3. ✅ Store readings in PostgreSQL database for analysis
4. ✅ Provide historical data endpoints for later analysis

---

## Data Flow

```
ESP32 (PZEM-004T)
    ↓ MQTT
HiveMQ Broker (broker.hivemq.com:1883)
    ↓
Backend IoT Service (memory cache + database)
    ↓ WebSocket
Mobile App (Live Display)
    ↓ REST API
Historical Analysis
```

---

## ESP32 Outputs Currently Publishing

### Account: 4120239802
**Topics:**
- `energyiq/4120239802/live` - Main readings (every 5 seconds)
- `energyiq/4120239802/appliance` - Appliance change events
- `energyiq/4120239802/status` - Device status

### Data Structure (from `/live` topic)

```json
{
  "account_number": "4120239802",
  "voltage": 230.8,           // V (Volts)
  "current": 0.45,            // A (Amperes)
  "power": 98.5,              // W (Watts)
  "energy": 5.234,            // kWh (total accumulated)
  "frequency": 50.0,          // Hz
  "power_factor": 0.92,       // 0.0-1.0
  "session_kwh": 0.005,       // kWh since startup
  "session_cost_rs": 0.08,    // Rupees
  "detected_appliance": "Fan (High)",
  "anomaly": "",              // Empty if normal, or "LOW_VOLTAGE:210", etc.
  "read_count": 156,          // Number of readings since boot
  "uptime_ms": 780000,        // Device uptime in milliseconds
  "wifi_rssi": -65            // WiFi signal (-30 = excellent, -90 = bad)
}
```

---

## What the Mobile App Displays ✅

### Live Tab
- **Power Display** - Large animated gauge showing current watts
- **Appliance Badge** - Detected appliance with emoji icon
- **Electrical Measurements** - Voltage, Current, Power Factor gauges
- **Readings** - Frequency, Session kWh, Estimated Cost
- **Power Chart** - Last 5 minutes of power consumption history
- **Anomalies** - Alerts for voltage issues or low power factor

### Stats Tab
- **Session Summary** - Total energy used, cost, peak/average power
- **Grid Quality** - Voltage/Frequency/PF compliance with CEB standards
- **WiFi Signal** - Device connection strength

### Events Tab
- **Appliance Change Log** - History of detected appliance transitions
- **Last 8 events** - When appliances turned on/off with power

---

## Database Tables Now Available

### 1. **live_meter_readings** (NEW)
Stores every meter reading for historical analysis.

```sql
CREATE TABLE live_meter_readings (
  id INTEGER PRIMARY KEY,
  account_number VARCHAR(100),
  voltage FLOAT,
  current FLOAT,
  power FLOAT,
  energy FLOAT,
  frequency FLOAT,
  power_factor FLOAT,
  session_kwh FLOAT,
  session_cost_rs FLOAT,
  detected_appliance VARCHAR(255),
  anomaly VARCHAR(255),
  read_count INTEGER,
  uptime_ms INTEGER,
  wifi_rssi INTEGER,
  raw_data JSON,
  recorded_at TIMESTAMP,
  created_at TIMESTAMP,
  INDEX (account_number, recorded_at)
);
```

### 2. **appliance_events** (NEW)
Stores every appliance change event for pattern analysis.

```sql
CREATE TABLE appliance_events (
  id INTEGER PRIMARY KEY,
  account_number VARCHAR(100),
  event_type VARCHAR(50),
  from_appliance VARCHAR(255),
  to_appliance VARCHAR(255),
  watts FLOAT,
  event_time TIMESTAMP,
  created_at TIMESTAMP,
  INDEX (account_number, event_time)
);
```

---

## API Endpoints for Data Storage & Retrieval

### Store a Reading
```
POST http://192.168.1.24:8000/api/v1/iot/store/4120239802
Content-Type: application/json

{
  "voltage": 230.8,
  "current": 0.45,
  "power": 98.5,
  ... (other fields)
}
```

### Store an Appliance Event
```
POST http://192.168.1.24:8000/api/v1/iot/store-event/4120239802?from_appliance=Fan&to_appliance=Off&watts=0
```

### Get Live Readings (Last 5 minutes, from memory)
```
GET http://192.168.1.24:8000/api/v1/iot/history/4120239802?minutes=5
```

### Get Stored Readings (Last 24 hours, from database)
```
GET http://192.168.1.24:8000/api/v1/iot/stored-history/4120239802?hours=24&limit=1000
```

Response:
```json
{
  "account_number": "4120239802",
  "hours": 24,
  "count": 288,
  "readings": [
    {
      "id": 1,
      "voltage": 230.8,
      "power": 98.5,
      ...
      "recorded_at": "2026-02-25T01:45:30+00:00"
    }, ...
  ]
}
```

### Get Appliance Events
```
GET http://192.168.1.24:8000/api/v1/iot/events/4120239802?hours=24&limit=100
```

### Get Device Status
```
GET http://192.168.1.24:8000/api/v1/iot/status/4120239802

{
  "account_number": "4120239802",
  "device_online": true,
  "last_seen_seconds_ago": 3,
  "latest_power": 98.5,
  "detected_appliance": "Fan (High)"
}
```

---

## How to Test

### 1. **Test with Simulation** (no ESP32 needed)
```bash
# Test different scenarios
curl "http://192.168.1.24:8000/api/v1/iot/simulate/4120239802?scenario=idle"
curl "http://192.168.1.24:8000/api/v1/iot/simulate/4120239802?scenario=rice_cooker"
curl "http://192.168.1.24:8000/api/v1/iot/simulate/4120239802?scenario=ac"
```

Available scenarios:
- `idle` - Standby (12W)
- `fan` - Fan at high speed (72W)
- `rice_cooker` - Cooking (876W)
- `ac` - AC running (1380W)
- `tv` - Television (145W)
- `washing_machine` - Washing cycle (850W)
- `spike` - Heavy load (1950W)

### 2. **Test with Real ESP32**
- Power on your ESP32 with 5V adapter
- Ensure WiFi is connected: SLT_FIBER_X4YcU
- Device will auto-publish to HiveMQ
- Check backend logs for "Device online"

### 3. **Verify in Mobile App**
- Open Live Meter screen
- Should show "LIVE" status with green dot
- Readings update every 5 seconds
- Appliance detection shows detected load

---

## Current IoT Service Configuration

**Backend:**
- Protocol: MQTT
- Broker: broker.hivemq.com:1883 (HiveMQ free public)
- Topics: energyiq/{account}/live, appliance, status, cmd
- Storage: In-memory cache + PostgreSQL database

**Mobile App:**
- Protocol: WebSocket
- Server: http://192.168.1.24:8000/api/v1/iot/ws/{account}
- Display: Real-time gauges and charts
- History: Last 5 minutes in memory

**Database:**
- All readings auto-stored for analysis
- Tables created automatically on backend startup
- Can query historical data for trends

---

## Next Steps for Analysis

### Data Available for Analysis
1. **Appliance Detection** - What was running when
2. **Power Trends** - Peak hours, consumption patterns
3. **Cost Estimation** - Session costs on CEB tariff structure
4. **Grid Quality** - Voltage/frequency stability
5. **Device Health** - WiFi signal, uptime metrics

### Create Analysis Endpoints
You can now:
- Calculate daily/weekly consumption from `live_meter_readings`
- Track appliance usage patterns from `appliance_events`
- Generate detailed consumption reports
- Integrate with bill analysis for accuracy validation

---

## Troubleshooting

### "No data for account" Error
1. ✅ Is ESP32 powered on? (Check servo power at 5V)
2. ✅ Is WiFi connected? (Check serial output)
3. ✅ Correct account number? (4120239802 in both ESP32 & app)
4. ✅ HiveMQ broker reachable? (Check internet connection)
5. Use simulate endpoint to test

### Readings not storing in database
- Check: Does `live_meter_readings` table exist?
  ```sql
  SELECT * FROM live_meter_readings LIMIT 1;
  ```
- If empty, explicitly call POST /api/v1/iot/store endpoint

### WebSocket connection issues
- Check: Backend running with `--host 0.0.0.0`
- Check: Firewall allows port 8000
- Check: Mobile/web browser can reach `http://192.168.1.24:8000/api/docs`

---

## Summary

| Component | Status | Details |
|-----------|--------|---------|
| ESP32 Hardware | ✅ Ready | PZEM-004T on pins 17,16 |
| MQTT Publishing | ✅ Live | HiveMQ broker energyiq/# |
| Mobile WebSocket | ✅ Live | Real-time gauge display |
| Database Storage | ✅ New | LiveMeterReading + ApplianceEvent tables |
| API Endpoints | ✅ New | Store/retrieve readings & events |
| Appliance Detection | ✅ Working | Wattage-based with emoji icons |
| Cost Calculation | ✅ Working | CEB tariff structure integrated |
| Analysis Ready | ✅ Ready | Historical data for trends |

All systems operational! Your IoT meter is ready for energy analysis.
